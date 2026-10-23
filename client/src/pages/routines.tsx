import { SidebarProfileCard } from '@/components/SidebarProfileCard';
import { VersionLabel } from "@/components/VersionLabel";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect, useRef } from 'react';
import { Edit, ChevronUp, ChevronDown, Plus, Menu, Settings, Calculator, CheckCircle, Trash2, Dumbbell } from 'lucide-react';
import { useLocation } from 'wouter';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useWorkouts } from '@/hooks/use-workouts';
import { getColorClass } from '@/lib/color-utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorkoutModal } from '@/components/workout-modal';
import { RoutineModal } from '@/components/routine-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function RoutinesPage() {
  const [, navigate] = useLocation();
  const [isEditWorkoutsOpen, setIsEditWorkoutsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [pendingRoutineDeletion, setPendingRoutineDeletion] = useState<{ id: string; name: string } | null>(null);
  const cancelDeletionRef = useRef<HTMLButtonElement>(null);
  const deletionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');
  const [preSelectedDays, setPreSelectedDays] = useState<number[] | undefined>(undefined);

  // Check if we should open dashboard on load
  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    const dashboardState = sessionStorage.getItem('fitcircle_dashboard_open');
    
    if (shouldOpenDashboard || dashboardState === 'true') {
      setIsSidebarOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem('fitcircle_dashboard_open');
    }
  }, []);

  const { 
    getWorkoutArray, 
    addWorkout, 
    deleteWorkout, 
    updateWorkout, 
    getAvailableColors,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    getRoutineArray,
    getWorkoutsByDays
  } = useWorkouts();

  const getScheduledDaysText = (scheduledDays: number[]): string => {
    if (!scheduledDays || scheduledDays.length === 0 || scheduledDays.length === 7) return 'Daily';
    if (scheduledDays.length === 5 && scheduledDays.every(day => day >= 1 && day <= 5)) return 'Weekdays';
    if (scheduledDays.length === 2 && scheduledDays.includes(0) && scheduledDays.includes(6)) return 'Weekends';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return scheduledDays.map(day => days[day]).join(', ');
  };
  
  const workouts = getWorkoutArray() || [];
  const routines = getRoutineArray() || [];
  const availableColors = getAvailableColors();


  const handleAddRoutine = () => {
    setEditingRoutine(null);
    setIsRoutineModalOpen(true);
  };

  const handleEditRoutine = (routine: any) => {
    setEditingRoutine(routine);
    setIsRoutineModalOpen(true);
  };

  const handleSaveRoutine = (name: string, selectedDays: number[]) => {
    if (editingRoutine) {
      updateRoutine(editingRoutine.id, name, selectedDays);
    } else {
      addRoutine(name, selectedDays);
    }
    setIsRoutineModalOpen(false);
    setEditingRoutine(null);
  };

  const handleConfirmRoutineDeletion = () => {
    if (!pendingRoutineDeletion) return;
    deleteRoutine(pendingRoutineDeletion.id);
    setPendingRoutineDeletion(null);
  };

  const toggleRoutineExpansion = (routineId: string) => {
    setExpandedRoutines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routineId)) {
        newSet.delete(routineId);
      } else {
        newSet.add(routineId);
      }
      return newSet;
    });
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout({
      id: workout.id,
      name: workout.name,
      color: workout.color,
      dailyGoal: workout.dailyGoal,
      weightLbs: workout.weightLbs,
      scheduledDays: workout.scheduledDays
    });
    setIsModalOpen(true);
  };

  const handleAddWorkout = (name: string, color: string, dailyGoal: number, weightLbs?: number, scheduledDays?: number[]) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, name, dailyGoal, weightLbs, scheduledDays, color);
    } else {
      addWorkout(name, color, dailyGoal, weightLbs, scheduledDays);
    }
    setIsModalOpen(false);
    setEditingWorkout(null);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    deleteWorkout(workoutId);
    setIsModalOpen(false);
    setEditingWorkout(null);
  };

  return (
    <div className="fitcircle-page">
      {/* Header is rendered into the non-scrolling shell host */}
      <AppHeader>
        <div className="relative text-center max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 left-4 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-strong transition-colors"
            title="Open Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="fitcircle-wordmark text-2xl font-bold text-strong">FitCircle</h1>
        </div>
      </AppHeader>

      {/* Main content; header spacing is handled by normal flow */}
      <div>
        <div className="container mx-auto px-4 pb-6 max-w-md">
        <h2 className="text-3xl font-bold text-accent-text tracking-tight mb-4">Routines</h2>
        {/* Add Routines Section - Only show when no routines exist */}
        {routines.length === 0 && (
          <section className="mb-8">
            <button
              onClick={handleAddRoutine}
              className="w-full rounded-2xl border border-dashed border-control bg-surface/80 p-4 transition-colors hover:border-control-muted-border hover:bg-surface"
              data-testid="button-add-routine"
            >
              <div className="flex flex-col items-center space-y-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <div className="text-base font-semibold text-strong">Tap to Add Routines</div>
                <div className="text-sm text-muted-foreground">Create workout routines for specific days</div>
              </div>
            </button>
          </section>
        )}

        {/* Display Existing Routines */}
        {routines.length > 0 && (
          <section className="mb-4 space-y-3">
            {routines.map((routine) => {
              const routineWorkouts = getWorkoutsByDays(routine.selectedDays);
              const daysText = getScheduledDaysText(routine.selectedDays);
              
              const isExpanded = expandedRoutines.has(routine.id);
              
              return (
                <div key={routine.id} className="rounded-2xl border border-separator/70 bg-surface/80" data-testid={`routine-card-${routine.id}`}>
                  <div className="flex items-center gap-1 px-3 py-2">
                    <button type="button"
                      className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-xl py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      onClick={() => toggleRoutineExpansion(routine.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`routine-content-${routine.id}`}
                      data-testid={`routine-header-${routine.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="entity-name text-base font-semibold text-strong">{routine.name}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{daysText} · {routineWorkouts.length} {routineWorkouts.length === 1 ? 'exercise' : 'exercises'}</p>
                      </div>
                      <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleEditRoutine(routine)}
                      aria-label={`Edit routine ${routine.name}`}
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:text-strong focus-visible:ring-2 focus-visible:ring-focus"
                      data-testid={`button-edit-routine-${routine.id}`}
                    ><Edit size={18} aria-hidden="true" /></button>
                    <button
                      onClick={(event) => { deletionTriggerRef.current = event.currentTarget; setPendingRoutineDeletion({ id: routine.id, name: routine.name }); }}
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:text-feature-red focus-visible:ring-2 focus-visible:ring-focus"
                      aria-label={`Delete routine ${routine.name}`}
                      data-testid={`button-delete-routine-${routine.id}`}
                    ><Trash2 size={18} aria-hidden="true" /></button>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div id={`routine-content-${routine.id}`} className="mx-3 border-t border-separator/60 pb-3 pt-3">
                      {routineWorkouts.length > 0 ? (
                        <div className="space-y-2">
                          {routineWorkouts.map((workout) => (
                            <div key={workout.id} data-testid={`routine-exercise-${routine.id}-${workout.id}`} className="flex min-w-0 items-center gap-3 rounded-xl bg-surface-secondary/60 px-3 py-2.5">
                              <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${getColorClass(workout.color)}`} />
                              <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                <span className="entity-name min-w-0 text-sm font-medium text-strong">{workout.name}</span>
                                <span className="entity-name text-xs text-muted-foreground tabular-nums">{workout.dailyGoal} reps{workout.weightLbs ? ` · ${workout.weightLbs} lb` : ''}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground bg-surface-secondary rounded-xl">
                          <p className="text-sm">No workouts scheduled for these days yet.</p>
                          <p className="text-xs">Add workouts and set their schedule to see them here.</p>
                        </div>
                      )}
                      
                      {/* Add Workout Button for this routine */}
                      <button
                        onClick={() => {
                          setPreSelectedDays(routine.selectedDays);
                          setEditingWorkout(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-secondary/60 px-3 py-2 text-supporting transition-colors hover:bg-surface-secondary hover:text-strong"
                        data-testid={`button-add-workout-${routine.id}`}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add Workout</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Create Routine Bar Button */}
        {routines.length > 0 && (
          <button
            onClick={handleAddRoutine}
            className="mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-action px-4 py-3 transition-colors hover:bg-action-hover"
            data-testid="button-create-routine"
          >
            <Plus className="h-4 w-4 text-on-action" aria-hidden="true" />
            <span className="text-on-action font-semibold">Create Routine</span>
          </button>
        )}

        {/* Edit Workouts Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Collapsible open={isEditWorkoutsOpen} onOpenChange={setIsEditWorkoutsOpen} className="min-w-0 flex-1">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto min-h-14 w-full justify-between rounded-2xl border-separator/70 bg-surface/80 px-3 py-3 text-strong hover:bg-surface"
                >
                  <span className="flex items-center gap-3 text-base font-semibold"><Dumbbell className="h-4 w-4 text-accent-text" aria-hidden="true" />Edit Workouts</span>
                  {isEditWorkoutsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 rounded-2xl border border-separator/70 bg-surface/80 p-3" data-testid="exercise-library">
                {workouts.length === 0 ? (
                  <div className="text-center py-4">
                    <h3 className="text-xl font-bold text-strong mb-2">No Workouts Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create your first workout routine to get started.
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingWorkout(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-action hover:bg-action-hover text-on-action"
                    >
                      Add Workout
                    </Button>
                  </div>
                ) : (
                  <>
                    {workouts.map((workout) => {
                      const scheduledDaysText = getScheduledDaysText(workout.scheduledDays || [0,1,2,3,4,5,6]);
                      return (
                        <div 
                          key={workout.id} 
                          className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-surface-secondary/60 px-3 py-2" data-testid={`library-exercise-${workout.id}`}
                        >
                          <div className="flex min-w-0 flex-1 items-center space-x-3">
                            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${getColorClass(workout.color)}`} />
                            <div className="min-w-0">
                              <div className="entity-name text-sm font-medium text-strong">{workout.name}</div>
                              <div className="entity-name mt-1 text-xs text-muted-foreground tabular-nums">
                                {scheduledDaysText} · {workout.dailyGoal} reps
                                {workout.weightLbs && ` · ${workout.weightLbs} lb`}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditWorkout(workout)}
                            aria-label={`Edit workout ${workout.name}`}
                            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-strong focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-control">
                      <Button 
                        onClick={() => {
                          setEditingWorkout(null);
                          setIsModalOpen(true);
                        }}
                        variant="outline"
                        className="min-h-11 w-full bg-surface-secondary border-control text-strong hover:bg-control-strong"
                      >
                        Add New Workout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
            </Collapsible>
          </div>
        </section>
      </div>

      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkout(null);
          setPreSelectedDays(undefined);
        }}
        onSave={handleAddWorkout}
        onDelete={handleDeleteWorkout}
        availableColors={availableColors}
        editingWorkout={editingWorkout}
        preSelectedDays={preSelectedDays}
      />

      <RoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => {
          setIsRoutineModalOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSaveRoutine}
        editingRoutine={editingRoutine}
      />

      <Dialog open={pendingRoutineDeletion !== null} onOpenChange={(open) => { if (!open) setPendingRoutineDeletion(null); }}>
        <DialogContent fixedFooter role="alertdialog" className="max-w-md text-strong p-4 sm:p-6"
          onOpenAutoFocus={(event) => { event.preventDefault(); cancelDeletionRef.current?.focus(); }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (deletionTriggerRef.current?.isConnected) deletionTriggerRef.current.focus();
            else document.querySelector<HTMLButtonElement>('[data-testid="button-create-routine"], [data-testid="button-add-routine"]')?.focus();
          }}>
          <DialogHeader>
            <DialogTitle>Delete routine?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{pendingRoutineDeletion?.name}”? This cannot be undone. Your workouts and workout history will be kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 border-t border-separator pt-4 sm:space-x-0">
            <Button ref={cancelDeletionRef} variant="outline" className="min-h-11" onClick={() => setPendingRoutineDeletion(null)}>Cancel</Button>
            <Button variant="destructive" className="min-h-11 bg-red-600 text-on-action hover:bg-red-700" aria-label="Delete routine" onClick={handleConfirmRoutineDeletion}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar Dashboard */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 bg-canvas border-separator">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <SidebarProfileCard open={isSidebarOpen} returnTo="/routines" onNavigate={() => setIsSidebarOpen(false)} />

            <div className="flex-1 py-4">
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-surface transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/settings?from=dashboard');
                }}
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="text-strong">Settings</span>
              </div>
            </div>

            <div className="p-4 border-t border-separator">
              <VersionLabel onActivate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}
