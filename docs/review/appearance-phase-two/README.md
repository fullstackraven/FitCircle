# Appearance Phase 2 review

Based on merged Phase 1 PR #72 (`6344a35`). This is a presentation-only conversion of Home, Routines, Reminders, Logs (`/wellness`), Profile, and their shared navigation and editors. The supplied concept guided color and material choices; existing page layouts and workflows remain intact.

## Architecture and scope

- `styles/appearance.css` and `tailwind.config.ts` define semantic surface, text, control, border, action, feature-accent and material roles. Dark channels reproduce original RGB values precisely; Light uses off-white canvas, white cards, pale slate controls, charcoal text and darker accent text.
- `styles/glass.css` and shared utilities in `index.css` consume those roles. Standalone glass consumers retain original Dark fallback values, including the viewport diagnostic dock. No shell geometry, safe-area, scroll ownership, keyboard guard or modal sizing changes.
- Shared buttons retain transparent/inherited default and destructive variants. Explicit primary, danger and quiet-destructive variants are available without globally recoloring callers. Reminder clearing opts into quiet destructive styling; existing workout deletion remains its established outline control.
- Home circles retain persisted color identifiers, original gradients, dimensions, SVG color attributes and calculations. Light uses darker presentation-only strokes, readable labels and visible tracks; Dark retains its original glow and colors. `color-utils.ts` adds only a pure Light stroke lookup.
- `DaySelector`, routine/workout editors, timer picker, profile summary, quote, notifications and portal close controls use theme roles. Routines remains configuration-only. Reminders still starts without a draft, opens a blank borderless draft, and supports consecutive Return entry.
- The Phase 1 appearance controller, preference key, validation, backups and production gate are unchanged. Light/Dark/System are available through the existing development preview only. Production remains Dark even with saved Light/System preferences. No public appearance selector.
- Playwright starts the existing production preview and a development preview on port 4184. No deployment, manifest, startup metadata, dependency or service-worker changes.

## Visual evidence

All screenshots use a 390 × 844 viewport and synthetic records. “Before” was captured from merged Phase 1 before styling edits. Additional Phase 2 Dark snapshot assertions require zero differing pixels. Original Phase 1 screenshot files and computed-color baselines are unchanged.

| View | Phase 1 Dark | Phase 2 Dark | Phase 2 Light |
| --- | --- | --- | --- |
| Home | [Before](before/home.png) | [Dark](dark/home.png) | [Light](light/home.png) |
| Workout Editor | [Before](before/workout-editor.png) | [Dark](dark/workout-editor.png) | [Light](light/workout-editor.png) |
| Sidebar | [Before](before/sidebar.png) | [Dark](dark/sidebar.png) | [Light](light/sidebar.png) |
| Routines Collapsed | [Before](before/routines-collapsed.png) | [Dark](dark/routines-collapsed.png) | [Light](light/routines-collapsed.png) |
| Routines Expanded | [Before](before/routines-expanded.png) | [Dark](dark/routines-expanded.png) | [Light](light/routines-expanded.png) |
| Routine Editor | [Before](before/routine-editor.png) | [Dark](dark/routine-editor.png) | [Light](light/routine-editor.png) |
| Reminders | [Before](before/reminders.png) | [Dark](dark/reminders.png) | [Light](light/reminders.png) |
| Reminder Draft | [Before](before/reminder-draft.png) | [Dark](dark/reminder-draft.png) | [Light](light/reminder-draft.png) |
| Logs | [Before](before/logs.png) | [Dark](dark/logs.png) | [Light](light/logs.png) |
| Profile | [Before](before/profile.png) | [Dark](dark/profile.png) | [Light](light/profile.png) |
| Profile Editor | [Before](before/profile-editor.png) | [Dark](dark/profile-editor.png) | [Light](light/profile-editor.png) |

Original wider Phase 1 regression coverage remains in [appearance-baseline.spec.ts](../../../tests/browser/appearance-baseline.spec.ts) and its [unchanged snapshots](../../../tests/browser/appearance-baseline.spec.ts-snapshots/), including Calendar, Food Tracker, Nutrition Details, Settings and Hydration.

## Accessibility findings

Light screenshot tests inspect visible text using computed colors composited through ancestor backgrounds, with 4.5:1 normal-text and 3:1 large-text thresholds. Per-view results are alongside each Light PNG (`*-contrast.json`). Representative pairs:

| Role | Colors | Contrast |
| --- | --- | --- |
| Primary text | #0f172a / white | 17.85:1 |
| Secondary text | #475569 / #f1f5f9 | 6.92:1 |
| Control boundary | #7c899b / #f1f5f9 | 3.24:1 |
| Green text | #15803d / #f8fafc | 4.79:1 |
| Green action text | white / #15803d | 5.02:1 |

All twelve Light workout strokes have automated ≥3:1 contrast against the app surface. Native checkbox accents, visible focus, portal styling, narrow 320px layouts, increased text size and keyboard viewport clearance are covered.

**Existing Dark exceptions remain:** legacy white text on green500 is approximately 2.28:1 and on green600 approximately 3.30:1. Changing those would violate the requested exact Dark baseline; Light uses darker fills. This is not a claim of complete WCAG conformance. Computed-color tests approximate translucent composition; gradients, blur, every interaction state and assistive technologies still require visual/manual assessment.

## Remaining explicit colors

Intentional presentation colors remain: persisted workout hue maps and gradients, feature-tinted fills, bright Home action with black text, colored icon-button fills, transparent black masks/shadows, and existing feature artwork. These carry identity or compositing meaning rather than ordinary neutral surfaces. Light text roles are separate from accent fills. No workout color values are rewritten.

Calendar, Food Tracker, calculator, wellness detail routes and other future-phase pages have not been individually converted. Shared changes preserve their Dark rendering. There is no Phase 3 work or public Light rollout in this PR.

## Validation

Verified commands:

- `npm run check`: passed.
- `npx tsc -p tests/tsconfig.regressions.json`: passed.
- `npm test`: 294 passed, zero failures.
- `npm run audit:storage`: 160 call sites, zero audit errors.
- `npm run build`: passed.

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test --workers=2`: **287 passed**, zero failures. This includes all eleven new appearance tests and unchanged original Phase 1 screenshot/production-gate checks. Coverage includes application and regression TypeScript, unit tests, storage audit, production build, existing full browser regressions, original Phase 1 exact screenshots/computed colors, production Dark gating, and eleven new appearance tests.

New browser coverage exercises both appearances, nested editors, routine expansion, workout interactions, timer controls, reminder entry/completion, Profile saves/errors, Logs reordering/navigation, System media changes, all workout hues, native checkbox styling, mobile keyboard clearance, text scaling and byte-for-byte persistence checks. Existing backup/appearance browser tests and unit tests retain backup validation coverage. No storage implementation or fitness calculations changed.

## Manual verification and next approval

A physical iPhone was not available. Before public appearance rollout, test Safari and installed PWA separately: notch/status-bar and dock clearance, nested editor scrolling with keyboard open, consecutive Return reminder entry, text scaling, VoiceOver focus, native selects and checkbox states, and material contrast under reduced transparency. Launch colors and early theme bootstrap remain Phase 5 scope.

Review the Light palette and preserved Dark contrast exceptions before Phase 3 or any broader accessibility adjustment. No subsequent phase is started by this PR.

## File-change guide

| Group | Files |
| --- | --- |
| Central tokens and shared materials | `client/src/styles/appearance.css`, `client/src/styles/glass.css`, `client/src/index.css`, `tailwind.config.ts` |
| Core pages | `client/src/pages/home.tsx`, `routines.tsx`, `reminders.tsx`, `wellness.tsx`, `profile.tsx` |
| Nested and feature UI | `client/src/components/routine-modal.tsx`, `workout-modal.tsx`, `DaySelector.tsx`, `TimerWheel.tsx`, `progress-circle.tsx`, `QuoteOfTheDay.tsx`, `SidebarProfileCard.tsx`, `FoodNotifications.tsx`, `VersionLabel.tsx` |
| Shared controls and overlays | `client/src/components/ui/button.tsx`, `dialog.tsx`, `sheet.tsx`, `toast.tsx` |
| Pure presentation helper | `client/src/lib/color-utils.ts` |
| Regression tooling and evidence | `playwright.config.ts`, `tests/tsconfig.regressions.json`, `tests/appearance-colors.test.ts`, `tests/browser/appearance-phase-two.spec.ts`, its additional snapshots, `tests/fixtures/appearance-pages.ts`, this review folder |
