import { googleSheetsAccessToken } from "./google-sheets-auth.js";

const API_ROOT = "https://sheets.googleapis.com/v4";

function sheetError(message, code = "GOOGLE_SHEETS_ERROR", status = 502) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}

function encodedSheetTitle(title) {
  return `'${String(title).replace(/'/g, "''")}'`;
}

function columnName(index) {
  let value = Number(index) + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

async function sheetsFetch(env, path, options = {}) {
  const token = await googleSheetsAccessToken(env);
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch (cause) {
    const error = sheetError("Google Sheets is temporarily unavailable.", "GOOGLE_SHEETS_UNAVAILABLE");
    error.cause = cause;
    throw error;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = clean(body?.error?.message);
    const error = sheetError(
      response.status === 403
        ? "The service account cannot access this Google Sheet. Share the Sheet with the configured service-account email."
        : reason || "Google Sheets could not complete that request.",
      response.status === 403 ? "GOOGLE_SHEETS_ACCESS_DENIED" : "GOOGLE_SHEETS_ERROR",
      response.status === 403 ? 403 : 502,
    );
    error.googleStatus = response.status;
    throw error;
  }
  return body;
}

export function parseSpreadsheetId(value) {
  const raw = clean(value);
  const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const id = match?.[1] || raw;
  return /^[a-zA-Z0-9_-]{10,200}$/.test(id) ? id : "";
}

export async function getSpreadsheet(env, spreadsheetId) {
  const id = parseSpreadsheetId(spreadsheetId);
  if (!id) throw sheetError("Enter a valid Google Sheet URL or spreadsheet ID.", "INVALID_SPREADSHEET_ID", 400);
  return sheetsFetch(env, `/spreadsheets/${encodeURIComponent(id)}?includeGridData=false&fields=spreadsheetId,properties(title),sheets(properties(sheetId,title,index,gridProperties(columnCount,rowCount)))`);
}

async function updateValues(env, spreadsheetId, range, values) {
  return sheetsFetch(env, `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ majorDimension: "ROWS", values }),
  });
}

async function appendValues(env, spreadsheetId, range, values) {
  return sheetsFetch(env, `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ majorDimension: "ROWS", values }),
  });
}

async function batchUpdate(env, spreadsheetId, requests) {
  if (!requests.length) return {};
  return sheetsFetch(env, `/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests }),
  });
}

export async function readSheetValues(env, spreadsheetId, title, range = "A:ZZ") {
  const body = await sheetsFetch(env, `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${encodedSheetTitle(title)}!${range}`)}?majorDimension=ROWS`);
  return Array.isArray(body.values) ? body.values : [];
}

export async function ensureSheets(env, spreadsheetId, titles) {
  const spreadsheet = await getSpreadsheet(env, spreadsheetId);
  const current = spreadsheet.sheets || [];
  const currentByTitle = new Map(current.map((sheet) => [sheet.properties?.title, sheet.properties]));
  const missing = titles.filter((title) => !currentByTitle.has(title));
  if (missing.length) {
    await batchUpdate(env, spreadsheetId, missing.map((title) => ({ addSheet: { properties: { title } } })));
  }
  const refreshed = missing.length ? await getSpreadsheet(env, spreadsheetId) : spreadsheet;
  const properties = (refreshed.sheets || []).map((sheet) => sheet.properties).filter(Boolean);
  const propertyByTitle = new Map(properties.map((sheet) => [sheet.title, sheet]));
  const reorderRequests = [...titles].sort((a, b) => a.localeCompare(b)).map((title, index) => {
    const sheet = propertyByTitle.get(title);
    return sheet ? { updateSheetProperties: { properties: { sheetId: sheet.sheetId, index }, fields: "index" } } : null;
  }).filter(Boolean);
  await batchUpdate(env, spreadsheetId, reorderRequests);
  return { spreadsheet: refreshed, sheets: propertyByTitle };
}

export async function prepareSheet(env, spreadsheetId, title, headers) {
  const rows = await readSheetValues(env, spreadsheetId, title);
  const existingHeaders = Array.isArray(rows[0]) ? rows[0].map((value) => clean(value)) : [];
  if (existingHeaders.length && existingHeaders[0] !== "Submission ID") {
    const error = new Error(`The “${title}” tab already has a different column layout. Clear that tab before exporting it.`);
    error.code = "GOOGLE_SHEETS_LAYOUT_UNSUPPORTED";
    error.status = 409;
    throw error;
  }
  const mergedHeaders = [...existingHeaders];
  headers.forEach((header) => { if (header && !mergedHeaders.includes(header)) mergedHeaders.push(header); });
  if (!mergedHeaders.length) mergedHeaders.push(...headers);
  if (JSON.stringify(existingHeaders) !== JSON.stringify(mergedHeaders)) {
    await updateValues(env, spreadsheetId, `${encodedSheetTitle(title)}!A1:${columnName(mergedHeaders.length - 1)}1`, [mergedHeaders]);
  }
  return { rows, headers: mergedHeaders };
}

export async function appendSheetRow(env, spreadsheetId, title, headers, row) {
  await appendValues(env, spreadsheetId, `${encodedSheetTitle(title)}!A1`, [headers.map((header) => row[header] ?? "")]);
}

export async function sortSheetBySubmittedAt(env, spreadsheetId, title, sheetId, columnCount, submittedAtColumnIndex = 1) {
  await batchUpdate(env, spreadsheetId, [{ sortRange: {
    range: { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
    sortSpecs: [{ dimensionIndex: submittedAtColumnIndex, sortOrder: "ASCENDING" }, { dimensionIndex: 0, sortOrder: "ASCENDING" }],
  } }]);
}
