import test from "node:test";
import assert from "node:assert/strict";
import { getDashboardSubmissions } from "../src/server/dashboard/service.js";
import { createSubmission } from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";

test("the dashboard reads every registered form type from one database", async () => {
  const DB = createTestDatabase();
  try {
    for (const [type, hour] of [["build", 15], ["rental", 14], ["testimonial", 13]]) {
      await createSubmission({ DB }, {
        id: `${type}-1`, type, status: "New", submittedAt: `2026-08-17T${hour}:00:00.000Z`,
        customer: { name: `${type} customer` }, summary: `${type} request`, data: { type },
      });
    }
    const result = await getDashboardSubmissions({ env: { DB }, origin: "https://example.com" });
    assert.equal(result.ok, true);
    assert.deepEqual(result.submissions.map((item) => item.type), ["build", "rental", "testimonial"]);
    assert.equal(result.sources.builds.ok, true);
    assert.equal(result.sources.rentals.ok, true);
    assert.equal(result.sources.testimonials.ok, true);
  } finally {
    DB.close();
  }
});

test("database failures return no private data or internal error details", async () => {
  const logs = [];
  const result = await getDashboardSubmissions({
    env: {},
    logger: { error: (...values) => logs.push(values) },
  });
  assert.deepEqual(result.submissions, []);
  assert.equal(result.sources.builds.ok, false);
  assert.equal(JSON.stringify(result).includes("not configured"), false);
  assert.equal(logs[0][0], "dashboard.database.failed");
});

test("unknown form filters are rejected", async () => {
  const DB = createTestDatabase();
  try {
    const result = await getDashboardSubmissions({ env: { DB }, type: "unknown" });
    assert.equal(result.status, 400);
    assert.equal(result.code, "INVALID_TYPE");
  } finally {
    DB.close();
  }
});
