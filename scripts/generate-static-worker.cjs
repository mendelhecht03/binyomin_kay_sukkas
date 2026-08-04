const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "dist");

const contentTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webm": "video/webm",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function collectFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath));
      continue;
    }

    files.push(path.relative(outputDir, absolutePath).replace(/\\/g, "/"));
  }

  return files.sort();
}

if (!fs.existsSync(outputDir) || !fs.statSync(outputDir).isDirectory()) {
  throw new Error(
    "The dist directory is missing. Run `npm run build:site` before generating the Worker.",
  );
}

const filesToServe = collectFiles(outputDir);

function routeForFile(filePath) {
  const route = `/${filePath.replace(/\\/g, "/")}`;

  if (route.endsWith("/index.html")) {
    return route.slice(0, -"index.html".length);
  }

  return route;
}

const records = filesToServe.map((filePath) => {
  const absolutePath = path.join(outputDir, filePath);
  const extension = path.extname(filePath).toLowerCase();

  return {
    path: routeForFile(filePath),
    contentType: contentTypes[extension] || "application/octet-stream",
    body: fs.readFileSync(absolutePath).toString("base64"),
  };
});

const workerSource = `const files = new Map(${JSON.stringify(records, null, 2)}.map((file) => [file.path, file]));

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function normalizePath(pathname) {
  let routePath = decodeURIComponent(pathname);

  if (!routePath.startsWith("/")) {
    routePath = \`/\${routePath}\`;
  }

  if (routePath.endsWith("/")) {
    return routePath;
  }

  const lastSegment = routePath.split("/").pop() || "";

  if (!lastSegment.includes(".")) {
    return \`\${routePath}/\`;
  }

  return routePath;
}

function getFile(pathname) {
  const routePath = normalizePath(pathname);
  return files.get(routePath);
}

const submissionTextFields = [
  "sukkahPlan",
  "fulfillmentMethod",
  "firstName",
  "lastName",
  "phone",
  "email",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "neighborhood",
  "neighborhoodOther",
  "serviceOther",
  "estimatedWidth",
  "estimatedLength",
  "sukkahType",
  "sukkahTypeOther",
  "schach",
  "schachOther",
  "addOnsOther",
  "siteDescription",
  "buildDate",
  "preSukkosDate",
  "customServiceDate",
  "takeDownDate",
  "customTakeDownDate",
  "bringToStorageDate",
  "customStorageDate",
  "timingNotes",
  "referral",
  "comments",
];

const allowedPhotoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);
const allowedPhotoExtensions = new Set(["jpg", "jpeg", "png", "heic", "heif"]);
const maximumPhotoSize = 10 * 1024 * 1024;
const photoRoutePrefix = "/api/sukkah-submission-photos/";
const rentalGoogleFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSdvF8UbJgSVrSy6ebK6j93vSfEVlkCXshEIHGj1HxFp1bRGBg/formResponse";

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cleanText(value, maximumLength = 4000) {
  return String(value ?? "")
    .replace(/\\u0000/g, "")
    .trim()
    .slice(0, maximumLength);
}

function safeFileName(name) {
  const cleaned = cleanText(name, 120)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "site-photo";
}

function getFileExtension(name) {
  const segments = String(name).toLowerCase().split(".");
  return segments.length > 1 ? segments.pop() : "";
}

function requiredFieldsFor(submission) {
  const required = [
    "sukkahPlan",
    "firstName",
    "lastName",
    "phone",
    "email",
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "neighborhood",
    "sukkahType",
    "schach",
    "referral",
  ];

  if (submission.sukkahPlan === "I would like to buy") {
    required.push("fulfillmentMethod", "buildDate");
  }

  return required;
}

async function deleteUploadedPhotos(bucket, keys) {
  if (!bucket || keys.length === 0) return;
  await Promise.allSettled(keys.map((key) => bucket.delete(key)));
}

function appendGoogleFormChoice(body, entryId, value, otherValue, allowedValues) {
  if (value === "Other") {
    body.set(\`entry.\${entryId}\`, "__other_option__");
    body.set(\`entry.\${entryId}.other_response\`, otherValue);
    return;
  }

  if (!allowedValues.has(value)) {
    throw new Error("The rental form included an unsupported choice.");
  }

  body.set(\`entry.\${entryId}\`, value);
}

async function handleRentalSubmission(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ ok: false, message: "The submitted form could not be read." }, 400);
  }

  if (cleanText(formData.get("website"), 200)) {
    return jsonResponse({ ok: true, message: "Thank you. Your request was received." });
  }

  const rental = {
    name: cleanText(formData.get("name"), 200),
    phone: cleanText(formData.get("phone"), 100),
    email: cleanText(formData.get("email"), 320),
    address: cleanText(formData.get("address"), 1000),
    neighborhood: cleanText(formData.get("neighborhood"), 120),
    neighborhoodOther: cleanText(formData.get("neighborhoodOther"), 200),
    estimatedSize: cleanText(formData.get("estimatedSize"), 200),
    siteDescription: cleanText(formData.get("siteDescription"), 4000),
    buildDay: cleanText(formData.get("buildDay"), 100),
    buildDayOther: cleanText(formData.get("buildDayOther"), 200),
    takeDownDay: cleanText(formData.get("takeDownDay"), 100),
    takeDownDayOther: cleanText(formData.get("takeDownDayOther"), 200),
    comments: cleanText(formData.get("comments"), 1000),
    questions: cleanText(formData.get("questions"), 1000),
  };

  const requiredFields = [
    "name",
    "phone",
    "address",
    "neighborhood",
    "estimatedSize",
    "buildDay",
    "takeDownDay",
    "comments",
    "questions",
  ];
  const missingFields = requiredFields.filter((fieldName) => !rental[fieldName]);
  if (rental.neighborhood === "Other" && !rental.neighborhoodOther) missingFields.push("neighborhoodOther");
  if (rental.buildDay === "Other" && !rental.buildDayOther) missingFields.push("buildDayOther");
  if (rental.takeDownDay === "Other" && !rental.takeDownDayOther) missingFields.push("takeDownDayOther");

  if (missingFields.length > 0) {
    return jsonResponse(
      { ok: false, message: "Please complete all required fields before submitting.", missingFields },
      400,
    );
  }

  const body = new URLSearchParams();
  body.set("entry.312894946", rental.name);
  body.set("entry.2077017403", rental.phone);
  if (rental.email) body.set("entry.1426052874", rental.email);
  body.set("entry.403817380", rental.address);
  appendGoogleFormChoice(
    body,
    "70526594",
    rental.neighborhood,
    rental.neighborhoodOther,
    new Set(["Crown Heights", "Flatbush", "Boro Park", "Williamsburg", "East Flatbush", "Remson Village", "Monsey"]),
  );
  body.set("entry.1130222480", rental.estimatedSize);
  if (rental.siteDescription) body.set("entry.463838846", rental.siteDescription);
  appendGoogleFormChoice(body, "1948310674", rental.buildDay, rental.buildDayOther, new Set(["Sunday", "Monday", "Tuesday"]));
  appendGoogleFormChoice(body, "1550547913", rental.takeDownDay, rental.takeDownDayOther, new Set(["Sunday", "Monday", "Tuesday"]));
  body.set("entry.1466499069", rental.comments);
  body.set("entry.455384257", rental.questions);
  body.set("fvv", "1");
  body.set("pageHistory", "0");

  try {
    const googleResponse = await fetch(rentalGoogleFormUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      // Google confirms a successful form post with a redirect. Following that
      // redirect can lead Workers to an unrelated error page even though the
      // response has already been recorded.
      redirect: "manual",
    });
    await googleResponse.text();
    if (googleResponse.status >= 400) {
      throw new Error("Google Forms did not confirm the rental request.");
    }

    return jsonResponse({
      ok: true,
      message: "Thank you. Your rental request was sent to Benyamin.",
    });
  } catch (error) {
    console.error("Rental submission failed", error);
    return jsonResponse(
      { ok: false, message: "We could not send your request. Please try again or call (347) 454-2282." },
      502,
    );
  }
}

async function handleSubmission(request, env, url) {
  if (!env?.SUKKAH_SHEETS_WEBHOOK_URL || !env?.SUKKAH_SHEETS_WEBHOOK_SECRET) {
    return jsonResponse(
      {
        ok: false,
        message: "Online requests are temporarily unavailable. Please call (347) 454-2282.",
      },
      503,
    );
  }

  if (!env?.SUBMISSION_PHOTOS) {
    return jsonResponse(
      {
        ok: false,
        message: "Photo storage is temporarily unavailable. Please call (347) 454-2282.",
      },
      503,
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ ok: false, message: "The submitted form could not be read." }, 400);
  }

  if (cleanText(formData.get("website"), 200)) {
    return jsonResponse({ ok: true, message: "Thank you. Your request was received." });
  }

  const submission = {};
  for (const fieldName of submissionTextFields) {
    submission[fieldName] = cleanText(formData.get(fieldName));
  }
  submission.service = formData.getAll("service").map((value) => cleanText(value, 120));
  submission.addOns = formData.getAll("addOns").map((value) => cleanText(value, 120));

  const missingFields = requiredFieldsFor(submission).filter((fieldName) => !submission[fieldName]);
  if (submission.sukkahPlan === "I already have a sukkah" && submission.service.length === 0) {
    missingFields.push("service");
  }

  if (missingFields.length > 0) {
    return jsonResponse(
      {
        ok: false,
        message: "Please complete all required fields before submitting.",
        missingFields,
      },
      400,
    );
  }

  const photos = formData
    .getAll("sitePhotos")
    .filter((value) => typeof File !== "undefined" && value instanceof File && value.size > 0);

  if (photos.length > 3) {
    return jsonResponse({ ok: false, message: "Please choose no more than three photos." }, 400);
  }

  for (const photo of photos) {
    const extension = getFileExtension(photo.name);
    if (
      photo.size > maximumPhotoSize ||
      !allowedPhotoExtensions.has(extension) ||
      (photo.type && !allowedPhotoTypes.has(photo.type.toLowerCase()))
    ) {
      return jsonResponse(
        {
          ok: false,
          message: "Each photo must be a JPG, PNG, or HEIC file no larger than 10 MB.",
        },
        400,
      );
    }
  }

  const submissionId = crypto.randomUUID();
  const uploadedPhotoKeys = [];
  const photoLinks = [];

  try {
    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index];
      const key = \`\${submissionId}/\${String(index + 1).padStart(2, "0")}-\${safeFileName(photo.name)}\`;
      await env.SUBMISSION_PHOTOS.put(key, photo.stream(), {
        httpMetadata: {
          contentType: photo.type || "application/octet-stream",
        },
        customMetadata: {
          originalName: cleanText(photo.name, 120),
          submissionId,
        },
      });
      uploadedPhotoKeys.push(key);
      photoLinks.push(\`\${url.origin}\${photoRoutePrefix}\${key}\`);
    }

    submission.submittedAt = new Date().toISOString();
    submission.submissionId = submissionId;
    submission.status = "New";
    submission.photoLinks = photoLinks;
    submission.sourcePage = url.origin + "/sukka-builder/";

    const webhookResponse = await fetch(env.SUKKAH_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        secret: env.SUKKAH_SHEETS_WEBHOOK_SECRET,
        submission,
      }),
      redirect: "follow",
    });

    const webhookResult = await webhookResponse.json().catch(() => null);
    if (!webhookResponse.ok || webhookResult?.ok !== true) {
      throw new Error("The spreadsheet webhook rejected the submission.");
    }

    return jsonResponse({
      ok: true,
      submissionId,
      message: "Thank you. Your request was sent to Benyamin.",
    });
  } catch (error) {
    await deleteUploadedPhotos(env.SUBMISSION_PHOTOS, uploadedPhotoKeys);
    console.error("Sukkah submission failed", error);
    return jsonResponse(
      {
        ok: false,
        message: "We could not send your request. Please try again or call (347) 454-2282.",
      },
      502,
    );
  }
}

async function handlePhotoRequest(env, pathname) {
  if (!env?.SUBMISSION_PHOTOS) {
    return new Response("Photo storage unavailable", { status: 503 });
  }

  const key = decodeURIComponent(pathname.slice(photoRoutePrefix.length));
  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const photo = await env.SUBMISSION_PHOTOS.get(key);
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(photo.body, {
    headers: {
      "Content-Type": photo.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "Content-Disposition": \`inline; filename="\${safeFileName(photo.customMetadata?.originalName || "site-photo")}"\`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/sukkah-submissions") {
      return handleSubmission(request, env, url);
    }

    if (request.method === "POST" && url.pathname === "/api/rental-submissions") {
      return handleRentalSubmission(request);
    }

    if (request.method === "GET" && url.pathname.startsWith(photoRoutePrefix)) {
      return handlePhotoRequest(env, url.pathname);
    }

    if (request.method === "POST" && url.pathname === "/api/sukkah-quote") {
      return Response.json({
        ok: true,
        message: "Quote calculation backend will be added later.",
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const file = getFile(url.pathname);

    if (!file) {
      const notFoundPage = files.get("/404.html");
      const notFoundBody =
        request.method === "HEAD"
          ? null
          : notFoundPage
            ? base64ToBytes(notFoundPage.body)
            : "Not found";

      return new Response(notFoundBody, {
        status: 404,
        headers: {
          "Content-Type": notFoundPage
            ? notFoundPage.contentType
            : "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    return new Response(request.method === "HEAD" ? null : base64ToBytes(file.body), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=60",
      },
    });
  },
};
`;

const serverDir = path.join(outputDir, "server");
const hostingDir = path.join(outputDir, ".openai");

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(hostingDir, { recursive: true });
fs.writeFileSync(path.join(rootDir, "index.mjs"), workerSource);
fs.writeFileSync(path.join(serverDir, "index.js"), workerSource);
fs.copyFileSync(
  path.join(rootDir, ".openai", "hosting.json"),
  path.join(hostingDir, "hosting.json"),
);

const rawSize = Buffer.byteLength(workerSource);
const gzipSize = zlib.gzipSync(workerSource).byteLength;

console.log(
  `Generated Worker files from ${records.length} files (${rawSize} bytes, ${gzipSize} bytes gzipped).`,
);
