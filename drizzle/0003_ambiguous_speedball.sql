CREATE TABLE `google_sheet_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`spreadsheet_id` text NOT NULL,
	`submission_id` text NOT NULL,
	`sheet_title` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'exported' NOT NULL,
	`exported_at` text,
	`exported_by` text DEFAULT '' NOT NULL,
	`last_error` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_google_sheet_exports_sheet_submission` ON `google_sheet_exports` (`spreadsheet_id`,`submission_id`);--> statement-breakpoint
CREATE INDEX `idx_google_sheet_exports_submission` ON `google_sheet_exports` (`submission_id`);--> statement-breakpoint
CREATE TABLE `google_sheet_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`spreadsheet_id` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text DEFAULT '' NOT NULL
);
