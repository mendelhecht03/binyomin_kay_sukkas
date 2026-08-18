import test from "node:test";
import assert from "node:assert/strict";
import worker from "../index.mjs";
import { normalizeFormSchema } from "../src/server/forms/form-schema.js";
import {
  createFormDraft, getPublishedFormBySlug, listFormVersions, publishForm, saveFormDraft,
} from "../src/server/storage/form-repository.js";
import { listSubmissions } from "../src/server/storage/submission-repository.js";
import { createTestDatabase } from "./helpers/d1-test-database.mjs";

function editableSchema(overrides = {}) {
  return {
    id: "editable-form",
    slug: "editable-form",
    title: "Editable request",
    description: "A test form.",
    submitLabel: "Send request",
    successTitle: "Sent",
    successMessage: "We received it.",
    steps: [
      {
        id: "questions",
        title: "Questions",
        fields: [
          { id: "name", type: "text", label: "Name", required: true },
          { id: "interests", type: "checkboxes", label: "Interests", required: true, options: ["Lighting", "Other"] },
          {
            id: "otherInterest", type: "text", label: "Other interest", required: true,
            condition: { fieldId: "interests", operator: "includes", value: "Other" },
          },
        ],
      },
      { id: "review", title: "Review", fields: [] },
    ],
    ...overrides,
  };
}

test("form schemas accept existing field types and validate conditional follow-ups", () => {
  const valid = normalizeFormSchema(editableSchema());
  assert.equal(valid.ok, true);
  assert.equal(valid.schema.steps[0].fields[2].condition.operator, "includes");

  const invalid = editableSchema();
  invalid.steps[0].fields[2].condition.fieldId = "missing-field";
  assert.equal(normalizeFormSchema(invalid).ok, false);
});

test("form drafts publish immutable versions and keep later edits private", async () => {
  const DB = createTestDatabase();
  try {
    const created = await createFormDraft({ env: { DB }, schema: editableSchema(), updatedBy: "owner@example.com" });
    assert.equal(created.ok, true);
    const firstPublish = await publishForm({ env: { DB }, id: "editable-form", updatedBy: "owner@example.com" });
    assert.equal(firstPublish.versionNumber, 1);

    const changed = editableSchema({ title: "Changed draft" });
    const saved = await saveFormDraft({ env: { DB }, id: "editable-form", schema: changed, updatedBy: "owner@example.com" });
    assert.equal(saved.ok, true);
    assert.equal((await getPublishedFormBySlug({ env: { DB }, slug: "editable-form" })).schema.title, "Editable request");

    const secondPublish = await publishForm({ env: { DB }, id: "editable-form", updatedBy: "owner@example.com" });
    assert.equal(secondPublish.versionNumber, 2);
    assert.deepEqual((await listFormVersions({ env: { DB }, id: "editable-form" })).map((version) => version.versionNumber), [2, 1]);
    assert.equal((await getPublishedFormBySlug({ env: { DB }, slug: "editable-form" })).schema.title, "Changed draft");
  } finally { DB.close(); }
});

test("dynamic forms enforce published conditions and save label snapshots", async () => {
  const DB = createTestDatabase();
  try {
    await createFormDraft({ env: { DB }, schema: editableSchema(), updatedBy: "owner@example.com" });
    await publishForm({ env: { DB }, id: "editable-form", updatedBy: "owner@example.com" });

    const incomplete = new FormData();
    incomplete.set("name", "Test Customer");
    incomplete.append("interests", "Other");
    const rejected = await worker.fetch(new Request("https://example.com/api/form-submissions/editable-form", { method: "POST", body: incomplete }), { DB });
    assert.equal(rejected.status, 400);
    assert.deepEqual((await rejected.json()).missingFields, ["otherInterest"]);

    const complete = new FormData();
    complete.set("name", "Test Customer");
    complete.append("interests", "Other");
    complete.set("otherInterest", "Custom windows");
    const accepted = await worker.fetch(new Request("https://example.com/api/form-submissions/editable-form", { method: "POST", body: complete }), { DB });
    assert.equal(accepted.status, 200);
    const page = await listSubmissions({ env: { DB }, type: "custom", origin: "https://example.com" });
    assert.equal(page.submissions[0].details.find((detail) => detail.key === "otherInterest").label, "Other interest");
    assert.equal(page.submissions[0].details.find((detail) => detail.key === "otherInterest").value, "Custom windows");
  } finally { DB.close(); }
});

test("form management APIs require an approved owner and public form pages use the shared shell", async () => {
  const DB = createTestDatabase();
  try {
    const signedOut = await worker.fetch(new Request("https://example.com/api/admin/forms"), { DB, DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
    assert.equal(signedOut.status, 401);

    const allowed = await worker.fetch(new Request("https://example.com/api/admin/forms", {
      headers: { "oai-authenticated-user-email": "owner@example.com" },
    }), { DB, DASHBOARD_ADMIN_EMAILS: "owner@example.com" });
    assert.equal(allowed.status, 200);
    assert.ok((await allowed.json()).forms.some((form) => form.slug === "custom-sukkah"));

    const publicConfig = await worker.fetch(new Request("https://example.com/api/forms/custom-sukkah"), { DB });
    assert.equal(publicConfig.status, 200);
    assert.equal((await publicConfig.json()).schema.slug, "custom-sukkah");

    const shell = await worker.fetch(new Request("https://example.com/request/custom-sukkah/"), { DB });
    assert.equal(shell.status, 200);
    assert.match(await shell.text(), /data-dynamic-form/);
  } finally { DB.close(); }
});
