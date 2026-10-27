/** Pure, inactive release metadata contract. Not imported by the application yet. */
export type ReleaseImpact = 'none' | 'patch' | 'minor' | 'major';
export interface PublishedRelease {
  version: string;
  commit: string;
  artifactDigest: string;
  releasedAt: string;
  deploymentId: string;
}
export interface CandidateRelease {
  version: string;
  commit: string;
  baseCommit: string;
  impact: ReleaseImpact;
  changeIds: string[];
}
export interface BuildMetadata {
  version: string;
  commit: string;
  artifactDigest: string | null;
  stage: 'development' | 'candidate' | 'published';
  releasedAt: string | null;
}
export function stableVersion(value: string): [number, number, number] {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) throw new Error('Expected stable major.minor.patch');
  const parts = value.split('.').map(Number);
  if (parts.some(n => !Number.isSafeInteger(n))) throw new Error('Version exceeds safe integer range');
  return parts as [number, number, number];
}
export function compareVersions(a: string, b: string): number {
  const av = stableVersion(a), bv = stableVersion(b);
  for (let i=0;i<3;i++) if(av[i]!==bv[i]) return av[i]<bv[i] ? -1 : 1;
  return 0;
}
export function incrementVersion(version: string, impact: ReleaseImpact, majorApproved = false): string {
  const [major, minor, patch] = stableVersion(version);
  if (impact === 'major' && !majorApproved) throw new Error('Major release requires explicit approval');
  const next = impact === 'major' ? `${major+1}.0.0` : impact === 'minor' ? `${major}.${minor+1}.0` : impact === 'patch' ? `${major}.${minor}.${patch+1}` : version;
  stableVersion(next);
  return next;
}
export function classifyChanges(changes: readonly {id: string; labels: readonly string[]}[]): ReleaseImpact {
  if (!changes.length) throw new Error('Unclassified source change');
  const order: ReleaseImpact[] = ['none','patch','minor','major'];
  const seen = new Set<string>();
  let impact: ReleaseImpact = 'none';
  for (const change of changes) {
    if (!change.id || seen.has(change.id)) throw new Error('Duplicate or missing change identity');
    seen.add(change.id);
    const labels = change.labels.filter(label=>label.startsWith('release:'));
    if (labels.length !== 1 || !order.includes(labels[0].slice(8) as ReleaseImpact)) throw new Error(`Explicit release classification required: ${change.id}`);
    const next = labels[0].slice(8) as ReleaseImpact;
    if(order.indexOf(next)>order.indexOf(impact)) impact=next;
  }
  return impact;
}
export function validateCommit(commit: string): void {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Full source commit SHA required');
}
export function planRelease(last: PublishedRelease, commit: string, changes: readonly {id:string;labels:readonly string[]}[], majorApproved=false): CandidateRelease | null {
  validateCommit(commit); validateCommit(last.commit); stableVersion(last.version);
  if(last.commit === commit) return null;
  const impact = classifyChanges(changes);
  return {version:incrementVersion(last.version,impact,majorApproved), commit, baseCommit:last.commit, impact, changeIds:changes.map(c=>c.id)};
}
/** Failed/cancelled attempts do not advance the official record. A caller must persist with CAS. */
export function recordPublication(last: PublishedRelease, candidate: CandidateRelease, receipt: {
  state:'success'|'failure'|'cancelled'; event:'push'|'pull_request'|'workflow_dispatch';
  ref:string; environment:string; commit:string; artifactDigest:string; completedAt:string; deploymentId:string;
}, testedArtifactDigest: string, majorApproved = false): PublishedRelease {
  if (receipt.state !== 'success') return last;
  if (receipt.event !== 'push' || receipt.ref !== 'refs/heads/main' || receipt.environment !== 'github-pages') throw new Error('Only a successful main Pages publication may advance the record');
  validateCommit(candidate.commit);
  if (receipt.commit !== candidate.commit || receipt.artifactDigest !== testedArtifactDigest || !/^[a-f0-9]{64}$/.test(testedArtifactDigest)) throw new Error('Publication does not match the tested artifact');
  stableVersion(candidate.version);
  if (last.commit === candidate.commit) {
    if (last.version !== candidate.version || last.artifactDigest !== testedArtifactDigest) throw new Error('Conflicting repeat publication');
    return last;
  }
  if (last.commit !== candidate.baseCommit) throw new Error('Stale candidate; re-plan under publication lock');
  if (candidate.version !== incrementVersion(last.version,candidate.impact,majorApproved)) throw new Error('Invalid candidate increment');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(receipt.completedAt) || !Number.isFinite(Date.parse(receipt.completedAt)) || !receipt.deploymentId) throw new Error('Verified deployment timestamp/identity required');
  return {version:candidate.version,commit:candidate.commit,artifactDigest:testedArtifactDigest,releasedAt:receipt.completedAt,deploymentId:receipt.deploymentId};
}
/** Candidate metadata is embedded in its build; never substitute metadata for another SHA. */
export function createBuildMetadata(commit: string, candidate?: CandidateRelease, artifactDigest?: string): BuildMetadata {
  validateCommit(commit);
  if(candidate && candidate.commit !== commit) throw new Error('Candidate/build source mismatch');
  if(candidate) stableVersion(candidate.version);
  if(artifactDigest && !/^[a-f0-9]{64}$/.test(artifactDigest)) throw new Error('Invalid artifact digest');
  return {version:candidate?.version ?? '0.0.0-dev',commit,artifactDigest:artifactDigest??null,stage:candidate?'candidate':'development',releasedAt:null};
}
export function resolvePublishedBuild(build: BuildMetadata, receipt?: PublishedRelease): BuildMetadata {
  if (!receipt || build.stage === 'development' || build.commit !== receipt.commit || build.version !== receipt.version || !build.artifactDigest || build.artifactDigest !== receipt.artifactDigest) return build;
  return {...build,stage:'published',releasedAt:receipt.releasedAt};
}
export function formatBuildVersion(build: BuildMetadata): string {
  return `${build.stage === 'development' ? 'Development' : `FitCircle ${build.version}`}${build.stage === 'candidate' ? ' (candidate)' : ''} · ${build.commit.slice(0,8)}`;
}
