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

export default {
  async fetch(request) {
    const url = new URL(request.url);

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
