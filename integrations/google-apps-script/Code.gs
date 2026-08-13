const SPREADSHEET_ID = "12ptjlhjooYzWt8dZjKsd-qOET-dnktn7qbDgr5SCRTg";
const SHEET_NAME = "Submissions";
const TESTIMONIAL_SHEET_NAME = "Testimonials";

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

  return jsonResponse_({
    ok: true,
    submissionId: submission.submissionId,
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

function asSheetText_(value) {
  const text = String(value == null ? "" : value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
