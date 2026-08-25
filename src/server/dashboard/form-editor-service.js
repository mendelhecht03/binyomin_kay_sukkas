import { authorizeAdminRequest, adminErrorResponse } from "./admin-auth.js";
import {
  createFormDraft, getFormById, listForms, listFormVersions, publishForm,
  publishRequestedBuiltInUpdates, restoreFormVersion, saveFormDraft,
} from "../storage/form-repository.js";

const HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

function response(body, status = 200) { return Response.json(body, { status, headers: HEADERS }); }

export async function handleAdminFormsRequest(request, env, pathname) {
  const access = authorizeAdminRequest(request, env);
  if (!access.ok) return adminErrorResponse(access);
  if (request.method !== "GET") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== new URL(request.url).origin) return response({ ok: false, message: "This dashboard request was not allowed." }, 403);
  }
  const segments = pathname.split("/").filter(Boolean);
  const id = segments[3] ? decodeURIComponent(segments[3]) : "";
  const action = segments[4] || "";
  try {
    if (request.method === "GET" && !id) return response({ ok: true, forms: await listForms({ env }) });
    if (request.method === "GET" && id && action === "versions") return response({ ok: true, versions: await listFormVersions({ env, id }) });
    if (request.method === "GET" && id) {
      const form = await getFormById({ env, id });
      return form ? response({ ok: true, form }) : response({ ok: false, message: "The form was not found." }, 404);
    }
    const body = await request.json().catch(() => null);
    let result;
    if (request.method === "POST" && id === "sync-built-in-updates" && !action) {
      result = await publishRequestedBuiltInUpdates({ env, updatedBy: access.email });
    }
    else if (request.method === "POST" && !id) result = await createFormDraft({ env, schema: body?.schema, updatedBy: access.email });
    else if (request.method === "PUT" && id && !action) result = await saveFormDraft({ env, id, schema: body?.schema, updatedBy: access.email });
    else if (request.method === "POST" && id && action === "publish") result = await publishForm({ env, id, updatedBy: access.email });
    else if (request.method === "POST" && id && action === "restore") result = await restoreFormVersion({ env, id, versionId: body?.versionId, updatedBy: access.email });
    else return response({ ok: false, message: "Method not allowed." }, 405);
    return response(result, result.ok ? 200 : (result.status || 400));
  } catch (error) {
    console.error("Admin form editor request failed", error);
    const status = error?.code === "DATABASE_NOT_CONFIGURED" ? 503 : 500;
    return response({ ok: false, message: "The form editor could not complete that request." }, status);
  }
}
