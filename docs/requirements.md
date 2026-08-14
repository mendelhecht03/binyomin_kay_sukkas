**Assets**

- ☑ Profile photo
- ☑ Forest, cream, and wood color palette
- ☑ Supplied BK Sukkah Builder logo in the shared header, footer, and favicon
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
  requests through the site's server-side Worker to the dedicated `BKAY builds`
  Google Form. Keep the Google Form response URL and entry IDs out of browser
  markup.
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
- WhatsApp: +1 (347) 454-2282

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
work from preset-size standard sukkas, without promising that every request is
feasible. Pricing remains quote-only. The primary action links to `/contact/`,
with the business phone number as a secondary option.

The Sukkahs navigation group contains Builds, Rentals, Custom Sukkahs, and
Pergolas. The footer uses the same grouping. Public route paths remain
unchanged for saved links and search engines.

Use approved real project photos on the Custom Sukkahs page by default. The
page is a portfolio first: one large featured finished interior is followed by
a two-column desktop gallery of large completed or nearly completed projects,
which becomes one project per row on phones. Project captions and compact tags
connect the visible finished work to its practical wall, schach, lighting, and
site details. Do not use generic stock photography or give isolated material
samples the same visual weight as a complete sukkah.

Keep material names general wherever the exact product is not confirmed by
Benyamin. Preserve the current valid wall, schach, addition, installation,
service-area, and custom-sizing information in compact secondary sections.
Wall, schach, and finishing choices use accessible inline disclosure cards;
their detailed text stays hidden until requested, and they do not resemble an
ecommerce catalog. Tarp availability, thickness, colors, and exact pricing are
confirmed during the quote.

The Custom Sukkahs hero uses the same centered, image-free service composition
as Builds and Rentals: left-aligned breadcrumb with a centered eyebrow, heading,
and supporting copy on the shared warm sukkah background. It has no hero actions;
the quote and phone actions remain in the closing CTA. Project
photography begins below the hero. The rest of the page may remain more visual
than the forms, but it uses the same shell, section spacing, typography, button,
surface, border, radius, accent, CTA, and responsive systems.

Do not show a separate wood-versus-metal feature section. Keep porch and
flooring details concise and secondary to the project portfolio.

Treat porch and deck builds as site configurations rather than wall materials.
List porches, backyards, courtyards, and rooftops as the current site settings.
Offer flooring as an available furnishing or decor addition, but do not promise
a raised platform or structural floor until Benyamin confirms the scope of that
service.

Keep additions grouped as practical finishing touches, including lighting,
doors, gates, windows or clear panels, furniture, greenery, decor, and floor
coverings. Do not promise a raised platform or structural floor until that
scope is confirmed.

The former `/sukkah-packages` route and its old buy/sample routes redirect to
`/sukka-builder/` so saved links do not lead to a missing page.

The `/sukka-builder` route is labeled `Builds` and contains the website's
custom, native-styled form for work on a sukkah the customer already owns.
Its Submit button sends every enabled answer to the dedicated `BKAY builds`
Google Form. Optional site photos are stored in the site's upload storage, and
the matching Google Form response receives unlisted links to those files.
Show a clear sending, animated success, or retry message beneath the button,
and disable nonessential motion for visitors who prefer reduced motion.

Builds uses the same guided-request design system as Rentals. Its six steps are
Contact, Location, Timing, Requested work, Your sukkah, and Review and send. Only one
step is visible at a time on mobile and desktop. The form uses the shared
centered 850-pixel maximum width, progress bar, card, controls, Back and
Continue buttons, review rows, inline errors, and success treatment. The old
desktop process sidebar and redundant form introduction are not shown.
Entered values and selected photos remain attached to the same form controls
while visitors move Back, Continue, or Edit a review row.

The progress row becomes sticky on phone-sized screens. Multi-column choices,
dates, and uploads must reflow before they can overflow. Labels and form text
remain left-aligned for easy scanning. The approximate size uses one required
text input in the same format as Rentals, for example `10 × 12 ft`. Standard
editable controls and action targets remain at least 44 pixels tall on phones,
and phone text inputs use
16-pixel text so iPhone Safari does not zoom when a visitor focuses a field.
The final forest-colored action reads `Request a quote`, with a short
no-payment reassurance directly below it.

Both request forms show the same informational `Payment options` panel on the
final review step before the primary submit action. It lists Cash App, PayPal,
Venmo, Zelle, Cash, Check, and Credit Card. Credit Card clearly states that a
processing fee applies. The panel does not contain selectable form controls and
does not change either submission contract. The reassurance below each submit
button continues to state that no payment is required when sending a request.

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

Neighborhood uses a compact native select with a conditional Other field.
Rental setup and takedown timing use required native date pickers while keeping
the legacy `buildDay` and `takeDownDay` field names. The Worker forwards those
calendar dates through the existing Google Form questions' Other response.
Optional services are grouped separately from the required rental details;
Takedown and Storage are not optional add-ons because they are included in the
default rental package. The final step shows a compact review with Edit actions
before the `Request availability` button. Selecting Furniture reveals a
conditional required details field so the request identifies what furniture is
needed. When the visitor does not enter a
separate question, the browser supplies a neutral value for the legacy required
Google Form question.

The shared Location section accepts a site description and up to three optional
area photos on both forms. Each photo may be a JPG, PNG, or HEIC file and must
be no larger than 10 MB. Enforce these limits in both the browser and the
server-side Worker.

The shared Location section collects the approximate sukkah size in one text
field, using a format such as `10 × 12 ft`.

The visitor must choose exactly one sukkah type from a required dropdown.

The visitor may choose one or more schach types using a required checkbox
group.

The Contact step collects one required Name field and a required phone number,
followed by an optional email address. Pair the fields on desktop and stack them
vertically on phones.

Requested work choices appear as Bring out of storage, Build, Take down, Bring
to storage, and Other. Visitors may choose more than one.

Both forms use a Location step titled `Where will the sukkah be?` with separate
fields for street address, city, state, and Zip code. State is a required
dropdown containing the 50 U.S. states and Washington, D.C. Neighborhood uses
the same compact select and shared option list on both forms, with a
conditional required text field when Other is selected. Requested work is kept
in its own Builds step instead of being mixed into Location.

Size the ZIP Code field for the longest supported U.S. format, `12345-6789`.
Accept no more than 10 characters while continuing to support both five-digit
and ZIP+4 entries.

The Builds form assumes the visitor already owns a sukkah. It does not include
a purchase path or project-path selector. Visitors who need a new made-to-order
sukkah are directed to `/custom-sukkahs/`, while rental requests remain on
`/sukkah-rentals/`.

Both forms use the same `When do you need it?` Timing step with required native
setup and takedown date inputs. Builds keeps an optional Timing notes field, and
Rentals includes the same field. Builds' submitted setup date remains
`buildDate` for backend compatibility.

Both forms use the same neighborhood choices: Crown Heights, East Flatbush,
Remsen Village, Flatbush, Boro Park, Williamsburg, Park Slope, Manhattan,
Queens, Monsey, South Florida, and Los Angeles; New Haven is not listed.
Rentals offer lighting, furniture, and pressure washing; Builds offer lighting
and pressure washing. Both include an optional
`Extra service` checkbox with this helper text: `Check this if additional labor
beyond the standard scope is required (for example, a rooftop sukkah).` When
the visitor checks it, the form asks for required details.

Selecting Bring to storage in Builds' Requested work step reveals its required
date field. Limit that picker to the approved 30-day holiday window before
Sukkos, and hide and disable it when the service is not selected. The shared
Timing step always owns the setup and takedown dates.

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
