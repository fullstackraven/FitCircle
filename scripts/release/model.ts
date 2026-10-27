import {classifyChanges,incrementVersion,stableVersion,validateCommit,type ReleaseImpact} from '../../client/src/lib/release-metadata';
export interface Change {id:string;pr:number|null;summary:string;labels:string[]}
export interface RecordEntry {id:string;version:string;commit:string;buildId:string|null;artifactDigest:string|null;runId:string;deploymentId:string;releasedAt:string;changes:Change[];previousId:string|null;historical:boolean}
export interface Pending {buildId:string;commit:string;version:string;impact:ReleaseImpact;previousId:string;changes:Change[];runId:string;artifactDigest:string|null}
export interface Registry {schemaVersion:1;records:RecordEntry[];pending:Pending|null}
export function validateRegistry(r:Registry):Registry {
 if(r.schemaVersion!==1||!Array.isArray(r.records)||!r.records.length)throw Error('Invalid registry');
 const ids=new Set<string>();const builds=new Set<string>();
 for(let i=0;i<r.records.length;i++){
  const e=r.records[i];stableVersion(e.version);validateCommit(e.commit);
  if(!e.id||ids.has(e.id)||e.previousId!==(r.records[i-1]?.id??null)||!Number.isFinite(Date.parse(e.releasedAt)))throw Error('Invalid registry chain');
  if(e.buildId&&(builds.has(e.buildId)||!e.artifactDigest||!/^[a-f0-9]{64}$/.test(e.artifactDigest)))throw Error('Invalid build identity');
  ids.add(e.id);if(e.buildId)builds.add(e.buildId);
 }
 return r;
}
export function plan(registry:Registry,commit:string,changes:Change[],runId:string,attempt:string,majorApproved=false):Pending|null {
 validateRegistry(registry);validateCommit(commit);
 if(registry.pending)throw Error('Unresolved deployment intent: reconcile before advancing');
 const last=registry.records.at(-1)!;
 if(last.commit===commit)return null;
 const impact=classifyChanges(changes);
 if(impact==='none')return null; // no new distributed application; do not publish another build under same version
 return {buildId:`${commit}-${runId}-${attempt}`,commit,version:incrementVersion(last.version,impact,majorApproved),impact,previousId:last.id,changes,runId,artifactDigest:null};
}
export function reserve(registry:Registry,pending:Pending):Registry {
 validateRegistry(registry);
 if(registry.pending){if(JSON.stringify(registry.pending)===JSON.stringify(pending))return registry;throw Error('Conflicting pending release');}
 const last=registry.records.at(-1)!;
 if(last.id!==pending.previousId)throw Error('Stale publication base');
 validateCommit(pending.commit);
 if(pending.impact==='none'||classifyChanges(pending.changes)!==pending.impact||pending.version!==incrementVersion(last.version,pending.impact,true))throw Error('Invalid reserved release classification/version');
 if(!pending.buildId.startsWith(`${pending.commit}-${pending.runId}-`))throw Error('Invalid reserved build identity');
 if(!pending.artifactDigest||!/^[a-f0-9]{64}$/.test(pending.artifactDigest))throw Error('Tested payload digest required');
 return {...registry,pending};
}
export interface Receipt {state:'success'|'failure'|'cancelled';commit:string;runId:string;deploymentId:string;releasedAt:string;environment:string}
export function reconcile(registry:Registry,receipt:Receipt):Registry {
 if(!registry.pending){
  if(registry.records.some(r=>r.deploymentId===receipt.deploymentId&&r.commit===receipt.commit))return registry;
  throw Error('No reserved release');
 }
 const p=registry.pending;
 if(receipt.commit!==p.commit||receipt.runId!==p.runId||receipt.environment!=='github-pages')throw Error('Receipt does not match reserved deployment');
 if(receipt.state!=='success')return {...registry,pending:null};
 if(!receipt.deploymentId||!Number.isFinite(Date.parse(receipt.releasedAt))||Date.parse(receipt.releasedAt)<Date.parse(registry.records.at(-1)!.releasedAt))throw Error('Verified timestamp/identity required');
 if(registry.records.at(-1)!.id!==p.previousId)throw Error('Registry changed during deployment');
 const record:RecordEntry={id:`deployment-${receipt.deploymentId}`,version:p.version,commit:p.commit,buildId:p.buildId,artifactDigest:p.artifactDigest,runId:p.runId,deploymentId:receipt.deploymentId,releasedAt:receipt.releasedAt,changes:p.changes,previousId:p.previousId,historical:false};
 return validateRegistry({...registry,pending:null,records:[...registry.records,record]});
}
export function assertAppendOnly(before:Registry,after:Registry){
 validateRegistry(before);validateRegistry(after);
 if(after.records.length<before.records.length||before.records.some((r,i)=>JSON.stringify(r)!==JSON.stringify(after.records[i])))throw Error('Release history is append-only');
}
