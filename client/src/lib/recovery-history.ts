import {getDateString} from './date-utils';
export type RecoveryRange=7|30|'all';
export function isRecoveryDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&getDateString(new Date(value+'T00:00:00'))===value;}
/** View-only filtering: never sort the hook's array in place or rewrite dates. */
export function recoveryHistory(days:readonly string[],range:RecoveryRange,today=new Date()){
 const cutoff=new Date(today);cutoff.setHours(0,0,0,0);if(range!=='all')cutoff.setDate(cutoff.getDate()-range+1);
 const first=getDateString(cutoff),last=getDateString(today);
 return days.filter(date=>range==='all'||(isRecoveryDate(date)&&date>=first&&date<=last)).sort((a,b)=>b.localeCompare(a));
}
export function recoveryFill(percentage:number){return Number.isFinite(percentage)?Math.min(100,Math.max(0,percentage)):0;}
