# Task 7 verification

18 November 2026. Node 24.22.3.

Passed: clean npm ci (explicit writable npm cache), architecture/lint, 58 Node unit/service tests, 59 React/jsdom integration tests, Vite production build and generation of content-versioned SW/28 precached files. Tests include all inherited CRUD, query cache, auth mocks and routing scenarios.

Independent QA PASS: generated SW lifecycle, scoped cleanup, auth/POST bypass, offline public API hit/miss, cached shell/fallback document, API entry bound, static cache-first and explicit skipWaiting. PNG dimensions are 192×192 and 512×512. QA found and fixed the storage-key collision: Task 7 now uses practice-7-books-v1. Update action text explicitly warns that unsaved edits will be lost.

Real browser QA is blocked locally: Chromium cannot open its required socket, and cloud browser cannot reach local preview. Installability, real offline mode, visual mobile layouts and live update cycle are not claimed as verified. Publication still requires authorized GitHub write access. Actual Firebase sign-in is not verified: no configuration provided. No Teams submission.
