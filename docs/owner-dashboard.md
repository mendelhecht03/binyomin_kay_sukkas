# Owner Dashboard

The owner dashboard is an additional read-only view. It does not replace or
modify the existing Google Forms, Google Sheet, photo storage, or customer
submission routes.

## Data flow

```text
Customer form                              Owner browser
     |                                           |
     | existing POST routes                     | GET /admin/
     v                                           v
Sites Worker                               Sites sign-in + email allowlist
     |                                           |
     |-- Builds -> BKAY builds Google Form       | GET /api/admin/submissions
     |-- Rentals -> Rentals Google Form          v
     |-- Testimonials -> Apps Script       Dashboard read service
     |                  -> Sheet + email         |
     `-- Photos -> R2                            |-- Google Forms API (read only)
                                                 `-- Google Sheets API (read only)
```

Google Forms and Sheets remain the system of record. The dashboard normalizes
their different shapes into one consistent entry format for viewing.

## Protection

`/admin/` and `/api/admin/*` are protected on the server. Sites supplies the
signed-in account email in `oai-authenticated-user-email`; the Worker then
requires that address to appear in `DASHBOARD_ADMIN_EMAILS`. Missing
configuration fails closed.

Google access uses a dedicated service account with these read-only scopes:

- `forms.body.readonly`
- `forms.responses.readonly`
- `spreadsheets.readonly`

The service-account private key, Google source IDs, and question maps belong in
the Sites environment. They must never be added to source control or browser
code.

## One-time Google setup

1. In Google Cloud, create a dedicated project or service account for the
   dashboard reader.
2. Enable the Google Forms API and Google Sheets API.
3. Create a JSON key for that service account. Store its client email and
   private key in the Sites environment, then protect or delete the downloaded
   JSON file.
4. Share the private Builds and Rentals Forms with the service-account email as
   an editor; Google does not expose Form responses to a Drive viewer. Share the
   Testimonials spreadsheet as a viewer. Although the Form share says editor,
   the service account is issued read-only OAuth scopes, so this dashboard code
   cannot edit either Form.
5. Use the private Form editor IDs from URLs shaped like
   `docs.google.com/forms/d/FORM_ID/edit`. Do not use public responder IDs that
   begin with `1FAIpQL`; the dashboard rejects them deliberately.
6. Discover the stable question IDs through the Forms API and configure the two
   `GOOGLE_*_FIELD_MAP` values as JSON objects. The keys should be canonical
   names and the values should be stable question IDs, for example
   `{"name":"question-id-from-google"}`. Canonical names include `name`,
   `phone`, `email`, `addressLine1`,
   `city`, `state`, `postalCode`, `neighborhood`, `estimatedSize`, `buildDate`,
   `takeDownDate`, `comments`, `photoLinks`, and source-specific detail names.
7. Add the owner email address to `DASHBOARD_ADMIN_EMAILS` and deploy a new Sites
   version.

With the service-account values and both private Form IDs available in the
local process environment, `npm run dashboard:discover-fields` prints each
question ID beside its title. It reads metadata only and does not submit or edit
anything.

## Required environment values

See `.env.example` for the complete list. The dashboard values are:

- `DASHBOARD_ADMIN_EMAILS`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_BUILDS_FORM_ID`
- `GOOGLE_RENTALS_FORM_ID`
- `GOOGLE_BUILDS_FIELD_MAP`
- `GOOGLE_RENTALS_FIELD_MAP`
- `GOOGLE_TESTIMONIALS_SPREADSHEET_ID`
- `GOOGLE_TESTIMONIALS_SHEET_NAME` (optional; defaults to `Testimonials`)

## Local and automated verification

Run `npm test`. The suite rebuilds the static site and Worker, then verifies:

- authentication fails closed;
- normalization survives missing and newly added Google questions;
- source failures are isolated;
- pagination cursors round-trip;
- the three existing customer submission routes still work independently;
- the admin page and API remain protected.

For a local visual preview, open `/admin/?fixture=1` on localhost. Fixture mode
is disabled on non-local hosts. A real end-to-end check should sign in with an
allowed account, load each source, open detail rows and photo links, and confirm
that no customer form or Google record is changed.

With the real environment values loaded locally, `npm run dashboard:smoke`
performs one read-only request across all three sources and prints only source
statuses and counts, never customer contents or credentials.
