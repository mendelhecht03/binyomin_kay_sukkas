import { PHOTO_ROUTE_PREFIX, handlePhotoRequest } from "./adapters/photo-storage.js";
import {
  adminPageAccessResponse,
  handleAdminGoogleSheetsRequest,
  handleAdminSubmissionsRequest,
  withAdminPageHeaders,
} from "./dashboard/worker-entry.js";
import { submissionHandlerForPath } from "./routes/index.js";
import { handlePublicTestimonialsRequest } from "./routes/public-testimonials.js";
import { handlePublicFormRequest } from "./routes/public-forms.js";
import { handleAdminFormsRequest } from "./dashboard/form-editor-service.js";
import { handleDynamicFormSubmission } from "./routes/dynamic-form-submissions.js";
import { createStaticFileService, normalizePath } from "./static-files.js";

export function createWorker() {
  return {
    async fetch(request, env = {}, ctx) {
      const url = new URL(request.url);
      const staticFiles = createStaticFileService(env.ASSETS);
      if (url.pathname === "/api/admin/forms" || url.pathname.startsWith("/api/admin/forms/")) {
        return handleAdminFormsRequest(request, env, url.pathname, ctx);
      }
      if (url.pathname.startsWith("/api/forms/") && request.method === "GET") {
        return handlePublicFormRequest(env, decodeURIComponent(url.pathname.slice("/api/forms/".length)));
      }
      if (url.pathname.startsWith("/api/form-submissions/") && request.method === "POST") {
        return handleDynamicFormSubmission(request, env, url, decodeURIComponent(url.pathname.slice("/api/form-submissions/".length)));
      }
      if (url.pathname === "/api/admin/submissions") {
        if (request.method !== "GET" && request.method !== "DELETE" && request.method !== "PATCH") {
          return new Response("Method not allowed", { status: 405, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        return handleAdminSubmissionsRequest(request, env, ctx);
      }
      if (url.pathname.startsWith("/api/admin/google-sheets/")) {
        return handleAdminGoogleSheetsRequest(request, env, url.pathname, ctx);
      }
      if (url.pathname === "/api/testimonials" && request.method === "GET") {
        return handlePublicTestimonialsRequest(env);
      }
      const submissionHandler = request.method === "POST" ? submissionHandlerForPath(url.pathname) : undefined;
      if (submissionHandler) return submissionHandler(request, env, url);
      if (request.method === "GET" && url.pathname.startsWith(PHOTO_ROUTE_PREFIX)) return handlePhotoRequest(request, env, url.pathname, ctx);
      if (request.method === "POST" && url.pathname === "/api/sukkah-quote") {
        return Response.json({ ok: true, message: "Quote calculation backend will be added later." });
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

      const normalizedPath = normalizePath(url.pathname);
      if (/^\/request\/[a-z0-9_-]+\/$/.test(normalizedPath)) {
        return staticFiles.response(request, "/request/");
      }
      if (normalizedPath === "/admin/" || normalizedPath === "/admin/index.html") {
        const accessResponse = await adminPageAccessResponse(request, env, ctx);
        if (accessResponse) return accessResponse;
        return withAdminPageHeaders(await staticFiles.response(request, "/admin/"));
      }
      return staticFiles.response(request, url.pathname);
    },
  };
}
