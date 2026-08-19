import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import worker from "../index.mjs";
import { exportGoogleSheetSubmissions, getGoogleSheetsSyncStatus } from "../src/server/dashboard/google-sheets-service.js";
import { parseSpreadsheetId } from "../src/server/integrations/google-sheets-client.js";
import { createSubmission } from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";

test("Google Sheet URLs normalize to an ID without accepting arbitrary text", () => {
  assert.equal(parseSpreadsheetId("https://docs.google.com/spreadsheets/d/1Abcdefghij_KLMNOP/edit#gid=0"), "1Abcdefghij_KLMNOP");
  assert.equal(parseSpreadsheetId("not a spreadsheet"), "");
});

test("Google Sheets dashboard endpoints remain owner-only and fail clearly before setup", async () => {
  const DB = createTestDatabase();
  try {
    const signedOut = await worker.fetch(new Request("https://example.com/api/admin/google-sheets/settings"), { DB, DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
    assert.equal(signedOut.status, 401);

    const allowed = await worker.fetch(new Request("https://example.com/api/admin/google-sheets/settings", {
      headers: { "oai-authenticated-user-email": "owner@example.com" },
    }), { DB, DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
    assert.equal(allowed.status, 200);
    assert.equal((await allowed.json()).configured, false);

    const invalid = await worker.fetch(new Request("https://example.com/api/admin/google-sheets/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "oai-authenticated-user-email": "owner@example.com", Origin: "https://example.com" },
      body: JSON.stringify({ spreadsheet: "not a spreadsheet" }),
    }), { DB, DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
    assert.equal(invalid.status, 400);
  } finally { DB.close(); }
});

test("Google Sheets export rejects Testimonials before calling Google", async () => {
  const DB = createTestDatabase();
  try {
    await DB.prepare(`INSERT INTO google_sheet_settings (id, spreadsheet_id, updated_at, updated_by) VALUES (1, ?, ?, ?)`)
      .bind("1Abcdefghij_KLMNOP", new Date().toISOString(), "owner@example.com").run();
    await createSubmission({ DB }, {
      id: "testimonial-sheet-test", type: "testimonial", submittedAt: new Date().toISOString(),
      customer: { name: "Reviewer", email: "reviewer@example.com" }, summary: "Review", data: { testimonial: "Nice work" },
    });
    await assert.rejects(
      exportGoogleSheetSubmissions({ env: { DB }, submissionId: "testimonial-sheet-test", exportedBy: "owner@example.com", origin: "https://example.com" }),
      (error) => error.code === "TESTIMONIAL_EXPORT_FORBIDDEN" && error.status === 400,
    );
  } finally { DB.close(); }
});

test("a non-testimonial export creates a managed tab and appends one normalized row", async () => {
  const DB = createTestDatabase();
  const originalFetch = globalThis.fetch;
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const calls = [];
  let hasBuildsTab = false;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || "GET", body: options.body || "" });
    if (String(url) === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "test-token", expires_in: 3600 });
    if (String(url).includes("/spreadsheets/1Abcdefghij_KLMNOP?")) {
      return Response.json({ properties: { title: "Reporting" }, sheets: hasBuildsTab ? [{ properties: { sheetId: 42, title: "Builds", index: 0 } }] : [] });
    }
    if (String(url).includes(":batchUpdate")) {
      if (String(options.body || "").includes("addSheet")) hasBuildsTab = true;
      return Response.json({ replies: [] });
    }
    if (String(url).includes("/values/") && options.method === "PUT") return Response.json({ updatedRows: 1 });
    if (String(url).includes(":append")) return Response.json({ updates: { updatedRows: 1 } });
    if (String(url).includes("/values/")) return Response.json({ values: [] });
    return Response.json({});
  };
  try {
    await DB.prepare(`INSERT INTO google_sheet_settings (id, spreadsheet_id, updated_at, updated_by) VALUES (1, ?, ?, ?)`)
      .bind("1Abcdefghij_KLMNOP", new Date().toISOString(), "owner@example.com").run();
    await createSubmission({ DB }, {
      id: "build-sheet-test", type: "build", submittedAt: "2026-08-18T12:00:00.000Z",
      customer: { name: "Build Customer", email: "build@example.com", phone: "555-0100" },
      location: { neighborhood: "Crown Heights" }, summary: "Build request", data: { estimatedSize: "10 × 12 ft" },
    });
    const result = await exportGoogleSheetSubmissions({
      env: { DB, GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: "site@example.iam.gserviceaccount.com", GOOGLE_SHEETS_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }) },
      exportedBy: "owner@example.com", origin: "https://example.com",
    });
    assert.equal(result.exported, 1);
    assert.equal(result.failed, 0);
    assert.ok(calls.some((call) => call.url.includes(":append")));
    assert.ok(calls.some((call) => call.url.includes(":batchUpdate")));
  } finally {
    globalThis.fetch = originalFetch;
    DB.close();
  }
});

test("Google Sheets sync status reports dashboard requests missing from the Sheet", async () => {
  const DB = createTestDatabase();
  const originalFetch = globalThis.fetch;
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "test-token", expires_in: 3600 });
    if (target.includes("/spreadsheets/1Abcdefghij_KLMNOP?")) {
      return Response.json({ properties: { title: "Reporting" }, sheets: [{ properties: { sheetId: 42, title: "Builds", index: 0 } }] });
    }
    if (target.includes("/values/") && target.includes("Builds")) {
      return Response.json({ values: [["Submission ID", "Submitted At"], ["build-sync-test", "2026-08-18T12:00:00.000Z"]] });
    }
    if (target.includes("/values/")) return Response.json({ values: [] });
    return Response.json({});
  };
  try {
    await createSubmission({ DB }, {
      id: "build-sync-test", type: "build", submittedAt: "2026-08-18T12:00:00.000Z",
      customer: { name: "Build Customer" }, summary: "Build request", data: {},
    });
    await createSubmission({ DB }, {
      id: "rental-sync-test", type: "rental", submittedAt: "2026-08-18T13:00:00.000Z",
      customer: { name: "Rental Customer" }, summary: "Rental request", data: {},
    });
    const result = await getGoogleSheetsSyncStatus({
      env: { DB, GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: "site@example.iam.gserviceaccount.com", GOOGLE_SHEETS_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }) },
      spreadsheetId: "1Abcdefghij_KLMNOP", origin: "https://example.com",
    });
    assert.equal(result.status, "needs-export");
    assert.equal(result.missingCount, 1);
    assert.equal(result.sheetCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
    DB.close();
  }
});
