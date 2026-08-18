import test from "node:test";
import assert from "node:assert/strict";
import {
  createSubmission,
  deleteSubmissionRecord,
  listSubmissions,
  submissionCursor,
} from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";

function sample(id, type, submittedAt, name) {
  return {
    id,
    type,
    status: type === "testimonial" ? "Pending review" : "New",
    submittedAt,
    customer: { name, email: `${id}@example.com`, phone: "347-555-0100" },
    location: { neighborhood: "Crown Heights" },
    summary: `${type} request from ${name}`,
    data: { name, neighborhood: "Crown Heights", estimatedSize: "10 × 12 ft", service: ["Setup"] },
    sourcePage: "https://example.com/",
  };
}

test("database submissions support mixed form types, search, and stable pagination", async () => {
  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, sample("build-1", "build", "2026-08-17T15:00:00.000Z", "Build Customer"));
    await createSubmission({ DB }, sample("rental-1", "rental", "2026-08-17T14:00:00.000Z", "Rental Customer"));
    await createSubmission({ DB }, sample("review-1", "testimonial", "2026-08-17T13:00:00.000Z", "Review Customer"));

    const first = await listSubmissions({ env: { DB }, limit: 2, origin: "https://example.com" });
    assert.deepEqual(first.submissions.map((item) => item.id), ["build-1", "rental-1"]);
    assert.deepEqual(submissionCursor.decode(first.nextCursor), {
      submittedAt: "2026-08-17T14:00:00.000Z",
      id: "rental-1",
    });

    const second = await listSubmissions({ env: { DB }, limit: 2, cursor: first.nextCursor, origin: "https://example.com" });
    assert.deepEqual(second.submissions.map((item) => item.id), ["review-1"]);

    const search = await listSubmissions({ env: { DB }, search: "rental customer", origin: "https://example.com" });
    assert.deepEqual(search.submissions.map((item) => item.id), ["rental-1"]);
  } finally {
    DB.close();
  }
});

test("database file records become private dashboard photo links and cascade on deletion", async () => {
  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, {
      ...sample("build-photo", "build", "2026-08-17T15:00:00.000Z", "Photo Customer"),
      files: [{ id: "file-1", key: "build-photo/01-site.jpg", originalName: "site.jpg", contentType: "image/jpeg", sizeBytes: 200 }],
    });
    const page = await listSubmissions({ env: { DB }, type: "build", origin: "https://example.com" });
    assert.equal(page.submissions[0].photos[0].url, "https://example.com/api/sukkah-submission-photos/build-photo/01-site.jpg");

    const deleted = await deleteSubmissionRecord({ env: { DB }, type: "build", id: "build-photo" });
    assert.deepEqual(deleted.photoKeys, ["build-photo/01-site.jpg"]);
    const empty = await listSubmissions({ env: { DB }, origin: "https://example.com" });
    assert.deepEqual(empty.submissions, []);
  } finally {
    DB.close();
  }
});
