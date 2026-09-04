import test from "node:test";
import assert from "node:assert/strict";
import { authorizeAdminRequest } from "../src/server/dashboard/admin-auth.js";

test("admin access fails closed when no allowlist is configured", async () => {
  const result = await authorizeAdminRequest(new Request("https://example.com/admin/"), {});
  assert.deepEqual(result, { ok: false, status: 503, code: "ADMIN_NOT_CONFIGURED" });
});

test("admin access requires a signed-in allowed email", async () => {
  const env = { DASHBOARD_ADMIN_EMAILS: "owner@example.com" };
  assert.equal((await authorizeAdminRequest(new Request("https://example.com/admin/"), env)).status, 401);

  const denied = new Request("https://example.com/admin/", {
    headers: { "oai-authenticated-user-email": "visitor@example.com" },
  });
  assert.equal((await authorizeAdminRequest(denied, env)).status, 403);

  const allowed = new Request("https://example.com/admin/", {
    headers: { "oai-authenticated-user-email": "OWNER@example.com" },
  });
  assert.deepEqual(await authorizeAdminRequest(allowed, env), { ok: true, email: "owner@example.com" });
});

test("Cloudflare staging trusts the Access identity instead of a request header", async () => {
  const env = { DASHBOARD_ADMIN_EMAILS: "owner@example.com", ADMIN_AUTH_MODE: "cloudflare-access" };
  const ctx = { access: { async getIdentity() { return { email: "OWNER@example.com" }; } } };
  const request = new Request("https://example.com/admin/", { headers: { "oai-authenticated-user-email": "attacker@example.com" } });
  assert.deepEqual(await authorizeAdminRequest(request, env, ctx), { ok: true, email: "owner@example.com" });
});

test("Cloudflare staging accepts the Access email header behind Static Assets", async () => {
  const env = { DASHBOARD_ADMIN_EMAILS: "owner@example.com", ADMIN_AUTH_MODE: "cloudflare-access" };
  const request = new Request("https://example.com/admin/", {
    headers: { "cf-access-authenticated-user-email": "OWNER@example.com" },
  });
  assert.deepEqual(await authorizeAdminRequest(request, env), { ok: true, email: "owner@example.com" });
});
