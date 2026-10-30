# Fasting Goal: today and historical context

Only the Fasting Goal modal's summary content changes. It uses the same shared ring/summary arrangement as Cardio, Meditation and Hydration. The ring reads `Today`, and the adjacent summary reads `Today’s fast`, the completed duration against the input goal, and `Completed today`.

The existing `useFasting` statistics already calculate today's longest qualifying completed fast by its local end date. The modal now uses `stats.todayHours` against the current goal input, through the existing safe/capped percentage helper. Historical records cannot advance today's ring. Existing hook updates recalculate derived statistics after additions, edits or deletions; no new storage or calculation source was added.

A compact panel below the row shows the existing all-time completed-fast average, rounded with `Math.round(average * 10) / 10` and displayed with one decimal. Empty history says `No completed fasts yet`. This value is independent of today's progress.

Shared `GoalSummary` adds an optional caption; other modals retain their defaults. The sheet, header, fields, explanations, settings handlers, maximum heat-bar scale and footer remain unchanged. Fasting-only panel styles use existing appearance tokens; no dependencies, record/schema changes, migrations or backend.

## Essential validation

- Application and regression TypeScript: pass.
- Production build: pass.
- Existing focused fasting-completion tests: **8/8 pass** (local-end-date credit, longest completion, invalid/unfinished/future records, invalid targets, edit/delete derivation and midnight/timezone cases).
- Focused modal browser checks: **2/2 pass**, Light/Dark at 390×844. Historical-only history gives 0% today and a 14.4-hour average; multiple today records use the longest; changed/deleted records recalculate; percentages cap safely and empty goals give 0%; averages round to one decimal; empty history is explicit. No horizontal overflow; Save remains reachable through scrolling.
- Representative [Light](light.png) and [Dark](dark.png) captures use synthetic records. Physical iPhone verification unavailable. No exhaustive screenshot comparisons or unrelated audits.

Classification: `release:patch`. Normal CI runs asynchronously. Not merged or deployed.
