# Recovery modernization

## Design and scope

Recovery now uses the compact, rounded slate cards, outlined history rows, metric tiles, segmented controls and semantic colors established by the modernized Supplements/settings pages. The supplied mockups guide the hierarchy: Recovery Overview, Recovery History and collapsible How Recovery Days Work instructions. Styling is small and scoped to `.recovery-page`. Native details/summary provides keyboard-accessible instructions without another component system or dependency.

The overview calls exactly the existing `getTotalStats()` and `getRecoveryStats(totalStats?.totalCompletedDays)`. No hooks or calculation helpers were changed. Recovery Days, the existing Workout Days metric and one-decimal Recovery Rate retain their original source and denominator. **49 / 166 remains 29.5%.** Only the new visual bar clamps to 0–100; a rate such as 300.0% remains displayed in full numerically and in its accessible value text.

History filters use local calendar boundaries: today and the previous six/29 days for 7/30, or every stored record for All. Dates are sorted newest first on a copied array, never by mutating the hook's state or parsing date-only strings as UTC. Default period is 30 days. Five records appear initially; Show More reveals 20 additional rows per press, with Show Less resetting to five. The displayed showing/total count makes remaining records explicit. Invalid date strings remain visible as unrecognized records under All, without fabricated dates or navigation.

Valid rows use the already-supported `/dynamic-overview/:date` route and existing history return marker. Mark/unmark remains exclusively in Dynamic Overview; this page adds no recovery editor or persistence. Back still returns to Wellness or Calendar as before. The central dock exclusion and shell safe areas are untouched.

No storage keys, schemas, records, backup/import/export, workout calculations, consistency calculations, service worker or release infrastructure changed. The only non-presentation helper filters and bounds view data; it never writes storage.

## Screenshots

Synthetic data only. Chromium 154.0.8037.57 with the existing screenshot-font configuration, 390×844 and 320×844. Mockup numbers are not hardcoded into UI; the test fixture independently establishes 49 recovery and 166 completed dates.

| View | Dark | Light |
|---|---|---|
| Before, 390px | [Before](before-dark-390.png) | [Before](before-light-390.png) |
| Overview/history, 390px | [After](after-dark-390.png) | [After](after-light-390.png) |
| Expanded instructions | [Instructions](instructions-dark-390.png) | [Instructions](instructions-light-390.png) |
| Narrow, 320px | [After](after-dark-320.png) | [After](after-light-320.png) |

Only `recovery-linux.png` was updated for the intentional redesign. Existing exact-pixel Dark Phase Four validation passed; all other baselines and tolerances remain unchanged. Reference-only statements about sample screenshots were not copied into the application empty state.

## Validation

- Application and regression TypeScript checks: passed.
- Production build: passed.
- 47 focused recovery/storage/backup unit tests: passed. Recovery tests cover the existing hook's denominator/rate, immutable filtering/sorting, year/leap/calendar boundaries, malformed dates and visual-only clamping.
- Six focused browser tests: passed across targeted runs. Coverage includes 49/166/29.5%, 7/30/All filtering, complete progressive expansion/collapse, no domain writes on navigation/filter/reload, existing dated navigation and unmark workflow, zero/over-100% values, empty periods, Light/Dark/System, 320/390px layout, hidden dock, keyboard instructions and Light text contrast.
- Existing Dark Phase Four visual test: passed with exact pixel assertions.
- Storage audit: passed (164 call sites, zero errors).
- Full regression remains for GitHub Actions; physical-device testing is not claimed.

## Release and manual checks

Latest verified publication at implementation: **v2.13.0**, commit `6ada8177da5362d02e256d9c0074428d4176c144`, published 2026-10-28T11:46:21Z. Energy modernization PR101 is open, so this work starts from main and does not depend on its unmerged implementation. This PR uses exactly `release:minor`. Expected next version is **2.14.0** only if no other release intervenes. The simplified workflow computes the actual version; no version is hardcoded, release created or deployment triggered.

Manual iPhone checks: Safari/installed-PWA safe areas, long-history expansion and collapse, bottom scrolling, VoiceOver period/row/progress labels, keyboard controls, dated overview navigation and recovery mark/unmark, appearance changes while running and after resumption. The history batch size and preserved existing completed-days denominator are intentional functional safeguards, not a change to tracking. Rollback is a normal code revert; no storage migration or data restoration is required.
