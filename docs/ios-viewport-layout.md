# Viewport and overlay layout contract

There are two independent bottom requirements: the scroll **surface** reaches the
viewport edge, while end-of-page **clearance** lets the last card rise above the
floating dock. A footer or spacer must not shorten the surface.

## Measured cause and correction in #5

On main after #4 (`b135297`), `.app-dock` was a relative flex item. It reserved
123 CSS pixels in the shell at a simulated 390×844 viewport with safe areas of
59px/34px. `.app-content` has `overflow-y: auto`, so its border box was the exact
clipping boundary at y=721. The shell ended at y=844. This was a real DOM clipping
boundary, not inadequate end padding. The opaque footer masked the region below
it rather than allowing content to paint there.

`getBoundingClientRect()` and computed-style measurements (Chromium simulation):

| Element / metric | Main after #4 | #5 correction |
| --- | --- | --- |
| `window.innerHeight` / document client height | 844 / 844 | 844 / 844 |
| visual viewport height / offset top | 844 / 0 | 844 / 0 |
| `.app-shell` top → bottom | 0 → 844 | 0 → 844 |
| `.app-header` top → bottom | 0 → 131 | 0 → 131 |
| `.app-content` top → bottom | 131 → 721 | 131 → 844 |
| `.app-dock` top → bottom | 721 → 844 | 721 → 844 |
| rounded navigation top → bottom | 721 → 810 | 721 → 810 |
| dock position / background | relative / opaque | absolute / transparent |
| outer ancestor overflow | hidden | visible |

In #5 the dock became an absolute overlay within the shell; it consumes no flex height.
That correction preserved its position and navigation styling at the time. The
home-indicator area beneath it is transparent to scrolling content. The main
scrollport remains unpadded. Its inner `.app-page` reserves the measured full dock
height plus the existing 16px gutter **only at the end of the content**. The
measurement already includes the safe area; do not add it again. Without a dock,
use the bottom safe area plus the gutter. `scroll-padding` uses the same clearance
for scroll-into-view behavior without changing the main border box.

`html`, `body`, `#root`, and `.app-shell` no longer add redundant overflow clips.
They are not the app scroller. The fixed shell and its main child provide scroll
containment; `.app-content` is the only clipping/scrolling surface in the page
hierarchy, ending at the viewport bottom. Remove the obsolete
`-webkit-overflow-scrolling: touch` compositing hint on that surface; modern iOS
provides momentum scrolling without it. Dialog/sheet scrolling is unchanged.

These measurements establish the cause on **current main**. They do not establish
why the physical iPhone showed a shorter painted surface before #4. Removing
redundant ancestor clips removes an additional possible clipping dependency, but
is not a proven diagnosis of that earlier WebKit behavior. The user reports an
iPhone 16 affected in both Safari and the Home Screen app; iOS version is unknown.
Physical acceptance remains pending until the updated surface is checked there.

## Lower dock placement follow-up

The dock is now fixed directly to the viewport, with an 8px gap beneath its
rounded lower edge. This is a requested visual spacing change, not a global
viewport offset. Home-indicator clearance moves inside the navigation panel via
`padding-bottom: max(12px, var(--safe-bottom))`, instead of leaving that whole
safe area empty below the panel. Colors, width, radius, icons and interactions
stay the same. The panel grows internally on notched devices to keep buttons
above the gesture area. Its ResizeObserver measurement includes the internal
safe area and outer gap, so final-card clearance follows automatically. No shell,
header, viewport-guard, overlay or storage changes are needed.

## Viewport and overlay rules

- The resting shell uses CSS `100dvh` (`100%` fallback). Do not subtract dock or
  safe-area heights from it. No JavaScript resting-shell size is introduced.
- `useIOSViewportGuard` is inspected and retained: visual viewport height/top are
  for overlays and genuine keyboard occlusion, not idle shell sizing. A focused
  field needs both a new visual-height reduction and layout occlusion before
  keyboard sizing applies. Existing cleanup and frame coalescing remain.
- CSS layout bounds, `100dvh`, visual viewport bounds, and physical screen bounds
  are not assumed interchangeable. A simulated visual/layout mismatch must not
  shrink or pan the resting shell.
- The header remains a non-scrolling sibling above main, with its opaque safe-area
  background. Page-owned controls render through `AppHeader` without losing state.
- Portalled dialogs/sheets use visual bounds and safe areas independently. Their
  headers and 44px close controls stay outside their own scroll bodies. Existing
  reference-counted locks prevent main scrolling behind open overlays.
- Normal viewport changes never remount React, clear storage, or reset user data.
  Avoid global touchmove cancellation; it blocks native controls/overlay scrolling.

## Automated verification

`tests/browser/scroll-boundaries.spec.ts` checks top safe-area coverage, all shared
headers, complete main/dock geometry, real-tile IntersectionObserver visibility
through the viewport bottom, final Logs/Routines cards, dock invariance during
scroll, no outer clipping ancestors, dynamic resizing, and visual/keyboard bounds.
Portrait, landscape, and desktop cases attach geometry JSON and a screenshot of
content below the dock. The three new boundary cases fail against the main build
and pass with this correction.

`tests/browser/viewport.spec.ts` retains Home, Logs, Routines, all sidebar sheets,
Food Tracker's calculator, nested dialogs/selects, custom goal cards, rotation,
editing-state preservation, scroll recovery, and desktop coverage. Other suites
retain offline, update, backup and fitness behavior checks.

All these runs use Chromium, including injected safe areas and visualViewport
properties. They do not run iOS Safari, model browser chrome/compositor behavior,
or prove physical standalone screen coverage. No Apple Fitness comparison image
was available in the current upload, which contained the textual request.

## Physical iPhone review and measurement

Before merging, check the affected iPhone 16 in both Safari and Home Screen mode:
scroll with a tile crossing the bottom edge (not just at page end); verify content
is visible behind and below the unchanged dock, with no early cutoff. Bring the
final Logs tile and Routine card fully above it. Test rotation, resume, keyboard
open/close, sidebar and calculator, including restored background scrolling. Do
not clear website data to test an update.

If the cutoff persists, use Safari's remote Web Inspector on the affected instance
and run this read-only snippet while the cutoff is visible. Repeat with the
keyboard closed/open and in each orientation. It reads layout only, not fitness
records or storage. Compare `.app-content.bottom`, `.app-shell.bottom`, ancestor
bounds and actual viewport measurements rather than guessing a new offset.

```js
(() => {
  const rows = [];
  for (let el = document.querySelector('.app-content'); el; el = el.parentElement) {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    rows.push({ element: el.id || el.className || el.tagName,
      top: r.top, bottom: r.bottom, height: r.height,
      overflow: s.overflow, position: s.position, transform: s.transform,
      clipPath: s.clipPath, contain: s.contain });
  }
  console.table(rows);
  return { innerHeight, clientHeight: document.documentElement.clientHeight,
    visualHeight: visualViewport?.height, visualTop: visualViewport?.offsetTop,
    standalone: matchMedia('(display-mode: standalone)').matches,
    keyboard: document.documentElement.classList.contains('keyboard-open') };
})();
```
