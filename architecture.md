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
  |     +-- /home/                    -> home/index.html
  |     +-- /about/                   -> about/index.html
  |     +-- /contact/                 -> contact/index.html
  |     +-- /gallery/                 -> gallery/index.html
  |     +-- /services/                -> services/index.html
  |     +-- /services/sukka-packages/ -> services/sukka-packages/index.html
  |     +-- /services/sukka-packages/buy/
  |     +-- /services/sukka-packages/samples/level-1/
  |     +-- /services/sukka-packages/samples/level-2/
  |     +-- /services/sukka-packages/samples/level-3/
  |     +-- /services/sukka-packages/samples/level-4/
  |     +-- /services/sukka-packages/samples/level-5/
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
+-- architecture.md
+-- about/
+-- contact/
+-- gallery/
+-- home/
+-- services/
|   +-- index.html
|   +-- sukkah-packages/
|       +-- index.html
|       +-- buy/
|       +-- samples/
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

## Deployment Checklist

1. Edit the HTML, CSS, JS, or image files.
2. If routes or architecture changed, update this `architecture.md` file.
3. Run `node scripts\generate-static-worker.cjs`.
4. Test the Worker locally with Node or a local server.
5. Commit the changes.
6. Push the commit to the Sites source repository.
7. Save a new Sites version.
8. Deploy the saved version.
