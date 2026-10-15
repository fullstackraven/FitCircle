# Viewport and overlay layout contract

The shell, dock, headers, and portalled overlays use one set of viewport and
safe-area variables. Keep these rules together when changing layout.

- `useIOSViewportGuard` publishes visualViewport height and top offset (CSS `dvh`
  with a `vh` fallback before initialization). Resize, orientation, focus, and
  pageshow events share one animation-frame update and cleaned-up listeners.
  Normal viewport changes never remount the React tree or reset scroll/state.
- The shell owns the top and side safe areas. Navigation-page headers are sticky
  children of the main scroller and occupy normal flow, without duplicate top
  insets or compensating page spacers.
- The dock owns its bottom safe area. A ResizeObserver measures its full rendered
  height. Main content reserves that measurement, or the bottom safe area when
  the dock is absent, plus the normal content gutter. Do not add the bottom inset
  to the measurement again.
- Radix sheets and dialogs are portalled outside the shell. They independently
  consume the same visual viewport and safe-area bounds. Dialog headers and close
  controls stay outside the scrolling body. Sheet close controls stay outside the
  sheet's scrolling body. Close targets are at least 44 by 44 CSS pixels.
- Existing custom goal cards use ViewportOverlay for the same bounds, focus
  containment, and background locking. Nested overlays acquire independent locks
  and release on unmount; no page manually toggles document overflow.
- CSS owns overscroll containment. Avoid document-wide touchmove cancellation:
  it blocks legitimate scrolling inside dialogs and native controls.

Previously, safe-area and fixed-header spacers accumulated; dock clearance was a
fixed estimate; tall centered dialogs used layout-viewport heights; and global
touch handlers and manual scroll locks competed with Radix. The shared contract
removes those conflicting sources without changing fitness storage or calculations.

## Verification

`tests/browser/viewport.spec.ts` covers Home, Logs, Routines, all navigation sheets,
Food Tracker's calculator, nested cardio dialogs and selects, custom goal cards,
rotation, retained editing state, and desktop layout. The mobile tests use
Chromium emulation and explicitly injected safe-area variables. Keyboard tests
simulate visualViewport resizing/panning. Neither constitutes real iOS testing.

Before merging, check on an actual notched iPhone in both Safari and installed
standalone mode: launch and resume; scroll every final card above the dock; open
and close sheets; rotate; focus and blur calculator inputs with the software
keyboard; scroll long dialogs; and open/close nested overlays. Check status-bar
and home-indicator clearance, active-input visibility, focus return, and restored
background scrolling. iOS keyboard animation, auto-zoom, browser bars, and
rubber-band behavior still require real-device verification.
