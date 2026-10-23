import {
  WellnessPageShell,
  WellnessProgressHero,
  WellnessRecentActivity,
  WellnessTodaySection,
  WellnessPrimaryAction,
  WellnessHistoryRow,
  WellnessGoalSheet,
} from "@/components/wellness/WellnessUI";
import { dailyTotals } from "@/lib/wellness-progress";
import { WellnessHistory } from "@/components/WellnessHistory";
import { percentage, amount } from "@/lib/wellness-progress";
import { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2 } from "lucide-react";
import {
  useHydration,
  HydrationLog,
  HydrationEntry,
} from "@/hooks/use-hydration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GoalCircle } from "@/components/GoalCircle";
import { groupLogsByMonth } from "@/lib/date-utils";

export default function HydrationPage() {
  const {
    error,
    dailyGoalOz,
    currentDayOz,
    addHydration,
    editHydrationEntry,
    deleteHydrationEntry,
    setDailyGoal,
    getAllLogs,
    getTodayEntries,
    getHistoricalStats,
  } = useHydration();

  const [addAmount, setAddAmount] = useState("");
  const [selectedLiquidType, setSelectedLiquidType] = useState("Water");
  const [customLiquidType, setCustomLiquidType] = useState("");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoalOz.toString());
  const [isHydrationDialogOpen, setIsHydrationDialogOpen] = useState(false);
  const [customLiquidFocused, setCustomLiquidFocused] = useState(false);
  const [addAmountFocused, setAddAmountFocused] = useState(false);
  const [goalFocused, setGoalFocused] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HydrationEntry | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editLiquidType, setEditLiquidType] = useState("Water");

  const liquidTypes = ["Water", "Coffee", "Tea", "Custom"];

  useEffect(() => setNewGoal(dailyGoalOz.toString()), [dailyGoalOz]);

  const handleAddHydration = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      const liquidType =
        selectedLiquidType === "Custom"
          ? customLiquidType || "Custom"
          : selectedLiquidType;
      if (!addHydration(amount, liquidType)) return;

      // Reset custom input and entered amount after adding
      if (selectedLiquidType === "Custom") {
        setCustomLiquidType("");
      }
      setAddAmount("");
      return true;
    }
    return false;
  };

  const handleQuickAdd = (amount: number) => {
    const liquidType =
      selectedLiquidType === "Custom"
        ? customLiquidType || "Custom"
        : selectedLiquidType;
    if (!addHydration(amount, liquidType)) return false;
    // Reset custom input after adding
    if (selectedLiquidType === "Custom") {
      setCustomLiquidType("");
    }
    return true;
  };

  const handleSetGoal = () => {
    const goal = parseFloat(newGoal);
    if (goal > 0) {
      try {
        setDailyGoal(goal);
      } catch {
        alert("Goal could not be saved. Original records are unchanged.");
        return;
      }
      setIsGoalModalOpen(false);
    }
  };

  const handleEditEntry = (entry: HydrationEntry) => {
    setEditingEntry(entry);
    setEditAmount(entry.amount.toString());
    setEditLiquidType(entry.liquidType);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingEntry || !editAmount || parseFloat(editAmount) <= 0) return;

    if (
      !editHydrationEntry(
        editingEntry.id,
        parseFloat(editAmount),
        editLiquidType,
      )
    )
      return;
    setIsEditDialogOpen(false);
    setEditingEntry(null);
    setEditAmount("");
    setEditLiquidType("Water");
  };

  const handleDeleteEntry = (entry: HydrationEntry) => {
    if (
      confirm(
        `Delete ${entry.amount}oz of ${entry.liquidType} from ${entry.time}?`,
      )
    ) {
      deleteHydrationEntry(entry.id);
    }
  };

  const [quickAddAmounts, setQuickAddAmounts] = useState([8, 16, 24]);
  const recentLogs = getAllLogs();
  const todayEntries = getTodayEntries();
  const monthlyLogs = groupLogsByMonth(
    recentLogs.reduce((acc, log) => ({ ...acc, [log.date]: log }), {}),
  ) as { [monthName: string]: HydrationLog[] };

  return (
    <>
      <WellnessPageShell
        title="Hydration"
        accent="var(--wellness-blue)"
        onGoal={() => setIsGoalModalOpen(true)}
      >
        {error && (
          <p role="alert" className="text-sm text-warning-soft">
            {error}
          </p>
        )}

        <div className="wellness-stack">
          <WellnessProgressHero
            current={currentDayOz}
            target={dailyGoalOz}
            unit="oz"
            period="Today"
            title="Today's Hydration"
          />
          {dailyGoalOz > 128 && (
            <p className="text-sm text-warning-soft">
              High daily goal · review your target in Goal.
            </p>
          )}
          <WellnessRecentActivity
            totals={dailyTotals("hydration", {
              logs: Object.fromEntries(
                recentLogs.map((log) => [log.date, log]),
              ),
            })}
            unit="oz"
          />
          <WellnessTodaySection title="Quick add">
            <div className="wellness-quick-add">
              {quickAddAmounts.map((value, i) => (
                <button
                  key={i}
                  disabled={!amount(value)}
                  onClick={() => addHydration(value, "Water")}
                >
                  +{value} oz
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {currentDayOz} oz today ·{" "}
              {Math.max(0, dailyGoalOz - currentDayOz)} oz remaining
            </p>
          </WellnessTodaySection>

          {/* Add Liquid Button */}
          <div>
            <WellnessPrimaryAction
              onClick={() => setIsHydrationDialogOpen(true)}
            >
              <span>Add Liquid</span>
            </WellnessPrimaryAction>
          </div>

          {/* Today's Entries */}

          <WellnessTodaySection title="Today's Intake">
            <div className="space-y-2">
              {todayEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">No intake today yet</p>
              )}
              {todayEntries
                .slice()
                .reverse()
                .map((entry: HydrationEntry, index: number) => (
                  <div
                    key={entry.id}
                    className="wellness-record-row flex justify-between items-center text-sm relative"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-muted-foreground">{entry.time}</span>
                      <span className="text-supporting">
                        {entry.liquidType || "Water"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-feature-blue font-medium">
                        {entry.amount}oz
                      </span>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit intake"
                          onClick={() => handleEditEntry(entry)}
                          className="text-muted-foreground hover:text-strong p-1 h-auto"
                          data-testid={`button-edit-entry-${entry.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete intake"
                          onClick={() => handleDeleteEntry(entry)}
                          className="text-muted-foreground hover:text-feature-red-soft p-1 h-auto"
                          data-testid={`button-delete-entry-${entry.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </WellnessTodaySection>

          {/* Hydration Log - Monthly Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">History</h3>
            <div className="space-y-3">
              {Object.keys(monthlyLogs).length > 0 ? (
                Object.entries(monthlyLogs).map(([monthName, monthLogs]) => (
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
                      {monthLogs.map((log: HydrationLog) => (
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
                            <span className="text-feature-blue font-semibold">
                              {log.totalOz}oz
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {log.entries.length} entries
                          </div>

                          {/* Show detailed entries for this day */}
                          <div className="space-y-1">
                            {(expandedDays.has(log.date)
                              ? log.entries
                              : log.entries.slice(0, 3)
                            ).map((entry: HydrationEntry, index: number) => (
                              <div
                                key={index}
                                className="wellness-record-row flex justify-between items-center text-xs"
                              >
                                <span className="text-dim">
                                  {entry.time}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-muted-foreground">
                                    {entry.liquidType || "Water"}
                                  </span>
                                  <span className="text-supporting">
                                    {entry.amount}oz
                                  </span>
                                  <button
                                    aria-label="Edit historical intake"
                                    onClick={() => handleEditEntry(entry)}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    aria-label="Delete historical intake"
                                    onClick={() => handleDeleteEntry(entry)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {log.entries.length > 3 && (
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
                                  : `+${log.entries.length - 3} more entries`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))
              ) : (
                <div className="text-center text-dim py-4">
                  No hydration history yet
                </div>
              )}
            </div>
          </div>
        </div>
        <WellnessHistory stats={getHistoricalStats()} unit="oz" />
      </WellnessPageShell>

      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <WellnessGoalSheet
          title="Hydration Goal"
          onDismiss={() => setIsGoalModalOpen(false)}
        >
          <div className="glass-panel bg-surface rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-strong">
                Hydration Goal
              </h3>
              <button
                aria-label="Close"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-2 text-muted-foreground hover:text-strong hover:bg-surface-secondary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Progress Circle */}
            <div className="flex justify-center mb-8">
              <GoalCircle
                percentage={percentage(currentDayOz, Number(newGoal))}
                color="var(--bmi-blue)"
                size={120}
                currentValue={Math.round(currentDayOz)}
                goalValue={Number(newGoal)}
                unit="oz"
                title="Daily Hydration"
                description="Today"
              />
            </div>

            {/* Goal Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal" className="text-supporting">
                  Daily goal (oz)
                </Label>
                <Input
                  id="goal"
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onFocus={() => setGoalFocused(true)}
                  onBlur={() => setGoalFocused(false)}
                  className="bg-surface-secondary border-control text-strong mt-1"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 border-control text-supporting hover:bg-surface-secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetGoal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-on-action-soft"
                >
                  Set Goal
                </Button>
              </div>
            </div>
          </div>
        </WellnessGoalSheet>
      )}

      {/* Add Liquid Dialog */}
      <Dialog
        open={isHydrationDialogOpen}
        onOpenChange={setIsHydrationDialogOpen}
      >
        <DialogContent className="bg-surface border-separator text-strong max-w-sm mx-auto rounded-2xl">
          <DialogTitle className="text-lg font-semibold text-center">
            Add Liquid
          </DialogTitle>
          {error && (
            <p role="alert" className="text-sm text-warning-soft">
              {error}
            </p>
          )}
          <DialogDescription className="sr-only">
            Add liquid consumption to your hydration tracking
          </DialogDescription>
          <div className="space-y-4">
            {/* Liquid Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-supporting">
                Liquid Type
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {liquidTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedLiquidType(type)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                      selectedLiquidType === type
                        ? "bg-blue-600 text-on-action"
                        : "bg-surface-secondary hover:bg-control-strong text-supporting"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Custom Liquid Type Input */}
              {selectedLiquidType === "Custom" && (
                <Input
                  type="text"
                  value={customLiquidType}
                  onChange={(e) => setCustomLiquidType(e.target.value)}
                  onFocus={() => setCustomLiquidFocused(true)}
                  onBlur={() => setCustomLiquidFocused(false)}
                  aria-label="Liquid type"
                  className="bg-surface-secondary border-control text-strong"
                />
              )}
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {quickAddAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (handleQuickAdd(amount)) setIsHydrationDialogOpen(false);
                  }}
                  className="border-control text-supporting hover:bg-surface-secondary"
                >
                  {amount}oz
                </Button>
              ))}
            </div>

            <details className="text-sm text-muted-foreground mt-3">
              <summary className="min-h-11 flex items-center cursor-pointer">
                Customize shortcuts
              </summary>
              <div className="grid grid-cols-3 gap-2">
                {quickAddAmounts.map((value, i) => (
                  <div key={i}>
                    <Label htmlFor={`quick-${i}`}>Amount {i + 1} (oz)</Label>
                    <Input
                      id={`quick-${i}`}
                      type="number"
                      min="1"
                      value={value || ""}
                      onChange={(event) =>
                        setQuickAddAmounts((previous) =>
                          previous.map((old, index) =>
                            index === i ? amount(event.target.value) : old,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </details>
            {/* Custom Amount */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  onFocus={() => setAddAmountFocused(true)}
                  onBlur={() => setAddAmountFocused(false)}
                  aria-label="Amount (oz)"
                  className="bg-surface-secondary border-control text-strong"
                />
              </div>
              <Button
                onClick={() => {
                  if (handleAddHydration()) setIsHydrationDialogOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-on-action"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-surface border-separator text-strong max-w-sm mx-auto rounded-2xl">
          <DialogTitle className="text-lg font-semibold text-center">
            Edit Entry
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit your hydration entry
          </DialogDescription>
          <div className="space-y-4">
            {/* Liquid Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-supporting">
                Liquid Type
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {liquidTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setEditLiquidType(type)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                      editLiquidType === type
                        ? "bg-blue-600 text-on-action"
                        : "bg-surface-secondary hover:bg-control-strong text-supporting"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Custom Liquid Type Input */}
              {editLiquidType === "Custom" && (
                <Input
                  type="text"
                  value={editLiquidType === "Custom" ? editLiquidType : ""}
                  onChange={(e) => setEditLiquidType(e.target.value)}
                  aria-label="Liquid type"
                  className="bg-surface-secondary border-control text-strong"
                />
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-supporting">
                Amount (oz)
              </Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                aria-label="Amount (oz)"
                className="bg-surface-secondary border-control text-strong"
                data-testid="input-edit-amount"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 border-control text-supporting hover:bg-surface-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-on-action"
                data-testid="button-save-edit"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
