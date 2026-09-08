CREATE TABLE `competition_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitionId` int NOT NULL,
	`userId` int NOT NULL,
	`videoId` int,
	`postId` int,
	`caption` varchar(280),
	`votes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competition_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competition_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitionId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`icon` varchar(40) NOT NULL DEFAULT 'trophy',
	`pointsAwarded` int NOT NULL DEFAULT 0,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competition_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competition_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitionEntryId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competition_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`category` varchar(80) NOT NULL,
	`status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
	`prizeTitle` varchar(120) NOT NULL,
	`prizeIcon` varchar(40) NOT NULL DEFAULT 'trophy',
	`prizePoints` int NOT NULL DEFAULT 250,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_analytics_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`snapshotDate` varchar(10) NOT NULL,
	`videoCount` int NOT NULL DEFAULT 0,
	`viewCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`followerCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_analytics_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`likesEnabled` boolean NOT NULL DEFAULT true,
	`commentsEnabled` boolean NOT NULL DEFAULT true,
	`followsEnabled` boolean NOT NULL DEFAULT true,
	`challengesEnabled` boolean NOT NULL DEFAULT true,
	`competitionsEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('like','comment','follow','message','challenge','competition','winner') NOT NULL;