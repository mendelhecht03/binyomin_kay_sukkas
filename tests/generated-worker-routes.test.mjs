import test from "node:test";
import assert from "node:assert/strict";
import worker from "../index.mjs";
import { createSubmission, listSubmissions } from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";
import { withStaticAssets } from "./helpers/static-assets.mjs";

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
    withStaticAssets({ DASHBOARD_ADMIN_EMAILS: "owner@example.com" }),
  );
  assert.equal(allowedPage.status, 200);
  assert.match(await allowedPage.text(), /Website submissions/);
  assert.equal(allowedPage.headers.get("cache-control"), "private, no-store");
});

test("static pages, dynamic request compatibility paths, and missing pages use the assets binding", async () => {
  const env = withStaticAssets();
  const requestPage = await worker.fetch(new Request("https://example.com/request/rentals/"), env);
  assert.equal(requestPage.status, 200);
  assert.match(await requestPage.text(), /data-dynamic-form/);

  const missingPage = await worker.fetch(new Request("https://example.com/not-a-real-page/"), env);
  assert.equal(missingPage.status, 404);
  assert.match(await missingPage.text(), /Page not found/i);
});

test("dashboard deletion remains protected and deletes from D1", async () => {
  const signedOut = await worker.fetch(new Request("https://example.com/api/admin/submissions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "testimonial", id: "review-1" }),
  }), { DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
  assert.equal(signedOut.status, 401);

  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, {
      id: "review-1", type: "testimonial", status: "Pending review",
      submittedAt: "2026-08-17T15:00:00.000Z", customer: { name: "Reviewer" },
      summary: "Review", data: { testimonial: "A test review." },
    });
    const response = await worker.fetch(new Request("https://example.com/api/admin/submissions", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "oai-authenticated-user-email": "owner@example.com",
      },
      body: JSON.stringify({ type: "testimonial", id: "review-1" }),
    }), {
      DASHBOARD_ADMIN_EMAILS: "owner@example.com",
      DB,
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).deleted.id, "review-1");
    assert.deepEqual((await listSubmissions({ env: { DB }, origin: "https://example.com" })).submissions, []);
  } finally {
    DB.close();
  }
});

test("the Rentals submission route writes to D1", async () => {
  const DB = createTestDatabase();
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
    }), { DB });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal((await listSubmissions({ env: { DB }, type: "rental", origin: "https://example.com" })).submissions.length, 1);
  } finally {
    DB.close();
  }
});

test("the Builds submission route writes to D1", async () => {
  const DB = createTestDatabase();
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
    }), { DB });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal((await listSubmissions({ env: { DB }, type: "build", origin: "https://example.com" })).submissions.length, 1);
  } finally {
    DB.close();
  }
});

test("the Testimonial submission route writes to D1", async () => {
  const DB = createTestDatabase();
  try {
    const form = new FormData();
    form.set("reviewerName", "Test Reviewer");
    form.set("reviewerContact", "review@example.com");
    form.set("testimonial", "This is a sufficiently long testimonial used only for route testing.");
    form.set("publicationConsent", "yes");

    const response = await worker.fetch(new Request("https://example.com/api/testimonial-submissions", {
      method: "POST",
      body: form,
    }), { DB });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal((await listSubmissions({ env: { DB }, type: "testimonial", origin: "https://example.com" })).submissions.length, 1);
  } finally {
    DB.close();
  }
});
