const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

function resolveRequestPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const cleanPath = path
    .normalize(decodedPath)
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");

  let filePath = path.join(rootDir, cleanPath);

  if (decodedPath.endsWith("/") || cleanPath === "") {
    filePath = path.join(filePath, "index.html");
  }

  if (!path.extname(filePath)) {
    filePath = path.join(filePath, "index.html");
  }

  return filePath;
}

function sendResponse(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": statusCode === 200 ? "public, max-age=60" : "no-store",
  });
  response.end(body);
}

function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/sukkah-quote") {
    sendResponse(
      response,
      200,
      JSON.stringify({ ok: true, message: "Quote calculation backend will be added later." }),
      contentTypes[".json"],
    );
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendResponse(response, 405, "Method not allowed", "text/plain; charset=utf-8");
    return;
  }

  const filePath = resolveRequestPath(requestUrl.pathname);
  const relativePath = path.relative(rootDir, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendResponse(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      sendResponse(response, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }

    const contentType = contentTypes[path.extname(filePath)] || "application/octet-stream";
    sendResponse(response, 200, request.method === "HEAD" ? "" : file, contentType);
  });
}

http.createServer(handleRequest).listen(port, () => {
  console.log(`Benyamin Kay Sukkas preview running on port ${port}`);
});
