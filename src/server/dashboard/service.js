import { getGoogleAccessToken } from "./google-auth.js";
import { GoogleFormsProvider, parseFieldMap } from "./google-forms-provider.js";
import { TestimonialsSheetProvider } from "./google-sheets-provider.js";
import {
  matchesDashboardSearch,
  normalizeFormResponse,
  normalizeTestimonialRow,
} from "./normalizers.js";
import { DashboardSourceError, publicSourceStatus } from "./errors.js";

const SOURCE_KEYS = ["builds", "rentals", "testimonials"];

function encodeCursor(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeCursor(value) {
  if (!value) return {};
  try {
    const base64 = String(value).replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function selectedSources(type) {
  if (type === "all") return SOURCE_KEYS;
  if (type === "build") return ["builds"];
  if (type === "rental") return ["rentals"];
  if (type === "testimonial") return ["testimonials"];
  return null;
}

function logSourceFailure(error, logger = console) {
  const sourceError = error instanceof DashboardSourceError ? error : null;
  logger.error(sourceError?.logCode || "dashboard.source.failed", {
    source: sourceError?.source || "unknown",
    code: sourceError?.code || "UPSTREAM_ERROR",
  });
}

async function loadFormSource({ source, type, env, token, fetchImpl, pageSize, cursor }) {
  const prefix = source === "builds" ? "BUILDS" : "RENTALS";
  const provider = new GoogleFormsProvider({
    source,
    formId: env[`GOOGLE_${prefix}_FORM_ID`],
    accessToken: token,
    fetchImpl,
  });
  const fieldMap = parseFieldMap(source, env[`GOOGLE_${prefix}_FIELD_MAP`]);
  const [metadata, page] = await Promise.all([
    provider.getFormMetadata(),
    provider.listResponses({ pageSize, pageToken: cursor }),
  ]);
  const records = page.items
    .map((response) => normalizeFormResponse({ type, response, metadata, fieldMap }))
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
  return { records, nextCursor: page.nextCursor };
}

async function loadTestimonials({ env, token, fetchImpl, pageSize, cursor }) {
  const provider = new TestimonialsSheetProvider({
    spreadsheetId: env.GOOGLE_TESTIMONIALS_SPREADSHEET_ID,
    sheetName: env.GOOGLE_TESTIMONIALS_SHEET_NAME || "Testimonials",
    accessToken: token,
    fetchImpl,
  });
  const page = await provider.listTestimonials({ pageSize, cursor });
  const records = page.items
    .map((row) => normalizeTestimonialRow({ headers: page.headers, row }))
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
  return { records, nextCursor: page.nextCursor };
}

export async function getDashboardSubmissions({
  env,
  type = "all",
  limit = 50,
  cursor,
  search = "",
  fetchImpl = fetch,
  logger = console,
  tokenProvider = getGoogleAccessToken,
}) {
  const sources = selectedSources(type);
  if (!sources) {
    return { ok: false, status: 400, code: "INVALID_TYPE", message: "Unknown dashboard type filter." };
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const pageSize = Math.ceil(safeLimit / sources.length);
  const cursorState = decodeCursor(cursor);
  const statuses = Object.fromEntries(SOURCE_KEYS.map((source) => [source, { ok: null }]));
  let token;

  try {
    token = await tokenProvider(env, fetchImpl);
  } catch (error) {
    logSourceFailure(error, logger);
    sources.forEach((source) => { statuses[source] = publicSourceStatus(error); });
    return { ok: true, submissions: [], sources: statuses };
  }

  const tasks = sources.map(async (source) => {
    try {
      const page = source === "testimonials"
        ? await loadTestimonials({ env, token, fetchImpl, pageSize, cursor: cursorState[source] })
        : await loadFormSource({
            source,
            type: source === "builds" ? "build" : "rental",
            env,
            token,
            fetchImpl,
            pageSize,
            cursor: cursorState[source],
          });
      statuses[source] = { ok: true };
      return { source, ...page };
    } catch (error) {
      logSourceFailure(error, logger);
      statuses[source] = publicSourceStatus(error);
      return { source, records: [], nextCursor: undefined };
    }
  });

  const pages = await Promise.all(tasks);
  const submissions = pages
    .flatMap((page) => page.records)
    .filter((record) => matchesDashboardSearch(record, search))
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
  const nextState = Object.fromEntries(
    pages.filter((page) => page.nextCursor).map((page) => [page.source, page.nextCursor]),
  );

  return {
    ok: true,
    submissions,
    sources: statuses,
    ...(Object.keys(nextState).length ? { nextCursor: encodeCursor(nextState) } : {}),
  };
}

export const dashboardCursor = { encode: encodeCursor, decode: decodeCursor };
