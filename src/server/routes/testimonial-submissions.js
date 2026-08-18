import { cleanText, jsonResponse, readFormData } from "../common/http.js";
import { createSubmission } from "../storage/submission-repository.js";

export async function handleTestimonialSubmission(request, env, url) {
  const parsed = await readFormData(request);
  if (!parsed.ok) return parsed.response;
  const { formData } = parsed;
  if (cleanText(formData.get("website"), 200)) {
    return jsonResponse({ ok: true, message: "Thank you. Your testimonial was received for review." });
  }

  const submittedAt = new Date().toISOString();
  const submissionId = crypto.randomUUID();
  const testimonialSubmission = {
    submittedAt,
    submissionId,
    status: "Pending review",
    reviewerName: cleanText(formData.get("reviewerName"), 200),
    reviewerOrganization: cleanText(formData.get("reviewerOrganization"), 200),
    reviewerContact: cleanText(formData.get("reviewerContact"), 320),
    testimonial: cleanText(formData.get("testimonial"), 4000),
    publicationConsent: cleanText(formData.get("publicationConsent"), 20),
    sourcePage: `${url.origin}/`,
  };
  const missingFields = ["reviewerName", "reviewerContact", "testimonial", "publicationConsent"]
    .filter((fieldName) => !testimonialSubmission[fieldName]);
  if (testimonialSubmission.testimonial.length < 20) missingFields.push("testimonial");
  if (testimonialSubmission.publicationConsent !== "yes") missingFields.push("publicationConsent");
  if (missingFields.length) {
    return jsonResponse({
      ok: false,
      message: "Please complete the required fields and confirm publication permission.",
      missingFields: [...new Set(missingFields)],
    }, 400);
  }

  try {
    const contactIsEmail = testimonialSubmission.reviewerContact.includes("@");
    await createSubmission(env, {
      id: submissionId,
      type: "testimonial",
      status: "Pending review",
      submittedAt,
      customer: {
        name: testimonialSubmission.reviewerName,
        email: contactIsEmail ? testimonialSubmission.reviewerContact : "",
        phone: contactIsEmail ? "" : testimonialSubmission.reviewerContact,
      },
      summary: testimonialSubmission.testimonial.length > 110
        ? `${testimonialSubmission.testimonial.slice(0, 107)}…`
        : testimonialSubmission.testimonial,
      data: testimonialSubmission,
      sourcePage: testimonialSubmission.sourcePage,
    });
    return jsonResponse({
      ok: true,
      submissionId,
      message: "Thank you. Your testimonial was received and will be reviewed before publication.",
    });
  } catch (error) {
    console.error("Testimonial submission failed", error);
    const status = error?.code === "DATABASE_NOT_CONFIGURED" ? 503 : 502;
    return jsonResponse({ ok: false, message: "We could not save your testimonial. Please try again later." }, status);
  }
}
