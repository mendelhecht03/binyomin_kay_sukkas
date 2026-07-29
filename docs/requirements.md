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
- Keep the homepage intentionally limited to four parts: a focused hero, the
  three primary sukkah paths, testimonials, and a compact owner introduction.
  Do not add process steps, decorative quotes, promotional blurbs, or extra
  homepage sections without approval.
- The testimonial section uses two image-led cards with a customer name and a
  short statement. Add only real, approved testimonials. Until customer photos
  and copy are supplied, retain clearly labeled placeholders rather than
  inventing endorsements.
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

The builder keeps a compact section-progress indicator visible while visitors
move through the form. On desktop it uses a left-side section list; on smaller
screens it becomes a narrow sticky status row so it does not crowd the fields.
Form sections use one consistent card, input, and selected-choice style.
On wide screens, all seven form-section cards use the same centered 720-pixel
maximum width, with their content arranged inside a centered 640-pixel column.
Labels and form text remain left-aligned for easy scanning. Multi-column
choices, dates, sliders, and uploads must reflow before they can overflow.
Use the same slim slider treatment for both estimated dimensions: a four-pixel
track, forest-colored progress, and a white circular thumb with a forest border.
Show each current measurement in a compact cream readout using the site's
old-style serif numerals and a small sans-serif unit. When the value changes,
use a brief directional pop for feedback and disable that motion when the
visitor prefers reduced motion. Place each readout centered beneath its slider
on desktop. At 700 pixels and below, place the readout beside its Width or
Length label with the slider on the following row.
Use a medium-weight system monospace font for the builder's Submit button. The
button must not move or scale on hover or press; pressing it should only darken
its green background slightly. Center the button within the form and place its
temporary submission-status note directly underneath it.
Keep standard text fields compact: approximately 36 pixels high on desktop,
40 pixels on small tablets, and 44 pixels on phone-sized screens. Use slightly
smaller field labels and input text on desktop. At 700 pixels and below, use
16-pixel text for editable controls so iPhone Safari does not zoom the page
when a visitor focuses a field. Radio and checkbox option cards use a 40-pixel
height in a two-column desktop grid and a one-column small-screen grid. Date
controls, uploads, and sliders retain their specialized touch-friendly sizes.
Hide the Timing notes placeholder at 700 pixels and below so the compact field
does not show clipped instructional text; keep its visible label.

Stack every address control vertically at all screen widths. The controls
should still reflect the expected answer length instead of filling the entire
form card. Street address, city, and state share one width; ZIP remains compact.

The `/sukkah-rentals` page embeds the client's published Google Form for rental
requests. Google Forms owns the questions, validation, submission behavior, and
response storage; those details are no longer implemented in the website code.

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
fields, followed by the visitor's phone number and email address. Stack all
four fields vertically in that order and give them the same width.

For visitors who already own a sukkah, requested work choices appear as Bring
out of storage, Build, Take down, Bring to storage, and Other. Visitors may
choose more than one. Hide and disable this group on the purchase path.

In the custom form, collect the project address under Location and Service
instead of Contact Details. The address uses separate fields for street
address, city, state, and ZIP code. State is a required dropdown containing the
50 U.S. states and Washington, D.C. Street address, city, and state use the
same full field width, while ZIP remains compact. The visitor must then
separately choose one required neighborhood from the mutually exclusive
radio-button list. Keep an Other option for neighborhoods outside the listed
service areas. Place the instruction "Enter the address where the sukkah will
be used." directly above the address fields without a visible address
subheading.

Size the ZIP Code field for the longest supported U.S. format, `12345-6789`.
Accept no more than 10 characters while continuing to support both five-digit
and ZIP+4 entries.

The first form card asks the visitor to choose one required project path:
I would like to buy or I already have a sukkah. Present the paths with the
reusable, accessible project-path selector. Each option includes a short
explanation, a visible radio indicator, and a warm selected state that uses the
site's forest and wood colors. Rental requests belong on the dedicated
`/sukkah-rentals` route and should not appear as a builder choice.

The selected path tailors later questions. The purchase path uses new-sukkah
wording, hides and disables Requested work, and asks for one preferred
installation date. The existing-sukkah path uses current-sukkah wording and
shows Requested work. Contact, location, site, and final-detail questions
remain common to both paths. Switching paths should preserve previously
entered values while excluding hidden controls from eventual form submission.

For an existing sukkah, selecting either Bring out of storage or Build reveals
one shared Timing card titled "When should we come?" If both are checked, show
only one card. Populate its Preferred day dropdown automatically from the
browser's Hebrew calendar with every civil date from Motzei Yom Kippur through
Erev Sukkos for the next upcoming Sukkos. Label the first and last options with
those holiday names and show weekday plus Gregorian date for every option.
Include an Other date option that reveals a required date field. Limit that
field to the inclusive range from 30 days before Sukkos through Erev Sukkos.
Use the device's native date picker on mobile and the site's themed flatpickr
calendar on desktop.

Selecting Take down or Bring to storage reveals the same Timing card with that
service's own required dropdown. If both are checked, keep one card and show
two clearly labeled dropdowns. List the same holiday-window dates in reverse
order, from Erev Sukkos back through Motzei Yom Kippur. Each dropdown includes
its own Other date option and date field with the same 30-day limit. Use the
Choices.js CDN component for these holiday-window dropdowns. Hide and disable
the Timing card when no triggering Requested work option is selected.

When the purchase path is selected, show a required question titled "How would
you like to receive your sukkah?" immediately below the project-path selector.
Present two radio options: "I’ll pick it up" and "Please deliver it to me." Hide
and disable this question on the existing-sukkah path so its value is excluded
from eventual form submission.

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
