import {
  deleteUploadedPhotos,
  readAndValidatePhotos,
  uploadSubmissionPhotos,
} from "../adapters/photo-storage.js";
import { cleanText, jsonResponse, readFormData } from "../common/http.js";
import { isIsoDate } from "../common/validation.js";
import { createSubmission } from "../storage/submission-repository.js";

function readRental(formData) {
  const rental = {
    name: cleanText(formData.get("name"), 200), phone: cleanText(formData.get("phone"), 100),
    email: cleanText(formData.get("email"), 320), addressLine1: cleanText(formData.get("addressLine1") || formData.get("address"), 1000),
    city: cleanText(formData.get("city"), 200), state: cleanText(formData.get("state"), 120),
    postalCode: cleanText(formData.get("postalCode"), 20), neighborhood: cleanText(formData.get("neighborhood"), 120),
    neighborhoodOther: cleanText(formData.get("neighborhoodOther"), 200), estimatedSize: cleanText(formData.get("estimatedSize"), 200),
    siteDescription: cleanText(formData.get("siteDescription"), 4000), buildDay: cleanText(formData.get("buildDay"), 100),
    takeDownDay: cleanText(formData.get("takeDownDay"), 100), addOns: formData.getAll("addOns").map((value) => cleanText(value, 120)),
    furnitureDetails: cleanText(formData.get("furnitureDetails"), 1000), addOnsOther: cleanText(formData.get("addOnsOther"), 500),
    extraServiceRequired: cleanText(formData.get("extraServiceRequired"), 20), extraServiceDetails: cleanText(formData.get("extraServiceDetails"), 2000),
    timingNotes: cleanText(formData.get("timingNotes"), 1000), comments: cleanText(formData.get("comments"), 1000),
    questions: cleanText(formData.get("questions"), 1000),
  };
  return rental;
}

function missingRentalFields(rental) {
  const required = ["name", "phone", "addressLine1", "city", "state", "postalCode", "neighborhood", "estimatedSize", "buildDay", "takeDownDay", "extraServiceRequired", "comments"];
  const missing = required.filter((fieldName) => !rental[fieldName]);
  if (rental.neighborhood === "Other" && !rental.neighborhoodOther) missing.push("neighborhoodOther");
  if (rental.buildDay && !isIsoDate(rental.buildDay)) missing.push("buildDay");
  if (rental.takeDownDay && !isIsoDate(rental.takeDownDay)) missing.push("takeDownDay");
  if (rental.addOns.includes("Other") && !rental.addOnsOther) missing.push("addOnsOther");
  if (rental.addOns.includes("Furniture") && !rental.furnitureDetails) missing.push("furnitureDetails");
  if (rental.extraServiceRequired === "Yes" && !rental.extraServiceDetails) missing.push("extraServiceDetails");
  return missing;
}

export async function handleRentalSubmission(request, env, url) {
  const parsed = await readFormData(request);
  if (!parsed.ok) return parsed.response;
  if (cleanText(parsed.formData.get("website"), 200)) return jsonResponse({ ok: true, message: "Thank you. Your request was received." });
  const rental = readRental(parsed.formData);
  const missingFields = missingRentalFields(rental);
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
          prefix: "rental-submissions",
          source: "rental",
        })
      : { keys: [], files: [] };
    uploadedKeys.push(...uploaded.keys);
    Object.assign(rental, { submissionId, submittedAt, status: "New", sourcePage: `${url.origin}/sukkah-rentals/` });
    await createSubmission(env, {
      id: submissionId,
      type: "rental",
      status: "New",
      submittedAt,
      customer: { name: rental.name, phone: rental.phone, email: rental.email },
      location: { neighborhood: rental.neighborhoodOther || rental.neighborhood },
      summary: [rental.estimatedSize || "Rental request", rental.buildDay].filter(Boolean).join(" · "),
      data: rental,
      files: uploaded.files,
      sourcePage: rental.sourcePage,
    });
    return jsonResponse({ ok: true, submissionId, message: "Thank you. Your rental request was sent to Benyamin." });
  } catch (error) {
    await deleteUploadedPhotos(env?.SUBMISSION_PHOTOS, uploadedKeys);
    console.error("Rental submission failed", error);
    const status = error?.code === "DATABASE_NOT_CONFIGURED" ? 503 : 502;
    return jsonResponse({ ok: false, message: "We could not save your request. Please try again or call (347) 454-2282." }, status);
  }
}
