import {execFileSync} from 'node:child_process';
const repo='fullstackraven/FitCircle';
export function api<T=any>(path:string,method='GET',body?:unknown):T {
 const args=['api',path.startsWith('/')?path.slice(1):`repos/${repo}/${path}`,'--method',method];
 if(body!==undefined)args.push('--input','-');
 return JSON.parse(execFileSync('gh',args,{input:body===undefined?undefined:JSON.stringify(body),encoding:'utf8'}));
}
export function pages<T=any>(path:string):T[]{
 const all:T[]=[];for(let page=1;;page++){const rows=api<T[]>(`${path}${path.includes('?')?'&':'?'}per_page=100&page=${page}`);all.push(...rows);if(rows.length<100)return all;}
 return all;
}
export const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
export function ancestor(a:string,b:string){try{git('merge-base','--is-ancestor',a,b);return true;}catch{return false;}}
export function readRegistry():{sha:string;registry:import('./model').Registry}{
 const ref=api('git/ref/heads/release-ledger');
 const file=api(`contents/registry.json?ref=${ref.object.sha}`);
 return {sha:ref.object.sha,registry:JSON.parse(Buffer.from(file.content,'base64').toString())};
}
/** Parent pinned to the observed ref; non-fast-forward update rejects a competing writer. */
export function writeRegistry(previousSha:string,registry:import('./model').Registry,receipt?:import('./model').RecordEntry){
 const parent=api(`git/commits/${previousSha}`);
 const entries=[{path:'registry.json',mode:'100644',type:'blob',content:JSON.stringify(registry,null,2)+'\n'}];
 if(receipt?.buildId)entries.push({path:`receipts/${receipt.buildId}.json`,mode:'100644',type:'blob',content:JSON.stringify(receipt)+'\n'});
 const tree=api('git/trees','POST',{base_tree:parent.tree.sha,tree:entries});
 const commit=api('git/commits','POST',{message:receipt?`Record ${receipt.version} / ${receipt.buildId}`:'Reserve or reconcile production release',tree:tree.sha,parents:[previousSha]});
 api('git/refs/heads/release-ledger','PATCH',{sha:commit.sha,force:false});
}
