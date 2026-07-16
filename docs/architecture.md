# Site Architecture

This project uses Astro to build a static website. "Static" means Astro turns
the source files into normal HTML, CSS, JavaScript, and image files before the
site is deployed. A server does not need to assemble each page when a visitor
opens it.

## Build and Hosting Flow

```text
Astro source files
  src/ and public/
        |
        | npm run build:site
        v
Static website
  dist/
        |
        | npm run build:worker
        v
Hosted Worker
  index.mjs and dist/server/index.js
```

The hosted Sites project deploys the generated Worker from
`dist/server/index.js`. The same generated code is also kept in the root
`index.mjs` file for source history and compatibility. Astro creates the static
site first, and `scripts/generate-static-worker.cjs` packages the finished files
into both Worker files.

## Important Folders

```text
.
+-- astro.config.mjs
+-- package.json
+-- index.mjs                 generated Worker copy kept in source history
+-- src/
|   +-- pages/                one Astro page for each public route
|   +-- components/           reusable page pieces such as navigation
|   +-- layouts/              shared page structure
+-- public/
|   +-- assets/               files copied without changing their URLs
+-- dist/                     temporary build and deployment package
+-- scripts/
|   +-- generate-static-worker.cjs
+-- docs/
    +-- architecture.md
    +-- requirements.md
```

The three main folders have different jobs:

- `src/` contains the Astro pages, components, layouts, styles, and JavaScript
  that developers edit.
- `public/` contains files that should keep a fixed public URL. For example,
  `public/assets/images/photo.jpg` becomes `/assets/images/photo.jpg`.
- `dist/` is created by Astro. Do not edit it by hand because the next build
  replaces it. It is ignored by Git.

## Public Routes

Astro builds these routes as directory-style HTML files. For example,
`/about/` is built as `dist/about/index.html`.

```text
/
/about/
/contact/
/gallery/
/sukka-builder/
/sukka-builder-alt/
/sukkah-rentals/
/custom-sukkahs/
/pergolas/
/tree-trimming/
/eruv-work/
```

The configuration uses static output, directory-format pages, and trailing
slashes. The Worker also keeps the previous convenience behavior where a URL
without a trailing slash, such as `/about`, can load the `/about/` page.

The former package overview, buy, and sample URLs are generated as compatibility
redirect pages that send visitors to `/sukka-builder/`.

`/sukka-builder-alt/` is a temporary comparison page that recreates the Google
Form fields as a custom, site-styled form. It is a visual prototype only and
does not send or save submissions.

The custom comparison form places the project address in its location and
service section. It reads `PUBLIC_GOOGLE_MAPS_API_KEY` during the Astro build.
When the key is configured, Google Places upgrades the address field with US
address suggestions and stores the formatted address selected by the visitor.
Without the key, the field remains a normal required address input and can use
addresses saved in the visitor's browser.

The Google Cloud project must have Maps JavaScript API and Places API (New)
enabled. The browser key must be restricted to those APIs and to the deployed
website domains. Copy `.env.example` to `.env` for local development; never
commit the real key.

## Sukka Builder

The `/sukka-builder/` page embeds the official BKAY Google Form. Google controls
the questions, responses, authentication, and optional file upload. The page
also includes a direct link to the full Google Form because Google may require
visitors to sign in or leave the iframe to upload a file.

The form is not recreated as a custom HTML form. Posting directly to Google's
internal `entry.*` fields is undocumented and cannot reliably support the
form's authenticated file-upload question.

## Shared Page Structure

Navigation and other repeated markup belong in reusable Astro components and
layouts. Changing a shared component updates every page that uses it during
the next build. This replaces the old system where the same navbar HTML had to
be copied into every page.

## Worker Generation

`scripts/generate-static-worker.cjs` reads only the completed static files in
the `dist/` folder.
It does not scan `src/`, `node_modules/`, or old root HTML files. Each built
file is encoded into `index.mjs` with its route and content type.

The Worker preserves the existing placeholder endpoint:

```text
POST /api/sukkah-quote
```

This endpoint returns a sample JSON response. It does not yet calculate,
store, or send a quote. Astro is being used as a static builder, so a real form
backend should remain separate from the Astro pages.

Requests for a missing page use Astro's generated `404.html` while keeping the
correct HTTP `404` status. This gives visitors a useful way back to the site
instead of a plain error message.

Photos should use compressed, size-conscious formats. The generated Worker
prints both its normal size and compressed size after each build so deployment
growth is easier to notice.

## Commands

Install dependencies once after cloning the project:

```powershell
npm install
```

Start Astro's local development server:

```powershell
npm run dev
```

Build both the static site and the deployable Worker:

```powershell
npm run build
```

The full build runs these two steps in order:

1. `npm run build:site` creates `dist/`.
2. `npm run build:worker` reads `dist/`, regenerates `index.mjs`, and creates
   `dist/server/index.js` plus the hosting metadata required for deployment.

`npm run preview` previews the static Astro output. It does not reproduce the
Worker-only `POST /api/sukkah-quote` behavior.

## Deployment Checklist

1. Run `npm install` when dependencies have changed.
2. Run `npm run build`.
3. Test all public routes on phone and desktop sizes.
4. Check the reported generated Worker size.
5. Update this file when routes, folders, or hosting behavior change.
6. Commit the Astro source, lockfile, and regenerated `index.mjs`.
7. Push the commit to the Sites source repository.
8. Save a new Sites version and deploy it.

`dist/` and `node_modules/` are local build folders and should not be
committed. `index.mjs` must remain committed because it is the Sites deployment
artifact.
