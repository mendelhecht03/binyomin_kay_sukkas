import { adminErrorResponse, authorizeAdminRequest } from "./admin-auth.js";
import { deleteDashboardSubmission } from "./deletion-service.js";
import { getDashboardSubmissions } from "./service.js";
import { approveDashboardTestimonial } from "./testimonial-review-service.js";
import { editDashboardSubmission } from "./submission-edit-service.js";
import {
  exportGoogleSheetSubmissions,
  getGoogleSheetsSettings,
  saveAndTestGoogleSheet,
  testConfiguredGoogleSheet,
} from "./google-sheets-service.js";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

export function checkAdminAccess(request, env) {
  return authorizeAdminRequest(request, env);
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function googleSheetsErrorResponse(error) {
  const status = Number(error?.status) || (error?.code === "GOOGLE_SHEETS_ACCESS_DENIED" ? 403 : ["GOOGLE_SHEETS_NOT_CONFIGURED", "DATABASE_NOT_CONFIGURED"].includes(error?.code) ? 503 : 502);
  const message = error?.code === "GOOGLE_SHEETS_NOT_CONFIGURED"
    ? "Google Sheets credentials have not been configured for this site yet."
    : error?.code === "DATABASE_NOT_CONFIGURED"
      ? "The submissions database is temporarily unavailable."
    : error?.message || "The Google Sheets request could not be completed.";
  return Response.json({ ok: false, code: error?.code || "GOOGLE_SHEETS_ERROR", message }, { status, headers: PRIVATE_HEADERS });
}

export async function handleAdminGoogleSheetsRequest(request, env, pathname) {
  const access = authorizeAdminRequest(request, env);
  if (!access.ok) return adminErrorResponse(access);
  if (!sameOrigin(request)) return Response.json({ ok: false, message: "This dashboard request was not allowed." }, { status: 403, headers: PRIVATE_HEADERS });
  try {
    if (request.method === "GET" && pathname === "/api/admin/google-sheets/settings") {
      return Response.json(await getGoogleSheetsSettings({ env, origin: new URL(request.url).origin }), { headers: PRIVATE_HEADERS });
    }
    if (request.method === "PUT" && pathname === "/api/admin/google-sheets/settings") {
      let body;
      try { body = await request.json(); } catch { return Response.json({ ok: false, message: "The Google Sheet setting could not be read." }, { status: 400, headers: PRIVATE_HEADERS }); }
      const result = await saveAndTestGoogleSheet({ env, spreadsheetValue: body?.spreadsheet || body?.spreadsheetId, updatedBy: access.email, origin: new URL(request.url).origin });
      return Response.json(result, { headers: PRIVATE_HEADERS });
    }
    if (request.method === "POST" && pathname === "/api/admin/google-sheets/test") {
      return Response.json(await testConfiguredGoogleSheet({ env, origin: new URL(request.url).origin }), { headers: PRIVATE_HEADERS });
    }
    if (request.method === "POST" && pathname === "/api/admin/google-sheets/export") {
      const body = await request.json().catch(() => ({}));
      const result = await exportGoogleSheetSubmissions({ env, submissionId: body?.submissionId, exportedBy: access.email, origin: new URL(request.url).origin });
      return Response.json(result, { status: result.ok ? 200 : 502, headers: PRIVATE_HEADERS });
    }
    return Response.json({ ok: false, message: "Unknown Google Sheets endpoint." }, { status: 404, headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("dashboard.google_sheets.failed", { code: String(error?.code || "GOOGLE_SHEETS_ERROR").slice(0, 80) });
    return googleSheetsErrorResponse(error);
  }
}

export function adminPageAccessResponse(request, env) {
  const access = authorizeAdminRequest(request, env);
  if (access.ok) return null;

  if (access.code === "SIGN_IN_REQUIRED") {
    return Response.redirect(new URL("/signin-with-chatgpt?return_to=/admin/", request.url), 302);
  }

  const message = access.code === "ADMIN_NOT_CONFIGURED"
    ? "Owner dashboard access has not been configured."
    : "This account does not have access to the owner dashboard.";
  return new Response(`<!doctype html><title>Owner dashboard</title><main><h1>Owner dashboard</h1><p>${message}</p></main>`, {
    status: access.status,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function handleAdminSubmissionsRequest(request, env) {
  const access = authorizeAdminRequest(request, env);
  if (!access.ok) return adminErrorResponse(access);

  if (request.method === "DELETE" || request.method === "PATCH") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json({ ok: false, message: "This dashboard request was not allowed." }, { status: 403, headers: PRIVATE_HEADERS });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, message: "The dashboard request could not be read." }, { status: 400, headers: PRIVATE_HEADERS });
    }
    if (request.method === "PATCH") {
      if (body?.action === "edit-submission") {
        const result = await editDashboardSubmission({
          env,
          type: body?.type,
          id: body?.id,
          changes: body?.changes,
          origin: new URL(request.url).origin,
        });
        return Response.json(result, { status: result.ok ? 200 : result.status, headers: PRIVATE_HEADERS });
      }
      if (body?.action === "approve-testimonial") {
        const result = await approveDashboardTestimonial({ env, id: body?.id, approvedBy: access.email });
        return Response.json(result, { status: result.ok ? 200 : result.status, headers: PRIVATE_HEADERS });
      }
      return Response.json({ ok: false, message: "Unknown submission action." }, { status: 400, headers: PRIVATE_HEADERS });
    }
    const result = await deleteDashboardSubmission({ env, type: body?.type, id: body?.id });
    return Response.json(result, { status: result.ok ? 200 : result.status, headers: PRIVATE_HEADERS });
  }

  const url = new URL(request.url);
  const result = await getDashboardSubmissions({
    env,
    type: url.searchParams.get("type") || "all",
    limit: url.searchParams.get("limit") || 50,
    cursor: url.searchParams.get("cursor") || undefined,
    search: url.searchParams.get("search") || "",
    origin: url.origin,
  });
  if (result.ok === false) {
    return Response.json(result, { status: result.status, headers: PRIVATE_HEADERS });
  }

  return Response.json(
    { ...result, viewer: { email: access.email } },
    { headers: PRIVATE_HEADERS },
  );
}

export function withAdminPageHeaders(response) {
  const headers = new Headers(response.headers);
  Object.entries(PRIVATE_HEADERS).forEach(([name, value]) => headers.set(name, value));
  return new Response(response.body, { status: response.status, headers });
}
