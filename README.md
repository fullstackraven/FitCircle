# FitCircle

FitCircle is a mobile-first, local-first fitness and wellness React PWA. Workouts,
routines, workout duration, cardio, hydration, fasting, meditation, supplements,
measurements, nutrition and custom foods, journals, reminders, profile, and
statistics run entirely in the browser. There is no server, database service,
account, AI Trainer, analytics service, or cloud synchronization.

## Develop and validate

Use Node.js 22+ and npm (the GitHub Actions build uses Node 22):

```sh
npm ci
npm run dev
```

Open the `/FitCircle/` path on the development server. All routes and assets use
that repository base. Development does not register a service worker.

```sh
npm run check       # TypeScript
npm test            # validation, restore rollback/recovery, IndexedDB backup tests
npm run build      # static production files only, in dist/
npm run preview    # preview the production build at /FitCircle/
npx playwright install chromium
npm run test:e2e    # starts its own production preview
```

For a preinstalled Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its
executable when running `npm run test:e2e`. There are no environment secrets or
runtime service requirements. Commit `package-lock.json` alongside dependency
changes. `dist/` is generated, ignored, and must not be committed.

## Deploy on GitHub Pages

1. In `fullstackraven/FitCircle`, open **Settings → Pages** and set **Source** to
   **GitHub Actions**. Enable Actions if the repository currently disables them.
2. Push the migration to `main`. `.github/workflows/pages.yml` installs using
   `npm ci`, checks types, runs unit tests, builds, runs Chromium tests, uploads
   `dist/`, and deploys using the GitHub Pages deployment action. It can also be
   run manually from the Actions tab.
3. Check the workflow's deployment result. The site is
   `https://fullstackraven.github.io/FitCircle/`.

The workflow has read-only repository access during build. Only deployment gets
`pages: write` and `id-token: write`, using the `github-pages` environment. No
personal token or deployment branch is needed. Review repository environment
protection rules if a deployment waits for approval.

Vite emits to `dist/` without Express or PostgreSQL. Wouter uses `/FitCircle` as
its router base. A small `404.html` redirects clean deep links through the entry
point, which restores the route and query before React mounts; this works on
GitHub Pages before a service worker has been installed. Renaming the repository
requires changing the Vite base, `client/public/404.html`, manifest, and the base
in `scripts/build-pwa.mjs` together.

## PWA and offline behavior

The manifest, icons, registration, scope, cached shell, self-hosted fonts, and
bundled assets all live under `/FitCircle/`. The production build generates a
service worker with a content-derived cache version and a complete precache list.
The install only succeeds when every build asset has been cached. Once installed,
the shell and fitness features work offline, including reloads of internal
routes. The first visit needs a connection; allow installation to finish before
going offline. Data is never stored in the service worker cache.

Install using your browser's installation control, or Safari's **Add to Home
Screen**. Updates wait until existing app tabs close, or can be applied with
**Settings → Force Refresh App** while online. Applying an update reloads the UI
without clearing fitness data. Cache cleanup only touches FitCircle's versioned
Pages caches, preserving other apps on the same origin. Browser-specific install
prompts, iOS standalone behavior, and actual GitHub Pages delivery should be
verified on your devices after deployment.

## Local data and moving from Replit

**A Replit code backup is not a backup of browser fitness data.** Browser data is
scoped to its origin, browser profile, and device. It does not transfer from a
Replit URL to `fullstackraven.github.io`, or between devices. GitHub Pages project
sites for the same owner share an origin; FitCircle only exports/restores its
recognized storage keys and never clears the origin's localStorage.

Before retiring Replit:

1. Open the existing Replit app in each browser/profile containing your data.
   In Settings, download its complete JSON backup and keep an untouched copy.
2. If you used older IndexedDB custom foods, also run the read-only exporter in
   `scripts/export-legacy-backup.js` in the **Replit app's browser console**. It
   downloads a legacy-compatible JSON file including
   `FitCircleCustomFoods/foods`. Review the script before pasting it. The new
   GitHub Pages app cannot read that old origin's IndexedDB.
3. Deploy Pages, open the new app, then use **Settings → Restore from Backup**.
   Close other FitCircle tabs first. Review the confirmation; matching imported
   items replace existing items, while absent items and unrelated storage remain.
4. Verify workouts, dated logs, journals, goals, and custom foods on Pages. Export
   a fresh backup there. Keep Replit and the original backups until satisfied.

No migration process deletes data from Replit. Keep using the same device/browser
for each export, and avoid recording new entries at both origins during cutover.

## Backup and restore

**Download Complete Backup** creates a version 2 JSON file containing exact raw
localStorage strings for recognized FitCircle and calculator keys, plus legacy
IndexedDB custom foods. The current food database (including custom foods and
edits) is included. `FitCircleCustomFoods/foods` is the only IndexedDB store used
by this codebase; unrelated databases are never read or changed.

Restore accepts version 2 and older plain-object exports, including
`__indexeddb_custom_foods`. It parses and validates the entire import before
confirming or changing data. Malformed supported data rejects the whole import;
unrelated keys are ignored. Legacy IndexedDB foods migrate into the current
localStorage food database, deduplicated by ID, with current imported database
edits taking precedence. The source IndexedDB is preserved.

Restore stages an original-value recovery journal before synchronous writes. A
quota/write failure rolls back all touched keys. Interrupted restores roll back
from that durable journal on the next launch, before React reads data. If there
is insufficient space even to stage a journal, restore refuses without changing
existing data. Close other FitCircle tabs during restoration to avoid concurrent
edits. Browser storage cannot protect against users clearing site data or device
storage loss; keep downloaded backups in a safe place. Backups contain private
health information and are not encrypted by this app.

The explicit **Erase All Data** action requires confirmation and only removes
recognized FitCircle localStorage entries. It leaves unrelated storage and legacy
IndexedDB archives intact. Neither updates nor restore use `localStorage.clear()`.
