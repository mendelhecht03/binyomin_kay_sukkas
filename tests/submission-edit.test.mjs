import test from "node:test";
import assert from "node:assert/strict";
import { handleAdminSubmissionsRequest } from "../src/server/dashboard/worker-entry.js";
import { createSubmission, getSubmissionRecord } from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";

const adminEnv = (DB) => ({ DB, DASHBOARD_ADMIN_EMAILS: "owner@example.com" });

function editRequest(body, headers = {}) {
  return new Request("https://example.com/api/admin/submissions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

test("submission editing is owner-only and rejects cross-origin writes", async () => {
  const body = { action: "edit-submission", type: "rental", id: "request-1", changes: { customer: { name: "Updated" } } };
  const signedOut = await handleAdminSubmissionsRequest(editRequest(body), { DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
  assert.equal(signedOut.status, 401);

  const crossOrigin = await handleAdminSubmissionsRequest(editRequest(body, {
    "oai-authenticated-user-email": "owner@example.com",
    Origin: "https://attacker.example",
  }), { DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
  assert.equal(crossOrigin.status, 403);
});
test("admins can edit an existing submission while untouched responses persist", async () => {
  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, {
      id: "request-1",
      type: "rental",
      status: "New",
      submittedAt: "2026-08-24T12:00:00.000Z",
      customer: { name: "Original Customer", email: "customer@example.com", phone: "347-555-0100" },
      location: { neighborhood: "Crown Heights" },
      summary: "Rental request · 10 x 12 ft",
      data: {
        formTitle: "Rental request",
        answers: { estimatedSize: "10 x 12 ft", comments: "Keep this answer" },
        answerDetails: [
          { id: "estimatedSize", label: "Approximate size", type: "text", value: "10 x 12 ft" },
          { id: "comments", label: "Comments", type: "textarea", value: "Keep this answer" },
        ],
      },
    });

    const response = await handleAdminSubmissionsRequest(editRequest({
      action: "edit-submission",
      type: "rental",
      id: "request-1",
      changes: {
        customer: { name: "Updated Customer" },
        answers: { estimatedSize: "12 x 16 ft" },
      },
    }, {
      "oai-authenticated-user-email": "owner@example.com",
      Origin: "https://example.com",
    }), adminEnv(DB));

    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.submission.customer.name, "Updated Customer");
    assert.equal(result.submission.customer.email, "customer@example.com");
    assert.equal(result.submission.details.find((detail) => detail.key === "estimatedSize").value, "12 x 16 ft");
    assert.equal(result.submission.details.find((detail) => detail.key === "comments").value, "Keep this answer");

    const refreshed = await getSubmissionRecord({ env: { DB }, id: "request-1", origin: "https://example.com" });
    assert.equal(refreshed.customer.name, "Updated Customer");
    assert.equal(refreshed.customer.phone, "347-555-0100");
    assert.equal(refreshed.answers.answers.estimatedSize, "12 x 16 ft");
    assert.equal(refreshed.answers.answers.comments, "Keep this answer");
  } finally {
    DB.close();
  }
});

test("submission edits validate values and reject unknown response fields", async () => {
  const DB = createTestDatabase();
  try {
    await createSubmission({ DB }, {
      id: "request-2", type: "build", status: "New", submittedAt: "2026-08-24T12:00:00.000Z",
      customer: { name: "Customer", email: "valid@example.com" }, summary: "Build request",
      data: { estimatedSize: "10 x 12 ft", comments: "Original" },
    });
    const invalidEmail = await handleAdminSubmissionsRequest(editRequest({
      action: "edit-submission", type: "build", id: "request-2", changes: { customer: { email: "not-an-email" } },
    }, { "oai-authenticated-user-email": "owner@example.com" }), adminEnv(DB));
    assert.equal(invalidEmail.status, 400);
    assert.match((await invalidEmail.json()).message, /valid email/i);

    const unknownField = await handleAdminSubmissionsRequest(editRequest({
      action: "edit-submission", type: "build", id: "request-2", changes: { answers: { injectedField: "Unexpected" } },
    }, { "oai-authenticated-user-email": "owner@example.com" }), adminEnv(DB));
    assert.equal(unknownField.status, 400);
    assert.match((await unknownField.json()).message, /no longer exists/i);

    const refreshed = await getSubmissionRecord({ env: { DB }, id: "request-2", origin: "https://example.com" });
    assert.equal(refreshed.customer.email, "valid@example.com");
    assert.equal(refreshed.answers.comments, "Original");
  } finally {
    DB.close();
  }
});
