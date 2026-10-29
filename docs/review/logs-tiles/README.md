# Neutral Logs tiles

Logs landing-page presentation only. All ten tiles now share the existing semantic surface, separator and text tokens. Icons use one slate color derived from the secondary-text and surface tokens. Feature-specific color declarations were removed from this page only.

The grid, current/default order, user-saved ordering, 128px minimum tile height, 16px radius, 28px icons, label typography, padding, header, dock and handlers are preserved. In particular, the current application order remains authoritative rather than reordering features to the conceptual mockup. No new heading/subtitle was added.

The former gradient/material shadow and feature tint/scale treatments are replaced by a thin neutral border, restrained hover emphasis, temporary green active feedback and a visible keyboard focus outline. Edit-mode disabled styling remains intact.

## Review captures

390×844 browser viewport, synthetic records. These are advisory screenshots; scroll normally to reach the last row below the dock.

- [Light](light.png)
- [Dark](dark.png)

## Validation

- Application TypeScript: pass.
- Regression-test TypeScript: pass.
- Production build: pass.
- One focused browser spec: **2/2 pass**, Light/Dark at 390×844. Checks all ten neutral tile backgrounds, matching borders/icon colors/labels, icon geometry, no gradient or scaling, keyboard focus, all ten navigation destinations, edit/reorder/save/reload and System appearance changes. No horizontal overflow.
- No application-wide audit or pixel comparison run. Physical iPhone testing unavailable; broader existing checks run in CI.

No feature-page styles, storage implementation, backups, routes, reorder handlers, global buttons/searches, service worker or protected Food controls changed. `release:patch`; normal release automation remains unchanged. Not merged or deployed.

## PR check correction

The existing material-adoption test still expected the former purple/cyan landing-tile backgrounds. Its exact expectations now match the approved neutral slate surface; two-column, edit/reorder, navigation and data assertions remain intact. Focused revalidation of material-adoption and Logs tests: **5/5 pass**. No application or workflow changes were needed. New CI results remain pending after push; screenshot differences remain advisory.
