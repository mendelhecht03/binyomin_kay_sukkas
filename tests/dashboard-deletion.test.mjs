import test from "node:test";
import assert from "node:assert/strict";
import { deleteDashboardSubmission } from "../src/server/dashboard/deletion-service.js";
import { createSubmission, listSubmissions } from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";

test("deletion removes the database record and only its related R2 objects", async () => {
  const DB = createTestDatabase();
  const deletedKeys = [];
  try {
    await createSubmission({ DB }, {
      id: "build-1", type: "build", status: "New", submittedAt: "2026-08-17T15:00:00.000Z",
      customer: { name: "Build Customer" }, summary: "Build request", data: {},
      files: [{ id: "file-1", key: "build-1/01-photo.jpg", originalName: "photo.jpg" }],
    });
    const result = await deleteDashboardSubmission({
      env: { DB, SUBMISSION_PHOTOS: { delete: async (key) => deletedKeys.push(key) } },
      type: "build",
      id: "build-1",
    });
    assert.equal(result.ok, true);
    assert.deepEqual(deletedKeys, ["build-1/01-photo.jpg"]);
    assert.deepEqual((await listSubmissions({ env: { DB }, origin: "https://example.com" })).submissions, []);
  } finally {
    DB.close();
  }
});

test("deletion rejects unknown submission types before touching storage", async () => {
  const result = await deleteDashboardSubmission({ env: {}, type: "unknown", id: "response-1" });
  assert.equal(result.status, 400);
  assert.equal(result.code, "INVALID_SUBMISSION");
});
