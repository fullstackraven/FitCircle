import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifiedReceipt,statusRun} from '../scripts/release/receipts';
import type {Pending} from '../scripts/release/model';
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/pages-deployment-receipt.json','utf8'));
function setup(){
 const f=structuredClone(fixture);let statuses=[f.status];let deployments=[f.deployment];let jobs=[f.job];let latestAttempt=1;
 const pending:Pending={buildId:`${f.run.head_sha}-${f.run.id}-1`,commit:f.run.head_sha,version:'2.11.0',impact:'minor',previousId:'previous',changes:[],runId:String(f.run.id),artifactDigest:'c'.repeat(64)};
 const client={api:(path:string):any=>{
  if(path===`actions/runs/${f.run.id}/attempts/1`)return f.run;
  if(path===`actions/runs/${f.run.id}`)return {...f.run,run_attempt:latestAttempt};
  if(path.includes('/jobs?')){const page=Number(new URL(`https://api.github.com/${path}`).searchParams.get('page'));return {jobs:jobs.slice((page-1)*100,page*100)};}
  throw Error(`Unexpected API request ${path}`);
 },pages:(path:string):any[]=>path.startsWith('deployments?')?deployments:statuses};
 return {f,pending,client,statuses,deployments,setJobs:(value:any[])=>{jobs=value;},setLatestAttempt:(n:number)=>{latestAttempt=n;}};
}
test('real GitHub Pages job-suffixed receipt matches reserved workflow attempt',()=>{
 const x=setup();const result=verifiedReceipt(x.pending,x.client);
 assert.equal(result.deploymentId,'7362901786');assert.equal(result.runId,'40531878315');assert.equal(result.releasedAt,'2026-10-27T15:36:13Z');assert.equal(result.state,'success');
});
test('run-root links with optional trailing slash/query and legacy target_url are parsed exactly',()=>{
 for(const tail of ['', '/', '?check_suite_focus=true']){
  const x=setup();x.f.status.log_url=`https://github.com/fullstackraven/FitCircle/actions/runs/${x.pending.runId}${tail}`;x.f.status.target_url=x.f.status.log_url;
  assert.equal(verifiedReceipt(x.pending,x.client).state,'success');
  x.f.status.log_url='';assert.equal(verifiedReceipt(x.pending,x.client).state,'success');
 }
 for(const value of ['https://evil.example/fullstackraven/FitCircle/actions/runs/40531878315/job/1','https://github.com/other/FitCircle/actions/runs/40531878315/job/1','https://github.com/fullstackraven/FitCircle/actions/runs/405318783150/bogus','not a URL',null])assert.equal(statusRun(value),null);
});
test('duplicate success statuses are one deployment; multiple matching deployments remain ambiguous',()=>{
 const x=setup();x.statuses.push({...x.f.status,id:123,created_at:'2026-10-27T15:37:00Z'});
 assert.equal(verifiedReceipt(x.pending,x.client).releasedAt,x.f.status.created_at);
 x.deployments.push({...x.f.deployment,id:999});assert.throws(()=>verifiedReceipt(x.pending,x.client),/Ambiguous/);
});
test('different run, repository, SHA or environment cannot satisfy a successful pending deploy',()=>{
 for(const mutate of [
  (x:ReturnType<typeof setup>)=>{x.f.status.log_url=x.f.status.log_url.replace('40531878315','405318783150');},
  (x:ReturnType<typeof setup>)=>{x.f.status.log_url=x.f.status.log_url.replace('github.com','evil.example');},
  (x:ReturnType<typeof setup>)=>{x.f.deployment.sha='d'.repeat(40);},
  (x:ReturnType<typeof setup>)=>{x.f.deployment.environment='preview';}
 ]){const x=setup();mutate(x);assert.throws(()=>verifiedReceipt(x.pending,x.client),/keep reservation/);}
});
test('retry attempts cannot claim another attempt’s job or run-root success',()=>{
 const x=setup();x.f.job.id=999; // status still links the previous attempt job
 assert.throws(()=>verifiedReceipt(x.pending,x.client),/keep reservation/);
 const root=setup();root.f.status.log_url=`https://github.com/fullstackraven/FitCircle/actions/runs/${root.pending.runId}`;root.f.status.target_url=root.f.status.log_url;root.setLatestAttempt(2);
 assert.throws(()=>verifiedReceipt(root.pending,root.client),/keep reservation/);
 const wrong=setup();wrong.f.run.head_sha='d'.repeat(40);assert.throws(()=>verifiedReceipt(wrong.pending,wrong.client),/does not match/);
});
test('success missing its receipt never clears reservation, including a failed overall workflow',()=>{
 const x=setup();x.statuses.length=0;x.f.run.conclusion='failure';assert.throws(()=>verifiedReceipt(x.pending,x.client),/keep reservation/);
 x.f.job.conclusion='failure';assert.throws(()=>verifiedReceipt(x.pending,x.client),/keep reservation/); // Deploy step succeeded
});
test('only a terminal failed/cancelled reserved attempt with no successful deploy can clear pending',()=>{
 const x=setup();x.statuses.length=0;x.f.job.conclusion='failure';x.f.job.steps=[];
 x.f.run.status='in_progress';assert.throws(()=>verifiedReceipt(x.pending,x.client),/pending reservation/);
 x.f.run.status='completed';x.f.run.conclusion='failure';assert.equal(verifiedReceipt(x.pending,x.client).state,'failure');
 x.f.run.conclusion='cancelled';assert.equal(verifiedReceipt(x.pending,x.client).state,'cancelled');
});
test('attempt job pagination cannot hide an already successful deploy during recovery',()=>{
 const x=setup();x.setJobs([...Array.from({length:100},(_,i)=>({...x.f.job,id:i,name:`test-${i}`})),x.f.job]);
 assert.equal(verifiedReceipt(x.pending,x.client).state,'success');x.statuses.length=0;assert.throws(()=>verifiedReceipt(x.pending,x.client),/keep reservation/);
});
