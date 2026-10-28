import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {run,all} from '../scripts/release/simple';
const baseline='a'.repeat(40),first='b'.repeat(40),second='c'.repeat(40);
function fixture(t:any){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'fitcircle-release-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));fs.mkdirSync(path.join(directory,'release'));
 fs.writeFileSync(path.join(directory,'release/history.json'),JSON.stringify({releases:[]}));
 fs.writeFileSync(path.join(directory,'release/baseline.json'),JSON.stringify({version:'2.11.0',commit:baseline,releasedAt:'2026-10-27T22:40:49Z'}));
 let head=first,fail=false,creates=0;const labels:Record<string,string>={[first]:'patch',[second]:'patch'};
 const releases:any[]=[],deployments:any[]=[],tags:any[]=[];const statuses:Record<string,any[]>={};
 const request=(route:string):any=>{
  const [resource,q]=route.split('?');const page=Number(new URLSearchParams(q).get('page')||1);
  let rows:any[];
  if(resource==='releases')rows=releases;
  else if(resource==='deployments')rows=deployments;
  else if(resource.startsWith('deployments/'))rows=statuses[resource.split('/')[1]]||[];
  else if(resource.startsWith('git/matching-refs/'))return tags;
  else if(resource.startsWith('git/tags/'))return {object:{type:'commit',sha:first}};
  else if(resource.startsWith('commits/')){const sha=resource.split('/')[1];return [{number:sha===first?1:2,merged_at:'date',base:{ref:'main'},merge_commit_sha:sha,title:'Fix',labels:[{name:`release:${labels[sha]}`}]}];}
  else throw Error(`Unexpected API call ${route}`);
  return rows.slice((page-1)*100,page*100);
 };
 const git=(...args:string[])=>{if(args[0]==='rev-parse')return head;if(args[0]!=='rev-list')return '';const chain=[baseline,first,second];return chain.slice(chain.indexOf(args.at(-1)!.split('..')[0])+1,chain.indexOf(head)+1).join('\n');};
 const gh=(...args:string[])=>{
  assert.deepEqual(args.slice(0,2),['release','create']);assert.equal(args[args.indexOf('--target')+1],head);
  creates++;if(fail)throw Error('GitHub Release creation failed');
  releases.unshift({tag_name:args[2],target_commitish:head,published_at:'2026-10-28T12:00:00Z',body:'Fix'});return '';
 };
 return {directory,releases,deployments,statuses,tags,request,setHead:(v:string)=>{head=v;},setLabel:(v:string)=>{labels[head]=v;},setFail:(v:boolean)=>{fail=v;},creates:()=>creates,run:(command:string)=>run(command,request,git,gh,directory,head)};
}
test('failed recording blocks advancement; retry recovers once; next release advances once',async t=>{
 const f=fixture(t);assert.equal((await f.run('plan'))?.version,'2.11.1');
 f.deployments.push({id:1,environment:'github-pages',sha:first,created_at:'2026-10-28T11:59:00Z'});
 f.statuses['1']=[{state:'success',created_at:'2026-10-28T11:59:05Z'}];
 f.setFail(true);await assert.rejects(f.run('publish'),/creation failed/);assert.equal(f.releases.length,0);
 await assert.rejects(f.run('plan'),/rerun its failed record_release/);
 f.setFail(false);await f.run('publish');await f.run('publish');assert.equal(f.releases.length,1);assert.equal(f.creates(),2);
 assert.equal((await f.run('plan'))?.publish,false);
 f.setHead(second);assert.equal((await f.run('plan'))?.version,'2.11.2');
});
test('conflicting versions, commit aliases, existing tags and draft releases are rejected',async t=>{
 const f=fixture(t);await f.run('plan');
 f.releases.push({tag_name:'v2.11.1',target_commitish:second,published_at:'2026-10-28T12:00:00Z'});
 await assert.rejects(f.run('publish'),/another build/);
 f.releases[0]={tag_name:'v2.11.0',target_commitish:second,published_at:'2026-10-28T12:00:00Z'};
 await assert.rejects(f.run('plan'),/Conflicting/);
 f.releases[0]={tag_name:'v2.11.1',target_commitish:baseline,published_at:'2026-10-28T12:00:00Z'};
 await assert.rejects(f.run('plan'),/Conflicting/);
 f.releases[0]={tag_name:'v2.11.1',target_commitish:first,draft:true};await assert.rejects(f.run('publish'),/another build/);
 f.releases.length=0;f.tags.push({ref:'refs/tags/v2.11.1',object:{type:'commit',sha:second}});
 await assert.rejects(f.run('publish'),/tag already belongs/);assert.equal(f.creates(),0);
 f.tags[0].object={type:'tag',sha:'d'.repeat(40)};await f.run('publish');assert.equal(f.creates(),1);
});
test('none skips publication, remains in next meaningful batch, and does not create releases',async t=>{
 const f=fixture(t);f.setLabel('none');const p=await f.run('plan');assert.equal(p?.publish,false);assert.equal(p?.version,'2.11.0');
 await assert.rejects(f.run('publish'),/Wrong publication/);assert.equal(f.creates(),0);
 f.setHead(second);f.setLabel('minor');const next=await f.run('plan');assert.equal(next?.version,'2.12.0');assert.equal(next?.changes.length,2);assert.deepEqual(next?.changes.map(c=>c.labels[0]),['release:none','release:minor']);
});
test('pagination includes later pages and unrelated or unsorted deployment records cannot mask success',async t=>{
 const f=fixture(t);
 f.deployments.push(...Array.from({length:100},(_,id)=>({id,environment:'preview',sha:second,created_at:'2020-01-01T00:00:00Z'})),{id:101,environment:'github-pages',sha:first,created_at:'2026-10-28T11:00:00Z'});
 f.statuses['101']=[...Array.from({length:100},()=>({state:'failure',created_at:'2026-10-28T11:00:00Z'})),{state:'success',created_at:'2026-10-28T11:01:00Z'}];
 await assert.rejects(f.run('plan'),/Deployment 101/);
 f.statuses['101'].at(-1).state='cancelled';assert.equal((await f.run('plan'))?.version,'2.11.1');
 const rows=Array.from({length:201},(_,id)=>({id}));const calls:string[]=[];
 assert.equal(all('releases',route=>{calls.push(route);const page=Number(new URLSearchParams(route.split('?')[1]).get('page'));return rows.slice((page-1)*100,page*100);}).length,201);assert.equal(calls.length,3);
});
