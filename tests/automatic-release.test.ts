import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {plan,reserve,reconcile,assertAppendOnly,type Registry} from '../scripts/release/model';
import {writeRegistry} from '../scripts/release/github';
import {payloadDigest} from '../scripts/release/cli';
import {applyReleaseReceipt,appVersionLabel,loadReleaseReceipt,type ApplicationBuild} from '../client/src/lib/application-version';
const sha='a'.repeat(40),next='b'.repeat(40),digest='c'.repeat(64);
const base:Registry={schemaVersion:1,pending:null,records:[{id:'deployment-1',version:'2.10.3',commit:sha,buildId:null,artifactDigest:null,runId:'1',deploymentId:'1',releasedAt:'2026-10-27T00:00:00Z',changes:[],previousId:null,historical:true}]};
const changes=[{id:'pr2',pr:2,summary:'Release history',labels:['release:minor']}];
const candidate=()=>({...plan(base,next,changes,'2','1')!,artifactDigest:digest});
const receipt={state:'success' as const,commit:next,runId:'2',deploymentId:'2',releasedAt:'2026-10-28T00:00:00Z',environment:'github-pages'};
test('plan aggregates explicit classifications, none skips publication and major requires approval',()=>{
 assert.equal(plan(base,next,changes,'2','1')!.version,'2.11.0');
 assert.equal(plan(base,next,[{...changes[0],labels:['release:none']}],'2','1'),null);
 assert.equal(plan(base,sha,[],'2','1'),null);
 assert.throws(()=>plan(base,next,[{...changes[0],labels:[]}],'2','1'));
 assert.throws(()=>plan(base,next,[{...changes[0],labels:['release:major']}],'2','1'));
 assert.equal(plan(base,next,[{...changes[0],labels:['release:major']}],'2','1',true)!.version,'3.0.0');
});
test('failed/cancelled attempt can retry without a version gap; success advances once',()=>{
 assert.throws(()=>reserve(base,{...candidate(),version:'3.0.0'}));
 const pending=reserve(base,candidate());
 for(const state of ['failure','cancelled'] as const){const reset=reconcile(pending,{...receipt,state});assert.deepEqual(reset,base);assert.equal(plan(reset,next,changes,'3','1')!.version,'2.11.0');}
 const published=reconcile(pending,receipt);assert.equal(published.records.length,2);assert.equal(published.pending,null);assert.equal(plan(published,next,[],'3','1'),null);assert.equal(reconcile(published,receipt),published);
});
test('publication succeeded but recording failed: durable pending blocks until exact receipt recovery',()=>{
 const durable=reserve(base,candidate());
 assert.throws(()=>plan(durable,'d'.repeat(40),changes,'3','1'),/reconcile/);
 assert.throws(()=>reconcile(durable,{...receipt,commit:sha}));assert.throws(()=>reconcile(durable,{...receipt,runId:'99'}));
 const recovered=reconcile(durable,receipt);assert.equal(recovered.records[1].version,'2.11.0');assert.equal(reconcile(recovered,receipt),recovered);
 assert.throws(()=>reserve(recovered,candidate()),/Stale/);
});
test('registry cannot rewrite history; competing REST ref updates reject non-fast-forward writer',()=>{
 assert.throws(()=>assertAppendOnly(base,{...base,records:[{...base.records[0],version:'2.9.9'}]}));
 let head='old';let number=0;const parents=new Map<string,string>();
 const request:any=(path:string,method:string,body:any)=>{
  if(path.startsWith('contents/'))return {content:Buffer.from(JSON.stringify(base)).toString('base64')};
  if(path==='git/commits/old')return {tree:{sha:'tree'}};
  if(path==='git/trees')return {sha:'newtree'};
  if(path==='git/commits'){const id=String(++number);parents.set(id,body.parents[0]);return {sha:id};}
  if(path==='git/refs/heads/release-ledger'){assert.equal(body.force,false);if(parents.get(body.sha)!==head)throw Error('non-fast-forward');head=body.sha;return {};}
  throw Error(path);
 };
 writeRegistry('old',reserve(base,candidate()),undefined,request);
 assert.throws(()=>writeRegistry('old',reserve(base,candidate()),undefined,request),/non-fast-forward/);
});
test('payload digest includes actual tested files and detects changed content',()=>{
 const root=mkdtempSync(join(tmpdir(),'fitcircle-release-'));try{writeFileSync(join(root,'index.html'),'one');const a=payloadDigest(root);assert.equal(a,payloadDigest(root));writeFileSync(join(root,'index.html'),'two');assert.notEqual(a,payloadDigest(root));}finally{rmSync(root,{recursive:true});}
});
const build:ApplicationBuild={version:'2.11.0',commit:next,buildId:`${next}-2-1`,stage:'candidate',releasedAt:null,history:[]};
const published=()=>reconcile(reserve(base,candidate()),receipt).records[1];
test('loaded-build metadata rejects unrelated receipts and preserves development/candidate labels',()=>{
 assert.equal(appVersionLabel(build),'2.11.0 (candidate)');assert.equal(appVersionLabel({...build,stage:'development'}),'Development');
 assert.equal(applyReleaseReceipt(build,{...published(),buildId:'newer-build'}),build);
 assert.equal(applyReleaseReceipt(build,{...published(),commit:sha}),build);
 assert.equal(applyReleaseReceipt(build,{...published(),artifactDigest:'unknown'}),build);
 const resolved=applyReleaseReceipt(build,published());assert.equal(appVersionLabel(resolved),'2.11.0');assert.equal(resolved.releasedAt,receipt.releasedAt);assert.equal(resolved.history[0].version,'2.11.0');
});
test('verified receipt remains available offline without localStorage; unavailable receipts stay pending',async()=>{
 const originalFetch=globalThis.fetch,originalCaches=Object.getOwnPropertyDescriptor(globalThis,'caches');
 let cached:Response|undefined;let calls=0;
 Object.defineProperty(globalThis,'caches',{configurable:true,value:{open:async()=>({match:async()=>cached?.clone(),put:async(_url:string,r:Response)=>{cached=r.clone();}})}});
 try{
  globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify(published()),{status:200});};
  assert.equal((await loadReleaseReceipt(build)).stage,'published');
  globalThis.fetch=async()=>{throw Error('offline');};assert.equal((await loadReleaseReceipt(build)).stage,'published');assert.equal(calls,1);
  cached=undefined;assert.equal((await loadReleaseReceipt(build)).stage,'candidate');
 }finally{globalThis.fetch=originalFetch;if(originalCaches)Object.defineProperty(globalThis,'caches',originalCaches);else Reflect.deleteProperty(globalThis,'caches');}
});
test('receipt cache is registered metadata and cannot enter fitness backups',async()=>{
 const {findStorageSource,isBackupKey}=await import('../client/src/lib/storage-registry');
 assert.equal(findStorageSource('CacheStorage','fitcircle-release-receipts-v1')?.backup,false);
 assert.equal(isBackupKey('fitcircle-release-receipts-v1'),false);
});
