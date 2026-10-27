import {api,pages} from './github';
import type {Pending,Receipt} from './model';
const repositoryPath='/fullstackraven/FitCircle/actions/runs/';
/** Exact GitHub/repository/run identity; a substring is not sufficient evidence. */
export function statusRun(url:unknown):{runId:string;jobId?:string}|null{
 if(typeof url!=='string'||!url)return null;
 try{
  const parsed=new URL(url);
  if(parsed.origin!=='https://github.com'||parsed.username||parsed.password||!parsed.pathname.startsWith(repositoryPath))return null;
  const match=parsed.pathname.slice(repositoryPath.length).match(/^(\d+)(?:\/(?:job|jobs)\/(\d+))?\/?$/);
  return match?{runId:match[1],...(match[2]?{jobId:match[2]}:{})}:null;
 }catch{return null;}
}
interface ReadClient {api:(path:string)=>any;pages:(path:string)=>any[]}
export function verifiedReceipt(p:Pending,client:ReadClient={api,pages}):Receipt{
 const attempt=p.buildId.match(new RegExp(`^${p.commit}-${p.runId}-(\\d+)$`))?.[1];
 if(!attempt||!/^\d+$/.test(p.runId))throw Error('Reserved workflow attempt is invalid');
 const run=client.api(`actions/runs/${p.runId}/attempts/${attempt}`);
 if(String(run.id)!==p.runId||String(run.run_attempt)!==attempt||run.head_sha!==p.commit||run.event!=='push'||run.head_branch!=='main'||run.path!=='.github/workflows/pages.yml')throw Error('Workflow attempt does not match reserved main publication');
 const jobs:any[]=[];
 for(let page=1;;page++){
  const result=client.api(`actions/runs/${p.runId}/attempts/${attempt}/jobs?per_page=100&page=${page}`);
  jobs.push(...result.jobs);if(result.jobs.length<100)break;
 }
 const deployJobs=jobs.filter(j=>j.name==='deploy'&&String(j.run_id)===p.runId&&String(j.run_attempt)===attempt);
 const deployed=(j:any)=>j.conclusion==='success'||j.steps?.some((s:any)=>s.name==='Deploy'&&s.conclusion==='success');
 const matches=new Map<string,{d:any;s:any}>();
 let latestAttempt:string|undefined;
 for(const d of client.pages(`deployments?environment=github-pages&sha=${p.commit}`)){
  if(d.sha!==p.commit||d.environment!=='github-pages')continue;
  for(const s of client.pages(`deployments/${d.id}/statuses`)){
   if(s.state!=='success'||(s.environment&&s.environment!=='github-pages'))continue;
   const link=statusRun(s.log_url||s.target_url);
   if(!link||link.runId!==p.runId)continue;
   const target=s.target_url?statusRun(s.target_url):null;
   if(target&&(target.runId!==link.runId||(target.jobId&&link.jobId&&target.jobId!==link.jobId)))continue;
   if(link.jobId){
    if(!deployJobs.some(j=>String(j.id)===link.jobId&&deployed(j)))continue;
   }else{
    // Run-root links contain no job identity. Only accept the current attempt,
    // with one successful deploy job and timestamps inside that attempt.
    latestAttempt??=String(client.api(`actions/runs/${p.runId}`).run_attempt);
    if(latestAttempt!==attempt||deployJobs.length!==1||!deployed(deployJobs[0])||!(Date.parse(d.created_at)>=Date.parse(run.run_started_at))||!(Date.parse(s.created_at)>=Date.parse(deployJobs[0].started_at)))continue;
   }
   if(!Number.isFinite(Date.parse(s.created_at)))continue;
   const previous=matches.get(String(d.id));
   if(!previous||s.created_at<previous.s.created_at)matches.set(String(d.id),{d,s});
  }
 }
 if(matches.size>1)throw Error('Ambiguous successful deployment; manual investigation required');
 if(matches.size===1){const {d,s}=[...matches.values()][0];return {state:'success',commit:d.sha,runId:p.runId,deploymentId:String(d.id),releasedAt:s.created_at,environment:d.environment};}
 if(deployJobs.some(deployed))throw Error('Deploy succeeded but its matching success receipt is not yet available; keep reservation');
 if(run.status!=='completed'||!['failure','cancelled','timed_out'].includes(run.conclusion))throw Error('Deployment result not yet verified; pending reservation retained');
 return {state:run.conclusion==='cancelled'?'cancelled':'failure',commit:p.commit,runId:p.runId,deploymentId:'',releasedAt:'',environment:'github-pages'};
}
