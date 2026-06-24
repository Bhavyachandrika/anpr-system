CREATE TABLE `detections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plateNumber` varchar(20) NOT NULL,
	`confidence` int NOT NULL,
	`originalImageKey` text NOT NULL,
	`croppedPlateKey` text NOT NULL,
	`boundingBox` text,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `detections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `videoDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoKey` text NOT NULL,
	`frameCount` int DEFAULT 0,
	`duration` float DEFAULT 0,
	`fps` float DEFAULT 0,
	`status` varchar(20) DEFAULT 'pending',
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoDetections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoFrameDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoDetectionId` int NOT NULL,
	`frameNumber` int NOT NULL,
	`plateNumber` varchar(20),
	`confidence` int,
	`boundingBox` text,
	`croppedPlateKey` text,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoFrameDetections_id` PRIMARY KEY(`id`)
);
