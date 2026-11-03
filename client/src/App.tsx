import { FormOwner, useFormStore, closeForm } from '@/components/forms/FormNavigation';
import { WidgetSettings } from '@/components/dashboard-widgets/WidgetSettings';
import { PWAUpdateNotice } from '@/components/PWAUpdateNotice';
import { FoodNotifications } from "@/components/FoodNotifications";
import { HeaderHostContext } from "@/components/AppHeader";
import { Switch, Route, useLocation } from "wouter";
import { useRef, useState, useEffect, useLayoutEffect } from "react";

import Home from "@/pages/home";
import CalendarPage from "@/pages/calendar-new";
import FoodTrackerPage from "@/pages/food-tracker";
import FoodDatabasePage from "@/pages/food-database";
import RestoreCustomFoodsPage from "@/pages/restore-custom-foods";
// REMOVED: Bug reporting feature removed per user request
import ProfilePage from "@/pages/profile";
import MeasurementsPage from "@/pages/measurements";
import FitnessCalculator from "@/pages/fitness-calculator";
import SettingsPage from "@/pages/settings";
import SharePage from "@/pages/share";
import AboutPage from "@/pages/about";
import ReleaseHistoryPage from "@/pages/release-history";
import { LegalPage, LicensesPage } from "@/pages/legal";
import FastingPage from "@/pages/fasting";
import MeditationPage from "@/pages/meditation";
import HydrationPage from "@/pages/hydration";
import RemindersPage from "@/pages/reminders";
import CardioPage from "@/pages/cardio";
import { WorkoutStatistics } from "@/pages/workout-statistics";
import { DailyJournal } from "@/pages/daily-journal";
import { JournalEntryPage } from "@/pages/journal-entry";
import { JournalLog } from "@/pages/journal-log";
import { EnergyLevelPage } from "@/pages/energy-level";
import { SupplementsPage } from "@/pages/supplements";
import RecoveryPage from "@/pages/recovery";
import { DynamicOverview } from "@/pages/dynamic-overview";
import RoutinesPage from "@/pages/routines";
import WellnessPage from "@/pages/wellness";

import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/BottomNavigation";
import { ScrollLockProvider } from "@/contexts/ScrollLockContext";
import { useIOSViewportGuard } from "@/hooks/useIOSViewportGuard";

function WidgetsPage() { const store=useFormStore(); return <WidgetSettings formId="widgets" isOpen onClose={()=>closeForm(store)}/>; }
function Router() {
  return (
    <Switch>
      <Route path={/^\/(?:workouts\/(?:new|edit))?$/}><FormOwner owner="home"><Home/></FormOwner></Route>
      <Route path="/calendar" component={CalendarPage} />
      <Route path={/^\/profile(?:\/.*)?$/}><FormOwner owner="profile"><ProfilePage/></FormOwner></Route>
      <Route path="/measurements" component={MeasurementsPage} />
      <Route path="/fitness-calculator"><FitnessCalculator /></Route>
      <Route path={/^\/fasting(?:\/.*)?$/}><FormOwner owner="fasting"><FastingPage/></FormOwner></Route>
      <Route path={/^\/meditation(?:\/.*)?$/}><FormOwner owner="meditation"><MeditationPage/></FormOwner></Route>
      <Route path={/^\/hydration(?:\/.*)?$/}><FormOwner owner="hydration"><HydrationPage/></FormOwner></Route>
      <Route path={/^\/food-tracker(?:\/.*)?$/}><FormOwner owner="food-tracker"><FoodTrackerPage/></FormOwner></Route>
      <Route path={/^\/food-database(?:\/.*)?$/}><FormOwner owner="food-database"><FoodDatabasePage/></FormOwner></Route>
      <Route path="/restore-custom-foods" component={RestoreCustomFoodsPage} />
      <Route path={/^\/cardio(?:\/.*)?$/}><FormOwner owner="cardio"><CardioPage/></FormOwner></Route>
      <Route path="/workout-statistics" component={WorkoutStatistics} />
      <Route path="/daily-journal" component={DailyJournal} />
      <Route path="/journal-log" component={JournalLog} />
      <Route path="/journal-entry" component={JournalEntryPage} />
      <Route path="/energy-level" component={EnergyLevelPage} />
      <Route path={/^\/supplements-page(?:\/.*)?$/}><FormOwner owner="supplements-page"><SupplementsPage/></FormOwner></Route>
      <Route path="/recovery" component={RecoveryPage} />
      <Route path={/^\/dynamic-overview\/([^/]+)(?:\/.*)?$/}>{params => <FormOwner owner="overview"><DynamicOverview selectedDate={params[0] ?? ""}/></FormOwner>}</Route>
      <Route path={/^\/routines(?:\/.*)?$/}><FormOwner owner="routines"><RoutinesPage/></FormOwner></Route>
      <Route path="/wellness" component={WellnessPage} />
      <Route path="/widgets/settings"><FormOwner owner="widgets"><WidgetsPage/></FormOwner></Route>
      {/* REMOVED: Bug reporting route removed per user request */}

      <Route path="/reminders" component={RemindersPage} />

      <Route path="/account-data"><SettingsPage section="account" /></Route>
      <Route path="/display"><SettingsPage section="display" /></Route>
      <Route path="/share" component={SharePage} />
      <Route path="/about/terms"><LegalPage kind="terms" /></Route>
      <Route path="/about/privacy"><LegalPage kind="privacy" /></Route>
      <Route path="/about/licenses" component={LicensesPage} />
      <Route path="/about/releases" component={ReleaseHistoryPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/settings"><SettingsPage /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [headerHost, setHeaderHost] = useState<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();

  useIOSViewportGuard();

  useLayoutEffect(() => {
    const dock = dockRef.current!;
    const measure = () => document.documentElement.style.setProperty('--dock-height', `${dock.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(dock);
    measure();
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--dock-height'); };
  }, []);

  // Auto-scroll to top on route change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <ScrollLockProvider>
      <FoodNotifications />
      <HeaderHostContext.Provider value={headerHost}>
        <div className="app-shell">
          <div ref={setHeaderHost} className="app-header" />
          <main ref={scrollRef} className="app-content">
            <div className="app-page">
              <PWAUpdateNotice />
              <Router />
            </div>
          </main>
          <div ref={dockRef} className="app-dock">
            <BottomNavigation />
          </div>
        </div>
      </HeaderHostContext.Provider>
    </ScrollLockProvider>
  );
}

export default App;