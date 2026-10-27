# FitCircle release history and versioning proposal

**Approval required. Nothing is activated. Proposed current version: 2.10.3**, describing `e8c45654832e06bbfee3d24da14a5921330f4650` (full SHA in the ledger), successfully published October 27, 2026 at 11:39:54 UTC. The running application continues using its existing package-derived version. This PR does not change workflows, build configuration, UI, service worker, package version, tags, settings, storage or backups.

## Evidence and migration decision

The repository is not shallow: 1,195 commits reachable from audited main `e8c4565`, starting with `d020f79` on July 11, 2025. We inspected all available Git history and first-parent main boundaries, available remote branches, merged/closed PRs, Pages settings, 152 Pages deployment objects and their returned status histories, and 94 push runs of the current Pages workflow. Remote branches only exposed main at audit time; deleted branches and private Codex conversations are not a historical source. No tags currently exist. Captured API data is minimized to evidence fields in [evidence.json](../../../release/evidence.json); no credentials or personal fitness data are included.

Proposed **2.0.0 = `dbb0d2ccf3c0f6e7685b32d52b67e32022eb05f4`**, commit date October 15, 2026 04:04:42 UTC; release success October 15, 2026 **04:06:14 UTC**. [Deployment 7083569120 status](https://api.github.com/repos/fullstackraven/FitCircle/deployments/7083569120/statuses/19808095523), [validated workflow run 38679582470](https://github.com/fullstackraven/FitCircle/actions/runs/38679582470).

Source evidence at that commit:

- [`pages.yml`](https://github.com/fullstackraven/FitCircle/blob/dbb0d2ccf3c0f6e7685b32d52b67e32022eb05f4/.github/workflows/pages.yml): builds/tests a static artifact, then deploys `dist` through Pages.
- [`vite.config.ts`](https://github.com/fullstackraven/FitCircle/blob/dbb0d2ccf3c0f6e7685b32d52b67e32022eb05f4/vite.config.ts): correct `/FitCircle/` base and static client build; migration removes Replit/backend dependencies.
- [`client/public/manifest.json`](https://github.com/fullstackraven/FitCircle/blob/dbb0d2ccf3c0f6e7685b32d52b67e32022eb05f4/client/public/manifest.json), public icons/404 recovery, [`pwa.ts`](https://github.com/fullstackraven/FitCircle/blob/dbb0d2ccf3c0f6e7685b32d52b67e32022eb05f4/client/src/lib/pwa.ts), and generated service worker establish the project-path PWA.
- The migration is a direct commit **before PR #1**, not PR #1 itself.

### Earlier Pages evidence and limits

It would be inaccurate to claim Pages hosting first existed in October 2026:

| Milestone | Evidence | Interpretation |
| --- | --- | --- |
| July 11, 2025, `734a7b1` | Adds `.github/workflows/deploy.yml`, GitHub deployment instructions, duplicate `github-files` client and GitHub build config | Setup intent, not proof of successful publication or working PWA |
| July 22, 2025, `071e260c` | Deployment 2772788803 succeeds at 19:09:07 UTC | Verified earlier Pages publication; `vite.config.static.ts` uses `/FitCircleApp/`, while its deployment URL is `/FitCircle/`; manifest/icons/SW use origin-root paths |
| April 27, 2026, `2a06fd1e` | Deployment 4497409459 succeeds at 11:00:34 UTC; dynamic Pages workflow | Verified Pages publication, but no checked-in workflow at that revision; legacy mismatched config remains. Not proof of a functioning migrated static PWA |
| October 15, 2026, same `dbb0d2c` | Dynamic Pages deployment 7083559868 succeeds at 04:05:31 UTC | Same SHA, different build path. Not used as the baseline receipt; the explicit tested static build finishes at 04:06:14 |

67 older deployment objects expose only an `inactive` status, without a preserved success status in the API response. **Inactive does not prove failure or success.** Their creation dates are not release dates. Historical artifacts/phone behavior were not recoverable here; deleted or expired records may exist outside available evidence. Consequently this baseline is the earliest *defensible verified static-PWA migration* in the available source/deployment combination, not a claim that no earlier version ever worked. Owner confirmation is required. If an earlier working PWA artifact is supplied, baseline and numbering must be reconsidered before activation.

[Pre-baseline and uncertain milestone inventory](../../../release/milestones.json) keeps these separate from the numbered proposal.

## Reconstruction rules and result

[Machine ledger](../../../release/history.json) · [Human changelog](../../../release/CHANGELOG.md) · [Explicit classification decisions](../../../release/classifications.json)

Each record contains version, success-status date, full commit, included PRs, change summaries, classification/rationale, status/run URLs, source first-parent commits, deployment-verification status and separate `proposed` version approval. Deployment verification does not constitute owner approval of the proposed number.

The generator walks successful publication SHAs in success-time order and assigns every merged PR newly reachable since the prior published SHA. It verifies Git ancestry; a non-linear rollback requires explicit handling rather than silent chronological inference. Direct commits require explicit classifications too. Repeated publication of one source SHA does not produce another increment. Workflow success alone is not used when a matching deployment receipt is absent. A successful deploy is the boundary even if a later, unrelated job fails.

Classification policy for this retrospective proposal:
- Migration: owner-requested major-family baseline, 2.0.0.
- New public functional capability: minor; resets patch to zero.
- Corrections, presentation/navigation rearrangements, performance and maintenance: patch. Architectural refactoring that preserves public behavior is a patch here.
- README-only direct update and removal of unused/unpublished assets (#42/#43): none. Their publications remain in the ledger with the same version and a distinct build commit.
- Development-only appearance preparation is not counted as a public feature separately. The first verified publication includes public activation.
- No new major after migration is proposed; no breaking public/data contract identified in these changes.

Ten feature releases:

| Version | Included feature PR(s) | Reason |
| --- | --- | --- |
| 2.1.0 | #50 | Integrated Fitness Profile overview |
| 2.2.0 | #53 | Food Tracker nutrition goals and barcode workflow |
| 2.3.0 | #57 | Measurement/calculator/nutrition integration |
| 2.4.0 | #62 + correction #63 | Wellness windows, hydration shortcuts, summaries |
| 2.5.0 | #64 | Nutrient-reference reporting |
| 2.6.0 | #67 | Automatic calorie-derived sugar reference |
| 2.7.0 | #72–77 | Public Light/Dark/System, first successful combined publication |
| 2.8.0 | #78 | Share/QR and About/legal destinations |
| 2.9.0 | #80 | Journal grouping and full-history search |
| 2.10.0 | #90–91 | Set-based workouts, published after deployment-test correction |

There are **80 publication boundaries: 1 baseline, 10 minor increments, 67 patch increments and 2 no-increment publications**. Minor increments reset patch counts. After 2.10.0, #92 shared-state correctness = 2.10.1; #93 workout card presentation = 2.10.2; #94 completion checkmark restoration = **2.10.3**. This PR itself is not included because it has not been published.

The 94 current-workflow push runs include 80 successes, 10 failures and 4 cancellations. Notable merged-but-unpublished intermediate SHAs: #72–76 (combined into #77), #82 (published with #83), #90 (published with #91), #62 (with #63), #65 (with #66). #7–9, #37–38, #42–43 and #44–45 likewise form grouped boundaries. The failed and cancelled runs remain in evidence, without standalone release numbers.

#11 restores the earlier Calendar appearance: it is a new published patch, not deletion of the prior release. Unmerged/closed #16, #28 and #29 receive no version. The API also has no PR #25 entry; we infer nothing from numbering gaps. Some merged diagnostics are publicly reachable utility routes and are classified as maintenance patches, not confused with unmerged experiments.

Replit commit trailers provide evidence of some early agent sessions. Later PRs/review documents reference Codex workflows, but authorship/session identity cannot be established for every commit from Git alone. Conversations, assistant checkpoints, commits, PRs, merges and publications are distinct units; only publication receipts define numbered boundaries. No Codex-session count is used.

## Inactive foundation added

[`release-metadata.ts`](../../../client/src/lib/release-metadata.ts) is pure and not imported by the app/build:
- Strict stable SemVer parsing/numeric ordering and major/minor/patch/none increments. Pre-release ordering is deliberately outside this stable-release contract; development metadata is explicitly separate.
- Exactly one explicit `release:*` classification for each included change; absent, unknown or conflicting labels reject planning. Direct pushes need explicit change records too.
- Multiple PRs choose the highest impact exactly once. Major requires explicit approval during planning and publication validation.
- Candidate remembers the prior published commit. Stale candidates reject; failed/cancelled deploys leave the prior record unchanged; exact repeats are idempotent. Successful publication validates main/push/Pages, SHA, tested payload digest and receipt identity.
- Build metadata distinguishes development/candidate/published, with no invented release timestamp. Development displays `Development · SHA` and never claims the proposed official version.
- Receipt matching is bound to the loaded build's version, commit and digest. An older open tab cannot present the newest build's version/date by accident.

These are validation utilities, **not CI authentication or a distributed lock**. The future trusted workflow must supply verified GitHub responses, enforce ancestry, approval and compare-and-swap persistence. The initial implementation performs no network requests or writes.

Reproduce the proposal offline from captured evidence and full Git history:

```sh
python3 scripts/reconstruct-release-history.py
npx tsx --test tests/release-versioning.test.ts
```

This writes only the proposal JSON/changelog. Classification decisions are explicit checked-in inputs; no titles are automatically interpreted. The script does not call GitHub, write tags or modify Git history. Missing classifications stop generation. Captured API results are a point-in-time audit, not a continuously refreshed registry.

## Future activation design (not implemented)

### One authoritative successful-publication registry

After approval, seed a protected, repository-controlled `release-ledger` branch from the approved history. Use immutable records keyed by deployment/build identity, plus an atomically updated current pointer on that branch. Only successful publication appends a record; Git tags/releases are optional projections **after** durable recording, never the source of truth. Keep the branch outside `main` deployment triggers to avoid recursive deployments. Do not maintain a separately hand-edited version string in package.json, UI, manifest and ledger.

`package.json` currently says 1.0.0; `vite.config.ts:10` injects that and the current short SHA into `__FITCIRCLE_BUILD__`; `build-info.ts` formats it for About. Leave all three unchanged in this PR. On activation, generated metadata should replace the UI's package-version dependency; package metadata can remain the source-development/package identifier until an explicit owner decision. Source builds use an explicit development label; candidates and successful builds use the generated contract.

### Serial publication transaction

1. PR validation remains read-only and retains all checks. A classification check requires exactly one of `release:minor`, `release:patch`, `release:none`; `release:major` additionally requires protected-environment owner approval. Do not trust arbitrary PR code to grant approval. Do not create labels/change protection in this PR.
2. Preserve comprehensive CI before publishing. Resolve changes by ancestry from the last successful registry commit to the exact prospective main commit, not by PR dates/titles. Require explicit classification for direct commits. Account for merge/rebase/squash associations via GitHub PR commit metadata; freeze the selected labels/IDs/rationales in the candidate.
3. Use one non-cancellable production concurrency group spanning **read current record → plan → build/test artifact → deploy → record** (`cancel-in-progress: false`). Separate PR concurrency may still cancel obsolete runs. GitHub may replace queued runs and does not guarantee FIFO: check ancestry after taking the lock and skip obsolete/ancestor commits; a newer run includes the skipped PRs in its range. Never deploy an older commit after a newer successful release.
4. Choose version once under the lock. Build once, then test/deploy the same artifact. The existing `tested-site` pattern is suitable, but candidate generation must occur before that build; changing a candidate invalidates its artifact. Avoid generating a version separately in each browser shard.
5. The metadata payload contains version, full SHA and unique candidate/build identity. For receipt identity, hash the deterministic built payload manifest excluding the generated metadata file and generated SW (avoids self-referential hashes), embed that digest in the metadata file, then generate SW/precache normally. Separately hash the final tested archive for the receipt and deployment audit. The helper's `artifactDigest` denotes the payload digest, not a hash including itself. The exact manifest/hashing implementation and CI integration require a follow-up review; this PR does not modify `build-pwa.mjs`.
6. Deploy only a validated push on main with Pages permissions. A deployment failure does not advance the registry. A retry starts from the same published base, reusing the same increment; new merged changes may raise its classification but do not consume an extra version number.
7. Read the actual Pages deployment success status. Append version, exact commit, payload/archive digests, included PRs, frozen classifications, deployment/run IDs and **actual success time** using compare-and-swap against the registry ref read under the lock. Fail on conflicts. Optional tags are created only after this record is durable.
8. **Deploy succeeded, recording failed** is not equivalent to a failed deployment. Block subsequent releases until reconciliation: inspect GitHub deployment evidence and retained candidate artifacts, recover the exact successful version/identity, and idempotently record it. Do not re-plan a different payload with the same version or consume another version. Retain small candidate receipts/artifact manifests longer than the current one-day site artifact retention. Cancellation must not interrupt the deploy/record transaction.
9. Repeat same commit and same artifact is idempotent; different content under the same identity is an error. Intentional rollback must publish a reviewed new revert commit with a patch version; do not reset the official version or delete prior ledger entries.

Permissions: read-only PR jobs; Pages/id-token only in publishing; contents-write only for the trusted post-success registry writer. Never use `pull_request_target` to execute untrusted code with release rights. Environment protection and explicit major approval remain required. Branch-protection endpoint returned **403 Resource not accessible by integration**; owner must verify required check names, direct-push policy, rulesets and environment reviewers before activation. Current `build` aggregate name must remain compatible.

### Honest release dates and the loaded build

The actual successful publication timestamp cannot be embedded in the already-tested artifact before deployment. Do not substitute a build time or predicted date. The build carries candidate version/SHA with `releasedAt: null`. After success, a trusted registry receipt for **that exact commit/version/payload digest** can resolve the date and published status. A future About page may fetch this immutable matching receipt (never a `latest` version for display), and optionally retain it in app-scoped Cache Storage for offline reading. Without a matching receipt, show an unavailable/pending date, not an invented one. Later builds may bundle older release history, but never attribute the latest online release to an older running tab. This date/receipt UI choice needs approval alongside activation.

## PWA/update audit

Current `scripts/build-pwa.mjs` hashes all dist assets plus the SW template into a build-specific cache name. `scripts/sw-template.js` precaches a full build before skipWaiting, claims clients, retains two earlier app caches, serves navigations from the installed build cache, and can retrieve old hashed assets for older tabs. `pwa.ts` registers under `/FitCircle/` with `updateViaCache: none` after load. `pwa-update.ts` supports the existing Force Refresh lifecycle. Pages path/404 recovery and icons are retained.

New versions become available on online registration/update checks and normal browser lifecycle; an indefinitely offline/running installed iPhone PWA cannot be guaranteed to update by a deadline. Old loaded JavaScript must keep its own version even after a newer SW activates. A future nonintrusive update indicator can observe `updatefound`/controller lifecycle and offer the existing safe refresh without interrupting an active workout or draft. No polling, unregistering, wholesale cache clearing or personal-data deletion is added. Physical Safari and installed-PWA testing must cover old open tabs, offline launch, reconnection, background/resume and Force Refresh.

## Validation, approvals and limitations

- Six focused unit tests passed: stable ordering/increments, classification aggregation, none/no-classification handling, failed/cancelled retry, repeat/race/production guards, build metadata/display, and ledger evidence/coverage consistency.
- `npm run check` passed.
- `npx tsc --noEmit -p tests/tsconfig.regressions.json` passed.
- Proposal regenerated offline from checked-in evidence/classifications; no browser suite, production build or deployment was run for this metadata-only foundation.
- No UI changed; formatter tests cover the proposed reusable display contract, not a live About redesign. The supplied visual mockup is reserved for approved activation.
- Historical status timestamps are real evidence, but do not prove availability to every user or correct behavior on a physical phone. Missing evidence remains explicitly unresolved.
- Owner review must approve the October migration baseline (versus earlier Pages publications), ten minor classifications, no-version-change policy, and proposed 2.10.3 sequence before tags or activation.
- A separate activation PR is required for protected registry setup, race-safe workflow changes, label enforcement, generated build metadata, matching receipts, and the About display/history. This initial PR must not be mistaken for an operational automatic release system.

Rollback for this foundation: revert its added files/test include. No application metadata, personal records, production settings or tags require restoration.
