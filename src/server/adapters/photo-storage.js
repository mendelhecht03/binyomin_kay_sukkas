import { cleanText, jsonResponse } from "../common/http.js";
import { adminErrorResponse, authorizeAdminRequest } from "../dashboard/admin-auth.js";

export const PHOTO_ROUTE_PREFIX = "/api/sukkah-submission-photos/";
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);
const ALLOWED_PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic", "heif"]);
const MAXIMUM_PHOTO_SIZE = 10 * 1024 * 1024;

export function safeFileName(name) {
  const cleaned = cleanText(name, 120)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "site-photo";
}

function fileExtension(name) {
  const segments = String(name).toLowerCase().split(".");
  return segments.length > 1 ? segments.pop() : "";
}

export function readAndValidatePhotos(formData) {
  const photos = formData
    .getAll("sitePhotos")
    .filter((value) => typeof File !== "undefined" && value instanceof File && value.size > 0);

  if (photos.length > 3) {
    return { ok: false, response: jsonResponse({ ok: false, message: "Please choose no more than three photos." }, 400) };
  }

  const invalid = photos.some((photo) => {
    const extension = fileExtension(photo.name);
    return photo.size > MAXIMUM_PHOTO_SIZE ||
      !ALLOWED_PHOTO_EXTENSIONS.has(extension) ||
      (photo.type && !ALLOWED_PHOTO_TYPES.has(photo.type.toLowerCase()));
  });
  if (invalid) {
    return {
      ok: false,
      response: jsonResponse({
        ok: false,
        message: "Each photo must be a JPG, PNG, or HEIC file no larger than 10 MB.",
      }, 400),
    };
  }

  return { ok: true, photos };
}

export async function uploadSubmissionPhotos({ bucket, photos, origin, submissionId, prefix = "", source = "build" }) {
  const keys = [];
  const links = [];
  const files = [];
  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    const fileName = `${String(index + 1).padStart(2, "0")}-${safeFileName(photo.name)}`;
    const key = [prefix, submissionId, fileName].filter(Boolean).join("/");
    await bucket.put(key, photo.stream(), {
      httpMetadata: { contentType: photo.type || "application/octet-stream" },
      customMetadata: {
        originalName: cleanText(photo.name, 120),
        submissionId,
        source,
      },
    });
    keys.push(key);
    links.push(`${origin}${PHOTO_ROUTE_PREFIX}${key}`);
    files.push({
      id: crypto.randomUUID(),
      key,
      originalName: cleanText(photo.name, 120),
      contentType: photo.type || "application/octet-stream",
      sizeBytes: photo.size,
    });
  }
  return { keys, links, files };
}

export async function deleteUploadedPhotos(bucket, keys) {
  if (!bucket || keys.length === 0) return;
  await Promise.allSettled(keys.map((key) => bucket.delete(key)));
}

export function photoKeysFromUrls(urls = []) {
  return urls.flatMap((value) => {
    try {
      const url = new URL(value);
      if (!url.pathname.startsWith(PHOTO_ROUTE_PREFIX)) return [];
      const key = decodeURIComponent(url.pathname.slice(PHOTO_ROUTE_PREFIX.length));
      return key && !key.includes("..") ? [key] : [];
    } catch {
      return [];
    }
  });
}

export async function handlePhotoRequest(request, env, pathname, ctx) {
  const access = await authorizeAdminRequest(request, env, ctx);
  if (!access.ok) return adminErrorResponse(access);
  if (!env?.SUBMISSION_PHOTOS) return new Response("Photo storage unavailable", { status: 503 });
  const key = decodeURIComponent(pathname.slice(PHOTO_ROUTE_PREFIX.length));
  if (!key || key.includes("..")) return new Response("Not found", { status: 404 });
  const photo = await env.SUBMISSION_PHOTOS.get(key);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(photo.body, {
    headers: {
      "Content-Type": photo.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${safeFileName(photo.customMetadata?.originalName || "site-photo")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
