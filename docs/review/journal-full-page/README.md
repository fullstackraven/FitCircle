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
