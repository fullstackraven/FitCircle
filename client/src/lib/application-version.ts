import {stableVersion,validateCommit} from './release-metadata';
export interface HistoryEntry {version:string;commit:string;releasedAt:string;summary:string;prs:number[]}
export interface ApplicationBuild {version:string;commit:string;buildId:string|null;stage:'development'|'candidate'|'published';releasedAt:string|null;history:HistoryEntry[]}
export function appVersionLabel(build:ApplicationBuild){return build.stage==='development'?'Development':`${build.version}${build.stage==='candidate'?' (candidate)':''}`;}
export function applyReleaseReceipt(build:ApplicationBuild,unknown:unknown):ApplicationBuild{
 if(build.stage==='development'||!build.buildId||!unknown||typeof unknown!=='object')return build;
 const r=unknown as any;
 try{stableVersion(build.version);validateCommit(r.target_commitish);}catch{return build;}
 if(r.draft||r.prerelease||r.tag_name!==`v${build.version}`||r.target_commitish!==build.commit||!r.published_at||!Number.isFinite(Date.parse(r.published_at)))return build;
 const current={version:build.version,commit:build.commit,releasedAt:r.published_at,summary:r.body||'FitCircle update',prs:[...String(r.body).matchAll(/\/pull\/(\d+)/g)].map(m=>Number(m[1]))};
 return {...build,stage:'published',releasedAt:r.published_at,history:build.history.some(e=>e.commit===r.target_commitish||e.version===current.version)?build.history:[...build.history,current]};
}
/** One immutable receipt for the loaded build, never an online 'latest version'. */
export async function loadReleaseReceipt(build:ApplicationBuild):Promise<ApplicationBuild>{
 if(!build.buildId||build.stage==='development')return build;
 const url=`https://api.github.com/repos/fullstackraven/FitCircle/releases/tags/v${build.version}`;
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
