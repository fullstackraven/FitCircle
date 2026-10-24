# GitHub Actions optimization

## Audit and decision

Baseline: merged main `409f1cff` (PR #78), audited October 24, 2026.
Only workflow infrastructure and this review document/data change. No application,
UI, appearance, storage, dependency, browser-version, or screenshot files change.

The existing `pages.yml` runs `npm ci`, TypeScript, unit tests, a production build,
a pinned browser download, and the entire two-worker browser suite sequentially.
It runs for PRs, pushes to main, and manual dispatches. Main/manual then upload a
Pages artifact and deploy. PR browser validation was added in PR #77; previously
browser checks ran only after merge. There is one production build per run, not two.

The separate `storage-audit.yml` runs `backup-coverage` on PRs: TypeScript,
regression TypeScript, and unit/AST/backup fixtures. Its file and check are unchanged.
Its overlapping checks execute independently and are retained for check compatibility.

### Merge protection evidence

- Branch API reports `main.protected: false`, protection disabled, no required
  check contexts. Repository rulesets and active branch rules return empty arrays.
- The administrative branch-protection endpoint and Actions default-permission
  endpoint return HTTP 403. No repository settings were changed.
- Merge commits, squash merges, and rebase merges are all enabled.
- Actual PR #78 merge `409f1cff` has two parents: `8d2022e3` and `449bc952`.
  This example does not guarantee what a future merged commit/tree will contain.
- Pages is configured as a workflow deployment, HTTPS, at
  https://fullstackraven.github.io/FitCircle/ . The `github-pages` environment's
  existing custom branch policy permits `main`; it is retained unchanged.

**Dropping post-merge browser validation is not safe under these settings.** A
successful PR check does not exclude direct pushes, stale PR bases, or an untested
merge result. This change therefore retains all post-merge testing and reduces its
critical path through native sharding. It never promotes a PR artifact to production.

## Measured baseline

Times come from successful GitHub-hosted runs, not estimates. Source timestamps
and individual step durations are sanitized in [baseline-timings.json](baseline-timings.json).
Workflow wall time is `updated_at - created_at`; job/step times are their recorded
start/end intervals, so queue and transition overhead are not all runner execution.

| Successful main run | Era | Workflow wall | Browser step | Chrome install | Pages publish action |
|---|---|---:|---:|---:|---:|
| [39094017329](https://github.com/fullstackraven/FitCircle/actions/runs/39094017329) | PR #52 | 2:56 | 1:37 | 0:24 | 0:06 |
| [39458476561](https://github.com/fullstackraven/FitCircle/actions/runs/39458476561) | PR #53 | 3:00 | 1:45 | 0:18 | 0:06 |
| [39507019105](https://github.com/fullstackraven/FitCircle/actions/runs/39507019105) | PR #57 | 2:29 | 1:29 | 0:16 | 0:06 |
| [39871454349](https://github.com/fullstackraven/FitCircle/actions/runs/39871454349) | PR #71, before appearance phases | 3:18 | 2:06 | 0:21 | 0:06 |
| [40036758108](https://github.com/fullstackraven/FitCircle/actions/runs/40036758108) | PR #77 | 6:53 | 5:54 | 0:04 | 0:07 |
| [40053068504](https://github.com/fullstackraven/FitCircle/actions/runs/40053068504) | PR #78 | 8:58 | 7:51 | 0:04 | 0:07 |

Older four-sample mean: **2:55.75**. Recent two-sample mean: **7:55.5**.
These are small descriptive samples, not a guarantee or statistically controlled
benchmark. Recent browser steps averaged **6:52.5**, versus **1:44.25** in the older
sample. Recent publishing itself still takes seven seconds.

Latest production run breakdown (PR #78, seconds):

| Component | Measured seconds |
|---|---:|
| Build runner initialization (`Set up job`) | 1 |
| Checkout | 2 |
| Node setup/cache | 1 |
| `npm ci` | 10 |
| TypeScript | 9 |
| Unit tests | 11 |
| Production build | 9 |
| Chromium download/extraction | 4 |
| Playwright | 471 |
| Pages artifact upload | 1 |
| Deployment job initialization | 1 |
| Pages publish action | 7 |
| Entire workflow including transitions/post steps | 538 |

Playwright accounts for about **88%** of that workflow. Appearance work added long
multi-screen visual/contrast walkthroughs, and the suite now has 365 cases. PR #77
also corrected the reference browser/OS environment. Historical timings alone do
not isolate the cost of each individual new test or browser-renderer difference;
no unsupported same-code A/B attribution is claimed. The measured slowdown is
inside browser validation, not npm, browser download, Vite, or Pages publishing.

## Optimized architecture

```text
PR / main push / manual
  prepare: immutable SHA checkout -> npm ci -> types/regression types/unit/storage
           -> production build ONCE -> immutable tested-site artifact
  browser: 1/4, 2/4, 3/4, 4/4 in parallel, each with two workers
           exact SHA checkout + same built artifact + same pinned browser/fonts
  build:   always-run aggregate gate, succeeds only if prepare AND all shards succeed
  deploy:  only successful push to refs/heads/main
           download that same artifact -> Pages artifact upload -> Pages deploy
```

There are separate publishing and validation paths, sharing one validation graph.
PR and manual executions stop at the gate. Main always validates the actual merged
production commit, regardless of merge strategy. Each checkout explicitly uses
`github.sha`, avoiding a moving PR/ref between jobs. A fresh main build also keeps
FitCircle's existing build-time version/commit information correct.

The artifact is created once with v4 artifact immutability and downloaded by exact
name within the same workflow run. No cross-run/token/artifact promotion is used.
`include-hidden-files: true` preserves `.nojekyll`; each browser job checks index,
worker, manifest, recovery HTML and `.nojekyll` before testing. Deployment downloads
the same named artifact after the complete gate; it never builds a different copy.

Native Playwright shard listings contain **125 + 63 + 91 + 86 = 365** disjoint test
IDs, exactly matching the unsharded list. Counts differ because file/serial-suite
semantics are retained. No `fullyParallel`, retries, test exclusions, screenshot
threshold changes, or browser/configuration changes are introduced. `fail-fast:
false` lets all shards report even when another fails. Failure artifacts have
unique shard names and retain the existing seven-day policy; successful runs do
not upload test traces. The site artifact is retained for one day.

Four runners increase setup overhead/parallel resource usage. Each still uses the
same two workers, avoiding a change to per-runner screenshot/test contention.
Queue delays and uneven file runtimes mean speedup will not necessarily be 4×.

### Caching and avoided complexity

Existing setup-node npm tarball caching is retained on prepare/browser jobs. Each
isolated runner installs its own lockfile dependencies. `node_modules` is not
transferred or cached as a build artifact. Production builds are not repeated in
the browser jobs. Their existing preview/dev servers remain unchanged.

Pinned Chromium 154.0.8037.57, Ubuntu 24.04, Fontconfig fixture, and GPU settings are
unchanged. Its measured four-second download does not justify a large browser cache
or a browser-version change. No new caching service or secret is introduced.
No scheduled runs are added: PR, main, and explicit manual coverage already cover
the intended use without unnecessary scheduled Actions consumption.

## Checks and security

- The required-check identity **`build`** is preserved in the same workflow file
  and workflow name. It is now a complete aggregate rather than the serial job.
- `build` uses `always()` and verifies both dependency results. Local execution of
  its shell gate checked all 16 combinations of success/failure/cancelled/skipped;
  only two successes pass. Failed/skipped preparation or any failed shard cannot
  leave it permanently pending or falsely green. Canceled old runs are superseded
  by the next run as before.
- The existing **`backup-coverage`** check and workflow are untouched.
- Validation has `contents: read`; the shell-only gate has no token permissions.
  Pages write and OIDC permissions exist only on the isolated deploy job.
- Deploy requires a push to main and a successful full gate. PRs, forks, and manual
  runs cannot publish. No `pull_request_target`, PR-script execution in a privileged
  job, or new secrets are used. Deploy runs supported artifact/Pages actions and
  does not check out or execute repository build/test code with Pages permissions.
- The production environment name, URL, existing branch policy, and deployment
  permissions are preserved. Raw PR artifacts are never consumed by a main run.
- Concurrency is separated by event and PR/ref: newer same-PR/main validation
  cancels outdated work, while a manual regression does not cancel a production
  push run. Existing cancellation behavior for superseded same-ref runs is retained.

Before merge, the owner should verify Settings -> Branches/Rulesets and required
checks in case settings changed since this audit. If merge blocking is desired,
require `build` and `backup-coverage` from GitHub Actions; do not require an obsolete
conditional job name. No protection settings are enabled by this PR. Any later
proposal to omit post-merge testing needs enforced PR checks, direct-push/bypass
controls and up-to-date/merge-queue or equivalent exact-commit assurance first.

## Validation and performance results

Local validation before opening the PR:

- `actionlint` 1.7.7 passes both workflows, including expression/action input checks.
- YAML/event/permissions/dependency/artifact/concurrency invariants inspected.
- Aggregate gate truth table: 16/16 combinations correct.
- Shard union: 365 unique IDs, no overlap/omission, same total as the full listing.
- `npm run build` passes; original Pages base path, icons, manifest, `.nojekyll`,
  recovery document, and generated worker exist with `/FitCircle/` references.
- No application, package, Playwright configuration, or original snapshot changes.

Live PR and manual results will be recorded here after actual GitHub-hosted runs.
No optimized production deployment is performed in this task. The post-merge
publish duration cannot be measured until the owner merges an approved change.
A 1–3 minute deployment is a performance objective, not a guarantee. Report measured
validation critical paths separately from any extrapolation using historical Pages
publish time; runner queues and environment approvals remain outside that estimate.

Manual regression after approval/merge (or to verify this branch):

```sh
gh workflow run pages.yml --ref ci/actions-optimization
# After merge, use --ref main. Manual execution never deploys.
```

## Compatibility and rollback

The Vite build, `/FitCircle/` base, manifest, app identity/icons, service-worker
generation/cache logic, SPA recovery, and user data remain unchanged. Only a fresh
artifact that passed complete regression validation reaches the main-only publisher.

Rollback through a reviewed PR by restoring `.github/workflows/pages.yml` from
baseline `409f1cff18072df367af0280c687dcbdf57bf688`, or reverting this workflow PR.
The previous serial `build` check and Pages flow then return. Review the old
manual-publish behavior if using the restored workflow; do not run an untrusted
branch manually. No application/data rollback, storage reset, worker unregistration,
or PWA reinstall is needed.
