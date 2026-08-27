const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "dist");

if (!fs.existsSync(outputDir) || !fs.statSync(outputDir).isDirectory()) {
  throw new Error("The dist directory is missing. Run `npm run build:site` before generating the Worker.");
}

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
const workerSource = `${runtimeBundle}\nexport default BKayWorker.createWorker();\n`;

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
console.log(`Generated Worker: ${(bytes / 1024).toFixed(1)} KB (static assets deploy separately from dist/)`);
