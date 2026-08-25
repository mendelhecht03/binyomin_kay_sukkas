import { DEFAULT_MANAGED_FORMS, normalizeFormSchema } from "../forms/form-schema.js";
import { wallMaterialOptions } from "../../data/wall-materials.js";

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

function defaultRecord(schema) {
  return {
    id: schema.id,
    slug: schema.slug,
    title: schema.title,
    description: schema.description,
    draft: schema,
    published: schema,
    publishedVersion: 1,
    isBuiltInDefault: true,
    versions: [],
  };
}

function rowToForm(row) {
  const rawDraft = safeJson(row.draft_schema_json);
  const normalizedDraft = normalizeFormSchema(rawDraft);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    draft: normalizedDraft.ok ? normalizedDraft.schema : rawDraft,
    publishedVersionId: row.published_version_id || "",
    publishedVersion: Number(row.published_version_number || 0),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by || "",
    isBuiltInDefault: DEFAULT_MANAGED_FORMS.some((schema) => schema.id === row.id),
  };
}

export async function listForms({ env }) {
  const db = requireDatabase(env);
  const page = await db.prepare(`SELECT f.*, v.version_number AS published_version_number
    FROM forms f LEFT JOIN form_versions v ON v.id = f.published_version_id
    ORDER BY lower(f.title), f.id`).all();
  const forms = (page.results || []).map(rowToForm);
  for (const schema of [...DEFAULT_MANAGED_FORMS].reverse()) {
    if (!forms.some((form) => form.id === schema.id)) forms.unshift(defaultRecord(schema));
  }
  return forms;
}

export async function getFormById({ env, id }) {
  const db = requireDatabase(env);
  const row = await db.prepare(`SELECT f.*, v.version_number AS published_version_number
    FROM forms f LEFT JOIN form_versions v ON v.id = f.published_version_id WHERE f.id = ?`).bind(clean(id)).first();
  const builtIn = DEFAULT_MANAGED_FORMS.find((schema) => schema.id === clean(id));
  if (!row && builtIn) return defaultRecord(builtIn);
  return row ? rowToForm(row) : null;
}

export async function getPublishedFormBySlug({ env, slug }) {
  const db = requireDatabase(env);
  const row = await db.prepare(`SELECT f.id, f.slug, f.title, f.description, v.id AS version_id,
      v.version_number, v.schema_json, v.published_at
    FROM forms f JOIN form_versions v ON v.id = f.published_version_id
    WHERE f.slug = ?`).bind(clean(slug).toLowerCase()).first();
  const builtIn = DEFAULT_MANAGED_FORMS.find((schema) => schema.slug === clean(slug).toLowerCase());
  if (!row && builtIn) {
    return { schema: builtIn, versionId: "built-in-1", versionNumber: 1 };
  }
  const schema = safeJson(row?.schema_json);
  const normalized = normalizeFormSchema(schema);
  return row && normalized.ok ? { schema: normalized.schema, versionId: row.version_id, versionNumber: Number(row.version_number) } : null;
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
  const builtIn = DEFAULT_MANAGED_FORMS.find((item) => item.id === clean(id));
  if (builtIn) normalized.schema.slug = builtIn.slug;
  const db = requireDatabase(env);
  const conflict = await db.prepare("SELECT id FROM forms WHERE slug = ? AND id != ?").bind(normalized.schema.slug, clean(id)).first();
  if (conflict) return { ok: false, status: 409, message: "Another form already uses that URL." };
  let result = await db.prepare(`UPDATE forms SET slug = ?, title = ?, description = ?, draft_schema_json = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
    .bind(normalized.schema.slug, normalized.schema.title, normalized.schema.description, JSON.stringify(normalized.schema), now, clean(updatedBy).toLowerCase(), clean(id)).run();
  if (!Number(result?.meta?.changes || 0) && DEFAULT_MANAGED_FORMS.some((schema) => schema.id === clean(id))) {
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

const REFERRAL_HELP_TEXT = "This information helps us understand which advertising channels are most effective.";
const WALL_MATERIAL_FIELD = Object.freeze({
  id: "tarpStyle",
  type: "select",
  label: "Which wall option would you like to discuss?",
  required: true,
  helpText: "Choose from the wall options shown on the package page.",
  options: [...wallMaterialOptions],
});

function addBeforeOther(options, values) {
  const next = [...(Array.isArray(options) ? options : [])];
  for (const value of values) {
    if (next.includes(value)) continue;
    const otherIndex = next.indexOf("Other");
    next.splice(otherIndex >= 0 ? otherIndex : next.length, 0, value);
  }
  return next;
}

function applyRequestedFormUpdates(schema) {
  const next = JSON.parse(JSON.stringify(schema));
  let changed = false;

  for (const step of next.steps || []) {
    const originalFields = step.fields || [];
    if (next.id === "purchases") {
      step.fields = originalFields.filter((field) => !["sukkahType", "sukkahTypeOther"].includes(field.id));
      if (step.fields.length !== originalFields.length) changed = true;
      if (step.id === "options" && !step.fields.some((field) => field.id === WALL_MATERIAL_FIELD.id)) {
        const frameIndex = step.fields.findIndex((field) => field.id === "framePreference");
        step.fields.splice(frameIndex >= 0 ? frameIndex + 1 : 0, 0, { ...WALL_MATERIAL_FIELD, options: [...WALL_MATERIAL_FIELD.options] });
        changed = true;
      }
    }

    for (const field of step.fields || []) {
      if (field.label === "How did you hear about us?" && field.helpText !== REFERRAL_HELP_TEXT) {
        field.helpText = REFERRAL_HELP_TEXT;
        changed = true;
      }
      if (["rentals", "purchases"].includes(next.id) && field.id === WALL_MATERIAL_FIELD.id) {
        for (const [key, value] of Object.entries(WALL_MATERIAL_FIELD)) {
          const expected = Array.isArray(value) ? [...value] : value;
          if (JSON.stringify(field[key]) === JSON.stringify(expected)) continue;
          field[key] = expected;
          changed = true;
        }
      }
      if (next.id !== "builds") continue;
      if (field.id === "service") {
        const options = addBeforeOther(field.options, ["Take out of storage"]);
        if (JSON.stringify(options) !== JSON.stringify(field.options || [])) {
          field.options = options;
          changed = true;
        }
      }
      if (field.id === "sukkahType") {
        const renamed = (field.options || []).map((option) => option === "Canvas" ? "Classical white poles" : option);
        let options = addBeforeOther(renamed, ["Round conduit canvas", "Schach, beam and canvas"]);
        options = [...new Set(options)];
        if (JSON.stringify(options) !== JSON.stringify(field.options || [])) {
          field.options = options;
          changed = true;
        }
      }
    }
  }
  return { schema: next, changed };
}

export async function publishRequestedBuiltInUpdates({ env, updatedBy, now = new Date().toISOString() }) {
  const results = [];
  for (const builtIn of DEFAULT_MANAGED_FORMS) {
    const savedForm = await getFormById({ env, id: builtIn.id });
    if (!savedForm || !savedForm.publishedVersionId) {
      results.push({ id: builtIn.id, changed: false, reason: "built-in-default" });
      continue;
    }

    const published = await getPublishedFormBySlug({ env, slug: savedForm.slug });
    const publishedUpdate = applyRequestedFormUpdates(published?.schema);
    const draftUpdate = applyRequestedFormUpdates(savedForm.draft);
    if (!publishedUpdate.changed) {
      if (draftUpdate.changed) await saveFormDraft({ env, id: builtIn.id, schema: draftUpdate.schema, updatedBy, now });
      results.push({ id: builtIn.id, changed: false, reason: "already-current" });
      continue;
    }

    const prepared = await saveFormDraft({ env, id: builtIn.id, schema: publishedUpdate.schema, updatedBy, now });
    if (!prepared.ok) return prepared;
    const publishedResult = await publishForm({ env, id: builtIn.id, updatedBy, now });
    if (!publishedResult.ok) return publishedResult;
    if (JSON.stringify(draftUpdate.schema) !== JSON.stringify(publishedUpdate.schema)) {
      const restoredDraft = await saveFormDraft({ env, id: builtIn.id, schema: draftUpdate.schema, updatedBy, now });
      if (!restoredDraft.ok) return restoredDraft;
    }
    results.push({ id: builtIn.id, changed: true, versionNumber: publishedResult.versionNumber });
  }
  return { ok: true, forms: results };
}
