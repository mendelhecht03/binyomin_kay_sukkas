const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const esbuild = require("esbuild");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "dist");
const contentTypes = {
  ".avif": "image/avif", ".css": "text/css; charset=utf-8", ".gif": "image/gif",
  ".html": "text/html; charset=utf-8", ".ico": "image/x-icon", ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".mp4": "video/mp4",
  ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm", ".webm": "video/webm", ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2", ".xml": "application/xml; charset=utf-8",
};

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectFiles(absolutePath)
      : [path.relative(outputDir, absolutePath).replace(/\\/g, "/")];
  }).sort();
}

function routeForFile(filePath) {
  const route = `/${filePath.replace(/\\/g, "/")}`;
  return route.endsWith("/index.html") ? route.slice(0, -"index.html".length) : route;
}

if (!fs.existsSync(outputDir) || !fs.statSync(outputDir).isDirectory()) {
  throw new Error("The dist directory is missing. Run `npm run build:site` before generating the Worker.");
}

const records = collectFiles(outputDir).map((filePath) => ({
  path: routeForFile(filePath),
  contentType: contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
  body: fs.readFileSync(path.join(outputDir, filePath)).toString("base64"),
}));
const runtimeBundle = esbuild.buildSync({
  entryPoints: [path.join(rootDir, "src", "server", "worker-entry.js")],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "BKayWorker",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "none",
}).outputFiles[0].text;
const workerSource = `${runtimeBundle}\nconst fileRecords = ${JSON.stringify(records)};\nexport default BKayWorker.createWorker(fileRecords);\n`;

const rootWorkerPath = path.join(rootDir, "index.mjs");
const serverDirectory = path.join(outputDir, "server");
const hostingDirectory = path.join(outputDir, ".openai");

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

fs.mkdirSync(serverDirectory, { recursive: true });
fs.mkdirSync(hostingDirectory, { recursive: true });
writeGeneratedFile(rootWorkerPath, workerSource);
writeGeneratedFile(path.join(serverDirectory, "index.js"), workerSource);
fs.copyFileSync(path.join(rootDir, ".openai", "hosting.json"), path.join(hostingDirectory, "hosting.json"));
const migrationsDirectory = path.join(rootDir, "drizzle");
if (fs.existsSync(migrationsDirectory)) {
  fs.cpSync(migrationsDirectory, path.join(hostingDirectory, "drizzle"), { recursive: true });
}

const bytes = Buffer.byteLength(workerSource);
const gzipBytes = zlib.gzipSync(workerSource).length;
console.log(`Generated Worker: ${(bytes / 1024 / 1024).toFixed(2)} MB (${(gzipBytes / 1024 / 1024).toFixed(2)} MB gzip)`);
