import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {classifyChanges,compareVersions,incrementVersion} from '../../client/src/lib/release-metadata';
const repo='fullstackraven/FitCircle';
const gh=(...args:string[])=>execFileSync('gh',args,{encoding:'utf8'}).trim();
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
const api=(route:string)=>JSON.parse(gh('api',`repos/${repo}/${route}`));
function all(route:string){const out:any[]=[];for(let page=1;;page++){const rows=api(`${route}${route.includes('?')?'&':'?'}per_page=100&page=${page}`);out.push(...rows);if(rows.length<100)return out;}}
export function nextVersion(version:string,changes:{id:string;labels:string[]}[]){return incrementVersion(version,classifyChanges(changes),true);}
export function releaseEntry(r:any){return {version:r.tag_name.slice(1),commit:r.target_commitish,releasedAt:r.published_at,summary:r.body||'FitCircle update',prs:[...String(r.body).matchAll(/\/pull\/(\d+)/g)].map(m=>Number(m[1]))};}
async function main(){
 const command=process.argv[2];
 if(command==='plan'){
  const history=JSON.parse(fs.readFileSync('release/baseline.json','utf8'));
  const releases=all('releases').filter(r=>!r.draft&&!r.prerelease&&/^v\d+\.\d+\.\d+$/.test(r.tag_name)).map(releaseEntry).sort((a,b)=>compareVersions(a.version,b.version));
  for(const r of releases)if(!history.some((e:any)=>e.version===r.version))history.push(r);
  const last=history.at(-1),commit=git('rev-parse','HEAD');
  // If Pages succeeded but release creation failed, retry that run's failed
  // recording job before planning another version. Never reuse its number.
  for(const d of all('deployments?environment=github-pages')){
   if(d.created_at<=last.releasedAt)break;
   if(history.some((h:any)=>h.commit===d.sha))continue;
   if(all(`deployments/${d.id}/statuses`).some(s=>s.state==='success'))throw Error(`Deployment ${d.id} has no release: rerun its failed record_release job before another deployment`);
  }
  git('merge-base','--is-ancestor',last.commit,commit);
  const commits=git('rev-list','--first-parent','--reverse',`${last.commit}..${commit}`).split('\n').filter(Boolean);
  const changes=commits.map(sha=>{
   const prs=api(`commits/${sha}/pulls`).filter((r:any)=>r.merged_at&&r.base.ref==='main'&&r.merge_commit_sha===sha);
   if(prs.length!==1)throw Error(`Use a classified PR instead of direct commit ${sha}`);
   const r=prs[0];return {id:String(r.number),labels:r.labels.map((l:any)=>l.name),summary:`${r.title} (https://github.com/${repo}/pull/${r.number})`};
  });
  const version=changes.length?nextVersion(last.version,changes):last.version;
  const publish=version!==last.version;
  fs.writeFileSync('.release-candidate.json',JSON.stringify({version,commit,buildId:commit,history,summary:changes.map(c=>c.summary).join('\n'),publish}));
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`publish=${publish}\n`);
  console.log(JSON.stringify({version,commit,publish,changes},null,2));return;
 }
 if(command==='publish'){
  const c=JSON.parse(fs.readFileSync('.release-candidate.json','utf8'));
  if(!c.publish||c.commit!==process.env.GITHUB_SHA)throw Error('Wrong publication candidate');
  const existing=all('releases').find(r=>r.tag_name===`v${c.version}`);
  if(existing){if(existing.target_commitish!==c.commit)throw Error('Version already belongs to another build');return;}
  fs.writeFileSync('.release-notes.txt',c.summary);
  gh('release','create',`v${c.version}`,'--repo',repo,'--target',c.commit,'--title',`FitCircle ${c.version}`,'--notes-file','.release-notes.txt');return;
 }
 throw Error('Expected plan or publish');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))main().catch(e=>{console.error(e);process.exitCode=1;});
