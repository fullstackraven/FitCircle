# Energy Level modernization

## UI and behavior

Today's Energy now precedes Energy Trends, using the compact navy/slate card conventions from Supplements. The daily card has an amber icon, local date, truthful saved/draft state, 144px ring, direct 1–10 slider with a white thumb, neutral Undo and green Save Energy. Success feedback is inline instead of a blocking alert. The number and ring update immediately; selection never saves automatically.

The existing hook, storage key/schema and historical records are unchanged. Undo deliberately retains the old decrement behavior, including 1 → Not set; it does not delete or undo an already saved record. Saving Not set is disabled. Existing labels remain Very Low (1–2), Low (3–4), Moderate (5–6), High (7–8), Very High (9–10), with the existing color thresholds red (1–3), amber (4–6), green (7–10). A missing record is distinct from a saved value. After Save, the page reads back the stored value before claiming success, since the existing hook catches storage-write errors.

Trends reuse the native SVG approach, with aligned grid/points, three small metrics and actual saved entries only. A small presentation helper supplies 7/30-day calendar windows and retains All Time. The default is 30 days, replacing the previous 14-day default; All Time remains available to preserve functionality beyond the two-option mockup. Average precision (one decimal), saved-record counts and Today retain their meanings. Empty averages/Today use a dash rather than a fabricated zero. No invented “stable” trend claim is shown. Missing days retain spacing in calendar windows but do not contribute scores, points or averages. Valid existing decimal records remain readable; invalid/out-of-scale values are not rewritten or repaired. Calendar-day iteration avoids fixed-duration/DST date windows.

The slider is the only selection control; ten extra numbered buttons were omitted to keep touch targets comfortable at 320px. Existing Back destinations and centralized bottom-dock exclusion remain unchanged. All styles are scoped to `.energy-level-page` and use existing tokens. No new dependency, theme manager, hook persistence, backup, calendar-route, service-worker or release-infrastructure change.

## Screenshots

Synthetic data, 390×844 and 320×844, using Chromium 154.0.8037.57 and the repository screenshot-font configuration.

| View | Dark | Light |
|---|---|---|
| Before, 390px | [Before](before-dark-390.png) | [Before](before-light-390.png) |
| Today, 390px | [After](after-dark-390.png) | [After](after-light-390.png) |
| Trends, 390px | [Trends](trends-dark-390.png) | [Trends](trends-light-390.png) |
| Narrow, 320px | [After](after-dark-320.png) | [After](after-light-320.png) |

Only `energy-level-linux.png` was updated for the intentional redesign. The existing Dark Phase Four visual test passed with exact pixel comparisons; no other baselines or tolerances changed.

## Validation

- Application and regression TypeScript checks: passed.
- Production build: passed.
- 47 focused trend/storage/backup unit tests: passed; the four trend tests also cover empty/single records, ranges/means, missing days, calendar/year/leap boundaries and unchanged source bytes.
- Seven focused browser tests: passed across their targeted runs. Coverage: all 1–10 values and labels, draft-only changes, explicit save/reload, decrement Undo before/after saving, Not set/disabled Save, keyboard minimum selection, simulated write failure, 7/30/All Time statistics and points, empty/single/multiple records, Light/Dark/System, no dock/overflow, 320/390px scrolling, Light text contrast and calendar/historical editing without changing today's saved value.
- Existing Dark Phase Four visual test: passed.
- Storage audit: passed (164 call sites, zero errors).
- Full regression is left to GitHub Actions. No physical-device testing is claimed.

## Release and manual checks

Verified latest release at implementation: **v2.13.0**, commit `6ada8177da5362d02e256d9c0074428d4176c144`, published 2026-10-28T11:46:21Z. This PR uses exactly `release:minor`. **2.14.0** is provisional if no release intervenes; the existing workflow calculates the actual version after approval, merge and successful publication. No version is hardcoded or release created.

Manual iPhone checks: installed PWA/Safari safe areas, native slider dragging and VoiceOver adjustment, keyboard arrows/Home/End, daily-card/trends scrolling, Save/Undo state feedback, historical editing through Calendar, and appearance changes while running/backgrounded. Rollback is a normal code revert; no data migration or storage clearing is needed.
