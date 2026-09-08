CREATE TABLE `ai_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inputText` text NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`suggestedHashtags` text NOT NULL,
	`tone` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_trend_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trendId` int NOT NULL,
	`userId` int NOT NULL,
	`videoId` int,
	`postId` int,
	`caption` varchar(280),
	`votes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_trend_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_trends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int,
	`title` varchar(180) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`description` text,
	`prompt` varchar(280) NOT NULL,
	`sourceVideoId` int,
	`status` enum('active','completed','draft') NOT NULL DEFAULT 'active',
	`participantCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `community_trends_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_trends_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `local_challenge_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`videoId` int,
	`postId` int,
	`caption` varchar(280),
	`votes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `local_challenge_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `local_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`scope` enum('global','city','community') NOT NULL DEFAULT 'global',
	`locationName` varchar(160),
	`communityName` varchar(160),
	`rewardPoints` int NOT NULL DEFAULT 100,
	`status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `local_challenges_id` PRIMARY KEY(`id`)
);
