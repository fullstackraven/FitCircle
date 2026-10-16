# Remaining modernization roadmap

Verified baseline: main `fc09b8a` on 2026-10-16. PRs #24, #26 and #27 are merged. Original [findings](findings.json), [roadmap](11-modernization-roadmap.md), [cleanup candidates](05-cleanup-candidates.md) and [initialization audit](initialization-safety/AUDIT.md) remain the evidence of record; nothing unresolved has been deleted. This disposition overlay records merged outcomes without rewriting historical audit observations.

## Merged outcomes and current dispositions

| Findings | Current disposition |
| --- | --- |
| FC-006 | Completed: PR #24 fixes selector mutation and adds regression/CI safeguards. |
| FC-001, FC-002 | Completed: PR #26 preserves historical goals and genuine journal timestamps. |
| FC-003 | Partially completed: PR #27 protects the workout document. Remaining cardio/wellness/food and action-driven persistence paths are **essential unfinished Phase 1 work**. Local cardio work is unmerged and not credited as a fix. |
| FC-004 | Essential unfinished: confirmed swallowed food-save failures. Include visible failure reporting (FC-017) and backup-compatible validation (FC-029) where necessary. |
| FC-005 | Essential investigation: high-risk stale writers are probable; reproduce actual mounted consumers before choosing the smallest correction. |
| FC-007, FC-009–011, FC-013, FC-016 | Phase 1 correctness candidates: confirmed DST, goal/draft/profile, nutrition and invalid-route problems; address active daily-use paths first. |
| FC-012, FC-014, FC-019 | Phase 1 verification candidates: units, historical food compatibility writes and saved tile omissions. Correct demonstrated consequential failures; otherwise defer with reasons. |
| FC-008, FC-018, FC-021–024 | Deferred to Phase 2: session resume, fallback statistics, accessibility, background timers and audio lifecycle. Promote any demonstrated core-use/data-loss failure to essential work. |
| FC-015, FC-020, FC-027, FC-028 | Deferred to Phase 2: recent-food selection/performance, dormant widgets, semantic tokens and search-index optimization. Low-cost proven corrections can be included with directly related work; no broad redesign. |
| FC-025 | Dependency advisory triage remains open. Phase 1 must distinguish shipped/runtime exposure from build-only classification; consequential confirmed exposure is essential, larger upgrades may be deferred. |
| FC-026 | Deferred pending maintainer confirmation of license/copyright text; do not invent ownership. |
| FC-030 | Open storage-recovery limitation requiring focused verification. Retain rollback journal and explicit recovery guidance; do not promise transactions under persistent browser failure. Any reproduced destructive application path blocks Phase 1 completion. |
| FC-031 | Deferred to Phase 2: bounded import resource use, retaining realistic large legacy backups. Promote if a practical daily-use failure is reproduced. |

No unresolved finding is currently marked no longer applicable. None is superseded by a code fix without merged evidence. The old mandatory one-PR-per-domain scheduling is **superseded as a planning policy**, not as a finding: related fixes can share coherent, reviewable batches.

## Proposed Phase 1 order — awaiting approval

1. **A: Persistence safety.** Finish FC-003 using the existing inventory; cover automatic mount overwrites before delayed writers. Address FC-004 with visible errors and compatible food validation, then reproduce/correct FC-005 and relevant goal/food cross-writers. Use related sub-boundaries only where necessary for review. Keep keys, formats, manual Files/iCloud backup and exact recoverable originals. Do not introduce a replacement storage framework. Rough effort: 2–4 focused sessions, depending on confirmed concurrency/legacy failures.
2. **B: Consequential correctness.** Fix confirmed active DST/calculation, goal, draft and invalid-route defects above; time-box probable findings. Depends on safe persistence for fixes that save data. Rough effort: 1–2 sessions.
3. **C: Verified simplification.** Verify candidates against imports, manual routes, saved settings, backup/legacy references and PWA entries. Remove proven dead internal helpers/assets/dependencies; consolidate repeated logic only where behavior is already covered. Do not delete diagnostic pages, legacy readers, storage keys or active Calendar recent activity. Rough effort: 0.5–1 session.
4. **D: Stabilization and completion.** Run application and regression TypeScript, storage audit, full unit/browser suites and production build; exercise backup round trips, core workflows and existing offline tests. Record actual iPhone/PWA/Files checks still unperformed. Rough effort: 0.5–1 session. These are planning ranges, not guarantees or a commitment to spend time on diminishing returns.

No user-facing feature removal is proposed now. Dormant widget capabilities require a separate explicit removal recommendation/approval; static unreachability alone does not establish that saved settings or future compatibility are disposable. Independent diagnostic test timing issue #25 stays tracked as test-harness work, not a persistence correction.

## Phase 2 dependencies and risks

- First complete any essential item still open at the Phase 1 boundary; a confirmed high-severity data-loss defect cannot be relabelled optional.
- Then prioritize session/background reliability and accessibility; preserve pause/legacy-date semantics and test physical iOS suspend/resume/audio.
- Consolidate shared writers/subscriptions before broad component extraction, polling removal or calculation deduplication. Avoid simultaneous state ownership and storage-format changes.
- Optimize food search/history only with stable ranking, units and custom-food/backup behavior; measure before adding architecture.
- Broader widget integration, component decomposition, dependency/toolchain upgrades and visual-token changes follow parity evidence and independent review. Retain original roadmap detail for these decisions.
- Persistent browser denial/eviction, actual Files save completion and OS termination remain platform limits; automated Chromium is not physical iOS verification.

## Completion gate and follow-through

Phase 1 is **not complete**: confirmed high-severity initialization and food-save risks remain on merged main; stale-writer risk still requires focused reproduction. Passing existing tests alone does not close these findings.

At Phase 1 completion publish a concise report listing merged fixes, verified internal removals, remaining finding IDs with essential/optional disposition, actual validation and manual-device limits, and an explicit statement about unresolved high-severity defects. Name the best next Phase 2 improvement based on then-current evidence (currently session/background reliability is a candidate, not a fixed promise).

Update this file after actual merges, never merely when a PR is proposed or approved. Preserve synthetic fixtures and original audit evidence. The immediate best next implementation is Batch A, beginning with the already-reproduced cardio initialization overwrite and finishing its backup-safe recovery; its local work has not completed validation and must not be deployed.
