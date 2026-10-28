import {getDateString} from './date-utils';
export type EnergyRange = 7 | 30 | 'all';
/** Presentation only: calendar slots preserve gaps; only saved scores enter statistics. */
export function energyTrend(data:Record<string,number>,range:EnergyRange,today=new Date()){
 const todayKey=getDateString(today);
 const valid=Object.entries(data).filter(([date,value])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(value)&&value>=1&&value<=10&&getDateString(new Date(date+'T00:00:00'))===date);
 const saved=new Map(valid);const dates:string[]=[];
 if(range==='all')dates.push(...valid.map(([date])=>date).sort());
 else {const cursor=new Date(today);cursor.setHours(0,0,0,0);cursor.setDate(cursor.getDate()-range+1);for(let i=0;i<range;i++){dates.push(getDateString(cursor));cursor.setDate(cursor.getDate()+1);}}
 const records=dates.flatMap((date,index)=>saved.has(date)?[{date,index,energy:saved.get(date)!}]:[]);
 return {dates,records,average:records.length?(records.reduce((sum,r)=>sum+r.energy,0)/records.length).toFixed(1):null,daysLogged:records.length,todayEnergy:saved.get(todayKey)??null};
}
