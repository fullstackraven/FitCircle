import { Switch, Route } from "wouter";
import { useRef, useEffect } from "react";

import Home from "@/pages/home";
import CalendarPage from "@/pages/calendar-new";
import FitnessCalculatorPage from "@/pages/fitness-calculator";
import FoodTrackerPage from "@/pages/food-tracker";
// REMOVED: Bug reporting feature removed per user request
import ProfilePage from "@/pages/profile";
import MeasurementsPage from "@/pages/measurements";
import SettingsPage from "@/pages/settings";
import FastingPage from "@/pages/fasting";
import MeditationPage from "@/pages/meditation";
import HydrationPage from "@/pages/hydration";
import RemindersPage from "@/pages/reminders";
import CardioPage from "@/pages/cardio";
import { WorkoutStatistics } from "@/pages/workout-statistics";
import { DailyJournal } from "@/pages/daily-journal";
import { JournalLog } from "@/pages/journal-log";
import { EnergyLevelPage } from "@/pages/energy-level";
import { SupplementsPage } from "@/pages/supplements";
import RecoveryPage from "@/pages/recovery";
import { DynamicOverview } from "@/pages/dynamic-overview";
import RoutinesPage from "@/pages/routines";
import WellnessPage from "@/pages/wellness";

// import TrainerPage from "@/pages/trainer";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/BottomNavigation";
import { ScrollLockProvider } from "@/contexts/ScrollLockContext";
import { useIOSViewportGuard } from "@/hooks/useIOSViewportGuard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/measurements" component={MeasurementsPage} />
      <Route path="/fasting" component={FastingPage} />
      <Route path="/meditation" component={MeditationPage} />
      <Route path="/hydration" component={HydrationPage} />
      <Route path="/fitness-calculator" component={FitnessCalculatorPage} />
      <Route path="/food-tracker" component={FoodTrackerPage} />
      <Route path="/cardio" component={CardioPage} />
      <Route path="/workout-statistics" component={WorkoutStatistics} />
      <Route path="/daily-journal" component={DailyJournal} />
      <Route path="/journal-log" component={JournalLog} />
      <Route path="/energy-level" component={EnergyLevelPage} />
      <Route path="/supplements-page" component={SupplementsPage} />
      <Route path="/recovery" component={RecoveryPage} />
      <Route path="/dynamic-overview/:date" component={({ params }) => <DynamicOverview selectedDate={params.date} />} />
      <Route path="/routines" component={RoutinesPage} />
      <Route path="/wellness" component={WellnessPage} />
      {/* REMOVED: Bug reporting route removed per user request */}

      <Route path="/reminders" component={RemindersPage} />

      {/* <Route path="/trainer" component={TrainerPage} /> */}
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const { shellKey } = useIOSViewportGuard({
    scrollEl: scrollRef.current,
    dockEl: dockRef.current,
  });

  return (
    <ScrollLockProvider>
      <div key={shellKey} className="app-shell">
        <main ref={scrollRef} className="app-content">
          <Router />
        </main>
        <div ref={dockRef} className="app-dock">
          <BottomNavigation />
        </div>
      </div>
    </ScrollLockProvider>
  );
}

export default App;