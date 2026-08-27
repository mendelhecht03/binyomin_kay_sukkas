# Cloudflare deployment and rollback

## Purpose

This project uses Cloudflare's Git-connected Worker Builds with a safe two-stage
release approach:

1. Cloudflare builds the connected branch in a separate staging Worker named
   `bk-sukkah-staging`.
2. The Worker is reviewed on its Cloudflare-provided address before any
   production release is considered.

The live `bksukkah.com` site is not changed by this workflow. Production remains a deliberate, manual release until the refactor is verified and approved.

## Isolated staging data

Staging uses its own empty Cloudflare resources, never the live site's data:

| Resource | Purpose |
| --- | --- |
| D1 database `bk-sukkah-staging` | Test form submissions, dashboard behavior, form versions, and exports. |
| R2 bucket `bk-sukkah-staging-submission-photos` | Test photo uploads attached to staging-only submissions. |

The resource IDs and bindings live in `wrangler.jsonc`. The current project
configuration deliberately contains **no production binding or custom domain**.
The prior instruction was not to migrate the old test submissions, so this
database intentionally starts empty.

## One-time Cloudflare setup

In Cloudflare, connect the GitHub repository `mendelhecht03/binyomin_kay_sukkas`
to a Worker named `bk-sukkah-staging`. Use the refactor branch for the first
staging deployment. Cloudflare can read the repository through the GitHub app;
no Cloudflare API token needs to be stored in GitHub for this path.

Configure the build command as `npm run build`. Cloudflare reads the staging
bindings from `wrangler.jsonc` and deploys the generated `index.mjs` together
with the separate `dist/` asset directory.

## What the staging build does

Each connected-branch build runs:

1. `npm ci`
2. `npm run build` — builds the Astro site and regenerates `index.mjs`, the small API/router Worker.
3. `node --test tests/*.test.mjs`
4. Deploys `index.mjs` plus the separately uploaded `dist/` assets as `bk-sukkah-staging`.

The staging Worker is intentionally not assigned to `bksukkah.com`. It can be reviewed on its Cloudflare-provided Workers URL before any production release decision.

## Rollback

The live website remains untouched during staging work. If a future production release causes a problem, use either of these recoverable options:

1. In Cloudflare, open the production Worker, open **Versions**, select the last known-good version, and roll back.
2. In GitHub, revert the release commit, allow checks to pass, then perform the approved production deployment again.

Before any production cutover, record the current production Worker version in the release notes and verify that the staging site works on desktop and mobile. Keep production deployment manual until this process has been tested once.

## Assumptions and limits

- `wrangler.jsonc` is the staging-only deployment configuration. It binds the isolated staging D1 database and R2 bucket, and uses Cloudflare's static-assets binding for `dist/`.
- `ADMIN_AUTH_MODE` is set to `cloudflare-access` for staging. Configure a Cloudflare Access application and policy before using the staging dashboard, and add the authorized email addresses to the Worker secret `DASHBOARD_ADMIN_EMAILS`.
- This workflow does not create a production Worker, bind a custom domain, or change production routes.
- Keep the Worker route disabled while staging. A Cloudflare-provided Workers URL is sufficient for review.
