CREATE TABLE `detections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plateNumber` varchar(64) NOT NULL,
	`confidence` int NOT NULL,
	`originalImageKey` varchar(255) NOT NULL,
	`croppedPlateKey` varchar(255) NOT NULL,
	`boundingBox` text NOT NULL,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `detections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `detections` ADD CONSTRAINT `detections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;