// Synthetic in-memory probe only. Run: npx tsx docs/revamp/evidence/reproduce-initialization.ts
// Captured JSON describes the audited main; FC-006 differs after the copied-array fix.
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useWorkouts } from '../../../client/src/hooks/use-workouts';
import { useDashboardWidgets } from '../../../client/src/hooks/use-dashboard-widgets';
import { getDaysBetweenInclusive } from '../../../client/src/lib/date-utils';
const records = new Map<string,string>();
const storage = { getItem: (key:string) => records.get(key) ?? null, setItem: (key:string,value:string) => records.set(key,value) };
Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true});
const data={workouts:{a:{id:'a',name:'A',color:'green',count:0,dailyGoal:20}},dailyLogs:{'2026-10-01':{a:5},'2026-10-02':{a:{count:8,goalAtTime:20}}},routines:{},journalEntries:{'2026-10-01':{text:'Synthetic',timestamp:'2026-10-01T18:00:00.123Z'}}};
storage.setItem('workout-tracker-data',JSON.stringify(data));
const result:any={};
function Workouts(){useWorkouts();return null;}
renderToString(createElement(Workouts));result.migrationBefore=data;result.migrationAfter=JSON.parse(storage.getItem('workout-tracker-data')!);
let writes=0;const oldSet=storage.setItem;storage.setItem=(k,v)=>{writes++;return oldSet(k,v)};renderToString(createElement(Workouts));result.secondMountWrites=writes;
storage.setItem('fitcircle_dashboard_widgets',JSON.stringify([{id:'later',position:2},{id:'first',position:0}]));
function Widgets(){const api=useDashboardWidgets();result.widgetBefore=api.widgets.map(w=>w.id);result.widgetSorted=api.getAvailableWidgets().map(w=>w.id);result.widgetAfter=api.widgets.map(w=>w.id);return null;}
renderToString(createElement(Widgets));
process.env.TZ='America/New_York';result.fallDST={expected:2,actual:getDaysBetweenInclusive('2026-11-01','2026-11-02')};result.springDST={expected:2,actual:getDaysBetweenInclusive('2026-03-08','2026-03-09')};
console.log(JSON.stringify(result,null,2));
