const formDefinitions = JSON.parse(document.querySelector("#dashboard-form-definitions").textContent);
const formDefinitionByType = new Map(formDefinitions.map((definition) => [definition.type, definition]));
const fixtureData = {
  ok: true,
  viewer: { email: "owner@example.com" },
  sources: Object.fromEntries(formDefinitions.map((definition) => [definition.sourceKey, { ok: true }])),
  submissions: [
    {
      id: "build-demo", type: "build", submittedAt: "2026-08-13T23:42:18.000Z",
      customer: { name: "Sample Build Customer", phone: "(555) 010-1111", email: "build@example.com" },
      location: { address: "123 Sample Street", city: "Brooklyn", state: "NY", zip: "11213", neighborhood: "Crown Heights" },
      summary: "Setup and takedown · 10 × 12 ft",
      details: [
        { key: "service", label: "Requested work", value: ["Setup", "Takedown"] },
        { key: "estimatedSize", label: "Estimated size", value: "10 × 12 ft" },
        { key: "sukkahType", label: "Sukkah type", value: "Canvas" },
      ], source: { provider: "database", key: "builds" },
    },
    {
      id: "rental-demo", type: "rental", submittedAt: "2026-08-13T21:15:00.000Z",
      customer: { name: "Sample Rental Customer", phone: "(555) 010-2222" },
      location: { city: "Brooklyn", state: "NY", neighborhood: "Flatbush" },
      summary: "12 × 16 ft · September 18, 2026",
      details: [
        { key: "estimatedSize", label: "Rental size", value: "12 × 16 ft" },
        { key: "buildDay", label: "Setup date", value: "2026-09-18" },
      ], source: { provider: "database", key: "rentals" },
    },
    {
      id: "testimonial-demo", type: "testimonial", submittedAt: "2026-08-13T20:04:00.000Z",
      status: "Pending review",
      customer: { name: "Sample Reviewer", email: "review@example.com" },
      summary: "The team was responsive and the finished sukkah was exactly what we needed.",
      details: [
        { key: "testimonial", label: "Testimonial", value: "The team was responsive and the finished sukkah was exactly what we needed." },
      ], source: { provider: "database", key: "testimonials" },
    },
  ],
};

const state = { type: "all", search: "", nextCursor: "", submissions: [], loading: false, selectedId: "", pendingDeleteId: "", editing: false };
const sheetsState = { configured: false, ready: false, loading: false, sync: null };
const list = document.querySelector("#submission-list");
const tableShell = document.querySelector("#submission-table-shell");
const empty = document.querySelector("#admin-empty");
const message = document.querySelector("#admin-message");
const loadMore = document.querySelector("#load-more");
const detailsDialog = document.querySelector("#submission-dialog");
const deleteDialog = document.querySelector("#delete-dialog");
const deleteStatus = document.querySelector("#delete-status");
const confirmDelete = document.querySelector("#confirm-delete");
const isLocalFixture = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).get("fixture") === "1";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}
function displayValue(value) { return escapeHtml(Array.isArray(value) ? value.join(", ") : value); }
function customerName(record) { return record.customer?.name || [record.customer?.firstName, record.customer?.lastName].filter(Boolean).join(" ") || "Name not provided"; }
function customerContact(record) { return record.customer?.email || record.customer?.phone || "No contact provided"; }
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function locationLabel(record) { return record.location?.neighborhood || [record.location?.city, record.location?.state].filter(Boolean).join(", ") || "Location not provided"; }
function typeLabel(type) { return formDefinitionByType.get(type)?.singularLabel || "Submission"; }
function isPendingTestimonial(record) { return record.type === "testimonial" && record.status === "Pending review"; }
function statusLabel(record) { return record.status || (record.type === "testimonial" ? "Pending review" : "New"); }

function rowActionButtons(record) {
  if (isPendingTestimonial(record)) {
    return `<button class="row-view" type="button" data-view>View</button>
      <button class="row-approve" type="button" data-approve>Approve</button>
      <button class="row-delete" type="button" data-disapprove>Disapprove</button>`;
  }
  const deleteLabel = record.type === "testimonial" && record.status === "Approved" ? "Remove" : "Delete";
  return `<button class="row-view" type="button" data-view>View</button>
    <button class="row-delete" type="button" data-delete>${deleteLabel}</button>`;
}

function updateCounts() {
  document.querySelector("#count-all").textContent = state.submissions.length;
  formDefinitions.forEach(({ type }) => {
    document.querySelector(`#count-${type}`).textContent = state.submissions.filter((item) => item.type === type).length;
  });
}

function renderStatuses(sources = {}) {
  document.querySelector("#source-status").innerHTML = formDefinitions.map(({ sourceKey, label }) => {
    const source = sources[sourceKey];
    const className = source?.ok === false ? "is-error" : source?.ok === true ? "is-ok" : "";
    const text = source?.ok === false ? `${label} unavailable` : source?.ok === true ? `${label} connected` : `${label} not requested`;
    return `<span class="${className}">${escapeHtml(text)}</span>`;
  }).join("");
}

function renderList() {
  updateCounts();
  const hasRows = state.submissions.length > 0;
  tableShell.hidden = !hasRows;
  empty.hidden = hasRows;
  if (!hasRows) { list.innerHTML = ""; return; }
  list.innerHTML = state.submissions.map((record) => `
    <tr data-id="${escapeHtml(record.id)}">
      <td data-label="Type"><span class="submission-type submission-type--${escapeHtml(record.type)}">${escapeHtml(typeLabel(record.type))}</span><span class="submission-status submission-status--${escapeHtml(statusLabel(record).toLowerCase().replaceAll(" ", "-"))}">${escapeHtml(statusLabel(record))}</span></td>
      <td data-label="Customer"><strong>${escapeHtml(customerName(record))}</strong><small>${escapeHtml(customerContact(record))}</small></td>
      <td data-label="Request"><span class="row-summary">${escapeHtml(record.summary || "Submission")}</span><small>${escapeHtml(locationLabel(record))}</small></td>
      <td data-label="Submitted"><time datetime="${escapeHtml(record.submittedAt)}">${escapeHtml(formatDate(record.submittedAt))}</time></td>
      <td class="row-actions" data-label="Actions">
        ${rowActionButtons(record)}
      </td>
    </tr>
  `).join("");
}

const sheetsCard = document.querySelector("[data-sheets-export]");
const sheetsSettingsForm = document.querySelector("[data-sheets-settings-form]");
const sheetsSpreadsheetInput = document.querySelector("[data-sheets-spreadsheet]");
const sheetsStatus = document.querySelector("[data-sheets-status]");
const sheetsSync = document.querySelector("[data-sheets-sync]");
const sheetsSyncText = document.querySelector("[data-sheets-sync-text]");
const sheetsServiceAccount = document.querySelector("[data-sheets-service-account]");
const sheetsSaveButton = document.querySelector("[data-sheets-save]");
const sheetsTestButton = document.querySelector("[data-sheets-test]");
const sheetsExportAllButton = document.querySelector("[data-sheets-export-all]");

function setSheetsStatus(text, state = "") {
  sheetsStatus.textContent = text;
  sheetsStatus.dataset.state = state;
}

function renderSheetsSync(sync) {
  sheetsState.sync = sync || null;
  if (!sheetsSync || !sheetsSyncText) return;
  if (isLocalFixture) {
    sheetsSync.dataset.state = "success";
    sheetsSyncText.textContent = "Preview mode · sync is simulated.";
    return;
  }
  if (!sheetsState.configured) {
    sheetsSync.dataset.state = "neutral";
    sheetsSyncText.textContent = "Connect a Sheet to see sync status.";
    return;
  }
  if (!sheetsSpreadsheetInput.value.trim()) {
    sheetsSync.dataset.state = "neutral";
    sheetsSyncText.textContent = "No destination Sheet selected.";
    return;
  }
  if (!sync) {
    sheetsSync.dataset.state = "checking";
    sheetsSyncText.textContent = "Sync status is being checked…";
    return;
  }
  sheetsSync.dataset.state = sync.status === "synced" ? "success" : sync.status === "check-failed" ? "error" : "warning";
  sheetsSyncText.textContent = sync.message || "Sync status could not be checked.";
}

function updateSheetsControls() {
  sheetsExportAllButton.disabled = !sheetsState.ready || sheetsState.loading;
  sheetsTestButton.disabled = sheetsState.loading;
  sheetsSaveButton.disabled = sheetsState.loading;
}

async function readSheetsSettings() {
  if (isLocalFixture) {
    sheetsState.configured = true;
    sheetsState.ready = true;
    sheetsSpreadsheetInput.value = "fixture-sheet";
    setSheetsStatus("Preview mode: export buttons are simulated locally.", "success");
    renderSheetsSync({ status: "synced", message: "Preview mode · sync is simulated." });
    updateSheetsControls();
    return;
  }
  try {
    const response = await fetch("/api/admin/google-sheets/settings");
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || "Google Sheets setup could not be loaded.");
    sheetsSpreadsheetInput.value = body.spreadsheetId || "";
    sheetsServiceAccount.textContent = body.serviceAccountEmail || "the site’s Google service account";
    sheetsState.configured = Boolean(body.configured);
    sheetsState.ready = Boolean(body.configured && body.spreadsheetId && !body.accessMessage);
    renderSheetsSync(body.sync);
    if (!body.configured) setSheetsStatus("The site still needs its Google Sheets service account setup.", "error");
    else if (body.accessMessage) setSheetsStatus(body.accessMessage, "error");
    else if (body.spreadsheetTitle) setSheetsStatus(`${body.spreadsheetTitle} is connected.`, "success");
    else setSheetsStatus("Service account ready. Add a Sheet URL to test the connection.");
  } catch (error) { setSheetsStatus(error.message || "Google Sheets setup could not be loaded.", "error"); }
  updateSheetsControls();
  renderList();
}

async function saveSheetsSettings(event) {
  event.preventDefault();
  if (isLocalFixture) { setSheetsStatus("Preview mode: this connection is simulated locally.", "success"); return; }
  sheetsState.loading = true;
  updateSheetsControls();
  setSheetsStatus("Testing the Sheet and saving the connection…");
  try {
    const response = await fetch("/api/admin/google-sheets/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spreadsheet: sheetsSpreadsheetInput.value }) });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || "The Sheet could not be connected.");
    sheetsState.configured = true;
    sheetsState.ready = true;
    sheetsSpreadsheetInput.value = body.spreadsheetId || sheetsSpreadsheetInput.value;
    setSheetsStatus(`${body.spreadsheetTitle || "Google Sheet"} is connected and ready.`, "success");
    renderSheetsSync(body.sync);
  } catch (error) {
    sheetsState.ready = false;
    setSheetsStatus(error.message || "The Sheet could not be connected.", "error");
  } finally { sheetsState.loading = false; updateSheetsControls(); renderList(); }
}

async function testSheetsConnection() {
  if (isLocalFixture) { setSheetsStatus("Preview mode: this connection is simulated locally.", "success"); return; }
  sheetsState.loading = true;
  updateSheetsControls();
  setSheetsStatus("Testing the Sheet connection…");
  try {
    const response = await fetch("/api/admin/google-sheets/test", { method: "POST" });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || "The Sheet connection could not be tested.");
    sheetsState.ready = true;
    renderSheetsSync(body.sync);
    setSheetsStatus(`${body.spreadsheetTitle || "Google Sheet"} is connected.`, "success");
  } catch (error) { sheetsState.ready = false; setSheetsStatus(error.message || "The Sheet connection could not be tested.", "error"); }
  finally { sheetsState.loading = false; updateSheetsControls(); renderList(); }
}

async function exportSubmissions() {
  if (sheetsState.loading) return;
  if (isLocalFixture) { setSheetsStatus("Preview mode: all requests would be exported to their form tabs.", "success"); renderSheetsSync({ status: "synced", message: "Preview mode · sync is simulated." }); return; }
  sheetsState.loading = true;
  updateSheetsControls();
  setSheetsStatus("Exporting all requests to their form tabs…");
  try {
    const response = await fetch("/api/admin/google-sheets/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || "The export could not be completed.");
    renderSheetsSync(body.sync);
    setSheetsStatus(body.message || "The export is complete.", body.failed ? "error" : "success");
  } catch (error) { setSheetsStatus(error.message || "The export could not be completed.", "error"); }
  finally { sheetsState.loading = false; updateSheetsControls(); }
}

sheetsSettingsForm.addEventListener("submit", saveSheetsSettings);
sheetsTestButton.addEventListener("click", testSheetsConnection);
sheetsExportAllButton.addEventListener("click", () => exportSubmissions());

function detailSection(title, entries) {
  const visible = entries.filter(([, value]) => value && (!Array.isArray(value) || value.length));
  if (!visible.length) return "";
  return `<section class="detail-section"><h3>${escapeHtml(title)}</h3><dl>${visible.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${displayValue(value)}</dd></div>`).join("")}</dl></section>`;
}

function editableControl({ scope, key, label, value }) {
  const isArray = Array.isArray(value);
  const valueType = isArray ? "array" : typeof value;
  const textValue = isArray ? value.join("\n") : String(value ?? "");
  const longAnswer = isArray || textValue.length > 120 || /testimonial|comments?|description|details?|notes?/i.test(`${key} ${label}`);
  const inputType = /email/i.test(`${key} ${label}`) ? "email"
    : /phone|mobile|tel/i.test(`${key} ${label}`) ? "tel"
    : /date|day/i.test(key) && /^\d{4}-\d{2}-\d{2}$/.test(textValue) ? "date"
    : "text";
  const attributes = `data-edit-scope="${escapeHtml(scope)}" data-edit-key="${escapeHtml(key)}" data-value-type="${escapeHtml(valueType)}"`;
  const control = longAnswer
    ? `<textarea ${attributes} rows="${isArray ? 4 : 3}">${escapeHtml(textValue)}</textarea>`
    : `<input ${attributes} type="${inputType}" value="${escapeHtml(textValue)}" />`;
  return `<label class="submission-edit-field"><span>${escapeHtml(label)}</span>${control}${isArray ? "<small>Enter one choice per line.</small>" : ""}</label>`;
}

function editableSection(title, fields) {
  if (!fields.length) return "";
  return `<section class="detail-section submission-edit-section"><h3>${escapeHtml(title)}</h3><div class="submission-edit-grid">${fields.map(editableControl).join("")}</div></section>`;
}

function renderDetails(record, { editing = false } = {}) {
  state.editing = editing;
  const details = (record.details || []).map((detail) => [detail.label, detail.value]);
  const photos = (record.photos || []).map((photo) => `<a href="${escapeHtml(photo.url)}" target="_blank" rel="noopener"><img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.label || "Submission photo")}" /></a>`).join("");
  const content = editing ? `
    ${editableSection("Contact", [
      { scope: "customer", key: "name", label: "Name", value: customerName(record) === "Name not provided" ? "" : customerName(record) },
      { scope: "customer", key: "phone", label: "Phone", value: record.customer?.phone || "" },
      { scope: "customer", key: "email", label: "Email", value: record.customer?.email || "" },
    ])}
    ${editableSection("Location", [
      { scope: "location", key: "address", label: "Address", value: record.location?.address || "" },
      { scope: "location", key: "city", label: "City", value: record.location?.city || "" },
      { scope: "location", key: "state", label: "State", value: record.location?.state || "" },
      { scope: "location", key: "zip", label: "ZIP Code", value: record.location?.zip || "" },
      { scope: "location", key: "neighborhood", label: "Neighborhood", value: record.location?.neighborhood || "" },
    ])}
    ${editableSection(record.type === "testimonial" ? "Testimonial" : "Request details", (record.details || []).map((detail) => ({ scope: "answers", key: detail.key, label: detail.label, value: detail.value })))}
  ` : `
    ${detailSection("Contact", [["Phone", record.customer?.phone], ["Email", record.customer?.email]])}
    ${detailSection("Location", [["Address", record.location?.address], ["City", record.location?.city], ["State", record.location?.state], ["ZIP Code", record.location?.zip], ["Neighborhood", record.location?.neighborhood]])}
    ${detailSection(record.type === "testimonial" ? "Testimonial" : "Request details", details)}
    ${photos ? `<section class="detail-section"><h3>Photos</h3><div class="detail-photos">${photos}</div></section>` : ""}
  `;
  document.querySelector("#dialog-content").innerHTML = `
    <p class="eyebrow">${escapeHtml(typeLabel(record.type))} submission</p>
    <h2 id="submission-dialog-title">${escapeHtml(customerName(record))}</h2>
    <p class="detail-date">${escapeHtml(formatDate(record.submittedAt))} · ${escapeHtml(statusLabel(record))}</p>
    ${content}
  `;
  const editButton = detailsDialog.querySelector("[data-edit-current]");
  const saveButton = detailsDialog.querySelector("[data-save-current]");
  const cancelButton = detailsDialog.querySelector("[data-cancel-edit]");
  const approveButton = detailsDialog.querySelector("[data-approve-current]");
  const deleteButton = detailsDialog.querySelector("[data-delete-current]");
  const closeButton = detailsDialog.querySelector("[data-close-details]");
  editButton.hidden = editing;
  saveButton.hidden = !editing;
  cancelButton.hidden = !editing;
  approveButton.hidden = editing || !isPendingTestimonial(record);
  deleteButton.hidden = editing;
  closeButton.hidden = editing;
  deleteButton.textContent = isPendingTestimonial(record)
    ? "Disapprove and delete"
    : record.type === "testimonial" && record.status === "Approved"
      ? "Remove from site"
      : "Delete submission";
  const editStatus = detailsDialog.querySelector("[data-edit-status]");
  editStatus.textContent = editing ? "Edit the responses below, then save or cancel." : "";
  editStatus.dataset.state = "";
}

function openDetails(record) {
  state.selectedId = record.id;
  renderDetails(record);
  detailsDialog.showModal();
}

function currentSubmission() {
  return state.submissions.find((item) => item.id === state.selectedId);
}

function readEditedChanges() {
  const changes = { customer: {}, location: {}, answers: {} };
  detailsDialog.querySelectorAll("[data-edit-scope][data-edit-key]").forEach((control) => {
    const scope = control.dataset.editScope;
    const key = control.dataset.editKey;
    let value = control.value;
    if (control.dataset.valueType === "array") value = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    else if (control.dataset.valueType === "boolean") value = value === "true";
    else if (control.dataset.valueType === "number") value = Number(value);
    changes[scope][key] = value;
  });
  return changes;
}

async function saveSubmissionEdits() {
  const record = currentSubmission();
  if (!record || !state.editing) return;
  const saveButton = detailsDialog.querySelector("[data-save-current]");
  const cancelButton = detailsDialog.querySelector("[data-cancel-edit]");
  const editStatus = detailsDialog.querySelector("[data-edit-status]");
  saveButton.disabled = true;
  cancelButton.disabled = true;
  editStatus.textContent = "Saving changes…";
  editStatus.dataset.state = "";
  try {
    let updatedRecord;
    if (isLocalFixture) {
      updatedRecord = structuredClone(record);
      const changes = readEditedChanges();
      updatedRecord.customer = { ...updatedRecord.customer, ...changes.customer };
      updatedRecord.location = { ...updatedRecord.location, ...changes.location };
      updatedRecord.details = (updatedRecord.details || []).map((detail) => Object.prototype.hasOwnProperty.call(changes.answers, detail.key) ? { ...detail, value: changes.answers[detail.key] } : detail);
    } else {
      const response = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit-submission", type: record.type, id: record.id, changes: readEditedChanges() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The submission changes could not be saved.");
      updatedRecord = body.submission;
    }
    state.submissions = state.submissions.map((item) => item.id === updatedRecord.id ? updatedRecord : item);
    renderList();
    renderDetails(updatedRecord);
    editStatus.textContent = "Changes saved. They will remain after the dashboard is refreshed.";
    editStatus.dataset.state = "success";
    message.hidden = false;
    message.textContent = `${typeLabel(updatedRecord.type)} submission from ${customerName(updatedRecord)} was updated.`;
  } catch (error) {
    editStatus.textContent = error.message || "The submission changes could not be saved.";
    editStatus.dataset.state = "error";
  } finally {
    saveButton.disabled = false;
    cancelButton.disabled = false;
  }
}

function askToDelete(record, disapprove = false) {
  state.pendingDeleteId = record.id;
  deleteStatus.textContent = "";
  document.querySelector("#delete-heading").textContent = disapprove ? "Disapprove this testimonial?" : "Delete this submission?";
  document.querySelector("#delete-description").textContent = `${typeLabel(record.type)} submission from ${customerName(record)}.`;
  confirmDelete.textContent = disapprove ? "Disapprove and delete" : "Delete permanently";
  if (detailsDialog.open) detailsDialog.close();
  deleteDialog.showModal();
}

async function approveTestimonial(record, trigger) {
  if (!isPendingTestimonial(record)) return;
  if (trigger instanceof HTMLButtonElement) trigger.disabled = true;
  message.hidden = false;
  message.textContent = `Approving testimonial from ${customerName(record)}…`;
  try {
    if (!isLocalFixture) {
      const response = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve-testimonial", id: record.id }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The testimonial could not be approved.");
    }
    record.status = "Approved";
    renderList();
    if (detailsDialog.open) detailsDialog.close();
    message.textContent = `The testimonial from ${customerName(record)} is now published on the site.`;
  } catch (error) {
    message.textContent = error.message || "The testimonial could not be approved.";
  } finally {
    if (trigger instanceof HTMLButtonElement) trigger.disabled = false;
  }
}

async function deletePendingSubmission() {
  const record = state.submissions.find((item) => item.id === state.pendingDeleteId);
  if (!record) return;
  confirmDelete.disabled = true;
  document.querySelector("[data-cancel-delete]").disabled = true;
  deleteStatus.textContent = "Deleting submission…";
  try {
    if (!isLocalFixture) {
      const response = await fetch("/api/admin/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: record.type, id: record.id }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The submission could not be deleted.");
      if (body?.warning) message.textContent = body.warning;
    }
    state.submissions = state.submissions.filter((item) => item.id !== record.id);
    renderList();
    deleteDialog.close();
    message.hidden = false;
    message.textContent = `${typeLabel(record.type)} submission from ${customerName(record)} was deleted.`;
  } catch (error) {
    deleteStatus.textContent = error.message || "The submission could not be deleted.";
  } finally {
    confirmDelete.disabled = false;
    document.querySelector("[data-cancel-delete]").disabled = false;
  }
}

async function load({ append = false } = {}) {
  if (state.loading) return;
  state.loading = true;
  message.textContent = append ? "Loading more…" : "Loading submissions…";
  message.hidden = false;
  loadMore.disabled = true;
  try {
    const params = new URLSearchParams({ type: state.type, limit: "60" });
    if (state.search) params.set("search", state.search);
    if (append && state.nextCursor) params.set("cursor", state.nextCursor);
    const data = isLocalFixture ? fixtureData : await fetch(`/api/admin/submissions?${params}`).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The dashboard could not load.");
      return body;
    });
    state.submissions = append ? [...state.submissions, ...data.submissions] : data.submissions;
    state.nextCursor = data.nextCursor || "";
    document.querySelector("#viewer-email").textContent = data.viewer?.email || "Signed-in owner";
    renderStatuses(data.sources);
    renderList();
    message.hidden = true;
    loadMore.hidden = !state.nextCursor || isLocalFixture;
  } catch (error) {
    message.textContent = error.message || "The dashboard could not load.";
    if (!append) { state.submissions = []; renderList(); empty.hidden = true; tableShell.hidden = true; }
  } finally {
    state.loading = false;
    loadMore.disabled = false;
  }
}

document.querySelector(".admin-filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  document.querySelectorAll("[data-type]").forEach((item) => item.classList.toggle("is-active", item === button));
  state.type = button.dataset.type;
  state.nextCursor = "";
  load();
});
let searchTimer;
document.querySelector("#admin-search").addEventListener("input", (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.search = event.target.value.trim(); state.nextCursor = ""; load(); }, 300);
});
list.addEventListener("click", (event) => {
  const row = event.target.closest("[data-id]");
  const record = state.submissions.find((item) => item.id === row?.dataset.id);
  if (!record) return;
  if (event.target.closest("[data-approve]")) approveTestimonial(record, event.target.closest("[data-approve]"));
  else if (event.target.closest("[data-disapprove]")) askToDelete(record, true);
  else if (event.target.closest("[data-delete]")) askToDelete(record);
  if (event.target.closest("[data-view]")) openDetails(record);
});
loadMore.addEventListener("click", () => load({ append: true }));
detailsDialog.querySelector(".dialog-close").addEventListener("click", () => { state.editing = false; detailsDialog.close(); });
detailsDialog.querySelector("[data-close-details]").addEventListener("click", () => { state.editing = false; detailsDialog.close(); });
detailsDialog.querySelector("[data-edit-current]").addEventListener("click", () => {
  const record = currentSubmission();
  if (record) renderDetails(record, { editing: true });
});
detailsDialog.querySelector("[data-save-current]").addEventListener("click", saveSubmissionEdits);
detailsDialog.querySelector("[data-cancel-edit]").addEventListener("click", () => {
  const record = currentSubmission();
  if (record) renderDetails(record);
});
detailsDialog.querySelector("[data-delete-current]").addEventListener("click", () => {
  const record = state.submissions.find((item) => item.id === state.selectedId);
  if (record) askToDelete(record, isPendingTestimonial(record));
});
detailsDialog.querySelector("[data-approve-current]").addEventListener("click", (event) => {
  const record = state.submissions.find((item) => item.id === state.selectedId);
  if (record) approveTestimonial(record, event.currentTarget);
});
detailsDialog.addEventListener("click", (event) => { if (event.target === detailsDialog && !state.editing) detailsDialog.close(); });
deleteDialog.querySelector("[data-cancel-delete]").addEventListener("click", () => deleteDialog.close());
deleteDialog.addEventListener("click", (event) => { if (event.target === deleteDialog && !confirmDelete.disabled) deleteDialog.close(); });
confirmDelete.addEventListener("click", deletePendingSubmission);
load();
readSheetsSettings();

const defaultFormSchemas = JSON.parse(document.querySelector("#default-form-schemas").textContent);
const supportedFieldTypes = JSON.parse(document.querySelector("#supported-field-types").textContent);
const supportedStepIcons = JSON.parse(document.querySelector("#supported-step-icons").textContent);
const fieldTypeLabels = {
  text: "Short text", email: "Email", phone: "Phone", date: "Date",
  textarea: "Paragraph", select: "Dropdown", radio: "Single choice",
  checkboxes: "Checkbox cards", photos: "Photo upload",
};
const optionFieldTypes = new Set(["select", "radio", "checkboxes"]);
const placeholderFieldTypes = new Set(["text", "email", "phone", "textarea"]);
const stepIconLabels = {
  contact: "Person", location: "Location pin", timing: "Calendar", sukkah: "Sukkah",
  site: "Site / landscape", final: "Checklist", phone: "Phone", home: "Home",
  ruler: "Measurements", tools: "Tools", message: "Message", photo: "Photo",
};
const stepIconPaths = {
  contact: '<circle cx="12" cy="8" r="3.25"/><path d="M5.75 19c.65-3.25 2.75-5 6.25-5s5.6 1.75 6.25 5"/>',
  location: '<path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.25"/>',
  sukkah: '<path d="M5 20V9h14v11M4 9h16"/><path d="M5 7.5c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0M9.5 20v-7h5v7"/>',
  site: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m5.5 17 4-4 3 3 2-2 4 3"/>',
  timing: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/><path d="m9.5 15 1.5 1.5 3.5-4"/>',
  final: '<path d="M8 5h8M9 3.5h6v3H9z"/><path d="M7 5.5H5.5v15h13v-15H17"/><path d="m8.5 14 2.25 2.25 4.75-5"/>',
  phone: '<path d="M7.25 4.5 9.5 4l2 4-1.75 1.5a13.5 13.5 0 0 0 4.75 4.75L16 12.5l4 2 .5 2.25a2.5 2.5 0 0 1-2.75 2.75C11.2 18.5 5.5 12.8 4.5 6.25A2.5 2.5 0 0 1 7.25 4.5Z"/>',
  home: '<path d="m3.5 11.5 8.5-7 8.5 7"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-5h5v5"/>',
  ruler: '<path d="M4 17.5 17.5 4l2.5 2.5L6.5 20z"/><path d="m8 16 2 2M11 13l2 2M14 10l2 2"/>',
  tools: '<path d="m14 6 4 4M17.5 3.5a4 4 0 0 0-4.6 4.6L5 16a2.1 2.1 0 1 0 3 3l7.9-7.9a4 4 0 0 0 4.6-4.6l-2.5 2.5-3-3Z"/>',
  message: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
  photo: '<rect x="3.5" y="5.5" width="17" height="14" rx="2"/><path d="m8 5.5 1.2-2h5.6l1.2 2"/><circle cx="12" cy="12.5" r="3"/>',
};
function stepIconSvg(icon) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${stepIconPaths[icon] || stepIconPaths.site}</svg>`;
}
const editor = {
  forms: [], selectedId: "", schema: null, dirty: false,
};
const formList = document.querySelector("[data-form-list]");
const editorShell = document.querySelector("[data-form-editor]");
const editorLoading = document.querySelector("[data-form-editor-loading]");
const stepEditor = document.querySelector("[data-form-step-editor]");
const previewHost = document.querySelector("[data-form-preview]");
const editorStatus = document.querySelector("[data-form-editor-status]");
const newFormDialog = document.querySelector("#new-form-dialog");
const formListRail = document.querySelector("[data-form-list-rail]");
const formListScrollButtons = [...formListRail.querySelectorAll("[data-form-list-scroll]")];
const adminTabs = [...document.querySelectorAll("[data-admin-tab]")];
const adminPanels = [...document.querySelectorAll("[data-admin-panel]")];
let stepObserver;
let previewSyncing = false;
let previewScrollFrame = 0;
let previewActiveStep = 0;

function activateAdminTab(tabName, { updateHash = true } = {}) {
  const nextTab = adminTabs.some((tab) => tab.dataset.adminTab === tabName) ? tabName : "builder";
  adminTabs.forEach((tab) => {
    const active = tab.dataset.adminTab === nextTab;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
    tab.tabIndex = active ? 0 : -1;
  });
  adminPanels.forEach((panel) => { panel.hidden = panel.dataset.adminPanel !== nextTab; });
  if (updateHash) history.replaceState(null, "", `${location.pathname}${location.search}#${nextTab}`);
}

adminTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateAdminTab(tab.dataset.adminTab));
  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? adminTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + adminTabs.length) % adminTabs.length;
    const nextTab = adminTabs[nextIndex];
    activateAdminTab(nextTab.dataset.adminTab);
    nextTab.focus();
  });
});
window.addEventListener("hashchange", () => activateAdminTab(location.hash === "#submissions" ? "submissions" : "builder", { updateHash: false }));
activateAdminTab(location.hash === "#submissions" ? "submissions" : "builder", { updateHash: false });

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function makeId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function slugify(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function selected(value, expected) { return value === expected ? " selected" : ""; }
function checked(value) { return value ? " checked" : ""; }
function publicFormPath(schema) {
  if (schema.id === "builds") return "/sukka-builder/";
  if (schema.id === "rentals") return "/sukkah-rentals/";
  if (schema.id === "purchases") return "/purchases/";
  return `/request/${encodeURIComponent(schema.slug)}/`;
}
function editorFields() { return editor.schema?.steps.flatMap((step) => step.fields || []) || []; }
function fieldsBefore(stepIndex, fieldIndex) {
  return editor.schema?.steps.flatMap((step, index) => index < stepIndex ? (step.fields || []) : index === stepIndex ? (step.fields || []).slice(0, fieldIndex) : []) || [];
}
function markEditorDirty() {
  editor.dirty = true;
  editorStatus.dataset.state = "working";
  editorStatus.textContent = "You have unpublished changes.";
  renderEditorPreview();
}

function renderFormList() {
  formList.innerHTML = editor.forms.map((form) => `
    <button type="button" class="form-list-item${form.id === editor.selectedId ? " is-active" : ""}" data-select-form="${escapeHtml(form.id)}"${form.id === editor.selectedId ? " aria-current=\"true\"" : ""}>
      <strong>${escapeHtml(form.title)}</strong>
      <small>${form.publishedVersion ? `Published version ${escapeHtml(form.publishedVersion)}` : "Draft only"}</small>
    </button>
  `).join("");
  updateFormListScrollButtons();
}

function updateFormListScrollButtons() {
  const canScroll = formList.scrollWidth > formList.clientWidth + 4;
  formListScrollButtons.forEach((button) => {
    const direction = button.dataset.formListScroll;
    const atStart = formList.scrollLeft <= 4;
    const atEnd = formList.scrollLeft + formList.clientWidth >= formList.scrollWidth - 4;
    button.disabled = !canScroll || (direction === "prev" ? atStart : atEnd);
  });
}

formListScrollButtons.forEach((button) => button.addEventListener("click", () => {
  const amount = Math.max(180, Math.round(formList.clientWidth * 0.8));
  formList.scrollBy({ left: button.dataset.formListScroll === "prev" ? -amount : amount, behavior: "smooth" });
}));
formList.addEventListener("scroll", updateFormListScrollButtons, { passive: true });
window.addEventListener("resize", updateFormListScrollButtons);

function fieldCard(field, stepIndex, fieldIndex) {
  const conditionSource = fieldsBefore(stepIndex, fieldIndex).find((candidate) => candidate.id === field.condition?.fieldId);
  const conditionChoices = fieldsBefore(stepIndex, fieldIndex).map((candidate) =>
    `<option value="${escapeHtml(candidate.id)}"${selected(field.condition?.fieldId, candidate.id)}>${escapeHtml(candidate.label)}</option>`).join("");
  const typeChoices = supportedFieldTypes.map((type) => `<option value="${type}"${selected(field.type, type)}>${fieldTypeLabels[type]}</option>`).join("");
  const conditionOperator = conditionSource?.type === "checkboxes" ? "includes" : "equals";
  const conditionValueControl = Array.isArray(conditionSource?.options)
    ? `<select data-condition-setting="value"><option value="">Choose an answer</option>${conditionSource.options.map((option) => `<option value="${escapeHtml(option)}"${selected(field.condition?.value, option)}>${escapeHtml(option)}</option>`).join("")}</select>`
    : `<input data-condition-setting="value" value="${escapeHtml(field.condition?.value || "")}" placeholder="Answer that should trigger this question" />`;
  const conditionIncomplete = field.condition?.fieldId && !field.condition?.value;
  return `<article class="field-editor-card" data-step-index="${stepIndex}" data-field-index="${fieldIndex}">
    <div class="field-editor-card__top">
      <span class="field-type-badge">${escapeHtml(fieldTypeLabels[field.type] || field.type)}</span>
      <div class="mini-actions">
        <button type="button" data-field-action="up" aria-label="Move question up">↑</button>
        <button type="button" data-field-action="down" aria-label="Move question down">↓</button>
        <button type="button" data-field-action="duplicate">Duplicate</button>
        <button class="is-danger" type="button" data-field-action="delete">Remove</button>
      </div>
    </div>
    <div class="field-editor-grid">
      <label><span>Question</span><input data-field-setting="label" value="${escapeHtml(field.label)}" maxlength="180" /></label>
      <label><span>Field type</span><select data-field-setting="type">${typeChoices}</select></label>
      <label class="field-editor-full"><span>Help text <small>Optional</small></span><input data-field-setting="helpText" value="${escapeHtml(field.helpText || "")}" maxlength="500" /></label>
      ${placeholderFieldTypes.has(field.type) ? `<label class="field-editor-full"><span>Placeholder text <small>Optional</small></span><input data-field-setting="placeholder" value="${escapeHtml(field.placeholder || "")}" maxlength="300" placeholder="Example text shown inside the field" /></label>` : ""}
      ${optionFieldTypes.has(field.type) ? `<label class="field-editor-full"><span>Options <small>One per line</small></span><textarea data-field-setting="options" rows="4">${escapeHtml((field.options || []).join("\n"))}</textarea></label>` : ""}
      <label class="toggle-setting"><input data-field-setting="required" type="checkbox"${checked(field.required)} /><span>Required question</span></label>
    </div>
    <details class="condition-editor"${field.condition ? " open" : ""}>
      <summary>Conditional follow-up</summary>
      <p>Use this for a follow-up question that should appear only after a specific answer. For example, show “Tell us about it” when someone chooses “Other.”</p>
      <div class="condition-grid">
        <label><span>Question to watch</span><select data-condition-setting="fieldId"><option value="">Always show</option>${conditionChoices}</select><small>Choose the earlier question that controls this one.</small></label>
        <label><span>Rule</span><select data-condition-setting="operator"><option value="equals"${selected(conditionOperator, "equals")}>Equals</option>${conditionSource?.type === "checkboxes" ? `<option value="includes"${selected(conditionOperator, "includes")}>Includes selected option</option>` : ""}</select><small>${conditionSource?.type === "checkboxes" ? "Use Includes for checkbox cards." : "Use Equals for one-answer fields."}</small></label>
        <label><span>Answer that triggers it</span>${conditionValueControl}<small>${conditionIncomplete ? "Choose an answer to turn this rule on." : "This answer makes the follow-up appear."}</small></label>
      </div>
    </details>
  </article>`;
}

function renderStepEditor() {
  stepEditor.innerHTML = editor.schema.steps.map((step, stepIndex) => `
    <section class="step-editor-card" data-step-index="${stepIndex}">
      <div class="step-editor-heading">
        <span>${stepIndex + 1}</span>
        <label><span class="sr-only">Step name</span><input data-step-title value="${escapeHtml(step.title)}" maxlength="100" /></label>
        <div class="step-icon-setting">
          <span class="sr-only">Section icon</span>
          <details class="step-icon-picker">
            <summary aria-label="Section icon: ${escapeHtml(stepIconLabels[step.icon] || "Site / landscape")}">
              <span class="step-icon-picker__current">${stepIconSvg(step.icon)}</span>
              <span class="step-icon-picker__label">${escapeHtml(stepIconLabels[step.icon] || "Site / landscape")}</span>
              <span class="step-icon-picker__chevron" aria-hidden="true">⌄</span>
            </summary>
            <div class="step-icon-picker__menu" role="listbox" aria-label="Choose section icon">
              ${supportedStepIcons.map((icon) => `<button type="button" role="option" aria-selected="${step.icon === icon ? "true" : "false"}" class="step-icon-picker__option${step.icon === icon ? " is-selected" : ""}" data-step-icon-option="${escapeHtml(icon)}"><span class="step-icon-picker__option-icon">${stepIconSvg(icon)}</span><span>${escapeHtml(stepIconLabels[icon] || icon)}</span></button>`).join("")}
            </div>
          </details>
        </div>
        <div class="mini-actions">
          <button type="button" data-step-action="up" aria-label="Move step up">↑</button>
          <button type="button" data-step-action="down" aria-label="Move step down">↓</button>
          <button class="is-danger" type="button" data-step-action="delete">Remove step</button>
        </div>
      </div>
      <div class="step-fields">${step.fields.map((field, fieldIndex) => fieldCard(field, stepIndex, fieldIndex)).join("")}</div>
      <button class="add-question-button" type="button" data-add-field>+ Add question to ${escapeHtml(step.title)}</button>
    </section>
  `).join("");
  refreshScrollSync();
}

function previewControl(field) {
  const fieldId = escapeHtml(field.id);
  const label = escapeHtml(`${field.label}${field.required ? " *" : " (Optional)"}`);
  const required = field.required ? " required" : "";
  const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
  const autocomplete = field.autocomplete ? ` autocomplete="${escapeHtml(field.autocomplete)}"` : "";
  if (["radio", "checkboxes"].includes(field.type)) {
    return `<fieldset><legend>${label}</legend><div class="preview-choice-grid">${(field.options || []).map((option) => `<label><input type="${field.type === "radio" ? "radio" : "checkbox"}" name="${fieldId}" value="${escapeHtml(option)}" /> <span>${escapeHtml(option)}</span></label>`).join("")}</div></fieldset>`;
  }
  if (field.type === "textarea") return `<label for="preview-${fieldId}">${label}<textarea id="preview-${fieldId}" name="${fieldId}" rows="3"${placeholder}${required}></textarea></label>`;
  if (field.type === "select") return `<label for="preview-${fieldId}">${label}<select id="preview-${fieldId}" name="${fieldId}"${autocomplete}${required}><option value="">Choose an option</option>${(field.options || []).map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}</select></label>`;
  if (field.type === "photos") return `<label for="preview-${fieldId}">${label}<input id="preview-${fieldId}" name="${fieldId}" type="file" accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif" multiple /></label>`;
  const types = { email: "email", phone: "tel", date: "date", text: "text" };
  return `<label for="preview-${fieldId}">${label}<input id="preview-${fieldId}" name="${fieldId}" type="${types[field.type] || "text"}"${placeholder}${autocomplete}${required} /></label>`;
}

function previewFieldMarkup(field) {
  const condition = field.condition;
  const completeCondition = condition?.fieldId && condition?.value;
  const conditionSource = editorFields().find((candidate) => candidate.id === condition?.fieldId);
  const conditionSourceLabel = conditionSource?.label || condition?.fieldId || "another question";
  const conditionAttributes = completeCondition
    ? ` data-condition-field-id="${escapeHtml(condition.fieldId)}" data-condition-operator="${escapeHtml(condition.operator)}" data-condition-value="${escapeHtml(condition.value)}"`
    : "";
  const conditionHint = completeCondition
    ? `<small>Shown when ${escapeHtml(conditionSourceLabel)} ${escapeHtml(condition.operator)} “${escapeHtml(condition.value)}”</small>`
    : condition?.fieldId
      ? "<small class=\"preview-condition-warning\">Choose a trigger answer in the builder to activate this follow-up.</small>"
      : "";
  return `<div class="preview-field" data-preview-field-id="${escapeHtml(field.id)}"${conditionAttributes}>${previewControl(field)}${conditionHint}</div>`;
}

function previewFieldValue(fieldId) {
  const controls = [...previewHost.querySelectorAll(`[name="${CSS.escape(fieldId)}"]`)];
  if (!controls.length) return "";
  if (controls[0].type === "checkbox") return controls.filter((control) => control.checked).map((control) => control.value);
  if (controls[0].type === "radio") return controls.find((control) => control.checked)?.value || "";
  return controls.find((control) => control.checked)?.value || controls[0].value || "";
}

function updatePreviewConditions() {
  if (!editor.schema) return;
  editorFields().forEach((field) => {
    const wrapper = previewHost.querySelector(`[data-preview-field-id="${CSS.escape(field.id)}"]`);
    if (!wrapper) return;
    const condition = field.condition?.fieldId && field.condition?.value ? field.condition : null;
    const sourceValue = condition ? previewFieldValue(condition.fieldId) : "";
    const visible = !condition || (condition.operator === "includes" ? Array.isArray(sourceValue) && sourceValue.includes(condition.value) : sourceValue === condition.value);
    wrapper.hidden = !visible;
    wrapper.querySelectorAll("input, select, textarea").forEach((control) => { control.disabled = !visible; });
  });
}

function setSyncActiveStep(stepIndex) {
  stepEditor.querySelectorAll(".step-editor-card").forEach((step) => step.classList.toggle("is-scroll-active", Number(step.dataset.stepIndex) === stepIndex));
  previewHost.querySelectorAll("[data-preview-step]").forEach((step) => step.classList.toggle("is-scroll-active", Number(step.dataset.previewStep) === stepIndex));
}

function syncPreviewToStep(stepIndex, smooth = true) {
  const target = previewHost.querySelector(`[data-preview-step="${stepIndex}"]`);
  if (!target || previewHost.scrollHeight <= previewHost.clientHeight + 4) return;
  setSyncActiveStep(stepIndex);
  previewSyncing = true;
  previewHost.scrollTo({ top: Math.max(0, target.offsetTop - 12), behavior: smooth ? "smooth" : "auto" });
  window.setTimeout(() => { previewSyncing = false; }, smooth ? 500 : 50);
}

function syncEditorToStep(stepIndex) {
  const target = stepEditor.querySelector(`.step-editor-card[data-step-index="${stepIndex}"]`);
  if (!target) return;
  setSyncActiveStep(stepIndex);
  previewSyncing = true;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => { previewSyncing = false; }, 500);
}

function refreshScrollSync() {
  stepObserver?.disconnect();
  if (!("IntersectionObserver" in window)) return;
  stepObserver = new IntersectionObserver((entries) => {
    if (previewSyncing) return;
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const stepIndex = Number(visible.target.dataset.stepIndex);
    if (stepIndex === previewActiveStep) return;
    previewActiveStep = stepIndex;
    syncPreviewToStep(stepIndex);
  }, { root: null, rootMargin: "-16% 0px -62% 0px", threshold: [0.2, 0.5, 0.8] });
  stepEditor.querySelectorAll(".step-editor-card").forEach((step) => stepObserver.observe(step));
}

function renderEditorPreview() {
  if (!editor.schema) return;
  const previousScrollTop = previewHost.scrollTop;
  previewHost.innerHTML = `<form class="preview-form" data-preview-form novalidate>
    <div class="preview-form-heading"><h4>${escapeHtml(editor.schema.title || "Untitled form")}</h4><p>${escapeHtml(editor.schema.description || "")}</p></div>
    ${editor.schema.steps.map((step, index) => `<section class="preview-step" data-preview-step="${index}"><div><span title="${escapeHtml(stepIconLabels[step.icon] || "Section icon")}">${stepIconSvg(step.icon)}</span><strong>${escapeHtml(step.title)}</strong></div>${step.fields.map(previewFieldMarkup).join("") || "<p class='preview-empty'>Review step</p>"}</section>`).join("")}
    <div class="preview-submit-row"><button class="preview-submit" type="button">${escapeHtml(editor.schema.submitLabel || "Send request")}</button><small>Preview only — nothing is sent.</small></div>
  </form>`;
  previewHost.scrollTop = previousScrollTop;
  updatePreviewConditions();
  setSyncActiveStep(previewActiveStep);
  refreshScrollSync();
}

previewHost.addEventListener("input", updatePreviewConditions);
previewHost.addEventListener("change", updatePreviewConditions);
previewHost.addEventListener("submit", (event) => event.preventDefault());
previewHost.addEventListener("scroll", () => {
  if (previewSyncing) return;
  window.cancelAnimationFrame(previewScrollFrame);
  previewScrollFrame = window.requestAnimationFrame(() => {
    const steps = [...previewHost.querySelectorAll("[data-preview-step]")];
    const top = previewHost.getBoundingClientRect().top + 18;
    const nearest = steps.sort((a, b) => Math.abs(a.getBoundingClientRect().top - top) - Math.abs(b.getBoundingClientRect().top - top))[0];
    if (!nearest) return;
    const stepIndex = Number(nearest.dataset.previewStep);
    if (stepIndex === previewActiveStep) return;
    previewActiveStep = stepIndex;
    syncEditorToStep(stepIndex);
  });
});

function renderEditor() {
  const selectedForm = editor.forms.find((form) => form.id === editor.selectedId);
  editorShell.hidden = false;
  editorLoading.hidden = true;
  document.querySelector("[data-editor-form-name]").textContent = editor.schema.title;
  document.querySelector("[data-editor-version]").textContent = selectedForm?.publishedVersion ? `Published version ${selectedForm.publishedVersion}` : "Not published yet";
  document.querySelector("[data-public-form-link]").href = publicFormPath(editor.schema);
  document.querySelector("[data-public-form-link]").hidden = !selectedForm?.publishedVersion;
  document.querySelectorAll("[data-form-setting]").forEach((input) => { input.value = editor.schema[input.dataset.formSetting] || ""; });
  const slugInput = document.querySelector("[data-form-setting='slug']");
  const slugPrefix = slugInput.closest(".slug-field").querySelector("span");
  slugInput.hidden = Boolean(selectedForm?.isBuiltInDefault);
  slugInput.disabled = Boolean(selectedForm?.isBuiltInDefault);
  slugPrefix.textContent = selectedForm?.isBuiltInDefault ? publicFormPath(editor.schema) : "/request/";
  renderStepEditor();
  renderEditorPreview();
  renderFormList();
}

async function loadVersions() {
  const host = document.querySelector("[data-version-history]");
  if (isLocalFixture) { host.innerHTML = "<p>Version history becomes available after deployment.</p>"; return; }
  try {
    const response = await fetch(`/api/admin/forms/${encodeURIComponent(editor.selectedId)}/versions`);
    const body = await response.json();
    if (!response.ok) throw new Error();
    host.innerHTML = body.versions.length ? body.versions.map((version) => `<div class="version-row"><span><strong>Version ${version.versionNumber}</strong><small>${escapeHtml(formatDate(version.publishedAt))} · ${escapeHtml(version.publishedBy)}</small></span><button type="button" data-restore-version="${escapeHtml(version.id)}">Restore to draft</button></div>`).join("") : "<p>Publish the form to create its first saved version.</p>";
  } catch { host.innerHTML = "<p>Version history could not be loaded.</p>"; }
}

async function selectEditorForm(id) {
  if (editor.dirty && !confirm("Discard your unsaved draft changes?")) return;
  editor.selectedId = id;
  try {
    let form;
    if (isLocalFixture) {
      const schema = defaultFormSchemas.find((item) => item.id === id) || defaultFormSchemas[0];
      form = { id: schema.id, draft: clone(schema), isBuiltInDefault: true, publishedVersion: 1 };
    }
    else {
      const response = await fetch(`/api/admin/forms/${encodeURIComponent(id)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "The form could not be loaded.");
      form = body.form;
    }
    editor.schema = clone(form.draft);
    editor.dirty = false;
    editorStatus.textContent = "";
    renderEditor();
    loadVersions();
  } catch (error) { editorLoading.textContent = error.message || "The form builder could not load."; }
}

async function loadEditorForms() {
  try {
    if (isLocalFixture) editor.forms = defaultFormSchemas.map((schema) => ({ id: schema.id, slug: schema.slug, title: schema.title, draft: schema, publishedVersion: 1, isBuiltInDefault: true }));
    else {
      const response = await fetch("/api/admin/forms");
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "The form builder could not load.");
      editor.forms = body.forms;
    }
    await selectEditorForm(editor.forms[0].id);
  } catch (error) { editorLoading.textContent = error.message || "The form builder could not load."; }
}

function updateFieldFromControl(control, field) {
  const setting = control.dataset.fieldSetting;
  if (setting === "required") field.required = control.checked;
  else if (setting === "options") field.options = control.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  else field[setting] = control.value;
}

stepEditor.addEventListener("input", (event) => {
  const stepCard = event.target.closest("[data-step-index]");
  const stepIndex = Number(stepCard?.dataset.stepIndex);
  const fieldCardElement = event.target.closest("[data-field-index]");
  if (event.target.matches("[data-step-title]") && !fieldCardElement) editor.schema.steps[stepIndex].title = event.target.value;
  if (fieldCardElement && event.target.matches("[data-field-setting]")) updateFieldFromControl(event.target, editor.schema.steps[stepIndex].fields[Number(fieldCardElement.dataset.fieldIndex)]);
  if (fieldCardElement && event.target.matches("[data-condition-setting]")) {
    const field = editor.schema.steps[stepIndex].fields[Number(fieldCardElement.dataset.fieldIndex)];
    field.condition ||= { fieldId: "", operator: "equals", value: "" };
    field.condition[event.target.dataset.conditionSetting] = event.target.value;
    if (event.target.dataset.conditionSetting === "fieldId" && field.condition.fieldId) {
      const source = fieldsBefore(stepIndex, Number(fieldCardElement.dataset.fieldIndex)).find((candidate) => candidate.id === field.condition.fieldId);
      field.condition.operator = source?.type === "checkboxes" ? "includes" : "equals";
      field.condition.value = "";
    }
    if (!field.condition.fieldId) delete field.condition;
  }
  markEditorDirty();
});
stepEditor.addEventListener("change", (event) => {
  if (event.target.matches("[data-field-setting='type']")) renderStepEditor();
  if (event.target.matches("[data-condition-setting='fieldId']")) renderStepEditor();
});
stepEditor.addEventListener("click", (event) => {
  const stepCard = event.target.closest("[data-step-index]");
  if (!stepCard) return;
  const stepIndex = Number(stepCard.dataset.stepIndex);
  const iconOption = event.target.closest("[data-step-icon-option]");
  if (iconOption) {
    editor.schema.steps[stepIndex].icon = iconOption.dataset.stepIconOption;
    markEditorDirty();
    renderStepEditor();
    return;
  }
  const fieldCardElement = event.target.closest("[data-field-index]");
  if (event.target.closest("[data-add-field]")) {
    editor.schema.steps[stepIndex].fields.push({ id: makeId("question"), type: "text", label: "New question", required: false });
  } else if (fieldCardElement && event.target.closest("[data-field-action]")) {
    const fields = editor.schema.steps[stepIndex].fields;
    const fieldIndex = Number(fieldCardElement.dataset.fieldIndex);
    const action = event.target.closest("[data-field-action]").dataset.fieldAction;
    if (action === "delete" && confirm("Remove this question from the draft?")) fields.splice(fieldIndex, 1);
    if (action === "duplicate") fields.splice(fieldIndex + 1, 0, { ...clone(fields[fieldIndex]), id: makeId(fields[fieldIndex].id) });
    if (action === "up" && fieldIndex > 0) [fields[fieldIndex - 1], fields[fieldIndex]] = [fields[fieldIndex], fields[fieldIndex - 1]];
    if (action === "down" && fieldIndex < fields.length - 1) [fields[fieldIndex + 1], fields[fieldIndex]] = [fields[fieldIndex], fields[fieldIndex + 1]];
  } else if (!fieldCardElement && event.target.closest("[data-step-action]")) {
    const action = event.target.closest("[data-step-action]").dataset.stepAction;
    const steps = editor.schema.steps;
    if (action === "delete" && steps.length > 1 && confirm("Remove this step and all of its questions from the draft?")) steps.splice(stepIndex, 1);
    if (action === "up" && stepIndex > 0) [steps[stepIndex - 1], steps[stepIndex]] = [steps[stepIndex], steps[stepIndex - 1]];
    if (action === "down" && stepIndex < steps.length - 1) [steps[stepIndex + 1], steps[stepIndex]] = [steps[stepIndex], steps[stepIndex + 1]];
  } else return;
  markEditorDirty(); renderStepEditor();
});

document.querySelectorAll("[data-form-setting]").forEach((input) => input.addEventListener("input", () => {
  editor.schema[input.dataset.formSetting] = input.dataset.formSetting === "slug" ? slugify(input.value) : input.value;
  if (input.dataset.formSetting === "slug") input.value = editor.schema.slug;
  document.querySelector("[data-editor-form-name]").textContent = editor.schema.title || "Untitled form";
  document.querySelector("[data-public-form-link]").href = publicFormPath(editor.schema);
  markEditorDirty();
}));
document.querySelector("[data-add-step]").addEventListener("click", () => {
  editor.schema.steps.push({ id: makeId("step"), title: "New step", icon: "site", fields: [] });
  markEditorDirty(); renderStepEditor();
});
formList.addEventListener("click", (event) => { const button = event.target.closest("[data-select-form]"); if (button) selectEditorForm(button.dataset.selectForm); });

async function saveDraft() {
  editorStatus.textContent = "Saving draft…";
  if (isLocalFixture) { editor.dirty = false; editorStatus.textContent = "Draft preview saved locally for this page."; return true; }
  const response = await fetch(`/api/admin/forms/${encodeURIComponent(editor.selectedId)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schema: editor.schema }) });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) { editorStatus.dataset.state = "error"; editorStatus.textContent = body?.message || "The draft could not be saved."; return false; }
  editor.dirty = false; editorStatus.dataset.state = "success"; editorStatus.textContent = "Draft saved. The public form has not changed.";
  const listForm = editor.forms.find((form) => form.id === editor.selectedId); Object.assign(listForm, body.form); renderFormList();
  return true;
}
document.querySelector("[data-save-draft]").addEventListener("click", saveDraft);
document.querySelector("[data-publish-form]").addEventListener("click", async () => {
  if (!(await saveDraft())) return;
  if (isLocalFixture) { editorStatus.textContent = "Publishing is available on the protected live dashboard."; return; }
  editorStatus.textContent = "Publishing form…";
  const response = await fetch(`/api/admin/forms/${encodeURIComponent(editor.selectedId)}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) { editorStatus.dataset.state = "error"; editorStatus.textContent = body?.message || "The form could not be published."; return; }
  const listForm = editor.forms.find((form) => form.id === editor.selectedId); Object.assign(listForm, body.form);
  editorStatus.dataset.state = "success"; editorStatus.textContent = `Published version ${body.versionNumber}. Customers now see these changes.`; renderEditor(); loadVersions();
});

document.querySelector("[data-new-form]").addEventListener("click", () => { newFormDialog.querySelector("form").reset(); newFormDialog.showModal(); });
newFormDialog.querySelector(".dialog-close").addEventListener("click", () => newFormDialog.close());
newFormDialog.querySelector("[data-cancel-new-form]").addEventListener("click", () => newFormDialog.close());
newFormDialog.querySelector("input[name='title']").addEventListener("input", (event) => { const slugInput = newFormDialog.querySelector("input[name='slug']"); if (!slugInput.dataset.edited) slugInput.value = slugify(event.target.value); });
newFormDialog.querySelector("input[name='slug']").addEventListener("input", (event) => { event.target.dataset.edited = "true"; event.target.value = slugify(event.target.value); });
newFormDialog.querySelector("form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const title = String(values.get("title") || "").trim();
  const newSlug = slugify(values.get("slug"));
  const newSchema = { id: makeId("form"), slug: newSlug, title, description: "Tell us a little about what you need.", submitLabel: "Send request", successTitle: "Your request was sent.", successMessage: "We will review the details and follow up with you.", steps: [
    { id: "contact", title: "Contact", icon: "contact", fields: [
      { id: "name", type: "text", label: "Name", required: true, autocomplete: "name" },
      { id: "phone", type: "phone", label: "Phone number", required: true, autocomplete: "tel" },
      { id: "email", type: "email", label: "Email address", required: false, autocomplete: "email" },
    ] },
    { id: "review", title: "Review and send", icon: "final", fields: [] },
  ] };
  const status = newFormDialog.querySelector("[data-new-form-status]"); status.textContent = "Creating draft…";
  if (isLocalFixture) { status.textContent = "Creating forms is available on the protected live dashboard."; return; }
  const response = await fetch("/api/admin/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schema: newSchema }) });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) { status.textContent = body?.message || "The form could not be created."; return; }
  editor.forms.push(body.form); newFormDialog.close(); await selectEditorForm(body.form.id);
});
document.querySelector("[data-version-history]").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-restore-version]");
  if (!button || !confirm("Restore this version into the draft editor? The public form will not change until you publish.")) return;
  const response = await fetch(`/api/admin/forms/${encodeURIComponent(editor.selectedId)}/restore`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionId: button.dataset.restoreVersion }) });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) { editorStatus.textContent = body?.message || "The version could not be restored."; return; }
  editor.schema = clone(body.form.draft); editor.dirty = false; editorStatus.textContent = "That version was restored to the draft. Review it, then publish when ready."; renderEditor();
});
window.addEventListener("beforeunload", (event) => { if (editor.dirty) { event.preventDefault(); event.returnValue = ""; } });
loadEditorForms();
