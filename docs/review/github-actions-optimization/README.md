# GitHub Actions optimization — final review

## Recommendation and selected configuration

**Use four native Playwright shards, with the existing checks and build together
in `prepare`.** This is the simplest measured configuration that provides a
worthwhile latency improvement. The workflow in this PR is restored exactly to
the four-shard configuration already verified in hosted PR and manual runs.
No additional optimization experiments are planned.

Four shards reduced comparable PR validation from **8:56 to 4:24 (50.7%)**. The
best measured ten-shard PR variant took 2:43, saving another 1:41 but consuming
**852 versus 580 runner-seconds (46.9% more)**. Four shards capture about **73% of
the best measured PR latency saving**, with four instead of ten browser runners,
fewer setup jobs, and lower resource usage. Ten shards are faster, but are not the
recommended default for this project.

This recommendation does **not** claim the aspirational 1–3 minute production
deployment target is achieved. Retaining full post-merge validation is necessary
under the current repository protections. Actual optimized production publication
has not been performed; it remains an owner-reviewed post-merge measurement.

## Audit findings

Baseline: merged main `409f1cff` (PR #78), inspected October 24, 2026.
Only `.github/workflows/pages.yml` and this review documentation/data change.
Application code, UI, data/storage, appearance, package dependencies, Playwright
configuration, browser version, and screenshot baselines are untouched.

Originally, `pages.yml` ran dependency installation, TypeScript, unit tests,
production build, pinned Chromium installation, and the full two-worker browser
suite sequentially in `build`. Main/manual runs then uploaded and published Pages.
PR browser validation was added in PR #77; previously it ran only after merge.
There was one build per run, not two. The duplication is across PR/main commits.

`storage-audit.yml` independently runs the `backup-coverage` PR check, including
application/regression TypeScript and unit/AST/backup fixtures. It is unchanged.

### Merge and repository protection

- Readable branch API reports `main.protected: false`, protection disabled and no
  required check contexts. Repository rulesets and active branch rules are empty.
- Administrative protection and default Actions token-policy endpoints return
  HTTP 403. No repository settings were changed.
- Merge commits, squash merges, and rebase merges are enabled. Actual PR #78 merge
  `409f1cff` has parents `8d2022e3` and `449bc952`; that example cannot guarantee
  the content of a future merge or exclude an unvalidated direct push.
- Pages uses workflow deployment at https://fullstackraven.github.io/FitCircle/,
  HTTPS, with the existing `github-pages` environment branch policy allowing main.

It is therefore unsafe to simply remove post-merge browser checks. Main continues
to test its actual production commit and freshly built artifact, independently
of what passed on a PR. No PR artifact is promoted to production.

## Original measured timings

[Baseline source data](baseline-timings.json) contains sanitized GitHub timestamps
and step durations. Workflow wall time is `updated_at - created_at`; it includes
queue/transitions and is not the sum of parallel job times.

| Successful main run | Era | Workflow wall | Browser step | Chrome install | Pages publish action |
|---|---|---:|---:|---:|---:|
| [39094017329](https://github.com/fullstackraven/FitCircle/actions/runs/39094017329) | PR #52 | 2:56 | 1:37 | 0:24 | 0:06 |
| [39458476561](https://github.com/fullstackraven/FitCircle/actions/runs/39458476561) | PR #53 | 3:00 | 1:45 | 0:18 | 0:06 |
| [39507019105](https://github.com/fullstackraven/FitCircle/actions/runs/39507019105) | PR #57 | 2:29 | 1:29 | 0:16 | 0:06 |
| [39871454349](https://github.com/fullstackraven/FitCircle/actions/runs/39871454349) | PR #71 | 3:18 | 2:06 | 0:21 | 0:06 |
| [40036758108](https://github.com/fullstackraven/FitCircle/actions/runs/40036758108) | PR #77 | 6:53 | 5:54 | 0:04 | 0:07 |
| [40053068504](https://github.com/fullstackraven/FitCircle/actions/runs/40053068504) | PR #78 | 8:58 | 7:51 | 0:04 | 0:07 |

Recent two-deployment average: **7:55.5**. The four illustrative older rows average
2:55.75. The latest five successful pre-appearance runs already averaged 3:42;
all 25 older successes in the fetched 35-run history averaged 3:27.36 (median 3:11).
Some growth preceded theming; these are descriptive samples, not controlled causal
benchmarks.

Latest production run step breakdown, in seconds:

| Component | Seconds |
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
| Deployment runner initialization | 1 |
| Pages publish action | 7 |
| Whole workflow including other post steps/transitions | 538 |

Browser validation is about 88% of that run. Appearance work expanded multi-screen
visual/contrast coverage; the suite now contains 365 cases. PR #77 also corrected
the browser/OS reference environment. Historical timings do not isolate each
individual test or renderer change. The measured bottleneck is browser execution,
not Chromium download, Vite, npm, or publication.

## Completed four- and ten-shard measurements

Every run below completed on GitHub-hosted runners with **365 passed, zero failed**.
The aggregate `build` check passed and `deploy` was skipped in every PR/manual run.
[Detailed measured results](optimized-timings.json) include job durations and actual
Playwright summary counts. `api_head_sha` records GitHub's run API value; for PRs
it identifies the PR head, while checkouts explicitly use the event `github.sha`
(synthetic merge SHA), not an assumption that those commits are identical.

| Implementation | Event / run | Total workflow | Slowest shard job | Its browser step | Failures | Approx. runner usage |
|---|---|---:|---:|---:|---:|---:|
| Four, serial checks **(selected)** | [PR](https://github.com/fullstackraven/FitCircle/actions/runs/40055053422) | **4:24** | #1 — 3:33 | 3:15 | 0 | **580s / 9.7 min** |
| Four, serial checks | [Manual](https://github.com/fullstackraven/FitCircle/actions/runs/40055415401) | **4:34** | #1 — 3:26 | 3:09 | 0 | **570s / 9.5 min** |
| Ten, serial checks | [PR](https://github.com/fullstackraven/FitCircle/actions/runs/40055741084) | 3:25 | #1 — 2:17 | 1:50 | 0 | 897s / 15.0 min |
| Ten, serial checks | [Manual](https://github.com/fullstackraven/FitCircle/actions/runs/40056030645) | 2:46 | #4 — 1:39 | 1:15 | 0 | 766s / 12.8 min |
| Ten, parallel checks | [PR](https://github.com/fullstackraven/FitCircle/actions/runs/40056217649) | **2:43** | #1 — 2:07 | 1:44 | 0 | **852s / 14.2 min** |
| Ten, parallel checks | [Manual](https://github.com/fullstackraven/FitCircle/actions/runs/40056442347) | **2:30** | #1 — 1:54 | 1:29 | 0 | **824s / 13.7 min** |

Runner usage sums non-skipped job wall seconds, not CPU time or exact billed
minutes. Per-job rounding and plan rules affect charging. The unchanged separate
PR `backup-coverage` run is excluded consistently. Publication was not executed.

The previous serial [PR run](https://github.com/fullstackraven/FitCircle/actions/runs/40052266214)
took 8:56, with 533 job-seconds, for the same 365-test suite. Four shards add modest
runner overhead while providing most of the measured latency saving. Ten shards
have higher concurrency and setup cost. Run-to-run differences are not solely
attributable to code: runner speed, queues and cache state vary.

For the four-shard PR run, prepare took 41s, browser jobs 213/128/91/103s, gate 4s,
site upload 1s, and downloads 0–2s. Its two manual/PR measurements are the evidence
for selecting the simpler configuration. Ten-shard parallel checks are a documented
alternative, not the final workflow. No additional tuning is planned.

These are validation timings, **not measured optimized production deployment**.
Historic publication takes about 7s, but the new main publisher also downloads and
uploads the tested artifact. Queueing and environment policy can add time. A four-
shard release is expected to remain around four-plus minutes, pending measurement
after an approved merge; a 1–3 minute promise would be unsupported. Removing main
regressions requires stronger enforced merge protections/exact-commit assurance,
not a speed-first bypass.

## Selected architecture

```text
PR / main push / manual
  prepare: checkout exact event SHA -> npm ci -> types/regression types/unit/storage
           -> production build ONCE -> immutable tested-site artifact
  browser: four native shards in parallel, two workers each
           same event SHA + same built artifact + pinned browser/fonts
  build:   always-run aggregate gate; prepare AND all shards must succeed
  deploy:  only validated push to refs/heads/main
           same artifact -> Pages artifact upload -> Pages deployment
```

PR/manual paths stop after validation. Main builds and tests the actual merged
production commit, irrespective of merge strategy. Every checkout explicitly uses
`github.sha`; the main build/version therefore cannot accidentally reuse a stale
PR artifact or a moving branch checkout.

One v4 immutable `tested-site` artifact is downloaded by exact name within its
own run. Hidden files are included to retain `.nojekyll`; each shard verifies
index, worker, manifest, recovery HTML and `.nojekyll` before testing. The publisher
uses the same run-scoped artifact after the complete gate, without rebuilding.

Shard listings contain **125 + 63 + 91 + 86 = 365 disjoint IDs**, exactly matching
the full unsharded list. Native file/serial-suite semantics are preserved. There
is no `fullyParallel`, test exclusion, retry, threshold, baseline, or browser change.
`fail-fast: false` lets all shards report. Failure artifacts use distinct shard
names and retain seven days; site artifacts retain one day. Successful test traces
are not uploaded. No schedules or additional manual experiments are added.

Ubuntu 24.04, Chromium 154.0.8037.57, Fontconfig fixture, GPU settings, and two workers
per runner are unchanged. Existing npm tarball caches remain. `node_modules` is not
transferred. The measured 4s browser download does not justify a large browser
cache or browser-version change. There is no new cache service or dependency.

## Required checks and security

- Keep **`build`**: same workflow path/name and check name, now a full aggregate.
  `always()` evaluates failed/skipped dependencies; local execution checked all
  16 success/failure/cancelled/skipped pairs and only success/success passes.
- Keep **`backup-coverage`**: its existing workflow is untouched. The ten-shard
  parallel trial additionally passed all 64 three-input gate combinations; that
  trial's separate `checks` job is not retained or required.
- PR failures block merging when these checks are configured as required. They
  are not currently enforced according to readable branch/rule endpoints. The
  final required gate is not conditionally skipped or left pending on PRs.
- Validation has `contents: read`; the shell-only gate has `permissions: {}`.
  Pages write/OIDC exist only on the isolated publisher, which does not check out
  or execute repository build/test scripts with those permissions.
- Publish requires `push`, `refs/heads/main`, and successful `build`. PRs/forks and
  manual dispatches cannot publish; all six hosted validations confirmed skip.
  No `pull_request_target`, cross-run promotion, new secrets, or deployment service.
- Existing Pages environment, URL, main-only environment branch policy, and
  publishing permissions are unchanged.
- Concurrency separates event and PR/ref. Newer same-PR/main runs cancel outdated
  validation; manual regressions do not cancel a production push run.

Owner verification before merge: check Branches/Rulesets for required `build` and
`backup-coverage` from GitHub Actions and any settings changed since this audit.
Do not require trial-only `checks` or each matrix job. Verify fork token/secret and
workflow approval policy in Actions settings; administrative endpoints were
inaccessible. No branch protection or repository settings are changed here.

## Validation and limits

- `actionlint` 1.7.7 passes both workflows, including expression/action inputs.
- YAML/events/permissions/dependencies/artifact/concurrency conditions inspected.
- Selected gate: 16/16 dependency pairs checked; only both successes pass.
- Four- and ten-shard ID unions each match all 365 tests without overlap/omission.
- All six hosted PR/manual runs passed 365 tests, types, unit tests and builds.
- Manual dispatch completed on both configurations without deployment.
- Local production build passed; `/FitCircle/` assets, icons, manifest, `.nojekyll`,
  SPA recovery HTML and generated worker were verified. Hosted artifact checks
  and all PWA regression tests also passed.
- No application, package, Playwright configuration or original snapshot changes.

The final wrap-up commit restores the previously tested four-shard workflow and
records these results. Its normal PR checks run automatically; no further manual
runs or optimization experiments are started. Current final check results are
linked from [PR #79](https://github.com/fullstackraven/FitCircle/pull/79/checks).
Positive production publication is not live-tested in this task: no merge or
deployment is authorized. The owner should measure the first approved main run.

After merge, the existing manual trigger can run full regression without publishing:

```sh
gh workflow run pages.yml --ref main
```

## Rollback

Restore `.github/workflows/pages.yml` from baseline
`409f1cff18072df367af0280c687dcbdf57bf688` through a reviewed PR, or revert this
workflow PR. That restores the original serial `build` and Pages flow. Review the
old manual-publishing behavior before using a restored manual workflow; do not run
an untrusted branch manually. No application/data rollback, storage clearing,
worker unregistration, PWA reinstall, manifest change, or cache migration is needed.
