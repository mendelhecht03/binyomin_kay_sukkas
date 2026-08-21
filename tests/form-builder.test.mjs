import test from "node:test";
import assert from "node:assert/strict";
import worker from "../index.mjs";
import { DEFAULT_BUILD_FORM, DEFAULT_PURCHASE_FORM, DEFAULT_RENTAL_FORM, SUPPORTED_FORM_STEP_ICONS, normalizeFormSchema } from "../src/server/forms/form-schema.js";
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
          { id: "name", type: "text", label: "Name", required: true, placeholder: "Your full name" },
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
  assert.equal(valid.schema.steps[0].icon, "site");
  assert.equal(valid.schema.steps[0].fields[0].placeholder, "Your full name");
  assert.ok(SUPPORTED_FORM_STEP_ICONS.includes("photo"));
  assert.ok(SUPPORTED_FORM_STEP_ICONS.includes("tools"));

  const invalid = editableSchema();
  invalid.steps[0].fields[2].condition.fieldId = "missing-field";
  assert.equal(normalizeFormSchema(invalid).ok, false);

  const laterField = editableSchema();
  laterField.steps[0].fields[1].condition = { fieldId: "otherInterest", operator: "equals", value: "Custom" };
  assert.equal(normalizeFormSchema(laterField).ok, false);

  const incompatible = editableSchema();
  incompatible.steps[0].fields[2].condition = { fieldId: "interests", operator: "equals", value: "Other" };
  assert.equal(normalizeFormSchema(incompatible).ok, false);
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

test("Buy submissions are saved in the purchase dashboard category", async () => {
  const DB = createTestDatabase();
  try {
    const submitted = new FormData();
    submitted.set("name", "Buy Customer");
    submitted.set("phone", "347-555-0111");
    submitted.set("addressLine1", "10 Main Street");
    submitted.set("city", "Brooklyn");
    submitted.set("state", "New York (NY)");
    submitted.set("postalCode", "11213");
    submitted.set("neighborhood", "Crown Heights");
    submitted.set("estimatedSize", "10 × 12 ft");
    submitted.set("deliveryDate", "2026-09-20");
    submitted.set("sukkahType", "Canvas");
    submitted.set("framePreference", "Wood");
    submitted.append("schach", "Bamboo mat");
    const response = await worker.fetch(new Request("https://example.com/api/form-submissions/purchases", { method: "POST", body: submitted }), { DB });
    assert.equal(response.status, 200);
    const page = await listSubmissions({ env: { DB }, type: "purchase", origin: "https://example.com" });
    assert.equal(page.submissions.length, 1);
    assert.equal(page.submissions[0].source.key, "purchases");
    assert.equal(page.submissions[0].answers.formSlug, "purchases");
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
    const forms = (await allowed.json()).forms;
    assert.deepEqual(forms.slice(0, 3).map((form) => form.slug), ["builds", "rentals", "custom-sukkah"]);
    assert.equal(forms.find((form) => form.slug === "purchases").title, "Buy");

    const publicConfig = await worker.fetch(new Request("https://example.com/api/forms/custom-sukkah"), { DB });
    assert.equal(publicConfig.status, 200);
    assert.equal((await publicConfig.json()).schema.slug, "custom-sukkah");

    const shell = await worker.fetch(new Request("https://example.com/request/custom-sukkah/"), { DB });
    assert.equal(shell.status, 200);
    assert.match(await shell.text(), /data-dynamic-form/);
  } finally { DB.close(); }
});

test("the live request definitions use editable section icons and the shared public renderer", async () => {
  const DB = createTestDatabase();
  try {
    for (const schema of [DEFAULT_BUILD_FORM, DEFAULT_RENTAL_FORM, DEFAULT_PURCHASE_FORM]) {
      const config = await worker.fetch(new Request(`https://example.com/api/forms/${schema.slug}`), { DB });
      assert.equal(config.status, 200);
      const body = await config.json();
      assert.equal(body.schema.steps[0].icon, "contact");
      assert.equal(body.schema.steps.find((step) => step.id === "location").icon, "location");
      assert.equal(body.schema.steps.at(-1).icon, "final");
    }

    const buildsPage = await worker.fetch(new Request("https://example.com/sukka-builder/"), { DB });
    const rentalsPage = await worker.fetch(new Request("https://example.com/sukkah-rentals/"), { DB });
    const rentalFormPage = await worker.fetch(new Request("https://example.com/request/?form=rentals"), { DB });
    const buyPage = await worker.fetch(new Request("https://example.com/purchases/"), { DB });
    const customPage = await worker.fetch(new Request("https://example.com/request/custom-sukkah/"), { DB });
    const pergolaPage = await worker.fetch(new Request("https://example.com/request/?form=pergolas"), { DB });
    for (const [page, slug, primaryLabel, secondaryLabel, sectionId] of [
      [buildsPage, "builds", "Start a build request", "See recent projects", "build-request"],
      [buyPage, "purchases", "Start a buy request", "See sukkah options", "buy-request"],
    ]) {
      const html = await page.text();
      assert.match(html, new RegExp(`data-form-slug="${slug}"`));
      assert.match(html, /data-payment-template/);
      assert.match(html, /form-page-actions/);
      assert.match(html, new RegExp(primaryLabel));
      assert.match(html, new RegExp(secondaryLabel));
      assert.match(html, new RegExp(`id="${sectionId}"`));
    }
    const rentalHtml = await rentalsPage.text();
    assert.match(rentalHtml, /rental-overview/);
    assert.match(rentalHtml, /rental-tarp-grid/);
    assert.match(rentalHtml, /href="\/request\/\?form=rentals"[^>]*>Start a rental request<\/a>/);
    assert.doesNotMatch(rentalHtml, /data-managed-form-root/);
    const rentalFormHtml = await rentalFormPage.text();
    assert.match(rentalFormHtml, /data-managed-form-root/);
    assert.match(rentalFormHtml, /data-form-slug="auto"/);
    const customHtml = await customPage.text();
    const pergolaHtml = await pergolaPage.text();
    assert.match(customHtml, /data-payment-template/);
    assert.match(customHtml, /form-page-actions/);
    assert.match(customHtml, /Start a request/);
    assert.match(customHtml, /Explore services/);
    assert.match(customHtml, /id="request-form"/);
    assert.match(pergolaHtml, /data-payment-template/);
    assert.match(pergolaHtml, /Start a request/);
    assert.match(pergolaHtml, /Explore services/);
    const customSukkahsPage = await worker.fetch(new Request("https://example.com/custom-sukkahs/"), { DB });
    const pergolasPage = await worker.fetch(new Request("https://example.com/pergolas/"), { DB });
    const customSukkahsHtml = await customSukkahsPage.text();
    const pergolasHtml = await pergolasPage.text();
    assert.match(customSukkahsHtml, /form-page-actions/);
    assert.match(pergolasHtml, /form-page-actions/);
    assert.match(pergolasHtml, /Start a pergola request/);
    const requestedWork = DEFAULT_BUILD_FORM.steps.find((step) => step.id === "requested-work").fields.find((field) => field.id === "service");
    assert.deepEqual(requestedWork.options, ["Build", "Take down", "Other"]);
    assert.equal(DEFAULT_BUILD_FORM.steps.find((step) => step.id === "requested-work").fields.some((field) => field.id === "bringToStorageDate"), false);
    assert.equal(DEFAULT_RENTAL_FORM.steps.find((step) => step.id === "extras").fields.find((field) => field.id === "tarpStyle").required, true);
    assert.equal(DEFAULT_PURCHASE_FORM.title, "Buy");
    assert.equal(DEFAULT_PURCHASE_FORM.steps.find((step) => step.id === "timing").fields[0].id, "deliveryDate");
    assert.equal(DEFAULT_PURCHASE_FORM.steps.find((step) => step.id === "options").fields.find((field) => field.id === "sukkahType").required, true);
  } finally { DB.close(); }
});

test("the homepage presents Builds as the first service card", async () => {
  const homePage = await worker.fetch(new Request("https://example.com/"));
  assert.equal(homePage.status, 200);
  const html = await homePage.text();
  const serviceChoicesStart = html.indexOf('class="service-choices"');
  const buildsIndex = html.indexOf('href="/sukka-builder/"', serviceChoicesStart);
  const customIndex = html.indexOf('href="/custom-sukkahs/"', serviceChoicesStart);
  const rentalsIndex = html.indexOf('href="/sukkah-rentals/"', serviceChoicesStart);
  assert.ok(serviceChoicesStart >= 0);
  assert.ok(buildsIndex > serviceChoicesStart);
  assert.ok(buildsIndex < customIndex);
  assert.ok(buildsIndex < rentalsIndex);
  assert.match(html, /href="\/contact\/"[^>]*>Contact<\/a>/);
  assert.match(html, /Sukkahs &amp; Outdoor Work/);
  assert.match(html, /Benyamin works directly with families/);
  assert.match(html, />More about Benyamin<\/a>/);
  assert.doesNotMatch(html, /BK Sukkah works directly with families/);
  const mainNavStart = html.indexOf('<nav class="site-navigation"');
  const mainNavEnd = html.indexOf('</nav>', mainNavStart);
  const mainNav = html.slice(mainNavStart, mainNavEnd);
  const otherGroupIndex = mainNav.indexOf('<details class="nav-group"');
  assert.ok(mainNavStart >= 0);
  assert.ok(otherGroupIndex > 0);
  assert.ok(mainNav.indexOf('href="/sukka-builder/"') < otherGroupIndex);
  assert.ok(mainNav.indexOf('href="/sukkah-rentals/"') < otherGroupIndex);
  assert.ok(mainNav.indexOf('href="/purchases/"') < otherGroupIndex);
  assert.ok(mainNav.indexOf('href="/custom-sukkahs/"') < otherGroupIndex);
  assert.ok(mainNav.indexOf('href="/pergolas/"') < otherGroupIndex);
  assert.ok(mainNav.indexOf('href="/tree-trimming/"', otherGroupIndex) > otherGroupIndex);
  assert.ok(mainNav.indexOf('href="/eruv-work/"', otherGroupIndex) > otherGroupIndex);
});
