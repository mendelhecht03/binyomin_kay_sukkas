function configuredAdmins(env) {
  return new Set(
    String(env?.DASHBOARD_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function cloudflareAccessEmail(ctx) {
  if (typeof ctx?.access?.getIdentity !== "function") return "";
  try {
    const identity = await ctx.access.getIdentity();
    return String(identity?.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

export async function authorizeAdminRequest(request, env, ctx) {
  const allowedEmails = configuredAdmins(env);
  if (allowedEmails.size === 0) {
    return { ok: false, status: 503, code: "ADMIN_NOT_CONFIGURED" };
  }

  const usesCloudflareAccess = env?.ADMIN_AUTH_MODE === "cloudflare-access";
  const email = usesCloudflareAccess
    ? await cloudflareAccessEmail(ctx)
    : String(request.headers.get("oai-authenticated-user-email") || "").trim().toLowerCase();
  if (!email) return { ok: false, status: 401, code: "SIGN_IN_REQUIRED" };
  if (!allowedEmails.has(email)) return { ok: false, status: 403, code: "ACCESS_DENIED" };
  return { ok: true, email };
}

export function adminErrorResponse(result) {
  const messages = {
    ADMIN_NOT_CONFIGURED: "Owner dashboard access has not been configured.",
    SIGN_IN_REQUIRED: "Sign in is required.",
    ACCESS_DENIED: "This account does not have access to the owner dashboard.",
  };
  return Response.json(
    { ok: false, code: result.code, message: messages[result.code] || "Dashboard access failed." },
    {
      status: result.status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
