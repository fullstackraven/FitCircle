# Home menu alignment, inline reminders and deployment regression

## Home menu

Home wrapped its shared header contents in an additional **width: calc(100% - 2rem)** container while keeping the same **left: 1rem** menu inset as the other dock pages. That applied an extra horizontal inset. Home now uses the same full-width, max-width and padding geometry as those pages; icon size, touch target, wordmark and navigation are unchanged.

A browser regression compares actual menu-button positions on Home, Calendar, Routines, Logs and Reminders at 390px and 1280px widths.

## Reminder entry

- Tap the in-page **New reminder** field or the existing floating + button to mount and focus an inline draft.
- Mounting/focusing happens in the tap handler to preserve iOS keyboard activation semantics; physical iPhone verification remains outstanding.
- Return saves nonblank text at the head of the active list, clears the input and retains focus for the next reminder. The draft is above the list so ongoing entry remains near the newest records.
- There are no Add Reminder or Cancel buttons in the draft.
- Return on an empty/whitespace draft, deleting its text, Backspace/Delete on an empty draft, Escape, or leaving a blank draft discards it without creating a saved record.
- Text entry composition is respected. Existing text editing, completion ordering, selection, deletion and confirmed clearing remain available.
- Removed the obsolete transient insertion-position reader/writer from this page: newly added reminders consistently lead the list rather than being inserted after an edited record. Existing stored records and any old transient key are not migrated or deleted. The reminder hook and its serialized format are unchanged.

Browser coverage includes consecutive Return submissions, focus retention, reload persistence, empty-draft dismissal, long lists, floating + placement and the existing completed-reminder flows.

## PR #62 deployment investigation

PR #62 merged successfully as **ae391878cb0de8daa34bd27219ceb78d6279333c**. [Deployment run 39544081090](https://github.com/fullstackraven/FitCircle/actions/runs/39544081090) passed TypeScript, unit tests and build, then stopped at browser tests: **218 passed, 1 timed out**. Deployment itself was skipped.

The supplied CI error identifies **manual barcode uses local products offline and retains all nutrients when logged**, timing out waiting for the Breakfast add button. Its setup switched offline immediately after navigation. The load event can precede main.tsx's dynamic App import and React mount; on a slower initialization the test cuts off network access before the app is usable.

A deterministic regression holds the built App module response. Before the fix, the seed helper reports completion while Breakfast has zero rendered buttons; the new regression fails on that premature readiness. After the fix, the helper waits for the existing Breakfast add control, then the test goes offline and successfully opens the local barcode product. The original offline/nutrient assertions remain intact.

Waiting for a usable dashboard also made worker control reliably occur before other mocked barcode lookups. The longer run exposed two existing page-level Open Food Facts mocks being bypassed by service-worker-owned requests (**Failed to fetch** in the scanner). Those three API mocks now use browser-context routing, and the cached-product offline reload explicitly waits for worker activation/control. The three associated barcode checks passed after that correction; no API request/normalization code changed.

This is a **test setup correction only**: no production nutrition, barcode, service worker, deployment configuration, global timeouts or retry behavior changed. The separate diagnostics timing cleanup is untouched. The failed deployment has not been rerun because rerunning a successful deployment workflow would publish automatically.

## Validation

- Application TypeScript: passed.
- Regression-test TypeScript: passed.
- Unit/regression suite: **268 passed**.
- Storage audit: **158 call sites, 0 errors**; inventory regenerated after removing three obsolete insertion-cursor accesses.
- Production build: passed, with existing Browserslist age and bundle-size warnings.
- Focused reminder/header suite: **5 passed**.
- Original offline-barcode failure plus delayed-App regression: **2 passed**; isolated delayed-App regression also passed **10 consecutive runs**. Only that controlled network-gate regression blocks service workers so a cache cannot bypass interception; existing offline/PWA tests retain their normal worker behavior.
- Complete browser suite: **222 passed, 0 failed**.
- Whitespace check: passed.

The first complete run of this branch found one existing material-style reminder test still clicking the removed Add Reminder button. It now saves with Return while retaining its completion/persistence assertions.

Only synthetic browser records were used. No physical Safari/PWA testing is claimed. Verify on an iPhone that tapping either entry control raises the keyboard, Return retains it for consecutive entries, clearing a draft dismisses the bubble, and long lists/dock clearance remain usable.
