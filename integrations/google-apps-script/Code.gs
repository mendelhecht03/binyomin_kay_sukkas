const SPREADSHEET_ID = "12ptjlhjooYzWt8dZjKsd-qOET-dnktn7qbDgr5SCRTg";
const SHEET_NAME = "Submissions";
const TESTIMONIAL_SHEET_NAME = "Testimonials";
const TESTIMONIAL_NOTIFICATION_EMAIL_PROPERTY = "TESTIMONIAL_NOTIFICATION_EMAIL";
const DEFAULT_TESTIMONIAL_NOTIFICATION_EMAIL = "bkaysukkahbuilders@gmail.com";
const DASHBOARD_ACCESS_KEY_PROPERTY = "DASHBOARD_ACCESS_KEY";
const BUILDS_FORM_ID = "1FAIpQLSeG57s-Ttt59d4H6vpRagSjMZvzkqR3OVTm-pnJJNIgjruBGA";
const RENTALS_FORM_ID = "1FAIpQLSdvF8UbJgSVrSy6ebK6j93vSfEVlkCXshEIHGj1HxFp1bRGBg";

/**
 * Serves the private owner dashboard. The existing public deployment also
 * hosts the webhook, so the dashboard requires a separate random URL key.
 * The key is checked again by getDashboardData so it is not enough to load
 * the page without permission.
 */
function doGet(event) {
  const key = String(event && event.parameter && event.parameter.key || "");
  const expectedKey = PropertiesService.getScriptProperties()
    .getProperty(DASHBOARD_ACCESS_KEY_PROPERTY);

  if (!expectedKey || key !== expectedKey) {
    return HtmlService.createHtmlOutput(
      '<main style="font:16px system-ui;padding:40px;max-width:560px;margin:auto">' +
      '<h1>Private dashboard</h1>' +
      '<p>This owner view needs its private access link.</p>' +
      '</main>',
    ).setTitle("Private dashboard");
  }

  const template = HtmlService.createTemplateFromFile("Dashboard");
  template.dashboardKey = key;
  return template.evaluate()
    .setTitle("BKAY Owner Dashboard")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Called by Dashboard.html through google.script.run. Keeping this function
 * server-side means Forms and Sheet permissions never reach the browser.
 */
function getDashboardData(key) {
  assertDashboardKey_(key);

  const builds = readFormEntries_(BUILDS_FORM_ID, "Builds");
  const rentals = readFormEntries_(RENTALS_FORM_ID, "Rentals");
  const testimonials = readTestimonialEntries_();

  return {
    generatedAt: new Date().toISOString(),
    sources: {
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
      buildsFormUrl: `https://docs.google.com/forms/d/e/${BUILDS_FORM_ID}/viewform`,
      rentalsFormUrl: `https://docs.google.com/forms/d/e/${RENTALS_FORM_ID}/viewform`,
    },
    builds: builds.entries,
    rentals: rentals.entries,
    testimonials: testimonials.entries,
    errors: [builds.error, rentals.error, testimonials.error].filter(Boolean),
  };
}

/**
 * Run this once in Apps Script to request the Forms and Sheet read scopes.
 * It does not send mail or change any submissions.
 */
function authorizeDashboardAccess() {
  FormApp.openById(BUILDS_FORM_ID).getTitle();
  FormApp.openById(RENTALS_FORM_ID).getTitle();
  SpreadsheetApp.openById(SPREADSHEET_ID).getName();
  return "Dashboard read access is authorized.";
}

/**
 * Run this once to create a strong private URL key. Copy the returned value
 * from the execution result and append it to the deployed /exec URL as
 * ?key=VALUE. Running it again revokes the previous dashboard link.
 */
function createDashboardAccessKey() {
  const key = `${Utilities.getUuid().replace(/-/g, "")}${Utilities.getUuid()
    .replace(/-/g, "")}`;
  PropertiesService.getScriptProperties()
    .setProperty(DASHBOARD_ACCESS_KEY_PROPERTY, key);
  return key;
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(10000)) {
      return jsonResponse_({ ok: false, message: "The spreadsheet is busy. Please retry." });
    }

    const request = JSON.parse(event.postData.contents);
    const expectedSecret =
      PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");

    if (!expectedSecret || request.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, message: "Unauthorized." });
    }

    if (request.type === "testimonialSubmission") {
      return appendTestimonial_(request.testimonialSubmission || {});
    }

    const submission = request.submission || {};
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`Sheet tab "${SHEET_NAME}" was not found.`);
    }

    if (!sheet.getRange(1, 39).getValue()) {
      sheet.getRange(1, 39).setValue("Extra service required");
    }
    if (!sheet.getRange(1, 40).getValue()) {
      sheet.getRange(1, 40).setValue("Extra service details");
    }

    sheet.appendRow([
      asSheetText_(submission.submittedAt),
      asSheetText_(submission.submissionId),
      asSheetText_(submission.status),
      asSheetText_(submission.sukkahPlan),
      asSheetText_(submission.fulfillmentMethod),
      asSheetText_(submission.firstName),
      asSheetText_(submission.lastName),
      asSheetText_(submission.phone),
      asSheetText_(submission.email),
      asSheetText_(submission.addressLine1),
      asSheetText_(submission.city),
      asSheetText_(submission.state),
      asSheetText_(submission.postalCode),
      asSheetText_(submission.neighborhood),
      asSheetText_(submission.neighborhoodOther),
      asSheetText_((submission.service || []).join(", ")),
      asSheetText_(submission.serviceOther),
      asSheetText_(submission.estimatedWidth),
      asSheetText_(submission.estimatedLength),
      asSheetText_(submission.sukkahType),
      asSheetText_(submission.sukkahTypeOther),
      asSheetText_(submission.schach),
      asSheetText_(submission.schachOther),
      asSheetText_((submission.addOns || []).join(", ")),
      asSheetText_(submission.addOnsOther),
      asSheetText_(submission.siteDescription),
      asSheetText_((submission.photoLinks || []).join("\n")),
      asSheetText_(submission.buildDate),
      asSheetText_(submission.preSukkosDate),
      asSheetText_(submission.customServiceDate),
      asSheetText_(submission.takeDownDate),
      asSheetText_(submission.customTakeDownDate),
      asSheetText_(submission.bringToStorageDate),
      asSheetText_(submission.customStorageDate),
      asSheetText_(submission.timingNotes),
      asSheetText_(submission.referral),
      asSheetText_(submission.comments),
      asSheetText_(submission.sourcePage),
      asSheetText_(submission.extraServiceRequired),
      asSheetText_(submission.extraServiceDetails),
    ]);

    return jsonResponse_({
      ok: true,
      submissionId: submission.submissionId,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, message: String(error.message || error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function appendTestimonial_(submission) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(TESTIMONIAL_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(TESTIMONIAL_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Submitted at",
      "Submission ID",
      "Status",
      "Name",
      "Organization",
      "Verification contact",
      "Testimonial",
      "Publication consent",
      "Source page",
    ]);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    asSheetText_(submission.submittedAt),
    asSheetText_(submission.submissionId),
    asSheetText_(submission.status),
    asSheetText_(submission.reviewerName),
    asSheetText_(submission.reviewerOrganization),
    asSheetText_(submission.reviewerContact),
    asSheetText_(submission.testimonial),
    asSheetText_(submission.publicationConsent),
    asSheetText_(submission.sourcePage),
  ]);

  try {
    sendTestimonialNotification_(submission);
  } catch (error) {
    // The review is already safely stored in the Sheet. Keep the website
    // response successful so a mail problem does not create duplicate rows.
    console.error(`Testimonial email notification failed: ${error}`);
  }

  return jsonResponse_({
    ok: true,
    submissionId: submission.submissionId,
  });
}

function sendTestimonialNotification_(submission) {
  const properties = PropertiesService.getScriptProperties();
  const recipient =
    properties.getProperty(TESTIMONIAL_NOTIFICATION_EMAIL_PROPERTY) ||
    DEFAULT_TESTIMONIAL_NOTIFICATION_EMAIL;
  const reviewerName = singleLine_(submission.reviewerName) || "Website visitor";
  const subject = `[BKAY website] New testimonial from ${reviewerName}`;
  const body = [
    "A new testimonial was submitted through the BKAY website.",
    "",
    "It is private and pending review. It has not been published automatically.",
    "",
    `Submitted: ${submission.submittedAt || ""}`,
    `Submission ID: ${submission.submissionId || ""}`,
    `Name: ${submission.reviewerName || ""}`,
    `Organization: ${submission.reviewerOrganization || ""}`,
    `Verification contact: ${submission.reviewerContact || ""}`,
    `Publication consent: ${submission.publicationConsent || ""}`,
    `Source page: ${submission.sourcePage || ""}`,
    "",
    "Testimonial:",
    submission.testimonial || "",
    "",
    `Review it in the ${TESTIMONIAL_SHEET_NAME} tab of the website submissions Sheet.`,
  ].join("\n");

  MailApp.sendEmail({
    to: recipient,
    subject,
    body,
    name: "BKAY website",
  });
}

function setWebhookSecret() {
  const secret = Browser.inputBox(
    "Webhook secret",
    "Paste the secret supplied for the website integration.",
    Browser.Buttons.OK_CANCEL,
  );

  if (secret && secret !== "cancel") {
    PropertiesService.getScriptProperties().setProperty("WEBHOOK_SECRET", secret);
  }
}

function authorizeTestimonialEmail() {
  // Run once in Apps Script after adding email notifications. It requests the
  // mail permission without sending a message.
  return MailApp.getRemainingDailyQuota();
}

function assertDashboardKey_(key) {
  const expectedKey = PropertiesService.getScriptProperties()
    .getProperty(DASHBOARD_ACCESS_KEY_PROPERTY);
  if (!expectedKey || String(key || "") !== expectedKey) {
    throw new Error("Unauthorized dashboard request.");
  }
}

function readFormEntries_(formId, label) {
  try {
    const responses = FormApp.openById(formId).getResponses()
      .sort((left, right) => right.getTimestamp().getTime() - left.getTimestamp().getTime())
      .slice(0, 250);

    return {
      entries: responses.map((response) => ({
        id: String(response.getId()),
        submittedAt: formatDashboardValue_(response.getTimestamp()),
        status: "New",
        fields: response.getItemResponses().map((itemResponse) => ({
          label: itemResponse.getItem().getTitle(),
          value: formatDashboardValue_(itemResponse.getResponse()),
        })).filter((field) => field.value),
      })),
    };
  } catch (error) {
    return {
      entries: [],
      error: `${label}: ${String(error.message || error)}`,
    };
  }
}

function readTestimonialEntries_() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
      .getSheetByName(TESTIMONIAL_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return { entries: [] };
    }

    const rows = sheet.getDataRange().getValues();
    const headers = rows.shift().map((header) => String(header || ""));
    const entries = rows.reverse().slice(0, 250).map((row, index) => {
      const record = {};
      headers.forEach((header, column) => {
        if (header) record[header] = formatDashboardValue_(row[column]);
      });

      const fields = headers.map((header, column) => ({
        label: header,
        value: formatDashboardValue_(row[column]),
      })).filter((field) => field.value);

      return {
        id: String(record["Submission ID"] || `testimonial-${index}`),
        submittedAt: String(record["Submitted at"] || ""),
        status: String(record.Status || "Pending review"),
        fields,
      };
    });

    return { entries };
  } catch (error) {
    return {
      entries: [],
      error: `Testimonials: ${String(error.message || error)}`,
    };
  }
}

function formatDashboardValue_(value) {
  if (value == null || value === "") return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "MMM d, yyyy h:mm a");
  }
  if (Array.isArray(value)) return value.map(formatDashboardValue_).filter(Boolean).join(", ");
  return String(value);
}

function asSheetText_(value) {
  const text = String(value == null ? "" : value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function singleLine_(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
