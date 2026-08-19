const SETTINGS_ID = 1;

function requireDatabase(env) {
  if (!env?.DB || typeof env.DB.prepare !== "function") {
    const error = new Error("The submissions database is not configured.");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }
  return env.DB;
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}

export async function getGoogleSheetSettings({ env }) {
  const db = requireDatabase(env);
  return db.prepare(`SELECT id, spreadsheet_id, updated_at, updated_by
    FROM google_sheet_settings WHERE id = ?`).bind(SETTINGS_ID).first();
}

export async function saveGoogleSheetSettings({ env, spreadsheetId, updatedBy, updatedAt = new Date().toISOString() }) {
  const db = requireDatabase(env);
  await db.prepare(`INSERT INTO google_sheet_settings (id, spreadsheet_id, updated_at, updated_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET spreadsheet_id = excluded.spreadsheet_id,
      updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .bind(SETTINGS_ID, clean(spreadsheetId), updatedAt, clean(updatedBy)).run();
  return getGoogleSheetSettings({ env });
}

export async function findGoogleSheetExport({ env, spreadsheetId, submissionId }) {
  const db = requireDatabase(env);
  return db.prepare(`SELECT id, spreadsheet_id, submission_id, sheet_title, status,
    exported_at, exported_by, last_error
    FROM google_sheet_exports WHERE spreadsheet_id = ? AND submission_id = ?`)
    .bind(clean(spreadsheetId), clean(submissionId)).first();
}

export async function recordGoogleSheetExport({
  env,
  spreadsheetId,
  submissionId,
  sheetTitle,
  status = "exported",
  exportedAt = status === "exported" ? new Date().toISOString() : null,
  exportedBy = "",
  lastError = "",
}) {
  const db = requireDatabase(env);
  const id = `${clean(spreadsheetId)}:${clean(submissionId)}`.slice(0, 300);
  await db.prepare(`INSERT INTO google_sheet_exports (
      id, spreadsheet_id, submission_id, sheet_title, status, exported_at, exported_by, last_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(spreadsheet_id, submission_id) DO UPDATE SET
      sheet_title = excluded.sheet_title, status = excluded.status,
      exported_at = excluded.exported_at, exported_by = excluded.exported_by,
      last_error = excluded.last_error`)
    .bind(id, clean(spreadsheetId), clean(submissionId), clean(sheetTitle), clean(status), exportedAt, clean(exportedBy), clean(lastError).slice(0, 500))
    .run();
  return { id, status };
}

export async function claimGoogleSheetExport({ env, spreadsheetId, submissionId, sheetTitle, exportedBy }) {
  const db = requireDatabase(env);
  const id = `${clean(spreadsheetId)}:${clean(submissionId)}`.slice(0, 300);
  const result = await db.prepare(`INSERT INTO google_sheet_exports (
      id, spreadsheet_id, submission_id, sheet_title, status, exported_by, last_error
    ) VALUES (?, ?, ?, ?, 'pending', ?, '')
    ON CONFLICT(spreadsheet_id, submission_id) DO UPDATE SET
      sheet_title = excluded.sheet_title, status = 'pending', exported_by = excluded.exported_by,
      last_error = ''
    WHERE google_sheet_exports.status <> 'pending'`)
    .bind(id, clean(spreadsheetId), clean(submissionId), clean(sheetTitle), clean(exportedBy)).run();
  return Number(result?.meta?.changes || 0) > 0;
}
