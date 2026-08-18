import { approveTestimonialRecord } from "../storage/submission-repository.js";

export async function approveDashboardTestimonial({ env, id, approvedBy, logger = console }) {
  try {
    const approved = await approveTestimonialRecord({ env, id, approvedBy });
    return {
      ok: true,
      approved,
      message: approved.alreadyApproved
        ? "This testimonial is already published."
        : "The testimonial was approved and is now published.",
    };
  } catch (error) {
    const expectedErrors = {
      INVALID_TESTIMONIAL: [400, "The testimonial could not be identified."],
      TESTIMONIAL_NOT_PUBLISHABLE: [400, "This testimonial is missing publication consent or required public information."],
      INVALID_TESTIMONIAL_STATUS: [409, "This testimonial is not waiting for review."],
      APPROVAL_CONFLICT: [409, "The testimonial changed while it was being approved. Refresh and try again."],
      SUBMISSION_NOT_FOUND: [404, "The testimonial was not found."],
      DATABASE_NOT_CONFIGURED: [503, "The submissions database has not been configured yet."],
    };
    if (expectedErrors[error?.code]) {
      const [status, message] = expectedErrors[error.code];
      return { ok: false, status, code: error.code, message };
    }
    logger.error("dashboard.testimonial_approval.failed", {
      errorName: String(error?.name || "Error").slice(0, 80),
      errorMessage: String(error?.message || "Unknown approval failure").replace(/[\r\n]+/g, " ").slice(0, 240),
    });
    return { ok: false, status: 502, code: "APPROVAL_FAILED", message: "The testimonial could not be approved." };
  }
}
