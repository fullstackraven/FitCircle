import {
  WellnessPageShell,
  WellnessProgressHero,
  WellnessRecentActivity,
  WellnessTodaySection,
  WellnessPrimaryAction,
  WellnessHistoryRow,
  WellnessGoalSheet,
  WellnessEntryActions,
} from "@/components/wellness/WellnessUI";
import { dailyTotals, weekDates } from "@/lib/wellness-progress";
import { WellnessHistory } from "@/components/WellnessHistory";
import { percentage, amount } from "@/lib/wellness-progress";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Activity } from "lucide-react";
import { useCardio, CardioEntry, CardioSession } from "@/hooks/use-cardio";
import { GoalCircle } from "@/components/GoalCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { getTodayString, groupLogsByMonth } from "@/lib/date-utils";

export default function CardioPage() {
  const {
    addCardioEntry,
    updateCardioSession,
    deleteCardioSession,
    updateGoal,
    addCustomType,
    getAllCardioTypes,
    getTodaysProgress,
    getWeeklyProgress,
    getCardioStats,
    getHistoricalStats,
    data,
  } = useCardio();

  // State for modals and forms
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCustomTypeOpen, setIsAddCustomTypeOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CardioSession | null>(null);

  // Goal dialog state
  const [goalInput, setGoalInput] = useState("");
  const [goalInputFocused, setGoalInputFocused] = useState(false);

  // Form states
  const [newEntry, setNewEntry] = useState({
    type: "",
    duration: "",
    distance: "",
    notes: "",
  });
  const [newCustomType, setNewCustomType] = useState("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const todaysProgress = getTodaysProgress();
  const weeklyProgress = getWeeklyProgress();
  const stats = getCardioStats();
  const cardioTypes = getAllCardioTypes();

  const todaysValue =
    data.goal.type === "duration"
      ? todaysProgress.today.duration
      : todaysProgress.today.distance;

  const resetAddForm = () => {
    setNewEntry({
      type: "",
      duration: "",
      distance: "",
      notes: "",
    });
  };

  // Get all sessions as flat array for grouping (using legacy compatibility)
  const allSessions = Object.values(data.dailyLogs || {}).flatMap((dayLog) =>
    dayLog.sessions.map((session) => ({
      ...session,
      date: dayLog.date,
      timestamp: new Date(dayLog.date + " " + session.time).getTime(),
    })),
  );

  // Get recent activity - all entries sorted by date/time (most recent first)
  const recentActivity = allSessions.sort((a, b) => b.timestamp - a.timestamp);

  // Get today's sessions for the "Today's Cardio" section
  const getTodaySessions = () => {
    const today = getTodayString(); // YYYY-MM-DD format
    const todayLegacy = new Date().toLocaleDateString("en-US"); // MM/DD/YYYY format

    // Try both date formats to handle legacy data
    let todayLogKey = Object.keys(data.dailyLogs).find(
      (date) => date === today,
    );
    if (!todayLogKey) {
      todayLogKey = Object.keys(data.dailyLogs).find(
        (date) => date === todayLegacy,
      );
    }

    return todayLogKey ? data.dailyLogs[todayLogKey].sessions : [];
  };

  const todaySessions = getTodaySessions();

  const handleAddEntry = () => {
    if (!newEntry.type || (!newEntry.duration && !newEntry.distance)) {
      alert("Please fill in the cardio type and either duration or distance");
      return;
    }

    addCardioEntry(
      newEntry.type,
      parseFloat(newEntry.duration) || 0,
      parseFloat(newEntry.distance) || 0,
      newEntry.notes || undefined,
    );
    resetAddForm();
    setIsAddDialogOpen(false);
  };

  const handleUpdateEntry = () => {
    if (
      !editingEntry ||
      !newEntry.type ||
      (!newEntry.duration && !newEntry.distance)
    ) {
      alert("Please fill in the cardio type and either duration or distance");
      return;
    }

    const updatedEntry: Partial<CardioEntry> = {
      type: newEntry.type,
      duration: parseFloat(newEntry.duration) || 0,
      distance: parseFloat(newEntry.distance) || 0,
      notes: newEntry.notes || undefined,
    };

    // Find the date for this session
    const sessionDate = Object.entries(data.dailyLogs).find(([date, dayLog]) =>
      dayLog.sessions.some((s) => s.id === editingEntry.id),
    )?.[0];

    if (sessionDate) {
      updateCardioSession(sessionDate, editingEntry.id, updatedEntry);
    }
    setEditingEntry(null);
    resetAddForm();
    setIsEditDialogOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm("Are you sure you want to delete this cardio entry?")) {
      // Find which date this entry belongs to
      const entryToDelete = allSessions.find((entry) => entry.id === id);
      if (entryToDelete) {
        deleteCardioSession(entryToDelete.date, id);
      }
    }
  };

  const handleAddCustomType = () => {
    if (!newCustomType.trim()) return;

    addCustomType(newCustomType);
    setNewCustomType("");
    setIsAddCustomTypeOpen(false);
  };

  const handleSetGoal = async () => {
    const targetValue = parseFloat(goalInput);

    if (isNaN(targetValue) || targetValue <= 0) {
      alert("Please enter a valid goal value");
      return;
    }

    await updateGoal({
      type: data.goal.type,
      target: targetValue,
      period: data.goal.period,
    });
    setIsGoalDialogOpen(false);
    alert("Cardio goal saved successfully!");
  };

  // Initialize goal input when dialog opens
  const handleOpenGoalDialog = () => {
    setGoalInput(data.goal.target?.toString() || "");
    setIsGoalDialogOpen(true);
  };

  const formatDuration = (minutes: any) => {
    // Convert to number and clean it
    const num = parseFloat(String(minutes)) || 0;

    // Round to remove floating point precision issues
    const cleanNum = Math.round(num * 100) / 100;

    if (cleanNum < 60) {
      // For numbers like 22.0, show as 22. For 22.5, show as 22.5
      return cleanNum % 1 === 0
        ? `${Math.floor(cleanNum)}min`
        : `${cleanNum}min`;
    }

    const hours = Math.floor(cleanNum / 60);
    const remainingMins = cleanNum % 60;

    if (remainingMins === 0) {
      return `${hours}h`;
    }

    return remainingMins % 1 === 0
      ? `${hours}h ${Math.floor(remainingMins)}min`
      : `${hours}h ${remainingMins}min`;
  };

  // Helper function to convert 24-hour time to 12-hour format for display
  const formatTimeFor12Hour = (timeString: string): string => {
    // If it's already in 12-hour format (contains AM/PM), return as-is
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }

    // If it's in 24-hour format (HH:MM), convert it
    if (timeString.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = timeString.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return timeString; // Return as-is if format is unrecognized
  };

  return (
    <>
      <WellnessPageShell
        title="Cardio"
        accent="var(--wellness-green)"
        onGoal={handleOpenGoalDialog}
      >
        <WellnessProgressHero
          current={todaysValue}
          target={amount(data.goal.target)}
          unit={data.goal.type === "duration" ? "min" : "mi"}
          period={data.goal.period === "week" ? "This calendar week" : "Today"}
          title={
            data.goal.period === "week"
              ? "This Week’s Cardio"
              : "Today’s Cardio"
          }
        />

        <WellnessRecentActivity
          totals={dailyTotals(
            data.goal.type === "duration" ? "cardioDuration" : "cardioDistance",
            data,
          )}
          unit={data.goal.type === "duration" ? "min" : "mi"}
        />
        <WellnessTodaySection title="Weekly activity">
          <p className="text-sm text-muted-foreground">
            {weeklyProgress.totalDuration} min this week ·{" "}
            {
              weekDates().filter(
                (date) =>
                  (dailyTotals("cardioDuration", data)[date] ?? 0) > 0 ||
                  (dailyTotals("cardioDistance", data)[date] ?? 0) > 0,
              ).length
            }{" "}
            active days
          </p>
        </WellnessTodaySection>

        {/* Add Entry Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <WellnessPrimaryAction>Log Cardio</WellnessPrimaryAction>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-surface border-separator text-strong rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center text-strong">
                Add Cardio Entry
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center">
                Log your cardio workout details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-strong">
                  Cardio Type
                </Label>
                <div className="flex space-x-2">
                  <Select
                    value={newEntry.type}
                    onValueChange={(value) =>
                      setNewEntry({ ...newEntry, type: value })
                    }
                  >
                    <SelectTrigger className="flex-1 bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-secondary border-control">
                      {cardioTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog
                    open={isAddCustomTypeOpen}
                    onOpenChange={setIsAddCustomTypeOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="px-3">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-surface border-separator text-strong rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-center text-strong">
                          Add Custom Type
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground text-center">
                          Create a new cardio type
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-strong">
                            Type Name
                          </Label>
                          <Input
                            value={newCustomType}
                            onChange={(e) => setNewCustomType(e.target.value)}
                            aria-label="Type Name"
                            className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleAddCustomType}
                            className="flex-1"
                          >
                            Add Type
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddCustomTypeOpen(false)}
                            className="border-control text-supporting hover:bg-surface-secondary"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-strong">
                    Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    aria-label="Duration (minutes)"
                    value={newEntry.duration}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, duration: e.target.value })
                    }
                    className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-strong">
                    Distance (miles)
                  </Label>
                  <Input
                    type="number"
                    aria-label="Distance (miles)"
                    step="0.1"
                    value={newEntry.distance}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, distance: e.target.value })
                    }
                    className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-strong">
                  Notes - Optional
                </Label>
                <Textarea
                  value={newEntry.notes}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, notes: e.target.value })
                  }
                  className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAddEntry}
                  className="flex-1 bg-action-selected hover:bg-action text-on-action"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Today's Cardio */}

        <WellnessTodaySection title="Today's Cardio">
          <div className="space-y-2">
            {todaySessions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No cardio sessions today yet
              </p>
            )}
            {todaySessions
              .slice()
              .reverse()
              .map((session: CardioSession, index: number) => (
                <div
                  key={session.id}
                  className="wellness-record-row flex flex-wrap gap-2 justify-between items-center text-sm relative"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-muted-foreground">
                      {formatTimeFor12Hour(session.time)}
                    </span>
                    <span className="text-supporting">{session.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-end space-y-1">
                      {session.duration > 0 && (
                        <span className="text-accent-text font-medium text-xs">
                          {formatDuration(session.duration)}
                        </span>
                      )}
                      {session.distance && session.distance > 0 && (
                        <span className="text-feature-blue font-medium text-xs">
                          {session.distance}mi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEntry(session);
                          setNewEntry({
                            type: session.type,
                            duration: session.duration.toString(),
                            distance: session.distance?.toString() || "",
                            notes: session.notes || "",
                          });
                          setIsEditDialogOpen(true);
                        }}
                        className="fc-icon-action text-muted-foreground hover:text-strong p-1 h-auto"
                        aria-label={`Edit ${session.type} session`}
                        data-testid={`button-edit-session-${session.id}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Find which date this entry belongs to
                          const entryToDelete = allSessions.find(
                            (entry) => entry.id === session.id,
                          );
                          if (
                            entryToDelete &&
                            confirm(
                              "Are you sure you want to delete this cardio session?",
                            )
                          ) {
                            deleteCardioSession(entryToDelete.date, session.id);
                          }
                        }}
                        className="fc-icon-action text-muted-foreground hover:text-feature-red-soft p-1 h-auto"
                        aria-label={`Delete ${session.type} session`}
                        data-testid={`button-delete-session-${session.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </WellnessTodaySection>

        {/* Cardio Log - Daily Aggregation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">History</h3>
          <div className="space-y-3">
            {Object.keys(data.dailyLogs).length > 0 ? (
              Object.entries(
                groupLogsByMonth(Object.values(data.dailyLogs)),
              ).map(([monthName, monthLogs]) => (
                <Collapsible
                  key={monthName}
                  open={expandedMonths.has(monthName)}
                  onOpenChange={(isOpen) => {
                    const newExpanded = new Set(expandedMonths);
                    if (isOpen) {
                      newExpanded.add(monthName);
                    } else {
                      newExpanded.delete(monthName);
                    }
                    setExpandedMonths(newExpanded);
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <WellnessHistoryRow
                      month={monthName}
                      count={monthLogs.length}
                      unit="days"
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-2 mt-2">
                    {monthLogs
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((log) => (
                        <div key={log.date} className="fitcircle-card ml-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-strong font-medium">
                              {new Date(
                                log.date + "T00:00:00",
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <div className="flex items-center space-x-2">
                              {log.totalDuration > 0 && (
                                <span className="text-accent-text font-semibold text-sm">
                                  {formatDuration(log.totalDuration)}
                                </span>
                              )}
                              {log.totalDistance > 0 && (
                                <span className="text-feature-blue font-semibold text-sm">
                                  {log.totalDistance.toFixed(1)}mi
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {log.sessions.length} sessions
                          </div>

                          {/* Show detailed sessions for this day */}
                          <div className="space-y-1">
                            {(expandedDays.has(log.date)
                              ? log.sessions
                              : log.sessions.slice(0, 3)
                            ).map((session, index) => (
                              <div
                                key={session.id}
                                className="wellness-record-row flex justify-between items-center text-xs"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-dim">
                                    {formatTimeFor12Hour(session.time)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {session.type}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {session.duration > 0 && (
                                    <span className="text-supporting">
                                      {formatDuration(session.duration)}
                                    </span>
                                  )}
                                  {session.distance && session.distance > 0 && (
                                    <span className="text-supporting">
                                      {session.distance}mi
                                    </span>
                                  )}
                                  <WellnessEntryActions
                                    label="historical cardio session"
                                    onEdit={() => {
                                      setEditingEntry(session);
                                      setNewEntry({
                                        type: session.type,
                                        duration: session.duration.toString(),
                                        distance:
                                          session.distance?.toString() || "",
                                        notes: session.notes || "",
                                      });
                                      setIsEditDialogOpen(true);
                                    }}
                                    onDelete={() => {
                                      if (
                                        confirm("Delete this cardio session?")
                                      )
                                        deleteCardioSession(
                                          log.date,
                                          session.id,
                                        );
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                            {log.sessions.length > 3 && (
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedDays);
                                  if (newExpanded.has(log.date)) {
                                    newExpanded.delete(log.date);
                                  } else {
                                    newExpanded.add(log.date);
                                  }
                                  setExpandedDays(newExpanded);
                                }}
                                className="text-xs text-dim hover:text-supporting text-center mt-1 w-full transition-colors"
                              >
                                {expandedDays.has(log.date)
                                  ? "Show less"
                                  : `+${log.sessions.length - 3} more sessions`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <Card className="fitcircle-card">
                <CardContent className="fc-empty">
                  <div className="text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <p>No cardio activity yet</p>
                    <p className="text-sm">Tap "Log Cardio" to get started!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Entry Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md bg-surface border-separator text-strong rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center text-strong">
                Edit Cardio Entry
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center">
                Update your cardio workout details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-strong">
                  Cardio Type
                </Label>
                <Select
                  value={newEntry.type}
                  onValueChange={(value) =>
                    setNewEntry({ ...newEntry, type: value })
                  }
                >
                  <SelectTrigger className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-secondary border-control">
                    {cardioTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-strong">
                    Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    value={newEntry.duration}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, duration: e.target.value })
                    }
                    className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-strong">
                    Distance (miles)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEntry.distance}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, distance: e.target.value })
                    }
                    className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-strong">
                  Notes - Optional
                </Label>
                <Textarea
                  value={newEntry.notes}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, notes: e.target.value })
                  }
                  className="bg-surface-secondary border-control text-strong placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleUpdateEntry}
                  className="flex-1 bg-action-selected hover:bg-action text-on-action"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Entry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <WellnessHistory
          stats={getHistoricalStats()}
          unit={data.goal.type === "duration" ? "min" : "mi"}
        />
      </WellnessPageShell>

      {/* Simple Goal Setting Modal - Fasting Style */}
      {isGoalDialogOpen && (
        <WellnessGoalSheet
          title="Cardio Goal"
          onDismiss={() => setIsGoalDialogOpen(false)}
        >
          <div className="glass-panel bg-surface rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-strong">Cardio Goal</h3>
              <button
                aria-label="Close"
                onClick={() => setIsGoalDialogOpen(false)}
                className="p-2 text-muted-foreground hover:text-strong hover:bg-surface-secondary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Progress Circle */}
            <div className="flex justify-center mb-8">
              <GoalCircle
                percentage={percentage(todaysValue, Number(goalInput))}
                color="var(--bmi-green)"
                size={120}
                currentValue={todaysValue}
                goalValue={Number(goalInput)}
                unit={data.goal.type === "duration" ? "min" : "mi"}
                title={data.goal.period === "week" ? "This Week" : "Today"}
                description={
                  data.goal.period === "week"
                    ? "Current calendar week"
                    : "Current calendar day"
                }
              />
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={data.goal.period === "day" ? "default" : "outline"}
                onClick={() => updateGoal({ ...data.goal, period: "day" })}
              >
                Daily
              </Button>
              <Button
                variant={data.goal.period === "week" ? "default" : "outline"}
                onClick={() => updateGoal({ ...data.goal, period: "week" })}
              >
                Weekly
              </Button>
            </div>
            {/* Goal Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalTarget" className="text-supporting">
                  {data.goal.period === "week" ? "Weekly" : "Daily"} Goal (
                  {data.goal.type === "duration" ? "minutes" : "miles"})
                </Label>
                <Input
                  id="goalTarget"
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onFocus={() => setGoalInputFocused(true)}
                  onBlur={() => setGoalInputFocused(false)}
                  className="bg-surface-secondary border-control text-strong mt-1"
                  step="0.1"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    if (data.goal.type === "duration") {
                      updateGoal({
                        type: "distance",
                        target: data.goal.target,
                        period: data.goal.period,
                      });
                    } else {
                      updateGoal({
                        type: "duration",
                        target: data.goal.target,
                        period: data.goal.period,
                      });
                    }
                  }}
                  variant="outline"
                  className="flex-1 border-control text-supporting hover:bg-surface-secondary"
                >
                  Switch to{" "}
                  {data.goal.type === "duration" ? "Miles" : "Minutes"}
                </Button>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGoalDialogOpen(false)}
                  className="flex-1 border-control text-supporting hover:bg-surface-secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetGoal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-on-action-soft"
                >
                  Save Goal
                </Button>
              </div>
            </div>
          </div>
        </WellnessGoalSheet>
      )}
    </>
  );
}
