# Application-wide consistency audit

Baseline: main `2350d60`, published v2.15.1. The audit examines the 33 routed states (32 explicit routes plus fallback), their imported presentation graph, and conditional overlays. `source-inventory.json` records 73 imported TSX sources and their heading/control/overlay/geometry patterns. This includes error boundaries, nutrition components, shared controls, Dashboard, and the currently used Recent Activity widget; disconnected legacy widget implementations are not new reachable pages.

## Findings and corrections

| Repeated pattern | Drift found | Correction |
| --- | --- | --- |
| Secondary headers | Ad hoc flex/grid positioning, 20px icon-only back hit areas, 20/24/30px titles and 20/32px bottom gaps | Shared PageHeader, balanced action columns, 44px back target, 20px title and spacing; existing callbacks preserved |
| Page gutters | Shared container adds a second 16px horizontal gutter and 24px top inset inside the already padded app shell | Shell owns the page gutter once; equal 56px header rows align fixed and in-flow secondary titles |
| Standalone sections | Energy/Recovery/Supplements/Settings independently repeat 20px radius/16px padding; legacy information cards use 12px/24px | Shared `.fc-section` and geometry tokens; information-card geometry aligned; feature tints retained |
| Period selectors | Energy/Recovery duplicate styles and 40px targets; four Wellness trackers have separate equivalent period rendering | Controlled PeriodSelector, 44px targets, common selection/focus conventions; compact inline variant |
| Summary tiles | Energy/Recovery duplicate grids; unequal padding, 10px captions, mixed numerical typography; Profile repeats a third variant | MetricTile/shared CSS; Profile retains its semantic description list; consistent spacing, tabular values and captions |
| Modern actions | Three page stylesheets repeat pill dimensions, primary/secondary surfaces and disabled/focus treatments | Shared action classes; existing form handlers, labels, states and feature accents retained |
| Empty history | 16/32/64px empty padding and repeated muted-text rules | Compact common empty-state surface for standalone Wellness/journal/supplement history; feature guidance retained |
| Form primitives | Button/Input 40px, small buttons 36px; Select/Textarea corners differ | Shared 44px defaults and 12px corners; existing intentional compact overrides retained |
| Dialog chrome | 24px default padding versus compact forms' 16px, tight title line height, pointer-visible close focus | Compact default chrome and keyboard-only close ring; focus/scroll/keyboard machinery unchanged |
| Dark contrast | Some muted labels on secondary surfaces, small colored metric values, action fills and bright selected-action labels fall below normal-text contrast | Reuse solid-action/supporting-text roles, add selected-action foreground role and text-only Wellness accents; retain feature hue identities and all ring/calendar completion colors |
| Icon actions | Nine visible Calendar/nutrition/Cardio icon buttons have no accessible name; some targets are only 20–24px | Add labels and shared 44px targets; Calendar period layout and Cardio rows wrap safely without changing navigation or tracking |
| Narrow Hydration form | Four liquid columns and an intrinsic-width amount wrapper overflow at 320px | Two liquid columns on narrow screens, shrinkable amount field; handlers unchanged |
| Supplement selector label | Visible Measurement Type label lacked its matching trigger ID | Bind the existing label to its control; no form/data changes |
| Toast chrome | Oversized padding and hover-dependent, small dismiss affordance | Compact 16px/12px chrome with a visible 44px dismiss control; message lifetime/handlers unchanged |
| Recovery tool | Restore Custom Foods uses a separate deep-black page and ad hoc header | Common page background/header/section surface; restoration logic untouched |

## Route-by-route disposition

Each row is included in both themes and both widths in the route matrix. “Retained” means source and rendered state were audited and no unnecessary equivalent-pattern difference was found; it does not mean the route was omitted.

| Routes / source | Resolution or intentional exception |
| --- | --- |
| Home (`home.tsx`) | Approved wordmark, 18px workout cards, ring/check cue and dock retained; timer/editor inherit shared control chrome |
| Calendar (`calendar-new.tsx`) | Wordmark, completion/recovery colors, dense date grid and analytical bars retained; Dashboard sheet shared |
| Fitness Profile (`profile.tsx`) | Shared leading header and summary-tile geometry; description-list semantics/full-value titles retained |
| Measurements (`measurements.tsx`) | Shared header/back target; information cards aligned; horizontal chart carousel stays intentionally scrollable within its own container |
| Fitness Calculator (`fitness-calculator.tsx`) | Shared header; calculator-specific segmented tabs/inputs/result summaries retained |
| Fasting (`fasting.tsx`) | Shared Wellness header/period controls, compact empty history, inherited entry/goal chrome; active-fast presentation retained |
| Meditation (`meditation.tsx`) | Same common tracking-shell changes; active session timer and completion overlay retained |
| Hydration (`hydration.tsx`) | Same common tracking-shell changes; quick-add quantities and daily entry actions retained |
| Food Tracker (`food-tracker.tsx`) | Shared balanced header reserves two actions; nutrient/macro hierarchy and meal groups retained; form chrome shared |
| Food Database (`food-database.tsx`) | Shared header and accessible back target; food rows intentionally compact; editor inputs/dialog chrome aligned |
| Restore Custom Foods (`restore-custom-foods.tsx`) | Common background/header/section; existing restore action, feedback and destination unchanged |
| Cardio (`cardio.tsx`) | Shared tracking-shell header/periods and empty history; nested type editor, goals and entry forms inherit shared controls |
| Workout Statistics (`workout-statistics.tsx`) | Shared leading header; two-column `dl` and full-width consistency progress retained for large totals |
| Daily Journal (`daily-journal.tsx`) | Shared header and accessible history action; original discard confirmation and explicit save behavior retained |
| Journal library (`journal-log.tsx`) | Compact empty state; editorial title, grouped entries, sticky search/compose retained |
| Journal composer (`journal-entry.tsx`) | Full-page toolbar, no dialog, plain text field/focus and keyboard-safe save retained |
| Energy (`energy-level.tsx`) | Shared header, sections, metrics, periods, actions and empty state; draft/save/undo/labels unchanged |
| Supplements (`supplements.tsx`) | Shared header, section/action/empty styles; checkbox rows and quantity/management behavior retained |
| Recovery (`recovery.tsx`) | Shared header, sections, metrics, periods, history-row shape and empty state; calculations/filter callbacks unchanged |
| Dynamic Overview (`dynamic-overview.tsx`) | Shared header; 14px compact daily editor cards and existing tabs retained; duration dialog inherits controls |
| Routines (`routines.tsx`) | Approved wordmark, exercise hierarchy, collapse/management and compact schedule editor retained; shared form chrome applies |
| Wellness (`wellness.tsx`) | Hub layout and feature identities retained; no secondary header forced onto hub |
| Reminders (`reminders.tsx`) | Approved wordmark, inline draft, completion groups and dock-safe add action retained; confirmation chrome aligned |
| Account Data and Display (`settings.tsx`) | Shared portalled secondary header, section geometry and pill actions; visibility bindings/backup/deletion/update handlers unchanged |
| Share (`share.tsx`) | Dashboard header/information-card geometry aligned; QR stays deliberately black-on-white for scanning |
| Terms and Privacy (`legal.tsx`) | Dashboard header aligned; long-form reading typography/content and links retained |
| Licenses (`legal.tsx`) | Dashboard header/information cards aligned; expandable legal notices retained |
| Release History (`release-history.tsx`) | Dashboard header/information cards aligned; metadata, dates and release loading untouched |
| About (`about.tsx`) | Dashboard header/information card aligned; compact version/build/date row and history link retained |
| Compatibility Settings (`settings.tsx`) | Shared header/information cards/control defaults; compatibility controls and stronger erase confirmation retained |
| Not Found (`not-found.tsx`) | Shared card chrome; centered error presentation retained |

## Shared components and overlays

Reviewed AppHeader/DashboardPage, DashboardMenu/SidebarProfileCard, BottomNavigation/DockNavigation, QuoteOfTheDay, RecentActivityWidget, FoodNotifications/Toast, both data-recovery boundaries, GoalCircle/workout ProgressCircle, TimerWheel, DaySelector, WellnessHistory/WellnessUI, and all seven nutrition presentation components. Shared primitives are enumerated in the machine inventory.

Overlay families inspected: workout/routine create-edit and deletion confirmation; profile/goals; Home timer; Dashboard sheet; nutrition search/barcode/custom-food/food-entry/edit-entry; food-database editor; Cardio entry/nested type/type deletion/edit/goals; Hydration entry/edit/goals; Fasting entry/goals; Meditation entry/edit/active timer/completion/goals; Supplements form/select; Dynamic Overview duration; Reminders clear-completed; native browser destructive/discard confirmations. Existing field/keyboard tests and feature suites verify the handlers; the presentation pass does not replace native confirmations or build new editors.

Intentional exceptions: charts/QR visuals, feature-specific colors, large analytical totals, hub wordmarks, editorial journal toolbar, nested compact inputs/day selections, active timers, and compact inline daily summaries. These are different uses, not unresolved copies of the same pattern. Unreachable legacy widgets remain technical debt outside the reachable UI; no navigation is added to expose them.
