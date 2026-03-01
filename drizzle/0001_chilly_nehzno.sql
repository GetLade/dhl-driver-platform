CREATE TABLE `n8n_webhook_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataType` varchar(32) NOT NULL,
	`payload` text NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `n8n_webhook_data_id` PRIMARY KEY(`id`)
);
