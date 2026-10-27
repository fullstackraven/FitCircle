import {stableVersion,validateCommit} from './release-metadata';
export interface HistoryEntry {version:string;commit:string;releasedAt:string;summary:string;prs:number[]}
export interface ApplicationBuild {version:string;commit:string;buildId:string|null;stage:'development'|'candidate'|'published';releasedAt:string|null;history:HistoryEntry[]}
export function appVersionLabel(build:ApplicationBuild){return build.stage==='development'?'Development':`${build.version}${build.stage==='candidate'?' (candidate)':''}`;}
export function applyReleaseReceipt(build:ApplicationBuild,unknown:unknown):ApplicationBuild{
 if(build.stage==='development'||!build.buildId||!unknown||typeof unknown!=='object')return build;
 const r=unknown as any;
 try{stableVersion(r.version);validateCommit(r.commit);}catch{return build;}
 if(r.version!==build.version||r.commit!==build.commit||r.buildId!==build.buildId||typeof r.artifactDigest!=='string'||!/^[a-f0-9]{64}$/.test(r.artifactDigest)||!/^\d+$/.test(r.deploymentId)||typeof r.releasedAt!=='string'||!Number.isFinite(Date.parse(r.releasedAt))||!Array.isArray(r.changes))return build;
 if(r.changes.some((c:any)=>!c||typeof c.summary!=='string'||(c.pr!==null&&(!Number.isSafeInteger(c.pr)||c.pr<1))))return build;
 const current={version:r.version,commit:r.commit,releasedAt:r.releasedAt,summary:r.changes.map((c:any)=>c.summary).join('; '),prs:r.changes.flatMap((c:any)=>c.pr?[c.pr]:[])};
 return {...build,stage:'published',releasedAt:r.releasedAt,history:build.history.some(e=>e.commit===r.commit)?build.history:[...build.history,current]};
}
/** One immutable receipt for the loaded build, never an online 'latest version'. */
export async function loadReleaseReceipt(build:ApplicationBuild):Promise<ApplicationBuild>{
 if(!build.buildId||build.stage==='development')return build;
 const url=`https://raw.githubusercontent.com/fullstackraven/FitCircle/release-ledger/receipts/${encodeURIComponent(build.buildId)}.json`;
 let cache:Cache|undefined;let cached=build;
 try{cache=await caches.open('fitcircle-release-receipts-v1');const response=await cache.match(url);if(response)cached=applyReleaseReceipt(build,await response.json());}catch{/* Private/offline storage may be unavailable. */}
 if(cached.stage==='published')return cached;
 try{
  const response=await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(5000)});
  if(!response.ok)return cached;
  const resolved=applyReleaseReceipt(build,await response.clone().json());
  if(resolved.stage==='published')try{await cache?.put(url,response);}catch{/* Version remains correct without persistence. */}
  return resolved;
 }catch{return cached;}
}
