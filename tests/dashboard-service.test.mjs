import test from "node:test";
import assert from "node:assert/strict";
import { getDashboardSubmissions, dashboardCursor } from "../src/server/dashboard/service.js";
import { clearFormsMetadataCacheForTests } from "../src/server/dashboard/google-forms-provider.js";

const env = {
  GOOGLE_BUILDS_FORM_ID: "private-build-form-id",
  GOOGLE_RENTALS_FORM_ID: "private-rental-form-id",
  GOOGLE_BUILDS_FIELD_MAP: JSON.stringify({ name: "build-name" }),
  GOOGLE_RENTALS_FIELD_MAP: JSON.stringify({ name: "rental-name" }),
  GOOGLE_TESTIMONIALS_SPREADSHEET_ID: "testimonial-sheet-id",
};

function json(data, status = 200) {
  return Response.json(data, { status });
}

test("one failed source does not prevent the other sources from loading", async () => {
  const fetchImpl = async (input) => {
    const url = new URL(input);
    if (url.hostname === "forms.googleapis.com" && url.pathname.includes("private-rental-form-id")) {
      return json({}, 403);
    }
    if (url.hostname === "forms.googleapis.com" && !url.pathname.endsWith("/responses")) {
      return json({ info: { title: "Builds" }, items: [{ itemId: "i1", title: "Name", questionItem: { question: { questionId: "build-name" } } }] });
    }
    if (url.hostname === "forms.googleapis.com") {
      return json({ responses: [{ responseId: "build-1", createTime: "2026-08-13T23:00:00Z", answers: { "build-name": { textAnswers: { answers: [{ value: "Build Customer" }] } } } }] });
    }
    if (url.pathname.includes("A1%3AZ1")) {
      return json({ values: [["Submitted at", "Submission ID", "Status", "Name", "Organization", "Verification contact", "Testimonial", "Publication consent", "Source page"]] });
    }
    if (url.pathname.includes("A2%3AA")) return json({ values: [["2026-08-13T22:00:00Z"]] });
    return json({ values: [["2026-08-13T22:00:00Z", "review-1", "Pending review", "Reviewer", "", "review@example.com", "A solid testimonial for testing.", "yes", "https://example.com/"]] });
  };
  const logs = [];
  const result = await getDashboardSubmissions({
    env,
    fetchImpl,
    tokenProvider: async () => "token",
    logger: { error: (...values) => logs.push(values) },
  });

  assert.equal(result.ok, true);
  assert.equal(result.sources.builds.ok, true);
  assert.equal(result.sources.rentals.ok, false);
  assert.equal(result.sources.testimonials.ok, true);
  assert.deepEqual(result.submissions.map((item) => item.type), ["build", "testimonial"]);
  assert.equal(logs[0][0], "dashboard.rentals.permission_denied");
});

test("Forms pagination tokens round-trip through the dashboard cursor", async () => {
  let observedPageToken = "";
  const fetchImpl = async (input) => {
    const url = new URL(input);
    if (!url.pathname.endsWith("/responses")) {
      return json({ info: { title: "Builds" }, items: [{ title: "Name", questionItem: { question: { questionId: "build-name" } } }] });
    }
    observedPageToken = url.searchParams.get("pageToken") || "";
    return json({ responses: [], nextPageToken: observedPageToken ? undefined : "google-next-page" });
  };

  const first = await getDashboardSubmissions({
    env,
    type: "build",
    fetchImpl,
    tokenProvider: async () => "token",
  });
  assert.equal(dashboardCursor.decode(first.nextCursor).builds, "google-next-page");

  await getDashboardSubmissions({
    env,
    type: "build",
    cursor: first.nextCursor,
    fetchImpl,
    tokenProvider: async () => "token",
  });
  assert.equal(observedPageToken, "google-next-page");
});

test("Google providers preserve the Cloudflare fetch runtime binding", async () => {
  clearFormsMetadataCacheForTests();
  let calls = 0;
  async function cloudflareStyleFetch(input) {
    assert.equal(this, globalThis);
    calls += 1;
    const url = new URL(input);
    if (!url.pathname.endsWith("/responses")) {
      return json({ info: { title: "Builds" }, items: [] });
    }
    return json({ responses: [] });
  }

  const result = await getDashboardSubmissions({
    env,
    type: "build",
    fetchImpl: cloudflareStyleFetch,
    tokenProvider: async () => "token",
  });

  assert.equal(result.sources.builds.ok, true);
  assert.equal(calls, 2);
});

test("authentication failure returns no private data", async () => {
  const result = await getDashboardSubmissions({
    env,
    tokenProvider: async () => { throw new Error("secret token details"); },
    logger: { error() {} },
  });
  assert.deepEqual(result.submissions, []);
  assert.equal(result.sources.builds.error, "This source is temporarily unavailable.");
  assert.equal(JSON.stringify(result).includes("secret token details"), false);
});
