import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextVersion,releaseEntry} from '../scripts/release/simple';
import {applyReleaseReceipt,appVersionLabel,type ApplicationBuild} from '../client/src/lib/application-version';
const commit='a'.repeat(40);
const build:ApplicationBuild={version:'2.11.1',commit,buildId:commit,stage:'candidate',releasedAt:null,history:[]};
const release={tag_name:'v2.11.1',target_commitish:commit,published_at:'2026-10-28T12:00:00Z',body:'Fix version display'};
test('PR labels determine one semantic increment for grouped changes',()=>{
 for(const [impact,expected] of [['patch','2.11.1'],['minor','2.12.0'],['major','3.0.0'],['none','2.11.0']])assert.equal(nextVersion('2.11.0',[{id:'1',labels:[`release:${impact}`]}]),expected);
 assert.equal(nextVersion('2.11.0',[{id:'1',labels:['release:patch']},{id:'2',labels:['release:minor']}]),'2.12.0');
 assert.throws(()=>nextVersion('2.11.0',[{id:'1',labels:[]} ]));
 assert.throws(()=>nextVersion('2.11.0',[{id:'1',labels:['release:patch','release:minor']} ]));
});
test('only the matching published GitHub release resolves loaded metadata',()=>{
 const resolved=applyReleaseReceipt(build,release);assert.equal(resolved.stage,'published');assert.equal(resolved.releasedAt,release.published_at);assert.equal(resolved.history[0].summary,release.body);
 for(const r of [{...release,target_commitish:'b'.repeat(40)},{...release,tag_name:'v2.12.0'},{...release,draft:true},{...release,published_at:null}])assert.equal(applyReleaseReceipt(build,r),build);
 assert.equal(appVersionLabel({...build,stage:'development'}),'Development');
 assert.equal(releaseEntry(release).version,'2.11.1');
});
test('approved baseline preserves full historical history and verified 2.11.0',async()=>{
 const fs=await import('node:fs');const baseline=JSON.parse(fs.readFileSync('release/baseline.json','utf8'));
 const original=JSON.parse(fs.readFileSync('release/history.json','utf8')).releases;
 assert.deepEqual(baseline.slice(0,-1),original);assert.equal(baseline.at(-1).version,'2.11.0');assert.equal(baseline.at(-1).commit,'b5767380eca4b6b295bae43065eeaecb3048b459');
});
test('matching release metadata stays available offline without fitness storage',async()=>{
 const {loadReleaseReceipt}=await import('../client/src/lib/application-version');
 const oldFetch=globalThis.fetch,descriptor=Object.getOwnPropertyDescriptor(globalThis,'caches');let cached:Response|undefined;
 Object.defineProperty(globalThis,'caches',{configurable:true,value:{open:async()=>({match:async()=>cached?.clone(),put:async(_u:string,r:Response)=>{cached=r.clone();}})}});
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify(release));
  assert.equal((await loadReleaseReceipt(build)).stage,'published');
  globalThis.fetch=async()=>{throw Error('offline');};
  assert.equal((await loadReleaseReceipt(build)).releasedAt,release.published_at);
  cached=undefined;assert.equal((await loadReleaseReceipt(build)).stage,'candidate');
 }finally{globalThis.fetch=oldFetch;if(descriptor)Object.defineProperty(globalThis,'caches',descriptor);else Reflect.deleteProperty(globalThis,'caches');}
});
test('workflow records only successful main deployments and preserves the tested artifact',async()=>{
 const fs=await import('node:fs');const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
 assert.match(workflow,/cancel-in-progress: \$\{\{ github.event_name != 'push' \}\}/);
 assert.match(workflow,/needs\.deploy\.result == 'success'/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/name: tested-site/);
 assert.doesNotMatch(workflow,/FITCIRCLE_RELEASES_ENABLED|reserve_release|approve_major/);
 assert.equal(workflow.match(/run: npm run build/g)?.length,1);
});
