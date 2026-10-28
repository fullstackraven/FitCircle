# Simple FitCircle versioning

## Architecture

GitHub Releases are the authoritative record of successful versions. Each release uses a `vMAJOR.MINOR.PATCH` tag targeting the full source commit, GitHub's publication timestamp, and readable PR summaries. `release/baseline.json` preserves the approved history through 2.11.0 (PR96, successful deployment 7372199689 at 2026-10-27T22:40:49Z). Original historical evidence and reconstruction files remain untouched. No historical tags/releases are created.

On a push to main, the existing non-cancelling serialized Pages workflow reads published releases, identifies merged PRs since the last version and uses their `release:patch`, `release:minor`, `release:major`, or `release:none` labels. Exactly one label is required. The highest impact determines one increment; a major label is the explicit developer decision, without another approval environment. Direct commits are rejected. Documentation-only `none` batches do not deploy or consume a version.

The candidate version, exact SHA and prior history are embedded before the single production build. Existing TypeScript, unit, storage and four-shard browser validation remain in place; Pages deploys that same artifact. Only after deployment succeeds does `record_release` create the GitHub Release and tag. PR/manual validation cannot publish. Failed deployments create no release; repeating the same commit produces no increment. An existing version with a different SHA is rejected. Old/stale commits cannot deploy over a newer published release.

The About layout remains compact. The app displays its embedded version and SHA, never a remote latest version. It retrieves only that version's GitHub Release, validates its full SHA, and displays its actual publication date. The existing metadata-only cache retains the result offline. A first launch offline before any verification shows a candidate and pending date rather than claiming a publication. No personal storage or backup behavior changes. Prior history is bundled offline; the current release is added when verified. The historical baseline is not a second manually maintained live version string.

## Removed

Removed the release-ledger branch dependency, initialization/admin workflow, activation variable, protected release reviewer jobs, reservation model, compare-and-swap registry writes, custom receipt matching, and associated implementation-specific tests. Replaced those tests with semantic increment, exact-build metadata, history, offline cache, and workflow safeguard tests. The old review documents describe the superseded design and remain as historical documentation.

## Ordinary maintenance and recovery

The only routine developer step is choosing one release label on a PR. This maintenance change is `release:patch`; absent other new releases, its first successful publication will be **2.11.1**. No dummy release is needed.

If Pages succeeds but GitHub Release creation fails, rerun the failed `record_release` job in that Actions run. The next planner checks for successful unrecorded deployments and stops with that instruction; it never reuses the version for another build. Existing exact-SHA releases make recording idempotent. No registry initialization/reconciliation procedure is needed. Keep ordinary Pages permissions and permit the trusted recording job's explicit `contents: write`; no new secrets, variables, environments, or backend are required. Existing repository rules that prohibit tag creation may need owner adjustment for `v*` release tags. Do not loosen unrelated protections.

GitHub's publication date can be a few seconds after Pages finishes; it is an actual release timestamp, not an invented build time. Public GitHub API rate limits/outages can delay first date verification; the app remains usable, retains the embedded version, and retries online. No automatic reload or service-worker changes occur.

## Rollback

Revert this PR to restore the previous implementation. Existing GitHub Releases/tags remain auditable and should not be deleted or renumbered. No fitness records, storage keys or backups need modification. Old cached builds retain their own embedded metadata.

## Validation

Results recorded after local validation below. GitHub-hosted execution and a live release transaction are not performed before owner approval.

Local results: `npm run check` passed; regression TypeScript check passed; `npm test` passed (354 tests); five focused simplified-release tests passed; `npm run audit:storage` passed (164 call sites, zero errors); `npm run build` passed and generated the Pages/PWA artifacts. Workflow YAML parsed successfully and job dependencies/conditions were reviewed. Actionlint could not run: the installed `go` executable does not support `go run`. Full browser and GitHub-hosted workflow execution remain for PR CI; no production release transaction was executed.
