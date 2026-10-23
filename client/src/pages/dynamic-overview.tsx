import React, { useState, useEffect } from "react";
import { ArrowLeft, BarChart3, BookOpen, Zap, Pill, Edit2, Save, X, Heart, Timer, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSupplements } from "@/hooks/use-supplements";
import { useEnergyLevel } from "@/hooks/use-energy-level";
import { useRecovery } from "@/hooks/use-recovery";
import { useWorkoutDuration } from "@/hooks/use-workout-duration";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const colorClassMap: { [key: string]: string } = {
  green: 'workout-green',
  blue: 'workout-blue',
  purple: 'workout-purple',
  amber: 'workout-amber',
  red: 'workout-red',
  pink: 'workout-pink',
  cyan: 'workout-cyan',
  lime: 'workout-lime',
  orange: 'workout-orange',
  indigo: 'workout-indigo',
  emerald: 'workout-emerald',
  yellow: 'workout-yellow'
};

interface DynamicOverviewProps {
  selectedDate: string;
}

export function DynamicOverview({ selectedDate }: DynamicOverviewProps) {
  const [, navigate] = useLocation();
  const {
    getWorkoutLogsForDate,
    editWorkoutForDate,
    getJournalEntry,
    addJournalEntry,
    isWorkoutActiveOnDay
  } = useWorkouts();
  const { supplements: allSupplements, getSupplementLogsForDate, setSupplementLog, createSupplement } = useSupplements();
  const { getEnergyLevel, setEnergyLevelForDate } = useEnergyLevel();
  const { isRecoveryDay, toggleRecoveryDay } = useRecovery();
  const { getWorkoutDurationForDate, formatDuration, updateWorkoutDurationForDate } = useWorkoutDuration();

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [journalText, setJournalText] = useState("");
  const [energyLevel, setEnergyLevel] = useState(0);
  const [supplementLogs, setSupplementLogs] = useState<{id: number, name: string, taken: boolean}[]>([]);
  const [isRecovery, setIsRecovery] = useState(false);
  
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingWorkoutCount, setEditingWorkoutCount] = useState("");
  
  // Supplement creation state
  const [isAddingSuplement, setIsAddingSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Duration edit modal state
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [editHours, setEditHours] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  useEffect(() => {
    // Load all data for the selected date
    const workoutData = getWorkoutLogsForDate(selectedDate);
    const journalData = getJournalEntry(selectedDate);
    const energyData = getEnergyLevel(selectedDateObj);
    const supplementLogsData = getSupplementLogsForDate(selectedDate);
    const recoveryData = isRecoveryDay(selectedDate);
    
    // Filter workouts to show only those with activity (count > 0) on this date
    // This ensures historical workouts remain visible regardless of current schedule
    const filteredWorkouts = workoutData.filter(workout =>
      workout.count > 0
    );

    // Combine all supplements with their status for this date
    const supplementLogs = allSupplements.map(supplement => ({
      id: supplement.id,
      name: supplement.name,
      taken: supplementLogsData[supplement.id] || false
    }));

    setWorkouts(filteredWorkouts);
    setJournalText(journalData || '');
    setEnergyLevel(energyData);
    setSupplementLogs(supplementLogs);
    setIsRecovery(recoveryData);
  }, [selectedDate, refreshTrigger]);

  const handleEditWorkout = (workoutId: string, currentCount: number) => {
    setEditingWorkoutId(workoutId);
    setEditingWorkoutCount(currentCount.toString());
  };

  const handleSaveWorkoutEdit = () => {
    if (editingWorkoutId && editingWorkoutCount !== '') {
      const newCount = parseInt(editingWorkoutCount) || 0;
      editWorkoutForDate(editingWorkoutId, selectedDate, newCount);
      
      // Update local state
      setWorkouts(prev =>
        prev.map(workout =>
          workout.id === editingWorkoutId
            ? { ...workout, count: newCount }
            : workout
        )
      );
      
      setEditingWorkoutId(null);
      setEditingWorkoutCount('');
    }
  };

  const handleCancelWorkoutEdit = () => {
    setEditingWorkoutId(null);
    setEditingWorkoutCount('');
  };

  const handleJournalSave = () => {
    addJournalEntry(selectedDate, journalText);
  };

  const handleEnergyTap = () => {
    setEnergyLevel(prev => prev >= 10 ? 1 : prev + 1);
  };

  const handleEnergySave = () => {
    setEnergyLevelForDate(selectedDateObj, energyLevel);
  };

  const handleSupplementToggle = (supplementId: number) => {
    setSupplementLogs(prev =>
      prev.map(log =>
        log.id === supplementId
          ? { ...log, taken: !log.taken }
          : log
      )
    );
  };

  const handleSupplementsSave = () => {
    supplementLogs.forEach(log => {
      setSupplementLog(selectedDate, log.id, log.taken);
    });
  };

  const handleAddSupplement = () => {
    if (newSupplementName.trim()) {
      createSupplement({
        name: newSupplementName.trim(),
        measurementType: 'pills',
        amount: 1
      });
      setNewSupplementName("");
      setIsAddingSupplement(false);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
    }
  };

  const handleRecoveryToggle = () => {
    toggleRecoveryDay(selectedDate);
    setIsRecovery(!isRecovery);
  };

  const handleOpenDurationModal = () => {
    const currentDuration = getWorkoutDurationForDate(selectedDate);
    const hours = Math.floor(currentDuration / 3600);
    const minutes = Math.floor((currentDuration % 3600) / 60);
    const seconds = currentDuration % 60;
    
    setEditHours(hours.toString());
    setEditMinutes(minutes.toString());
    setEditSeconds(seconds.toString());
    setIsDurationModalOpen(true);
  };

  const handleSaveDuration = () => {
    const hours = parseInt(editHours) || 0;
    const minutes = parseInt(editMinutes) || 0;
    const seconds = parseInt(editSeconds) || 0;
    
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    if (totalSeconds > 0) {
      updateWorkoutDurationForDate(selectedDate, totalSeconds);
      setIsDurationModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const getEditDurationTotal = () => {
    const hours = parseInt(editHours) || 0;
    const minutes = parseInt(editMinutes) || 0;
    const seconds = parseInt(editSeconds) || 0;
    return (hours * 3600) + (minutes * 60) + seconds;
  };

  const getEnergyColor = (level: number) => {
    if (level === 0) return 'text-dim';
    if (level <= 3) return 'text-feature-red';
    if (level <= 6) return 'text-feature-yellow';
    return 'text-accent-text';
  };

  const getJournalWordCount = () => {
    if (!journalText.trim()) return 0;
    return journalText.trim().split(/\s+/).length;
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-dvh" style={{ backgroundColor: 'var(--page-background)', paddingBottom: 'var(--bottom-nav-padding)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/calendar")}
          className="text-dim hover:text-strong transition-colors"
          title="Back to Calendar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-bold text-strong">Dynamic Overview</h1>
        <div className="w-[20px]" />
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-strong">
          {format(selectedDateObj, "MMMM d, yyyy")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {format(selectedDateObj, "EEEE")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Workout Statistics */}
        {workouts.length > 0 && (
          <div className="glass-panel bg-surface rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-5 h-5 text-feature-blue" />
              <h3 className="text-lg font-semibold text-strong">Workout Statistics</h3>
            </div>
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colorClassMap[workout.color]}`}></div>
                    <span className="text-sm font-medium text-strong">{workout.name}</span>
                  </div>
                  
                  {editingWorkoutId === workout.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={editingWorkoutCount}
                        onChange={(e) => setEditingWorkoutCount(e.target.value)}
                        className="w-16 px-2 py-1 text-sm bg-surface text-strong rounded border border-control-muted-border focus:outline-none focus:border-blue-400"
                        min="0"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveWorkoutEdit}
                        className="p-1 text-accent-text hover:text-accent-soft transition-colors"
                        title="Save"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={handleCancelWorkoutEdit}
                        className="p-1 text-feature-red hover:text-feature-red-soft transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-strong">{workout.count}</span>
                      <button
                        onClick={() => handleEditWorkout(workout.id, workout.count)}
                        className="p-1 text-muted-foreground hover:text-subtle transition-colors"
                        title="Edit count"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Workout Duration */}
            {(() => {
              const workoutDuration = getWorkoutDurationForDate(selectedDate);
              return workoutDuration > 0 ? (
                <button
                  onClick={handleOpenDurationModal}
                  className="mt-4 p-3 bg-surface-secondary rounded-xl w-full hover:bg-control-strong transition-colors"
                  data-testid="button-edit-workout-duration"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Timer className="w-4 h-4 text-accent-text" />
                      <span className="text-sm font-medium text-strong">Workout Duration</span>
                    </div>
                    <span className="text-sm font-bold text-accent-text">{formatDuration(workoutDuration)}</span>
                  </div>
                </button>
              ) : null;
            })()}
          </div>
        )}

        {/* Recovery Day */}
        <div className="glass-panel bg-surface rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-feature-orange" />
              <h3 className="text-lg font-semibold text-strong">Recovery Day</h3>
            </div>
            <button
              onClick={handleRecoveryToggle}
              className={`px-4 py-2 rounded-xl transition-colors ${
                isRecovery
                  ? 'bg-orange-600 hover:bg-orange-700 text-strong'
                  : 'bg-surface-secondary hover:bg-control-strong text-supporting'
              }`}
            >
              {isRecovery ? 'Recovery Day' : 'Mark as Recovery'}
            </button>
          </div>
          {isRecovery && (
            <p className="text-sm text-feature-orange mt-2">
              This day is marked as a recovery day - workout goals don't apply
            </p>
          )}
        </div>

        {/* Journal Entry */}
        <div className="glass-panel bg-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-feature-purple" />
              <h3 className="text-lg font-semibold text-strong">Journal Entry</h3>
            </div>
            <p className="text-xs text-dim" data-testid="text-journal-word-count">
              {getJournalWordCount()} {getJournalWordCount() === 1 ? 'word' : 'words'}
            </p>
          </div>
          <div className="space-y-4">
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              aria-label="Journal entry"
              className="w-full h-32 p-3 bg-surface-secondary text-strong rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck={true}
              data-testid="textarea-journal-entry"
            />
            <button
              onClick={handleJournalSave}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-on-action rounded-xl transition-colors"
            >
              Save Entry
            </button>
          </div>
        </div>

        {/* Energy Level */}
        <div className="glass-panel bg-surface rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-5 h-5 text-feature-yellow" />
            <h3 className="text-lg font-semibold text-strong">Energy Level</h3>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleEnergyTap}
              className="w-20 h-20 rounded-full border-4 border-control bg-surface-secondary flex items-center justify-center transition-all hover:scale-105"
              style={{
                borderColor: energyLevel > 0 ? (energyLevel <= 3 ? 'var(--bmi-red)' : energyLevel <= 6 ? 'var(--energy-amber)' : 'var(--bmi-green)') : 'hsl(var(--control-border))'
              }}
            >
              <div className={`type-metric text-2xl font-bold ${getEnergyColor(energyLevel)}`}>
                {energyLevel}
              </div>
            </button>
            <div className="flex-1 ml-4">
              <p className="text-sm text-supporting mb-2">
                Tap the circle to set energy level (1-10 scale)
              </p>
              <button
                onClick={handleEnergySave}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-on-action rounded-xl transition-colors"
              >
                Save Level
              </button>
            </div>
          </div>
        </div>

        {/* Supplements */}
        <div className="glass-panel bg-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Pill className="w-5 h-5 text-accent-text" />
              <h3 className="text-lg font-semibold text-strong">Supplements</h3>
            </div>
            <button
              onClick={() => setIsAddingSupplement(true)}
              className="bg-action-selected hover:bg-action text-on-action rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              title="Add supplement"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isAddingSuplement && (
            <div className="mb-4 p-3 bg-surface-secondary rounded-xl">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newSupplementName}
                  onChange={(e) => setNewSupplementName(e.target.value)}
                  aria-label="Supplement name"
                  className="flex-1 px-3 py-2 bg-surface text-strong rounded border border-control-muted-border focus:outline-none focus:border-green-400"
                  autoFocus
                />
                <button
                  onClick={handleAddSupplement}
                  className="px-3 py-2 bg-action hover:bg-action-hover text-on-action rounded text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingSupplement(false);
                    setNewSupplementName("");
                  }}
                  className="px-3 py-2 bg-control-strong hover:bg-control-muted text-strong rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {allSupplements.length > 0 ? (
            <div className="space-y-3">
              {supplementLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSupplementToggle(log.id)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        log.taken
                          ? 'bg-action-selected border-green-500'
                          : 'border-control-muted hover:border-supporting'
                      }`}
                    >
                      {log.taken && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                    <span className={`font-medium ${log.taken ? 'text-accent-text' : 'text-strong'}`}>
                      {log.name}
                    </span>
                  </div>
                  <span className={`text-sm ${log.taken ? 'text-accent-text' : 'text-muted-foreground'}`}>
                    {log.taken ? 'Taken' : 'Not taken'}
                  </span>
                </div>
              ))}
              <button
                onClick={handleSupplementsSave}
                className="w-full mt-4 px-4 py-2 bg-action hover:bg-action-hover text-on-action rounded-xl transition-colors"
              >
                Save Supplement Log
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-2">No supplements added yet</p>
              <p className="text-sm text-dim">Click the + button above to add your first supplement</p>
            </div>
          )}
        </div>
      </div>

      {/* Duration Edit Modal */}
      <Dialog open={isDurationModalOpen} onOpenChange={setIsDurationModalOpen}>
        <DialogContent className="bg-surface text-strong border-separator">
          <DialogHeader>
            <DialogTitle>Edit Workout Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Adjust the total workout duration for {format(selectedDateObj, "MMMM d, yyyy")}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Hours</label>
                <input
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary text-strong rounded-lg border border-control focus:outline-none focus:border-green-400"
                  min="0"
                  data-testid="input-duration-hours"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Minutes</label>
                <input
                  type="number"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary text-strong rounded-lg border border-control focus:outline-none focus:border-green-400"
                  min="0"
                  max="59"
                  data-testid="input-duration-minutes"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Seconds</label>
                <input
                  type="number"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary text-strong rounded-lg border border-control focus:outline-none focus:border-green-400"
                  min="0"
                  max="59"
                  data-testid="input-duration-seconds"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {getEditDurationTotal() === 0 && (
              <p className="text-sm text-feature-red flex-1 text-center sm:text-left">
                Duration must be greater than 0
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsDurationModalOpen(false)}
                className="px-4 py-2 bg-surface-secondary hover:bg-control-strong text-strong rounded-lg transition-colors"
                data-testid="button-cancel-duration"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDuration}
                disabled={getEditDurationTotal() === 0}
                className="px-4 py-2 bg-action hover:bg-action-hover text-on-action rounded-lg transition-colors disabled:bg-control-strong disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="button-save-duration"
              >
                Save Duration
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}