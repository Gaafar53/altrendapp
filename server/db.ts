import { eq, desc, sql, like, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videos, likes, comments, videoViews, pointsHistory, spinHistory, notifications, follows, conversations, messages, hashtags, videoHashtags, challenges, challengeEntries, challengeVotes, userBadges, favorites, commentReplies, referrals, rewards, videoBoosts, posts, postBlocks, stories, postLikes, postComments, communityTrends, communityTrendEntries, localChallenges, localChallengeEntries, aiSuggestions, notificationPreferences, competitions, competitionEntries, competitionVotes, competitionRewards, creatorAnalyticsSnapshots } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: { name?: string; bio?: string; avatarUrl?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ===== VIDEO QUERIES =====

export async function createVideo(data: { userId: number; title: string; description?: string; videoUrl: string; videoKey: string; thumbnailUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videos).values(data);
  return result[0].insertId;
}

export async function getLatestVideos(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    description: videos.description,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
    viewCount: videos.viewCount,
    likeCount: videos.likeCount,
    commentCount: videos.commentCount,
    trendScore: videos.trendScore,
    createdAt: videos.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getTrendingVideos(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    description: videos.description,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
    viewCount: videos.viewCount,
    likeCount: videos.likeCount,
    commentCount: videos.commentCount,
    trendScore: videos.trendScore,
    createdAt: videos.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .orderBy(desc(videos.trendScore), desc(videos.viewCount))
    .limit(limit)
    .offset(offset);
}

export async function getVideoById(videoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    description: videos.description,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
    viewCount: videos.viewCount,
    likeCount: videos.likeCount,
    commentCount: videos.commentCount,
    trendScore: videos.trendScore,
    createdAt: videos.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .where(eq(videos.id, videoId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserVideos(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    description: videos.description,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
    viewCount: videos.viewCount,
    likeCount: videos.likeCount,
    commentCount: videos.commentCount,
    trendScore: videos.trendScore,
    createdAt: videos.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function searchVideos(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    description: videos.description,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
    viewCount: videos.viewCount,
    likeCount: videos.likeCount,
    commentCount: videos.commentCount,
    trendScore: videos.trendScore,
    createdAt: videos.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .where(like(videos.title, `%${query}%`))
    .orderBy(desc(videos.createdAt))
    .limit(limit);
}

export async function deleteVideo(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
}

// ===== LIKE QUERIES =====

export async function toggleLike(userId: number, videoId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId))).limit(1);
  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)));
    await db.update(videos).set({ likeCount: sql`${videos.likeCount} - 1`, trendScore: sql`${videos.trendScore} - 2` }).where(eq(videos.id, videoId));
    return false;
  } else {
    await db.insert(likes).values({ userId, videoId });
    await db.update(videos).set({ likeCount: sql`${videos.likeCount} + 1`, trendScore: sql`${videos.trendScore} + 2` }).where(eq(videos.id, videoId));
    return true;
  }
}

export async function hasUserLiked(userId: number, videoId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId))).limit(1);
  return result.length > 0;
}

export async function getUserLikes(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ videoId: likes.videoId }).from(likes).where(eq(likes.userId, userId));
  return result.map(r => r.videoId);
}

// ===== VIEW QUERIES =====

export async function recordView(videoId: number, userId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(videoViews).values({ videoId, userId: userId ?? null });
  await db.update(videos).set({ viewCount: sql`${videos.viewCount} + 1`, trendScore: sql`${videos.trendScore} + 1` }).where(eq(videos.id, videoId));
}

// ===== COMMENT QUERIES =====

export async function addComment(userId: number, videoId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values({ userId, videoId, content });
  await db.update(videos).set({ commentCount: sql`${videos.commentCount} + 1`, trendScore: sql`${videos.trendScore} + 3` }).where(eq(videos.id, videoId));
  return result[0].insertId;
}

export async function getVideoComments(videoId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: comments.id,
    userId: comments.userId,
    content: comments.content,
    createdAt: comments.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
  }).from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.videoId, videoId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function deleteComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const comment = await db.select().from(comments).where(and(eq(comments.id, commentId), eq(comments.userId, userId))).limit(1);
  if (comment.length > 0) {
    await db.delete(comments).where(eq(comments.id, commentId));
    await db.update(videos).set({ commentCount: sql`${videos.commentCount} - 1` }).where(eq(videos.id, comment[0].videoId));
  }
}

// ===== POINTS & LEVELS =====

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getNextLevelThreshold(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return LEVEL_THRESHOLDS[level];
}

export async function addPoints(userId: number, points: number, action: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(pointsHistory).values({ userId, points, action, description });
  await db.update(users).set({
    totalPoints: sql`${users.totalPoints} + ${points}`,
  }).where(eq(users.id, userId));
  const user = await getUserById(userId);
  if (user) {
    const newLevel = calculateLevel(user.totalPoints + points);
    if (newLevel !== user.level) {
      await db.update(users).set({ level: newLevel }).where(eq(users.id, userId));
    }
  }
}

export async function getUserPointsHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pointsHistory).where(eq(pointsHistory.userId, userId)).orderBy(desc(pointsHistory.createdAt)).limit(limit);
}

// ===== SPIN WHEEL =====

export async function canSpinToday(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const today = new Date().toISOString().split("T")[0];
  const result = await db.select().from(spinHistory).where(and(eq(spinHistory.userId, userId), eq(spinHistory.spinDate, today))).limit(1);
  return result.length === 0;
}

export async function recordSpin(userId: number, pointsWon: number) {
  const db = await getDb();
  if (!db) return;
  const today = new Date().toISOString().split("T")[0];
  await db.insert(spinHistory).values({ userId, pointsWon, spinDate: today });
  await addPoints(userId, pointsWon, "spin", `فزت بـ ${pointsWon} نقطة من عجلة الحظ`);
}

export async function getSpinHistory(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spinHistory).where(eq(spinHistory.userId, userId)).orderBy(desc(spinHistory.createdAt)).limit(limit);
}

export async function getVideoCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(videos).where(eq(videos.userId, userId));
  return result[0]?.count ?? 0;
}

// ===== NOTIFICATIONS =====

export async function createNotification(data: { userId: number; fromUserId: number; type: "like" | "comment" | "follow" | "message" | "challenge" | "competition" | "winner"; videoId?: number; message: string }) {
  const db = await getDb();
  if (!db) return;
  if (data.userId === data.fromUserId) return; // don't notify self
  const preferences = await getNotificationPreferences(data.userId);
  const allowed = {
    like: preferences.likesEnabled,
    comment: preferences.commentsEnabled,
    follow: preferences.followsEnabled,
    message: true,
    challenge: preferences.challengesEnabled,
    competition: preferences.competitionsEnabled,
    winner: preferences.competitionsEnabled,
  }[data.type];
  if (!allowed) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) {
    return { userId, likesEnabled: true, commentsEnabled: true, followsEnabled: true, challengesEnabled: true, competitionsEnabled: true };
  }
  const [existing] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  if (existing) return existing;
  await db.insert(notificationPreferences).values({ userId });
  const [created] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return created!;
}

export async function updateNotificationPreferences(userId: number, changes: Partial<{
  likesEnabled: boolean;
  commentsEnabled: boolean;
  followsEnabled: boolean;
  challengesEnabled: boolean;
  competitionsEnabled: boolean;
}>) {
  const db = await getDb();
  if (!db) return null;
  await getNotificationPreferences(userId);
  await db.update(notificationPreferences).set(changes).where(eq(notificationPreferences.userId, userId));
  return getNotificationPreferences(userId);
}

export async function getUserNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: notifications.id,
    userId: notifications.userId,
    fromUserId: notifications.fromUserId,
    type: notifications.type,
    videoId: notifications.videoId,
    message: notifications.message,
    isRead: notifications.isRead,
    createdAt: notifications.createdAt,
    fromUserName: users.name,
    fromUserAvatar: users.avatarUrl,
  }).from(notifications)
    .leftJoin(users, eq(notifications.fromUserId, users.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function markOneNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

// ===== FOLLOWS =====

export async function toggleFollow(followerId: number, followingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (followerId === followingId) throw new Error("Cannot follow yourself");
  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return false; // unfollowed
  } else {
    await db.insert(follows).values({ followerId, followingId });
    return true; // followed
  }
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return result.length > 0;
}

export async function getFollowerCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, userId));
  return result[0]?.count ?? 0;
}

export async function getFollowingCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, userId));
  return result[0]?.count ?? 0;
}

export async function getFollowingFeed(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const followingIds = await db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, userId));
  if (followingIds.length === 0) return [];
  const ids = followingIds.map(f => f.followingId);
  return db.select({
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    description: videos.description,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
    viewCount: videos.viewCount,
    likeCount: videos.likeCount,
    commentCount: videos.commentCount,
    trendScore: videos.trendScore,
    createdAt: videos.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .where(sql`${videos.userId} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getFollowers(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
    level: users.level,
    createdAt: follows.createdAt,
  }).from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit);
}

export async function getFollowing(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
    level: users.level,
    createdAt: follows.createdAt,
  }).from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit);
}

// ===== ADMIN QUERIES =====

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalVideos: 0, totalComments: 0, totalLikes: 0, totalViews: 0 };
  const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [videosCount] = await db.select({ count: sql<number>`count(*)` }).from(videos);
  const [commentsCount] = await db.select({ count: sql<number>`count(*)` }).from(comments);
  const [likesCount] = await db.select({ count: sql<number>`count(*)` }).from(likes);
  const [viewsSum] = await db.select({ total: sql<number>`COALESCE(SUM(${videos.viewCount}), 0)` }).from(videos);
  return {
    totalUsers: usersCount?.count ?? 0,
    totalVideos: videosCount?.count ?? 0,
    totalComments: commentsCount?.count ?? 0,
    totalLikes: likesCount?.count ?? 0,
    totalViews: viewsSum?.total ?? 0,
  };
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    avatarUrl: users.avatarUrl,
    totalPoints: users.totalPoints,
    level: users.level,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getAllVideos(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    videoUrl: videos.videoUrl,
    viewCount: videos.viewCount,
    likeCount: videos.likeCount,
    commentCount: videos.commentCount,
    createdAt: videos.createdAt,
    userName: users.name,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllComments(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: comments.id,
    userId: comments.userId,
    videoId: comments.videoId,
    content: comments.content,
    createdAt: comments.createdAt,
    userName: users.name,
  }).from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function adminDeleteVideo(videoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(comments).where(eq(comments.videoId, videoId));
  await db.delete(likes).where(eq(likes.videoId, videoId));
  await db.delete(videoViews).where(eq(videoViews.videoId, videoId));
  await db.delete(videos).where(eq(videos.id, videoId));
}

export async function adminDeleteComment(commentId: number) {
  const db = await getDb();
  if (!db) return;
  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (comment.length > 0) {
    await db.delete(comments).where(eq(comments.id, commentId));
    await db.update(videos).set({ commentCount: sql`${videos.commentCount} - 1` }).where(eq(videos.id, comment[0].videoId));
  }
}

export async function adminUpdateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ===== MESSAGES =====

export async function getOrCreateConversation(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const minId = Math.min(user1Id, user2Id);
  const maxId = Math.max(user1Id, user2Id);
  const existing = await db.select().from(conversations)
    .where(and(eq(conversations.user1Id, minId), eq(conversations.user2Id, maxId)))
    .limit(1);
  if (existing.length > 0) return existing[0];
  const result = await db.insert(conversations).values({ user1Id: minId, user2Id: maxId });
  return { id: result[0].insertId, user1Id: minId, user2Id: maxId, lastMessageAt: new Date(), createdAt: new Date() };
}

export async function sendMessage(conversationId: number, senderId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values({ conversationId, senderId, content });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: messages.id,
    conversationId: messages.conversationId,
    senderId: messages.senderId,
    content: messages.content,
    isRead: messages.isRead,
    createdAt: messages.createdAt,
    senderName: users.name,
    senderAvatar: users.avatarUrl,
  }).from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const convos = await db.select().from(conversations)
    .where(sql`${conversations.user1Id} = ${userId} OR ${conversations.user2Id} = ${userId}`)
    .orderBy(desc(conversations.lastMessageAt));
  const result = [];
  for (const c of convos) {
    const otherUserId = c.user1Id === userId ? c.user2Id : c.user1Id;
    const otherUser = await getUserById(otherUserId);
    const lastMsg = await db.select().from(messages)
      .where(eq(messages.conversationId, c.id))
      .orderBy(desc(messages.createdAt)).limit(1);
    const unreadCount = await db.select({ count: sql<number>`count(*)` }).from(messages)
      .where(and(eq(messages.conversationId, c.id), eq(messages.isRead, false), sql`${messages.senderId} != ${userId}`));
    result.push({
      id: c.id,
      otherUser: { id: otherUserId, name: otherUser?.name ?? "مستخدم", avatarUrl: otherUser?.avatarUrl },
      lastMessage: lastMsg[0]?.content ?? "",
      lastMessageAt: c.lastMessageAt,
      unreadCount: unreadCount[0]?.count ?? 0,
    });
  }
  return result;
}

export async function markConversationRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isRead: true })
    .where(and(eq(messages.conversationId, conversationId), sql`${messages.senderId} != ${userId}`, eq(messages.isRead, false)));
}

export async function getTotalUnreadMessages(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const convos = await db.select({ id: conversations.id }).from(conversations)
    .where(sql`${conversations.user1Id} = ${userId} OR ${conversations.user2Id} = ${userId}`);
  if (convos.length === 0) return 0;
  const convoIds = convos.map(c => c.id);
  const result = await db.select({ count: sql<number>`count(*)` }).from(messages)
    .where(and(inArray(messages.conversationId, convoIds), eq(messages.isRead, false), sql`${messages.senderId} != ${userId}`));
  return result[0]?.count ?? 0;
}

// ===== HASHTAGS =====

export async function getOrCreateHashtag(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const clean = name.replace(/^#/, "").trim().toLowerCase();
  if (!clean) return null;
  const existing = await db.select().from(hashtags).where(eq(hashtags.name, clean)).limit(1);
  if (existing.length > 0) return existing[0];
  const result = await db.insert(hashtags).values({ name: clean });
  return { id: result[0].insertId, name: clean, videoCount: 0, createdAt: new Date() };
}

export async function linkVideoHashtags(videoId: number, hashtagNames: string[]) {
  const db = await getDb();
  if (!db) return;
  for (const name of hashtagNames) {
    const tag = await getOrCreateHashtag(name);
    if (!tag) continue;
    await db.insert(videoHashtags).values({ videoId, hashtagId: tag.id });
    await db.update(hashtags).set({ videoCount: sql`${hashtags.videoCount} + 1` }).where(eq(hashtags.id, tag.id));
  }
}

export async function getTrendingHashtags(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hashtags).orderBy(desc(hashtags.videoCount)).limit(limit);
}

export async function getVideosByHashtag(hashtagName: string, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const tag = await db.select().from(hashtags).where(eq(hashtags.name, hashtagName.toLowerCase())).limit(1);
  if (tag.length === 0) return [];
  const vhIds = await db.select({ videoId: videoHashtags.videoId }).from(videoHashtags).where(eq(videoHashtags.hashtagId, tag[0].id));
  if (vhIds.length === 0) return [];
  const ids = vhIds.map(v => v.videoId);
  return db.select({
    id: videos.id, userId: videos.userId, title: videos.title, description: videos.description,
    videoUrl: videos.videoUrl, thumbnailUrl: videos.thumbnailUrl, viewCount: videos.viewCount,
    likeCount: videos.likeCount, commentCount: videos.commentCount, trendScore: videos.trendScore,
    createdAt: videos.createdAt, userName: users.name, userAvatar: users.avatarUrl,
  }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .where(inArray(videos.id, ids))
    .orderBy(desc(videos.createdAt))
    .limit(limit).offset(offset);
}

export async function getVideoHashtags(videoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: hashtags.id, name: hashtags.name, videoCount: hashtags.videoCount })
    .from(videoHashtags)
    .innerJoin(hashtags, eq(videoHashtags.hashtagId, hashtags.id))
    .where(eq(videoHashtags.videoId, videoId));
}

// ===== CHALLENGES =====

export async function createChallenge(data: { title: string; description: string; emoji?: string; startDate: Date; endDate: Date; prizePoints?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(challenges).values(data);
  return result[0].insertId;
}

export async function getActiveChallenges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challenges)
    .where(sql`${challenges.status} IN ('active', 'voting')`)
    .orderBy(desc(challenges.createdAt));
}

export async function getAllChallenges(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challenges).orderBy(desc(challenges.createdAt)).limit(limit);
}

export async function getChallengeById(challengeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function submitChallengeEntry(challengeId: number, userId: number, videoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(challengeEntries)
    .where(and(eq(challengeEntries.challengeId, challengeId), eq(challengeEntries.userId, userId)))
    .limit(1);
  if (existing.length > 0) throw new Error("Already submitted");
  await db.insert(challengeEntries).values({ challengeId, userId, videoId });
  await db.update(challenges).set({ participantCount: sql`${challenges.participantCount} + 1` }).where(eq(challenges.id, challengeId));
}

export async function getChallengeEntries(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: challengeEntries.id,
    challengeId: challengeEntries.challengeId,
    userId: challengeEntries.userId,
    videoId: challengeEntries.videoId,
    voteCount: challengeEntries.voteCount,
    isWinner: challengeEntries.isWinner,
    createdAt: challengeEntries.createdAt,
    userName: users.name,
    userAvatar: users.avatarUrl,
    videoTitle: videos.title,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
  }).from(challengeEntries)
    .leftJoin(users, eq(challengeEntries.userId, users.id))
    .leftJoin(videos, eq(challengeEntries.videoId, videos.id))
    .where(eq(challengeEntries.challengeId, challengeId))
    .orderBy(desc(challengeEntries.voteCount));
}

export async function voteChallengeEntry(entryId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(challengeVotes)
    .where(and(eq(challengeVotes.entryId, entryId), eq(challengeVotes.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(challengeVotes).where(and(eq(challengeVotes.entryId, entryId), eq(challengeVotes.userId, userId)));
    await db.update(challengeEntries).set({ voteCount: sql`${challengeEntries.voteCount} - 1` }).where(eq(challengeEntries.id, entryId));
    return false;
  } else {
    await db.insert(challengeVotes).values({ entryId, userId });
    await db.update(challengeEntries).set({ voteCount: sql`${challengeEntries.voteCount} + 1` }).where(eq(challengeEntries.id, entryId));
    return true;
  }
}

export async function hasVotedEntry(userId: number, entryId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(challengeVotes)
    .where(and(eq(challengeVotes.entryId, entryId), eq(challengeVotes.userId, userId)))
    .limit(1);
  return result.length > 0;
}

export async function updateChallengeStatus(challengeId: number, status: "active" | "voting" | "completed") {
  const db = await getDb();
  if (!db) return;
  await db.update(challenges).set({ status }).where(eq(challenges.id, challengeId));
}

export async function declareWinner(entryId: number, challengeId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(challengeEntries).set({ isWinner: true }).where(eq(challengeEntries.id, entryId));
  const entry = await db.select().from(challengeEntries).where(eq(challengeEntries.id, entryId)).limit(1);
  const challenge = await getChallengeById(challengeId);
  if (entry.length > 0 && challenge) {
    await addPoints(entry[0].userId, challenge.prizePoints, "challenge_win", `\u0641\u0632\u062a \u0641\u064a \u062a\u062d\u062f\u064a ${challenge.title}`);
    await db.insert(userBadges).values({
      userId: entry[0].userId,
      badgeType: "challenge_winner",
      badgeName: `\u0641\u0627\u0626\u0632: ${challenge.title}`,
      badgeEmoji: challenge.emoji,
      challengeId,
    });
  }
}

// ===== BADGES =====

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}

export async function getLeaderboard(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
    totalPoints: users.totalPoints,
    level: users.level,
  }).from(users).orderBy(desc(users.totalPoints)).limit(limit);
}

// Alias for linkVideoHashtags - used in routers
export const addHashtagsToVideo = linkVideoHashtags;


// ===== FAVORITES FUNCTIONS =====
export async function addFavorite(userId: number, videoId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(favorites).values({ userId, videoId });
    return result;
  } catch (error) {
    console.error("[Database] Failed to add favorite:", error);
    return null;
  }
}

export async function removeFavorite(userId: number, videoId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.videoId, videoId)));
    return result;
  } catch (error) {
    console.error("[Database] Failed to remove favorite:", error);
    return null;
  }
}

export async function isFavorite(userId: number, videoId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.videoId, videoId))).limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check favorite:", error);
    return false;
  }
}

export async function getUserFavorites(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  try {
    return db.select({
      id: videos.id,
      userId: videos.userId,
      title: videos.title,
      description: videos.description,
      videoUrl: videos.videoUrl,
      thumbnailUrl: videos.thumbnailUrl,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      commentCount: videos.commentCount,
      trendScore: videos.trendScore,
      createdAt: videos.createdAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
      .from(favorites)
      .innerJoin(videos, eq(favorites.videoId, videos.id))
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get user favorites:", error);
    return [];
  }
}

export async function getFavoriteCount(videoId: number) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(favorites).where(eq(favorites.videoId, videoId));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to get favorite count:", error);
    return 0;
  }
}


// ============ Comment Replies ============

export async function addCommentReply(commentId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(commentReplies).values({
    commentId,
    userId,
    content,
  });
  
  return result;
}

export async function getCommentReplies(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const replies = await db
    .select({
      id: commentReplies.id,
      commentId: commentReplies.commentId,
      userId: commentReplies.userId,
      content: commentReplies.content,
      likeCount: commentReplies.likeCount,
      createdAt: commentReplies.createdAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(commentReplies)
    .innerJoin(users, eq(commentReplies.userId, users.id))
    .where(eq(commentReplies.commentId, commentId))
    .orderBy(desc(commentReplies.createdAt));
  
  return replies;
}

export async function deleteCommentReply(replyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(commentReplies).where(eq(commentReplies.id, replyId));
}

// ============ Referrals ============

export async function createReferralCode(userId: number, referralCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(referrals).values({
    referrerId: userId,
    referralCode,
  });
  
  return result;
}

export async function getReferralCode(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .limit(1);
  
  return referral[0];
}

export async function redeemReferralCode(referralCode: string, referredUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referralCode, referralCode))
    .limit(1);
  
  if (!referral[0]) throw new Error("Invalid referral code");
  if (referral[0].isRedeemed) throw new Error("Referral code already redeemed");
  
  // Update referral
  await db
    .update(referrals)
    .set({
      referredUserId,
      isRedeemed: true,
      redeemedAt: new Date(),
    })
    .where(eq(referrals.id, referral[0].id));
  
  // Add reward points to referrer
  const rewardPoints = referral[0].rewardPoints;
  await db.insert(rewards).values({
    userId: referral[0].referrerId,
    rewardType: "referral",
    points: rewardPoints,
    description: `Referral reward for ${referredUserId}`,
  });
  
  // Update user points
  await db
    .update(users)
    .set({
      totalPoints: sql`totalPoints + ${rewardPoints}`,
    })
    .where(eq(users.id, referral[0].referrerId));
  
  return { success: true, points: rewardPoints };
}

export async function getUserReferralStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .limit(1);
  
  if (!referral[0]) return null;
  
  const referredCount = await db
    .select({ count: sql`COUNT(*)` })
    .from(referrals)
    .where(and(
      eq(referrals.referrerId, userId),
      eq(referrals.isRedeemed, true)
    ));
  
  return {
    referralCode: referral[0].referralCode,
    referredCount: Number(referredCount[0]?.count || 0),
    totalRewardPoints: referral[0].rewardPoints * Number(referredCount[0]?.count || 0),
  };
}

// ============ Rewards ============

export async function getUserRewards(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const userRewards = await db
    .select()
    .from(rewards)
    .where(eq(rewards.userId, userId))
    .orderBy(desc(rewards.createdAt));
  
  return userRewards;
}

export async function spendRewardPoints(userId: number, points: number, rewardType: string, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user has enough points
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0] || user[0].totalPoints < points) {
    throw new Error("Insufficient reward points");
  }
  
  // Deduct points
  await db
    .update(users)
    .set({
      totalPoints: sql`totalPoints - ${points}`,
    })
    .where(eq(users.id, userId));
  
  // Record reward usage
  await db.insert(rewards).values({
    userId,
    rewardType: rewardType as any,
    points: -points,
    description,
    usedAt: new Date(),
  });
  
  return { success: true };
}

// ============ Video Boosts ============

export async function boostVideo(videoId: number, userId: number, pointsSpent: number, boostLevel: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Spend reward points
  await spendRewardPoints(userId, pointsSpent, "boost", `Boost for video ${videoId}`);
  
  // Create boost record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days boost
  
  const result = await db.insert(videoBoosts).values({
    videoId,
    userId,
    pointsSpent,
    boostLevel,
    expiresAt,
  });
  
  // Increase video trend score
  await db
    .update(videos)
    .set({
      trendScore: sql`trendScore + ${pointsSpent * boostLevel}`,
    })
    .where(eq(videos.id, videoId));
  
  return result;
}

export async function getVideoBoostedStatus(videoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const boost = await db
    .select()
    .from(videoBoosts)
    .where(and(
      eq(videoBoosts.videoId, videoId),
      sql`expiresAt > NOW()`
    ))
    .limit(1);
  
  return boost[0] || null;
}


// --- Posts, stories, and ordered content blocks ---

type NewPostBlock = {
  blockOrder: number;
  blockType: "text" | "image" | "video";
  textContent?: string | null;
  mediaUrl?: string | null;
  mediaKey?: string | null;
  thumbnailUrl?: string | null;
};

export async function createPostWithBlocks(
  userId: number,
  visibility: "public" | "followers",
  blocks: NewPostBlock[],
) {
  const db = await getDb();
  if (!db) return null;

  const [postResult] = await db.insert(posts).values({ userId, visibility });
  const postId = Number(postResult.insertId);
  if (blocks.length > 0) {
    await db.insert(postBlocks).values(blocks.map(block => ({ ...block, postId })));
  }
  return postId;
}

export async function getPublicPosts(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const postRows = await db.select().from(posts)
    .where(eq(posts.visibility, "public"))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  if (postRows.length === 0) return [];
  const postIds = postRows.map(post => post.id);
  const blocks = await db.select().from(postBlocks).where(inArray(postBlocks.postId, postIds));
  return postRows.map(post => ({
    ...post,
    blocks: blocks.filter(block => block.postId === post.id).sort((a, b) => a.blockOrder - b.blockOrder),
  }));
}

export async function getPostWithBlocks(postId: number) {
  const db = await getDb();
  if (!db) return null;
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return null;
  const blocks = await db.select().from(postBlocks).where(eq(postBlocks.postId, postId)).orderBy(postBlocks.blockOrder);
  return { ...post, blocks };
}

export async function createStory(data: {
  userId: number;
  mediaType: "image" | "video";
  mediaUrl: string;
  mediaKey?: string;
  caption?: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(stories).values(data);
  return Number(result.insertId);
}

export async function getActiveStories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stories)
    .where(sql`${stories.expiresAt} > NOW()`)
    .orderBy(desc(stories.createdAt));
}

export async function incrementStoryView(storyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(stories).set({ viewCount: sql`${stories.viewCount} + 1` }).where(eq(stories.id, storyId));
}

export async function togglePostLike(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  const [existing] = await db.select().from(postLikes)
    .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))).limit(1);
  if (existing) {
    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
    return false;
  }
  await db.insert(postLikes).values({ userId, postId });
  return true;
}

export async function isPostLiked(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  const [existing] = await db.select().from(postLikes)
    .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))).limit(1);
  return Boolean(existing);
}

export async function addPostComment(userId: number, postId: number, content: string) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(postComments).values({ userId, postId, content });
  return Number(result.insertId);
}

export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postComments).where(eq(postComments.postId, postId)).orderBy(desc(postComments.createdAt));
}

export async function getPostsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
  if (rows.length === 0) return [];
  const blocks = await db.select().from(postBlocks).where(inArray(postBlocks.postId, rows.map(row => row.id)));
  return rows.map(post => ({ ...post, blocks: blocks.filter(block => block.postId === post.id).sort((a, b) => a.blockOrder - b.blockOrder) }));
}


// --- Community trends and local challenges ---

export async function getActiveCommunityTrends(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityTrends)
    .where(and(eq(communityTrends.status, "active"), sql`${communityTrends.expiresAt} > NOW()`))
    .orderBy(desc(communityTrends.participantCount), desc(communityTrends.createdAt))
    .limit(limit);
}

export async function getCommunityTrendById(trendId: number) {
  const db = await getDb();
  if (!db) return null;
  const [trend] = await db.select().from(communityTrends).where(eq(communityTrends.id, trendId)).limit(1);
  if (!trend) return null;
  const entries = await db.select().from(communityTrendEntries)
    .where(eq(communityTrendEntries.trendId, trendId))
    .orderBy(desc(communityTrendEntries.votes), desc(communityTrendEntries.createdAt));
  const enrichedEntries = await Promise.all(entries.map(async entry => ({
    ...entry,
    video: entry.videoId ? await getVideoById(entry.videoId) : null,
    post: entry.postId ? await getPostWithBlocks(entry.postId) : null,
  })));
  return { ...trend, entries: enrichedEntries };
}

export async function createCommunityTrend(data: {
  creatorId: number;
  title: string;
  slug: string;
  description?: string;
  prompt: string;
  sourceVideoId?: number;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(communityTrends).values({ ...data, status: "active" });
  return Number(result.insertId);
}

export async function joinCommunityTrend(data: {
  trendId: number;
  userId: number;
  videoId?: number;
  postId?: number;
  caption?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(communityTrendEntries).values(data);
  await db.update(communityTrends).set({ participantCount: sql`${communityTrends.participantCount} + 1` }).where(eq(communityTrends.id, data.trendId));
  return Number(result.insertId);
}

export async function voteCommunityTrendEntry(entryId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(communityTrendEntries).set({ votes: sql`${communityTrendEntries.votes} + 1` }).where(eq(communityTrendEntries.id, entryId));
}

export async function getLocalChallenges(scope?: "global" | "city" | "community", locationName?: string, communityName?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(localChallenges.status, "active")];
  if (scope) conditions.push(eq(localChallenges.scope, scope));
  if (locationName) conditions.push(eq(localChallenges.locationName, locationName));
  if (communityName) conditions.push(eq(localChallenges.communityName, communityName));
  return db.select().from(localChallenges).where(and(...conditions)).orderBy(desc(localChallenges.endsAt));
}

export async function getLocalChallengeById(challengeId: number) {
  const db = await getDb();
  if (!db) return null;
  const [challenge] = await db.select().from(localChallenges).where(eq(localChallenges.id, challengeId)).limit(1);
  if (!challenge) return null;
  const entries = await db.select().from(localChallengeEntries)
    .where(eq(localChallengeEntries.challengeId, challengeId))
    .orderBy(desc(localChallengeEntries.votes), desc(localChallengeEntries.createdAt));
  const enrichedEntries = await Promise.all(entries.map(async entry => ({
    ...entry,
    video: entry.videoId ? await getVideoById(entry.videoId) : null,
    post: entry.postId ? await getPostWithBlocks(entry.postId) : null,
  })));
  return { ...challenge, entries: enrichedEntries };
}

export async function createLocalChallenge(data: {
  title: string;
  description?: string;
  scope: "global" | "city" | "community";
  locationName?: string;
  communityName?: string;
  rewardPoints: number;
  startsAt: Date;
  endsAt: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(localChallenges).values({ ...data, status: "active" });
  return Number(result.insertId);
}

export async function joinLocalChallenge(data: {
  challengeId: number;
  userId: number;
  videoId?: number;
  postId?: number;
  caption?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(localChallengeEntries).values(data);
  return Number(result.insertId);
}

export async function voteLocalChallengeEntry(entryId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(localChallengeEntries).set({ votes: sql`${localChallengeEntries.votes} + 1` }).where(eq(localChallengeEntries.id, entryId));
}

export async function saveAiSuggestion(data: {
  userId: number;
  inputText: string;
  title: string;
  description: string;
  suggestedHashtags: string;
  tone: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiSuggestions).values(data);
  return Number(result.insertId);
}

export async function getRecentAiSuggestions(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, userId)).orderBy(desc(aiSuggestions.createdAt)).limit(limit);
}

// ===== CREATOR ANALYTICS =====

export async function getCreatorAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [videoTotals] = await db.select({
    videoCount: sql<number>`count(*)`,
    viewCount: sql<number>`coalesce(sum(${videos.viewCount}), 0)`,
    likeCount: sql<number>`coalesce(sum(${videos.likeCount}), 0)`,
    commentCount: sql<number>`coalesce(sum(${videos.commentCount}), 0)`,
  }).from(videos).where(eq(videos.userId, userId));
  const [followers] = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, userId));
  const recentVideos = await db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt)).limit(5);
  const totals = {
    videoCount: Number(videoTotals?.videoCount ?? 0),
    viewCount: Number(videoTotals?.viewCount ?? 0),
    likeCount: Number(videoTotals?.likeCount ?? 0),
    commentCount: Number(videoTotals?.commentCount ?? 0),
    followerCount: Number(followers?.count ?? 0),
  };
  const today = new Date().toISOString().slice(0, 10);
  const [snapshot] = await db.select().from(creatorAnalyticsSnapshots)
    .where(and(eq(creatorAnalyticsSnapshots.userId, userId), eq(creatorAnalyticsSnapshots.snapshotDate, today))).limit(1);
  if (!snapshot) await db.insert(creatorAnalyticsSnapshots).values({ userId, snapshotDate: today, ...totals });
  const growth = await db.select().from(creatorAnalyticsSnapshots)
    .where(eq(creatorAnalyticsSnapshots.userId, userId)).orderBy(desc(creatorAnalyticsSnapshots.snapshotDate)).limit(7);
  const engagementRate = totals.viewCount > 0 ? Number((((totals.likeCount + totals.commentCount) / totals.viewCount) * 100).toFixed(2)) : 0;
  return { ...totals, engagementRate, recentVideos, growth: growth.reverse() };
}

// ===== COMPETITIONS AND SYMBOLIC REWARDS =====

export async function getCompetitions(status?: "upcoming" | "active" | "completed") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitions).where(status ? eq(competitions.status, status) : undefined).orderBy(desc(competitions.endsAt));
}

export async function getCompetitionById(competitionId: number) {
  const db = await getDb();
  if (!db) return null;
  const [competition] = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
  if (!competition) return null;
  const entries = await db.select().from(competitionEntries).where(eq(competitionEntries.competitionId, competitionId)).orderBy(desc(competitionEntries.votes), desc(competitionEntries.createdAt));
  const enrichedEntries = await Promise.all(entries.map(async entry => ({
    ...entry,
    video: entry.videoId ? await getVideoById(entry.videoId) : null,
    post: entry.postId ? await getPostWithBlocks(entry.postId) : null,
  })));
  const rewards = await db.select().from(competitionRewards).where(eq(competitionRewards.competitionId, competitionId)).orderBy(desc(competitionRewards.awardedAt));
  return { ...competition, entries: enrichedEntries, rewards };
}

export async function createCompetition(data: {
  title: string;
  description?: string;
  category: string;
  prizeTitle: string;
  prizeIcon: string;
  prizePoints: number;
  startsAt: Date;
  endsAt: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(competitions).values({ ...data, status: "active" });
  return Number(result.insertId);
}

export async function joinCompetition(data: { competitionId: number; userId: number; videoId?: number; postId?: number; caption?: string }) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(competitionEntries).where(and(eq(competitionEntries.competitionId, data.competitionId), eq(competitionEntries.userId, data.userId))).limit(1);
  if (existing.length) throw new Error("لقد شاركت بالفعل في هذه المسابقة");
  const [result] = await db.insert(competitionEntries).values(data);
  return Number(result.insertId);
}

export async function voteCompetitionEntry(competitionEntryId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(competitionVotes).where(and(eq(competitionVotes.competitionEntryId, competitionEntryId), eq(competitionVotes.userId, userId))).limit(1);
  if (existing.length) return false;
  await db.insert(competitionVotes).values({ competitionEntryId, userId });
  await db.update(competitionEntries).set({ votes: sql`${competitionEntries.votes} + 1` }).where(eq(competitionEntries.id, competitionEntryId));
  return true;
}

export async function awardCompetitionWinner(competitionId: number, awardedByUserId: number) {
  const db = await getDb();
  if (!db) return null;
  const [competition] = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
  if (!competition) throw new Error("المسابقة غير موجودة");
  const [winner] = await db.select().from(competitionEntries).where(eq(competitionEntries.competitionId, competitionId)).orderBy(desc(competitionEntries.votes), desc(competitionEntries.createdAt)).limit(1);
  if (!winner) throw new Error("لا توجد مشاركات في المسابقة");
  const alreadyAwarded = await db.select().from(competitionRewards).where(and(eq(competitionRewards.competitionId, competitionId), eq(competitionRewards.userId, winner.userId))).limit(1);
  if (alreadyAwarded.length) return { winnerUserId: winner.userId, alreadyAwarded: true };
  await db.insert(competitionRewards).values({ competitionId, userId: winner.userId, title: competition.prizeTitle, icon: competition.prizeIcon, pointsAwarded: competition.prizePoints });
  await addPoints(winner.userId, competition.prizePoints, "competition_winner", `فزت بمسابقة: ${competition.title}`);
  await db.insert(notifications).values({ userId: winner.userId, fromUserId: awardedByUserId, type: "winner", message: `تهانينا! فزت بجائزة ${competition.prizeTitle} وحصلت على ${competition.prizePoints} نقطة.` });
  await db.update(competitions).set({ status: "completed" }).where(eq(competitions.id, competitionId));
  return { winnerUserId: winner.userId, alreadyAwarded: false };
}

export async function notifyCompetitionParticipants(competitionId: number, fromUserId: number, message: string) {
  const db = await getDb();
  if (!db) return 0;
  const participants = await db.select({ userId: competitionEntries.userId }).from(competitionEntries).where(eq(competitionEntries.competitionId, competitionId));
  for (const participant of participants) await createNotification({ userId: participant.userId, fromUserId, type: "competition", message });
  return participants.length;
}

export async function getRecentCompetitionWinners(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    rewardId: competitionRewards.id,
    userId: competitionRewards.userId,
    title: competitionRewards.title,
    icon: competitionRewards.icon,
    pointsAwarded: competitionRewards.pointsAwarded,
    awardedAt: competitionRewards.awardedAt,
    competitionTitle: competitions.title,
    userName: users.name,
    avatarUrl: users.avatarUrl,
  }).from(competitionRewards)
    .leftJoin(competitions, eq(competitionRewards.competitionId, competitions.id))
    .leftJoin(users, eq(competitionRewards.userId, users.id))
    .orderBy(desc(competitionRewards.awardedAt))
    .limit(limit);
}
