# Appearance Phase 4 review

Started from main `770815c` after Phase 3 PR #74 merged on 2026-10-23. This PR converts the remaining application presentation; production stays Dark-only and there is no public selector or Phase 5 implementation.

## Architecture and scope

Existing semantic surfaces, foregrounds, control borders, actions, progress tracks and feature text roles replace neutral utility colors across the remaining pages and nested UI. New centralized roles cover wellness text/strokes and text on wellness actions; distinct legacy accent tints; Calendar current-day, completion/recovery chart colors and shadows; energy chart stops/neutral points; meditation tracks; journal elevated surface; scrollbar surfaces and inherited-action compatibility.

Dark values reproduce their original colors. Light wellness fills/strokes use darker versions of their established green/blue/purple/amber identities. Calendar completed/recovery **cells** retain bright green/orange with black text; chart strokes use darker Light variants. No chart data, thresholds, dimensions, percentages or calculations change. Home's remaining utility timer tracks also now use the existing BMI track/fill roles without Dark changes.

Settings toggles expose their existing states through accessible names and `aria-pressed`; Light tracks and supplement checkmarks have stronger contrast. No control preference, activation behavior or persistence logic changes. Default button variants and shell/viewport/modal geometry remain untouched. A compatibility action text class retains inherited Dark foreground (which differs between body and portals), with white text on strong Light fills.

### Existing feature boundaries

Dormant dashboard widgets were styled in place; none was enabled or given new navigation. Goal ring clamping is tested through the existing Cardio Goal editor without saving changes or activating dormant widgets. Fasting currently presents “No active fast” and completed-fast logging/timeline rather than a running fasting timer; this existing behavior is preserved, not replaced or activated.

## Route coverage matrix

“Ready” below means themed application content in development Light/Dark/System. **Public rollout for all rows remains blocked on Phase 5's controls/startup/PWA review.** Physical iPhone checks remain outstanding.

| Route | Readiness | Evidence / nested UI |
| --- | --- | --- |
| `/` | Ready in preview | Phases 2/3 baselines; remaining timer tracks converted |
| `/calendar` | Ready in preview | Monthly completion/recovery cells, current day, weekly charts, Recent Activity and navigation |
| `/routines` | Ready in preview | Phase 2 retained; inline cards and editors |
| `/reminders` | Ready in preview | Phase 2 retained; blank borderless draft |
| `/wellness` | Ready in preview | Phase 2 retained; dock Logs navigation hub |
| `/profile` | Ready in preview | Phase 2 retained; profile editors |
| `/food-tracker` | Ready in preview | Phase 3 retained; meals, entries, scan, inline details |
| `/food-database` | Ready in preview | Phase 3 retained; forms and record controls |
| `/fitness-calculator` | Ready in preview | Phase 3 retained; full/embedded forms |
| `/measurements` | Ready in preview | Phase 3 retained; historical charts |
| `/cardio` | Ready in preview | Current period, history, entry/goal dialogs and recovery boundary |
| `/fasting` | Ready in preview | Inactive timeline, completed history, log/goal dialogs |
| `/meditation` | Ready in preview | SVG timer, completion overlay, history, goal and entry dialogs |
| `/hydration` | Ready in preview | Current intake, histories, goal/add/edit dialogs |
| `/workout-statistics` | Ready in preview | All-time/monthly statistics, native progress bars, exercise totals |
| `/daily-journal` | Ready in preview | Textarea, save and confirmation state |
| `/journal-log` | Ready in preview | History, filtering and journal editing dialog |
| `/energy-level` | Ready in preview | SVG trends, gradient/threshold colors and interactive indicator |
| `/supplements-page` | Ready in preview | Today/manage records, add/edit forms and taken state |
| `/recovery` | Ready in preview | Recovery history and summary |
| `/dynamic-overview/:date` | Ready in preview | Workouts, duration dialog, journal, energy, supplements and recovery |
| `/restore-custom-foods` | Ready in preview | Restoration utility, status and controls |
| `/settings` | Ready in preview | Backup/update/control/erase presentation; no appearance selector |
| `Fallback / 404` | Ready in preview | Corrected originally light-only fallback; intentional Dark difference below |

Data-recovery boundaries render outside the shell and are themed independently. No application route remains an unconverted neutral interface. Standalone `/viewport-test/*` installations and `layout-diagnostics.js` are explicit fixed-appearance developer diagnostics, not ordinary app routes; their independent status-bar/launch metadata and diagnostic contrast remain deliberate. They are not silently enrolled in the appearance system.

## Visual evidence

29 views at 390 × 844, using synthetic records and fixed local dates. Original captures were made before application styling edits. Twenty-eight Dark views require zero-pixel screenshot differences and match the originals byte-for-byte. Original Phase 1–3 baselines remain unchanged.

**One intentional Dark correction:** the existing 404 page forced `gray-50` behind a dark card with `gray-900` text. It now uses the shared canvas/foreground so its Dark appearance is readable. Its original capture is retained for review; it is explicitly excluded from the exact-image assertion, not regenerated. Light also uses the established palette. No geometry or text changes.

| View | Original Dark | Phase 4 Dark | Phase 4 Light |
| --- | --- | --- | --- |
| Calendar Weekly | [Original](before/calendar-weekly.png) | [Dark](dark/calendar-weekly.png) | [Light](light/calendar-weekly.png) |
| Calendar | [Original](before/calendar.png) | [Dark](dark/calendar.png) | [Light](light/calendar.png) |
| Cardio Editor | [Original](before/cardio-editor.png) | [Dark](dark/cardio-editor.png) | [Light](light/cardio-editor.png) |
| Cardio Goal | [Original](before/cardio-goal.png) | [Dark](dark/cardio-goal.png) | [Light](light/cardio-goal.png) |
| Cardio Recovery | [Original](before/cardio-recovery.png) | [Dark](dark/cardio-recovery.png) | [Light](light/cardio-recovery.png) |
| Cardio | [Original](before/cardio.png) | [Dark](dark/cardio.png) | [Light](light/cardio.png) |
| Daily Journal | [Original](before/daily-journal.png) | [Dark](dark/daily-journal.png) | [Light](light/daily-journal.png) |
| Dynamic Overview 2026 10 19 | [Original](before/dynamic-overview-2026-10-19.png) | [Dark](dark/dynamic-overview-2026-10-19.png) | [Light](light/dynamic-overview-2026-10-19.png) |
| Energy Level | [Original](before/energy-level.png) | [Dark](dark/energy-level.png) | [Light](light/energy-level.png) |
| Fasting Editor | [Original](before/fasting-editor.png) | [Dark](dark/fasting-editor.png) | [Light](light/fasting-editor.png) |
| Fasting Goal | [Original](before/fasting-goal.png) | [Dark](dark/fasting-goal.png) | [Light](light/fasting-goal.png) |
| Fasting | [Original](before/fasting.png) | [Dark](dark/fasting.png) | [Light](light/fasting.png) |
| Hydration Editor | [Original](before/hydration-editor.png) | [Dark](dark/hydration-editor.png) | [Light](light/hydration-editor.png) |
| Hydration Goal | [Original](before/hydration-goal.png) | [Dark](dark/hydration-goal.png) | [Light](light/hydration-goal.png) |
| Hydration | [Original](before/hydration.png) | [Dark](dark/hydration.png) | [Light](light/hydration.png) |
| Journal Editor | [Original](before/journal-editor.png) | [Dark](dark/journal-editor.png) | [Light](light/journal-editor.png) |
| Journal Log | [Original](before/journal-log.png) | [Dark](dark/journal-log.png) | [Light](light/journal-log.png) |
| Meditation Editor | [Original](before/meditation-editor.png) | [Dark](dark/meditation-editor.png) | [Light](light/meditation-editor.png) |
| Meditation Goal | [Original](before/meditation-goal.png) | [Dark](dark/meditation-goal.png) | [Light](light/meditation-goal.png) |
| Meditation Timer | [Original](before/meditation-timer.png) | [Dark](dark/meditation-timer.png) | [Light](light/meditation-timer.png) |
| Meditation | [Original](before/meditation.png) | [Dark](dark/meditation.png) | [Light](light/meditation.png) |
| Recovery | [Original](before/recovery.png) | [Dark](dark/recovery.png) | [Light](light/recovery.png) |
| Restore Custom Foods | [Original](before/restore-custom-foods.png) | [Dark](dark/restore-custom-foods.png) | [Light](light/restore-custom-foods.png) |
| Settings | [Original](before/settings.png) | [Dark](dark/settings.png) | [Light](light/settings.png) |
| Supplement Editor | [Original](before/supplement-editor.png) | [Dark](dark/supplement-editor.png) | [Light](light/supplement-editor.png) |
| Supplements Page | [Original](before/supplements-page.png) | [Dark](dark/supplements-page.png) | [Light](light/supplements-page.png) |
| Synthetic Not Found | [Original](before/synthetic-not-found.png) | [Dark](dark/synthetic-not-found.png) | [Light](light/synthetic-not-found.png) |
| Workout Recovery | [Original](before/workout-recovery.png) | [Dark](dark/workout-recovery.png) | [Light](light/workout-recovery.png) |
| Workout Statistics | [Original](before/workout-statistics.png) | [Dark](dark/workout-statistics.png) | [Light](light/workout-statistics.png) |

## Full frontend color audit

[Line-level inventory](color-inventory.json) scans all frontend TS/TSX/CSS plus textual public assets and the HTML entry point. Entries include source snippets, file/line references, classification and rationale. The inventory contains 173 intentional/palette rows, 154 accent rows, **0 unconverted neutral rows**, and 8 bootstrap/metadata rows. Classification is reviewed by role rather than treating every literal as an error:

1. **Intentionally independent / central palette:** root theme values, masks, dimming overlays, white toggle thumbs, dark text on bright actions, intentionally dark camera preview, compatibility fallbacks and developer diagnostics.
2. **Meaningful accent:** persisted workout hues/intensity scales, feature fills/borders, workout gradients and Calendar bright state colors. Ordinary interface text/surfaces use semantic roles. Light chart/ring variants are centralized rather than changing data colors in storage.
3. **Unconverted neutral interface:** zero remaining findings in application-owned TSX. The sole raw `bg-slate-*` utility is the intentionally dark barcode video preview. No unconverted app interface is deferred.
4. **Phase 5:** theme-color/manifest/installation metadata and the pre-controller HTML placeholder. Standalone viewport-test installations deliberately remain fixed-appearance platform diagnostics, not silently converted application routes.

The scan is a static inventory, not a proof of accessibility. Literal colors in centralized palettes and material compositing are expected. Developer-invoked `client/public/layout-diagnostics.js` remains a fixed Dark instrument with colored geometry markers; it never auto-starts or becomes public app navigation.

## Accessibility findings

All 29 Light screenshot views pass visible computed-text checks at 4.5:1 normal / 3:1 large text, including error boundaries outside `.app-shell`. Per-view `*-contrast.json` reports are beside the Light screenshots. The shared test helper now falls back to `document.body` for those existing out-of-shell error surfaces; existing assertions are unchanged.

Light primary wellness actions use white on darker feature fills: green700 ≈5.02:1, blue700 ≈6.70:1, purple700 ≈6.98:1, amber700 ≈5.02:1. Light Settings toggle tracks and ring/chart strokes use visible contrast roles; native controls retain shared focus and border tokens. Supplement checkmarks stay white on the selected green fill. Chart datasets, scale calculations and goal-ring clamping are unchanged.

Legacy Dark exceptions, including some white-on-green action text and muted small text, remain to preserve the established appearance. Bright completed/recovery Calendar cells retain dark text and now include screen-reader completion/recovery text from their existing state flags. Current-day badges, journal/energy/supplement markers and existing text/status labels remain intact; visible geometry and colors are unchanged. Computed-background composition is approximate for blur/gradients and does not constitute full WCAG certification. Manual native-control, focus, VoiceOver and graphical review is still required.

## Data safety and tests

No hook, calculation utility, persistence module, storage registry, backup parser, appearance controller or preference format changed. No new dependencies or migrations. Domain bytes are checked across navigation and theme changes; historical hydration entries remain unchanged after today's edit; timer pause/resume/completion and manual journal/supplement editing retain their existing behavior. Goal-circle zero/partial/complete/over-target display is exercised without saving changes. Existing full regression coverage remains enabled.

The focused final-review correction is documented in [Browser-test reliability review](test-reliability.md), including the original failures, diagnostic runs, Phase 3 comparison, exact validation commands and limitations. It changes two browser-test fixtures only: worker lifecycle readiness plus explicit synthetic barcode response checks, and deterministic overlay/chart screenshot positioning. Original screenshot baselines and exact comparisons remain intact. No application behavior or production networking changed.

- `npm run check` and regression TypeScript: passed.
- `npm test`: 294 passed.
- `npm run audit:storage`: 160 call sites, zero errors.
- `npm run build`: passed; production assets are byte-identical to the prior Phase 4 build.
- Complete nutrition browser suite: 21 passed.
- Complete appearance browser suites: 54 passed, including all 15 Phase 4 cases and prior baselines.
- Repeated affected cases: 30 barcode cases and 10 barcode screenshot checkpoints passed. A later chart-framing failure was corrected in the test fixture; the final full visual case then passed 4/4 repetitions.
- Final full two-worker runs: **318/318 passed twice consecutively** (5.0m and 4.9m), without retries.

Earlier full-run failures are retained in the reliability report rather than treated as resolved by isolated reruns. Physical iPhone/PWA validation remains outstanding.

## Phase 5 dependencies and iPhone checklist

Phase 5 is **not started**. Production remains Dark-only. No selector, early bootstrap rewrite, metadata/manifest changes, service-worker changes or public Light release is included.

The HTML startup placeholder can inherit Light once the stylesheet and existing controller have loaded; the pre-controller frame, launch screens, status-bar glyphs, theme-color and standalone diagnostic installation metadata remain Phase 5/platform work. Startup behavior is not claimed to be flash-free. Test Safari and installed PWA separately on actual hardware:

- Launch/reload in each preference; assess startup flash, status bar, safe-area backgrounds and installed launch screen.
- Check fixed header/dock clearance, long histories, collapsed/expanded Calendar charts and workout totals at larger text sizes.
- Open every wellness goal/entry form and journal/supplement/duration editor with the keyboard up; verify scrolling, focus containment and close/save access.
- Run meditation pause/resume/completion, background/foreground transitions and existing fasting timeline/logging behavior.
- Verify recovery copy download/Files handoff, retry and backup restore confirmations using synthetic records.
- Check VoiceOver, native controls, reduced transparency, high contrast, and light/dark contrast for colored chart/ring states.

Automated tests use Chromium at 390 × 844 and 320px with simulated keyboard shrink; no physical-iPhone compatibility claim is made.

## Complete file-change inventory
- `client/src/components/AddSupplementDialog.tsx`
- `client/src/components/CardioDataRecovery.tsx`
- `client/src/components/GoalCircle.tsx`
- `client/src/components/WellnessHistory.tsx`
- `client/src/components/WorkoutDataRecovery.tsx`
- `client/src/components/dashboard-widgets/CardioWidget.tsx`
- `client/src/components/dashboard-widgets/GoalsWidget.tsx`
- `client/src/components/dashboard-widgets/HydrationWidget.tsx`
- `client/src/components/dashboard-widgets/MeditationWidget.tsx`
- `client/src/components/dashboard-widgets/QuoteWidget.tsx`
- `client/src/components/dashboard-widgets/RecentActivityWidget.tsx`
- `client/src/components/dashboard-widgets/TimerWidget.tsx`
- `client/src/components/dashboard-widgets/WidgetRenderer.tsx`
- `client/src/components/dashboard-widgets/WidgetSettings.tsx`
- `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx`
- `client/src/components/dashboard-widgets/WorkoutWidget.tsx`
- `client/src/components/wellness/WellnessUI.tsx`
- `client/src/index.css`
- `client/src/pages/calendar-new.tsx`
- `client/src/pages/cardio.tsx`
- `client/src/pages/daily-journal.tsx`
- `client/src/pages/dynamic-overview.tsx`
- `client/src/pages/energy-level.tsx`
- `client/src/pages/fasting.tsx`
- `client/src/pages/home.tsx`
- `client/src/pages/hydration.tsx`
- `client/src/pages/journal-log.tsx`
- `client/src/pages/meditation.tsx`
- `client/src/pages/not-found.tsx`
- `client/src/pages/recovery.tsx`
- `client/src/pages/restore-custom-foods.tsx`
- `client/src/pages/settings.tsx`
- `client/src/pages/supplements.tsx`
- `client/src/pages/workout-statistics.tsx`
- `client/src/styles/appearance.css`
- `client/src/styles/glass.css`
- `tailwind.config.ts`
- `tests/fixtures/appearance-contrast.ts`
- `tests/tsconfig.regressions.json`
- `tests/browser/appearance-phase-four.spec.ts` and its new original-Dark snapshot directory
- `tests/fixtures/appearance-wellness.ts`
- `docs/review/appearance-phase-four/README.md`, `color-inventory.json`, and original/Dark/Light screenshot/contrast files

### Verification note

An initial full run passed all 318 tests. After adding the nonvisual Calendar state labels, a repeat returned 317 passes and one unchanged Phase 3 screenshot mismatch: the page behind the barcode dialog had a different scroll offset, while the dialog itself matched. No Phase 3 test, baseline or scrolling implementation was changed for this result. The original Phase 3 suite was rerun in isolation, followed by a fresh full verification; final results are listed below.

The dormant Goals widget's progress fill reuses the existing nutrition-green token, preserving its exact Dark green and providing a visible Light fill. It remains disabled/unrouted; the final production asset checksums are unchanged by that dormant-source refinement.

The unchanged Phase 3 suite passed in isolation (16/16). Another two-worker full repeat passed the appearance checks but returned 317/318 in the automatic-scan caching test before Add Entry opened. This intermittent case is already recorded in the [earlier modal review](../modal-fields/README.md). Its isolated rerun passed (1/1). No barcode code, existing tests, timeouts or retry configuration were changed. Final full serial verification is reported below; two-worker CI timing variability remains a known limitation.

The final serial run returned 317/318 in `nutrition.spec.ts:259` (“scans open Add Entry…”) with the same “Failed to fetch” state before Add Entry. That unchanged test passed immediately in isolation (1/1). All test assertions and original baseline files remain intact. This PR completes the presentation conversion, but full-suite stability still needs review before treating every completion criterion as satisfied. Barcode implementation/test-environment stabilization is intentionally not bundled into the theming changes.

### Final-review correction files

- `tests/browser/nutrition.spec.ts`: controlled-worker fixture readiness and exact synthetic response assertions.
- `tests/browser/appearance-phase-three.spec.ts`: settled overlay and chart scenes, retained exact screenshots and added background-scroll assertions.
- `docs/review/appearance-phase-four/test-reliability.md`: diagnostic evidence, commands, results and limitations.
- This review document: updated validation summary.
