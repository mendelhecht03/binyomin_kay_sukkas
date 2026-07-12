# Site Architecture

This project is a static website. There is no build framework like React,
Next.js, or Vite. Each route is a normal `index.html` file inside a folder.

## Visual Map

```text
Visitor
  |
  v
Hosted Worker: index.mjs
  |
  +-- serves HTML routes
  |     +-- /                         -> index.html
  |     +-- /about/                   -> about/index.html
  |     +-- /contact/                 -> contact/index.html
  |     +-- /gallery/                 -> gallery/index.html
  |     +-- /sukkah-packages/         -> sukkah-packages/index.html
  |     +-- /sukkah-packages/buy/
  |     +-- /sukkah-packages/samples/level-1/
  |     +-- /sukkah-packages/samples/level-2/
  |     +-- /sukkah-packages/samples/level-3/
  |     +-- /sukkah-packages/samples/level-4/
  |     +-- /sukkah-packages/samples/level-5/
  |     +-- /sukkah-rentals/          -> sukkah-rentals/index.html
  |     +-- /custom-sukkahs/          -> custom-sukkahs/index.html
  |     +-- /pergolas/                -> pergolas/index.html
  |     +-- /tree-trimming/           -> tree-trimming/index.html
  |     +-- /eruv-work/               -> eruv-work/index.html
  |
  +-- serves shared files
        +-- styles.css
        +-- scripts/*.js
        +-- assets/images/*.jpg
```

## Folder Layout

```text
.
+-- index.html
+-- styles.css
+-- index.mjs
+-- about/
+-- contact/
+-- gallery/
+-- sukkah-packages/
|   +-- index.html
|   +-- buy/
|   +-- samples/
+-- sukkah-rentals/
+-- custom-sukkahs/
+-- pergolas/
+-- tree-trimming/
+-- eruv-work/
+-- docs/
|   +-- architecture.md
|   +-- requirements.md
+-- scripts/
|   +-- generate-static-worker.cjs
|   +-- main.js
|   +-- build-sukkah-form.js
|   +-- buy-form.js
|   +-- splide-carousel.js
+-- assets/
    +-- images/
```

## How Hosting Works

The deployed file is `index.mjs`. It is a generated Worker file that contains
the static site files encoded inside it.

The source file for generating it is:

```text
scripts/generate-static-worker.cjs
```

When you add or edit routes, run:

```powershell
node scripts\generate-static-worker.cjs
```

That script currently includes files ending in:

- `.html`
- `.css`
- `.js`
- `.jpg`

PNG images are intentionally not served by the Worker because large PNG files
previously pushed the Worker over the 10 MiB deployment limit. Use compressed
`.jpg` images for normal site photos.

## Styling

The site uses Bootstrap `5.3.8` from a CDN for standard layout, forms, buttons,
and responsive navbar behavior.

The custom visual theme lives in:

```text
styles.css
```

Use Bootstrap for common structure, then use `styles.css` only for the site's
brand feel, spacing, cards, gallery, carousel, and special page layouts.

## Navigation

The navigation is repeated in each HTML file because this is a static site with
no templating system yet.

When changing navigation links, update every HTML page that contains:

```html
<header class="site-header navbar navbar-expand-xl navbar-light">
```

The mobile hamburger is Bootstrap's standard navbar collapse behavior.

## Home Page

The home page is the `/` route in `index.html`. It is a normal scrolling page
with stacked sections for the hero, featured work, testimonials, about content,
and contact content. Do not create a separate `/home/` route unless the
navigation and architecture docs are updated at the same time.

## Deployment Checklist

1. Edit the HTML, CSS, JS, or image files.
2. If routes or architecture changed, update this `docs/architecture.md` file.
3. Run `node scripts\generate-static-worker.cjs`.
4. Test the Worker locally with Node or a local server.
5. Commit the changes.
6. Push the commit to the Sites source repository.
7. Save a new Sites version.
8. Deploy the saved version.
