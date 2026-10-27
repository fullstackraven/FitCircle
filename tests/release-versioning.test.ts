import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyChanges,compareVersions,incrementVersion,planRelease,recordPublication,createBuildMetadata,resolvePublishedBuild,formatBuildVersion,stableVersion,type PublishedRelease} from '../client/src/lib/release-metadata';
const a='a'.repeat(40),b='b'.repeat(40),digest='c'.repeat(64);
const last:PublishedRelease={version:'2.10.3',commit:a,artifactDigest:digest,releasedAt:'2026-10-27T11:39:54Z',deploymentId:'1'};
const change=(impact:string)=>[{id:'PR-test',labels:[`release:${impact}`]}];
const receipt={state:'success' as const,event:'push' as const,ref:'refs/heads/main',environment:'github-pages',commit:b,artifactDigest:digest,completedAt:'2026-10-28T00:00:00Z',deploymentId:'2'};
test('stable semantic ordering, increments and major approval',()=>{
 assert.equal(compareVersions('2.9.99','2.10.0'),-1);assert.equal(compareVersions('3.0.0','2.99.99'),1);assert.equal(compareVersions('2.0.0','2.0.0'),0);
 assert.equal(incrementVersion('2.9.3','minor'),'2.10.0');assert.equal(incrementVersion('2.9.3','patch'),'2.9.4');assert.equal(incrementVersion('2.9.3','none'),'2.9.3');
 assert.throws(()=>incrementVersion('2.9.3','major'));assert.equal(incrementVersion('2.9.3','major',true),'3.0.0');
 for(const invalid of ['2.01.0','2.0','v2.0.0','2.0.0-rc.1','-2.0.0','9007199254740992.0.0'])assert.throws(()=>stableVersion(invalid));
});
test('multiple PRs use highest explicit classification once, missing/ambiguous labels fail closed',()=>{
 assert.equal(classifyChanges([{id:'1',labels:['release:patch','bug']},{id:'2',labels:['release:minor']},{id:'3',labels:['release:none']}]),'minor');
 for(const labels of [[],['release:patch','release:minor'],['release:guess']])assert.throws(()=>classifyChanges([{id:'1',labels}]));
 assert.throws(()=>classifyChanges([]));assert.throws(()=>classifyChanges([...change('patch'),...change('patch')]));
 assert.equal(planRelease(last,b,change('none'))!.version,last.version);
 assert.equal(planRelease(last,b,[{id:'1',labels:['release:minor']},{id:'2',labels:['release:minor']}])!.version,'2.11.0');
});
test('failed/cancelled deploy preserves official version and retry reuses same candidate',()=>{
 const candidate=planRelease(last,b,change('patch'))!;
 for(const state of ['failure','cancelled'] as const)assert.equal(recordPublication(last,candidate,{...receipt,state},digest),last);
 assert.deepEqual(planRelease(last,b,change('patch')),candidate);
 assert.equal(recordPublication(last,candidate,receipt,digest).version,'2.10.4');
});
test('idempotent repeat, race detection, production guard and artifact identity',()=>{
 const c=planRelease(last,b,change('patch'))!,done=recordPublication(last,c,receipt,digest);
 assert.equal(planRelease(done,b,[]),null);assert.equal(recordPublication(done,c,receipt,digest),done);
 assert.throws(()=>recordPublication({...last,commit:'d'.repeat(40)},c,receipt,digest));
 for(const override of [{event:'pull_request' as const},{event:'workflow_dispatch' as const},{ref:'refs/heads/feature'},{environment:'preview'},{commit:a},{artifactDigest:'d'.repeat(64)},{completedAt:'not-a-date'}])assert.throws(()=>recordPublication(last,c,{...receipt,...override},digest));
 assert.throws(()=>recordPublication(last,{...c,version:'2.10.9'},receipt,digest));
 const major=planRelease(last,b,change('major'),true)!;assert.throws(()=>recordPublication(last,major,receipt,digest));
});
test('build metadata and display follow loaded build, never latest release; development is explicit',()=>{
 const dev=createBuildMetadata(a);assert.equal(dev.stage,'development');assert.equal(dev.releasedAt,null);assert.equal(formatBuildVersion(dev),'Development · aaaaaaaa');
 const candidate=planRelease(last,b,change('patch'))!, build=createBuildMetadata(b,candidate,digest);
 assert.equal(formatBuildVersion(build),'FitCircle 2.10.4 (candidate) · bbbbbbbb');assert.equal(resolvePublishedBuild(build,last),build);
 assert.throws(()=>createBuildMetadata(a,candidate));
 const published=recordPublication(last,candidate,receipt,digest),resolved=resolvePublishedBuild(build,published);
 assert.equal(resolved.releasedAt,receipt.completedAt);assert.equal(formatBuildVersion(resolved),'FitCircle 2.10.4 · bbbbbbbb');
 assert.equal(resolvePublishedBuild(build,{...published,artifactDigest:'d'.repeat(64)}),build);
 assert.equal(resolvePublishedBuild(dev,published),dev);
});
test('historical ledger has evidence for every boundary and exactly applies reviewed increments',()=>{
 const ledger=JSON.parse(fs.readFileSync('release/history.json','utf8'));
 const evidence=JSON.parse(fs.readFileSync('release/evidence.json','utf8'));
 assert.equal(ledger.status,'proposal-not-activated');assert.equal(ledger.releases[0].version,'2.0.0');assert.equal(ledger.releases[0].commit,ledger.baseline);
 const seen=new Set(),prs=new Set();
 for(let i=0;i<ledger.releases.length;i++){
  const r=ledger.releases[i];assert.ok(!seen.has(r.commit));seen.add(r.commit);stableVersion(r.version);
  assert.equal(r.versionApproval,'proposed');assert.equal(r.verification,'deployment-success-verified');
  const d=evidence.deployments.find((d:any)=>d.id===r.evidence.deploymentId);assert.equal(d.sha,r.commit);
  assert.ok(d.statuses.some((s:any)=>s.state==='success'&&s.created_at===r.releasedAt&&s.url===r.evidence.statusUrl));
  for(const pr of r.prs){assert.ok(!prs.has(pr));prs.add(pr);assert.ok(evidence.pullRequests.some((p:any)=>p.number===pr&&p.mergedAt));}
  if(i){const prev=ledger.releases[i-1];assert.ok(r.releasedAt>prev.releasedAt);assert.equal(r.version,incrementVersion(prev.version,r.classification));assert.equal(classifyChanges(r.changes.map((c:any,i:number)=>({id:String(i),labels:[`release:${c.classification}`]}))),r.classification);}
 }
 assert.equal(ledger.proposedCurrentVersion,ledger.releases.at(-1).version);
 assert.deepEqual(ledger.releases.find((r:any)=>r.prs.includes(76)).prs,[72,73,74,75,76,77]);
 assert.deepEqual(ledger.releases.find((r:any)=>r.prs.includes(90)).prs,[90,91]);
 const expected=evidence.pullRequests.filter((p:any)=>p.mergedAt).map((p:any)=>p.number).sort((a:number,b:number)=>a-b);
 assert.deepEqual([...prs].sort((a:any,b:any)=>a-b),expected);
});
