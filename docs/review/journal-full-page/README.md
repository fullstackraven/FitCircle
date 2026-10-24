# Journal full-page reading and editing

Follow-up to merged PR #80, based on main ff4ac64.

## Change

Journal library entries and the compose button now navigate to `/journal-entry` instead of opening a dialog. Existing entries open for reading with an Edit icon; new entries open the plain-text editor. A green circular checkmark saves the entry, with an accessible **Save Entry** label and no visible button text. The legacy `/daily-journal` save action also uses that icon.

The page uses the existing app scroll surface, safe-area header spacing, keyboard viewport variables and appearance tokens. There is no modal overlay, close X, nested card or page-specific appearance controller. The dock remains hidden on the entry page, matching the library. Text editors retain the plain surface and green caret without the global white focus box; other form controls are unchanged.

## Navigation and preservation

- Library search is retained in its URL and restored when returning from an entry. Its scroll offset lives only in browser history state.
- Browser Back and the page Back button return to the library. Canceling an unsaved Back prompt retains the mounted editor and draft; explicit Back checks before navigating. Refresh/close also uses the existing native unload protection where supported.
- Direct entry URLs provide a safe library fallback. Entry date keys are URL-encoded without changing stored identifiers.
- Existing save/delete methods, one-entry-per-date-key behavior, incomplete/corrupt-store recovery, metadata retention and backup formats are unchanged. Empty drafts remain unsavable and failed saves remain open.
- No persistent keys, migrations, dependencies or fitness calculations changed.

## Visual references

Only the two directly affected screenshot baselines were captured from the existing deterministic Dark fixture, outside a test-suite run. Original modal baselines remain untouched for historical review. CI retains the existing zero-tolerance screenshot assertions.

- [Full-page editor and checkmark](../../../tests/browser/appearance-phase-four.spec.ts-snapshots/journal-editor-full-page-linux.png)
- [Legacy direct editor checkmark](../../../tests/browser/appearance-phase-four.spec.ts-snapshots/daily-journal-checkmark-linux.png)

## Validation

`npm run check` passed during implementation. No local unit, browser, full-suite or regression tests were run for this update, per owner direction. Existing Journal, appearance, mobile-field and history tests were adapted to full-page navigation and the icon-only save action; their execution remains with GitHub Actions. Screenshots are review artifacts, not a claim of passed screenshot assertions.

Physical iPhone Safari/installed-PWA checks remain manual: native keyboard/selection, unsaved Back/swipe-back, long-entry scrolling, safe areas and checkmark reachability. No deployment or service-worker changes.

## Rollback

Revert this presentation/navigation PR and redeploy the prior build. Saved journal data remains compatible; do not clear storage or reinstall the PWA.


## PR #81 CI correction

The first CI run passed prepare/backup checks and browser shards 2/4 and 4/4. Shards 1/4 and 3/4 reported three failures; the aggregate build gate correctly failed and deployment stayed skipped.

- **Canceled browser Back discarded the editor:** a route-changing popstate reached the router before the draft handler could preserve the mounted component. A transient same-route history fence now holds the editor in place for confirmation. Cancel restores the fence and retains the draft; confirmed navigation consumes it before returning to the library. Saving removes the fence. No persistent data or storage schema changed.
- **Dark narrow-library hover contrast:** preview text on the hovered secondary surface measured 4.04:1. The existing `supporting` semantic text token is now applied on row hover. Normal row colors and all unrelated components remain unchanged. Existing contrast assertions remain intact.
- **Meditation timer screenshot:** the CI mismatch did not reproduce locally. Its existing baseline depicts the bottom of the scroll surface, so the fixture now explicitly waits for the paused state and pins that scroll position instead of depending on click auto-scrolling during a layout transition. Journal return navigation also waits for the library URL before continuing the walkthrough. No Meditation application code, image baseline, pixel threshold or retry setting changed. CI artifact/log downloads returned 403; the available check annotations supplied the failures.

Focused follow-up validation only:

- `npm run build`: passed.
- `npm run check`: passed.
- The three failed cases (`journal-notes.spec.ts` Dark library + browser Back, and `appearance-phase-four.spec.ts` Dark walkthrough): **3 passed, 12.8s**.
- After the explicit scroll/navigation waits, the affected Dark walkthrough repeated twice with two workers: **2 passed, 14.1s**, against the unchanged zero-tolerance baselines.

No full local suite was run. Existing review-gallery side effects were restored and no screenshots were added or changed by this correction. Final complete validation remains with GitHub Actions.
