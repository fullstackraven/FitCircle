# Add Food: Your Foods and compact cards

The upper Add Food modal, search field, Barcode/Custom Food controls, dialog props and dismissal logic remain unchanged. Below them, Your Foods provides Recent / Most Frequent selection, descriptions/sort hints, three initial cards, View all and Show more / Show fewer. Opening Add Food defaults to Recent; tab changes collapse the list.

## Read-only diary projection

`food-history.ts` reads only dated `fitcircle_food_YYYY-MM-DD` entries. Recent uses today plus the previous six local calendar dates, sorted by latest valid diary timestamp; it never falls back to older food. Most Frequent counts distinct diary-entry IDs across available valid history, then sorts by count, latest timestamp and a stable identity tie-breaker. Duplicate copies of an entry ID count once.

Food source IDs are used when retained in legacy metadata, followed by normalized barcodes. Current diary IDs identify logs rather than database foods. Where a source ID/barcode is absent, the existing snapshot identity convention is retained and expanded with serving/nutrient details: name alone never merges foods. Legacy snapshots identical in all available identity fields cannot be distinguished retroactively without changing storage, so no new identifiers or migrations are introduced.

Malformed JSON/rows/timestamps are skipped without rewriting records. A malformed row does not hide valid neighboring rows. Diary snapshots remain usable when a database food was deleted; no database reference is required. The projection reloads on modal opening, diary changes and storage events.

## Presentation and existing flows

A local compact-card component supplies name/brand, wrapping macro badges, serving size and optional frequency count. Search results reuse it while retaining Edit/Add/Delete actions. The existing add handler, serving form and nutrition/diary persistence are unchanged. Scoped CSS affects only the new tabs/cards. No schemas, backup formats, dependencies, backend or application-wide styles changed.

The protected Barcode and Custom Food button JSX was compared against main and is byte-for-byte unchanged. Existing protected-control tests retain exact styles, dimensions and horizontal placement. Their vertical check now anchors the buttons 16px below Search rather than fixing a viewport coordinate that changes with the centered modal's new list height; resting styles are measured with the pointer outside the cards.

## Focused validation

- Application TypeScript, regression TypeScript and production build: pass.
- History unit tests: **6/6 pass**, covering seven local dates/DST, old-entry exclusion, uniqueness, all-time counts vs servings, tie-breaking, stable IDs/barcodes, identical names with different identities, duplicate entries, malformed history, missing database references and derived edits/deletions.
- Add Food browser checks: **2/2 pass**, Light/Dark, 390px and 320px containment, tab/expansion/View all behavior, no writes from browsing, existing serving/add flow and frequency update after saving, Recent default on reopen.
- Directly affected protected-control cases: **4/4 pass**, Light/Dark at 320/390px, including existing search and Custom Food entry checks.
- [Light](light.png) · [Dark](dark.png) advisory captures. Physical iPhone verification unavailable. No broad audit or pixel-comparison suite.

Classification: `release:minor`. Version remains calculated by existing release automation. Not merged or deployed; CI runs asynchronously after push.
