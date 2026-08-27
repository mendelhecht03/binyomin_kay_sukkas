import { readFile } from "node:fs/promises";
import path from "node:path";

const distDirectory = path.resolve("dist");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function fileForPath(pathname) {
  if (pathname === "/") return path.join(distDirectory, "index.html");
  const relativePath = pathname.replace(/^\//, "");
  return pathname.endsWith("/") ? path.join(distDirectory, relativePath, "index.html") : path.join(distDirectory, relativePath);
}

export function createStaticAssets() {
  return {
    async fetch(input) {
      const request = input instanceof Request ? input : new Request(input);
      const url = new URL(request.url);
      let file;
      try {
        file = await readFile(fileForPath(url.pathname));
      } catch {
        try {
          file = await readFile(path.join(distDirectory, "404.html"));
        } catch {
          return new Response("Not found", { status: 404 });
        }
        return new Response(request.method === "HEAD" ? null : file, {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      return new Response(request.method === "HEAD" ? null : file, {
        headers: { "Content-Type": contentTypes[path.extname(url.pathname).toLowerCase()] || "application/octet-stream" },
      });
    },
  };
}

export function withStaticAssets(env = {}) {
  return { ...env, ASSETS: createStaticAssets() };
}
