import { jsonResponse } from "../common/http.js";
import { listApprovedTestimonials } from "../storage/submission-repository.js";

export async function handlePublicTestimonialsRequest(env) {
  try {
    const testimonials = await listApprovedTestimonials({ env });
    return jsonResponse(
      { ok: true, testimonials },
      200,
      { "Cache-Control": "public, max-age=0, must-revalidate", "X-Content-Type-Options": "nosniff" },
    );
  } catch (error) {
    console.error("testimonials.public_list.failed", {
      errorName: String(error?.name || "Error").slice(0, 80),
      errorMessage: String(error?.message || "Unknown testimonial listing failure").replace(/[\r\n]+/g, " ").slice(0, 240),
    });
    return jsonResponse(
      { ok: false, testimonials: [], message: "Customer stories are temporarily unavailable." },
      503,
      { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    );
  }
}
