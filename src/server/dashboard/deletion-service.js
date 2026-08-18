import { deleteSubmissionRecord } from "../storage/submission-repository.js";

export async function deleteDashboardSubmission({ env, type, id, logger = console }) {
  try {
    const deleted = await deleteSubmissionRecord({ env, type, id });
    let photoCleanupWarning = "";
    if (deleted.photoKeys.length) {
      if (!env?.SUBMISSION_PHOTOS) {
        photoCleanupWarning = "The entry was deleted, but its stored photos could not be removed.";
      } else {
        const outcomes = await Promise.allSettled(deleted.photoKeys.map((key) => env.SUBMISSION_PHOTOS.delete(key)));
        if (outcomes.some((outcome) => outcome.status === "rejected")) {
          photoCleanupWarning = "The entry was deleted, but one or more stored photos could not be removed.";
          logger.error("dashboard.delete.photo_cleanup_failed", { submissionType: type, submissionId: id });
        }
      }
    }
    return {
      ok: true,
      deleted: { type, id },
      message: "The submission was permanently deleted.",
      ...(photoCleanupWarning ? { warning: photoCleanupWarning } : {}),
    };
  } catch (error) {
    if (error?.code === "INVALID_SUBMISSION") {
      return { ok: false, status: 400, code: error.code, message: "The submission could not be identified." };
    }
    if (error?.code === "SUBMISSION_NOT_FOUND") {
      return { ok: false, status: 404, code: error.code, message: "The submission was not found." };
    }
    if (error?.code === "DATABASE_NOT_CONFIGURED") {
      return { ok: false, status: 503, code: error.code, message: "The submissions database has not been configured yet." };
    }
    logger.error("dashboard.delete.failed", {
      submissionType: String(type || "").slice(0, 40),
      errorName: String(error?.name || "Error").slice(0, 80),
      errorMessage: String(error?.message || "Unknown deletion failure").replace(/[\r\n]+/g, " ").slice(0, 240),
    });
    return { ok: false, status: 502, code: "DELETE_FAILED", message: "The submission could not be deleted." };
  }
}
