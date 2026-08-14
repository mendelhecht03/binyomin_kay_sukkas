import test from "node:test";
import assert from "node:assert/strict";
import worker from "../index.mjs";

test("the admin page and API both fail closed", async () => {
  const unconfiguredPage = await worker.fetch(new Request("https://example.com/admin/"), {});
  assert.equal(unconfiguredPage.status, 503);

  const directHtmlPage = await worker.fetch(new Request("https://example.com/admin/index.html"), {});
  assert.equal(directHtmlPage.status, 503);

  const signedOutPage = await worker.fetch(
    new Request("https://example.com/admin/"),
    { DASHBOARD_ADMIN_EMAILS: "owner@example.com" },
  );
  assert.equal(signedOutPage.status, 302);
  assert.match(signedOutPage.headers.get("location"), /signin-with-chatgpt/);

  const api = await worker.fetch(new Request("https://example.com/api/admin/submissions"), {});
  assert.equal(api.status, 503);
  assert.equal((await api.json()).code, "ADMIN_NOT_CONFIGURED");

  const allowedPage = await worker.fetch(
    new Request("https://example.com/admin/", {
      headers: { "oai-authenticated-user-email": "owner@example.com" },
    }),
    { DASHBOARD_ADMIN_EMAILS: "owner@example.com" },
  );
  assert.equal(allowedPage.status, 200);
  assert.match(await allowedPage.text(), /BKAY submissions/);
  assert.equal(allowedPage.headers.get("cache-control"), "private, no-store");
});

test("the existing Rentals submission route remains independent", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 302 });
  try {
    const form = new FormData();
    Object.entries({
      name: "Rental Test",
      phone: "347-555-0100",
      addressLine1: "123 Test Street",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11213",
      neighborhood: "Crown Heights",
      estimatedSize: "10 x 12 ft",
      buildDay: "2026-09-18",
      takeDownDay: "2026-10-05",
      extraServiceRequired: "No",
      comments: "No additional comments.",
    }).forEach(([name, value]) => form.set(name, value));

    const response = await worker.fetch(new Request("https://example.com/api/rental-submissions", {
      method: "POST",
      body: form,
    }), {});
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the existing Builds submission and photo binding remain independent", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: true });
  try {
    const form = new FormData();
    Object.entries({
      sukkahPlan: "I already have a sukkah",
      name: "Build Test",
      phone: "347-555-0100",
      email: "build@example.com",
      addressLine1: "123 Test Street",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11213",
      neighborhood: "Crown Heights",
      estimatedSize: "10 x 12 ft",
      sukkahType: "Canvas",
      buildDate: "2026-09-18",
      takeDownDate: "2026-10-05",
      extraServiceRequired: "No",
      referral: "Google",
    }).forEach(([name, value]) => form.set(name, value));
    form.append("schach", "Bamboo mat");
    form.append("service", "Setup");

    const response = await worker.fetch(new Request("https://example.com/api/sukkah-submissions", {
      method: "POST",
      body: form,
    }), { SUBMISSION_PHOTOS: { put() {}, delete() {} } });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the existing Testimonial webhook and email bridge remain independent", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: true });
  try {
    const form = new FormData();
    form.set("reviewerName", "Test Reviewer");
    form.set("reviewerContact", "review@example.com");
    form.set("testimonial", "This is a sufficiently long testimonial used only for route testing.");
    form.set("publicationConsent", "yes");

    const response = await worker.fetch(new Request("https://example.com/api/testimonial-submissions", {
      method: "POST",
      body: form,
    }), {
      SUKKAH_SHEETS_WEBHOOK_URL: "https://script.google.com/test",
      SUKKAH_SHEETS_WEBHOOK_SECRET: "test-secret",
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
