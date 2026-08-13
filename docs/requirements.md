**Assets**

- ☑ Profile photo
- ☑ Forest, cream, and wood color palette
- ☑ Simple code-based brand mark and favicon
- ☑ Five illustrative sukkah images and one sukkah detail image
- ☑ Real sukkah hero photo approved for the homepage
- ☑ Real sukkah project photos selected from the owner's supplied photo folder
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
- The Builds page uses the website's custom form for sukkahs the customer
  already owns. The former Google Form embed has been removed. Submit completed
  requests to the private Google Sheet
  through the site's server-side Worker and a protected Google Apps Script
  webhook. Keep Google credentials and the webhook secret out of browser code.
- Keep the homepage focused on a full-bleed hero, three primary sukkah paths,
  an image-led real-work section, a compact owner introduction, testimonials,
  and a final contact prompt.
- Style the homepage as one light, spacious page using the existing forest
  palette with wood accents. Give each section a distinct composition through
  real photography, spacing, and restrained tactile states rather than extra
  promotional copy. Do not use AI-generated images.
- The testimonial section shows only genuine, approved testimonials. It also
  includes a compact submission form that collects the reviewer's name,
  organization, private verification contact, testimonial, and publication
  consent. New submissions are stored privately with `Pending review` status
  and never appear on the website automatically.
- Testimonial cards use an arrow-controlled carousel with a clipped viewport,
  no visible internal scrollbars, and keyboard/reduced-motion support. Until
  additional reviews are approved, any test card must be clearly labeled as a
  preview and must not read as a customer endorsement.
- The compact homepage owner section uses Benyamin's profile photo and a short
  editable company-history statement. Keep the full biography on `/about/`.

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

/sukka-builder

/sukkah-rentals

/custom-sukkahs

/pergolas

/tree-trimming

/eruv-work

The `/custom-sukkahs` route presents made-to-order sukka projects for families,
shuls, businesses, apartment buildings, and schools. It distinguishes custom
work from preset-size standard metal sukkas, without promising that every
request is feasible. The page may describe wood or metal frames, confirmed wall
and schach choices, available features, the confirmed project services, and the
current service-area list. Pricing remains quote-only. The primary action links
to `/contact/`, with the business phone number as a secondary option.

The Sukkahs navigation group contains Builds, Rentals, Custom Sukkahs, and
Pergolas. The footer uses the same grouping. Public route paths remain
unchanged for saved links and search engines.

Use approved real project photos on the Custom Sukkahs page by default. The
confirmed photo subjects currently cover blue, white, and beige tarp walls,
soft fabric walls, framed plywood walls, a light framed infill-panel
finishes, rooftop horizontal paneling, horizontal slat siding, a porch build,
and a carpeted floor covering, plus supplied bamboo sticks, bamboo mats, and
evergreen schach photos. Keep material names general wherever the exact product
is not confirmed by Benyamin.

Show one supplied tarp example in the unified wall and siding gallery, labeled
"Tarp walls". Keep the fabric, panel, and custom siding examples in the same
gallery rather than dividing them into separate subcategory sections. State
beneath the full gallery: "Tarp walls come in varying thicknesses and colors.
Exact options and pricing are confirmed during the quote." On mobile, turn the
gallery into a horizontal scroll-snap slider with compact, uniform cards so
visitors can swipe through every option without seeing oversized images.

Keep the siding section titled "Siding." with the short note, "Contact us for
current availability." Style both the Siding and Schach sections as contained
editorial chapters that match the frame section: dark serif headings, the
light page background, real photography, restrained dividers, and consistent
spacing. Do not use large gold headings or separate full-width tinted bands for
these sections. Use the supplied real photo for the wood lattice panel option
and do not label it as an illustrative rendering. Reframe the horizontal slat
siding photo with a right-anchored crop so the worker is not centered in the
card.

Add a Schach section using the same equal-card gallery and mobile swipe behavior
as the siding section. Show three supplied examples in this order: "Bamboo
sticks", "Bamboo mats", and "Evergreen". Keep the heading "Schach." and use a
short availability note rather than promising specific materials or pricing.

Do not show the redundant horizontal rooftop paneling card or a separate
"More than the walls" project-options section. Keep porch and flooring details
in the concise details list instead.

Treat porch and deck builds as site configurations rather than wall materials.
List porches, backyards, courtyards, and rooftops as the current site settings.
Offer flooring as an available furnishing or decor addition, but do not promise
a raised platform or structural floor until Benyamin confirms the scope of that
service.

Keep the details section limited to two groups: "Available additions" and
"Furnishings and decor". Do not show a separate special-request group. Instead,
include a short link inviting visitors to contact the business about other
customization options.

The former `/sukkah-packages` route and its old buy/sample routes redirect to
`/sukka-builder/` so saved links do not lead to a missing page.

The `/sukka-builder` route is labeled `Builds` and contains the website's
custom, native-styled form for work on a sukkah the customer already owns.
Its Submit button sends every enabled answer to the private Builds
Submissions Google Sheet. Optional site photos are stored in the site's upload
storage, and the matching Sheet row receives unlisted links to those files.
Show a clear sending, animated success, or retry message beneath the button,
and disable nonessential motion for visitors who prefer reduced motion.

Builds uses the same guided-request design system as Rentals. Its six steps are
Contact, Location, Your sukkah, The site, Timing, and Review and send. Only one
step is visible at a time on mobile and desktop. The form uses the shared
centered 850-pixel maximum width, progress bar, card, controls, Back and
Continue buttons, review rows, inline errors, and success treatment. The old
desktop process sidebar and redundant form introduction are not shown.
Entered values and selected photos remain attached to the same form controls
while visitors move Back, Continue, or Edit a review row.

The progress row becomes sticky on phone-sized screens. Multi-column choices,
dates, sliders, and uploads must reflow before they can overflow. Labels and
form text remain left-aligned for easy scanning.
Use the same slim slider treatment for both estimated dimensions: a four-pixel
track, forest-colored progress, and a white circular thumb with a forest border.
Show each current measurement in a compact cream readout using the site's
old-style serif numerals and a small sans-serif unit. When the value changes,
use a brief directional pop for feedback and disable that motion when the
visitor prefers reduced motion. Display each current measurement in the same
compact control as its label and slider. Standard editable controls and action
targets remain at least 44 pixels tall on phones, and phone text inputs use
16-pixel text so iPhone Safari does not zoom when a visitor focuses a field.
The final forest-colored action reads `Request a quote`, with a short
no-payment reassurance directly below it.

The `/sukkah-rentals` page uses a custom, site-styled rental request form rather
than an embedded Google Form. It preserves the questions, required fields, and
choices from the client's published `BK Sukkah rentals` form. The site Worker
validates each request and forwards it server-side to that Google Form so the
client's existing response destination remains unchanged.

The rental form is a five-step guided request flow: Contact, Location, Timing,
Extras, and Review and send. Only one step is visible at a time on mobile and
desktop. A clear progress label and bar update with each step, Back and
Continue preserve entered values, and inline validation identifies the first
field that needs attention without using alert dialogs.

Before the guided steps, the Rentals page shows a compact product summary with
a fixed-aspect-ratio image placeholder. Its approved description is: "Comes
with a basic metal frame with a variety of canvas tarps to choose from." The
step progress fill uses the site's solid gold accent.

Neighborhood and timing questions use compact native selects with conditional
Other fields. Optional services are grouped separately from the required
rental details. The final step shows a compact review with Edit actions before
the `Request availability` button. The browser preserves the original rental
field names and posts the same data contract to the Worker; when the visitor
does not enter a separate question, the browser supplies a neutral value for
the legacy required Google Form question.

The Site Details section accepts up to three optional area photos. Each photo
may be a JPG, PNG, or HEIC file and must be no larger than 10 MB. Enforce these
limits in both the browser and the server-side Worker.

The custom form collects estimated sukkah width and length with separate
sliders. Each slider ranges from 0 to 30 feet and shows its current value.

The visitor must choose exactly one sukkah type. Sukkah-type choices use a
required, mutually exclusive radio-button group.

The visitor must also choose exactly one schach type using a required,
mutually exclusive radio-button group.

The Contact step collects first name and last name in separate required fields,
followed by the visitor's phone number and email address. Pair the fields on
desktop and stack them vertically on phones.

Requested work choices appear as Bring out of storage, Build, Take down, Bring
to storage, and Other. Visitors may choose more than one.

In the custom form, collect the project address in the Location step. The
address uses separate fields for street address, city, state, and ZIP code.
State is a required dropdown containing the 50 U.S. states and Washington,
D.C. Neighborhood uses the same compact select pattern as Rentals, with a
conditional required text field when Other is selected. Requested work is a
multi-select checkbox-card group in this same step.

Size the ZIP Code field for the longest supported U.S. format, `12345-6789`.
Accept no more than 10 characters while continuing to support both five-digit
and ZIP+4 entries.

The Builds form assumes the visitor already owns a sukkah. It does not include
a purchase path or project-path selector. Visitors who need a new made-to-order
sukkah are directed to `/custom-sukkahs/`, while rental requests remain on
`/sukkah-rentals/`.

The Builds form always asks `When would you like it installed?` and uses a
required date picker. Its submitted field remains `buildDate` for backend
compatibility.

Both forms list Los Angeles among the neighborhood choices. Both include the
same add-on choices and an optional `Extra service` checkbox with this helper
text: `Check this if additional labor beyond the standard scope is required
(for example, a rooftop sukkah).` When the visitor checks it, the form asks
for required details.

Selecting Take down or Bring to storage reveals that service's own required
dropdown within the Timing card. If both are checked, show
two clearly labeled dropdowns. List the same holiday-window dates in reverse
order, from Erev Sukkos back through Motzei Yom Kippur. Each dropdown includes
its own Other date option and date field with the same 30-day limit. Use the
Choices.js CDN component for these holiday-window dropdowns. Hide and disable
the service-specific dropdowns when the matching work is not selected.

The footer shows office hours as Sunday-Friday, 7:00 AM-7:00 PM, and states
that the business is closed on Erev Yom Kippur, Motzei Yom Kippur, and Erev
Sukkos.

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

- Use the site's old-style serif heading family for normal navigation and
  dropdown labels so the header feels consistent with the heritage craft
  brand. Keep the Request a Quote button in the sans-serif body family so it
  remains clearly actionable.
- Keep the Request a Quote label medium-weight rather than bold. Use a small
  northeast arrow that moves slightly on pointer hover and keyboard focus as
  directional feedback. Respect reduced-motion preferences.
- On desktop, the Sukkahs menu opens on pointer hover or keyboard focus. Tree
  Trimming and Eruv Work remain direct links in the primary navigation.
- On phones and tablets, the Sukkahs menu opens when tapped.
- On phones and tablets, navigation uses a full-height panel. The close button,
  Escape key, and selecting a link close the panel and its expanded nested menus.
- The mobile navigation panel and the nested Sukkahs menu open and close with
  smooth motion. Respect the visitor's reduced-motion preference.
- Normal navigation links use an animated gold underline for hover, focus, and
  the active page. Do not place them on filled green backgrounds; keep the
  Request a Quote item visually distinct as the filled action button.
- Desktop submenus use a flat rail attached to the header. Do not use a
  floating card, rounded dropdown container, or dropdown shadow.
