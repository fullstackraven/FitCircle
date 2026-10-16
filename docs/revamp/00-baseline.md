# Verified baseline

Audited main: `0ab26bf20e7c47e9e8068d22a36a1a9070cece63` (fetched 2026-10-16). Clean checkout before audit; 277 tracked files. Node `v24.19.0`, npm `11.9.0`, Linux cloud container, system Chromium `/usr/bin/chromium`. CI uses Node 22; package requires Node >=22. Existing frozen-lockfile dependencies present; no package edits or install needed. No secrets/services/backend required.

| Command | Exit | Actual result |
| --- | --- | --- |
| `npm run check` | 0 | TypeScript passed |
| `npm test` | 0 | 48 tests passed |
| `npm run audit:storage` | 0 | 217 call sites; zero audit errors |
| `npm run build` | 0 | Production dist/ built; large-chunk warning |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 0 | 52 browser tests passed in 51.3s |

No pre-existing failure in these five required checks. `npm audit --json` exited 1 with 37 affected packages (21 high, 13 moderate, 3 low; no critical). These are advisory counts including transitive/tooling effects, not 37 proven browser exploits; see [security review](09-security-and-performance.md).

Build configuration: `vite.config.ts` root client, `/FitCircle/` base, dist/ output; `scripts/build-viewport-test.tsx` embeds dock diagnostic markup; `scripts/build-pwa.mjs` hashes all output and worker template into a precache. `client/public/manifest.json` specifies standalone `/FitCircle/`; `scripts/sw-template.js` owns install/update/offline behavior. `client/public/404.html` and pwa route recovery preserve deep routes. `.github/workflows/pages.yml` runs full checks and deploys pushes to main; `.github/workflows/storage-audit.yml` runs check/unit tests on PRs. `playwright.config.ts` serves production via Vite preview port 4173. `tsconfig.json` excludes tests/tool scripts from normal checking; separate checking is part of the roadmap.

Limitations: Chromium is not physical iOS WebKit. No device, installed PWA records, Files/iCloud, real quotas or app suspension accessed. No merge/deployment. Existing bundle warning is a baseline observation, not a new regression. Dependency advisories are the registry response on this date; no blanket upgrade performed. No reusable environment configuration changes needed for the already working toolchain.
