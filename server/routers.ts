import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== USER PROFILE =====
  user: router({
    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) return null;
        const videoCount = await db.getVideoCount(input.userId);
        return {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          totalPoints: user.totalPoints,
          level: user.level,
          nextLevelThreshold: db.getNextLevelThreshold(user.level),
          videoCount,
          createdAt: user.createdAt,
        };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(50).optional(),
        bio: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    uploadAvatar: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `avatars/${ctx.user.id}-${nanoid()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        await db.updateUserProfile(ctx.user.id, { avatarUrl: url });
        return { url };
      }),
  }),

  // ===== VIDEOS =====
  video: router({
    latest: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ input }) => {
        const { limit = 20, offset = 0 } = input ?? {};
        return db.getLatestVideos(limit, offset);
      }),

    trending: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ input }) => {
        const { limit = 20, offset = 0 } = input ?? {};
        return db.getTrendingVideos(limit, offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoById(input.id);
      }),

    getUserVideos: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getUserVideos(input.userId, input.limit, input.offset);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.searchVideos(input.query);
      }),

    upload: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        base64: z.string(),
        mimeType: z.string(),
        thumbnailBase64: z.string().optional(),
        hashtags: z.array(z.string()).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ext = input.mimeType.split("/")[1] || "mp4";
        const videoKey = `videos/${ctx.user.id}-${nanoid()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url: videoUrl } = await storagePut(videoKey, buffer, input.mimeType);

        let thumbnailUrl: string | undefined;
        if (input.thumbnailBase64) {
          const thumbKey = `thumbnails/${ctx.user.id}-${nanoid()}.jpg`;
          const thumbBuffer = Buffer.from(input.thumbnailBase64, "base64");
          const { url } = await storagePut(thumbKey, thumbBuffer, "image/jpeg");
          thumbnailUrl = url;
        }

        const videoId = await db.createVideo({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          videoUrl,
          videoKey,
          thumbnailUrl,
        });

        // Add hashtags
        if (input.hashtags && input.hashtags.length > 0) {
          await db.addHashtagsToVideo(videoId, input.hashtags);
        }

        // Award points for uploading a video
        await db.addPoints(ctx.user.id, 10, "upload", "نشر فيديو جديد");

        return { videoId, videoUrl };
      }),

    delete: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteVideo(input.videoId, ctx.user.id);
        return { success: true };
      }),

    recordView: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.recordView(input.videoId, ctx.user?.id ?? undefined);
        if (ctx.user) {
          await db.addPoints(ctx.user.id, 1, "view", "مشاهدة فيديو");
        }
        return { success: true };
      }),
  }),

  // ===== LIKES =====
  like: router({
    toggle: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.toggleLike(ctx.user.id, input.videoId);
        if (liked) {
          await db.addPoints(ctx.user.id, 2, "like", "إعجاب بفيديو");
          // Send notification to video owner
          const video = await db.getVideoById(input.videoId);
          if (video) {
            await db.createNotification({
              userId: video.userId,
              fromUserId: ctx.user.id,
              type: "like",
              videoId: input.videoId,
              message: `أعجب ${ctx.user.name || "مستخدم"} بفيديوهك "${video.title}"`,
            });
          }
        }
        return { liked };
      }),

    userLikes: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserLikes(ctx.user.id);
    }),
  }),

  // ===== COMMENTS =====
  comment: router({
    list: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoComments(input.videoId);
      }),

    add: protectedProcedure
      .input(z.object({ videoId: z.number(), content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.addComment(ctx.user.id, input.videoId, input.content);
        await db.addPoints(ctx.user.id, 3, "comment", "تعليق على فيديو");
        // Send notification to video owner
        const video = await db.getVideoById(input.videoId);
        if (video) {
          await db.createNotification({
            userId: video.userId,
            fromUserId: ctx.user.id,
            type: "comment",
            videoId: input.videoId,
            message: `علّق ${ctx.user.name || "مستخدم"} على فيديوهك "${video.title}"`,
          });
        }
        return { commentId };
      }),

    delete: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteComment(input.commentId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== POINTS & LEVELS =====
  points: router({
    myPoints: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return {
        totalPoints: user?.totalPoints ?? 0,
        level: user?.level ?? 1,
        nextLevelThreshold: db.getNextLevelThreshold(user?.level ?? 1),
      };
    }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserPointsHistory(ctx.user.id, input?.limit ?? 20);
      }),
  }),

  // ===== NOTIFICATIONS =====
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserNotifications(ctx.user.id);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markNotificationsRead(ctx.user.id);
      return { success: true };
    }),

    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markOneNotificationRead(input.notificationId, ctx.user.id);
        return { success: true };
      }),

    preferences: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationPreferences(ctx.user.id);
    }),

    updatePreferences: protectedProcedure
      .input(z.object({
        likesEnabled: z.boolean().optional(),
        commentsEnabled: z.boolean().optional(),
        followsEnabled: z.boolean().optional(),
        challengesEnabled: z.boolean().optional(),
        competitionsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const preferences = await db.updateNotificationPreferences(ctx.user.id, input);
        return { success: true, preferences };
      }),
  }),

  // ===== FOLLOWS =====
  follow: router({
    toggle: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const followed = await db.toggleFollow(ctx.user.id, input.userId);
        if (followed) {
          await db.addPoints(ctx.user.id, 2, "follow", "متابعة مستخدم");
          await db.createNotification({
            userId: input.userId,
            fromUserId: ctx.user.id,
            type: "follow",
            message: `بدأ ${ctx.user.name || "مستخدم"} بمتابعتك`,
          });
        }
        return { followed };
      }),

    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isFollowing(ctx.user.id, input.userId);
      }),

    stats: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const [followers, following] = await Promise.all([
          db.getFollowerCount(input.userId),
          db.getFollowingCount(input.userId),
        ]);
        return { followers, following };
      }),

    feed: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        const { limit = 20, offset = 0 } = input ?? {};
        return db.getFollowingFeed(ctx.user.id, limit, offset);
      }),

    followers: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowers(input.userId);
      }),

    following: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowing(input.userId);
      }),
  }),

  // ===== ADMIN =====
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return db.getAdminStats();
    }),

    users: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.getAllUsers(input?.limit ?? 50, input?.offset ?? 0);
      }),

    videos: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.getAllVideos(input?.limit ?? 50, input?.offset ?? 0);
      }),

    comments: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.getAllComments(input?.limit ?? 50, input?.offset ?? 0);
      }),

    deleteVideo: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.adminDeleteVideo(input.videoId);
        return { success: true };
      }),

    deleteComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.adminDeleteComment(input.commentId);
        return { success: true };
      }),

    updateUserRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.adminUpdateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // ===== SPIN WHEEL =====
  spin: router({
    canSpin: protectedProcedure.query(async ({ ctx }) => {
      return db.canSpinToday(ctx.user.id);
    }),

    doSpin: protectedProcedure.mutation(async ({ ctx }) => {
      const canSpin = await db.canSpinToday(ctx.user.id);
      if (!canSpin) {
        return { success: false, message: "لقد استخدمت عجلة الحظ اليوم بالفعل! عد غداً", pointsWon: 0 };
      }
      const prizes = [5, 10, 15, 20, 25, 30, 50, 100];
      const weights = [30, 25, 15, 10, 8, 6, 4, 2];
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      let pointsWon = prizes[0];
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          pointsWon = prizes[i];
          break;
        }
      }
      await db.recordSpin(ctx.user.id, pointsWon);
      return { success: true, pointsWon, message: `مبروك! فزت بـ ${pointsWon} نقطة!` };
    }),

    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getSpinHistory(ctx.user.id);
    }),
  }),

  // ===== MESSAGES =====
  message: router({
    conversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    unreadTotal: protectedProcedure.query(async ({ ctx }) => {
      return db.getTotalUnreadMessages(ctx.user.id);
    }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        await db.markConversationRead(input.conversationId, ctx.user.id);
        return db.getConversationMessages(input.conversationId);
      }),

    send: protectedProcedure
      .input(z.object({ toUserId: z.number(), content: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const convo = await db.getOrCreateConversation(ctx.user.id, input.toUserId);
        const msgId = await db.sendMessage(convo.id, ctx.user.id, input.content);
        await db.createNotification({
          userId: input.toUserId,
          fromUserId: ctx.user.id,
          type: "comment",
          message: `أرسل لك ${ctx.user.name || "مستخدم"} رسالة خاصة`,
        });
        return { messageId: msgId, conversationId: convo.id };
      }),

    startConversation: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.userId) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك مراسلة نفسك" });
        const convo = await db.getOrCreateConversation(ctx.user.id, input.userId);
        return { conversationId: convo.id };
      }),
  }),

  // ===== HASHTAGS =====
  hashtag: router({
    trending: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return db.getTrendingHashtags(input?.limit ?? 20);
      }),

    videos: publicProcedure
      .input(z.object({ name: z.string(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getVideosByHashtag(input.name, input.limit, input.offset);
      }),

    forVideo: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoHashtags(input.videoId);
      }),
  }),

  // ===== CHALLENGES =====
  challenge: router({
    active: publicProcedure.query(async () => {
      return db.getActiveChallenges();
    }),

    all: publicProcedure.query(async () => {
      return db.getAllChallenges();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getChallengeById(input.id);
      }),

    entries: publicProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ input }) => {
        return db.getChallengeEntries(input.challengeId);
      }),

    submit: protectedProcedure
      .input(z.object({ challengeId: z.number(), videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.submitChallengeEntry(input.challengeId, ctx.user.id, input.videoId);
        await db.addPoints(ctx.user.id, 15, "challenge_entry", "المشاركة في تحدي");
        return { success: true };
      }),

    vote: protectedProcedure
      .input(z.object({ entryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const voted = await db.voteChallengeEntry(input.entryId, ctx.user.id);
        return { voted };
      }),

    hasVoted: protectedProcedure
      .input(z.object({ entryId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.hasVotedEntry(ctx.user.id, input.entryId);
      }),

    // Admin: create challenge
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().min(1),
        emoji: z.string().max(10).optional(),
        startDate: z.string(),
        endDate: z.string(),
        prizePoints: z.number().min(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const id = await db.createChallenge({
          title: input.title,
          description: input.description,
          emoji: input.emoji,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          prizePoints: input.prizePoints,
        });
        return { id };
      }),

    // Admin: update status
    updateStatus: protectedProcedure
      .input(z.object({ challengeId: z.number(), status: z.enum(["active", "voting", "completed"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.updateChallengeStatus(input.challengeId, input.status);
        return { success: true };
      }),

    // Admin: declare winner
    declareWinner: protectedProcedure
      .input(z.object({ entryId: z.number(), challengeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.declareWinner(input.entryId, input.challengeId);
        return { success: true };
      }),
  }),

  // ===== BADGES & LEADERBOARD =====
  badge: router({
    userBadges: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserBadges(input.userId);
      }),
  }),

  leaderboard: router({
    top: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return db.getLeaderboard(input?.limit ?? 20);
      }),
  }),
  favorite: router({
    add: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.addFavorite(ctx.user.id, input.videoId);
        return { success: !!result };
      }),
    remove: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.removeFavorite(ctx.user.id, input.videoId);
        return { success: !!result };
      }),
    isFavorite: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isFavorite(ctx.user.id, input.videoId);
      }),
    userFavorites: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getUserFavorites(ctx.user.id, input.limit, input.offset);
      }),
    count: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getFavoriteCount(input.videoId);
      }),
  }),

  // ===== COMMENT REPLIES =====
  reply: router({
    add: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        content: z.string().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addCommentReply(input.commentId, ctx.user.id, input.content);
        return { success: true };
      }),
    
    list: publicProcedure
      .input(z.object({ commentId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommentReplies(input.commentId);
      }),
    
    delete: protectedProcedure
      .input(z.object({ replyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCommentReply(input.replyId);
        return { success: true };
      }),
  }),

  // ===== REFERRALS =====
  referral: router({
    getCode: protectedProcedure
      .query(async ({ ctx }) => {
        let referral = await db.getReferralCode(ctx.user.id);
        if (!referral) {
          const code = `REF${nanoid(8).toUpperCase()}`;
          await db.createReferralCode(ctx.user.id, code);
          referral = await db.getReferralCode(ctx.user.id);
        }
        return referral;
      }),
    
    redeem: protectedProcedure
      .input(z.object({ referralCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.redeemReferralCode(input.referralCode, ctx.user.id);
      }),
    
    getStats: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserReferralStats(input.userId);
      }),
  }),

  // ===== REWARDS =====
  reward: router({
    getRewards: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserRewards(ctx.user.id);
      }),
    
    spend: protectedProcedure
      .input(z.object({
        points: z.number().min(1),
        rewardType: z.enum(["badge", "boost", "feature"]),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.spendRewardPoints(ctx.user.id, input.points, input.rewardType, input.description);
      }),
  }),

  // ===== VIDEO BOOSTS =====
  boost: router({
    create: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        pointsSpent: z.number().min(10),
        boostLevel: z.number().min(1).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.boostVideo(input.videoId, ctx.user.id, input.pointsSpent, input.boostLevel);
      }),
    
    getStatus: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoBoostedStatus(input.videoId);
      }),
  }),

  // ===== MEDIA UPLOADS =====
  media: router({
    upload: protectedProcedure
      .input(z.object({
        base64: z.string().min(1),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const ext = input.mimeType.split("/")[1]?.replace("quicktime", "mov") || "bin";
        const key = `social-media/${ctx.user.id}-${nanoid()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url, key, mimeType: input.mimeType };
      }),
  }),

  // ===== STORIES =====
  story: router({
    publish: protectedProcedure
      .input(z.object({
        mediaType: z.enum(["image", "video"]),
        mediaUrl: z.string().url(),
        mediaKey: z.string().optional(),
        caption: z.string().max(280).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const storyId = await db.createStory({
          ...input,
          userId: ctx.user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        await db.addPoints(ctx.user.id, 5, "story", "نشر قصة جديدة");
        return { success: true, storyId };
      }),
    active: publicProcedure.query(async () => {
      return db.getActiveStories();
    }),
    view: publicProcedure
      .input(z.object({ storyId: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementStoryView(input.storyId);
        return { success: true };
      }),
  }),

  // ===== MULTI-BLOCK POSTS =====
  post: router({
    publish: protectedProcedure
      .input(z.object({
        visibility: z.enum(["public", "followers"]).default("public"),
        blocks: z.array(z.discriminatedUnion("blockType", [
          z.object({ blockType: z.literal("text"), textContent: z.string().min(1).max(1000) }),
          z.object({ blockType: z.literal("image"), mediaUrl: z.string().url(), mediaKey: z.string().optional(), thumbnailUrl: z.string().url().optional() }),
          z.object({ blockType: z.literal("video"), mediaUrl: z.string().url(), mediaKey: z.string().optional(), thumbnailUrl: z.string().url().optional() }),
        ])).min(1).max(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const blocks = input.blocks.map((block, index) => {
          const shouldBeText = index % 2 === 0;
          if (shouldBeText && block.blockType !== "text") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "ترتيب المنشور يجب أن يكون: نص ثم صورة أو فيديو ثم نص" });
          }
          if (!shouldBeText && block.blockType === "text") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "أضف صورة أو فيديو بين كل مقطعين نصيين" });
          }
          if (block.blockType === "text") {
            const lineCount = block.textContent.split(/\r?\n/).length;
            if (lineCount > 5) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "كل مقطع نصي يجب ألا يتجاوز خمسة أسطر" });
            }
          }
          return { ...block, blockOrder: index };
        });
        const postId = await db.createPostWithBlocks(ctx.user.id, input.visibility, blocks);
        await db.addPoints(ctx.user.id, 10, "post", "نشر منشور متعدد المقاطع");
        return { success: true, postId };
      }),
    latest: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
      .query(async ({ input }) => {
        return db.getPublicPosts(input.limit, input.offset);
      }),
    getById: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return db.getPostWithBlocks(input.postId);
      }),
    byUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getPostsByUser(input.userId);
      }),
    toggleLike: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.togglePostLike(ctx.user.id, input.postId);
        return { liked };
      }),
    isLiked: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return false;
        return db.isPostLiked(ctx.user.id, input.postId);
      }),
    addComment: protectedProcedure
      .input(z.object({ postId: z.number(), content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.addPostComment(ctx.user.id, input.postId, input.content);
        return { success: true, commentId };
      }),
    comments: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return db.getPostComments(input.postId);
      }),
  }),

  // ===== COMMUNITY TRENDS =====
  communityTrend: router({
    active: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
      .query(async ({ input }) => db.getActiveCommunityTrends(input?.limit ?? 20)),
    getById: publicProcedure
      .input(z.object({ trendId: z.number() }))
      .query(async ({ input }) => db.getCommunityTrendById(input.trendId)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(180),
        description: z.string().max(1000).optional(),
        prompt: z.string().min(3).max(280),
        sourceVideoId: z.number().optional(),
        durationDays: z.number().min(1).max(30).default(7),
      }))
      .mutation(async ({ ctx, input }) => {
        const slug = `${input.title.toLowerCase().replace(/[^\\u0600-\\u06FFa-z0-9]+/g, "-").slice(0, 160)}-${nanoid(6)}`;
        const trendId = await db.createCommunityTrend({
          creatorId: ctx.user.id,
          title: input.title,
          slug,
          description: input.description,
          prompt: input.prompt,
          sourceVideoId: input.sourceVideoId,
          expiresAt: new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000),
        });
        return { success: true, trendId, slug };
      }),
    join: protectedProcedure
      .input(z.object({
        trendId: z.number(),
        videoId: z.number().optional(),
        postId: z.number().optional(),
        caption: z.string().max(280).optional(),
      }).refine(value => Boolean(value.videoId) !== Boolean(value.postId), { message: "اختر فيديو أو منشورًا واحدًا للمشاركة" }))
      .mutation(async ({ ctx, input }) => {
        const entryId = await db.joinCommunityTrend({ ...input, userId: ctx.user.id });
        await db.addPoints(ctx.user.id, 8, "community_trend", "المشاركة في ترند جماعي");
        return { success: true, entryId };
      }),
    vote: protectedProcedure
      .input(z.object({ entryId: z.number() }))
      .mutation(async ({ input }) => {
        await db.voteCommunityTrendEntry(input.entryId);
        return { success: true };
      }),
  }),

  // ===== LOCAL CHALLENGES =====
  localChallenge: router({
    active: publicProcedure
      .input(z.object({ scope: z.enum(["global", "city", "community"]).optional(), locationName: z.string().max(160).optional(), communityName: z.string().max(160).optional() }).optional())
      .query(async ({ input }) => db.getLocalChallenges(input?.scope, input?.locationName, input?.communityName)),
    getById: publicProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ input }) => db.getLocalChallengeById(input.challengeId)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(180),
        description: z.string().max(1000).optional(),
        scope: z.enum(["global", "city", "community"]),
        locationName: z.string().max(160).optional(),
        communityName: z.string().max(160).optional(),
        rewardPoints: z.number().min(10).max(10000).default(100),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
      }))
      .mutation(async ({ input }) => {
        if (input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "تاريخ نهاية التحدي يجب أن يكون بعد بدايته" });
        const challengeId = await db.createLocalChallenge(input);
        return { success: true, challengeId };
      }),
    join: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
        videoId: z.number().optional(),
        postId: z.number().optional(),
        caption: z.string().max(280).optional(),
      }).refine(value => Boolean(value.videoId) !== Boolean(value.postId), { message: "اختر فيديو أو منشورًا واحدًا للمشاركة" }))
      .mutation(async ({ ctx, input }) => {
        const entryId = await db.joinLocalChallenge({ ...input, userId: ctx.user.id });
        await db.addPoints(ctx.user.id, 8, "local_challenge", "المشاركة في تحدٍ محلي");
        return { success: true, entryId };
      }),
    vote: protectedProcedure
      .input(z.object({ entryId: z.number() }))
      .mutation(async ({ input }) => {
        await db.voteLocalChallengeEntry(input.entryId);
        return { success: true };
      }),
  }),

  // ===== AI CONTENT ASSISTANT =====
  aiContent: router({
    suggest: protectedProcedure
      .input(z.object({
        idea: z.string().min(5).max(1200),
        tone: z.enum(["حماسي", "كوميدي", "تعليمي", "ملهم", "عفوي"]).default("عفوي"),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنت مساعد صناعة محتوى عربي لمنصة الترند. اقترح محتوى صادقًا وغير مضلل، واجعل العنوان قصيرًا والوصف عمليًا والهاشتاقات مرتبطة بالفكرة. أخرج JSON فقط." },
            { role: "user", content: `فكرة المستخدم: ${input.idea}\\nالنبرة المطلوبة: ${input.tone}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "content_suggestion",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "عنوان عربي جذاب لا يتجاوز 80 حرفًا" },
                  description: { type: "string", description: "وصف عربي واضح لا يتجاوز 400 حرف" },
                  hashtags: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
                  hook: { type: "string", description: "جملة افتتاحية قصيرة للفيديو أو المنشور" },
                },
                required: ["title", "description", "hashtags", "hook"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message?.content;
        if (typeof content !== "string") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء الاقتراح الآن" });
        let suggestion: { title: string; description: string; hashtags: string[]; hook: string };
        try {
          suggestion = JSON.parse(content);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر قراءة اقتراح المساعد" });
        }
        const suggestionId = await db.saveAiSuggestion({
          userId: ctx.user.id,
          inputText: input.idea,
          title: suggestion.title,
          description: suggestion.description,
          suggestedHashtags: JSON.stringify(suggestion.hashtags),
          tone: input.tone,
        });
        return { ...suggestion, suggestionId };
      }),
    recent: protectedProcedure.query(async ({ ctx }) => db.getRecentAiSuggestions(ctx.user.id)),
  }),

  // ===== CREATOR ANALYTICS =====
  creatorAnalytics: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getCreatorAnalytics(ctx.user.id);
    }),
  }),

  // ===== COMPETITIONS & SYMBOLIC PRIZES =====
  competition: router({
    list: publicProcedure
      .input(z.object({ status: z.enum(["upcoming", "active", "completed"]).optional() }).optional())
      .query(async ({ input }) => db.getCompetitions(input?.status)),
    recentWinners: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(12).default(6) }).optional())
      .query(async ({ input }) => db.getRecentCompetitionWinners(input?.limit ?? 6)),
    getById: publicProcedure
      .input(z.object({ competitionId: z.number() }))
      .query(async ({ input }) => db.getCompetitionById(input.competitionId)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(180),
        description: z.string().max(1000).optional(),
        category: z.string().min(2).max(80),
        prizeTitle: z.string().min(2).max(120),
        prizeIcon: z.string().min(2).max(40).default("trophy"),
        prizePoints: z.number().min(10).max(10000).default(250),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية مخصصة للإدارة" });
        if (input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" });
        const competitionId = await db.createCompetition(input);
        return { success: true, competitionId };
      }),
    join: protectedProcedure
      .input(z.object({
        competitionId: z.number(),
        videoId: z.number().optional(),
        postId: z.number().optional(),
        caption: z.string().max(280).optional(),
      }).refine(value => Boolean(value.videoId) !== Boolean(value.postId), { message: "اختر فيديو أو منشورًا واحدًا للمشاركة" }))
      .mutation(async ({ ctx, input }) => {
        const entryId = await db.joinCompetition({ ...input, userId: ctx.user.id });
        await db.addPoints(ctx.user.id, 10, "competition_entry", "المشاركة في مسابقة تفاعلية");
        return { success: true, entryId };
      }),
    vote: protectedProcedure
      .input(z.object({ entryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const voted = await db.voteCompetitionEntry(input.entryId, ctx.user.id);
        if (!voted) throw new TRPCError({ code: "CONFLICT", message: "صوّتَّ لهذه المشاركة من قبل" });
        return { success: true };
      }),
    announce: protectedProcedure
      .input(z.object({ competitionId: z.number(), message: z.string().min(3).max(500) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية مخصصة للإدارة" });
        const notifiedCount = await db.notifyCompetitionParticipants(input.competitionId, ctx.user.id, input.message);
        return { success: true, notifiedCount };
      }),
    declareWinner: protectedProcedure
      .input(z.object({ competitionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية مخصصة للإدارة" });
        return db.awardCompetitionWinner(input.competitionId, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
