import '@/styles/recovery.css';
import React,{useState} from 'react';
import {useLocation} from 'wouter';
import {ArrowLeft,Heart,Calendar,Info,ChevronDown,ChevronRight,CheckCircle2} from 'lucide-react';
import {useRecovery} from '@/hooks/use-recovery';
import {useWorkouts} from '@/hooks/use-workouts';
import {recoveryHistory,recoveryFill,isRecoveryDate,type RecoveryRange} from '@/lib/recovery-history';
import {format} from 'date-fns';

export default function RecoveryPage(){
 const [,navigate]=useLocation();
 const {getRecoveryStats,data}=useRecovery();
 const {getTotalStats}=useWorkouts();
 const [range,setRange]=useState<RecoveryRange>(30),[visibleCount,setVisibleCount]=useState(5);
 const fromWellness=new URLSearchParams(window.location.search).get('from')==='wellness';
 // Preserve the original statistics source and denominator exactly.
 const totalStats=getTotalStats();
 const stats=getRecoveryStats(totalStats?.totalCompletedDays);
 const percentage=stats.recoveryPercentage.toFixed(1);
 const fill=recoveryFill(stats.recoveryPercentage);
 const history=recoveryHistory(data.recoveryDays,range);
 return <div className="fitcircle-page recovery-page"><div className="fitcircle-container">
  <div className="flex items-center justify-between mb-5"><button onClick={()=>navigate(fromWellness?'/wellness':'/calendar')} className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground" title="Back" aria-label="Back"><ArrowLeft size={20}/></button><h1 className="fitcircle-page-title">Recovery</h1><span className="w-11"/></div>
  <section className="recovery-card" aria-labelledby="recovery-overview-heading">
   <div className="recovery-heading"><span className="recovery-icon"><Heart size={24}/></span><div><h2 id="recovery-overview-heading">Recovery Overview</h2><p>Your rest and consistency</p></div></div>
   <div className="recovery-metrics"><div><strong className="text-feature-orange" data-testid="recovery-days">{stats.totalRecoveryDays}</strong><span>Recovery Days</span></div><div><strong className="text-strong" data-testid="workout-days">{stats.totalWorkoutDays}</strong><span>Workout Days</span></div><div><strong className="text-feature-orange" data-testid="recovery-rate">{percentage}%</strong><span>Recovery Rate</span></div></div>
   <div className="recovery-balance"><div className="flex justify-between items-center gap-2 text-xs font-semibold mb-2"><span>Recovery balance</span><span className="text-feature-orange">{percentage}%</span></div><div className="recovery-track" role="progressbar" aria-label="Recovery balance" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fill} aria-valuetext={`${percentage}% recovery rate${stats.recoveryPercentage>100?'; visual fill capped at 100%':''}`}><div style={{width:`${fill}%`}}/></div><p className="text-xs text-muted-foreground mt-2">Recovery days relative to logged workout days.</p></div>
   <p className="recovery-note mt-4"><Info size={16}/>Recovery days support consistency without requiring a completed workout.</p>
  </section>
  <section className="recovery-card mt-4" aria-labelledby="recovery-history-heading">
   <div className="recovery-heading"><span className="recovery-icon"><Calendar size={23}/></span><div className="min-w-0 flex-1"><h2 id="recovery-history-heading">Recovery History</h2><p>Previously marked recovery days</p></div><strong className="text-feature-orange text-xs shrink-0">{data.recoveryDays.length} total</strong></div>
   <div className="recovery-period" role="group" aria-label="Recovery history period">{([7,30,'all'] as RecoveryRange[]).map(value=><button key={value} aria-pressed={range===value} onClick={()=>{setRange(value);setVisibleCount(5);}}>{value==='all'?'All':`${value} days`}</button>)}</div>
   {history.length?<>
    <ul className="recovery-history-list" aria-label="Recovery dates">{history.slice(0,visibleCount).map((date,index)=><li key={`${date}-${index}`}>
     {isRecoveryDate(date)?<button onClick={()=>navigate(`/dynamic-overview/${date}`,{state:{overviewFrom:'/calendar'}})} className="recovery-history-row" aria-label={`View recovery day ${format(new Date(date+'T00:00:00'),'MMMM d, yyyy')}`}><Calendar size={19} className="text-feature-orange shrink-0"/><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{format(new Date(date+'T00:00:00'),'MMMM d, yyyy')}</span><span className="block text-xs text-muted-foreground mt-0.5">Recovery day</span></span><ChevronRight size={18} className="text-muted-foreground"/></button>:<div className="recovery-history-row"><Info size={18} className="text-muted-foreground"/><span className="text-xs text-muted-foreground break-all">Unrecognized recovery date: {date}</span></div>}
    </li>)}</ul>
    {history.length>visibleCount&&<button className="recovery-expand" onClick={()=>setVisibleCount(count=>count+20)}>Show More Recovery Days<ChevronDown size={17}/></button>}
    {visibleCount>5&&<button className="recovery-expand" onClick={()=>setVisibleCount(5)}>Show Less<ChevronDown size={17} className="rotate-180"/></button>}
    <p className="text-center text-xs text-muted-foreground mt-3" aria-live="polite">Showing {Math.min(visibleCount,history.length)} of {history.length} recovery days in this period</p>
   </>:<p className="recovery-empty">No recovery days recorded in this period.</p>}
  </section>
  <details className="recovery-card recovery-instructions mt-4"><summary><span className="recovery-icon recovery-info-icon"><Info size={22}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">How Recovery Days Work</span><span className="block text-xs text-muted-foreground mt-1">Mark and manage recovery days</span></span><ChevronDown size={18} className="instructions-chevron text-muted-foreground"/></summary><ol className="recovery-instructions-list"><li><Calendar size={17}/>Open Calendar and select a date.</li><li><Heart size={17}/>In Dynamic Overview, use Recovery to mark or unmark the day.</li><li><CheckCircle2 size={17}/>Recovery days count toward consistency without requiring a workout.</li></ol></details>
  <p className="recovery-note mt-5"><Calendar size={17}/>Use your Calendar to mark or update recovery days.</p>
 </div></div>;
}
