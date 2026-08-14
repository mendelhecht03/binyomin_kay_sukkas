import { adminErrorResponse, authorizeAdminRequest } from "./admin-auth.js";
import { getDashboardSubmissions } from "./service.js";

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

  const url = new URL(request.url);
  const result = await getDashboardSubmissions({
    env,
    type: url.searchParams.get("type") || "all",
    limit: url.searchParams.get("limit") || 50,
    cursor: url.searchParams.get("cursor") || undefined,
    search: url.searchParams.get("search") || "",
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
