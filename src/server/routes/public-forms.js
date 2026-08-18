import { jsonResponse } from "../common/http.js";
import { getPublishedFormBySlug } from "../storage/form-repository.js";

export async function handlePublicFormRequest(env, slug) {
  try {
    const form = await getPublishedFormBySlug({ env, slug });
    if (!form) return jsonResponse({ ok: false, message: "This form is not available." }, 404);
    return jsonResponse({ ok: true, ...form }, 200, { "Cache-Control": "public, max-age=60" });
  } catch (error) {
    console.error("Public form loading failed", error);
    return jsonResponse({ ok: false, message: "This form is temporarily unavailable." }, 503);
  }
}
