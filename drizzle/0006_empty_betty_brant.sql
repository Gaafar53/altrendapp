CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('video','comment','user') NOT NULL,
	`targetId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`status` enum('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`feedbackType` enum('bug','suggestion','praise','other') NOT NULL,
	`message` text NOT NULL,
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_feedback_id` PRIMARY KEY(`id`)
);
