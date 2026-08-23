# Project Instructions for Codex

These instructions apply whenever Codex works in this project.

## Default Task Workflow

Use `docs/todo.md` as the default work queue for this project.

- At the beginning of a project task, read `docs/todo.md` before choosing or
  proposing work.
- A specific request from the user always takes priority over the queue. Use
  the queue as the default when the user asks to continue, start the next task,
  work on the website generally, or does not name a specific task.
- If `Now` contains a task, continue that task first. Keep no more than one task
  in `Now` at a time.
- If `Now` is empty, choose the first actionable task in `Next`.
- Do not start tasks in `Waiting` until the listed information, approval, asset,
  or decision has been supplied.
- Treat `Later` as lower priority. Work from it only when `Next` has no
  actionable task or the user specifically selects a Later task.
- Before implementing a queue item, move it to `Now`. When implementation and
  proportional verification are complete, move it to `Completed` and record
  the completion date plus a short result.
- If work becomes blocked, move the task to `Waiting` and state exactly what is
  needed to continue. Do not invent missing prices, testimonials, business
  claims, partnerships, service areas, product details, or client approvals.
- When the user supplies new feedback or changes priority, update
  `docs/todo.md` so the queue remains accurate and remove obsolete or duplicate
  entries.
- The todo list controls task order, not product truth. Confirmed behavior and
  website requirements remain documented in `docs/requirements.md`, while
  structure and hosting decisions remain documented in `docs/architecture.md`.

### Quick Correction Mode

When the user asks for a small, clearly scoped correction (such as a text,
spacing, color, or single responsive CSS fix), use the shortest safe workflow:

- Inspect only the relevant component and stylesheet.
- Make the focused edit without broad refactoring.
- Run a focused check or build only if needed to catch a real regression.
- Do not run a full audit, browser walkthrough, or deployment unless the user
  asks for it or the change affects routing, data, authentication, or hosting.

If the request is ambiguous or could affect several pages, explain the small
assumption being made before editing rather than expanding the task silently.

## User Skill Level

The project owner is a beginner-level programmer.

When explaining code or project decisions:

- Use simple, clear language.
- Explain unfamiliar terms briefly.
- Prefer small steps over large jumps.
- Mention why a change is being made, not only what changed.
- Avoid unnecessary advanced abstractions.

## Design Requirements

When editing or generating frontend code, follow these design requirements.

This applies to work involving:

- HTML
- CSS
- JavaScript UI
- pages
- components
- layout
- forms
- buttons
- images
- navigation
- user-facing text

### General Style

- The site should feel clean, simple, and easy to understand.
- Pages should not feel crowded.
- Text should be large enough to read comfortably.
- Important actions should be easy to find.

### Layout

- The website should work well on phones and desktop screens.
- On small screens, content should stack vertically.
- Navigation should be simple and easy to use.
- Forms should be clear, with labels for each input.

### Colors

- Use a small number of colors.
- Backgrounds should stay light and readable.
- Buttons and important actions should stand out from normal text.
- Error messages should be easy to notice.

### Components

- Buttons should look consistent across the site.
- Cards or sections should have consistent spacing.
- Repeated items should use the same layout style.
- Forms should show clear success and error messages.

### Things To Avoid

- Avoid tiny text.
- Avoid cluttered pages.
- Avoid too many different colors or font styles.
- Avoid decorative effects that make the page harder to read.

If a requested change conflicts with these design requirements, explain the conflict before making the change.

If these design requirements do not mention a detail, make a simple, conservative choice that matches the existing project style.

## Coding Style

- Keep code simple and readable.
- Prefer clear names over clever names.
- Do not add large frameworks or dependencies unless they are clearly needed.
- Keep changes focused on the user's request.
- Do not rewrite unrelated files.
- Prefer to use stable and quality component via a  CDN or another method before trying to recreate the component from scratch (inform the user if the tradeoffs are severe)

## Documentation

When a decision affects the website's design, structure, or requirements, suggest updating the matching file in `docs/`.

Keep `docs/todo.md` synchronized whenever a tracked task starts, finishes,
becomes blocked, changes priority, or is superseded.

## Route and Architecture Changes

Whenever Codex changes routes, navigation, hosting structure, file layout, or the static Worker setup:

- Update `docs/architecture.md`.
- Update the route list in `docs/requirements.md` when the public route list changes.
- Keep the repeated navbar markup consistent across every HTML page.
- Regenerate `index.mjs` with `node scripts\generate-static-worker.cjs` before deployment.
- Check that new deployable assets use supported, size-conscious formats. Prefer compressed `.jpg` files for normal photos.
