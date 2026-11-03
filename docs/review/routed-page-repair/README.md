# Routed-page repair audit

All **30 migrated workflows / 32 origin-specific routes** were inspected and repaired. This includes the original 29 workflows and Edit Custom Food from search. This audit is limited to migrated editors and their navigation entry points.

## Defects repaired

- **Cross-feature controller reuse:** Wouter can retain a FormOwner element when navigating between sibling routes. Its ref kept the previous feature's owner and draft values. A keyed inner scope now isolates feature controllers while preserving the same controller across that feature's nested forms. This repairs Profile editor buttons reached through the drawer, Home → Routines, and Food Tracker → Food Database.
- **Draft loss on rejected browser Back:** the history listener could restore an older snapshot before the unsaved-change guard ran. Dirty forms now retain their live values until navigation is approved.
- **Nested return destinations:** child cancellation discarded the parent's return metadata. Parent frames now retain the return chain without duplicating form data. Submitted custom-food steps are excluded from that chain. Historical diary dates survive database trips and nested return paths.
- **Profile-related destinations:** Workout Statistics and Body Measurements return to Profile, including its original dashboard context; other callers retain their existing destinations.
- **Relocated modal surfaces:** removed outer background, border/radius, width caps, centering, padding and scroll restrictions from every FormContent call site. The shared page contract accepts only standard/training field layouts, rather than arbitrary modal shell classes. Hidden introductions no longer occupy a grid row.
- **Page actions and field groups:** full-width primary actions precede separate Cancel actions in a shared footer. Add Cardio, Add Hydration, Meditation and custom-food forms use normal page sections. Missing Cancel/Done actions were added where appropriate. Fasting's narrow date/time column caps and the search list's obsolete inner scroller were removed. Workout/Routine fields keep their existing identity, without drag handles, overlay offsets or keyboard-driven control shrinkage.
- **Validation:** invalid Meditation Start stays on its editor. Profile validation, failed-save draft retention, missing IDs and recovery controls remain safe. Unavailable forms now use the normal header/Back layout.

No fitness/nutrition calculations, goal values, color assignments, localStorage schemas, backup formats, appearance tokens, dependencies or PWA behavior changed. Home Timer, drawers, confirmation dialogs and informational completion overlays remain intact. Barcode/Custom Food action JSX remains unchanged.

## Route inventory and layout audit

Every route below passed the integrated-page shell checks in Light, Dark and System, at 320px and 390px. Checks cover transparent/unbordered outer surfaces, no dialog overlays, no height/width restrictions, normal margins, no horizontal overflow, reachable page actions and fixed header Back. Existing grouped input cards and goal summaries are intentional controls, not modal shells.

| Route (synthetic record IDs) | Workflow | Layout audit |
| --- | --- | --- |
| `/workouts/new` | Add Workout | Pass: integrated page |
| `/workouts/edit?id=w` | Edit Workout | Pass: integrated page |
| `/routines/workouts/new?routine=r` | Add Workout | Pass: integrated page |
| `/routines/workouts/edit?id=w` | Edit Workout | Pass: integrated page |
| `/routines/new` | Create Routine | Pass: integrated page |
| `/routines/edit?id=r` | Edit Routine | Pass: integrated page |
| `/dynamic-overview/2026-10-19/duration` | Edit Workout Duration | Pass: integrated page |
| `/widgets/settings` | Widget Settings | Pass: integrated page |
| `/cardio/goal` | Cardio Goal | Pass: integrated page |
| `/cardio/add` | Add Cardio | Pass: integrated page |
| `/cardio/edit?id=cardio` | Edit Cardio | Pass: integrated page |
| `/cardio/types/new` | Add Custom Cardio Type | Pass: integrated page |
| `/meditation/goal` | Meditation Goal | Pass: integrated page |
| `/meditation/add` | Add Meditation | Pass: integrated page |
| `/meditation/start` | Start Meditation | Pass: integrated page |
| `/meditation/edit?id=practice` | Edit Meditation | Pass: integrated page |
| `/hydration/goal` | Hydration Goal | Pass: integrated page |
| `/hydration/add` | Add Hydration | Pass: integrated page |
| `/hydration/edit?id=intake` | Edit Hydration | Pass: integrated page |
| `/fasting/goal` | Intermittent Fasting Goal | Pass: integrated page |
| `/fasting/add` | Add Fast | Pass: integrated page |
| `/fasting/edit?id=fast` | Edit Fast | Pass: integrated page |
| `/food-tracker/add?meal=lunch&date=2026-10-19` | Add Food | Pass: integrated page |
| `/food-tracker/scan` | Scan Barcode | Pass: integrated page |
| `/food-tracker/custom/new` | Create Custom Food | Pass: integrated page |
| `/food-tracker/custom/edit?id=custom-appearance` | Edit Custom Food | Pass: integrated page |
| `/food-tracker/entry/new?id=custom-appearance&meal=lunch` | Add Food Entry | Pass: integrated page |
| `/food-tracker/entry/edit?id=logged-appearance&date=2026-10-19` | Edit Food Entry | Pass: integrated page |
| `/food-database/edit?id=custom-appearance` | Edit Food | Pass: integrated page |
| `/supplements-page/new` | Add Supplement | Pass: integrated page |
| `/profile/edit` | Edit Profile | Pass: integrated page |
| `/profile/goals` | Fitness Goals | Pass: integrated page |

## Functional verification map

| Workflows | Executed browser coverage |
| --- | --- |
| Home/Routines workout Add/Edit/Delete; Routine Create/Edit | routed-forms, editor-dialogs, training-editors; SPA Home → Routines → Home in routed-page-repair |
| Duration and Widget Settings | routed-forms; Widget Done persistence/return in routed-page-repair |
| All four goals; Cardio Add/Edit/Custom Type | routed-forms, wellness-goals, goal-editors, wellness-design |
| Meditation Add/Start/Edit; Hydration Add/Edit; Fasting Add/Edit | routed-forms, wellness-design, wellness-goals; invalid Meditation Start in routed-page-repair |
| Food search/history, barcode, Custom Create/Edit, Entry Add/Edit, database editing | routed-forms, nutrition; SPA database edits and historical return, nested Cancel and bookmarked entry refresh in routed-page-repair |
| Add Supplement | routed-forms: creation, persistence and return/reload |
| Every Profile control | routed-page-repair reaches Profile through all five main navigation pages, edits name/DOB/goals, checks both icon and row entry points, saves/reloads, visits Statistics/Measurements and returns, and checks header Back; fitness-profile covers existing legacy metadata/calculator integration |
| Profile recovery and validation | routed-page-repair: Retry, Account Data, disabled unsafe edits, no partial writes, rejected header/browser Back and explicit Cancel |
| Invalid/missing IDs | routed-forms: unavailable record fallbacks without writes, including custom foods and entry creation |
| Keyboard/mobile/focus and retained overlays | modal-fields, viewport, editor-dialogs; design-consistency retains contrast, Timer/drawer/confirmation and dropdown checks |

## Validation results

Local results:

- Application and regression TypeScript: pass.
- Production build: pass.
- Unit/contract suite: **390 passed**.
- Affected functional/browser regression set: **94 passed**.
- Final mobile/navigation set: **38 passed**, including the bookmarked historical food entry, rejected browser Back, recovery controls, nested cancellation, focus/keyboard-sized viewports, contrast and protected controls.
- Long custom-food header/Back scrolling check at 320/390px: **passed**, including full target visibility.
- Storage audit: **170 call sites, zero errors**. Control audit: **278 declarations, zero unexplained shapes**.

Application checks use synthetic data. The passing sets overlap; these are execution-set counts, not a claim of distinct test totals. Screenshot capture/comparison remains advisory; no pixel tolerances were changed and no PNG references were regenerated. Only the protected-control test's responsive row-height assumption was updated: full-page margins allow unchanged labels to wrap less, while original styles, min-height, equal row heights and text containment remain asserted.

Representative captures are in this directory: Cardio, custom food, Meditation, Hydration and Routine in both themes.

## Limits

Browser verification uses Chromium and synthetic local data. Real iPhone standalone keyboard, camera permission and native safe-area behavior still require device review; emulation is not claimed as physical iOS verification. CI is left asynchronous after the PR is pushed. No merge or deployment is performed.

Visual examples: [Cardio Light](cardio-light.png) · [Cardio Dark](cardio-dark.png) · [Custom Food Light](food-tracker-light.png) · [Custom Food Dark](food-tracker-dark.png).
