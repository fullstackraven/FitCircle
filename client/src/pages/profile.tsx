import { useState, useEffect } from 'react';
import { ArrowLeft, User, CalendarDays, Ruler, Target, Pencil, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { readFitnessProfile, readTrainingOverview, readMeasurementPreview, saveFitnessProfile, primaryObjectives, type ProfilePatch } from '@/lib/fitness-profile';

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const fromDashboard = params.get('from') === 'dashboard';
  const requestedReturn = params.get('returnTo');
  const returnTo = requestedReturn && ['/', '/calendar', '/routines', '/wellness', '/reminders'].includes(requestedReturn) ? requestedReturn : '/';
  const [profile, setProfile] = useState(() => readFitnessProfile());
  const [training, setTraining] = useState(() => readTrainingOverview());
  const [measurements, setMeasurements] = useState(() => readMeasurementPreview());
  const [editor, setEditor] = useState<'profile' | 'goals' | null>(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [objective, setObjective] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const refresh = () => { setProfile(readFitnessProfile()); setTraining(readTrainingOverview()); setMeasurements(readMeasurementPreview()); };
  useEffect(() => {
    const timer = setInterval(refresh, 60_000);
    window.addEventListener('storage', refresh); window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const openEditor = (section: 'profile' | 'goals') => {
    setName(profile.name); setDob(profile.dateOfBirth); setObjective(profile.objective); setGoal(profile.goal); setError(''); setEditor(section);
  };
  const save = () => {
    try {
      const patch: ProfilePatch = {};
      if (editor === 'profile') {
        if (name !== profile.name) patch.name = name;
        if (dob !== profile.dateOfBirth) patch.dateOfBirth = dob;
      } else {
        if (goal !== profile.goal) patch.goal = goal;
        if (objective !== profile.objective) patch.objective = objective;
      }
      saveFitnessProfile(patch); refresh(); setEditor(null);
      window.dispatchEvent(new Event('fitcircleProfileChanged'));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save your profile. Please retry.'); }
  };
  const back = () => { if (fromDashboard) sessionStorage.setItem('fitcircle_dashboard_open', 'true'); navigate(fromDashboard ? returnTo : '/'); };
  const fullReps = training?.totalReps.toLocaleString() ?? 'Unavailable';
  const compactReps = training ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(training.totalReps) : '—';
  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={back} className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-white" aria-label="Back"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold tracking-tight text-white">My Fitness Profile</h1>
      </div>
      {profile.error && <div role="alert" className="rounded-xl border border-amber-500/40 p-3 text-sm text-amber-200">{profile.error}<div className="flex gap-3 mt-2"><button className="min-h-11" onClick={refresh}>Retry</button><button className="min-h-11" onClick={() => navigate('/settings')}>Open Settings</button></div></div>}
      <header className="flex items-center gap-3">
        <div className="w-14 h-14 shrink-0 rounded-full bg-green-400/10 flex items-center justify-center"><User size={28} className="text-green-400" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1"><h2 className="entity-name text-xl font-semibold text-white">{profile.name || 'Your fitness journey'}</h2><p className="text-sm text-slate-400 mt-1">Your personal training overview</p></div>
        <button onClick={() => openEditor('profile')} disabled={!!profile.error} className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-green-400 disabled:opacity-40" aria-label="Edit Profile"><SlidersHorizontal size={20} /></button>
      </header>
      <section aria-labelledby="profile-focus" className="rounded-2xl bg-slate-800/90 border border-slate-700/40 p-4">
        <div className="flex items-center justify-between gap-2 mb-2"><h2 id="profile-focus" className="font-semibold text-white">Current Focus</h2><button aria-label="Edit Fitness Goals" disabled={!!profile.error} onClick={() => openEditor('goals')} className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-green-400 disabled:opacity-40"><Pencil size={18} /></button></div>
        <p className="entity-name text-lg font-semibold text-white whitespace-pre-wrap">{profile.objective || profile.goal || 'Set a personal fitness objective'}</p>
        {profile.objective && profile.goal && <p className="entity-name text-sm leading-relaxed text-slate-400 whitespace-pre-wrap mt-2">{profile.goal}</p>}
      </section>
      <section aria-labelledby="profile-training">
        <h2 id="profile-training" className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Your Training</h2>
        {training ? <dl className="grid grid-cols-3 gap-2">
          {[['Active Days', String(training.totalCompletedDays), String(training.totalCompletedDays)], ['Consistency', `${training.totalConsistency.toFixed(1)}%`, `${training.totalConsistency.toFixed(1)}%`], ['Total Reps', compactReps, fullReps]].map(([label, value, full]) => <div key={label} className="rounded-xl bg-slate-800/90 p-2 text-center flex flex-col justify-center min-h-20"><dt className="order-2 text-xs text-slate-400 mt-1">{label}</dt><dd title={full} className="order-1 type-metric text-xl font-bold text-white break-all">{value}</dd></div>)}
        </dl> : <p className="text-sm text-amber-200">Training history is unavailable. Existing records have not been changed.</p>}
        {training && training.totalReps === 0 && training.totalCompletedDays === 0 && <p className="text-sm text-slate-400 mt-2">No workouts recorded yet</p>}
        <button onClick={() => navigate('/workout-statistics')} className="min-h-11 text-sm text-green-400 hover:text-green-300">View Workout Statistics</button>
        <p className="text-xs text-slate-500">Active days and consistency use the same completed-day definitions as Workout Statistics.</p>
      </section>
      <section aria-labelledby="profile-details">
        <h2 id="profile-details" className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Personal Details</h2>
        <div className="rounded-2xl bg-slate-800/90 divide-y divide-slate-700/60 px-4">
          <button onClick={() => openEditor('profile')} disabled={!!profile.error} className="w-full min-h-16 flex items-center gap-3 text-left disabled:opacity-40"><CalendarDays size={20} className="shrink-0 text-slate-400" /><div className="min-w-0 flex-1"><span className="block text-sm font-medium text-white">Date of Birth</span><span className="block text-xs text-slate-400 mt-1">{profile.dateOfBirth ? `${profile.dateOfBirth} · Age ${profile.age}` : profile.age !== null ? `Age ${profile.age} · ${profile.ageSource}` : 'Optional'}</span></div><ChevronRight size={18} className="text-slate-400" /></button>
          <button onClick={() => navigate('/measurements')} className="w-full min-h-16 flex items-center gap-3 text-left"><Ruler size={20} className="shrink-0 text-slate-400" /><div className="min-w-0 flex-1"><span className="block text-sm font-medium text-white">Body Measurements</span>{measurements && <span className="block text-xs text-slate-400 mt-1">{measurements}</span>}</div><ChevronRight size={18} className="text-slate-400" /></button>
          <button onClick={() => openEditor('goals')} disabled={!!profile.error} className="w-full min-h-16 flex items-center gap-3 text-left disabled:opacity-40"><Target size={20} className="shrink-0 text-slate-400" /><span className="flex-1 text-sm font-medium text-white">Fitness Goals</span><ChevronRight size={18} className="text-slate-400" /></button>
        </div>
      </section>
      <Dialog open={editor !== null} onOpenChange={open => { if (!open) setEditor(null); }}>
        <DialogContent staticBody fixedFooter className="bg-slate-900 border-slate-700 max-w-md p-4 gap-3">
          <DialogHeader><DialogTitle>{editor === 'profile' ? 'Edit Profile' : 'Fitness Goals'}</DialogTitle><DialogDescription className="sr-only">Changes stay on this device. Training goals and calculations are not modified automatically.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {editor === 'profile' ? <>
              <label className="block text-sm text-slate-300">Name<Input aria-label="Name" value={name} onChange={event => setName(event.target.value)} className="mt-1 text-base" /></label>
              <label className="block text-sm text-slate-300">Date of Birth (optional)<Input aria-label="Date of Birth" type="date" value={dob} onChange={event => setDob(event.target.value)} className="mt-1 text-base" /></label>
            </> : <>
              <label className="block text-sm text-slate-300">Primary objective<select aria-label="Primary objective" value={objective} onChange={event => setObjective(event.target.value)} className="glass-input block w-full rounded-lg min-h-11 px-2 mt-1 text-base bg-slate-800"><option value="">No primary objective</option>{objective && !primaryObjectives.includes(objective as typeof primaryObjectives[number]) && <option value={objective}>{objective}</option>}{primaryObjectives.map(value => <option key={value}>{value}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Personal goal description<Textarea aria-label="Fitness Goal" value={goal} onChange={event => setGoal(event.target.value)} rows={2} className="mt-1 text-base resize-none" /></label>
            </>}
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          </div>
          <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0"><Button variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button onClick={save} className="bg-green-400 text-slate-950 hover:bg-green-300">Save Profile</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
