# Supplements modernization

The main Supplements page now follows the supplied mockup and Dynamic Overview's existing supplement styling: green pill header, saved local date presentation, live completed/total counter, thin progress bar, outlined full-row checkboxes, saved dosage beneath each name, and an explicit Save Today's Log action. Management remains secondary in a single expandable card, with neutral edit controls, red delete controls, and a second Add action opening the same existing dialog.

## Scope and data preservation

- Reuses `overview-progress`, `overview-supplement-list`, `overview-supplement-row`, `overview-check`, and `overview-supplement-name` directly. Small additions in `supplements.css` are scoped to `.supplements-page`; Dynamic Overview and shared stylesheet behavior are unchanged.
- Uses the existing `tempSupplementLogs` selection state and existing save handler. Toggling only updates draft selection and progress, never storage. Saved daily selections load as before.
- Quantity is read from the existing `amount` and `measurementType`, displayed exactly (including stored plural units), and never normalized or rewritten for presentation.
- Save, date handling, add/edit/delete, confirmations, history and calendar-tip behavior are preserved. The existing editor changes names; it does not gain a new quantity-editing feature. Saved quantities remain visible and the existing Add form still sets quantities. Existing management operations retain their reload behavior, including discarding unsaved daily selection as before.
- No hook, storage key/schema, backup/import, calendar calculation, navigation, dock-visibility or service-worker changes. The only shared dialog change is an accessible Add Supplement trigger label. Its form, validation and data handlers are unchanged.
- Both Add entry points activate the same dialog instance. Keyboard Space/Enter toggles full rows using `role=checkbox` and `aria-checked`. Management edit/delete buttons retain accessible touch targets. The centralized dock exclusion remains active.

## Screenshots

Synthetic records only; 390×844 and 320×844. Available Chromium 154.0.8037.57 matches the pinned screenshot browser version; the repository screenshot font configuration was used. Before captures use the previous built page; after captures use the redesigned build.

| View | Dark | Light |
|---|---|---|
| Before, 390px | [Before Dark](before-dark-390.png) | [Before Light](before-light-390.png) |
| Daily checklist, 390px | [After Dark](after-dark-390.png) | [After Light](after-light-390.png) |
| Management, 390px | [Manage Dark](manage-dark-390.png) | [Manage Light](manage-light-390.png) |
| Daily checklist, 320px | [Narrow Dark](after-dark-320.png) | [Narrow Light](after-light-320.png) |

Only the directly affected `supplements-page-linux.png` and `supplement-editor-linux.png` visual references were updated. No thresholds changed; all other screenshot baselines remain intact.

## Validation

- Application TypeScript, regression TypeScript and production build: passed.
- Storage/backup units: 43 passed. Storage audit: 164 call sites, zero errors.
- Six new focused browser tests: passed across interaction and mobile checks. Coverage includes saved quantities, saved daily status, immediate draft progress, no auto-save, explicit save/reload, historical record preservation, calendar return and historical Dynamic Overview edits, keyboard toggle, add/edit/delete and deletion cancellation, both Add entry points sharing the form, empty state, 320/390px layouts, long names/quantities, Light/Dark/System, Light text contrast and hidden navigation dock.
- Existing Dark Phase Four visual test: passed with exact pixel assertions, including the redesigned supplement page/editor and all other captured views unchanged.
- Full CI remains for GitHub Actions; no full local regression suite was run.

## Release and manual checks

Verified actual publication: **v2.12.1**, commit `932c67d3c43c43f1423e35f0b8453afe4d879e0a`, published 2026-10-28T03:06:49Z. This PR has exactly `release:minor`. Expected next version is **2.13.0** if no other release intervenes; the existing simplified workflow computes and records it after successful deployment. No manual version change, release or deployment is performed here.

Physical iPhone checks remain manual: installed PWA and Safari safe areas, checklist and expanded management scrolling, long names, native keyboard in Add/Edit, VoiceOver checkbox/status reading, Save feedback, and calendar-to-history editing. No physical device validation is claimed. Rollback is a normal code revert; no data restoration or migration is necessary.
