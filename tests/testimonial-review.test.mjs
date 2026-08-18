import test from "node:test";
import assert from "node:assert/strict";
import worker from "../index.mjs";
import {
  approveTestimonialRecord,
  createSubmission,
  listApprovedTestimonials,
  listSubmissions,
} from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";

function pendingTestimonial(overrides = {}) {
  return {
    id: "review-1",
    type: "testimonial",
    status: "Pending review",
    submittedAt: "2026-08-17T15:00:00.000Z",
    customer: { name: "Test Reviewer", email: "private@example.com" },
    summary: "A thoughtful customer testimonial.",
    data: {
      reviewerName: "Test Reviewer",
      reviewerOrganization: "Test Organization",
      reviewerContact: "private@example.com",
      testimonial: "Benyamin handled every detail carefully and communicated clearly throughout.",
      publicationConsent: "yes",
    },
    ...overrides,
  };
}

test("approval publishes only safe testimonial fields and records the review state", async () => {
  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, pendingTestimonial());
    assert.deepEqual(await listApprovedTestimonials({ env: { DB } }), []);

    const approved = await approveTestimonialRecord({
      env: { DB },
      id: "review-1",
      approvedBy: "OWNER@example.com",
      approvedAt: "2026-08-17T16:00:00.000Z",
    });
    assert.equal(approved.status, "Approved");

    const publicTestimonials = await listApprovedTestimonials({ env: { DB } });
    assert.deepEqual(publicTestimonials, [{
      id: "review-1",
      name: "Test Reviewer",
      organization: "Test Organization",
      testimonial: "Benyamin handled every detail carefully and communicated clearly throughout.",
      approvedAt: "2026-08-17T16:00:00.000Z",
    }]);
    assert.equal(JSON.stringify(publicTestimonials).includes("private@example.com"), false);

    const dashboard = await listSubmissions({ env: { DB }, type: "testimonial", origin: "https://example.com" });
    assert.equal(dashboard.submissions[0].status, "Approved");
  } finally {
    DB.close();
  }
});

test("approval rejects a testimonial without publication consent", async () => {
  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, pendingTestimonial({
      data: {
        reviewerName: "Test Reviewer",
        testimonial: "This testimonial has enough text but has no publication permission.",
        publicationConsent: "no",
      },
    }));
    await assert.rejects(
      approveTestimonialRecord({ env: { DB }, id: "review-1", approvedBy: "owner@example.com" }),
      { code: "TESTIMONIAL_NOT_PUBLISHABLE" },
    );
  } finally {
    DB.close();
  }
});

test("testimonial approval is protected and approved testimonials appear on the public API", async () => {
  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, pendingTestimonial());
    const env = { DB, DASHBOARD_ADMIN_EMAILS: "owner@example.com" };

    const signedOut = await worker.fetch(new Request("https://example.com/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve-testimonial", id: "review-1" }),
    }), env);
    assert.equal(signedOut.status, 401);

    const approved = await worker.fetch(new Request("https://example.com/api/admin/submissions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "oai-authenticated-user-email": "owner@example.com",
      },
      body: JSON.stringify({ action: "approve-testimonial", id: "review-1" }),
    }), env);
    assert.equal(approved.status, 200);
    assert.equal((await approved.json()).approved.status, "Approved");

    const publicResponse = await worker.fetch(new Request("https://example.com/api/testimonials"), env);
    assert.equal(publicResponse.status, 200);
    const publicBody = await publicResponse.json();
    assert.equal(publicBody.testimonials.length, 1);
    assert.equal(publicBody.testimonials[0].name, "Test Reviewer");
    assert.equal("reviewerContact" in publicBody.testimonials[0], false);
  } finally {
    DB.close();
  }
});
