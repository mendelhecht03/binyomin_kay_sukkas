ALTER TABLE `submissions` ADD `approved_at` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `approved_by` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_submissions_type_status_approved` ON `submissions` (`type`,`status`,`approved_at`);