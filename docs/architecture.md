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

`/sukka-builder/` uses the custom, site-styled form. The former Google Form
embed and temporary `/sukka-builder-alt/` comparison route have been removed.
The form submits to the site's Worker, which validates the request, stores
optional site photos, and sends the row data to a private Google Sheet through
a small Google Apps Script webhook.

`/sukkah-rentals/` contains a custom form that mirrors the questions in the
client's existing rental Google Form. The browser posts to
`/api/rental-submissions`; the Worker validates the values and forwards them to
Google Forms from the server. Keeping Google Forms field IDs in the Worker
avoids exposing the integration in page markup, but those IDs must be updated
if a Google Form question is deleted and recreated.

The builder's desktop date fields use Flatpickr 4.6.13 loaded from jsDelivr.
Mobile browsers retain their native date picker. The original inputs continue
to store dates in `YYYY-MM-DD` format for a future submission backend.

The custom builder places the project address in its location and service
section. The address is a normal required text input that the visitor fills in
manually. A separate required radio group records exactly one neighborhood,
with an Other option for locations outside the listed service areas. The page
does not load a third-party address service.

## Sukka Builder

The `/sukka-builder/` page contains the custom form directly. Visitors can
select up to three optional area photos, with a 10 MB limit for each photo.

The form uses this flow:

```text
Browser form
    |
    | multipart POST /api/sukkah-submissions
    v
Sites Worker
    |-- validates required fields and photo limits
    |-- stores photo files in the SUBMISSION_PHOTOS R2 binding
    `-- sends text fields and photo links to Google Apps Script
                                      |
                                      v
                         Private Google Sheet row
```

The Google Sheet stores answers and private, unlisted links to the uploaded
photos. Photo bytes do not go inside spreadsheet cells.

Two production environment values are required:

```text
SUKKAH_SHEETS_WEBHOOK_URL
SUKKAH_SHEETS_WEBHOOK_SECRET
```

The webhook secret is stored only in the Sites environment and Google Apps
Script properties. Do not place it in source control. The Apps Script source
template and setup notes are in `integrations/google-apps-script/`.

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

The Worker handles the live builder endpoint:

```text
POST /api/sukkah-submissions
GET  /api/sukkah-submission-photos/<unlisted-photo-key>
```

The POST endpoint accepts the custom builder's form data. It validates required
fields and photo limits, stores photos in R2, and forwards a normalized JSON
record to the Google Sheet webhook. If the Sheet write fails, newly uploaded
photos from that request are removed so partial submissions are not left
behind.

The Worker also preserves the existing placeholder endpoint:

```text
POST /api/sukkah-quote
```

This endpoint returns a sample JSON response. It does not calculate, store, or
send a quote. Astro remains a static page builder; the generated Worker owns the
small amount of server-side submission logic.

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
Worker-only API endpoints.

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
