import { FORM_DEFINITIONS, FORM_TYPES, getFormDefinition } from "../forms/registry.js";
import { PHOTO_ROUTE_PREFIX } from "../adapters/photo-storage.js";

const OMITTED_DETAIL_FIELDS = new Set([
  "submissionId", "submittedAt", "sourcePage", "status", "name", "firstName", "lastName",
  "phone", "email", "address", "addressLine1", "city", "state", "postalCode",
  "neighborhood", "neighborhoodOther", "photoLinks",
  "formId", "formSlug", "formTitle", "formVersionId", "formVersionNumber", "answers", "answerDetails",
]);

function requireDatabase(env) {
  if (!env?.DB || typeof env.DB.prepare !== "function") {
    const error = new Error("The submissions database is not configured.");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }
  return env.DB;
}

function encodeCursor(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const base64 = String(value).replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))));
    return decoded?.submittedAt && decoded?.id ? decoded : null;
  } catch {
    return null;
  }
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return clean(value) !== "";
}

function labelForField(field) {
  const labels = {
    addOns: "Add-ons", buildDate: "Setup date", buildDay: "Setup date",
    takeDownDate: "Takedown date", takeDownDay: "Takedown date",
    estimatedSize: "Estimated size", extraServiceRequired: "Extra service required",
    extraServiceDetails: "Extra service details", siteDescription: "Site description",
    reviewerOrganization: "Organization", reviewerContact: "Verification contact",
    publicationConsent: "Publication consent", sukkahType: "Sukkah type",
    requestedWork: "Requested work", service: "Requested work",
  };
  return labels[field] || field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function safeJson(value, fallback = {}) {
  try {
    const parsed = JSON.parse(String(value || ""));
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function fileUrl(origin, key) {
  const encoded = String(key).split("/").map(encodeURIComponent).join("/");
  return `${origin}${PHOTO_ROUTE_PREFIX}${encoded}`;
}

function rowToRecord(row, files, origin) {
  const data = safeJson(row.data_json);
  const customer = Object.fromEntries(Object.entries({
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone,
  }).filter(([, value]) => clean(value)));
  const location = Object.fromEntries(Object.entries({
    address: data.addressLine1 || data.address,
    city: data.city,
    state: data.state,
    zip: data.postalCode,
    neighborhood: row.neighborhood || data.neighborhoodOther || data.neighborhood,
  }).filter(([, value]) => clean(value)));
  const savedAnswerDetails = Array.isArray(data.answerDetails)
    ? data.answerDetails.filter((detail) => detail && hasValue(detail.value)).map((detail) => ({
        key: clean(detail.id), label: clean(detail.label) || labelForField(detail.id), value: detail.value,
      }))
    : [];
  const details = savedAnswerDetails.length ? savedAnswerDetails : Object.entries(data)
    .filter(([key, value]) => !OMITTED_DETAIL_FIELDS.has(key) && hasValue(value))
    .map(([key, value]) => ({ key, label: labelForField(key), value }));
  const photos = (files.get(row.id) || []).map((file, index) => ({
    url: fileUrl(origin, file.r2_key),
    label: file.original_name || `Site photo ${index + 1}`,
  }));

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    submittedAt: row.submitted_at,
    customer,
    ...(Object.keys(location).length ? { location } : {}),
    summary: row.summary || `${getFormDefinition(row.type)?.singularLabel || "Website"} submission`,
    answers: data,
    details,
    ...(photos.length ? { photos } : {}),
    source: { provider: "database", key: getFormDefinition(row.type)?.sourceKey || row.type },
  };
}

function testimonialApprovalData(row) {
  const data = safeJson(row?.data_json);
  return {
    name: clean(row?.customer_name || data.reviewerName),
    organization: clean(data.reviewerOrganization),
    testimonial: clean(data.testimonial),
    consent: clean(data.publicationConsent).toLowerCase(),
  };
}

export async function createSubmission(env, submission) {
  const db = requireDatabase(env);
  if (!FORM_TYPES.has(submission.type)) throw new Error("Unknown submission type.");
  const statements = [
    db.prepare(`INSERT INTO submissions (
      id, type, status, submitted_at, customer_name, customer_email,
      customer_phone, neighborhood, summary, data_json, source_page
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        submission.id,
        submission.type,
        submission.status || "New",
        submission.submittedAt,
        submission.customer?.name || "",
        submission.customer?.email || "",
        submission.customer?.phone || "",
        submission.location?.neighborhood || "",
        submission.summary || "Submission",
        JSON.stringify(submission.data || {}),
        submission.sourcePage || "",
      ),
    ...(submission.files || []).map((file) => db.prepare(`INSERT INTO submission_files (
      id, submission_id, r2_key, original_name, content_type, size_bytes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        file.id || crypto.randomUUID(),
        submission.id,
        file.key,
        file.originalName || "",
        file.contentType || "application/octet-stream",
        Number(file.sizeBytes) || 0,
        submission.submittedAt,
      )),
  ];
  await db.batch(statements);
  return { id: submission.id };
}

export async function listSubmissions({ env, type = "all", limit = 50, cursor, search = "", origin }) {
  const db = requireDatabase(env);
  if (type !== "all" && !FORM_TYPES.has(type)) {
    const error = new Error("Unknown dashboard type filter.");
    error.code = "INVALID_TYPE";
    throw error;
  }
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const conditions = [];
  const values = [];
  if (type !== "all") {
    conditions.push("type = ?");
    values.push(type);
  }
  const needle = clean(search).toLowerCase();
  if (needle) {
    conditions.push(`(
      lower(customer_name) LIKE ? OR lower(customer_email) LIKE ? OR
      lower(customer_phone) LIKE ? OR lower(neighborhood) LIKE ? OR lower(summary) LIKE ?
    )`);
    for (let index = 0; index < 5; index += 1) values.push(`%${needle}%`);
  }
  const cursorState = decodeCursor(cursor);
  if (cursorState) {
    conditions.push("(submitted_at < ? OR (submitted_at = ? AND id < ?))");
    values.push(cursorState.submittedAt, cursorState.submittedAt, cursorState.id);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const page = await db.prepare(`SELECT * FROM submissions ${where}
    ORDER BY submitted_at DESC, id DESC LIMIT ?`)
    .bind(...values, safeLimit + 1)
    .all();
  const rows = [...(page.results || [])];
  const hasMore = rows.length > safeLimit;
  const visibleRows = hasMore ? rows.slice(0, safeLimit) : rows;
  const files = new Map();
  if (visibleRows.length) {
    const placeholders = visibleRows.map(() => "?").join(", ");
    const filePage = await db.prepare(`SELECT submission_id, r2_key, original_name
      FROM submission_files WHERE submission_id IN (${placeholders}) ORDER BY created_at, id`)
      .bind(...visibleRows.map((row) => row.id))
      .all();
    for (const file of filePage.results || []) {
      if (!files.has(file.submission_id)) files.set(file.submission_id, []);
      files.get(file.submission_id).push(file);
    }
  }
  const last = visibleRows.at(-1);
  return {
    submissions: visibleRows.map((row) => rowToRecord(row, files, origin)),
    ...(hasMore && last ? { nextCursor: encodeCursor({ submittedAt: last.submitted_at, id: last.id }) } : {}),
  };
}

export async function deleteSubmissionRecord({ env, type, id }) {
  if (!FORM_TYPES.has(type) || !clean(id) || clean(id).length > 300) {
    const error = new Error("The submission could not be identified.");
    error.code = "INVALID_SUBMISSION";
    throw error;
  }
  const db = requireDatabase(env);
  const filesPage = await db.prepare(`SELECT r2_key FROM submission_files
    WHERE submission_id = ? AND EXISTS (
      SELECT 1 FROM submissions WHERE id = ? AND type = ?
    ) ORDER BY created_at, id`).bind(id, id, type).all();
  const result = await db.prepare("DELETE FROM submissions WHERE id = ? AND type = ?").bind(id, type).run();
  if (!Number(result?.meta?.changes || 0)) {
    const error = new Error("The submission was not found.");
    error.code = "SUBMISSION_NOT_FOUND";
    throw error;
  }
  return { photoKeys: (filesPage.results || []).map((file) => file.r2_key).filter(Boolean) };
}

export async function approveTestimonialRecord({ env, id, approvedBy, approvedAt = new Date().toISOString() }) {
  if (!clean(id) || clean(id).length > 300 || !clean(approvedBy)) {
    const error = new Error("The testimonial could not be identified.");
    error.code = "INVALID_TESTIMONIAL";
    throw error;
  }
  const db = requireDatabase(env);
  const row = await db.prepare(`SELECT id, status, customer_name, data_json
    FROM submissions WHERE id = ? AND type = 'testimonial'`).bind(id).first();
  if (!row) {
    const error = new Error("The testimonial was not found.");
    error.code = "SUBMISSION_NOT_FOUND";
    throw error;
  }
  const testimonial = testimonialApprovalData(row);
  if (!testimonial.name || !testimonial.testimonial || testimonial.consent !== "yes") {
    const error = new Error("The testimonial does not have the information required for publication.");
    error.code = "TESTIMONIAL_NOT_PUBLISHABLE";
    throw error;
  }
  if (row.status === "Approved") return { id, status: "Approved", alreadyApproved: true };
  if (row.status !== "Pending review") {
    const error = new Error("The testimonial is not waiting for review.");
    error.code = "INVALID_TESTIMONIAL_STATUS";
    throw error;
  }
  const result = await db.prepare(`UPDATE submissions
    SET status = 'Approved', approved_at = ?, approved_by = ?
    WHERE id = ? AND type = 'testimonial' AND status = 'Pending review'`)
    .bind(approvedAt, clean(approvedBy).toLowerCase(), id)
    .run();
  if (!Number(result?.meta?.changes || 0)) {
    const error = new Error("The testimonial review status changed before approval completed.");
    error.code = "APPROVAL_CONFLICT";
    throw error;
  }
  return { id, status: "Approved", approvedAt };
}

export async function listApprovedTestimonials({ env, limit = 20 }) {
  const db = requireDatabase(env);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const page = await db.prepare(`SELECT id, customer_name, data_json, approved_at
    FROM submissions
    WHERE type = 'testimonial' AND status = 'Approved'
    ORDER BY approved_at DESC, submitted_at DESC, id DESC
    LIMIT ?`).bind(safeLimit).all();
  return (page.results || []).map((row) => {
    const testimonial = testimonialApprovalData(row);
    return {
      id: row.id,
      name: testimonial.name,
      organization: testimonial.organization,
      testimonial: testimonial.testimonial,
      approvedAt: row.approved_at,
    };
  }).filter((testimonial) => testimonial.name && testimonial.testimonial);
}

export function databaseSourceStatuses(ok, message) {
  return Object.fromEntries(FORM_DEFINITIONS.map((definition) => [
    definition.sourceKey,
    ok ? { ok: true } : { ok: false, error: message || "Submissions are temporarily unavailable." },
  ]));
}

export const submissionCursor = { encode: encodeCursor, decode: decodeCursor };
