# PR #53 pre-merge review

This amendment preserves Food Tracker 2.0. It adds serving explanations, narrow normalization safeguards, an additional camera lifecycle handler and focused tests. It does not change storage formats, dependencies, the backup engine, PWA/deployment settings or unrelated features.

## Findings and amendments

| Requirement | Review result |
| --- | --- |
| API compatibility and CORS | URL matches the documented public v3 product GET endpoint. The fetch uses `mode: cors`, omits credentials and sends no application-defined headers that would require preflight. App/version/contact identification remains in query parameters; browser JavaScript cannot reliably customize User-Agent. Provider acceptance of that identification must still be confirmed. |
| Response normalization | Existing v3 and legacy adapters retained. Ambiguous multipack text such as `2 × 30 g` now stays one unspecified serving rather than acquiring a guessed 30 g weight. A bounded salt label such as `< 0.5 g` no longer generates an exact sodium total. Non-string/mismatching returned codes are rejected. Positive trace values are preserved rather than decimal-rounded into zero. |
| Camera lifecycle | Existing owned-stream startup, permission-denial fallback, decoder formats, muted inline video, stop/success/unmount/visibility/error and late-permission cleanup reviewed. `pagehide` now also stops the stream and returns to explicit Start Camera, covering Safari/PWA page suspension. Synthetic video tests exercise active decoder startup and track cleanup, not hardware recognition. |
| Product base versus consumed serving | Review explicitly labels step 1 and the base quantity/unit; nutrition values describe that base. The next screen labels step 2, “Servings eaten (multiplier),” and shows e.g. `2.5 × 40 g = 100 g consumed`. Editing a base label does not silently rescale nutrition. Choosing a consumed multiplier leaves the saved product unchanged. No calculation formulas or entry representation changed. |
| Complete backup integrity | Added actual Settings download/import coverage with multiple historical days, legacy missing `servings`, fractional timestamps, scanned-product source metadata, explicit nutrient zeros, absent nutrients and nested metadata. Exported and restored strings are checked byte-for-byte, including the catalog, historical diaries and confirmed goals; unrelated keys survive. The existing backup implementation is unchanged. |
| Missing nutrient display | All-missing remains “Not available”; a known zero remains zero; an incomplete total explicitly says e.g. `0 g known` plus coverage. A positive total smaller than display precision shows `< 0.1`, not a confirmed zero. New browser coverage distinguishes all four cases. |

## Live API attempt: not verified

Two genuine, non-intercepted requests were attempted from this environment:

- A command-line GET using the app's v3 URL failed at the proxy CONNECT stage with HTTP 403 (`envoy`).
- The actual built app's Find Product flow in Chromium issued its GET with the expected fields and FitCircle identification parameters. It received no HTTP response from Open Food Facts and failed with `net::ERR_TUNNEL_CONNECTION_FAILED`; the UI reported `Failed to fetch`.

These failures do **not** establish that Open Food Facts rejects CORS, accepts the app identification, or returns a compatible live product. They occurred before a provider response could be inspected. Synthetic intercepted responses validate application behavior only. No live product integration or physical iPhone compatibility is claimed.

Before release, the owner should verify Open Food Facts' current registration/identification policy and complete its app-registration process as applicable. A query parameter is not proof of compliance with a requested custom User-Agent header. No backend/proxy or API secrets have been introduced to work around browser restrictions.

## Actionable real-device checklist

Use an approved, isolated HTTPS review build with synthetic records. Keep the production installation and real records untouched. Do not clear website data or uninstall the production PWA to test permissions.

Record the build SHA, iPhone model, iOS version from Settings → General → About, Safari version and whether each result came from Safari or the installed Home Screen PWA. Run the following in **both modes**:

- [ ] **Startup:** Open Add Food → Scan Barcode → Start Camera. Allow camera permission. Confirm the rear camera is selected where available, preview stays inline/muted, close and Stop Camera remain tappable, and the keyboard does not open automatically.
- [ ] **Formats:** Scan known UPC-A, UPC-E, EAN-13 and EAN-8 labels. Record printed/decoded values, including UPC-E expansion and UPC-A/EAN-13 leading-zero equivalents. A successful read should stop the camera and open only one review. Manual entry should find the same saved product. Do not assume unit-format tests prove camera recognition.
- [ ] **Permission fallback:** Deny permission, then try manual entry/search/custom food. Change only the camera permission in device/browser settings, reopen Start Camera and retry. Confirm no records were reset.
- [ ] **Startup races and shutdown:** Stop or close immediately during startup; cancel a blocking native permission prompt before closing if necessary. Close after active preview, after a successful decode and during a slow lookup. Confirm the camera privacy indicator goes off and stale results do not reopen the dialog.
- [ ] **Suspension:** While preview is active, switch tabs/apps, lock/unlock, return Home and reopen the PWA. Confirm the camera is stopped and requires Start Camera again. Test browser Back/Forward/page restoration separately. Failure here blocks camera release approval.
- [ ] **Layout and keyboard:** Rotate portrait/landscape and focus manual entry/product fields. Confirm header/close, last nutrient field, review action and serving confirmation remain reachable above safe areas; dismissing the keyboard restores scrolling.
- [ ] **Two serving concepts:** Review one base serving of 40 g with 100 kcal. Continue and choose multiplier 2.5. Confirm 100 g and 250 kcal consumed, while catalog base values remain 40 g / 100 kcal. Also test 0.4 and reject zero/negative servings. Do not change the base quantity merely to record a larger portion.
- [ ] **Live lookup/CORS:** Online, use a product not already saved locally. In Safari Web Inspector's Network panel, confirm the request reaches `world.openfoodfacts.org`, receives a successful provider response, has appropriate `Access-Control-Allow-Origin` for the review origin, and is readable by JavaScript in CORS mode. Inspect the actual product code, serving basis/units, calories, macros and sodium against its package before accepting. Record failures and provider headers/status; a curl success alone does not verify browser CORS. Do not use `no-cors` or disable browser security.
- [ ] **Incomplete labels:** Verify missing optional nutrients stay blank/Not available, confirmed zeros stay zero, and incomplete totals report their coverage. Missing required calorie/macro values must be supplied deliberately before logging. Check per-serving versus per-100g/100ml and prepared-product warnings.
- [ ] **Offline:** After the app is cached, save a reviewed synthetic product locally, enable airplane mode and reopen. Confirm local barcode lookup, diary, goals, details and weekly summaries work. Unknown codes should explain online lookup is needed without creating a zero-filled product. Reconnect and retry.
- [ ] **Backup:** Using only synthetic test records, download a Complete Backup, change a synthetic record, restore, then export again. Compare the food/catalog/goal key values, serving multipliers, source metadata, missing fields and timestamps. Keep both files as evidence until verified.

A reviewer should mark each item pass/fail with notes. Any failed camera shutdown, inaccessible close control, nutrient-basis mismatch or backup discrepancy should be resolved before launch.

## Automated validation

All checks were rerun against the amended build with isolated synthetic fixtures:

- `npm run check`: passed.
- `npx tsc --noEmit -p tests/tsconfig.regressions.json`: passed.
- `npm run audit:storage`: 211 call sites, zero errors. No storage-boundary or registry changes in this amendment.
- `npm test`: 230 passed, zero failures.
- `npm run build`: passed; existing Vite large-chunk advisory remains.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: 187 passed, zero failures.
- `git diff --check`: passed.

The added regressions cover multipack ambiguity, bounded salt, malformed returned codes, trace-value preservation, cancellation before remote lookup, serving explanations, pagehide/visibility camera cleanup, actual complete-backup download/restore and distinct missing/partial/confirmed-zero displays. Existing regression tests remain intact.

## Remaining limitations

Live provider CORS/data/identification and physical iPhone permission/recognition/suspension behavior remain unverified. Unsupported or ambiguous nutrient units/bases and bounded values require manual package review; the app does not infer missing values, mass/density or vitamin forms. No microscopic precision claim is made for labels; small positive displayed totals use a bound. Existing whole-application multi-tab merge limitations remain unchanged.

PR #53 remains open. No merge or deployment is performed.
