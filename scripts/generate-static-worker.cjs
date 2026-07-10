const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const filesToServe = [
  "index.html",
  "styles.css",
  "about/index.html",
  "contact/index.html",
  "home/index.html",
  "services/index.html",
  "services/sukka-packages/index.html",
  "services/sukka-packages/buy/index.html",
  "services/sukka-packages/samples/level-1/index.html",
  "services/sukka-packages/samples/level-2/index.html",
  "services/sukka-packages/samples/level-3/index.html",
  "services/sukka-packages/samples/level-4/index.html",
  "services/sukka-packages/samples/level-5/index.html",
  "scripts/build-sukkah-form.js",
  "scripts/buy-form.js",
  "scripts/buy-request.js",
  "scripts/main.js",
  "scripts/splide-carousel.js",
  "assets/images/profile-photo1.png",
  "assets/images/sample-sukka1.png",
  "assets/images/sample-sukka2.png",
  "assets/images/sample-sukka3.png",
  "assets/images/sample-sukka4.png",
  "assets/images/sample-sukka5.png",
  "assets/images/sukka-background.png",
];

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};

function routeForFile(filePath) {
  const route = `/${filePath.replace(/\\/g, "/")}`;

  if (route.endsWith("/index.html")) {
    return route.slice(0, -"index.html".length);
  }

  return route;
}

const records = filesToServe.map((filePath) => {
  const absolutePath = path.join(rootDir, filePath);
  const extension = path.extname(filePath);

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
      return new Response("Not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
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

fs.writeFileSync(path.join(rootDir, "index.mjs"), workerSource);
