# React and TypeScript architecture

Vite builds a browser-only React 18 application. App owns the router, opaque header portal, scroll shell, lock provider and floating dock. Pages own forms and feature hooks; hooks usually own independent React state backed by localStorage. Backup validation is centralized in Zod plus a registry; food migration is a singleton service. This is a workable small-app structure, but hook-local persistence is a weak shared-store abstraction.

FC-006 is a proven selector mutation: getAvailableWidgets sorts widgets itself. Batch A copies the array before the same stable comparator, leaving object identity, position values, visible sorting and stored data intact. Enabled widgets already filter into a new array. Other sorts were reviewed: filter/map/Object.values results are generally copied; do not replace every sort mechanically.

FC-009/010 expose stale closures and unstable callback dependencies. FC-005 is the broader multi-writer risk. Most listeners/intervals have cleanup; the viewport guard coalesces frames and clears scheduled recovery work. Meditation AudioContext cleanup remains unverified. Polling calculator/macro settings every 2 seconds causes repeated parsing/renders even with no change; optimize only after coherent subscriptions exist. Source-level any and casts weaken shape validation, notably food tracker, date grouping, historical logs and overview. Strict TypeScript passes; optional unused-symbol checking reports160 diagnostics, not160 confirmed removable exports.

## Widget integration decision

Home currently renders its own workout/session/quote/timer arrangement rather than WidgetRenderer/WidgetSettings. The static graph includes type relationships; hook reachability through a DashboardWidget type does not prove runtime mounting. Renderer goals/recent cases are placeholders. Concrete GoalsWidget depends on legacy goal utilities with assumptions inconsistent with current meditation log shape; integrating it blindly would add behavior risks. RecentActivityWidget **is active in Calendar** and must stay. Retain all components and saved widget keys. A later integration PR needs a user-visible contract, modern-schema fixtures, all widget types, order/visibility/reset tests and keyboard access. Do not eliminate placeholders by deleting capabilities.

## Incremental boundaries

1. Establish tested, pure selectors and parsers at existing interfaces.
2. Correct migration/initialization defects individually with old-format fixtures.
3. Introduce one writer/subscription per data domain without changing serialized formats.
4. Extract shared header/sidebar/navigation and meal sections only after parity tests.
5. Separate calculator inputs/formulas from rendering, retaining constants, rounding and defaults until proven corrections.

Food Tracker 2,237 lines, workouts 959, home 797, cardio 763, calendar 748, meditation 703 and fasting 652 are maintenance hotspots. Similar sidebar return logic, food meal markup, color maps and statistics formulas are consolidation candidates. No broad extraction in batch A. Static/literal import graph had no demonstrated cycle requiring action; this is not proof about arbitrary reflection. App lacks a feature-scoped error boundary; global safe-reload recovery catches the invalid-date crash but cannot repair a bad URL (FC-016). Add parameter validation first, then boundaries that preserve drafts and never erase storage.
