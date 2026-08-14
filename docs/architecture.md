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
optional site photos, and forwards every answer to the dedicated `BKAY builds`
Google Form from the server.

`/sukkah-rentals/` contains a custom form that mirrors the questions in the
client's existing rental Google Form. The browser posts to
`/api/rental-submissions`; the Worker validates the values and forwards them to
Google Forms from the server. Keeping Google Forms field IDs in the Worker
avoids exposing the integration in page markup, but those IDs must be updated
if a Google Form question is deleted and recreated. The page presents those
fields as a client-side five-step flow with local step navigation, inline
validation, conditional Other inputs, optional site photos, timing notes, and a
final review. Step changes do not send requests or replace form controls, so
entered values remain in the form until the final submission.

The rental UI collects setup and takedown with native date inputs under the
legacy `buildDay` and `takeDownDay` names. Because the existing Google Form
questions contain weekday choices plus Other, the Worker validates each ISO
date and sends it as that question's Other response. This preserves the current
Google response destination without exposing or replacing its field IDs.

Both forms use the same native date controls and timing presentation. Dates are
stored in `YYYY-MM-DD` format, and the Builds form keeps its optional timing
notes. The Builds-only Bring-to-storage date remains in Requested work and is
limited to the approved holiday window.

Builds and Rentals share one Location layout: street address, city, state, ZIP,
neighborhood, approximate size, a site description, and an optional photo card.
The two pages import the same neighborhood and state option data. Visitors fill
the address manually; the page does not load a third-party address service.

## Builds

The `/sukka-builder/` route keeps its existing URL but is labeled `Builds` in
the interface. It is intended for sukkahs the customer already owns and no
longer has a purchase-path selector. The page contains the custom form
directly. Visitors can select up to three optional area photos, with a 10 MB
limit for each photo.

Builds and Rentals import `src/styles/guided-request-form.css` for the shared
progress, card, fields, choice controls, navigation, review, validation, and
success presentation. Builds adds only the controls unique to its request,
including the sukkah-type and schach choices, the photo picker, and the
Bring-to-storage date. The Builds form is a client-side six-step flow:
Contact, Location, Timing, Requested work, Your sukkah, and Review and send.
Step navigation changes which existing form section is visible without
replacing controls or submitting, so values and selected files remain in place
until the final request.

The form uses this flow:

```text
Browser form
    |
    | multipart POST /api/sukkah-submissions
    v
Sites Worker
    |-- validates required fields and photo limits
    |-- stores photo files in the SUBMISSION_PHOTOS R2 binding
    `-- sends text fields and photo links to BKAY builds Google Form
                                      |
                                      v
                         Dedicated Builds response
```

The dedicated Google Form stores answers and private, unlisted links to the uploaded
photos. Photo bytes do not go inside spreadsheet cells.

Homepage testimonial submissions use the same protected Apps Script webhook
but include `type: testimonialSubmission`. Apps Script writes them to a
separate `Testimonials` tab, creates that tab and its header on first use, and
stores every new entry with `Pending review` status. The browser posts to
`/api/testimonial-submissions`; there is no automatic publication path. After
the row is stored, Apps Script uses `MailApp` to notify
`bkaysukkahbuilders@gmail.com`. A temporary
`TESTIMONIAL_NOTIFICATION_EMAIL` Script property can override that recipient
for delivery testing; deleting the property restores the business address.
Notification failure is logged without discarding the safely stored review.

Rental add-ons, furniture details, timing notes, photo links, and extra-service
details are appended to the existing Google Form comments answer so the data
reaches the current rental response sheet without requiring new Google Form
field IDs. Neighborhoods that are not native choices in the older Google Form
are forwarded through that question's `Other` response.

Two production environment values remain required for testimonial submissions:

```text
SUKKAH_SHEETS_WEBHOOK_URL
SUKKAH_SHEETS_WEBHOOK_SECRET
```

Builds submissions no longer depend on the Apps Script webhook. The
`SUBMISSION_PHOTOS` R2 binding is required for Builds submissions and
for Rentals submissions that include photos.

The webhook secret is stored only in the Sites environment and Google Apps
Script properties. Do not place it in source control. The Apps Script source
template and setup notes are in `integrations/google-apps-script/`.

## Shared Page Structure

Navigation and other repeated markup belong in reusable Astro components and
layouts. Changing a shared component updates every page that uses it during
the next build. This replaces the old system where the same navbar HTML had to
be copied into every page.

`src/components/Header.astro` owns the shared Sukkahs menu, direct Tree
Trimming and Eruv Work links, active-page states, and responsive menu behavior.
The desktop Sukkahs menu opens as a flat rail attached to the header. At tablet
and phone sizes, its links move into a full-height panel. The page body becomes
temporarily inert while that panel is open so keyboard focus stays inside the
navigation.

`src/components/VisualOptionCard.astro` owns the repeated photo, heading, and
description surface used by the Custom Sukkahs Siding and Schach grids. Both
sections pass content into the same component so their image ratio, borders,
radius, and spacing stay synchronized across breakpoints.

## Worker Generation

`scripts/generate-static-worker.cjs` reads only the completed static files in
the `dist/` folder.
It does not scan `src/`, `node_modules/`, or old root HTML files. Each built
file is encoded into `index.mjs` with its route and content type.

The Worker handles the live builder endpoint:

```text
POST /api/sukkah-submissions
POST /api/rental-submissions
POST /api/testimonial-submissions
GET  /api/sukkah-submission-photos/<unlisted-photo-key>
GET  /api/admin/submissions
```

The POST endpoints accept the builder and rental form data. They validate
required fields and photo limits, store selected photos in R2, and forward the
Builds and Rentals answers to their existing Google Forms. Testimonial entries
continue through the protected Apps Script webhook into the Testimonials Sheet.
If the downstream write fails, newly uploaded photos from that request are
removed so partial submissions are not left behind.

The Worker also preserves the existing placeholder endpoint:

```text
POST /api/sukkah-quote
```

This endpoint returns a sample JSON response. It does not calculate, store, or
send a quote. Astro remains a static page builder; the generated Worker owns the
small amount of server-side submission logic.

## Owner dashboard

The owner dashboard is a protected website route at `/admin/`. Its browser code
never talks to Google directly. It requests normalized data from the private
`GET /api/admin/submissions` Worker endpoint instead.

Sites supplies the signed-in user's email in a trusted request header. The
Worker compares that email with `DASHBOARD_ADMIN_EMAILS` before returning the
page or any data. A missing allowlist fails closed. Signed-out visitors are sent
to the Sites sign-in route, and signed-in accounts that are not on the allowlist
receive a forbidden response.

After authorization, the Worker obtains a short-lived Google OAuth token from a
service account. It uses only read-only Google Forms and Google Sheets scopes:

- Builds and Rentals are read from their private Google Form editor IDs through
  the Google Forms API. Google requires the service account to be shared as a
  Form editor to expose responses; read-only OAuth scopes still prevent edits.
- Testimonials are read from the existing private `Testimonials` tab through
  the Google Sheets API.
- Form metadata is mapped by stable question ID, normalized into one dashboard
  model, and sent to the UI without exposing Google credentials or source IDs.

Each source is isolated. If one Google source is unavailable, the dashboard
returns the other sources plus a clear per-source error. Results are paginated,
searchable, newest first, and always returned with private, no-store headers.
The dashboard is deliberately read-only; approval or editing still happens in
the existing Google Forms and Sheets.

The Apps Script project is not part of the dashboard read path. It remains a
small write-only bridge for testimonial storage and notification email. The
three existing customer submission pipelines and R2 photo storage are therefore
independent of dashboard availability.

Detailed setup, required environment variables, and field-discovery steps live
in `docs/owner-dashboard.md`.

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
