**Assets**

- ☑ Profile photo
- ☑ Forest, cream, and wood color palette
- ☑ Simple code-based brand mark and favicon
- ☑ Five illustrative sukkah images and one sukkah detail image
- ☐ Real completed-sukkah hero photo or video
- ☐ Real sukkah project photos with confirmed descriptions
- ☐ Rental sukkah photos
- ☐ Custom sukkah photos
- ☐ Pergola photos
- ☐ Tree-trimming before and after photos
- ☐ Eruv-work photos
- ☐ Photos of other team members, if they should appear on the site

The current sukkah images look illustrative, so the site labels them as examples
instead of completed customer projects. Missing photography keeps a fixed-size
"Photo coming soon" area so adding a real image later will not change the page
layout.

**Content decisions to confirm**

- The existing public name, "Benyamin Kay Sukkas," is kept for now. Confirm
  whether "Benyamin" or "Binyomin" is the intended spelling before launch.
- The Sukka Builder uses the website's custom form. The former Google Form
  embed has been removed. Keep submission disabled and clearly explained until
  supported form and photo-upload backends are selected.
- Add only real, approved testimonials. The old sample testimonials were removed.

**Contact information**
- Email: bkaysukkahbuilders@gmail.com
- Phone: (347) 454-2282
- Instagram: @bkaysukkahbuilders
- WhatsApp: +1 (669) 290-9004

See `docs/client-information.md` for the confirmed client-information reference
and the remaining details that need confirmation.

The contact page shows each method as a full-width link. The message form opens
the visitor's email app with their message filled in.

**Routes**

The Astro redesign must keep all of these public routes available. Pages are
built as directory-style files, so `/about` is represented by
`dist/about/index.html` and is normally linked as `/about/`.

/

/about

/contact

/gallery

/sukka-builder

/sukkah-rentals

/custom-sukkahs

/pergolas

/tree-trimming

/eruv-work

The former `/sukkah-packages` route and its old buy/sample routes redirect to
`/sukka-builder/` so saved links do not lead to a missing page.

The `/sukka-builder` route contains the website's custom, native-styled form.
Its submission is intentionally disabled until supported form and upload
backends are selected.

The `/sukkah-rentals` page uses only the primary Ask about rentals action in
its hero and omits the generic What to share section.

The `/gallery` route temporarily shows a branded under-construction page while
the client prepares approved project photography. Replace it with the completed
gallery later without changing the public route.

The Site Details section accepts up to three optional area photos. Each photo
may be a JPG, PNG, or HEIC file and must be no larger than 10 MB.

The custom form collects estimated sukkah width and length with separate
sliders. Each slider ranges from 0 to 30 feet and shows its current value.

The visitor must choose exactly one sukkah type. Sukkah-type choices use a
required, mutually exclusive radio-button group.

The visitor must also choose exactly one schach type using a required,
mutually exclusive radio-button group.

The contact section collects first name and last name in separate required
fields, followed by the visitor's phone number and email address.

Requested work choices include Bring out of storage, Bring to storage, Build,
Take down, and Other. Visitors may choose more than one.

In the custom form, collect the project address under Location and Service
instead of Contact Details. The address uses separate fields for street
address, optional apartment or unit, city, two-letter state abbreviation, and
ZIP code. The visitor must then separately choose one required neighborhood
from the mutually exclusive radio-button list. Keep an Other option for
neighborhoods outside the listed service areas.

**Build requirements**

- Use Astro's static output. The website does not need server-side rendering.
- Use directory-format pages and trailing-slash links.
- Keep shared navigation in an Astro component so every page stays
  consistent.
- Keep editable website code in `src/`.
- Keep fixed-URL images and other unchanged assets in `public/`.
- Treat `dist/` as generated output: build it with Astro and do not edit or
  commit it.
- Generate the deployable root `index.mjs` from `dist/` after every production
  build.

**Navigation behavior**

- On desktop, the Sukkahs and Other Services menus open on pointer hover or
  keyboard focus.
- On phones and tablets, those menus open when tapped.
- On phones and tablets, tapping or moving keyboard focus outside an open
  navigation panel closes the panel and its expanded nested menus.
- The mobile navigation panel and both nested service menus open and close with
  smooth motion. Respect the visitor's reduced-motion preference.
- Normal navigation links use an animated gold underline for hover, focus, and
  the active page. Do not place them on filled green backgrounds; keep the
  Request a Quote item visually distinct as the filled action button.
- Desktop submenus use a flat rail attached to the header. Do not use a
  floating card, rounded dropdown container, or dropdown shadow.
