# Google Sheet Submission Bridge

The website cannot safely write to a private Google Sheet directly from browser
JavaScript. The small Apps Script in `Code.gs` acts as a protected bridge:

1. The website Worker validates the form and stores optional photos.
2. The Worker sends a private JSON request to Apps Script.
3. Apps Script appends build requests to `Submissions` and customer
   testimonials to `Testimonials` for manual review.

## Destination

- Sheet: [Benyamin Kay — Sukkah Builder Submissions](https://docs.google.com/spreadsheets/d/12ptjlhjooYzWt8dZjKsd-qOET-dnktn7qbDgr5SCRTg/edit)
- Spreadsheet ID: `12ptjlhjooYzWt8dZjKsd-qOET-dnktn7qbDgr5SCRTg`
- Tab: `Submissions`

The script creates the `Testimonials` tab and its header row automatically the
first time a testimonial is received. New testimonials are marked `Pending
review` and are never published automatically.

## One-time Google setup

1. Open the destination Sheet.
2. Choose **Extensions → Apps Script**.
3. Replace the starter code with `Code.gs`, then save it.
4. Run `setWebhookSecret` once and paste the same secret stored as
   `SUKKAH_SHEETS_WEBHOOK_SECRET` in the Sites environment.
5. Choose **Deploy → New deployment → Web app**.
6. Set **Execute as** to yourself and allow the website to access the web app.
7. Store the resulting `/exec` URL as `SUKKAH_SHEETS_WEBHOOK_URL` in the Sites
   environment.
8. Deploy a new site version so the environment revision is applied.

After changing `Code.gs`, create a new Apps Script deployment version. Existing
deployments do not automatically begin running newly saved code.

The webhook secret is intentionally not included in this repository.
