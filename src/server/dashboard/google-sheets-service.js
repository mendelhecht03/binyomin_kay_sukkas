import { getFormDefinition } from "../forms/registry.js";
import { getSubmissionRecord, listSubmissions } from "../storage/submission-repository.js";
import {
  claimGoogleSheetExport,
  getGoogleSheetSettings,
  recordGoogleSheetExport,
  saveGoogleSheetSettings,
} from "../storage/google-sheet-repository.js";
import {
  appendSheetRow,
  ensureSheets,
  getSpreadsheet,
  parseSpreadsheetId,
  prepareSheet,
  readSheetValues,
  sortSheetBySubmittedAt,
} from "../integrations/google-sheets-client.js";

const BASE_HEADERS = [
  "Submission ID", "Submitted At", "Status", "Name", "Email", "Phone",
  "Neighborhood", "Summary", "Photos",
];
const OMITTED_GROUP_TYPES = new Set(["testimonial"]);

function clean(value) {
  return String(value == null ? "" : value).trim();
}

function displayCell(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return clean(value);
}

function tabTitleFor(title, slug) {
  const cleaned = clean(title).replace(/[\[\]*\\/:?]/g, "-").replace(/\s+/g, " ").trim();
  const fallback = clean(slug).replace(/[^a-zA-Z0-9_-]+/g, "-") || "Requests";
  return (cleaned || fallback).slice(0, 95);
}

function groupIdentity(record) {
  const answers = record.answers && typeof record.answers === "object" ? record.answers : {};
  const definition = getFormDefinition(record.type);
  const slug = clean(answers.formSlug) || definition?.sourceKey || record.type;
  const title = clean(answers.formTitle) || definition?.label || "Requests";
  return { key: slug, title, slug };
}

function groupRecords(records) {
  const groups = new Map();
  for (const record of records) {
    if (!record || OMITTED_GROUP_TYPES.has(record.type)) continue;
    const group = groupIdentity(record);
    if (!groups.has(group.key)) groups.set(group.key, { ...group, records: [] });
    groups.get(group.key).records.push(record);
  }
  const usedTitles = new Set();
  return [...groups.values()].map((group) => {
    let title = tabTitleFor(group.title, group.slug);
    if (usedTitles.has(title)) title = `${title} (${group.slug})`.slice(0, 100);
    usedTitles.add(title);
    group.records.sort((a, b) => {
      const dateOrder = String(a.submittedAt).localeCompare(String(b.submittedAt));
      return dateOrder || String(a.id).localeCompare(String(b.id));
    });
    return { ...group, title, records: group.records };
  }).sort((a, b) => a.title.localeCompare(b.title));
}

function recordDetails(record) {
  const values = new Map();
  for (const detail of record.details || []) {
    const label = clean(detail?.label) || clean(detail?.key);
    if (label && !values.has(label)) values.set(label, displayCell(detail.value));
  }
  return values;
}

function rowForRecord(record, headers) {
  const details = recordDetails(record);
  const values = {
    "Submission ID": record.id,
    "Submitted At": record.submittedAt,
    Status: record.status || "New",
    Name: record.customer?.name || "",
    Email: record.customer?.email || "",
    Phone: record.customer?.phone || "",
    Neighborhood: record.location?.neighborhood || "",
    Summary: record.summary || "",
    Photos: (record.photos || []).map((photo) => photo.label).join(", "),
  };
  details.forEach((value, label) => { values[label] = value; });
  return Object.fromEntries(headers.map((header) => [header, values[header] ?? ""]));
}

function headersForRecords(records, existingHeaders = []) {
  const labels = new Set();
  records.forEach((record) => recordDetails(record).forEach((_, label) => labels.add(label)));
  return [...new Set([...BASE_HEADERS, ...existingHeaders, ...[...labels].sort((a, b) => a.localeCompare(b))])];
}

async function loadAllNonTestimonials({ env, origin }) {
  const records = [];
  let skippedTestimonials = 0;
  let cursor = "";
  do {
    const page = await listSubmissions({ env, type: "all", limit: 100, cursor: cursor || undefined, origin });
    for (const record of page.submissions || []) {
      if (OMITTED_GROUP_TYPES.has(record.type)) skippedTestimonials += 1;
      else records.push(record);
    }
    const nextCursor = page.nextCursor || "";
    if (nextCursor === cursor) break;
    cursor = nextCursor;
  } while (cursor);
  return { records, skippedTestimonials };
}

function syncStatusMessage(status, { dashboardCount, sheetCount, missingCount, staleCount, duplicateCount }) {
  const requests = `${dashboardCount} dashboard request${dashboardCount === 1 ? "" : "s"}`;
  if (status === "synced") return dashboardCount ? `Synced · ${requests} in the Sheet.` : "Synced · No requests to export.";
  if (status === "needs-export") {
    return `${missingCount} request${missingCount === 1 ? " is" : "s are"} missing from the Sheet. Click Export all requests.`;
  }
  if (status === "needs-attention") {
    const details = [
      staleCount ? `${staleCount} old row${staleCount === 1 ? "" : "s"}` : "",
      duplicateCount ? `${duplicateCount} duplicate row${duplicateCount === 1 ? "" : "s"}` : "",
    ].filter(Boolean).join(" and ");
    return details ? `Needs review · ${details} found in the Sheet.` : `Needs review · ${sheetCount} Sheet row${sheetCount === 1 ? "" : "s"} found.`;
  }
  return "Sync status could not be checked.";
}

export async function getGoogleSheetsSyncStatus({ env, spreadsheetId, origin, loadedRecords = null }) {
  const loaded = loadedRecords || await loadAllNonTestimonials({ env, origin });
  const spreadsheet = await getSpreadsheet(env, spreadsheetId);
  const groups = groupRecords(loaded.records);
  const expectedByTitle = new Map(groups.map((group) => [group.title, new Set(group.records.map((record) => record.id))]));
  const expectedIds = new Set(loaded.records.map((record) => record.id));
  const idsByTitle = new Map();
  const idLocations = new Map();
  let sheetCount = 0;
  let duplicateCount = 0;

  for (const sheet of spreadsheet.sheets || []) {
    const title = clean(sheet.properties?.title);
    if (!title) continue;
    const rows = await readSheetValues(env, spreadsheetId, title);
    if (clean(rows[0]?.[0]) !== "Submission ID") continue;
    const ids = new Set();
    for (const row of rows.slice(1)) {
      const id = clean(row?.[0]);
      if (!id) continue;
      sheetCount += 1;
      if (ids.has(id)) duplicateCount += 1;
      ids.add(id);
      const locations = idLocations.get(id) || [];
      locations.push(title);
      idLocations.set(id, locations);
    }
    idsByTitle.set(title, ids);
  }

  let missingCount = 0;
  for (const [title, expected] of expectedByTitle) {
    const actual = idsByTitle.get(title) || new Set();
    expected.forEach((id) => { if (!actual.has(id)) missingCount += 1; });
  }
  let staleCount = 0;
  for (const [id, locations] of idLocations) {
    if (!expectedIds.has(id)) staleCount += 1;
    const uniqueLocations = new Set(locations);
    if (uniqueLocations.size > 1) duplicateCount += uniqueLocations.size - 1;
  }

  const status = missingCount ? "needs-export" : (staleCount || duplicateCount ? "needs-attention" : "synced");
  return {
    status,
    dashboardCount: loaded.records.length,
    sheetCount,
    missingCount,
    staleCount,
    duplicateCount,
    excludedTestimonials: loaded.skippedTestimonials,
    checkedAt: new Date().toISOString(),
    message: syncStatusMessage(status, { dashboardCount: loaded.records.length, sheetCount, missingCount, staleCount, duplicateCount }),
  };
}

async function safeSyncStatus({ env, spreadsheetId, origin, loadedRecords = null }) {
  try {
    return await getGoogleSheetsSyncStatus({ env, spreadsheetId, origin, loadedRecords });
  } catch (error) {
    return { status: "check-failed", message: error.message || "Sync status could not be checked." };
  }
}

function serviceError(error, fallback = "The Google Sheets export could not be completed.") {
  if (error?.code) return error;
  const wrapped = new Error(fallback);
  wrapped.code = "GOOGLE_SHEETS_ERROR";
  wrapped.status = 502;
  wrapped.cause = error;
  return wrapped;
}

export async function getGoogleSheetsSettings({ env, origin }) {
  const row = await getGoogleSheetSettings({ env });
  let spreadsheetTitle = "";
  let accessMessage = "";
  const configured = Boolean(env?.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && env?.GOOGLE_SHEETS_PRIVATE_KEY);
  let sync = null;
  if (row?.spreadsheet_id && configured) {
    try {
      const spreadsheet = await getSpreadsheet(env, row.spreadsheet_id);
      spreadsheetTitle = clean(spreadsheet?.properties?.title);
      sync = await safeSyncStatus({ env, spreadsheetId: row.spreadsheet_id, origin });
    } catch (error) {
      accessMessage = error.message || "The Sheet could not be reached.";
    }
  } else if (row?.spreadsheet_id && !configured) {
    accessMessage = "Google Sheets credentials have not been configured for this site yet.";
  }
  return {
    ok: true,
    spreadsheetId: row?.spreadsheet_id || "",
    spreadsheetTitle,
    updatedAt: row?.updated_at || "",
    serviceAccountEmail: String(env?.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || "").trim(),
    configured,
    accessMessage,
    sync,
  };
}

export async function saveAndTestGoogleSheet({ env, spreadsheetValue, updatedBy, origin }) {
  const spreadsheetId = parseSpreadsheetId(spreadsheetValue);
  if (!spreadsheetId) {
    const error = new Error("Enter a valid Google Sheet URL or spreadsheet ID.");
    error.code = "INVALID_SPREADSHEET_ID";
    error.status = 400;
    throw error;
  }
  const spreadsheet = await getSpreadsheet(env, spreadsheetId);
  const saved = await saveGoogleSheetSettings({ env, spreadsheetId, updatedBy });
  return {
    ok: true,
    spreadsheetId: saved.spreadsheet_id,
    spreadsheetTitle: clean(spreadsheet?.properties?.title),
    serviceAccountEmail: String(env?.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || "").trim(),
    configured: true,
    message: "The Sheet is connected and ready for exports.",
    sync: await safeSyncStatus({ env, spreadsheetId, origin }),
  };
}

export async function testConfiguredGoogleSheet({ env, origin }) {
  const settings = await getGoogleSheetSettings({ env });
  if (!settings?.spreadsheet_id) {
    const error = new Error("Save a Google Sheet URL before testing the connection.");
    error.code = "GOOGLE_SHEETS_NOT_CONFIGURED";
    error.status = 400;
    throw error;
  }
  const spreadsheet = await getSpreadsheet(env, settings.spreadsheet_id);
  return {
    ok: true,
    spreadsheetTitle: clean(spreadsheet?.properties?.title),
    message: "The Sheet connection is working.",
    sync: await safeSyncStatus({ env, spreadsheetId: settings.spreadsheet_id, origin }),
  };
}

export async function exportGoogleSheetSubmissions({ env, submissionId, exportedBy, origin }) {
  const settings = await getGoogleSheetSettings({ env });
  const spreadsheetId = settings?.spreadsheet_id;
  if (!spreadsheetId) {
    const error = new Error("Save a Google Sheet URL before exporting submissions.");
    error.code = "GOOGLE_SHEETS_NOT_CONFIGURED";
    error.status = 400;
    throw error;
  }
  let skippedTestimonials = 0;
  const records = submissionId
    ? [await getSubmissionRecord({ env, id: submissionId, origin })]
    : [];
  if (!submissionId) {
    const loaded = await loadAllNonTestimonials({ env, origin });
    records.push(...loaded.records);
    skippedTestimonials = loaded.skippedTestimonials;
  }
  if (records.some((record) => OMITTED_GROUP_TYPES.has(record.type))) {
    const error = new Error("Testimonials are not included in Google Sheets exports.");
    error.code = "TESTIMONIAL_EXPORT_FORBIDDEN";
    error.status = 400;
    throw error;
  }
  const groups = groupRecords(records);
  if (!groups.length) return {
    ok: true, exported: 0, alreadyPresent: 0, skippedTestimonials, failed: 0,
    message: skippedTestimonials ? `No requests to export. ${skippedTestimonials} testimonial${skippedTestimonials === 1 ? " was" : "s were"} skipped.` : "There are no non-testimonial submissions to export.",
    sync: await safeSyncStatus({ env, spreadsheetId, origin, loadedRecords: { records: [], skippedTestimonials } }),
  };

  const { sheets } = await ensureSheets(env, spreadsheetId, groups.map((group) => group.title));
  let exported = 0;
  let alreadyPresent = 0;
  let inProgress = 0;
  const failures = [];
  for (const group of groups) {
    const prepared = await prepareSheet(env, spreadsheetId, group.title, headersForRecords(group.records));
    const existingIds = new Set(prepared.rows.slice(1).map((row) => clean(row?.[0])).filter(Boolean));
    for (const record of group.records) {
      if (existingIds.has(record.id)) {
        alreadyPresent += 1;
        await recordGoogleSheetExport({ env, spreadsheetId, submissionId: record.id, sheetTitle: group.title, exportedBy });
        continue;
      }
      const claimed = await claimGoogleSheetExport({ env, spreadsheetId, submissionId: record.id, sheetTitle: group.title, exportedBy });
      if (!claimed) { inProgress += 1; continue; }
      try {
        await appendSheetRow(env, spreadsheetId, group.title, prepared.headers, rowForRecord(record, prepared.headers));
        existingIds.add(record.id);
        exported += 1;
        await recordGoogleSheetExport({ env, spreadsheetId, submissionId: record.id, sheetTitle: group.title, exportedBy });
      } catch (error) {
        const wrapped = serviceError(error);
        failures.push({ id: record.id, message: wrapped.message });
        await recordGoogleSheetExport({ env, spreadsheetId, submissionId: record.id, sheetTitle: group.title, status: "failed", exportedBy, lastError: wrapped.message });
      }
    }
    const sheet = sheets.get(group.title);
    if (sheet?.sheetId) await sortSheetBySubmittedAt(env, spreadsheetId, group.title, sheet.sheetId, prepared.headers.length, Math.max(0, prepared.headers.indexOf("Submitted At")));
  }
  const result = { ok: failures.length === 0, exported, alreadyPresent, skippedTestimonials, inProgress, failed: failures.length, failures };
  if (failures.length) result.message = `${exported} added, ${alreadyPresent} already present, and ${failures.length} failed.`;
  else if (inProgress) result.message = `${exported} added, ${alreadyPresent} already present, and ${inProgress} already being exported.`;
  else result.message = `${exported} added, ${alreadyPresent} already present${skippedTestimonials ? `, ${skippedTestimonials} testimonial${skippedTestimonials === 1 ? "" : "s"} skipped` : ""}.`;
  result.sync = await safeSyncStatus({ env, spreadsheetId, origin, loadedRecords: submissionId ? null : { records, skippedTestimonials } });
  return result;
}
