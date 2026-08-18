function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function normalizePath(pathname) {
  let routePath = decodeURIComponent(pathname);
  if (!routePath.startsWith("/")) routePath = `/${routePath}`;
  if (routePath.endsWith("/")) return routePath;
  const lastSegment = routePath.split("/").pop() || "";
  return lastSegment.includes(".") ? routePath : `${routePath}/`;
}

export function createStaticFileService(records) {
  const files = new Map(records.map((file) => [file.path, file]));
  return {
    get(pathname) {
      return files.get(normalizePath(pathname));
    },
    response(file, method = "GET", status = 200) {
      return new Response(method === "HEAD" ? null : base64ToBytes(file.body), {
        status,
        headers: {
          "Content-Type": file.contentType,
          "Cache-Control": "public, max-age=60",
        },
      });
    },
    notFound(method = "GET") {
      const page = files.get("/404.html");
      return new Response(method === "HEAD" || !page ? null : base64ToBytes(page.body), {
        status: 404,
        headers: {
          "Content-Type": page?.contentType || "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
      });
    },
  };
}
