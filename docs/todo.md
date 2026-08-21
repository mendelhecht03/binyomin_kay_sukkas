# Project Todo List

This file tracks planned work for the Benyamin Kay website.

The open tasks below were organized from the July 30, 2026 voice-note
transcripts in `website-feedback/TRANSCRIPTS.md`.

## How we use this list

- This file is Codex's default project work queue. If the user asks to continue
  or work on the next website task without naming one, Codex follows the task
  selection order below.
- A specific current request from the user overrides the queue order.
- **Now** contains the task currently being worked on.
- **Next** contains the most important upcoming tasks.
- **Later** contains good ideas that are not urgent.
- **Waiting** contains tasks blocked by a decision, information, or outside action.
- A task is moved to **Completed** only after it has been implemented and checked.
- Each task should describe what "done" means so it is easy to verify.

### Default task selection order

1. Continue the single task in **Now**, if one exists.
2. Otherwise, start the first actionable task in **Next**.
3. Skip anything whose required information or approval is in **Waiting**.
4. Use **Later** only when **Next** has no actionable work or the user chooses a
   Later task directly.

Before implementation begins, move the selected task to **Now**. When it has
been implemented and checked, move it to **Completed** with the completion date
and a short description of the result. If it becomes blocked, move it to
**Waiting** and record exactly what is missing.

The queue controls work order. It does not turn unconfirmed ideas into approved
website facts. Confirmed requirements belong in `docs/requirements.md`, and
architecture or hosting decisions belong in `docs/architecture.md`.

When adding a task, use this format:

```text
- [ ] Short task name
  - Why: Why this matters.
  - Done when: A specific result that can be checked.
```

## Now

(No active task.)

## Next

- [ ] Explain convertible roof and schach options
  - Why: Customers should understand whether a structure can use schach for
    Sukkos and a regular roof at other times of the year.
  - Done when: The exact system has been confirmed with Benyamin and a clear,
    accurate explanation has been added to the Custom Sukkahs page.

- [ ] Replace testimonial placeholders with genuine customer reviews
  - Why: The homepage now shows one approved review from Friendship Circle
    Brooklyn and still needs at least one more approved customer story.
  - Done when: At least two genuine reviews have written publication approval
    and appear on the homepage. Do not write or publish fabricated or
    AI-generated customer reviews.

- [ ] Update the service-area list
  - Why: The requested location list has changed.
  - Include: Remove New Haven and make the list easy to edit
    when the service area changes again.
  - Done when: Benyamin approves the complete list and every location shown on
    the website matches it.

## Later

- [ ] Strengthen the About page with approved business history
  - Why: The requested About copy includes customer-volume, worldwide-service,
    and company-relationship claims that could build trust if they are accurate.
  - Include only after verification: The number of customers served, the areas
    served, and the exact nature of work involving Sukkah Depot, Sukkah Store,
    Sukkah Center, or other named companies.
  - Done when: Every public claim is accurate, approved, and worded so it does
    not imply a partnership or endorsement that does not exist.

## Waiting

- [ ] Replace the testimonial email notification without Google Apps Script
  - Ready: Testimonial submissions are stored safely in D1 with `Pending
    review` status and appear in the protected dashboard.
  - Waiting for: Selection and setup of a transactional email sender with an
    approved From address. Resend is the recommended simple option. Until then,
    the database and dashboard work but the private notification email is not
    sent by the new backend.

- [ ] Receive and label real custom-sukkah project photos
  - Received: Examples of blue, white, and beige tarp walls,
    cloth walls, framed plywood walls, a light framed infill panel,
    rooftop horizontal paneling, horizontal slat siding, a porch build, and a
    carpeted floor covering are now used on the Custom Sukkahs page.
  - Waiting for: Benyamin to confirm the exact names and materials listed in
    the terminology task below, and identify any additional project photos
    approved for future use.

- [ ] Confirm custom wall, siding, and flooring terminology
  - Ask Benyamin for: the beige tarp material, thickness, and weather rating;
    the product name and substrate of the light framed infill panel; the
    material used for the rooftop
    horizontal paneling; and the material used for the reddish-brown
    horizontal slat siding.
  - Also confirm: whether the lattice-panel photo matches an option B. Kay
    offers, and whether custom flooring means floor coverings only or can
    include a raised platform or structural floor.
  - Until confirmed: Keep all public labels visual and descriptive rather than
    claiming a specific material or product line.

- [ ] Receive tarp examples and product details
  - Waiting for: Photos or screenshots of available tarp styles, plus their
    materials, thicknesses, colors, and whether each option is normally stocked
    or special-order.
  - Unblocks: The Custom Sukkahs and Rentals page updates.

- [ ] Receive rental sizes and price ranges
  - Waiting for: An approved list of rental sizes, what each price includes,
    price ranges, add-on prices, and any conditions that affect the final cost.
  - Unblocks: The Rentals page update.

- [ ] Confirm the future direction of rentals
  - Waiting for: Benyamin to decide whether the rental offering should be
    promoted now or remain on the back burner while the service is revised.
  - Unblocks: Final rental-page structure and navigation emphasis.

- [ ] Verify About-page claims and company-name permissions
  - Waiting for: Confirmation of customer counts, worldwide work, and whether
    each named company can be publicly described as a partner or collaborator.
  - Unblocks: The expanded About-page credibility section.

- [ ] Confirm the complete service-area list
  - Waiting for: A final location list after removing New Haven, including
    whether locations mean permanent service areas or selected projects only.
  - Unblocks: The service-area update.

- [ ] Receive additional approved testimonials
  - Waiting for: The exact public wording and attribution for at least two more
    genuine customer testimonials.
  - Unblocks: Publishing multiple testimonial cards in the homepage scroller.

## Completed

- [x] Reorganize the shared navigation groups (2026-08-21)
  - Result: Builds, Rentals, Buy, Custom Sukkahs, and Pergolas are now direct
    main-nav links. Tree Trimming and Eruv Work live in an accessible Other
    dropdown on desktop and mobile. Added regression coverage, verified both
    layouts, and passed all 29 tests; deployment remains deferred.

- [x] Enhance the freestanding pergola project photo (2026-08-21)
  - Result: Added a 1448×1086 AI-enhanced JPEG sibling asset, kept the original
    588×441 source untouched, and updated the Pergolas card to use the sharper
    version. The site build and automated tests passed; deployment remains
    deferred.

- [x] Fix Pergolas project-card rendering at tablet widths (2026-08-21)
  - Result: Made project media boxes explicit, removed the compact card's
    intrinsic-height overflow, and stacked media and copy into separate rows at
    tablet widths. Verified the cards at the reported narrow viewport and
    passed all 29 tests; deployment remains deferred.

- [x] Move the Rentals form behind a dedicated overview page (2026-08-21)
  - Result: `/sukkah-rentals/` is now an overview-only page with the package description first, a large rental photo underneath, a tarp gallery, and a button to `/request/?form=rentals`. The guided form remains available on that separate route. All 29 tests passed; deployment remains deferred.

- [x] Remove the square logo background in the footer (2026-08-21)
  - Result: Added circular clipping to the shared footer logo so the supplied artwork shows as a round mark against the existing background without altering the logo file. All 29 tests passed; deployment remains deferred.

- [x] Align the primary navigation button typography (2026-08-21)
  - Result: The filled Contact action now uses the shared heading typeface with a balanced size and weight, while retaining its filled button treatment and arrow interaction. Updated the navigation requirements and passed all 29 tests; deployment remains deferred.

- [x] Restore the previous header descriptor (2026-08-21)
  - Result: Restored “Sukkas & Outdoor Work” in the shared header while keeping the BK Sukkah name and logo. Updated the requirements and architecture notes and added a homepage regression check. All 29 tests passed; deployment remains deferred.

- [x] Add Contact to the shared navigation (2026-08-21)
  - Result: The shared header now labels its existing `/contact/` action as Contact, with active-state styling on desktop and mobile. Added a homepage regression check; all 29 tests passed and deployment remains deferred.

- [x] Remove the rental photo placeholder (2026-08-21)
  - Result: Removed the obsolete rental placeholder configuration and added a regression check confirming the public rental page keeps its overview without the unfinished photo block. Passed all 29 tests; deployment remains deferred.

- [x] Make testimonials responsive to display width (2026-08-21)
  - Result: The homepage carousel shows one testimonial on narrow screens and up to two side by side on wider screens. Arrows and keyboard navigation move one card at a time, and the final card remains reachable. All 29 tests passed; deployment remains deferred.

- [x] Fix mobile photo-upload layout (2026-08-21)
  - Result: The dynamic photo field now uses a single-column mobile layout with
    shrinkable content, keeping its label, helper text, and file picker inside
    the card. Passed all 29 automated tests; deployment remains deferred.

- [x] Remove default storage choices from Builds (2026-08-21)
  - Result: Removed Bring out of storage and Bring to storage from the Builds
    Requested work choices, removed the related date follow-up and validation,
    and updated the requirements and architecture notes. Passed all 29 tests;
    deployment remains deferred.

- [x] Fix the mobile testimonial consent control (2026-08-21)
  - Result: Reset the consent checkbox's inherited full-input sizing so it stays
    compact, keeps native focus and accent behavior, and aligns cleanly with
    the consent copy on narrow screens. The production build and all 29
    automated tests pass; deployment remains deferred.

- [x] Verify Builds is first in the homepage service cards (2026-08-21)
  - Result: Confirmed the homepage service-card markup presents the Builds link
    first, before Custom Sukkahs and Rentals. Added regression coverage for the
    rendered homepage order; deployment remains deferred.

- [x] Add uniform request-page hero actions (2026-08-21)
  - Result: Added one shared responsive start-or-explore action row to Builds,
    Rentals, Buy, Custom Sukkah requests, the generic request route, Custom
    Sukkahs, and Pergolas. Each primary action targets the relevant form and
    each secondary action opens useful details or recent projects. Verified in
    the production build and automated test suite; deployment remains deferred.

- [x] Add a compact rental overview before the Rentals form (2026-08-21)
  - Result: Added a compact rental introduction with an example setup photo,
    four representative tarp directions, included-versus-optional package
    details, and a $250 starting-price caveat. Rentals now asks visitors to
    choose a tarp direction in the guided form after the overview. Passed all
    28 automated tests; deployment remains deferred.

- [x] Refresh the accepted-payment panel on every request form (2026-08-21)
  - Result: Reworked the shared payment panel into a branded card with compact
    visual marks, clearer hierarchy, responsive tiles, and the Credit Card
    processing-fee note. It is now appended after the final review fields on
    every managed form, including Buy, Custom Sukkah, and Pergolas. Passed all
    28 automated tests; deployment remains deferred.

- [x] Add the Buy request form and navigation entry (2026-08-21)
  - Result: Added the built-in `purchases` schema and `/purchases/` page using
    the shared renderer, with purchase-specific delivery, sukkah, frame,
    schach, furniture, flooring, storage, and other-option questions. Buy
    submissions are stored in a dedicated `purchase` dashboard category, and
    the shared header, footer, and dashboard use the customer-facing name
    “Buy.” Passed all 28 automated tests; deployment remains deferred.

- [x] Add official starting-price notices to the request forms (2026-08-21)
  - Result: Added consistent notices for Builds ($250), Rentals ($250 overview), Custom
    Sukkah ($700), and Custom Pergolas ($900), each stating that final pricing
    is confirmed with BK Sukkah. The generic request route selects its notice
    from the active form slug. Passed all 27 automated tests; deployment is
    intentionally deferred until the remaining queued prompts are complete.

- [x] Update remaining public brand references to BK Sukkah (2026-08-21)
  - Result: Updated public page copy, shared branding, form confirmations,
    contact text, documentation, and hosted site metadata to BK Sukkah while
    preserving About-page and testimonial personal references. Passed all 27
    automated tests and verified the live pages and form endpoints.

- [x] Correct the BK Sukkah Builders logo label (2026-08-21)
  - Result: Updated the circular logo artwork so its bottom label reads
    “BUILDERS,” rebuilt the Worker, passed all 27 automated tests, and verified
    the corrected asset and 10:00 PM office hours on the live site.

- [x] Update office hours to 10:00 PM (2026-08-21)
  - Result: Updated the shared footer and requirements so Sunday-Friday hours
    now read 7:00 AM-10:00 PM, passed all 27 automated tests, and published
    the change to the live site.

- [x] Publish the BK Sukkahs content and form refresh (2026-08-21)
  - Result: Published the BK Sukkahs branding, compact About page and approved
    business copy, Builds-first homepage, tightened service pages, rental
    add-on and location follow-up changes, responsive form fixes, testimonial
    rendering, and optimized photo bundle. Confirmed the public routes, live
    form schemas, testimonial endpoint, and production deployment all respond
    successfully.

- [x] Simplify Google Sheets submission syncing feedback (2026-08-19)
  - Result: Removed redundant per-row Add to Sheet actions and kept the
    all-request export as the single export flow. Added a live sync indicator
    that compares managed Sheet Submission IDs with current non-testimonial
    dashboard records and flags missing, stale, or duplicate rows. Updated the
    documentation, added sync-status coverage, passed all 27 automated tests,
    and published the dashboard update.

- [x] Add direct Google Sheets exports and audit the admin workspace (2026-08-19)
  - Result: Added protected direct Google Sheets settings, connection testing,
    and all-or-one submission exports without Google Apps Script. Exports use
    alphabetized form tabs, chronological rows, stable IDs, duplicate
    protection, and clear dashboard status feedback; testimonials are always
    excluded. Also fixed critical admin audit issues around conditional
    follow-ups, dynamic contact fields, database errors, published-form links,
    accessible controls, and the live-preview choice-control outline.

- [x] Improve the admin builder workspace (2026-08-19)
  - Added accessible Form builder and Submissions tabs, an interactive preview
    with conditional-field testing and linked section scrolling, and a sleek
    responsive card rail for choosing forms.

- [x] Expand the visual section icon picker (2026-08-18)
  - Result: Replaced the text-only section icon select with a keyboard-friendly
    visual picker that shows each outlined icon. Added Phone, Home,
    Measurements, Tools, Message, and Photo choices while preserving all older
    icon values. The expanded icons render in the live form renderer, and the
    published build plus all 22 automated tests passed.

- [x] Add editable placeholder text to form fields (2026-08-18)
  - Result: Added an optional Placeholder text control to the owner builder for
    short text, email, phone, and paragraph fields. Draft previews show the
    value, and the saved schema already flows through to the live form without
    changing its accessible labels. Existing placeholders remain intact; the
    published build and all 22 automated tests passed.

- [x] Add a small Admin link to the shared footer (2026-08-18)
  - Result: Added a discreet, keyboard-accessible Admin pill beside the
    Request a quote link in the shared footer. It points to the protected
    `/admin/` dashboard, appears across shared-layout pages, and is included in
    the published site. The full build and all 22 automated tests passed.

- [x] Fix live forms, responsive layouts, and testimonial sizing (2026-08-18)
  - Result: Published the protected, versioned owner builder against the live
    Builds, Rentals, and Custom Sukkah forms. The owner can edit supported
    questions, choices, conditions, order, required state, and section icons;
    save drafts; publish versions; and restore earlier versions. Builds and
    Rentals now share the same responsive Location layout, native date inputs
    stay inside their cards on iOS-sized screens, and the approved testimonial
    card sizes to its content instead of stretching. Production checks passed
    for all three public forms and the homepage, and all 22 automated tests
    passed.

- [x] Deploy and verify the database-backed site (2026-08-17)
  - Result: Published the clean D1/R2 backend, protected dashboard, permanent
    deletion, testimonial approval and public-display workflow, and the refined
    Custom Sukkahs portfolio. Confirmed the live homepage and public testimonial
    endpoint respond successfully, signed-out dashboard requests redirect to
    sign-in, the D1 schema is live with an empty submissions table, and both
    approved owner emails are active. Removed every obsolete Google runtime
    setting after verification.

- [x] Add testimonial approval controls to the owner dashboard (2026-08-17)
  - Result: Added authenticated Approve and Disapprove actions for pending
    testimonials. Approval records the owner and approval time and publishes
    only the reviewer's consented public fields on the homepage; disapproval
    permanently deletes the record. Removed the temporary testimonial preview,
    generated the D1 migration, updated the documentation, and passed all 17
    automated tests.

- [x] Replace Google Forms and Sheets with a website-owned submissions database (2026-08-17)
  - Result: Added a Sites D1 relational schema and versioned migration, a shared
    prepared-query repository, a reusable form registry, and D1-backed create,
    search, pagination, dashboard read, and permanent-delete flows. Builds,
    Rentals, and Testimonials now use the database directly, while R2 keeps
    photo bytes and D1 keeps their relational metadata. Removed the Google
    Forms, Sheets, service-account, and Apps Script runtime code and settings.
    The site and Worker build successfully and all 14 database-focused tests
    pass.

- [x] Refactor the backend and redesign the owner dashboard (2026-08-17)
  - Result: Moved routing, form validation, Google integrations, R2 photo
    handling, dashboard behavior, and static-file serving out of the generated
    Worker script into focused source modules. Rebuilt the owner dashboard with
    the public site's forest-and-cream theme, accessible responsive rows,
    search and source filters, details, and explicit permanent-delete
    confirmation. Added the protected delete bridge and photo cleanup, updated
    project documentation, passed all 17 automated tests, and verified the
    dashboard and homepage in the browser at desktop and phone widths.
  - Superseded: The routing and dashboard presentation remain useful, but this
    version incorrectly preserved Google Forms and Sheets as storage. The
    corrective database-backed refactor is now the active task.

- [x] Publish and verify the owner dashboard (2026-08-13)
  - Result: Published the protected `/admin/` dashboard with read-only Builds,
    Rentals, and Testimonials data, search, filters, details, pagination, and
    isolated source-status handling. Fixed Cloudflare's required `fetch`
    runtime binding, passed all 14 automated tests, and verified the live owner
    sign-in, all three Google sources, detail view, signed-out redirect, and
    unauthorized API response without changing the existing submission paths.

- [x] Restore the original header branding (2026-08-13)
  - Result: Restored the original drawn icon and Benyamin Kay wordmark in the
    shared header, kept the supplied circular BK logo in the footer, and
    adjusted the footer logo's size and alignment. Production and responsive
    browser checks passed.

- [x] Apply the August 13 Custom Sukkahs project annotations (2026-08-13)
  - Result: Updated the finished-project names, frame, wall, schach, and site
    labels to match the photographed work. Limited the Custom Sukkahs service
    area to New York, New Jersey, and Connecticut, while leaving the separate
    Builds and Rentals location choices unchanged. The production build and
    desktop and phone browser checks passed with no horizontal overflow.

- [x] Email new testimonial submissions (2026-08-13)
  - Result: The testimonial bridge now saves each review privately with
    `Pending review` status and emails a private notification. Google mail
    permission was approved, Apps Script version 2 was deployed, and a labeled
    live website test reached `mendelhecht16@gmail.com`. The temporary test
    recipient was then removed, so future notifications use the built-in
    `bkaysukkahbuilders@gmail.com` address without sending it a test message.

- [x] Connect Builds to a separate Google Form and publish the new logo (2026-08-13)
  - Result: Created and published a brand-new `BKAY builds` Google Form without
    changing the earlier form. The live Builds Worker now sends every form
    answer and photo link to the new form, and a clearly labeled integration
    test appeared there successfully. Replaced the old code-drawn logo with
    the supplied optimized artwork in the shared header, footer, and favicon,
    verified desktop and mobile layouts, and deployed the combined update.

- [x] Align Builds and Rentals request-form sections (2026-08-13)
  - Result: Builds and Rentals now share the same Contact, Location, native-date
    Timing, neighborhood, site-description, photo-upload, and timing-notes
    patterns. Builds keeps Requested work separate and its site details live in
    Location. The Worker accepts the shared fields and keeps Google Forms/photo
    submission handling intact. Production build and browser checks passed.

- [x] Match email input sizing across request forms (2026-08-13)
  - Result: Both Contact sections now use the same 640px email-field width on
    desktop and the same responsive grid behavior on smaller screens.
    Production build and browser checks passed.

- [x] Match the Builds timing form to Rentals
  - Matched the Builds timing step to the Rentals date-field grid, with
    installation, take-down, and bring-to-storage dates sharing the same clear
    presentation and responsive behavior.
  - Kept conditional dates hidden and disabled unless their service is chosen,
    preserved the existing submission names, and retained the approved
    holiday-window limits.
  - Completed: 2026-08-13

- [x] Apply the August 13 Rentals and Builds form annotations
  - Updated the WhatsApp number, removed California from service-area choices,
    removed the requested add-ons, simplified Builds sizing, changed Sukkah type
    to a dropdown, changed Schach to multi-select checkboxes, and replaced the
    conditional date dropdowns with readable date pickers.
  - Kept California in the address state dropdown, updated the submission
    mapping and project documentation, and verified the forms at desktop and
    mobile widths.
  - Completed: 2026-08-13

- [x] Ask what furniture is needed when Furniture is selected on Rentals
  - Added a conditional required details field, included the answer in the
    existing Google Form comments response, and documented the behavior.
  - Verified the prompt, validation, review summary, clearing behavior, and
    Worker payload with the local rental form at desktop width.
  - Completed: 2026-08-13

- [x] Apply the Custom Sukkahs hero and siding annotations
  - Removed both hero actions, changed the heading to "Choose your siding.",
    applied the requested supporting copy, and removed the Tarp walls
    description without rendering an empty paragraph.
  - Verified equal card heights, desktop and phone hero spacing, zero page
    overflow, and the complete production build. Added a retry for transient
    Windows locks when the build rewrites generated Worker files.
  - Completed: 2026-08-13

- [x] Align the Custom Sukkahs page with the shared service design system
  - Rebuilt the page with the shared service shell, centered image-free hero,
    section spacing, typography, buttons, warm surfaces, green process panel,
    compact chips, and dark quote CTA used across Builds and Rentals.
  - Added one reusable image-option card for the responsive Siding and Schach
    grids while preserving the existing project information and photography.
  - Verified all images, mobile and desktop layouts, 50-pixel action targets,
    zero page overflow, and the complete production site and Worker build.
  - Completed: 2026-08-13

- [x] Use rental date pickers and correct the default-package add-ons
  - Replaced both timing dropdowns with required calendar date inputs while
    preserving their existing submission field names. Removed Takedown and
    Storage from optional add-ons because they are included by default.
  - Verified responsive layout, inline date validation, readable review dates,
    Google Form Other-response mapping, invalid-date rejection, and the full
    production site and Worker build.
  - Completed: 2026-08-13

- [x] Add the confirmed payment methods to both request forms
  - Added one reusable informational panel to the final Rentals and Builds
    steps. It lists Cash App, PayPal, Venmo, Zelle, Cash, Check, and Credit Card
    with a visible processing-fee note, without asking visitors to select a
    method or changing either form submission.
  - Verified the shared panel at phone and desktop widths with no horizontal
    overflow and confirmed the production site and Worker build successfully.
  - Completed: 2026-08-13

- [x] Convert the Builds request into the shared guided-form system
  - Replaced the sidebar and full-page form stack with Contact, Location, Your
    sukkah, The site, Timing, and Review and send steps. Reused the Rentals
    progress, card, controls, validation, navigation, review, and success styles
    through a shared stylesheet while preserving the Builds field names,
    service logic, sliders, conditional dates, photo limits, and Worker route.
  - Verified Back/Edit state retention, conditional fields, review output, and
    responsive layouts at phone, tablet, and desktop widths. The production
    build passed, and direct Worker tests accepted and stored a valid mock JPEG
    while rejecting incomplete conditional answers.
  - Completed: 2026-08-13

- [x] Add the confirmed rental summary and refine the request page
  - Removed the hero trust card, changed the guided-form progress fill to the
    solid gold site accent, and added a compact metal-frame and canvas-tarp
    summary with a fixed 4:3 photo placeholder.
  - Verified the production build and the updated composition at 927-pixel
    desktop and 390-pixel phone widths with no horizontal page overflow.
  - Completed: 2026-08-12

- [x] Convert the Sukkah Rentals request into a guided five-step form
  - Reorganized the existing fields into Contact, Location, Timing, Extras,
    and Review and send. Added clear progress, Back and Continue controls,
    compact selectors, conditional fields, inline validation, a review summary,
    a request-focused final CTA, and Rentals-specific mobile footer spacing.
    Preserved the Worker endpoint and original server field names.
  - Completed: 2026-08-12

- [x] Remove the Sukkah Rentals trust card
  - Removed the optional trust notice from the Rentals hero and cleaned up its
    unused styles so the hero ends naturally after the supporting copy.
  - History: A later guided-form brief temporarily restored a smaller trust
    cue; current browser feedback confirmed that it should remain removed.
  - Completed: 2026-08-12

- [x] Redesign the Sukkah Rentals hero
  - Centered the hero content below the left-aligned breadcrumb, refined the
    heading scale and spacing, and replaced the alert-like security notice with
    a compact trust card for direct, secure delivery.
  - Completed: 2026-08-12

- [x] Refine the homepage testimonial carousel
  - Replaced the native scrolling box with an arrow-controlled, clipped slide
    track. Removed fixed card heights, tightened quote and attribution spacing,
    balanced the two-column layout, and added keyboard, focus, and reduced-motion
    handling.
  - Completed: 2026-08-12

- [x] Refine shared navigation, forms, and testimonial scrolling
  - Moved Tree Trimming and Eruv Work into the primary navigation as direct
    links, centered the matching form-page hero content, restyled the secure
    notices and both submit buttons, and changed Extra service to an optional
    checkbox on Builds and Rentals. Added a clearly labeled temporary preview
    testimonial card with an animated More stories cue for scroller testing.
  - Completed: 2026-08-12

- [x] Remove the former photo route and prepare testimonial scrolling
  - Removed the public photo page, navigation/footer/about links, service
    action references, and route documentation. Added an accessible horizontal
    testimonial scroller with previous/next controls that activates when the
    approved story set contains more than one card.
  - Completed: 2026-08-12

- [x] Apply the August 12 homepage browser annotations
  - Updated the hero, service, and process copy requested in the browser
    comments.
  - Added optimized local photos for rentals, planning, and the finished
    sukkah, and adjusted the service photo focal point to center the worker.
  - Verified the production build and checked the homepage at the annotated
    desktop width and at phone width with no horizontal page overflow.
  - Completed: 2026-08-12

- [x] Apply the August 12 website content and form updates
  - Moved Pergolas into the Sukkahs navigation and footer group; renamed the
    public `Sukka Builder` label to `Builds` while preserving its route; and
    added the confirmed office hours and holiday closures.
  - Added Los Angeles to both form neighborhood lists and the Custom Sukkahs
    service-area section.
  - Simplified Builds for customer-owned sukkahs, added its required
    installation date, synchronized add-ons across Builds and Rentals, added
    the required extra-service question, and gave both forms matching submit
    buttons with reduced-motion-safe success feedback.
  - Added the approved Friendship Circle Brooklyn testimonial and a compact
    private testimonial-submission process. New submissions are saved with
    `Pending review` status and never publish automatically.
  - Verified the production build, simulated all three server submission
    routes, ran browser checks at desktop and phone widths, and completed WCAG
    2 A/AA automated checks with no reported violations.
  - Completed: 2026-08-12

- [x] Expand and redesign the Custom Sukkahs page
  - Added a photo-led custom-service page with approved structure, wall,
    schach, feature, project-service, service-area, and quote information.
  - Used supplied project photos for completed work, including the supplied
    wood lattice panel photo.
  - Expanded the wall gallery with flexible coverings, framed panels, and
    horizontal slat siding. Unified every wall and siding option in one
    equal-sized gallery, with the tarp thickness and color note below it.
    Added a matching Schach gallery for bamboo sticks, bamboo mats, and
    evergreen, while keeping porch and flooring details in the concise details
    list instead of a separate project-options section.
  - Linked the main action to the Contact page, with phone as the secondary
    option.
  - Updated: 2026-08-10
  - Completed: 2026-08-07

- [x] Simplify the custom sukkah frame description
  - Changed the text to: "Choose between a wooden or metal frame."
  - Completed: 2026-08-04
