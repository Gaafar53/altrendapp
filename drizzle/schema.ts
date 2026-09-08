import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  totalPoints: int("totalPoints").default(0).notNull(),
  level: int("level").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Videos table - stores uploaded video metadata
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  videoKey: text("videoKey").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"),
  viewCount: int("viewCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  trendScore: int("trendScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Likes table - tracks user likes on videos
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Comments table - user comments on videos
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Video views table - tracks unique views per user per video
 */
export const videoViews = mysqlTable("video_views", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  videoId: int("videoId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type VideoView = typeof videoViews.$inferSelect;

/**
 * Points history table - tracks all point transactions
 */
export const pointsHistory = mysqlTable("points_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  points: int("points").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsHistory = typeof pointsHistory.$inferSelect;

/**
 * Spin history table - tracks daily spin wheel usage
 */
export const spinHistory = mysqlTable("spin_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pointsWon: int("pointsWon").notNull(),
  spinDate: varchar("spinDate", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpinHistory = typeof spinHistory.$inferSelect;

/**
 * Notifications table - user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromUserId: int("fromUserId").notNull(),
  type: mysqlEnum("type", ["like", "comment", "follow", "message", "challenge", "competition", "winner"]).notNull(),
  videoId: int("videoId"),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Follows table - user follow relationships
 */
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

/**
 * Conversations table - direct message conversations between users
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id").notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;

/**
 * Messages table - individual messages in conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

/**
 * Hashtags table - unique hashtags
 */
export const hashtags = mysqlTable("hashtags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  videoCount: int("videoCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Hashtag = typeof hashtags.$inferSelect;

/**
 * Video hashtags junction table
 */
export const videoHashtags = mysqlTable("video_hashtags", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  hashtagId: int("hashtagId").notNull(),
});

export type VideoHashtag = typeof videoHashtags.$inferSelect;

/**
 * Challenges table - weekly challenges
 */
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  emoji: varchar("emoji", { length: 10 }).default("\uD83C\uDFC6").notNull(),
  status: mysqlEnum("status", ["active", "voting", "completed"]).default("active").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  prizePoints: int("prizePoints").default(500).notNull(),
  participantCount: int("participantCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;

/**
 * Challenge entries - videos submitted for challenges
 */
export const challengeEntries = mysqlTable("challenge_entries", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  voteCount: int("voteCount").default(0).notNull(),
  isWinner: boolean("isWinner").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChallengeEntry = typeof challengeEntries.$inferSelect;

/**
 * Challenge votes - user votes on challenge entries
 */
export const challengeVotes = mysqlTable("challenge_votes", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChallengeVote = typeof challengeVotes.$inferSelect;

/**
 * User badges - earned badges displayed on profile
 */
export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeType: varchar("badgeType", { length: 64 }).notNull(),
  badgeName: varchar("badgeName", { length: 100 }).notNull(),
  badgeEmoji: varchar("badgeEmoji", { length: 10 }).notNull(),
  challengeId: int("challengeId"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;

/**
 * Favorites table - user favorite videos
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;


/**
 * Comment replies - nested replies on comments
 */
export const commentReplies = mysqlTable("comment_replies", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommentReply = typeof commentReplies.$inferSelect;
export type InsertCommentReply = typeof commentReplies.$inferInsert;

/**
 * Referrals - user referral codes and tracking
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  referredUserId: int("referredUserId"),
  rewardPoints: int("rewardPoints").default(100).notNull(),
  isRedeemed: boolean("isRedeemed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  redeemedAt: timestamp("redeemedAt"),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Rewards - user reward points and their usage
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rewardType: mysqlEnum("rewardType", ["referral", "badge", "boost", "feature"]).notNull(),
  points: int("points").notNull(),
  description: text("description"),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * Video boosts - paid boosts to promote videos
 */
export const videoBoosts = mysqlTable("video_boosts", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  boostLevel: int("boostLevel").default(1).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoBoost = typeof videoBoosts.$inferSelect;
export type InsertVideoBoost = typeof videoBoosts.$inferInsert;


/**
 * Reports - content and user reports for moderation
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  targetType: mysqlEnum("targetType", ["video", "comment", "user"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "resolved", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * User feedback - post-launch user feedback collection
 */
export const userFeedback = mysqlTable("user_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  feedbackType: mysqlEnum("feedbackType", ["bug", "suggestion", "praise", "other"]).notNull(),
  message: text("message").notNull(),
  rating: int("rating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;


/**
 * Posts - public multi-block publications
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  visibility: mysqlEnum("visibility", ["public", "followers"]).default("public").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post blocks - ordered text/image/video content inside one publication.
 * Text blocks are validated server-side to a maximum of five lines.
 */
export const postBlocks = mysqlTable("post_blocks", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  blockOrder: int("blockOrder").notNull(),
  blockType: mysqlEnum("blockType", ["text", "image", "video"]).notNull(),
  textContent: text("textContent"),
  mediaUrl: text("mediaUrl"),
  mediaKey: text("mediaKey"),
  thumbnailUrl: text("thumbnailUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostBlock = typeof postBlocks.$inferSelect;
export type InsertPostBlock = typeof postBlocks.$inferInsert;

/**
 * Stories - ephemeral image/video updates visible for 24 hours.
 */
export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaKey: text("mediaKey"),
  caption: varchar("caption", { length: 280 }),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

export const postLikes = mysqlTable("post_likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;

export const postComments = mysqlTable("post_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;


/**
 * Community trends - shared trends that users can join with a video or post.
 */
export const communityTrends = mysqlTable("community_trends", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId"),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description"),
  prompt: varchar("prompt", { length: 280 }).notNull(),
  sourceVideoId: int("sourceVideoId"),
  status: mysqlEnum("status", ["active", "completed", "draft"]).default("active").notNull(),
  participantCount: int("participantCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type CommunityTrend = typeof communityTrends.$inferSelect;
export type InsertCommunityTrend = typeof communityTrends.$inferInsert;

export const communityTrendEntries = mysqlTable("community_trend_entries", {
  id: int("id").autoincrement().primaryKey(),
  trendId: int("trendId").notNull(),
  userId: int("userId").notNull(),
  videoId: int("videoId"),
  postId: int("postId"),
  caption: varchar("caption", { length: 280 }),
  votes: int("votes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityTrendEntry = typeof communityTrendEntries.$inferSelect;
export type InsertCommunityTrendEntry = typeof communityTrendEntries.$inferInsert;

/**
 * Local challenges - city, university, interest-group, or global competitions.
 */
export const localChallenges = mysqlTable("local_challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  scope: mysqlEnum("scope", ["global", "city", "community"]).default("global").notNull(),
  locationName: varchar("locationName", { length: 160 }),
  communityName: varchar("communityName", { length: 160 }),
  rewardPoints: int("rewardPoints").default(100).notNull(),
  status: mysqlEnum("status", ["upcoming", "active", "completed"]).default("upcoming").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LocalChallenge = typeof localChallenges.$inferSelect;
export type InsertLocalChallenge = typeof localChallenges.$inferInsert;

export const localChallengeEntries = mysqlTable("local_challenge_entries", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  videoId: int("videoId"),
  postId: int("postId"),
  caption: varchar("caption", { length: 280 }),
  votes: int("votes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LocalChallengeEntry = typeof localChallengeEntries.$inferSelect;
export type InsertLocalChallengeEntry = typeof localChallengeEntries.$inferInsert;

/**
 * AI content suggestions - saved drafts generated for a user.
 */
export const aiSuggestions = mysqlTable("ai_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  inputText: text("inputText").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  suggestedHashtags: text("suggestedHashtags").notNull(),
  tone: varchar("tone", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = typeof aiSuggestions.$inferInsert;

/**
 * Notification preferences let each user choose which in-app alerts they receive.
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  likesEnabled: boolean("likesEnabled").default(true).notNull(),
  commentsEnabled: boolean("commentsEnabled").default(true).notNull(),
  followsEnabled: boolean("followsEnabled").default(true).notNull(),
  challengesEnabled: boolean("challengesEnabled").default(true).notNull(),
  competitionsEnabled: boolean("competitionsEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

/**
 * Competitions are time-bound public contests with symbolic prizes and points.
 */
export const competitions = mysqlTable("competitions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["upcoming", "active", "completed"]).default("upcoming").notNull(),
  prizeTitle: varchar("prizeTitle", { length: 120 }).notNull(),
  prizeIcon: varchar("prizeIcon", { length: 40 }).default("trophy").notNull(),
  prizePoints: int("prizePoints").default(250).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = typeof competitions.$inferInsert;

export const competitionEntries = mysqlTable("competition_entries", {
  id: int("id").autoincrement().primaryKey(),
  competitionId: int("competitionId").notNull(),
  userId: int("userId").notNull(),
  videoId: int("videoId"),
  postId: int("postId"),
  caption: varchar("caption", { length: 280 }),
  votes: int("votes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitionEntry = typeof competitionEntries.$inferSelect;
export type InsertCompetitionEntry = typeof competitionEntries.$inferInsert;

export const competitionVotes = mysqlTable("competition_votes", {
  id: int("id").autoincrement().primaryKey(),
  competitionEntryId: int("competitionEntryId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitionVote = typeof competitionVotes.$inferSelect;
export type InsertCompetitionVote = typeof competitionVotes.$inferInsert;

export const competitionRewards = mysqlTable("competition_rewards", {
  id: int("id").autoincrement().primaryKey(),
  competitionId: int("competitionId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 40 }).default("trophy").notNull(),
  pointsAwarded: int("pointsAwarded").default(0).notNull(),
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
});

export type CompetitionReward = typeof competitionRewards.$inferSelect;
export type InsertCompetitionReward = typeof competitionRewards.$inferInsert;

/**
 * Creator analytics snapshots preserve daily totals for the growth chart.
 */
export const creatorAnalyticsSnapshots = mysqlTable("creator_analytics_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  snapshotDate: varchar("snapshotDate", { length: 10 }).notNull(),
  videoCount: int("videoCount").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  followerCount: int("followerCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreatorAnalyticsSnapshot = typeof creatorAnalyticsSnapshots.$inferSelect;
export type InsertCreatorAnalyticsSnapshot = typeof creatorAnalyticsSnapshots.$inferInsert;
