# Viewport and overlay layout contract

The shell, dock, headers, and portalled overlays share safe-area insets, but
layout and visual viewports have different jobs. Keep these rules together when
changing layout.

- The resting shell fills its CSS fixed containing block using `inset: 0`.
  Its main scroller extends to that same bottom edge. Do not size or offset the
  entire resting shell from `visualViewport.height`/`offsetTop`: iOS standalone
  can report different visual bounds even with no keyboard. CSS layout bounds,
  dynamic viewport units, and physical screen dimensions are not interchangeable.
- `useIOSViewportGuard` publishes `--overlay-height` and `--overlay-top` from the
  visual viewport for portalled overlays. The shell temporarily follows those
  bounds only when a focused editable control has both a new visual-height
  reduction from the idle baseline and layout-viewport occlusion. Focusing a
  field alone must not treat an existing discrepancy as an open keyboard.
  Resize, orientation, focus, and pageshow events share one cleaned-up animation
  frame. Normal viewport changes never remount React or reset scroll/state.
- The shell owns the top and side safe areas and explicitly paints their opaque
  dark background. The main scrollport has no top padding. The existing 16px
  content gutter lives in the normal-flow `.app-page` wrapper, preserving initial
  spacing while allowing sticky headers to meet the very top of the scrollport.
  No extra z-index, pseudo-element mask, or global offset is needed.
- The dock owns its bottom safe area. A ResizeObserver measures its full rendered
  height. Main content reserves that measurement, or the bottom safe area when
  the dock is absent, plus the normal content gutter. Do not add the bottom inset
  to the measurement again. The dock remains floating: end padding makes the
  final item reachable without shortening the scrollport or preventing content
  from passing behind the dock.
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

`tests/browser/scroll-boundaries.spec.ts` additionally samples the painted and
hit-tested top region at multiple Logs scroll positions, models a 710px visual
viewport within an 844px layout viewport, checks a real tile's visible intersection
at the screen edge behind the floating dock, verifies final Logs/Routines items,
and exercises keyboard/panning and orientation recovery. These fixtures model
reported failure conditions; they do not measure physical iPhone screen geometry.

Before merging, check on an actual notched iPhone in both Safari and installed
standalone mode: launch and resume; scroll every final card above the dock; open
and close sheets; rotate; focus and blur calculator inputs with the software
keyboard; scroll long dialogs; and open/close nested overlays. Check status-bar
and home-indicator clearance, active-input visibility, focus return, and restored
background scrolling. iOS keyboard animation, auto-zoom, browser bars, and
rubber-band behavior still require real-device verification.
