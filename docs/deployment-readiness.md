# Public deployment readiness

The site is not cleared for public deployment yet.

## Dependency blocker

As of July 28, 2026, Next.js 16.2.12 is the latest stable release, but its
installed dependencies include:

- `postcss@8.4.31`, while the current path-traversal advisory is patched in
  `postcss@8.5.18`;
- `sharp@0.34.5`, while the current libvips advisory is patched in
  `sharp@0.35.0`.

`npm audit --omit=dev` reports three high-severity findings. Its proposed
`npm audit fix --force` would replace Next.js 16.2.12 with Next.js 9.3.3. That
is a destructive downgrade and must not be run.

The MVP does not process user-supplied CSS or image uploads, which reduces
exposure to the described attack paths. It does not make the dependency state
acceptable for a public launch.

Before public deployment:

1. Upgrade to a stable Next.js release that includes compatible patched
   PostCSS and Sharp dependencies.
2. Run `npm audit --omit=dev` and confirm these findings are resolved without a
   forced downgrade or unsupported package override.
3. Run `npm run lint` and `npm run build`.
4. Re-test the schedule and menu bridge with unexpected extra JSON fields and
   confirm the site renders only its approved data-transfer objects.

Primary advisories:

- <https://github.com/advisories/GHSA-6g55-p6wh-862q>
- <https://github.com/advisories/GHSA-r28c-9q8g-f849>
- <https://github.com/advisories/GHSA-f88m-g3jw-g9cj>

## Data and privacy checklist

Before public deployment:

- Keep both Google Sheets private.
- Verify the Apps Script `/exec` response in a private browser window.
- Confirm it contains only schedule date/week, CSS and ATS times/topics, and
  weekly meal descriptions.
- Keep facilitator cells excluded until a separate verified public-staff
  allowlist is designed.
- Configure `HILLSIDE_DATA_FEED_URL` as a server-only environment variable.
- Do not add forms, analytics, authentication, or other data collection until
  their privacy, retention, access-control, and incident-response architecture
  has been reviewed.
