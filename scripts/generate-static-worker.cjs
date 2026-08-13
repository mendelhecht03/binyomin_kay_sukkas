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
  "name",
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
  "estimatedSize",
  "estimatedWidth",
  "estimatedLength",
  "sukkahType",
  "sukkahTypeOther",
  "schach",
  "schachOther",
  "addOnsOther",
  "extraServiceRequired",
  "extraServiceDetails",
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
const buildsGoogleFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSeG57s-Ttt59d4H6vpRagSjMZvzkqR3OVTm-pnJJNIgjruBGA/formResponse";

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
    "name",
    "phone",
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "neighborhood",
    "estimatedSize",
    "sukkahType",
    "schach",
    "buildDate",
    "takeDownDate",
    "extraServiceRequired",
    "referral",
  ];

  if (submission.sukkahPlan === "I would like to buy") {
    required.push("fulfillmentMethod");
  }

  if (submission.extraServiceRequired === "Yes") required.push("extraServiceDetails");

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

function isIsoDate(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function appendRentalDate(body, entryId, value, legacyOtherValue) {
  if (isIsoDate(value)) {
    appendGoogleFormChoice(body, entryId, "Other", value, new Set());
    return;
  }

  appendGoogleFormChoice(
    body,
    entryId,
    value,
    legacyOtherValue,
    new Set(["Sunday", "Monday", "Tuesday"]),
  );
}

async function handleRentalSubmission(request, env, url) {
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
    addressLine1: cleanText(formData.get("addressLine1") || formData.get("address"), 1000),
    city: cleanText(formData.get("city"), 200),
    state: cleanText(formData.get("state"), 120),
    postalCode: cleanText(formData.get("postalCode"), 20),
    neighborhood: cleanText(formData.get("neighborhood"), 120),
    neighborhoodOther: cleanText(formData.get("neighborhoodOther"), 200),
    estimatedSize: cleanText(formData.get("estimatedSize"), 200),
    siteDescription: cleanText(formData.get("siteDescription"), 4000),
    buildDay: cleanText(formData.get("buildDay"), 100),
    buildDayOther: cleanText(formData.get("buildDayOther"), 200),
    takeDownDay: cleanText(formData.get("takeDownDay"), 100),
    takeDownDayOther: cleanText(formData.get("takeDownDayOther"), 200),
    addOns: formData.getAll("addOns").map((value) => cleanText(value, 120)),
    furnitureDetails: cleanText(formData.get("furnitureDetails"), 1000),
    addOnsOther: cleanText(formData.get("addOnsOther"), 500),
    extraServiceRequired: cleanText(formData.get("extraServiceRequired"), 20),
    extraServiceDetails: cleanText(formData.get("extraServiceDetails"), 2000),
    timingNotes: cleanText(formData.get("timingNotes"), 1000),
    comments: cleanText(formData.get("comments"), 1000),
    questions: cleanText(formData.get("questions"), 1000),
  };

  rental.address = [rental.addressLine1, rental.city, rental.state, rental.postalCode]
    .filter(Boolean)
    .join(", ") || cleanText(formData.get("address"), 1000);

  const requiredFields = [
    "name",
    "phone",
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "neighborhood",
    "estimatedSize",
    "buildDay",
    "takeDownDay",
    "extraServiceRequired",
    "comments",
  ];
  const missingFields = requiredFields.filter((fieldName) => !rental[fieldName]);
  if (rental.neighborhood === "Other" && !rental.neighborhoodOther) missingFields.push("neighborhoodOther");
  if (rental.buildDay === "Other" && !rental.buildDayOther) missingFields.push("buildDayOther");
  if (rental.takeDownDay === "Other" && !rental.takeDownDayOther) missingFields.push("takeDownDayOther");
  if (rental.buildDay && rental.buildDay !== "Other" && !isIsoDate(rental.buildDay) && !new Set(["Sunday", "Monday", "Tuesday"]).has(rental.buildDay)) missingFields.push("buildDay");
  if (rental.takeDownDay && rental.takeDownDay !== "Other" && !isIsoDate(rental.takeDownDay) && !new Set(["Sunday", "Monday", "Tuesday"]).has(rental.takeDownDay)) missingFields.push("takeDownDay");
  if (rental.addOns.includes("Other") && !rental.addOnsOther) missingFields.push("addOnsOther");
  if (rental.addOns.includes("Furniture") && !rental.furnitureDetails) missingFields.push("furnitureDetails");
  if (rental.extraServiceRequired === "Yes" && !rental.extraServiceDetails) {
    missingFields.push("extraServiceDetails");
  }

  if (missingFields.length > 0) {
    return jsonResponse(
      { ok: false, message: "Please complete all required fields before submitting.", missingFields },
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

  if (photos.length > 0 && !env?.SUBMISSION_PHOTOS) {
    return jsonResponse(
      {
        ok: false,
        message: "Photo storage is temporarily unavailable. Please call (347) 454-2282.",
      },
      503,
    );
  }

  const rentalSubmissionId = photos.length > 0 ? crypto.randomUUID() : "";
  const uploadedPhotoKeys = [];
  const photoLinks = [];

  const body = new URLSearchParams();
  body.set("entry.312894946", rental.name);
  body.set("entry.2077017403", rental.phone);
  if (rental.email) body.set("entry.1426052874", rental.email);
  body.set("entry.403817380", rental.address);
  const rentalNeighborhood = rental.neighborhood === "Remsen Village"
    ? "Remson Village"
    : rental.neighborhood;
  const rentalNativeNeighborhoods = new Set([
    "Crown Heights",
    "Flatbush",
    "Boro Park",
    "Williamsburg",
    "East Flatbush",
    "Remson Village",
    "Monsey",
  ]);
  const rentalNeighborhoodUsesOther =
    rentalNeighborhood === "Other" || !rentalNativeNeighborhoods.has(rentalNeighborhood);
  appendGoogleFormChoice(
    body,
    "70526594",
    rentalNeighborhoodUsesOther ? "Other" : rentalNeighborhood,
    rentalNeighborhoodUsesOther
      ? rental.neighborhood === "Other"
        ? rental.neighborhoodOther
        : rental.neighborhood
      : rental.neighborhoodOther,
    rentalNativeNeighborhoods,
  );
  body.set("entry.1130222480", rental.estimatedSize);
  if (rental.siteDescription) body.set("entry.463838846", rental.siteDescription);
  appendRentalDate(body, "1948310674", rental.buildDay, rental.buildDayOther);
  appendRentalDate(body, "1550547913", rental.takeDownDay, rental.takeDownDayOther);
  const rentalAddOns = rental.addOns.filter((addOn) => addOn !== "Other");
  if (rental.addOnsOther) rentalAddOns.push(rental.addOnsOther);
  const commentsWithServiceDetails = [
    rental.comments,
    rental.furnitureDetails ? \`Furniture details: \${rental.furnitureDetails}\` : "",
    \`Add-ons: \${rentalAddOns.length > 0 ? rentalAddOns.join(", ") : "None selected"}\`,
    \`Extra service required: \${rental.extraServiceRequired}\`,
    rental.extraServiceDetails ? \`Extra service details: \${rental.extraServiceDetails}\` : "",
    rental.timingNotes ? \`Timing notes: \${rental.timingNotes}\` : "",
  ].filter(Boolean).join("\\n\\n");
  body.set("entry.1466499069", commentsWithServiceDetails);
  body.set("entry.455384257", rental.questions || "No questions submitted.");
  body.set("fvv", "1");
  body.set("pageHistory", "0");

  try {
    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index];
      const key = \`rental-submissions/\${rentalSubmissionId}/\${String(index + 1).padStart(2, "0")}-\${safeFileName(photo.name)}\`;
      await env.SUBMISSION_PHOTOS.put(key, photo.stream(), {
        httpMetadata: {
          contentType: photo.type || "application/octet-stream",
        },
        customMetadata: {
          originalName: cleanText(photo.name, 120),
          submissionId: rentalSubmissionId,
          source: "rental",
        },
      });
      uploadedPhotoKeys.push(key);
      photoLinks.push(\`\${url.origin}\${photoRoutePrefix}\${key}\`);
    }

    if (photoLinks.length > 0) {
      body.set(
        "entry.1466499069",
        [commentsWithServiceDetails, \`Photo links: \${photoLinks.join(", ")}\`]
          .filter(Boolean)
          .join("\\n\\n"),
      );
    }

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

    if (googleResponse.status < 200 || googleResponse.status >= 400) {
      throw new Error("Google Forms rejected the rental request with status " + googleResponse.status + ".");
    }

    return jsonResponse({
      ok: true,
      message: "Thank you. Your rental request was sent to Benyamin.",
    });
  } catch (error) {
    await deleteUploadedPhotos(env?.SUBMISSION_PHOTOS, uploadedPhotoKeys);
    console.error("Rental submission failed", error);
    return jsonResponse(
      { ok: false, message: "We could not send your request. Please try again or call (347) 454-2282." },
      502,
    );
  }
}

async function handleTestimonialSubmission(request, env, url) {
  if (!env?.SUKKAH_SHEETS_WEBHOOK_URL || !env?.SUKKAH_SHEETS_WEBHOOK_SECRET) {
    return jsonResponse(
      {
        ok: false,
        message: "Online testimonial submissions are temporarily unavailable. Please try again later.",
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
    return jsonResponse({ ok: true, message: "Thank you. Your testimonial was received for review." });
  }

  const testimonialSubmission = {
    submittedAt: new Date().toISOString(),
    submissionId: crypto.randomUUID(),
    status: "Pending review",
    reviewerName: cleanText(formData.get("reviewerName"), 200),
    reviewerOrganization: cleanText(formData.get("reviewerOrganization"), 200),
    reviewerContact: cleanText(formData.get("reviewerContact"), 320),
    testimonial: cleanText(formData.get("testimonial"), 4000),
    publicationConsent: cleanText(formData.get("publicationConsent"), 20),
    sourcePage: url.origin + "/",
  };

  const missingFields = ["reviewerName", "reviewerContact", "testimonial", "publicationConsent"]
    .filter((fieldName) => !testimonialSubmission[fieldName]);
  if (testimonialSubmission.testimonial.length < 20) missingFields.push("testimonial");
  if (testimonialSubmission.publicationConsent !== "yes") missingFields.push("publicationConsent");

  if (missingFields.length > 0) {
    return jsonResponse(
      {
        ok: false,
        message: "Please complete the required fields and confirm publication permission.",
        missingFields: [...new Set(missingFields)],
      },
      400,
    );
  }

  try {
    const webhookResponse = await fetch(env.SUKKAH_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        secret: env.SUKKAH_SHEETS_WEBHOOK_SECRET,
        type: "testimonialSubmission",
        testimonialSubmission,
      }),
      redirect: "follow",
    });

    const webhookResult = await webhookResponse.json().catch(() => null);
    if (!webhookResponse.ok || webhookResult?.ok !== true) {
      throw new Error("The spreadsheet webhook rejected the testimonial.");
    }

    return jsonResponse({
      ok: true,
      submissionId: testimonialSubmission.submissionId,
      message: "Thank you. Your testimonial was received and will be reviewed before publication.",
    });
  } catch (error) {
    console.error("Testimonial submission failed", error);
    return jsonResponse(
      {
        ok: false,
        message: "We could not send your testimonial. Please try again later.",
      },
      502,
    );
  }
}

async function handleSubmission(request, env, url) {
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
  if (submission.name) {
    const nameParts = submission.name.split(/\s+/);
    submission.firstName = nameParts.shift() || "";
    submission.lastName = nameParts.join(" ");
  }
  submission.service = formData.getAll("service").map((value) => cleanText(value, 120));
  submission.addOns = formData.getAll("addOns").map((value) => cleanText(value, 120));
  const schachChoices = formData.getAll("schach").map((value) => cleanText(value, 120));
  submission.schach = schachChoices
    .filter((value) => value !== "Other")
    .concat(submission.schachOther ? [submission.schachOther] : [])
    .join(", ");
  const sizeMatch = submission.estimatedSize.match(/^\s*(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)(?:\s*ft)?\s*$/i);
  submission.estimatedWidth = sizeMatch ? sizeMatch[1] : submission.estimatedSize;
  submission.estimatedLength = sizeMatch ? sizeMatch[2] : "";

  const missingFields = requiredFieldsFor(submission).filter((fieldName) => !submission[fieldName]);
  if (submission.sukkahPlan === "I already have a sukkah" && submission.service.length === 0) {
    missingFields.push("service");
  }
  if (submission.neighborhood === "Other" && !submission.neighborhoodOther) {
    missingFields.push("neighborhoodOther");
  }
  if (submission.service.includes("Other") && !submission.serviceOther) {
    missingFields.push("serviceOther");
  }
  if (submission.sukkahType === "Other" && !submission.sukkahTypeOther) {
    missingFields.push("sukkahTypeOther");
  }
  if (schachChoices.includes("Other") && !submission.schachOther) {
    missingFields.push("schachOther");
  }
  if (submission.addOns.includes("Other") && !submission.addOnsOther) {
    missingFields.push("addOnsOther");
  }
  if (submission.service.includes("Take down")) {
    if (!submission.takeDownDate) missingFields.push("takeDownDate");
    if (submission.takeDownDate === "other" && !submission.customTakeDownDate) {
      missingFields.push("customTakeDownDate");
    }
  }
  if (submission.service.includes("Bring to storage")) {
    if (!submission.bringToStorageDate) missingFields.push("bringToStorageDate");
    if (submission.bringToStorageDate === "other" && !submission.customStorageDate) {
      missingFields.push("customStorageDate");
    }
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

    const buildsFormBody = new URLSearchParams();
    buildsFormBody.set("entry.1459645135", submission.name);
    buildsFormBody.set("entry.88578913", submission.phone);
    buildsFormBody.set("entry.2032952346", submission.email);
    buildsFormBody.set("entry.1702547426", submission.addressLine1);
    buildsFormBody.set("entry.1843122157", submission.city);
    buildsFormBody.set("entry.1885630262", submission.state);
    buildsFormBody.set("entry.1633468001", submission.postalCode);
    buildsFormBody.set("entry.235283559", submission.neighborhood);
    buildsFormBody.set("entry.288053173", submission.neighborhoodOther);
    buildsFormBody.set("entry.102030242", submission.estimatedSize);
    buildsFormBody.set("entry.1183330893", submission.siteDescription);
    buildsFormBody.set("entry.935662014", photoLinks.join("\n"));
    buildsFormBody.set("entry.1046853169", submission.buildDate);
    buildsFormBody.set("entry.1121106129", submission.takeDownDate);
    buildsFormBody.set("entry.571101021", submission.timingNotes);
    buildsFormBody.set("entry.2084089472", submission.service.join(", "));
    buildsFormBody.set("entry.541886835", submission.serviceOther);
    buildsFormBody.set("entry.880396791", submission.bringToStorageDate);
    buildsFormBody.set("entry.1499157179", submission.extraServiceRequired);
    buildsFormBody.set("entry.740183059", submission.extraServiceDetails);
    buildsFormBody.set("entry.646890311", submission.sukkahType);
    buildsFormBody.set("entry.417298100", submission.sukkahTypeOther);
    buildsFormBody.set("entry.1823327486", submission.schach);
    buildsFormBody.set("entry.145570292", submission.schachOther);
    buildsFormBody.set("entry.110336263", submission.addOns.join(", "));
    buildsFormBody.set("entry.1850093219", submission.addOnsOther);
    buildsFormBody.set("entry.1318520419", submission.referral);
    buildsFormBody.set("entry.651494436", submission.comments);
    buildsFormBody.set("entry.443309138", submission.submissionId);
    buildsFormBody.set("entry.1059985494", submission.submittedAt);
    buildsFormBody.set("entry.1308618501", submission.status);
    buildsFormBody.set("entry.2039676450", submission.sourcePage);
    buildsFormBody.set("fvv", "1");
    buildsFormBody.set("pageHistory", "0");

    const googleResponse = await fetch(buildsGoogleFormUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: buildsFormBody.toString(),
      redirect: "follow",
    });

    if (!googleResponse.ok) {
      throw new Error("Google Forms rejected the Builds request with status " + googleResponse.status + ".");
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
      return handleRentalSubmission(request, env, url);
    }

    if (request.method === "POST" && url.pathname === "/api/testimonial-submissions") {
      return handleTestimonialSubmission(request, env, url);
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

function writeGeneratedFile(filePath, contents) {
  const retryableCodes = new Set(["EBUSY", "EPERM", "UNKNOWN"]);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(filePath, contents);
      return;
    } catch (error) {
      if (attempt === 5 || !retryableCodes.has(error?.code)) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300 * (attempt + 1));
    }
  }
}

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(hostingDir, { recursive: true });
writeGeneratedFile(path.join(rootDir, "index.mjs"), workerSource);
writeGeneratedFile(path.join(serverDir, "index.js"), workerSource);
fs.copyFileSync(
  path.join(rootDir, ".openai", "hosting.json"),
  path.join(hostingDir, "hosting.json"),
);

const rawSize = Buffer.byteLength(workerSource);
const gzipSize = zlib.gzipSync(workerSource).byteLength;

console.log(
  `Generated Worker files from ${records.length} files (${rawSize} bytes, ${gzipSize} bytes gzipped).`,
);
