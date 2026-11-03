# Form-to-page migration

All 29 requested workflows, plus the custom-food editor reached from search, now use normal routed pages: **30 workflows, 32 origin-specific routes**. Workout Add/Edit have separate Home and Routines URLs to preserve their originating interface.

## Inventory

| Workflow | Route | Existing feature owner / shared form |
|---|---|---|
| Add Workout | `/workouts/new`, `/routines/workouts/new?routine=…` | Home / Routines; WorkoutEditor |
| Edit Workout | `/workouts/edit?id=…`, `/routines/workouts/edit?id=…` | Home / Routines; WorkoutEditor |
| Create Routine | `/routines/new` | Routines; RoutineEditor |
| Edit Routine | `/routines/edit?id=…` | Routines; RoutineEditor |
| Edit Workout Duration | `/dynamic-overview/:date/duration` | Daily overview |
| Cardio Goal | `/cardio/goal` | Cardio; GoalEditor |
| Meditation Goal | `/meditation/goal` | Meditation; GoalEditor |
| Hydration Goal | `/hydration/goal` | Hydration; GoalEditor |
| Intermittent Fasting Goal | `/fasting/goal` | Fasting; GoalEditor |
| Add Cardio (formerly Log Cardio) | `/cardio/add` | Cardio |
| Edit Cardio | `/cardio/edit?id=…` | Cardio |
| Add Custom Cardio Type | `/cardio/types/new` | Cardio |
| Add Meditation | `/meditation/add` | Meditation |
| Start Meditation | `/meditation/start` | Meditation; same existing duration/start form |
| Edit Meditation | `/meditation/edit?id=…` | Meditation |
| Add Hydration | `/hydration/add` | Hydration |
| Edit Hydration | `/hydration/edit?id=…` | Hydration |
| Add Fast | `/fasting/add` | Fasting |
| Edit Fast | `/fasting/edit?id=…` | Fasting |
| Add Food | `/food-tracker/add?date=…&meal=…` | Food Tracker; existing search/history |
| Scan Barcode | `/food-tracker/scan?date=…&meal=…` | Food Tracker; BarcodeEntry |
| Create Custom Food | `/food-tracker/custom/new?date=…&meal=…` | Food Tracker |
| Add Food Entry | `/food-tracker/entry/new?id=…&date=…&meal=…` | Food Tracker; existing serving/label review |
| Edit Food Entry | `/food-tracker/entry/edit?id=…&date=…` | Food Tracker |
| Edit Food (database) | `/food-database/edit?id=…` | Food Database |
| Add Supplement | `/supplements-page/new` | Supplements; SupplementEditor |
| Edit Profile | `/profile/edit` | Profile |
| Fitness Goals | `/profile/goals` | Profile |
| Widget Settings | `/widgets/settings` | Existing WidgetSettings; entry from daily overview |
| **Additional: Edit Custom Food from search** | `/food-tracker/custom/edit?id=…` | Food Tracker; same custom-food fields |

## Overlay audit and retained exceptions

Inspected the application route tree and reachable Dialog, Sheet, ViewportOverlay, portal and custom-overlay implementations, including conditional JSX. No other qualifying data-entry overlay remains. Existing inline editors (measurements, reminders, supplement management, journal/count controls) already live on pages and remain inline. The journal composer and calculator were already routed pages.

Retained: Home Timer; routine deletion and reminder-clear confirmations; native confirm prompts; navigation drawers; dropdowns/date/time pickers; Meditation's informational Session Complete popup. Their overlay implementations and scroll locks remain active. Barcode and Custom Food action JSX is unchanged.

## Navigation and data contracts

- `form-routes.ts` is the editor route/title inventory. Feature owners remain mounted across base and editor URLs, keeping their original hooks, validation, calculations, save/delete handlers and associations.
- `FormScreen` renders only the active shared form; it does not render a background screen or portal. `FormContent` uses the existing AppHeader/PageHeader and normal app scroller. The dock is hidden while editing, as on other full-screen editor pages.
- Transient draft/context lives in React and the current browser history entry. **No new persistent key, schema, backend, migration or dependency.** IDs, dates, meal and routine context are represented in URLs. Read-only hydration reconstructs edit pages from existing persisted records on direct navigation/refresh; malformed/missing records get a safe fallback without overwriting data.
- Save returns to the originating feature/date; nested cancel returns to the previous step. Cardio custom-type creation returns to the unfinished Cardio editor; completed Food logging returns to the diary. Cancel explicitly discards; header Back, browser Back and document unload warn about unsaved changes. Widget settings retain their existing immediate-save behavior.
- A scanner draft not yet saved as a food requires the same browser history entry to recover; a new tab without its transient state safely asks the user to choose/scan again. Persisted catalog and diary IDs can be reconstructed independently.
- Existing GitHub Pages 404 path recovery remains unchanged. No PWA update, release architecture or backup changes.

## Verification

Local results (Chromium mobile emulation with synthetic fixtures):

- Application TypeScript and regression-test TypeScript: pass.
- Production build: pass.
- Unit/contract tests: **390 pass**; storage audit: **170 call sites, zero errors**.
- Affected browser regression set: **205 pass**, including production appearance, backup/restore, historical integrity, camera cleanup, create/edit flows, Timer, confirmations, navigation and safe areas.
- Reduced-viewport/field/focus checks: **25 pass**.
- Final route, goal, editor and draft-protection pass: **23 pass**, including dropdown-only changes and Back after a nested editor.
- Protected food action styles and responsive geometry: four Light/Dark × 320/390 checks pass; the Barcode/Custom Food JSX integrity contract passes.
- Material snapshots: only the two converted editor JSON references were updated for page surfaces and removed overlay/background/dock elements. No PNG references were regenerated; pixel comparisons remain advisory.

`tests/browser/routed-forms.spec.ts` covers the complete 32-route inventory in Light and Dark, 320/390px overflow, direct edit refresh, missing IDs, create/edit operations, nested workflows, settings, unsaved Back and Timer retention. Existing functional suites have been updated to address routed regions and normal scrolling instead of popup geometry; data-safety assertions remain blocking. Screenshot comparisons remain advisory, with no tolerance changes or broad reference regeneration.

Physical iPhone keyboard, camera permission and standalone safe-area behavior still require device review; desktop emulation is not a claim of native iOS validation.

Representative page captures: [Light](workout-light.png) · [Dark](workout-dark.png).
