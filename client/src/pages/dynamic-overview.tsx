import React, { useState, useEffect } from "react";
import { ArrowLeft, BarChart3, BookOpen, Zap, Pill, Edit2, Save, X, Heart, Timer } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSupplements } from "@/hooks/use-supplements";
import { useEnergyLevel } from "@/hooks/use-energy-level";
import { useRecovery } from "@/hooks/use-recovery";
import { useWorkoutDuration } from "@/hooks/use-workout-duration";
import { format } from "date-fns";

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
    addJournalEntry 
  } = useWorkouts();
  const { getSupplementLogsForDate, setSupplementLog } = useSupplements();
  const { getEnergyLevel, setEnergyLevelForDate } = useEnergyLevel();
  const { isRecoveryDay, toggleRecoveryDay } = useRecovery();
  const { getWorkoutDurationForDate, formatDuration } = useWorkoutDuration();

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [journalText, setJournalText] = useState("");
  const [energyLevel, setEnergyLevel] = useState(0);
  const [supplementLogs, setSupplementLogs] = useState<{id: number, name: string, taken: boolean}[]>([]);
  const [isRecovery, setIsRecovery] = useState(false);
  
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingWorkoutCount, setEditingWorkoutCount] = useState("");

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  useEffect(() => {
    // Load all data for the selected date
    const workoutData = getWorkoutLogsForDate(selectedDate);
    const journalData = getJournalEntry(selectedDate);
    const energyData = getEnergyLevel(selectedDateObj);
    const supplementData = getSupplementLogsForDate(selectedDate);
    const recoveryData = isRecoveryDay(selectedDate);

    setWorkouts(workoutData);
    setJournalText(journalData || '');
    setEnergyLevel(energyData);
    setSupplementLogs(supplementData);
    setIsRecovery(recoveryData);
  }, [selectedDate]);

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

  const handleRecoveryToggle = () => {
    toggleRecoveryDay(selectedDate);
    setIsRecovery(!isRecovery);
  };

  const getEnergyColor = (level: number) => {
    if (level === 0) return 'text-slate-500';
    if (level <= 3) return 'text-red-400';
    if (level <= 6) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/calendar")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Calendar"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-xl font-bold text-white">Dynamic Overview</h1>
        <div className="w-[42px]" />
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-white">
          {format(selectedDateObj, "MMMM d, yyyy")}
        </h2>
        <p className="text-sm text-slate-400">
          {format(selectedDateObj, "EEEE")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Workout Statistics */}
        {workouts.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Workout Statistics</h3>
            </div>
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colorClassMap[workout.color]}`}></div>
                    <span className="text-sm font-medium text-white">{workout.name}</span>
                  </div>
                  
                  {editingWorkoutId === workout.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={editingWorkoutCount}
                        onChange={(e) => setEditingWorkoutCount(e.target.value)}
                        className="w-16 px-2 py-1 text-sm bg-slate-800 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-400"
                        min="0"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveWorkoutEdit}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                        title="Save"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={handleCancelWorkoutEdit}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{workout.count}</span>
                      <button
                        onClick={() => handleEditWorkout(workout.id, workout.count)}
                        className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
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
                <div className="mt-4 p-3 bg-slate-700 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Timer className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">Workout Duration</span>
                    </div>
                    <span className="text-sm font-bold text-green-400">{formatDuration(workoutDuration)}</span>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Recovery Day */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Recovery Day</h3>
            </div>
            <button
              onClick={handleRecoveryToggle}
              className={`px-4 py-2 rounded-xl transition-colors ${
                isRecovery 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {isRecovery ? 'Recovery Day' : 'Mark as Recovery'}
            </button>
          </div>
          {isRecovery && (
            <p className="text-sm text-orange-400 mt-2">
              This day is marked as a recovery day - workout goals don't apply
            </p>
          )}
        </div>

        {/* Journal Entry */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Journal Entry</h3>
          </div>
          <div className="space-y-4">
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Write your journal entry for this day..."
              className="w-full h-32 p-3 bg-slate-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleJournalSave}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              Save Entry
            </button>
          </div>
        </div>

        {/* Energy Level */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Energy Level</h3>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleEnergyTap}
              className="w-20 h-20 rounded-full border-4 border-slate-600 bg-slate-700 flex items-center justify-center transition-all hover:scale-105"
              style={{
                borderColor: energyLevel > 0 ? (energyLevel <= 3 ? '#ef4444' : energyLevel <= 6 ? '#fbbf24' : '#22c55e') : '#475569'
              }}
            >
              <div className={`text-2xl font-bold ${getEnergyColor(energyLevel)}`}>
                {energyLevel}
              </div>
            </button>
            <div className="flex-1 ml-4">
              <p className="text-sm text-slate-300 mb-2">
                Tap the circle to set energy level (1-10 scale)
              </p>
              <button
                onClick={handleEnergySave}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors"
              >
                Save Level
              </button>
            </div>
          </div>
        </div>

        {/* Supplements */}
        {supplementLogs.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Pill className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Supplements</h3>
            </div>
            <div className="space-y-3">
              {supplementLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSupplementToggle(log.id)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        log.taken
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {log.taken && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                    <span className={`font-medium ${log.taken ? 'text-green-400' : 'text-white'}`}>
                      {log.name}
                    </span>
                  </div>
                  <span className={`text-sm ${log.taken ? 'text-green-400' : 'text-slate-400'}`}>
                    {log.taken ? 'Taken' : 'Not taken'}
                  </span>
                </div>
              ))}
              <button
                onClick={handleSupplementsSave}
                className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                Save Supplement Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}