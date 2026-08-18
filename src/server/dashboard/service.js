import {
  databaseSourceStatuses,
  listSubmissions,
  submissionCursor,
} from "../storage/submission-repository.js";

function logDatabaseFailure(error, logger = console) {
  logger.error("dashboard.database.failed", {
    code: String(error?.code || "DATABASE_ERROR").slice(0, 80),
    errorName: String(error?.name || "Error").slice(0, 80),
    errorMessage: String(error?.message || "Unknown database failure").replace(/[\r\n]+/g, " ").slice(0, 240),
  });
}

export async function getDashboardSubmissions({
  env,
  type = "all",
  limit = 50,
  cursor,
  search = "",
  origin = "",
  logger = console,
}) {
  try {
    const page = await listSubmissions({ env, type, limit, cursor, search, origin });
    return { ok: true, ...page, sources: databaseSourceStatuses(true) };
  } catch (error) {
    if (error?.code === "INVALID_TYPE") {
      return { ok: false, status: 400, code: "INVALID_TYPE", message: "Unknown dashboard type filter." };
    }
    logDatabaseFailure(error, logger);
    return {
      ok: true,
      submissions: [],
      sources: databaseSourceStatuses(false, "The submissions database is temporarily unavailable."),
    };
  }
}

export const dashboardCursor = submissionCursor;
