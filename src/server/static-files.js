export function normalizePath(pathname) {
  let routePath = decodeURIComponent(pathname);
  if (!routePath.startsWith("/")) routePath = `/${routePath}`;
  if (routePath.endsWith("/")) return routePath;
  const lastSegment = routePath.split("/").pop() || "";
  return lastSegment.includes(".") ? routePath : `${routePath}/`;
}

export function createStaticFileService(assets) {
  return {
    async response(request, pathname) {
      if (!assets || typeof assets.fetch !== "function") {
        return new Response("Static assets binding is not configured", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const assetUrl = new URL(request.url);
      assetUrl.pathname = normalizePath(pathname);
      return assets.fetch(new Request(assetUrl.toString(), request));
    },
  };
}
