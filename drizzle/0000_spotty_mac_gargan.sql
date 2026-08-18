CREATE TABLE `submission_files` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`original_name` text DEFAULT '' NOT NULL,
	`content_type` text DEFAULT 'application/octet-stream' NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submission_files_r2_key_unique` ON `submission_files` (`r2_key`);--> statement-breakpoint
CREATE INDEX `idx_submission_files_submission_id` ON `submission_files` (`submission_id`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`submitted_at` text NOT NULL,
	`customer_name` text DEFAULT '' NOT NULL,
	`customer_email` text DEFAULT '' NOT NULL,
	`customer_phone` text DEFAULT '' NOT NULL,
	`neighborhood` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT 'Submission' NOT NULL,
	`data_json` text DEFAULT '{}' NOT NULL,
	`source_page` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_submitted` ON `submissions` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `idx_submissions_type_submitted` ON `submissions` (`type`,`submitted_at`);
--> statement-breakpoint
PRAGMA optimize;
