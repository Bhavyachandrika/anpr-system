CREATE TABLE `videoDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoKey` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`frameCount` int NOT NULL,
	`duration` int NOT NULL,
	`fps` int NOT NULL DEFAULT 30,
	`totalDetections` int NOT NULL DEFAULT 0,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoDetections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoFrameDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoDetectionId` int NOT NULL,
	`frameNumber` int NOT NULL,
	`timestamp` int NOT NULL,
	`plateNumber` varchar(64) NOT NULL,
	`confidence` int NOT NULL,
	`croppedPlateKey` varchar(255) NOT NULL,
	`boundingBox` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoFrameDetections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `videoDetections` ADD CONSTRAINT `videoDetections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoFrameDetections` ADD CONSTRAINT `videoFrameDetections_videoDetectionId_videoDetections_id_fk` FOREIGN KEY (`videoDetectionId`) REFERENCES `videoDetections`(`id`) ON DELETE no action ON UPDATE no action;