import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
