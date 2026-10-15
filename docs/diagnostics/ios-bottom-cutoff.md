# iOS bottom cutoff: evidence required before a layout correction

Current follow-up: [system viewport experiments and phone-only access](system-viewport/README.md).
Open Menu and tap Version five times to use the opt-in tool without a Mac. The
report below records PR #13; its measurements and historical limits are retained.

## Pre-implementation report

Baseline: main at 8751a 6c (#12), iPhone 16/iOS 26 reported by the user. The screenshot
shows tiles ending at a horizontal boundary above the image bottom. It does not
supply DOM coordinates or establish which viewport dimension equals that edge.
Earlier user testing reported the issue in Safari **and** Home Screen mode, so
standalone exclusivity is not established.

**A — Findings:** `.app-content` is the intended scroll/clip element. The fixed
`.app-dock` is an independent overlay; it consumes no flex space. There is no
normal ancestor overflow clip above main. `.app-shell` is fixed and sized 100dvh;
header is a non-scrolling safe-area sibling. Inner `.app-page` adds measured dock
height only to end-of-content clearance, without reducing main's border box.

**B — Evidence:** current Chromium simulation, 390×844 CSS px, with injected app
safe areas 59/ 34, gives:

| Measurement | Before diagnostic capture | After diagnostic capture |
| --- | --- | --- |
| window inner / outer height |844 / 844 | unchanged |
| html / body client height |844 / 844 | unchanged |
| visual height / width / offset top / scale |844 / 390 / 0 / 1 | unchanged |
|100vh / 100dvh / 100svh / 100lvh |844 / 844 / 844 / 844 | unchanged |
| shell bottom / main bottom |844 / 844 | unchanged |
| main top / height |131 / 713 | unchanged |
| dock top / bottom |733 / 844 | unchanged |
| panel height |111 (latest main's internal safe area) | unchanged |
| observed physical-iPhone cutoff coordinate | **unavailable** | **unavailable** |

Full geometry/ancestor styles are in [the simulated report](chromium-portrait.json).
App safe-area values are simulated; direct `env()` measurements in Chromium are 0.
Tests verify probe cleanup and identical main geometry, scroll position and storage
before/after capture. These are diagnostic before/after measurements, **not**
measurements of a root-cause correction or proof that iPhone rendering is fixed.

**C — Root cause:** not conclusively identified on the physical device. In this
Chromium baseline main clips only at 844, the expected viewport edge. A WebKit
viewport discrepancy or paint issue remains a hypothesis. Similar screenshots or
matching several DOM boundaries do not establish causation. The referenced
[WebKit issue 254868](https://bugs.webkit.org/show_bug.cgi?id=254868) could not be
retrieved here (network proxy 403); no details from it are asserted as diagnosis.

**D — Proposed change:** add a developer-invoked static console/overlay utility,
reuse it in the existing capture script, add probe regression tests, and document
physical collection. **Do not change App, CSS, viewport guard, dock, manifest,
service-worker logic, or page wrappers without device evidence.**

**E — Risks:** a temporary diagnostic panel can cover some controls while open;
it is closable and never locks scrolling. Marking temporarily intercepts a single
tap to avoid accidentally opening a card. Probes require synchronous layout only
on manual capture; there are no scroll/resize polling listeners. Removing the tool
cleans up its panel, selection layer, marker and key listener. No fitness storage,
records or DOM text is read; nothing is uploaded. Normal navigation never imports
or starts the utility. Build precaching includes the new static file through the
existing build script, without any change to service-worker caching behavior.

## Run the developer tool on the affected iPhone

The utility is **not** an app feature or an automatically enabled overlay. It is
available at `/FitCircle/layout-diagnostics.js` after this diagnostic PR has been
reviewed and deployed. PR #13 had no UI activation; the follow-up adds the controlled Version gesture.
No URL flag activates it. It can also run
against a local developer build. Do not clear website data or remove the PWA.

1. Launch the installed FitCircle from its Home Screen icon. Open Logs and scroll
   until the cutoff is visible. Keep the software keyboard closed initially.
2. Enable Web Inspector in iPhone Settings → Apps → Safari → Advanced. On a Mac,
   enable Safari developer features, connect the iPhone and choose the **installed
   FitCircle instance** from Safari's Develop menu. Inspecting a separate Safari
   tab does not measure the Home Screen app. Inspector availability may depend on
   device/OS developer settings; if unavailable, no device measurement is claimed.
3. In that instance's console run:

   ```js
   import('/FitCircle/layout-diagnostics.js').then(m => m.startViewportDiagnostics())
   ```

4. Expand **Viewport diagnostics**, choose **Mark cutoff**, and tap the observed
   horizontal edge on the iPhone. The marker records `PointerEvent.clientY` in CSS
   coordinates, comparable with bounding rects. Cancel or Escape exits selection.
   Mark the visible edge, not the dock or the image's scaled screenshot coordinate.
5. Choose **Copy JSON** and keep a screenshot of the marked boundary. If clipboard
   access is unavailable, obtain and copy the console result:

   ```js
   JSON.stringify(window.fitcircleViewportDiagnostics.capture(), null, 2)
   ```

6. Close the tool when done. Restarting it replaces the previous instance. Rotation,
   keyboard or visual viewport changes invalidate the previous marked coordinate
   at the next capture; mark again. No app state/records are cleared.
7. Repeat in a **Safari tab**, then portrait/landscape, and after opening/closing the
   keyboard. Identify each report's environment and whether the cutoff was visible.
   Check `standaloneMedia`/`standaloneNavigator` rather than relying on the tab name.

For a console report without any visible overlay:

```js
import('/FitCircle/layout-diagnostics.js').then(m => {
  console.log(JSON.stringify(m.captureViewportGeometry(), null, 2));
});
```

An explicitly known CSS cutoff coordinate may be supplied as
`captureViewportGeometry({ cutoffY: observedCssCoordinate })`. Without a marked or
supplied observation, the report deliberately leaves `observedCssY` null and does
not claim to detect a paint boundary automatically.

## What the report contains

- inner/outer/window width, html and body client heights, DPR, standalone signals,
  visual viewport height/width/top/left/scale, screen/orientation metadata.
- Temporary rendered 100vh/dvh/svh/lvh probe heights and support flags. Unsupported
  units report null, not a misleading zero/fallback height.
- Actual environment insets separately from resolved app `--safe-*` variables.
- Shell, header, scrollport, inner page, dock and panel rectangles and computed
  overflow, positioning, four-sided padding/margins, height/min/max-height, scroll
  height/client height/scrollTop, transforms, filters, containment and clip paths.
- Full scrollport ancestor chain, possible fixed-position containing blocks, entry
  script identifier and current SW controller URL to identify an older running
  shell. These are public build metadata; caches/registrations are not changed.
- Observed cutoff compared with main/shell/dvh/inner/visual/dock/panel bottoms,
  including signed differences and **all** matches within 1 CSS px. A coincident
  match is evidence for further investigation, not an automatic root-cause verdict.

## Interpret the affected-device evidence

| Observation | Investigation / smallest candidate correction |
| --- | --- |
| Main ends before shell, and cutoff matches main | Inspect measured flex/min/max heights and padding; correct that measured constraint. Keep end clearance separate. |
| Shell/dvh end before inner bounds, scale 1 and no keyboard | Verify the discrepancy in both modes and on relaunch; only then choose a justified resting-shell source and scope. Never blindly add the safe-area height. |
| An ancestor clip/paint containment ends at the observed edge | Confirm that ancestor actually owns the clip before removing/changing it. |
| Visual bounds shrink only with editable focus | Preserve keyboard/overlay occlusion behavior; don't turn that height into an idle shell source. |
| DOM rects all extend beyond the observed painted edge | Investigate WebKit compositing/occlusion separately. Bounding rectangles cannot prove the compositor painted pixels; compare temporary inspector layer changes, not speculative committed offsets. |
| All candidates match the same coordinate | They do not uniquely identify the cause. Compare actual unit discrepancies and physical screenshots; dock coincidence is not proof the dock clips. |

The application architecture remains: CSS resting shell; main as the only page
scrollport; opaque non-scrolling header; fixed independent dock; measured end
clearance inside page content. The guard still uses visual bounds only for overlays
and genuine keyboard occlusion. No remount, storage reset, footer or gradient mask.

## Physical acceptance checklist

- [ ] Launch from Home Screen; open Logs and confirm report is standalone.
- [ ] Move content behind/below the dock toward the actual screen bottom with no
      early horizontal cutoff. Check a card crossing the boundary, not only page end.
- [ ] Scroll the final Logs tile fully above the dock and tap it.
- [ ] Repeat on Home, Calendar, Routines and Reminders; final Routine card clears dock.
- [ ] Open/close calculator and sidebar; close buttons and header remain accessible;
      background lock releases and the page does not jump.
- [ ] Open/close keyboard, switch tabs, rotate if supported; no persistent offset.
- [ ] Close/relaunch the installed PWA; repeat in Safari and compare reports.
- [ ] Dock stays fixed and does not resize during ordinary page scrolling.

No physical item above was performed in this environment. Physical acceptance,
root-cause correction, and a permanent-fix claim are **pending device evidence**.
Passing Chromium tests is not completion of the user's definition of done.

## Automated validation

TypeScript, 29 unit tests, production build and 39 Chromium Playwright tests pass.
Existing 35 viewport/fitness/overlay/offline tests remain intact. Four added tests
verify default inactivity, all probe metrics/unit heights, separate env/app insets,
no geometry/scroll/data mutation, temporary probe removal, touch marking without
navigation, stale-coordinate handling, cancellation and restart/close cleanup.
No actual Safari/WebKit/Firefox/Android run is claimed.
