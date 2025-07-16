import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth
} from "date-fns";

export default function CalendarPage() {
  const [, navigate] = useLocation();
  const { getWorkoutArray, getDailyLogs } = useWorkouts();
  const workouts = getWorkoutArray();
  const logs = getDailyLogs();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const isDayComplete = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dayLog = logs[dateStr];
    if (!dayLog) return false;
    return workouts.every(w => dayLog[w.id] >= w.dailyGoal);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="text-slate-400 hover:text-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="w-[42px]" />
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map(date => {
          const isCurrent = isSameMonth(date, currentMonth);
          const complete = isDayComplete(date);

          return (
            <div
              key={date.toISOString()}
              className={`aspect-square rounded-xl flex items-center justify-center relative text-sm font-medium
                ${isCurrent ? "bg-slate-800 text-white" : "bg-slate-700 text-slate-500"} 
                ${complete ? "bg-green-500 text-white shadow-lg shadow-green-500/50" : ""}`}
              style={complete ? {
                backgroundColor: '#00ff41',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.6), 0 0 40px rgba(0, 255, 65, 0.3)',
                color: '#000000',
                fontWeight: 'bold'
              } : {}}
            ></div>
              {format(date, "d")}
              {complete && (
                <CheckCircle className="absolute -top-1 -right-2 text-white opacity-80 w-4 h-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}