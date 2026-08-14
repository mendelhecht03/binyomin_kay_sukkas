import { configurationError, googleErrorFromResponse } from "./errors.js";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const headerCache = new Map();
const HEADER_TTL_MS = 15 * 60 * 1000;

function quoteSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

export class TestimonialsSheetProvider {
  constructor({
    spreadsheetId,
    sheetName = "Testimonials",
    accessToken,
    fetchImpl = fetch,
    now = Date.now,
  }) {
    this.spreadsheetId = String(spreadsheetId || "").trim();
    this.sheetName = String(sheetName || "Testimonials").trim();
    this.accessToken = accessToken;
    // Keep Cloudflare's built-in fetch bound to the global runtime. Using it
    // as a provider method otherwise changes `this` and fails in production.
    this.fetchImpl = fetchImpl.bind(globalThis);
    this.now = now;

    if (!this.spreadsheetId) {
      throw configurationError("testimonials", "The Testimonials spreadsheet ID is not configured.");
    }
  }

  async requestRange(range) {
    const url = new URL(
      `${SHEETS_API}/${encodeURIComponent(this.spreadsheetId)}/values/${encodeURIComponent(range)}`,
    );
    const response = await this.fetchImpl(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!response.ok) throw googleErrorFromResponse("testimonials", response);
    return response.json();
  }

  async getHeaders() {
    const key = `${this.spreadsheetId}:${this.sheetName}`;
    const cached = headerCache.get(key);
    if (cached && cached.expiresAt > this.now()) return cached.value;

    const result = await this.requestRange(`${quoteSheetName(this.sheetName)}!A1:Z1`);
    const value = result.values?.[0] || [];
    headerCache.set(key, { value, expiresAt: this.now() + HEADER_TTL_MS });
    return value;
  }

  async getLastDataRow() {
    const result = await this.requestRange(`${quoteSheetName(this.sheetName)}!A2:A`);
    const values = result.values || [];
    let lastOffset = -1;
    values.forEach((row, index) => {
      if (String(row?.[0] || "").trim()) lastOffset = index;
    });
    return lastOffset < 0 ? 1 : lastOffset + 2;
  }

  async listTestimonials({ pageSize = 50, cursor } = {}) {
    const headers = await this.getHeaders();
    const endRow = cursor ? Number(cursor) : await this.getLastDataRow();
    if (!Number.isInteger(endRow) || endRow < 2) return { items: [] };

    const size = Math.max(1, Math.min(Number(pageSize) || 50, 200));
    const startRow = Math.max(2, endRow - size + 1);
    const column = String.fromCharCode(64 + Math.max(1, Math.min(headers.length || 9, 26)));
    const result = await this.requestRange(
      `${quoteSheetName(this.sheetName)}!A${startRow}:${column}${endRow}`,
    );

    return {
      headers,
      items: (result.values || []).map((row, index) => ({ rowNumber: startRow + index, values: row })).reverse(),
      nextCursor: startRow > 2 ? String(startRow - 1) : undefined,
    };
  }
}

export function clearSheetHeaderCacheForTests() {
  headerCache.clear();
}
