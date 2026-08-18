import { DEFAULT_CUSTOM_SUKKAH_FORM, normalizeFormSchema } from "../forms/form-schema.js";

function requireDatabase(env) {
  if (!env?.DB || typeof env.DB.prepare !== "function") {
    const error = new Error("The forms database is not configured.");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }
  return env.DB;
}

function clean(value, maximum = 300) {
  return String(value ?? "").trim().slice(0, maximum);
}

function safeJson(value) {
  try { return JSON.parse(String(value || "")); } catch { return null; }
}

function defaultRecord() {
  return {
    id: DEFAULT_CUSTOM_SUKKAH_FORM.id,
    slug: DEFAULT_CUSTOM_SUKKAH_FORM.slug,
    title: DEFAULT_CUSTOM_SUKKAH_FORM.title,
    description: DEFAULT_CUSTOM_SUKKAH_FORM.description,
    draft: DEFAULT_CUSTOM_SUKKAH_FORM,
    published: DEFAULT_CUSTOM_SUKKAH_FORM,
    publishedVersion: 1,
    isBuiltInDefault: true,
    versions: [],
  };
}

function rowToForm(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    draft: safeJson(row.draft_schema_json),
    publishedVersionId: row.published_version_id || "",
    publishedVersion: Number(row.published_version_number || 0),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by || "",
  };
}

export async function listForms({ env }) {
  const db = requireDatabase(env);
  const page = await db.prepare(`SELECT f.*, v.version_number AS published_version_number
    FROM forms f LEFT JOIN form_versions v ON v.id = f.published_version_id
    ORDER BY lower(f.title), f.id`).all();
  const forms = (page.results || []).map(rowToForm);
  if (!forms.some((form) => form.slug === DEFAULT_CUSTOM_SUKKAH_FORM.slug)) forms.unshift(defaultRecord());
  return forms;
}

export async function getFormById({ env, id }) {
  const db = requireDatabase(env);
  const row = await db.prepare(`SELECT f.*, v.version_number AS published_version_number
    FROM forms f LEFT JOIN form_versions v ON v.id = f.published_version_id WHERE f.id = ?`).bind(clean(id)).first();
  if (!row && clean(id) === DEFAULT_CUSTOM_SUKKAH_FORM.id) return defaultRecord();
  return row ? rowToForm(row) : null;
}

export async function getPublishedFormBySlug({ env, slug }) {
  const db = requireDatabase(env);
  const row = await db.prepare(`SELECT f.id, f.slug, f.title, f.description, v.id AS version_id,
      v.version_number, v.schema_json, v.published_at
    FROM forms f JOIN form_versions v ON v.id = f.published_version_id
    WHERE f.slug = ?`).bind(clean(slug).toLowerCase()).first();
  if (!row && clean(slug).toLowerCase() === DEFAULT_CUSTOM_SUKKAH_FORM.slug) {
    return { schema: DEFAULT_CUSTOM_SUKKAH_FORM, versionId: "built-in-1", versionNumber: 1 };
  }
  const schema = safeJson(row?.schema_json);
  return row && schema ? { schema, versionId: row.version_id, versionNumber: Number(row.version_number) } : null;
}

export async function createFormDraft({ env, schema, updatedBy, now = new Date().toISOString() }) {
  const normalized = normalizeFormSchema(schema, { allowMissingIdentity: true });
  if (!normalized.ok) return normalized;
  const db = requireDatabase(env);
  const id = normalized.schema.id || crypto.randomUUID();
  normalized.schema.id = id;
  const existing = await db.prepare("SELECT id FROM forms WHERE id = ? OR slug = ?").bind(id, normalized.schema.slug).first();
  if (existing) return { ok: false, status: 409, message: "A form with that name or URL already exists." };
  await db.prepare(`INSERT INTO forms (id, slug, title, description, draft_schema_json, published_version_id, created_at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)`)
    .bind(id, normalized.schema.slug, normalized.schema.title, normalized.schema.description, JSON.stringify(normalized.schema), now, now, clean(updatedBy).toLowerCase()).run();
  return { ok: true, form: await getFormById({ env, id }) };
}

export async function saveFormDraft({ env, id, schema, updatedBy, now = new Date().toISOString() }) {
  const normalized = normalizeFormSchema({ ...schema, id });
  if (!normalized.ok) return normalized;
  const db = requireDatabase(env);
  const conflict = await db.prepare("SELECT id FROM forms WHERE slug = ? AND id != ?").bind(normalized.schema.slug, clean(id)).first();
  if (conflict) return { ok: false, status: 409, message: "Another form already uses that URL." };
  let result = await db.prepare(`UPDATE forms SET slug = ?, title = ?, description = ?, draft_schema_json = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
    .bind(normalized.schema.slug, normalized.schema.title, normalized.schema.description, JSON.stringify(normalized.schema), now, clean(updatedBy).toLowerCase(), clean(id)).run();
  if (!Number(result?.meta?.changes || 0) && clean(id) === DEFAULT_CUSTOM_SUKKAH_FORM.id) {
    result = await db.prepare(`INSERT INTO forms (id, slug, title, description, draft_schema_json, published_version_id, created_at, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)`)
      .bind(clean(id), normalized.schema.slug, normalized.schema.title, normalized.schema.description, JSON.stringify(normalized.schema), now, now, clean(updatedBy).toLowerCase()).run();
  }
  if (!Number(result?.meta?.changes || 0)) return { ok: false, status: 404, message: "The form was not found." };
  return { ok: true, form: await getFormById({ env, id }) };
}

export async function publishForm({ env, id, updatedBy, now = new Date().toISOString() }) {
  const db = requireDatabase(env);
  let form = await getFormById({ env, id });
  if (form?.isBuiltInDefault) {
    const saved = await saveFormDraft({ env, id, schema: form.draft, updatedBy, now });
    if (!saved.ok) return saved;
    form = saved.form;
  }
  if (!form?.draft) return { ok: false, status: 404, message: "The form was not found." };
  const normalized = normalizeFormSchema(form.draft);
  if (!normalized.ok) return normalized;
  const nextVersion = Number(form.publishedVersion || 0) + 1;
  const versionId = crypto.randomUUID();
  await db.batch([
    db.prepare(`INSERT INTO form_versions (id, form_id, version_number, schema_json, published_at, published_by)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(versionId, clean(id), nextVersion, JSON.stringify(normalized.schema), now, clean(updatedBy).toLowerCase()),
    db.prepare("UPDATE forms SET published_version_id = ?, updated_at = ?, updated_by = ? WHERE id = ?")
      .bind(versionId, now, clean(updatedBy).toLowerCase(), clean(id)),
  ]);
  return { ok: true, form: await getFormById({ env, id }), versionId, versionNumber: nextVersion };
}

export async function listFormVersions({ env, id }) {
  const db = requireDatabase(env);
  const page = await db.prepare(`SELECT id, version_number, schema_json, published_at, published_by
    FROM form_versions WHERE form_id = ? ORDER BY version_number DESC`).bind(clean(id)).all();
  return (page.results || []).map((row) => ({
    id: row.id, versionNumber: Number(row.version_number), schema: safeJson(row.schema_json),
    publishedAt: row.published_at, publishedBy: row.published_by,
  }));
}

export async function restoreFormVersion({ env, id, versionId, updatedBy, now = new Date().toISOString() }) {
  const db = requireDatabase(env);
  const version = await db.prepare("SELECT schema_json FROM form_versions WHERE id = ? AND form_id = ?").bind(clean(versionId), clean(id)).first();
  const schema = safeJson(version?.schema_json);
  if (!schema) return { ok: false, status: 404, message: "That form version was not found." };
  return saveFormDraft({ env, id, schema, updatedBy, now });
}
