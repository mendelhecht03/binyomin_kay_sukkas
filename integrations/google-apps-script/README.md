# Google Testimonial Submission Bridge

The website cannot safely write to a private Google Sheet directly from browser
JavaScript. The small Apps Script in `Code.gs` acts as a protected bridge:

1. The website Worker validates a testimonial submission.
2. The Worker sends a private JSON request to Apps Script.
3. Apps Script appends the testimonial to `Testimonials` for manual review.
4. Apps Script emails a private notification to
   `bkaysukkahbuilders@gmail.com`.

Builds and Rentals requests do not use this bridge. Their Worker routes send
them to their existing Google Forms, including links to uploaded photos. The
owner dashboard also does not run in Apps Script; it is a separately protected,
read-only Worker API documented in `docs/owner-dashboard.md`.

## Destination

- Sheet: [Benyamin Kay — Sukkah Builder Submissions](https://docs.google.com/spreadsheets/d/12ptjlhjooYzWt8dZjKsd-qOET-dnktn7qbDgr5SCRTg/edit)
- Spreadsheet ID: `12ptjlhjooYzWt8dZjKsd-qOET-dnktn7qbDgr5SCRTg`
- Tab used by this integration: `Testimonials`

The script creates the `Testimonials` tab and its header row automatically the
first time a testimonial is received. New testimonials are marked `Pending
review` and are never published automatically.

The email contains the submitted details so the business can review them. A
mail problem does not discard the saved testimonial or make it public.

For a temporary delivery test, add the Script property
`TESTIMONIAL_NOTIFICATION_EMAIL` with the test address. Delete that property
after the test; the script then returns to the built-in business recipient.

## One-time Google setup

1. Open the destination Sheet.
2. Choose **Extensions → Apps Script**.
3. Replace the starter code with `Code.gs`, then save it.
4. Run `setWebhookSecret` once and paste the same secret stored as
   `SUKKAH_SHEETS_WEBHOOK_SECRET` in the Sites environment.
5. Select and run `authorizeTestimonialEmail` once, then approve the requested
   mail permission. This authorization step does not send a message.
6. Choose **Deploy → New deployment → Web app**.
7. Set **Execute as** to yourself and allow the website to access the web app.
8. Store the resulting `/exec` URL as `SUKKAH_SHEETS_WEBHOOK_URL` in the Sites
   environment.
9. Deploy a new site version so the environment revision is applied.

After changing `Code.gs`, create a new Apps Script deployment version. Existing
deployments do not automatically begin running newly saved code.

The webhook secret is intentionally not included in this repository.
