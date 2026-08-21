**Assets**

The shared header and footer use the supplied circular BK Sukkah Builders logo,
the public brand name “BK Sukkah,” and the header descriptor “Sukkah
Builders.”

- ☑ Profile photo
- ☑ Forest, cream, and wood color palette
- ☑ Supplied BK Sukkah Builders logo in the shared header, footer, and favicon
- ☑ Five illustrative sukkah images and one sukkah detail image
- ☑ Real sukkah hero photo approved for the homepage
- ☑ Real sukkah project photos selected from the owner's supplied photo folder
- ☐ Rental sukkah photos
- ☐ Custom sukkah photos
- ☑ Five supplied pergola project photos
- ☐ Tree-trimming before and after photos
- ☐ Eruv-work photos
- ☐ Photos of other team members, if they should appear on the site

The current sukkah images look illustrative, so the site labels them as examples
instead of completed customer projects. Missing photography keeps a fixed-size
"Photo coming soon" area so adding a real image later will not change the page
layout.

**Content decisions to confirm**

- The public brand is “BK Sukkah.” Personal references remain only on the
  About page and in approved testimonials.
- The Builds page uses the website's custom form for sukkahs the customer
  already owns. The former Google Form embed has been removed. Submit completed
  requests through the site's server-side Worker to the website-owned
  submissions database. Google Forms and Sheets must not be part of the
  submission storage path.
- Keep the homepage focused on a full-bleed hero, three primary sukkah paths
  with Builds first,
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
  and never appear on the website automatically. After storage, send a private
  email notification to `bkaysukkahbuilders@gmail.com` so the business knows a
  testimonial is waiting for review. Email delivery must remain separate from
  submission storage and must not require Google Forms, Sheets, or Apps Script.
- The protected owner dashboard lets the owner approve a pending testimonial,
  which publishes its name, optional organization, and testimonial text on the
  homepage. It also lets the owner disapprove a pending testimonial, which
  permanently deletes it. Approval records who approved the testimonial and
  when; private verification contact information is never returned by the
  public testimonials endpoint.
- Testimonial cards use an arrow-controlled carousel with a clipped viewport,
  no visible internal scrollbars, and keyboard/reduced-motion support. Until
  additional reviews are approved, any test card must be clearly labeled as a
  preview and must not read as a customer endorsement.
- The carousel shows one card on narrow screens and up to two cards side by
  side when the display is wide enough. Arrows and keyboard navigation move
  one card at a time, and the final card remains fully reachable.
- The compact homepage owner section uses the owner's profile photo and a short
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

/purchases

/custom-sukkahs

/pergolas

/tree-trimming

/eruv-work

/request/<published-form-slug>

The private owner route `/admin/` is also built by Astro, but it is not a public
navigation destination. The Worker must require a Sites-authenticated email on
the owner allowlist before returning the page or its data.

The dashboard combines Builds, Rentals, Buy, and Testimonials in responsive rows
that match the public site's forest, cream, and wood theme. It must support
source filtering, search, pagination, newest-first ordering, responsive detail
views, and per-source error states. Each row has View and Delete actions. Delete
must require a separate explicit confirmation, run only for an authenticated
allowlisted owner, remove the database entry, and remove associated uploaded
photos only after the database deletion succeeds. A database failure must show
a safe unavailable state without exposing private data or internal error
details. Google Forms, Google Sheets, service-account credentials, and Apps
Script must not be required by the finished backend. Database and storage
configuration must remain server-side and must never appear in generated
browser HTML or JavaScript.

Pending testimonial rows additionally show Approve and Disapprove actions.
Approve changes the record to `Approved` and makes its safe publication fields
available to the homepage. Disapprove uses the permanent-delete confirmation.
An approved testimonial can later be removed from the site by deleting it.

The Submissions tab includes an optional direct Google Sheets reporting export.
The owner can paste a Google Sheet URL, test and save the connection, and
export all non-testimonial submissions. The card must show whether the managed
Sheet is synced with the current dashboard records, including a clear warning
when requests are missing, old rows remain, or duplicate Submission IDs are
found. The Worker must keep Google credentials server-side, reject Testimonials
even if a client submits their ID, skip duplicate Submission IDs, create one
tab per saved form slug/title, sort tabs alphabetically, and keep rows in
chronological order. Google Sheets is a reporting destination only; D1 remains
the source of truth and Google Apps Script is not used.

The `/custom-sukkahs` route presents made-to-order sukka projects for families,
shuls, businesses, apartment buildings, and schools. It distinguishes custom
work from preset-size standard sukkas, without promising that every request is
feasible. Pricing remains quote-only. The primary action links to `/contact/`,
with the business phone number as a secondary option. Its closing primary
action opens the managed Custom Sukkah request at
`/request/custom-sukkah/`.

The `/pergolas` route uses the Custom Sukkahs portfolio template with five
approved pergola project photos. It explains ground connection and house
attachment choices, surfaces practical site considerations, and groups a wide
range of roof, shade, frame, siding, screening, artwork, lighting, and comfort
options in expandable cards. The primary action near the top and the closing
action both open the built-in Pergola request at `/request/?form=pergolas`.

The `/purchases` route is the customer-facing Buy flow. It uses the shared guided request renderer for customers who
want to buy a sukkah. It keeps the Rentals contact and location flow, replaces
rental takedown timing with a preferred delivery or setup date, and adds
purchase-specific choices for sukkah type, frame material, schach, lighting,
furniture, flooring, storage, and other additions. Purchase submissions are
stored in their own Buy dashboard category.

Tree Trimming, Eruv Work, and About use the same shared service shell and
navigation as the rest of the public site. Tree Trimming is text-first and
does not show photo placeholders; its copy explains trimming small branches,
large branches, or full trees when a sukkah site is not suitable. Eruv Work is
also text-first and explains working with highly qualified rabbonim. About is
intentionally compact: one owner photo, the approved BK Sukkah introduction,
short What We Do and Why Choose Us sections, a Get in Touch prompt, and two
clearly labeled counters for sukkahs built and years working. The counters
animate when visible and respect reduced-motion settings.

The protected owner dashboard includes a schema-driven form builder. An
allowlisted owner can create a form, edit its name, URL, introduction, submit
and success text, add/reorder/remove steps, and add/edit/duplicate/reorder/remove
questions. Supported customer controls are short text, email, phone, date,
paragraph, dropdown, single-choice cards, checkbox cards, and up to three site
photos. Option controls expose their choices in the editor.

For short text, email, phone, and paragraph fields, the owner can also edit or
add optional placeholder text. It is saved with the draft and published schema,
appears in the builder preview, and renders inside the live control without
replacing the accessible question label.

The editor supports one-level conditional follow-ups. The owner chooses a
source question and triggering answer; checkbox groups show the follow-up when
the selected answers include that value, while single-value fields use an
exact match. This covers the existing “Other” and checkbox-reveals-text
patterns without requiring code.

Every managed form has a private draft, live preview, explicit Publish action,
numbered published versions, and restorable version history. Draft edits must
never change the customer-facing form. Public and protected server routes
validate the complete definition, reject unsupported or duplicate fields and
invalid options or conditions, and enforce the published definition when a
customer submits. Saved submissions retain the form version and the label
shown with each answer so later edits do not damage earlier records.

The owner dashboard presents the form editor and submission manager as separate
tabs. The builder preview accepts the supported controls as a safe, unsent
interactive preview, including conditional follow-ups, and keeps the editor and
preview sections synchronized while the owner scrolls. The form chooser uses a
compact responsive card rail with hidden native scrollbars and accessible arrow
controls on small screens, while retaining a clear vertical list on desktop.

Custom-build service is limited to the New York, New Jersey, and Connecticut
tri-state area. This confirmed scope applies specifically to the
`/custom-sukkahs/` route and does not redefine the separate Builds or Rentals
request-form neighborhood choices.

The Sukkahs navigation group contains Builds, Rentals, Buy, Custom
Sukkahs, and Pergolas. The footer uses the same grouping. Public route paths remain
unchanged for saved links and search engines.

The shared footer includes a small Admin link to `/admin/` for the owner. It is
visually quiet but keyboard accessible, and the protected dashboard continues
to enforce owner authentication when the link is opened.

Use approved real project photos on the Custom Sukkahs page by default. The
page is a portfolio first: one large featured finished interior leads a
homepage-style desktop composition with two smaller projects beside it and two
balanced projects underneath. The gallery becomes one project per row on
phones. Project captions and compact tags connect the visible finished work to
its practical wall, schach, lighting, and site details. Do not use generic
stock photography or give isolated material samples the same visual weight as
a complete sukkah.

Finished-project and customization cards reuse the homepage service-card
language: white surfaces, shared borders and radii, generous image crops,
compact wood-colored labels, restrained shadows, and the same subtle lift and
image zoom on hover. Disable that motion when reduced motion is requested.

Keep material names general wherever the exact product is not confirmed by
Benyamin. Preserve the current valid wall, schach, addition, installation,
service-area, and custom-sizing information in compact secondary sections.
Wall, schach, and finishing choices use accessible inline disclosure cards;
their detailed text stays hidden until requested, and they do not resemble an
ecommerce catalog. Tarp availability, thickness, colors, and exact pricing are
confirmed during the quote.

The Custom Sukkahs hero uses the same centered, image-free service composition
as Builds and Rentals: left-aligned breadcrumb with a centered eyebrow, heading,
supporting copy, and the shared two-button request/explore action row on the
warm sukkah background. Project photography begins below the hero. The rest of
the page may remain more visual than the forms, but it uses the same shell,
section spacing, typography, button, surface, border, radius, accent, CTA, and
responsive systems.

Builds, Rentals, Buy, Custom Sukkah requests, and the generic request route use
the same responsive two-button hero treatment. The primary action scrolls to or
opens the relevant request form; the secondary action takes visitors to useful
service details or recent project examples. The Pergolas hero uses the same
component and destinations so every form-led service page has a consistent
start-or-explore choice.
The top of the Custom Sukkah request form displays: “Custom sukkah projects
start at $700. Final pricing is confirmed with BK Sukkah.”

The Pergolas page links to the managed request at `/request/?form=pergolas`.
When that form is selected, its top displays: “Custom pergola projects start at
$900. Final pricing is confirmed with BK Sukkah.”

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
schema-driven, native-styled form for work on a sukkah the customer already owns.
Its Submit button saves every enabled answer as a Build submission in the
website-owned database. Optional site photos are stored in the site's upload
storage and related to that database submission by stable file records.
The top of the Builds form displays an official starting-price notice:
“Projects start at $250. Final pricing is confirmed with BK Sukkah.” This is a
starting point only and does not replace the quote process.
Show a clear sending, animated success, or retry message beneath the button,
and disable nonessential motion for visitors who prefer reduced motion.

Builds uses the same guided-request design system and shared live renderer as
Rentals. Its six editable steps are Contact, Location, Timing, Requested work,
Your sukkah, and Review and send. Only one step is visible at a time on mobile
and desktop. The protected form builder can edit question text, field type,
options, conditional follow-ups, step order, and each section icon before a
new version is published. The icon picker shows the actual outlined artwork for
Person, Location pin, Calendar, Sukkah, Site / landscape, Checklist, Phone,
Home, Measurements, Tools, Message, and Photo.
Entered values and selected photos remain attached to the same form controls
while visitors move Back, Continue, or Edit a review row.

The progress row becomes sticky on phone-sized screens. Multi-column choices,
dates, and uploads must reflow before they can overflow. Native date controls
must be shrinkable and capped at 100% width so iOS Safari keeps them inside
the card. Labels and form text remain left-aligned for easy scanning. The approximate size uses one required
text input in the same format as Rentals, for example `10 × 12 ft`. Standard
editable controls and action targets remain at least 44 pixels tall on phones,
and phone text inputs use
16-pixel text so iPhone Safari does not zoom when a visitor focuses a field.
The final forest-colored action reads `Request a quote`, with a short
no-payment reassurance directly below it.

Every managed request form shows the same polished informational `Payment
options` panel at the end of its final review step before the primary submit
action. It lists Cash App, PayPal, Venmo, Zelle, Cash, Check, and Credit Card
with compact visual marks; Credit Card clearly states that a processing fee
applies. The panel does not contain selectable form controls and does not
change any submission contract. The reassurance below each submit button
continues to state that no payment is required when sending a request.

The `/sukkah-rentals` page uses the same schema-driven, site-styled rental
request form with the approved choices and stable field names. The owner can
edit its live draft in the protected dashboard. The site Worker validates each
request and saves it directly to the website-owned submissions database.

The rental form is a five-step guided request flow: Contact, Location, Timing,
Extras, and Review and send. Only one step is visible at a time on mobile and
desktop. A clear progress label and bar update with each step, Back and
Continue preserve entered values, and inline validation identifies the first
field that needs attention without using alert dialogs. Its Location step uses
the same responsive address layout as Builds; Street address, City, State, and
ZIP stack vertically on phone-sized screens.

Before the guided steps, the Rentals page shows a compact product summary with
a fixed-aspect-ratio image placeholder. It explains that the base package
includes a basic metal frame, standard schach, and canvas tarp styles, then
lists optional different-style lighting, furniture and chair choices, and
evergreen schach for an additional cost. The step progress fill uses the
site's solid gold accent.
Before the guided questions, the Rentals page displays a compact rental
overview with an example setup, representative tarp directions, and a short
included-versus-optional package summary. It states: “Rental packages start at
$250. Final pricing is confirmed with BK Sukkah.” The rental form then asks
the visitor to choose a tarp direction and continues with the contact and
request details.

Neighborhood uses a compact native select with a conditional Other field.
Rental setup and takedown timing use required native date pickers while keeping
the existing `buildDay` and `takeDownDay` field names during migration. The
Worker stores those calendar dates in normalized database fields.
Optional services are grouped separately from the required rental details;
lighting setup and extra labor are included in the default rental package.
The optional choices are different-style lighting, furniture, evergreen schach,
pressure washing, and Other. Takedown and Storage are not optional add-ons.
The final step shows a compact review with Edit actions before the `Request
availability` button. Selecting Furniture reveals a conditional required
details field asking which furniture and chairs are needed. When the visitor
does not enter a separate question, the database keeps that optional field
empty rather than creating a placeholder answer.

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

Requested work choices appear as Build, Take down, and Other. Storage handling
is part of the default service and is not presented as a separate choice.
Visitors may choose more than one of the available choices.

Both forms use a Location step titled `Where will the sukkah be?` with separate
fields for street address, city, state, and Zip code. State is a required
dropdown containing the 50 U.S. states and Washington, D.C. Neighborhood uses
the same compact select and shared option list on both forms, with a
conditional required text field when Other is selected. Choosing New Jersey or
Florida reveals a required location-details follow-up, and choosing Los Angeles
reveals a Los Angeles-area details follow-up. Requested work is kept in its own
Builds step instead of being mixed into Location.

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
Rentals offer different-style lighting, furniture, evergreen schach, and
pressure washing; Builds offer lighting and pressure washing. Both forms keep
their location follow-ups in the shared editable schema.

The shared Timing step owns the setup and takedown dates. These questions
remain editable through the form builder while their shared native controls and
validation stay in place.

The footer shows office hours as Sunday-Friday, 7:00 AM-10:00 PM, and states
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
  brand. Keep the Contact button in the sans-serif body family so it remains
  clearly actionable.
- Keep the Contact label medium-weight rather than bold. Use a small
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
  Contact item visually distinct as the filled action button.
- Desktop submenus use a flat rail attached to the header. Do not use a
  floating card, rounded dropdown container, or dropdown shadow.
