# FitCircle codebase audit and controlled modernization

Audited main **0ab26bf20e7c47e9e8068d22a36a1a9070cece63**. Audit scope is the 277 tracked files at that SHA, not ignored node_modules/dist, user data, Git history or future PR files. This report and roadmap precede application edits. Only batch A is authorized here; open a PR and stop, do not merge/deploy.

## Assessment

The static browser architecture, GitHub Pages base handling, centralized validated backups, AST storage registry, safe reload/update recovery and extensive viewport regression checks are strengths. Independent autosaving hook snapshots, startup migration heuristics, inconsistent legacy/current schemas, weak numeric/shape validation and sparse calculation tests are the principal risks. No backend or wholesale rewrite is needed.

Most urgent: FC-001 rewrites explicit historical goals (synthetic 20→5), FC-002 strips genuine journal timestamps, FC-003 permits fallback autosaves over malformed bytes, FC-004 reports food success after quota failure, and FC-005 identifies stale-writer loss risk. Preserve existing originals and propose separate minimal migration/initialization fixes. No Critical finding was established; no claim that all possible bugs were found or fixed.

## Coverage and limitations

- Inventory: **277/277 files (100%)**, with bytes, extension, directory, tracking status, class and import relationships in [01](01-file-inventory.md).
- Every applicable executable source/config/test file received full text inspection: **156 files, 26,893 text lines**, exact hashed ranges recorded in [audit-ledger.json](audit-ledger.json). This count includes README; it excludes structured/generated and historical reference lines from manual-source claims.
- All 93 binary files: image decoder/header/dimensions, hash duplicates and reference-purpose review; no claim of line-by-line binary or full visual validation. Four exact duplicate groups are recorded.
- Generated lockfile: full JSON/integrity/resolution traversal; 350 package entries. Both food JSON arrays fully parsed (465 active, 29,766 historical); required core fields, IDs, nutrition signs and units examined. No nutrition-authority verification claimed. Historical measurement JSON parsed structurally. Generating sources reviewed; dist remains ignored.
- Other reference/docs/pasted historical files: purpose, sections, links and compatibility-history review, **not** a manual line-by-line source claim. Historical instructions are inert evidence. No file is omitted from the ledger; review depth differs by file type. Static imports include type edges and cannot prove runtime mounting or manual-entry absence.
- No physical iPhone, Safari/WebKit engine, Files/iCloud round trip, real backup or installed storage access. Production current-URL live fetch not part of this audit. Tests are isolated synthetic Chromium/Node evidence.

## Findings

**5 High, 19 Medium, 7 Low, 0 Critical; 20 Confirmed, 9 Probable, 2 Needs Verification.** [02](02-line-by-line-findings.md) and [findings.json](findings.json) contain exact ranges, evidence, reproduction, impact, solution, regression risk and required tests for each. Confirmed source behavior is distinguished from executed probes and device hypotheses.

Beyond data safety: DST denominator error, paused-session reload, fasting multi-goal overwrite, meditation input reset, calculator age mismatch, invalid-date view crash, missing toast mounting, food unit/derived-field inconsistencies, accessibility gaps and dependency advisories require focused work. The known widget in-place sort is the sole batch A app correction. Dormant widget placeholders remain documented; Calendar Recent Activity is active and preserved.

## Feature and data preservation

[03](03-feature-parity-matrix.md) is the route/feature contract, including dormant customization intent and coverage gaps. [04](04-data-integrity.md) reuses the existing 80-source registry/217-site audit and assesses migration determinism versus historical correctness, repeated writes, legacy food collisions, malformed/quota paths and multi-writer risk. Backup keys/format/manual iCloud workflow remain unchanged. Rollback journals improve recovery but cannot promise browser-level atomicity under permanent failure/eviction.

## Redundancy and architecture

[05](05-cleanup-candidates.md) lists exact candidates, references, compatibility, benefit, tests and confidence. No file/dependency/data is deleted. Shared sidebars, food meal markup, color maps and similar calculations are opportunities, not proof of identical semantics. 17 client modules outside the main static graph are retained; type-only reachability is separately explained. Historical cleanup scripts are not run. [06](06-architecture.md) describes shared-state boundaries, lifecycle/type issues and why widget integration is deferred.

## Calculations, PWA, security and performance

[07](07-calculations-and-dates.md) records proven DST output and fixed-fixture requirements; formulas are unchanged. [08](08-pwa-and-ios.md) distinguishes current Chromium geometry from historical user evidence and unverified installed iPhone behavior. No speculative viewport/worker edits. [09](09-security-and-performance.md) separates advisory-tree counts from shipped exploitability, records versions, and identifies unbenchmarked hotspots. npm audit reports 37 affected nodes, 24 in the production-install tree, 0 critical; it does not establish 37 exploits.

## Modernization and validation

[10](10-regression-test-plan.md) contains current protection, gaps, added safeguards and actual final execution results. [11](11-modernization-roadmap.md) orders independent PRs with scope, files, fixtures, data compatibility, iOS risks and rollback. Baseline: check, storage audit, 48 unit, build, 52 Chromium tests passed. Existing build chunk warning/advisories/optional unused diagnostics are baseline debt, not new failures. Final batch A: TypeScript/storage/build pass, **56 unit and 55 Chromium tests pass**; new test sources separately type-check. Existing chunk warning remains. See 10 for exact commands, raw logs and limits.

First deliverable: these audit documents and roadmap. First implementation on `revamp/audit-regression-safeguards`: copied-array selector plus 8 unit/3 browser safeguards and a test-only TypeScript config. Only this isolated application line changes; no subsequent batch is implemented. Next priority after review: separate minimally scoped historical-data migration safeguards, then failed initialization and honest food persistence. Defer shared-store redesign, feature integration, dependency chains, asset cleanup and performance work until their fixtures and current batch are reviewed. Do not merge automatically.
