import test from "node:test";
import assert from "node:assert/strict";
import { authorizeAdminRequest } from "../src/server/dashboard/admin-auth.js";

test("admin access fails closed when no allowlist is configured", () => {
  const result = authorizeAdminRequest(new Request("https://example.com/admin/"), {});
  assert.deepEqual(result, { ok: false, status: 503, code: "ADMIN_NOT_CONFIGURED" });
});

test("admin access requires a signed-in allowed email", () => {
  const env = { DASHBOARD_ADMIN_EMAILS: "owner@example.com" };
  assert.equal(authorizeAdminRequest(new Request("https://example.com/admin/"), env).status, 401);

  const denied = new Request("https://example.com/admin/", {
    headers: { "oai-authenticated-user-email": "visitor@example.com" },
  });
  assert.equal(authorizeAdminRequest(denied, env).status, 403);

  const allowed = new Request("https://example.com/admin/", {
    headers: { "oai-authenticated-user-email": "OWNER@example.com" },
  });
  assert.deepEqual(authorizeAdminRequest(allowed, env), { ok: true, email: "owner@example.com" });
});
