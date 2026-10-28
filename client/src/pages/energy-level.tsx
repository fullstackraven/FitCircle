import '@/styles/energy-level.css';
import React, {useEffect,useState} from 'react';
import {ArrowLeft,Zap,Undo2,Calendar,ChartNoAxesColumnIncreasing,Check} from 'lucide-react';
import {useLocation} from 'wouter';
import {useEnergyLevel} from '../hooks/use-energy-level';
import {energyTrend,type EnergyRange} from '@/lib/energy-trends';
import {format} from 'date-fns';

const energyDescription=(level:number)=>level===0?'Not set':level<=2?'Very Low':level<=4?'Low':level<=6?'Moderate':level<=8?'High':'Very High';
const energyColor=(level:number)=>level===0?'text-muted-foreground':level<=3?'text-feature-red':level<=6?'text-feature-yellow':'text-accent-text';

export function EnergyLevelPage(){
 const [,navigate]=useLocation();
 const {getEnergyLevel,setEnergyLevelForDate,getEnergyLevelData}=useEnergyLevel();
 const [energyLevel,setEnergyLevel]=useState(0),[savedLevel,setSavedLevel]=useState(0);
 const [range,setRange]=useState<EnergyRange>(30),[feedback,setFeedback]=useState('');
 const fromWellness=new URLSearchParams(window.location.search).get('from')==='wellness';
 useEffect(()=>{const value=getEnergyLevel(new Date());setEnergyLevel(value);setSavedLevel(value);},[]);
 const selectLevel=(value:number)=>{setEnergyLevel(value);setFeedback('');};
 const undo=()=>selectLevel(energyLevel<=1?0:energyLevel-1);
 const save=()=>{
  if(energyLevel<1||energyLevel>10)return;
  const today=new Date();setEnergyLevelForDate(today,energyLevel);
  // The existing storage service catches write errors; verify before claiming success.
  if(getEnergyLevel(today)===energyLevel){setSavedLevel(energyLevel);setFeedback('Energy level saved successfully!');}
  else setFeedback('Energy level could not be saved. Please try again.');
 };
 const trend=energyTrend(getEnergyLevelData(),range);
 const saved=savedLevel>0&&energyLevel===savedLevel;
 const state=saved?'Saved':energyLevel===savedLevel?'Not saved':'Unsaved changes';
 const radius=61,circumference=2*Math.PI*radius;
 const x=(index:number)=>trend.dates.length<2?145:20+index*250/(trend.dates.length-1);
 const y=(value:number)=>128-(value-1)*108/9;
 const points=trend.records.map(r=>`${x(r.index)},${y(r.energy)}`).join(' ');
 return <div className="fitcircle-page energy-level-page"><div className="fitcircle-container">
  <div className="flex items-center justify-between mb-5"><button onClick={()=>navigate(fromWellness?'/wellness':'/calendar')} className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground" aria-label="Back" title="Back"><ArrowLeft size={20}/></button><h1 className="fitcircle-page-title">Energy Level</h1><span className="w-11"/></div>
  <section className="energy-card" aria-labelledby="today-energy-heading">
   <div className="flex items-center gap-3"><span className="energy-icon"><Zap size={24}/></span><div className="min-w-0 flex-1"><h2 id="today-energy-heading" className="font-bold text-base text-strong">Today's Energy</h2><p className="text-xs text-muted-foreground mt-1">{format(new Date(),'EEEE, MMMM d')}</p></div><div className="text-right text-xs"><span data-testid="energy-save-state" className={saved?'text-accent-text':'text-muted-foreground'}>{state}</span><p className="text-[10px] text-muted-foreground mt-1">1–10 SCALE</p></div></div>
   <div className={`energy-gauge ${energyColor(energyLevel)}`} role="img" aria-label={`${energyLevel || 'No selection'} of 10, ${energyDescription(energyLevel)}`}>
    <svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r={radius} stroke="var(--energy-track)" strokeWidth="8" fill="none"/><circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference*(1-energyLevel/10)} strokeLinecap="round" transform="rotate(-90 70 70)"/></svg>
    <div><strong data-testid="selected-energy">{energyLevel || '—'}</strong><span>{energyDescription(energyLevel)}</span></div>
   </div>
   <label htmlFor="energy-selection" className="block text-center text-xs text-muted-foreground mb-2">How energized do you feel today?</label>
   <div className="flex justify-between text-xs text-muted-foreground"><span>Very low</span><span>Very high</span></div>
   <input id="energy-selection" type="range" min="1" max="10" step="1" value={energyLevel || 1} aria-label="Energy level" aria-valuetext={energyLevel?`${energyLevel} of 10, ${energyDescription(energyLevel)}`:'Not set. Choose an energy level from 1 to 10.'} onChange={e=>selectLevel(Number(e.target.value))} onPointerDown={()=>{if(energyLevel===0)selectLevel(1);}} onKeyDown={e=>{if(energyLevel===0&&['Home','ArrowLeft','ArrowDown'].includes(e.key))selectLevel(1);}} style={{'--energy-selection':`${(Math.max(energyLevel,1)-1)/9*100}%`} as React.CSSProperties} className="energy-slider"/>
   <div className="flex justify-between text-[10px] text-muted-foreground px-1 mb-4" aria-hidden="true"><span>1</span><span>5</span><span>10</span></div>
   <div className="energy-actions"><button onClick={undo} disabled={energyLevel===0} title="Decrease the draft level by one; saved data is unchanged" className="energy-undo"><Undo2 size={17}/>Undo</button><button onClick={save} disabled={energyLevel===0} className="energy-save"><Check size={18}/>Save Energy</button></div>
   {feedback&&<p role="status" aria-live="polite" className={`text-xs mt-3 ${feedback.includes('could not')?'text-feature-red':'text-accent-text'}`}>{feedback}</p>}
  </section>
  <section className="energy-card mt-4" aria-labelledby="energy-trends-heading">
   <div className="flex items-center gap-3 mb-4"><span className="energy-icon"><ChartNoAxesColumnIncreasing size={22}/></span><div><h2 id="energy-trends-heading" className="font-bold text-base text-strong">Energy Trends</h2><p className="text-xs text-muted-foreground mt-1">Your saved energy over time</p></div></div>
   <div className="energy-period" role="group" aria-label="Energy date range">{([7,30,'all'] as EnergyRange[]).map(value=><button key={value} aria-pressed={range===value} onClick={()=>setRange(value)}>{value==='all'?'All time':`${value} days`}</button>)}</div>
   <div className="energy-metrics"><div><strong className="text-feature-purple" data-testid="energy-average">{trend.average??'—'}</strong><span>Avg Energy</span></div><div><strong className="text-feature-blue" data-testid="energy-days">{trend.daysLogged}</strong><span>Days Logged</span></div><div><strong className="text-accent-text" data-testid="energy-today">{trend.todayEnergy??'—'}</strong><span>Today</span></div></div>
   {!trend.records.length?<p className="energy-empty">No energy entries yet. Save today's energy level to begin tracking your trends.</p>:<>
    <svg className="energy-chart" viewBox="0 0 310 155" role="img" aria-label={`Energy trend, ${trend.daysLogged} saved entries, average ${trend.average} out of 10`}>
     {[1,3,5,7,10].map(value=><g key={value}><line x1="20" x2="270" y1={y(value)} y2={y(value)} stroke="var(--energy-track)"/><text x="283" y={y(value)+3} fill="currentColor" fontSize="9">{value}</text></g>)}
     {trend.records.length>1&&<polyline points={points} fill="none" stroke="var(--energy-gradient-blue)" strokeWidth="2.5" strokeLinejoin="round"/>}
     {trend.records.map(record=><circle key={record.date} data-energy={record.energy} data-date={record.date} cx={x(record.index)} cy={y(record.energy)} r="3.5" fill="var(--energy-gradient-blue)"><title>{record.date}: {record.energy} of 10</title></circle>)}
    </svg>
    <div className="flex justify-between text-[10px] text-muted-foreground px-3"><span>{format(new Date(trend.dates[0]+'T00:00:00'),'MMM d')}</span><span>{format(new Date(trend.dates[trend.dates.length-1]+'T00:00:00'),'MMM d')}</span></div>
    <p className="text-center text-[11px] text-muted-foreground mt-3">Saved entries only · Missing days are not scored</p>
   </>}
  </section>
  <p className="flex items-start gap-2 mt-5 text-xs text-muted-foreground leading-relaxed"><Calendar size={17} className="shrink-0 mt-0.5"/>Tip: Tap any day on the calendar to view or edit past energy levels</p>
 </div></div>;
}
