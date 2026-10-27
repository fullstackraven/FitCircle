"""Offline proposal generator. Reads captured evidence + reviewed classifications; no network/tags/deploys.
Run from repository root: python3 scripts/reconstruct-release-history.py
"""
import json
import subprocess
from pathlib import Path

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

def ancestor(a, b):
    return subprocess.run(['git', 'merge-base', '--is-ancestor', a, b], check=False).returncode == 0

evidence = json.loads(Path('release/evidence.json').read_text())
classes = json.loads(Path('release/classifications.json').read_text())
baseline = 'dbb0d2ccf3c0f6e7685b32d52b67e32022eb05f4'
# This is the custom build/test/static-artifact deployment, not the earlier
# dynamic Pages deployment of the same SHA at 04:05:31.
baseline_deployment = 7083569120
prs = [p for p in evidence['pullRequests'] if p['mergedAt']]
successes = []
for d in evidence['deployments']:
    for s in d['statuses']:
        if s['state'] == 'success' and ancestor(baseline, d['sha']):
            if d['sha'] == baseline and d['id'] != baseline_deployment:
                continue
            successes.append((s['created_at'], d, s))
successes.sort(key=lambda row: (row[0], row[1]['id']))
versions = [2, 0, 0]
previous = None
releases = []
for date, d, status in successes:
    sha = d['sha']
    if any(r['commit'] == sha for r in releases):
        continue  # repeated publication of identical source is not a new release
    if previous and not ancestor(previous, sha):
        raise ValueError('Non-linear publication: explicit rollback classification required')
    included = [] if previous is None else [p for p in prs if ancestor(p['mergeCommit']['oid'], sha) and not ancestor(p['mergeCommit']['oid'], previous)]
    included.sort(key=lambda p: p['mergedAt'])
    commits = [] if previous is None else git('rev-list', '--first-parent', '--reverse', f'{previous}..{sha}').splitlines()
    changes = []
    for p in included:
        c = classes['pullRequests'][str(p['number'])]  # no title guessing or default
        changes.append({'pr': p['number'], **c})
    merged = {p['mergeCommit']['oid'] for p in included}
    for c in commits:
        if c not in merged:
            classification = classes['directCommits'][c[:7]]
            changes.append({'commit': c, 'summary': git('show', '-s', '--format=%s', c), **classification})
    classification = 'baseline' if previous is None else max((c['classification'] for c in changes), key=['none', 'patch', 'minor', 'major'].index)
    if previous:
        if classification == 'major': versions = [versions[0]+1, 0, 0]
        if classification == 'minor': versions = [versions[0], versions[1]+1, 0]
        if classification == 'patch': versions[2] += 1
    releases.append({'version': '.'.join(map(str, versions)), 'releasedAt': date, 'commit': sha,
        'prs': [p['number'] for p in included], 'classification': classification,
        'summary': 'Static GitHub Pages PWA migration with safe backups' if previous is None else '; '.join(c['summary'] for c in changes),
        'rationale': 'Owner-requested 2.x platform baseline' if previous is None else 'Highest reviewed classification of changes since previous verified publication.',
        'changes': changes, 'verification': 'deployment-success-verified', 'versionApproval': 'proposed',
        'evidence': {'deploymentId': d['id'], 'statusUrl': status['url'], 'runUrl': status['log_url']},
        'sourceCommits': commits})
    previous = sha
ledger = {'schemaVersion': 1, 'status': 'proposal-not-activated', 'baseline': baseline,
    'proposedCurrentVersion': releases[-1]['version'], 'evidenceCutoffCommit': evidence['mainAtAudit'], 'releases': releases}
Path('release/history.json').write_text(json.dumps(ledger, indent=2)+'\n')
lines = ['# Proposed FitCircle 2.x release history', '', 'Not activated or tagged. Publication evidence is verified; version numbers/classifications require owner approval.', '',
         'Dates below are GitHub deployment success-status timestamps (UTC), not commit dates or estimates.',
         'Repeated version numbers mark a verified publication of documentation/unused-file changes with no version increment.', '',
         f"Proposed current version: **{releases[-1]['version']}** at `{releases[-1]['commit']}`.", '']
for r in reversed(releases):
    lines += [f"## {r['version']} — {r['releasedAt']} ({r['classification']})", '', r['summary'], '',
              f"Commit: [`{r['commit'][:8]}`](https://github.com/fullstackraven/FitCircle/commit/{r['commit']}). PRs: {', '.join('#'+str(n) for n in r['prs']) or 'direct commit'}. [Deployment evidence]({r['evidence']['statusUrl']}) · [Run]({r['evidence']['runUrl']}).", '',
              r['rationale'], '']
    lines += [f"- {c.get('pr', c.get('commit', '')[:8])}: {c['classification']} — {c['rationale']}" for c in r['changes']]
    lines += ['']
Path('release/CHANGELOG.md').write_text('\n'.join(lines)+'\n')
print(f"{len(releases)} verified publication boundaries; proposed {releases[-1]['version']}")
