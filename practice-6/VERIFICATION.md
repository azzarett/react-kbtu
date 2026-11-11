# Verification — React Task 6

Date: 11 November 2026. Local Node.js 24.22.1.

## Passed

- Clean `npm ci` from committed lockfile.
- `npm run lint`: React hooks/dependencies and common/features import boundaries.
- `npm test`: 58/58 Node unit/service tests, no failures or skips.
- `npm run test:ui`: 59/59 React integration tests in jsdom across 5 files.
- `npm run build`: production build and lazy route chunks.
- `npm audit --omit=dev --audit-level=high`: 0 reported vulnerabilities after pinning patched `@grpc/grpc-js` 1.14.7.
- Live Open Library check at 2026-11-11T14:27:06.849Z: search Tolkien returned 12 of 2070 records; details for `OL27482W` (The Hobbit) loaded, 702-character description and 93 subjects.

## What the tests cover

TTL hit/expiry, structural keys, concurrent reads, independent cancellation, uncached failures, invalidated pending success/error, all successful and failed CRUD paths, collection/detail/statistics consistency, explicit refresh, URL filters/pages/history, stale UI response protection, form validation and common loading/error/empty states.

Authentication tests inject a session service or mock the Firebase SDK. They cover initialization/persistence selection, cleanup and StrictMode, restoration without premature redirects, profile protection, email/signup/Google/logout calls, duplicate click locking, popup cancellation/retry, invalid and duplicate signup, login/logout failures, expired-session Back/Forward, navigation away during login, and observer recovery after transient initialization failure.

## Not verified / not performed

- No real Firebase project/configuration has been supplied. Email/password, Google OAuth and persistent sessions have **not** been verified against Firebase. Client SDK wiring and errors are implemented; no fake login fallback exists.
- No actual browser rendering or mobile viewport check: installed local Chromium exits because socket operations are unavailable. An approved elevated launch has the same failure. The cloud browser cannot connect to the local Vite server (`ERR_CONNECTION_REFUSED`). jsdom results are not presented as browser results.
- No GitHub Pages deployment. Existing deploy workflow is deliberately unchanged; build-time Firebase variables and deployment setup remain necessary.
- Nothing submitted to Teams.

The source is prepared for the `practice-6` repository folder only; prior task folders and infrastructure are unchanged. A successful local build is not evidence of deployment or real authentication.
