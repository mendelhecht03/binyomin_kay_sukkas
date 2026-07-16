import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  redirects: {
    "/sukkah-packages/": "/sukka-builder/",
    "/sukkah-packages/buy/": "/sukka-builder/",
    "/sukkah-packages/samples/level-1/": "/sukka-builder/",
    "/sukkah-packages/samples/level-2/": "/sukka-builder/",
    "/sukkah-packages/samples/level-3/": "/sukka-builder/",
    "/sukkah-packages/samples/level-4/": "/sukka-builder/",
    "/sukkah-packages/samples/level-5/": "/sukka-builder/",
  },
  build: {
    format: "directory",
  },
});
