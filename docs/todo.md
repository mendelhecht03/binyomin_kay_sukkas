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

No implementation task is currently in progress.

## Next

- [ ] Explain convertible roof and schach options
  - Why: Customers should understand whether a structure can use schach for
    Sukkos and a regular roof at other times of the year.
  - Done when: The exact system has been confirmed with Benyamin and a clear,
    accurate explanation has been added to the Custom Sukkahs page.

- [ ] Replace testimonial placeholders with genuine customer reviews
  - Why: The homepage now has a testimonials section, but it still needs real
    customer wording and approved names.
  - Done when: At least two genuine reviews have written publication approval
    and replace the homepage placeholders. Do not write or publish fabricated
    or AI-generated customer reviews.

- [ ] Update the service-area list
  - Why: The requested location list has changed.
  - Include: Add California, remove New Haven, and make the list easy to edit
    when the service area changes again.
  - Done when: Benyamin approves the complete list and every location shown on
    the website matches it.

- [ ] Add accepted payment methods
  - Why: Visitors should know how they can pay before arranging service.
  - Done when: Benyamin confirms the accepted payment methods and they appear
    in a compact, easy-to-find section without displaying unsupported options.

## Later

- [ ] Turn the Rentals page into an informational page plus request form
  - Why: The current page feels too form-based and does not explain the rental
    choices before asking the visitor for information.
  - Include: Basic wood or metal structures, available sizes, tarp styles,
    thicknesses and colors, price ranges, and optional lights, tables, chairs,
    and greenery.
  - Done when: Visitors can understand the available rental package before
    reaching a clearly separated rental-request form.

- [ ] Add a customer review submission process
  - Why: Customers need a simple way to send genuine feedback for possible
    publication.
  - Done when: A review form or trusted external review link is available, new
    submissions require moderation, and nothing is published automatically.

- [ ] Review add-ons across the regular sukkah pages
  - Why: One recording mentions regular sukkahs and add-ons, but the intended
    change is unclear.
  - Done when: Benyamin confirms which add-ons belong on each regular sukkah
    page and the approved choices are displayed consistently.

- [ ] Strengthen the About page with approved business history
  - Why: The requested About copy includes customer-volume, worldwide-service,
    and company-relationship claims that could build trust if they are accurate.
  - Include only after verification: The number of customers served, the areas
    served, and the exact nature of work involving Sukkah Depot, Sukkah Store,
    Sukkah Center, or other named companies.
  - Done when: Every public claim is accurate, approved, and worded so it does
    not imply a partnership or endorsement that does not exist.

## Waiting

- [ ] Receive and label real custom-sukkah project photos
  - Received: Examples of blue and white tarp walls, a beige woven screen,
    soft fabric, framed plywood walls, light and dark framed infill panels,
    rooftop horizontal paneling, horizontal slat siding, a porch build, and a
    carpeted floor covering are now used on the Custom Sukkahs page.
  - Waiting for: Benyamin to confirm the exact names and materials listed in
    the terminology task below, and identify any additional project photos
    approved for future use.

- [ ] Confirm custom wall, siding, and flooring terminology
  - Ask Benyamin for: the exact soft-fabric name; the beige screen material,
    thickness, and weather rating; the product names and substrates of the
    light and dark framed infill panels; the material used for the rooftop
    horizontal paneling; and the material used for the reddish-brown
    horizontal slat siding.
  - Also confirm: whether the lattice-top visualization matches an option B.
    Kay offers, and whether custom flooring means floor coverings only or can
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

- [ ] Confirm accepted payment methods
  - Waiting for: The exact list of payment types and whether deposits, payment
    schedules, or processing fees should be mentioned.
  - Unblocks: The payment-method section.

- [ ] Verify About-page claims and company-name permissions
  - Waiting for: Confirmation of customer counts, worldwide work, and whether
    each named company can be publicly described as a partner or collaborator.
  - Unblocks: The expanded About-page credibility section.

- [ ] Confirm the complete service-area list
  - Waiting for: A final location list after adding California and removing New
    Haven, including whether locations mean permanent service areas or selected
    projects only.
  - Unblocks: The service-area update.

- [ ] Clarify the regular-sukkah add-ons voice note
  - Waiting for: Confirmation of whether the recording meant add-ons should or
    should not appear with regular sukkahs.
  - Unblocks: The add-on review across regular sukkah pages.

## Completed

- [x] Expand and redesign the Custom Sukkahs page
  - Added a photo-led custom-service page with approved structure, wall,
    schach, feature, project-service, service-area, and quote information.
  - Used supplied project photos for completed work. The user-requested
    lattice-top image is clearly labeled as an illustrative rendering.
  - Expanded the wall gallery with flexible coverings, framed panels, rooftop
    paneling, and horizontal slat siding. Added porch builds and custom floor
    coverings as separate project options.
  - Linked the main action to the Contact page, with phone as the secondary
    option.
  - Updated: 2026-08-10
  - Completed: 2026-08-07

- [x] Simplify the custom sukkah frame description
  - Changed the text to: "Choose between a wooden or metal frame."
  - Completed: 2026-08-04
