import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("New"),
  submittedAt: text("submitted_at").notNull(),
  customerName: text("customer_name").notNull().default(""),
  customerEmail: text("customer_email").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  neighborhood: text("neighborhood").notNull().default(""),
  summary: text("summary").notNull().default("Submission"),
  dataJson: text("data_json").notNull().default("{}"),
  sourcePage: text("source_page").notNull().default(""),
  approvedAt: text("approved_at"),
  approvedBy: text("approved_by").notNull().default(""),
}, (table) => [
  index("idx_submissions_submitted").on(table.submittedAt),
  index("idx_submissions_type_submitted").on(table.type, table.submittedAt),
  index("idx_submissions_type_status_approved").on(table.type, table.status, table.approvedAt),
]);

export const submissionFiles = sqliteTable("submission_files", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  r2Key: text("r2_key").notNull().unique(),
  originalName: text("original_name").notNull().default(""),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_submission_files_submission_id").on(table.submissionId),
]);

export const forms = sqliteTable("forms", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  draftSchemaJson: text("draft_schema_json").notNull(),
  publishedVersionId: text("published_version_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull().default(""),
}, (table) => [
  uniqueIndex("idx_forms_slug").on(table.slug),
]);

export const formVersions = sqliteTable("form_versions", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  schemaJson: text("schema_json").notNull(),
  publishedAt: text("published_at").notNull(),
  publishedBy: text("published_by").notNull().default(""),
}, (table) => [
  uniqueIndex("idx_form_versions_form_number").on(table.formId, table.versionNumber),
  index("idx_form_versions_form_published").on(table.formId, table.publishedAt),
]);
