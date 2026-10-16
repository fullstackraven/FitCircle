# Feature preservation contract

Paths below are relative to `client/src/` unless prefixed otherwise. “Render” or “fixture round-trip” is deliberately weaker than full feature testing. Batch A additions are recorded with executed results in the validation document. All supported behavior stays in scope even when coverage is incomplete.

| Behavior | Implementation | Existing/proposed automated protection | Coverage limits / contract |
| --- | --- | --- | --- |
| Home dashboard / session panel / circles | pages/home.tsx; hooks/use-workouts.ts | browser/app + viewport | Creation/reload/offline smoke; detailed counter/goal schedule history needs more fixtures |
| Dock selection / five main routes | components/BottomNavigation.tsx; DockNavigation.tsx | browser/glass + app | Selected green SVG, current-page state, keyboard navigation |
| Shared headers / sidebar / return query | components/AppHeader.tsx; pages/home,routines,calendar-new,wellness,reminders.tsx | browser/viewport + scroll-boundaries + phone-diagnostics | Safe top region, Settings/Profile return paths, version gesture |
| Routing / deep links /404 | App.tsx; main.tsx; public/404.html; index.html | browser/app | Pages base and query recovery; invalid date parameter failure FC-016 |
| Main scroll / dock clearance | index.css; BottomNavigation.tsx | browser/scroll-boundaries + viewport | Portrait/landscape/desktop; simulated safe areas only |
| Nested dialogs / sheets / select / locks | components/ui/dialog,sheet,viewport-overlay,select.tsx; ScrollLockContext.tsx | browser/viewport + glass | Close visibility, nested locks, restored scrolling, calculator body |
| Static editors / focus / no placeholders | components/workout-modal,routine-modal.tsx; components/ui/input,textarea.tsx | browser/editor-dialogs | Compact fields, no automatic keyboard, full fields/static geometry; actual device keyboard pending |
| Workout add/edit / weights / colors | components/workout-modal.tsx; hooks/use-workouts.ts | browser/editor-dialogs + app | Create/edit/reload; all colors and weighted values need fixtures |
| Completion counts / daily reset | hooks/use-workouts.ts; components/progress-circle.tsx | browser/app smoke | Increment/decrement/auto-progress combinations need dedicated tests |
| Goal changes / historical goals | hooks/use-workouts.ts | backup fixture round-trip; audit synthetic initialization probe | Modern and mixed migrations differ; FC-001 must be fixed separately |
| Workout scheduled days / routine precedence | hooks/use-workouts.ts; DaySelector.tsx | browser/editor-dialogs partial | Every schedule combination and historical day selection missing |
| Routine create / edit / assignment | pages/routines.tsx; routine-modal.tsx; use-workouts.ts | browser/editor-dialogs | Persistence and compact edit; assigned workout reassignment needs expansion |
| Routine delete confirmation / cancel | pages/routines.tsx | browser/editor-dialogs | Trash icon, confirmation, cancellation, delete behavior |
| Calendar monthly / weekly / paging | pages/calendar-new.tsx | browser/app + viewport render | Month/week boundaries, completion/recovery colors and keyboard day activation need detail |
| Daily overview / historical edits | pages/dynamic-overview.tsx | browser/app renders; audit invalid-date probe | Historical workout/journal/energy/supplement/duration editing needs behavior tests |
| Workout statistics / recovery denominators | pages/workout-statistics.tsx; use-workouts.ts | browser/app render | DST/historical schedule/goal calculation matrix missing FC-007/018 |
| Timer / workout session duration | hooks/use-timer,use-workout-duration.ts; pages/home.tsx | browser/app render | Pause/reload/background cases missing FC-008/023 |
| Daily journal / historical journal log | pages/daily-journal,journal-log.tsx; use-workouts.ts | browser/viewport draft; backup round-trip | Save/edit/delete history, exact timestamps missing FC-002 |
| Hydration / beverage types / history / goals | pages/hydration.tsx; hooks/use-hydration.ts | browser/viewport goal dialog; backup fixture | Daily reset/history persistence added in batch A; comprehensive edits remain |
| Meditation / countdown / logs / goals | pages/meditation.tsx; hooks/use-meditation.ts | backup fixture; browser render; audit goal probe | Draft reset FC-010; audio/background/device behavior unverified |
| Fasting / start-end duration / settings | pages/fasting.tsx; hooks/use-fasting.ts | backup fixture; browser render; audit grouped-goal probe | Stale goals FC-009; duration/48h/DST boundaries need tests |
| Cardio / custom types / distance / history | pages/cardio.tsx; hooks/use-cardio.ts | browser/viewport nested custom type; backup fixture | Legacy fallback, duration/distance goal variants need more detail |
| Energy levels / dated logs | pages/energy-level.tsx; hooks/use-energy-level.ts | backup fixture; browser/app render | Historical editing and delete need full UI assertions |
| Recovery days / calendar / percentage | pages/recovery.tsx; hooks/use-recovery.ts | backup fixture; browser/app render | Modern object log fallback FC-018 |
| Supplements / units / daily log | pages/supplements.tsx; hooks/use-supplements.ts; AddSupplementDialog.tsx | backup fixture; browser render | Create/edit/delete/toggle all unit types need UI tests |
| Measurements / trends / latest / goals | pages/measurements.tsx; hooks/use-measurements.ts | backup fixture; browser render | Historical date/compatibility scalar semantics need additional fixtures |
| Fitness calculator / activity / target / macros | pages/fitness-calculator.tsx | browser/material-adoption + viewport + glass | Saved custom percent survives close; formula input fixtures and age FC-011 remain |
| Food meal CRUD / servings / totals | pages/food-tracker.tsx; lib/local-food-service.ts | browser/app search; backup fixture | Dated meal visibility/reload added in batch A; full meal CRUD still needed |
| Food history / previous-next date | pages/food-tracker.tsx | backup both patterns; batch A dated-history browser test | Legacy today writer FC-014 and load/save races need expansion |
| Food search / recent ranking / catalog | pages/food-database,food-tracker.tsx; local-food-service.ts | browser/app search | Catalog465 records; recent prefix FC-015, ranking performance not benchmarked |
| Custom / edited / deleted foods | pages/food-database.tsx; local-food-service.ts | backup exact current-food fixture and deletion-state coverage | Quota false success proven by audit probe FC-004; UI failure path needs correction |
| Legacy IndexedDB migration / collisions | lib/local-food-service.ts; backup.ts; pages/restore-custom-foods.tsx | tests/backup.test.ts; browser/app | Current ID wins, legacy-only retained; stale deleted food policy unchanged |
| Profile name / age / fitness goal | pages/profile.tsx | backup fixture; browser/app render; batch A reload UI test | Current scalar keys retained; calculator mismatch FC-011 |
| Dashboard widgets / order / enable / reset | hooks/use-dashboard-widgets.ts; dashboard-widgets/* | backup fixture; batch A selector tests | Dormant configurable renderer retained; Home does not mount settings; placeholders FC-020 |
| Calendar Recent Activity | components/dashboard-widgets/RecentActivityWidget.tsx; calendar-new.tsx | browser/calendar render | Active component despite other widget candidates; detailed sorting missing |
| Logs tile reorder / two columns | pages/wellness.tsx | browser/material-adoption + viewport | Saved incomplete layout FC-019 |
| Display / quote controls | pages/settings.tsx; hooks/use-controls.ts | backup fixture; browser/app render | Show quote/timer combinations need persistence UI tests |
| Reminders create / complete / reload | pages/reminders.tsx; hooks/use-reminders.ts | browser/material-adoption | Edit/delete/reorder/insertion cursor/selection still need more coverage |
| Daily quote cache / refresh / midnight | hooks/use-quote.ts; QuoteOfTheDay.tsx | backup fixture; browser/home render | Date/cache/no-repeat behavior needs clock tests |
| Backup export / full validation / restore | lib/backup.ts; pages/settings.tsx; storage-registry.ts | backup.test + storage-coverage.test + browser/app | Synthetic all-source exact values; manifest; ignored unrelated keys |
| Legacy backup / malformed file / limits | lib/backup.ts | backup.test + browser/app | Plain/v2, raw scalar/cardio object, nested values, pollution and rejection paths |
| Interrupted restore / quota / recovery | lib/backup.ts; main.tsx | backup.test | Journal before writes, rollback, startup recovery; permanent failure limit FC-030 |
| Backup completeness / read errors | scripts/lib/storage-audit,storage-boundaries.ts; backup.ts | storage-coverage.test + browser/app | 217 registered call sites; missing source/read failure blocks export |
| Offline shell / route navigation | scripts/sw-template.js; lib/pwa.ts | browser/app + status-bar-experiment | Static caches; no backend requests; exact experiment documents |
| PWA install / identity / metadata | public/manifest.json; index.html | browser/phone-diagnostics + status-bar-experiment | Chromium metadata only; physical existing-install host settings unverified |
| Update / Force Refresh / safe recovery | lib/pwa-update,pwa.ts; main.tsx; settings.tsx | browser/update + app | Offline/failed/timeout worker update, data retained |
| iOS viewport / keyboard / rotation | hooks/useIOSViewportGuard.ts; index.css | browser/viewport + scroll-boundaries | Synthetic visual bounds/insets; no physical iOS claim |
| Opt-in viewport diagnostics | public/layout-diagnostics.js; VersionLabel.tsx | browser/layout-diagnostics + phone-diagnostics; viewport-gap.test | Gesture only, cleanup, immutable storage and geometry |
| Separate status-bar experiments | public/viewport-test/*; scripts/build-viewport-test.tsx | browser/status-bar-experiment | Shared real dock markup; no fitness storage; distinct identities not sandboxes |
| Settings erase / auto-backup preferences | pages/settings.tsx | storage audit/backup fixture; render only | Existing explicit confirmation and key filtering retained; automatic preference metadata is not a cloud service |
