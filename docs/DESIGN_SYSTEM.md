# FitCircle presentation standard

This is the consolidation of FitCircle's approved modernized screens, not a replacement theme. Tracking components continue to own their state, calculations, labels, navigation, and persistence.

## Foundations

Use `appearance.css` semantic channels through Tailwind or `hsl(var(--…))`. Dark navy canvas and slate surfaces, the Light palette, and System resolution stay in the existing appearance controller. Do not add per-page theme detection. Primary action fills use the existing solid-action role for readable white labels. Bright selected fills use the separate `--on-selected-action` foreground (dark ink in Dark appearance, white in Light); their hover fill retains readable foreground feedback. Feature accents stay green for supplements/actions, amber for energy, orange for recovery, and the existing blue/purple/cyan/etc. for their respective features. Configured workout colors and the green completion check remain unchanged.

General UI uses `--font-interface` (system sans-serif). Numerical summaries use `.type-metric` / `--font-metric` (JetBrains Mono and tabular figures). Numerical input controls retain their established fonts and native behavior. Inline quantities can remain sans-serif where they form a sentence or checklist label.

Use the 4px spacing scale in `index.css`: `--space-1` through `--space-6` are 4/8/12/16/20/24px. Tailwind equivalents remain valid. Content-driven larger spaces are allowed for charts, reading, and active timers; do not introduce arbitrary offsets to compensate for the dock.

## Page headers

`PageHeader` in `components/ui/presentation.tsx` supplies a 20px/600 title, 44px back target, a 56px row, and a 20px separation from content. It accepts the existing `onBack` callback rather than deciding where navigation goes. Equivalent secondary pages use this component, including the four Wellness tracking shells.

The app shell supplies the 16px page gutter once. `.fitcircle-container` constrains width without adding a second gutter or top inset. Fixed headers retain their existing 16px top inset; in-flow secondary headers now align with them. Centered titles reserve equal side columns. Pass `sideWidth` when a header has two actions or a labeled Goal control. Titles wrap instead of colliding with actions at 320px. `align="start"` is for Dashboard detail headers and long analytical/recovery-tool headings. Portalled headers still use `AppHeader`; this component does not change the shell or scroll ownership.

Primary Home/Calendar/Routines/Wellness/Reminders wordmarks and hub headings retain their established sizes. The journal library's editorial title and full-page composition toolbar remain intentional variants. Do not replace them with secondary-page headers.

## Surfaces and hierarchy

- `.fc-section`: standalone settings/Wellness card; semantic surface and separator, 20px radius, 16px padding (12px below 350px). Page-owned classes may provide an established feature tint or layout. It adds no shadow or gradient.
- `.fitcircle-card-lg`: general standalone information card, now the same 20px/16px geometry. Existing material tokens are retained.
- `.fitcircle-card`, dense food rows, routine exercise rows: compact nested content, typically 12px radius and 12–16px padding.
- `.fc-history-row`: outlined actionable/informational row, 14px radius, 10px padding, minimum 58px height. It supplies no click behavior or chevron.
- Dynamic Overview retains compact 14px panels; its multiple daily editors are denser than standalone tracking pages. Home workout cards retain their approved 18px radius and ring layout.

Section headings are usually 16px semibold/bold; grouped settings eyebrows are 12px semibold uppercase. Supporting copy is 12–14px with a 1.5 line height; compact metadata may use 11px. Preserve clear hierarchy rather than assigning the same size to every label. Chart ticks can remain 9–10px within their established charts.

## Controls

The existing `Button`, `Input`, and `SelectTrigger` defaults use 44px height; inputs/selects/textareas use 12px corners. Explicit compact overrides (e.g. the workout editor's three-column inputs, day picker, search clear action) remain available and are not expanded indiscriminately. They retain their existing accessible names and touch behavior. `size="icon"` is 44×44px. Use the existing `primary`, `outline`, `secondary`, `ghost`, `danger`, and `quiet-destructive` variants, or a page's established accent classes. Legacy default buttons inherit page-owned colors; do not recolor feature actions by changing that compatibility variant.

`.fc-action` provides the existing pill-action geometry for modernized standalone pages; add `.fc-action-primary` or `.fc-action-secondary`. These classes never attach handlers, disable submission, or write data. Disabled controls keep their existing disabled conditions and visual dimming.

`PeriodSelector` is controlled: callers provide labels, values and callbacks. It uses ordinary buttons in a labeled group with `aria-pressed`, matching the existing interaction. Every option is keyboard reachable. Use the inline variant for a period choice embedded in an activity header. It does not calculate dates or change filtering semantics.

Focus is visible for keyboard operation. Retain the shared contained field-focus rule in `glass.css` for dialogs: an external ring would be clipped by the body scroller. Pointer focus must not introduce a persistent white outline on close controls. Never remove keyboard focus to fix pointer focus.

## Metrics, history and states

`MetricTile` / `.fc-metric` supplies a minimum-width-safe numerical tile, a responsive 16–22px tabular value, an 11px caption, 12px corners and semantic secondary surface at 55% opacity, retaining accent-value contrast on narrow tiles. `.fc-metrics` supplies three equal columns with 8px gaps. Description-list markup can reuse the same CSS without replacing `dt`/`dd` semantics (Profile).

Do not force macro summaries, the two-column Workout Statistics definition list, calendar charts, or workout ring counters into this pattern: their primary units, space needs and semantics differ. Progress visualizations keep their existing helper calculations, units, clamping and accessibility values. No design component is a source of truth for progress.

`EmptyState` / `.fc-empty` supplies compact secondary text and a quiet surface, with 20px vertical padding. Preserve feature-specific guidance and action controls. Inline empty meal labels remain inline; they are not standalone empty cards. Loading, failure and success messages retain existing roles, lifetimes, and retry/confirmation behaviors.

## Overlays and mobile layout

Shared Dialog defaults are compact: 16px padding, 20px corners, 18px semibold title with readable line height. Explicit form-specific widths/padding, fixed footers, the custom goal-card wrapper, nested Select portals, focus traps and keyboard viewport protections remain intact. Sheets retain their established side attachment and safe-area geometry. Food notifications use compact 16px padding/12px corners and a visible 44px dismiss target; keep message lifetimes and error handling unchanged. Browser-native confirmations stay native; never replace a stronger safeguard for styling consistency.

The app shell owns `--safe-*`, `--dock-height`, scroll locking and keyboard viewport measurements. Secondary pages must not introduce another dock or scroll root. Use content-driven heights, `min-width:0`, and wrapping for names and large numbers. Do not hide overflow to conceal a layout defect. Reduced-motion, forced-color, and reduced-transparency safeguards remain in the existing shared styles.

## Verification and future work

The route inventory in `tests/fixtures/visual-routes.ts` is checked against every explicit App route plus the fallback. `design-consistency.spec.ts` visits the complete inventory in Light/Dark at 320/390px. The matrix also asserts visible icon-action names and text contrast in both themes. The contrast helper checks actual linear-gradient stops, not a transparent fallback. Existing tests remain responsible for feature calculations, persistence, dialogs, navigation, contrast, focus, viewport shrink, and exact screenshots. Update visual references only for reviewed presentation changes, with zero-difference assertions retained.

Before adding a new style, inspect the primitives above and the existing feature shell. Extract another component only when repeated structure benefits; do not wrap unrelated behavior into a generic settings or tracking framework.
