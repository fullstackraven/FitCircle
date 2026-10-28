import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {classifyChanges,compareVersions,incrementVersion,validateCommit} from '../../client/src/lib/release-metadata';
const repo='fullstackraven/FitCircle';
const gh=(...args:string[])=>execFileSync('gh',args,{encoding:'utf8'}).trim();
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
const api=(route:string)=>JSON.parse(gh('api',`repos/${repo}/${route}`));
export function all(route:string,request:typeof api=api){const out:any[]=[];for(let page=1;;page++){const rows=request(`${route}${route.includes('?')?'&':'?'}per_page=100&page=${page}`);out.push(...rows);if(rows.length<100)return out;}}
export function nextVersion(version:string,changes:{id:string;labels:string[]}[]){return incrementVersion(version,classifyChanges(changes),true);}
export function releaseEntry(r:any){validateCommit(r.target_commitish);return {version:r.tag_name.slice(1),commit:r.target_commitish,releasedAt:r.published_at,summary:r.body||'FitCircle update',prs:[...String(r.body).matchAll(/\/pull\/(\d+)/g)].map(m=>Number(m[1]))};}
export async function run(command:string,request:typeof api=api,gitCommand:typeof git=git,githubCommand:typeof gh=gh,directory='.',source=process.env.GITHUB_SHA){
 const read=(name:string)=>JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));
 const write=(name:string,value:string)=>fs.writeFileSync(path.join(directory,name),value);
 const list=(route:string)=>all(route,request);
 if(command==='plan'){
  const history=[...read('release/history.json').releases,read('release/baseline.json')];
  const releases=list('releases').filter(r=>!r.draft&&!r.prerelease&&/^v\d+\.\d+\.\d+$/.test(r.tag_name)).map(releaseEntry).sort((a,b)=>compareVersions(a.version,b.version));
  for(const r of releases){
   const existing=history.find((e:any)=>e.version===r.version||e.commit===r.commit);
   if(existing){if(existing.version!==r.version||existing.commit!==r.commit)throw Error('Conflicting version-to-commit assignment');}
   else history.push(r);
  }
  history.sort((a:any,b:any)=>compareVersions(a.version,b.version));
  const last=history.at(-1),commit=gitCommand('rev-parse','HEAD');
  // If Pages succeeded but release creation failed, retry that run's failed
  // recording job before planning another version. Never reuse its number.
  for(const d of list('deployments?environment=github-pages')){
   if(d.environment!=='github-pages'||history.some((h:any)=>h.commit===d.sha))continue;
   const successful=list(`deployments/${d.id}/statuses`).some(s=>s.state==='success'&&(!s.environment||s.environment==='github-pages')&&s.created_at>last.releasedAt);
   if(successful)throw Error(`Deployment ${d.id} has no release: rerun its failed record_release job before another deployment`);
  }
  gitCommand('merge-base','--is-ancestor',last.commit,commit);
  const commits=gitCommand('rev-list','--first-parent','--reverse',`${last.commit}..${commit}`).split('\n').filter(Boolean);
  const changes=commits.map(sha=>{
   const prs=request(`commits/${sha}/pulls`).filter((r:any)=>r.merged_at&&r.base.ref==='main'&&r.merge_commit_sha===sha);
   if(prs.length!==1)throw Error(`Use a classified PR instead of direct commit ${sha}`);
   const r=prs[0];return {id:String(r.number),labels:r.labels.map((l:any)=>l.name),summary:`${r.title} (https://github.com/${repo}/pull/${r.number})`};
  });
  const version=changes.length?nextVersion(last.version,changes):last.version;
  const publish=version!==last.version;
  write('.release-candidate.json',JSON.stringify({version,commit,buildId:commit,history,summary:changes.map(c=>c.summary).join('\n'),publish}));
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`publish=${publish}\n`);
  return {version,commit,publish,changes};
 }
 if(command==='publish'){
  const c=read('.release-candidate.json');
  if(!c.publish||c.commit!==source)throw Error('Wrong publication candidate');
  const existing=list('releases').find(r=>r.tag_name===`v${c.version}`);
  if(existing&&(existing.draft||existing.prerelease||existing.target_commitish!==c.commit))throw Error('Version already belongs to another build');
  const tag=request(`git/matching-refs/tags/v${c.version}`).find((r:any)=>r.ref===`refs/tags/v${c.version}`);
  if(tag){
   let object=tag.object;
   while(object.type==='tag')object=request(`git/tags/${object.sha}`).object;
   if(object.type!=='commit'||object.sha!==c.commit)throw Error('Version tag already belongs to another build');
  }
  if(existing)return;
  write('.release-notes.txt',c.summary);
  githubCommand('release','create',`v${c.version}`,'--repo',repo,'--target',c.commit,'--title',`FitCircle ${c.version}`,'--notes-file',path.join(directory,'.release-notes.txt'));return;
 }
 throw Error('Expected plan or publish');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))run(process.argv[2]).then(result=>{if(result)console.log(JSON.stringify(result,null,2));}).catch(e=>{console.error(e);process.exitCode=1;});
