import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {api,pages,git,ancestor,readRegistry,writeRegistry} from './github';
import {plan,reserve,reconcile,validateRegistry,type Registry,type Pending,type Change,type Receipt} from './model';
import {classifyChanges,incrementVersion} from '../../client/src/lib/release-metadata';
const config=JSON.parse(fs.readFileSync('release/activation.json','utf8'));
const file='.release-candidate.json';
const output=(key:string,value:string)=>{if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`${key}=${value}\n`);};
export function payloadDigest(root:string):string{
 const hash=createHash('sha256');
 const walk=(dir:string):void=>{for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){const name=path.join(dir,e.name);if(e.isDirectory())walk(name);else hash.update(path.relative(root,name).split(path.sep).join('/')+'\0').update(fs.readFileSync(name));}};
 walk(root);return hash.digest('hex');
}
function changesBetween(from:string,to:string,exceptions=false):Change[]{
 if(!ancestor(from,to))throw Error('Non-linear publication requires an explicitly reviewed revert commit');
 return git('rev-list','--first-parent','--reverse',`${from}..${to}`).split('\n').filter(Boolean).map(sha=>{
  const prs=pages<any>(`commits/${sha}/pulls`).filter(p=>p.merged_at&&p.base.ref==='main'&&p.merge_commit_sha===sha);
  if(prs.length!==1)throw Error(`Direct/unassociated commit ${sha}: use a classified PR (no implicit exception)`);
  const p=prs[0];const override=exceptions?config.historicalExceptions[String(p.number)]:undefined;
  const labels=override?[`release:${override.classification}`]:p.labels.map((l:any)=>l.name);
  classifyChanges([{id:String(p.number),labels}]);
  return {id:`PR-${p.number}`,pr:p.number,summary:p.title,labels:labels.filter((l:string)=>l.startsWith('release:'))};
 });
}
function successfulDeployments(){
 return pages<any>('deployments?environment=github-pages').flatMap(d=>pages<any>(`deployments/${d.id}/statuses`).filter(s=>s.state==='success').map(s=>({d,s}))).sort((a,b)=>a.s.created_at.localeCompare(b.s.created_at));
}
function seed():Registry{
 const history=JSON.parse(fs.readFileSync('release/history.json','utf8'));let previousId:string|null=null;
 const records=history.releases.map((r:any)=>{
  const entry={id:`deployment-${r.evidence.deploymentId}`,version:r.version,commit:r.commit,buildId:null,artifactDigest:null,runId:r.evidence.runUrl.match(/runs\/(\d+)/)?.[1]??'',deploymentId:String(r.evidence.deploymentId),releasedAt:r.releasedAt,changes:r.changes.map((c:any,i:number)=>({id:c.pr?`PR-${c.pr}`:`historical-${i}`,pr:c.pr??null,summary:c.summary,labels:[`release:${c.classification}`]})),previousId,historical:true};previousId=entry.id;return entry;
 });
 // Reconcile newly successful publications at initialization; never count a merge alone.
 for(const {d,s} of successfulDeployments()){
  const last=records.at(-1)!;
  if(s.created_at<=last.releasedAt||records.some((r:any)=>r.commit===d.sha))continue;
  const changes=changesBetween(last.commit,d.sha,true),impact=classifyChanges(changes);
  records.push({id:`deployment-${d.id}`,version:incrementVersion(last.version,impact),commit:d.sha,buildId:null,artifactDigest:null,runId:s.log_url?.match(/runs\/(\d+)/)?.[1]??'',deploymentId:String(d.id),releasedAt:s.created_at,changes,previousId:last.id,historical:true});
 }
 return validateRegistry({schemaVersion:1,records,pending:null});
}
function verifiedReceipt(p:Pending):Receipt{
 const matches=pages<any>(`deployments?environment=github-pages&sha=${p.commit}`).flatMap(d=>pages<any>(`deployments/${d.id}/statuses`).filter(s=>s.state==='success'&&s.log_url?.includes(`/runs/${p.runId}/`)).map(s=>({d,s})));
 if(matches.length>1)throw Error('Ambiguous successful deployment; manual investigation required');
 if(matches.length===1){const {d,s}=matches[0];return {state:'success',commit:d.sha,runId:p.runId,deploymentId:String(d.id),releasedAt:s.created_at,environment:d.environment};}
 const run=api(`actions/runs/${p.runId}`);
 if(run.status!=='completed'||!['failure','cancelled','timed_out'].includes(run.conclusion))throw Error('Deployment result not yet verified; pending reservation retained');
 return {state:run.conclusion==='cancelled'?'cancelled':'failure',commit:p.commit,runId:p.runId,deploymentId:'',releasedAt:'',environment:'github-pages'};
}
function assertNoUnrecordedPublication(r:Registry){
 const last=r.records.at(-1)!;
 for(const {d,s} of successfulDeployments())if(s.created_at>last.releasedAt&&!r.records.some(e=>e.deploymentId===String(d.id)))throw Error(`Unrecorded publication ${d.id}: reconcile before planning`);
}
function writePlan(p:Pending|null,r:Registry){
 fs.writeFileSync(file,JSON.stringify(p,null,2));
 fs.writeFileSync('.release-history.json',JSON.stringify(r.records));
 output('publish',String(!!p));output('major',String(p?.impact==='major'));
 console.log(JSON.stringify({latest:r.records.at(-1),candidate:p},null,2));
}
async function main(){
 const command=process.argv[2];
 if(command==='classification'){
  const pr=process.env.PR_NUMBER;if(!pr||!/^\d+$/.test(pr))throw Error('PR number required');
  const p=api(`pulls/${pr}`);console.log(classifyChanges([{id:pr,labels:p.labels.map((l:any)=>l.name)}]));return;
 }
 if(command==='dry-run'){
  const r=seed();const last=r.records.at(-1)!;
  const target=git('rev-parse','origin/main');
  const changes=changesBetween(last.commit,target,true);
  // This proposed capability is explicitly classified by the implementation brief;
  // real production planning always reads the merged PR label instead.
  changes.push({id:'activation-proposal',pr:null,summary:'Automatic release registry, build identity and release history',labels:['release:minor']});
  console.log(JSON.stringify({mode:'read-only-proposal',base:last,changes,proposedVersion:incrementVersion(last.version,classifyChanges(changes)),source:target},null,2));return;
 }
 if(command==='initialize'){
  if(process.env.RELEASE_ADMIN_APPROVED!=='true')throw Error('Protected release-admin approval required');
  // Ref creation fails if already present: never overwrite an existing registry.
  const r=seed();const tree=api('git/trees','POST',{tree:[{path:'registry.json',mode:'100644',type:'blob',content:JSON.stringify(r,null,2)+'\n'}]});
  const c=api('git/commits','POST',{message:'Initialize approved FitCircle release history',tree:tree.sha,parents:[]});
  api('git/refs','POST',{ref:'refs/heads/release-ledger',sha:c.sha});return;
 }
 if(command==='plan'){
  const {registry:r}=readRegistry();validateRegistry(r);
  if(r.pending)throw Error('Pending release must be reconciled by release-admin');
  assertNoUnrecordedPublication(r);
  const target=process.env.GITHUB_SHA!;const last=r.records.at(-1)!;
  if(ancestor(target,last.commit)){writePlan(null,r);return;}
  const changes=changesBetween(last.commit,target,true);
  const p=plan(r,target,changes,process.env.GITHUB_RUN_ID!,process.env.GITHUB_RUN_ATTEMPT!,true);
  // Major candidate is unprivileged; protected major approval gates reserve/deploy.
  writePlan(p,r);return;
 }
 if(command==='digest'){
  const p:Pending|null=JSON.parse(fs.readFileSync(file,'utf8'));if(!p)return;
  p.artifactDigest=payloadDigest('dist');fs.writeFileSync(file,JSON.stringify(p,null,2));return;
 }
 const {sha,registry:r}=readRegistry();
 if(command==='reserve'){
  const p:Pending=JSON.parse(fs.readFileSync(file,'utf8'));
  if(p.runId!==process.env.GITHUB_RUN_ID||p.commit!==process.env.GITHUB_SHA)throw Error('Candidate does not belong to this run');
  if(p.impact==='major'&&process.env.MAJOR_APPROVED!=='true')throw Error('Major approval missing');
  if(payloadDigest('dist')!==p.artifactDigest)throw Error('Tested artifact changed');
  writeRegistry(sha,reserve(r,p));return;
 }
 if(command==='record'||command==='reconcile'){
  if(command==='reconcile'&&process.env.RELEASE_ADMIN_APPROVED!=='true')throw Error('Protected release-admin approval required');
  if(!r.pending){console.log('No pending publication');return;}
  if(command==='record'&&r.pending.runId!==process.env.GITHUB_RUN_ID)throw Error('Different run pending');
  const receipt=verifiedReceipt(r.pending);const next=reconcile(r,receipt);
  writeRegistry(sha,next,receipt.state==='success'?next.records.at(-1):undefined);return;
 }
 throw Error('Unknown release command');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))main().catch(e=>{console.error(e);process.exitCode=1;});
