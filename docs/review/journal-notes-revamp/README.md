# Journal Notes revamp

## Audit before implementation

Baseline: main ecce7b0. Logs (`pages/wellness.tsx`) links to `/journal-log`; Calendar also uses `/daily-journal?date=…`. Both use `use-workouts.ts`, with journal entries inside `workout-tracker-data`. Keys are date identifiers; supported values are legacy strings or `{text,timestamp}`. No title/rich-text fields exist. Save replaces the selected day's entry and updates its saved timestamp; delete removes that date after native confirmation. Full-app backups already include this record. No migration or new key is needed.

The previous library filtered invalid dates and blank text out, parsed dates by appending midnight, and could format invalid saved timestamps. Its dialog immediately edited entries and allowed unsaved dismissal. Shared semantic tokens and root appearance controller already support production themes. The app owns scrolling, header, measured dock clearance and keyboard visual viewport; this change must remain scoped.

## Design

Derived first-line titles and body previews are never persisted. Thirty days means today plus the preceding 29 local calendar dates; older current-year records group by month, then older years. Unparseable identifiers remain in an Undated section. Search keeps groups for consistent orientation. It matches all whitespace-separated text terms or recognized US/ISO date queries. No external service or new dependency.

## Implementation and data integrity

- `client/src/pages/journal-log.tsx`: grouped library, entry count, derived previews, persistent bottom search/compose toolbar, reading view and explicit edit state. Existing dialogs remain the entry presentation to reuse FitCircle's proven focus, portal, safe-area and scroll-lock behavior. The text itself has no nested card. Search stays in place when an entry is closed.
- `client/src/lib/journal-library.ts`: pure, read-only date parsing, projection, grouping and search. The entry's date key is authoritative for grouping; saved-at timestamps supply time information and break same-day ties. Editing an old entry therefore does not move it into today's group.
- `client/src/hooks/use-journal-reader-history.ts`: a transient browser-history fence lets Back dismiss the reader first, including confirmation for unsaved changes. Nothing is stored in localStorage or backups for this behavior.
- `client/src/pages/daily-journal.tsx`: retains the Calendar/direct-entry route and fields; adds draft protection, safe timestamp rendering, theme-consistent save styling and persistence-error feedback.
- `client/src/hooks/use-workouts.ts`: Journal pages opt out of redundant mount writes. Their explicit save/delete actions persist successfully before the editor reports success or dismisses. Storage failures retain the draft/original record and expose an accessible error. Existing non-Journal callers retain deferred state-update behavior. Unknown entry metadata is retained on explicit edits.
- `client/src/index.css`: Journal-scoped layout only; no viewport guard, shell, header, dock, theme-controller or other feature changes.

The existing one-entry-per-date model is intentionally preserved. Compose opens today's existing entry when present. It does not create another ID or overwrite an entry merely by opening. Empty drafts cannot be saved. Untouched IDs, date keys, text (including whitespace), timestamps and metadata are preserved. Explicit saves still update the saved-at timestamp, matching the previous editing behavior. Delete keeps native confirmation.

Unparseable date keys are displayed under **Undated**, never assigned invented dates. Empty legacy entries remain visible as **Untitled entry**. An invalid saved-at timestamp is omitted from presentation without changing the source. Structurally unreadable stores use the existing recoverable WorkoutData error boundary, including original-data download; they are not replaced by empty storage.

No storage keys, schemas, backup validators, export/import formats, migrations, dependencies or network services were added. Full and older raw-string backups are regression-tested with multiline text, legacy strings, invalid saved-at dates and extra metadata. The Journal's existing day-rollover behavior in `useWorkouts` remains unchanged.

## Grouping and search rules

- **Previous 30 Days** includes today and the preceding 29 local calendar dates. Local `Date` calendar construction handles DST rather than subtracting hours.
- Remaining current-year entries use month headings; older entries use year headings. Recent December entries can remain in Previous 30 Days in January.
- Entries are sorted by local entry date descending, then valid saved-at time. Every source record is projected once. Grouping refreshes every minute and on focus/visibility changes, including resumed apps.
- Recognized legacy dates: `YYYY-M-D` and US `M/D/YYYY`. Other identifiers remain recoverable as Undated.
- Search is local, case-insensitive and uses AND matching for whitespace-separated partial text terms, across every line and all years. Multiword phrases can be entered directly. There is no external index, history or analytics.
- Whole recognized date queries use date matching instead of accidental text substring matching: US `10/11/2026` / `10/11/26`, ISO `2026-10-11`, `October 11`, `October 2026`, `Oct 2026`, `2026`. Two-digit query years mean 2000–2099. Month/day queries span years. Invalid dates cannot normalize into a different day.
- Results retain chronological headings for orientation; clearing search restores the full library. The compose action stays available.

## Appearance and mobile layout

Existing `surface`, `surface-secondary`, `strong`, `muted-foreground`, `control`, `border`, `action`, `on-action`, `accent-text` and `danger-text` roles supply all colors. The root appearance controller handles System changes; no Journal-specific theme state exists.

The app's existing scroll surface still owns list scrolling. End clearance reserves the toolbar and any measured dock/safe area. Journal currently hides the dock by the existing navigation rule; this rule is unchanged. With the keyboard open, the toolbar uses the existing visual-viewport top/height variables. Editor height adapts within the existing dialog bounds, and its action row remains reachable. No global viewport or service-worker changes.

Screenshots use synthetic records, 390 × 844, plus 320 × 700. Keyboard images simulate visual-viewport occlusion; a headless browser cannot display or verify the native iPhone keyboard. Automated contrast readings accompany the screenshots and use the existing composited-color helper; these measure visible text, not a complete accessibility certification.

## Visual review

The supplied Notes reference informed large headings, rounded grouped rows, restrained separators and the bottom search/compose arrangement. FitCircle's semantic palette, Lucide icons, existing navigation and safe modal infrastructure are retained. No rich-text, attachments, formatting bar or additional saved fields were invented.

| View | Light | Dark |
|---|---|---|
| Grouped library | [Screenshot](screenshots/light-library.png) | [Screenshot](screenshots/dark-library.png) |
| Matching search | [Screenshot](screenshots/light-search.png) | [Screenshot](screenshots/dark-search.png) |
| No results | [Screenshot](screenshots/light-no-results.png) | [Screenshot](screenshots/dark-no-results.png) |
| Reader | [Screenshot](screenshots/light-reader.png) | [Screenshot](screenshots/dark-reader.png) |
| Editor | [Screenshot](screenshots/light-editor.png) | [Screenshot](screenshots/dark-editor.png) |
| Simulated editor keyboard | [Screenshot](screenshots/light-editor-keyboard-simulated.png) | [Screenshot](screenshots/dark-editor-keyboard-simulated.png) |
| Simulated search keyboard | [Screenshot](screenshots/light-search-keyboard-simulated.png) | [Screenshot](screenshots/dark-search-keyboard-simulated.png) |
| 320px library | [Screenshot](screenshots/light-narrow.png) | [Screenshot](screenshots/dark-narrow.png) |

Also: [few entries](screenshots/few-entries-light.png), [empty library](screenshots/empty-light.png), [new empty editor](screenshots/new-editor-dark.png).

Original review evidence remains intact: [old library](../appearance-phase-four/before/journal-log.png), [old editor](../appearance-phase-four/before/journal-editor.png), [old direct editor](../appearance-phase-four/before/daily-journal.png). Previous screenshot baselines are retained. Three separately named `*-notes-linux.png` baselines cover the intentional Journal redesign; existing unrelated assertions and pixel thresholds are unchanged. The modal-field test now uses the bottom compose action, and the viewport test explicitly accepts the new unsaved-discard confirmation.

## Validation

The initial full local validation was stopped at the owner's request. The subsequently authorized editor-baseline correction ran only the affected appearance test, as recorded below. Browser runs used Chromium 154.0.8037.57 (`/usr/bin/chromium`) and `tests/fixtures/screenshot-fonts.conf`; no retries or threshold changes.

| Check already executed | Result |
|---|---|
| `npm run check` | Passed |
| `npx tsc --noEmit -p tests/tsconfig.regressions.json` | Passed before the final explicit Edit-click addition to the appearance test |
| `npm test` | 305 passed, zero failed |
| `TZ=America/New_York npx tsx --test tests/journal-library.test.ts` | 5 passed, zero failed |
| `npm run audit:storage` | 163 call sites, zero errors |
| `npm run build` | Passed; existing bundle-size/Browserslist notices remain |
| Focused Journal/modal/viewport run | 8 passed before the final search-label adjustment; subsequent full-run Journal cases also passed |
| Targeted Dark appearance capture | Follow-up correction: 1 passed (10.5s), including the explicit Edit click; only the Journal editor baseline refreshed |
| Earlier complete two-worker run | 370 passed, 1 failed: new search placeholder violated the existing no-placeholder assertion. Replaced with a label; assertion unchanged. |
| Latest `npm run test:e2e -- --workers=2` | Interrupted at owner request, roughly 280 cases reported passed; no complete-suite pass claimed. The route smoke test and Journal cases passed in this run. GitHub Actions must complete final regression validation. |

### Editor screenshot correction (PR #80 follow-up)

`journal-editor-notes-linux.png` now depicts the focused textarea and Save Entry action after clicking **Edit**, rather than the reader. Only that baseline was removed and recreated with Playwright's `--update-snapshots=missing`; all other existing screenshot assertions ran normally with unchanged `threshold: 0` and `maxDiffPixels: 0`. The affected Dark appearance test passed: **1 test, 10.5s**. No full suite or additional screenshot gallery was run. Existing review-image side effects from the test were restored; no unrelated baselines changed.

Command (with existing Chromium/font environment):

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium FONTCONFIG_FILE="$PWD/tests/fixtures/screenshot-fonts.conf" npx playwright test tests/browser/appearance-phase-four.spec.ts --workers=2 --grep 'dark: remaining routes, goals and nested editors preserve visual baseline' --update-snapshots=missing
```

The existing focused history test in `tests/browser/journal-notes.spec.ts` was reviewed without modification or rerunning: it dismisses the unsaved-discard prompt after browser Back and asserts the draft remains; after testing failed persistence it accepts a subsequent Back prompt and asserts the dialog closes and the Journal library is visible. Full regression validation remains with GitHub Actions.

The 19 existing Journal screenshot views have accompanying contrast readings: 152 visible-text readings, zero failures, minimum measured ratio 5.02:1. These are existing capture results, not a claim that all accessibility or physical-device checks have passed.

## Manual iPhone checks and limitations

Physical-device testing was not performed. Before release, check in Safari and installed Home Screen mode:

- Launch/reopen in Light, Dark and System; change the system appearance while open/backgrounded.
- Search with the real keyboard open; clear the query, open a result, return and verify search/scroll position.
- Compose, type multiline/long text, scroll the editor, save, reopen, edit and cancel/delete.
- Check browser Back/swipe-back and unsaved confirmation, native selection/cursor behavior, dictation and text scaling.
- Verify 320px/narrow layout, status-bar safe area, toolbar/home-indicator clearance, close/save accessibility and oldest-entry visibility.
- Test offline launch with the existing PWA cache, offline search/save, refresh, and complete JSON backup download/restore using synthetic data.

The browser/device may terminate a PWA without delivering `beforeunload`; explicit Save remains required. No persistent autosave draft or new storage format is introduced. Multiple independent notes per day and rich text remain outside the existing schema and this PR. Parsing intentionally avoids guessing arbitrary malformed date identifiers.

## Rollback

Revert this PR through a reviewed change and redeploy the prior build. No data migration or storage cleanup is required: entries created/edited here use the same date keys and plain-string/`{text,timestamp}`-compatible records. Keep downloaded complete backups outside browser storage. Do not clear storage, reinstall the PWA or reset fitness data as part of rollback.
