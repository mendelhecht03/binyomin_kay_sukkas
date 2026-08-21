import { deleteUploadedPhotos, readAndValidatePhotos, uploadSubmissionPhotos } from "../adapters/photo-storage.js";
import { cleanText, jsonResponse, readFormData } from "../common/http.js";
import { fieldIsVisible } from "../forms/form-schema.js";
import { getPublishedFormBySlug } from "../storage/form-repository.js";
import { createSubmission } from "../storage/submission-repository.js";

function valueForField(formData, field) {
  if (field.type === "checkboxes") return formData.getAll(field.id).map((value) => cleanText(value, 500)).filter(Boolean);
  if (field.type === "photos") return [];
  return cleanText(formData.get(field.id), field.type === "textarea" ? 4000 : 1000);
}

function hasValue(value) { return Array.isArray(value) ? value.length > 0 : Boolean(cleanText(value)); }

function firstAnswer(fields, answers, matcher) {
  const field = fields.find((candidate) => matcher(candidate));
  const value = field ? answers[field.id] : "";
  return Array.isArray(value) ? value.join(", ") : value;
}

function contactAnswers(fields, answers) {
  return {
    name: answers.name || firstAnswer(fields, answers, (field) => /\b(name|contact)\b/i.test(field.label || "")),
    phone: answers.phone || firstAnswer(fields, answers, (field) => field.type === "phone" || /phone|mobile|tel/i.test(field.label || "")),
    email: answers.email || firstAnswer(fields, answers, (field) => field.type === "email" || /e-?mail/i.test(field.label || "")),
  };
}

function neighborhoodAnswer(fields, answers) {
  return answers.neighborhoodOther || answers.settingOther || answers.setting || answers.neighborhood
    || firstAnswer(fields, answers, (field) => /neighborhood|location|where will/i.test(field.label || ""));
}

function submissionIdentity(slug, origin) {
  if (slug === "builds") return { type: "build", sourcePage: `${origin}/sukka-builder/` };
  if (slug === "rentals") return { type: "rental", sourcePage: `${origin}/sukkah-rentals/` };
  if (slug === "pergolas") return { type: "pergola", sourcePage: `${origin}/pergolas/` };
  if (slug === "purchases") return { type: "purchase", sourcePage: `${origin}/purchases/` };
  return { type: "custom", sourcePage: `${origin}/request/${slug}/` };
}

export async function handleDynamicFormSubmission(request, env, url, slug) {
  const parsed = await readFormData(request);
  if (!parsed.ok) return parsed.response;
  if (cleanText(parsed.formData.get("website"), 200)) return jsonResponse({ ok: true, message: "Thank you. Your request was received." });
  let published;
  try { published = await getPublishedFormBySlug({ env, slug }); } catch (error) {
    console.error("Dynamic form loading failed", error);
    return jsonResponse({ ok: false, message: "This form is temporarily unavailable." }, 503);
  }
  if (!published) return jsonResponse({ ok: false, message: "This form is not available." }, 404);

  const fields = published.schema.steps.flatMap((step) => step.fields || []);
  const answers = Object.fromEntries(fields.map((field) => [field.id, valueForField(parsed.formData, field)]));
  const visibleFields = fields.filter((field) => fieldIsVisible(field, answers));
  const missingFields = visibleFields.filter((field) => field.required && field.type !== "photos" && !hasValue(answers[field.id])).map((field) => field.id);
  for (const field of visibleFields) {
    if (!["select", "radio", "checkboxes"].includes(field.type) || !hasValue(answers[field.id])) continue;
    const values = Array.isArray(answers[field.id]) ? answers[field.id] : [answers[field.id]];
    if (values.some((value) => !field.options.includes(value))) missingFields.push(field.id);
  }
  if (missingFields.length) return jsonResponse({ ok: false, message: "Please complete all required fields before submitting.", missingFields: [...new Set(missingFields)] }, 400);

  const checkedPhotos = readAndValidatePhotos(parsed.formData);
  if (!checkedPhotos.ok) return checkedPhotos.response;
  const photoField = visibleFields.find((field) => field.type === "photos");
  if (photoField?.required && checkedPhotos.photos.length === 0) {
    return jsonResponse({ ok: false, message: "Please add the required photos.", missingFields: [photoField.id] }, 400);
  }
  if (checkedPhotos.photos.length && !env?.SUBMISSION_PHOTOS) {
    return jsonResponse({ ok: false, message: "Photo storage is temporarily unavailable. Please call (347) 454-2282." }, 503);
  }

  const submissionId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const uploadedKeys = [];
  try {
    const uploaded = checkedPhotos.photos.length ? await uploadSubmissionPhotos({
      bucket: env.SUBMISSION_PHOTOS, photos: checkedPhotos.photos, origin: url.origin,
      submissionId, prefix: "form-submissions", source: published.schema.slug,
    }) : { keys: [], files: [] };
    uploadedKeys.push(...uploaded.keys);
    const answerDetails = visibleFields.filter((field) => field.type !== "photos" && hasValue(answers[field.id])).map((field) => ({
      id: field.id, label: field.label, type: field.type, value: answers[field.id],
    }));
    const data = {
      formId: published.schema.id, formSlug: published.schema.slug, formTitle: published.schema.title,
      formVersionId: published.versionId, formVersionNumber: published.versionNumber,
      answers, answerDetails,
    };
    const identity = submissionIdentity(published.schema.slug, url.origin);
    const customer = contactAnswers(fields, answers);
    await createSubmission(env, {
      id: submissionId, type: identity.type, status: "New", submittedAt,
      customer,
      location: { neighborhood: neighborhoodAnswer(fields, answers) || "" },
      summary: [published.schema.title, answers.estimatedSize].filter(Boolean).join(" · "),
      data, files: uploaded.files, sourcePage: identity.sourcePage,
    });
    return jsonResponse({ ok: true, submissionId, message: published.schema.successMessage });
  } catch (error) {
    await deleteUploadedPhotos(env?.SUBMISSION_PHOTOS, uploadedKeys);
    console.error("Dynamic form submission failed", error);
    const status = error?.code === "DATABASE_NOT_CONFIGURED" ? 503 : 502;
    return jsonResponse({ ok: false, message: "We could not save your request. Please try again or call (347) 454-2282." }, status);
  }
}
