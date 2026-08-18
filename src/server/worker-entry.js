import { PHOTO_ROUTE_PREFIX, handlePhotoRequest } from "./adapters/photo-storage.js";
import {
  adminPageAccessResponse,
  handleAdminSubmissionsRequest,
  withAdminPageHeaders,
} from "./dashboard/worker-entry.js";
import { submissionHandlerForPath } from "./routes/index.js";
import { handlePublicTestimonialsRequest } from "./routes/public-testimonials.js";
import { createStaticFileService, normalizePath } from "./static-files.js";

export function createWorker(fileRecords) {
  const staticFiles = createStaticFileService(fileRecords);
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname === "/api/admin/submissions") {
        if (request.method !== "GET" && request.method !== "DELETE" && request.method !== "PATCH") {
          return new Response("Method not allowed", { status: 405, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        return handleAdminSubmissionsRequest(request, env);
      }
      if (url.pathname === "/api/testimonials" && request.method === "GET") {
        return handlePublicTestimonialsRequest(env);
      }
      const submissionHandler = request.method === "POST" ? submissionHandlerForPath(url.pathname) : undefined;
      if (submissionHandler) return submissionHandler(request, env, url);
      if (request.method === "GET" && url.pathname.startsWith(PHOTO_ROUTE_PREFIX)) return handlePhotoRequest(env, url.pathname);
      if (request.method === "POST" && url.pathname === "/api/sukkah-quote") {
        return Response.json({ ok: true, message: "Quote calculation backend will be added later." });
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

      const normalizedPath = normalizePath(url.pathname);
      if (normalizedPath === "/admin/" || normalizedPath === "/admin/index.html") {
        const accessResponse = adminPageAccessResponse(request, env);
        if (accessResponse) return accessResponse;
        const adminFile = staticFiles.get("/admin/");
        if (!adminFile) return new Response("Not found", { status: 404 });
        return withAdminPageHeaders(staticFiles.response(adminFile, request.method));
      }
      const file = staticFiles.get(url.pathname);
      return file ? staticFiles.response(file, request.method) : staticFiles.notFound(request.method);
    },
  };
}
