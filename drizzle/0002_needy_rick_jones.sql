CREATE TABLE `form_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`schema_json` text NOT NULL,
	`published_at` text NOT NULL,
	`published_by` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_form_versions_form_number` ON `form_versions` (`form_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `idx_form_versions_form_published` ON `form_versions` (`form_id`,`published_at`);--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`draft_schema_json` text NOT NULL,
	`published_version_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_forms_slug` ON `forms` (`slug`);