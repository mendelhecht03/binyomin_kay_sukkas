import {
  deleteUploadedPhotos,
  readAndValidatePhotos,
  uploadSubmissionPhotos,
} from "../adapters/photo-storage.js";
import { cleanText, jsonResponse, readFormData } from "../common/http.js";
import { createSubmission } from "../storage/submission-repository.js";

const TEXT_FIELDS = [
  "sukkahPlan", "fulfillmentMethod", "name", "firstName", "lastName", "phone", "email",
  "addressLine1", "city", "state", "postalCode", "neighborhood", "neighborhoodOther",
  "serviceOther", "estimatedSize", "estimatedWidth", "estimatedLength", "sukkahType",
  "sukkahTypeOther", "schach", "schachOther", "addOnsOther", "extraServiceRequired",
  "extraServiceDetails", "siteDescription", "buildDate", "preSukkosDate", "customServiceDate",
  "takeDownDate", "customTakeDownDate", "bringToStorageDate", "customStorageDate", "timingNotes",
  "referral", "comments",
];

function readSubmission(formData) {
  const submission = Object.fromEntries(TEXT_FIELDS.map((field) => [field, cleanText(formData.get(field))]));
  if (submission.name) {
    const parts = submission.name.split(/\s+/);
    submission.firstName = parts.shift() || "";
    submission.lastName = parts.join(" ");
  }
  submission.service = formData.getAll("service").map((value) => cleanText(value, 120));
  submission.addOns = formData.getAll("addOns").map((value) => cleanText(value, 120));
  const schachChoices = formData.getAll("schach").map((value) => cleanText(value, 120));
  submission.schach = schachChoices
    .filter((value) => value !== "Other")
    .concat(submission.schachOther ? [submission.schachOther] : [])
    .join(", ");
  const sizeMatch = submission.estimatedSize.match(/^\s*(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)(?:\s*ft)?\s*$/i);
  submission.estimatedWidth = sizeMatch ? sizeMatch[1] : submission.estimatedSize;
  submission.estimatedLength = sizeMatch ? sizeMatch[2] : "";
  return { submission, schachChoices };
}

function missingSubmissionFields(submission, schachChoices) {
  const required = [
    "sukkahPlan", "name", "phone", "addressLine1", "city", "state", "postalCode", "neighborhood",
    "estimatedSize", "sukkahType", "schach", "buildDate", "takeDownDate", "extraServiceRequired", "referral",
  ];
  if (submission.sukkahPlan === "I would like to buy") required.push("fulfillmentMethod");
  if (submission.extraServiceRequired === "Yes") required.push("extraServiceDetails");
  const missing = required.filter((field) => !submission[field]);
  if (submission.sukkahPlan === "I already have a sukkah" && !submission.service.length) missing.push("service");
  if (submission.neighborhood === "Other" && !submission.neighborhoodOther) missing.push("neighborhoodOther");
  if (submission.service.includes("Other") && !submission.serviceOther) missing.push("serviceOther");
  if (submission.sukkahType === "Other" && !submission.sukkahTypeOther) missing.push("sukkahTypeOther");
  if (schachChoices.includes("Other") && !submission.schachOther) missing.push("schachOther");
  if (submission.addOns.includes("Other") && !submission.addOnsOther) missing.push("addOnsOther");
  if (submission.service.includes("Take down") && !submission.takeDownDate) missing.push("takeDownDate");
  if (submission.service.includes("Bring to storage") && !submission.bringToStorageDate) missing.push("bringToStorageDate");
  return missing;
}

export async function handleBuildSubmission(request, env, url) {
  const parsed = await readFormData(request);
  if (!parsed.ok) return parsed.response;
  if (cleanText(parsed.formData.get("website"), 200)) return jsonResponse({ ok: true, message: "Thank you. Your request was received." });
  const { submission, schachChoices } = readSubmission(parsed.formData);
  const missingFields = missingSubmissionFields(submission, schachChoices);
  if (missingFields.length) return jsonResponse({ ok: false, message: "Please complete all required fields before submitting.", missingFields }, 400);
  const checkedPhotos = readAndValidatePhotos(parsed.formData);
  if (!checkedPhotos.ok) return checkedPhotos.response;
  if (checkedPhotos.photos.length && !env?.SUBMISSION_PHOTOS) {
    return jsonResponse({ ok: false, message: "Photo storage is temporarily unavailable. Please call (347) 454-2282." }, 503);
  }

  const submissionId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const uploadedKeys = [];
  try {
    const uploaded = checkedPhotos.photos.length
      ? await uploadSubmissionPhotos({
          bucket: env.SUBMISSION_PHOTOS,
          photos: checkedPhotos.photos,
          origin: url.origin,
          submissionId,
          source: "build",
        })
      : { keys: [], files: [] };
    uploadedKeys.push(...uploaded.keys);
    Object.assign(submission, { submissionId, submittedAt, status: "New", sourcePage: `${url.origin}/sukka-builder/` });
    await createSubmission(env, {
      id: submissionId,
      type: "build",
      status: "New",
      submittedAt,
      customer: { name: submission.name, phone: submission.phone, email: submission.email },
      location: { neighborhood: submission.neighborhoodOther || submission.neighborhood },
      summary: [submission.service.join(", ") || "Build request", submission.estimatedSize].filter(Boolean).join(" · "),
      data: submission,
      files: uploaded.files,
      sourcePage: submission.sourcePage,
    });
    return jsonResponse({ ok: true, submissionId, message: "Thank you. Your request was sent to BK Sukkah." });
  } catch (error) {
    await deleteUploadedPhotos(env?.SUBMISSION_PHOTOS, uploadedKeys);
    console.error("Sukkah submission failed", error);
    const status = error?.code === "DATABASE_NOT_CONFIGURED" ? 503 : 502;
    return jsonResponse({ ok: false, message: "We could not save your request. Please try again or call (347) 454-2282." }, status);
  }
}
