import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import SimpleLoadingScreen from "@/components/SimpleLoadingScreen";
import Home from "@/pages/home";
import CalendarPage from "@/pages/calendar";
import ProfilePage from "@/pages/profile";
import MeasurementsPage from "@/pages/measurements";
import SettingsPage from "@/pages/settings";
import FastingPage from "@/pages/fasting";
import MeditationPage from "@/pages/meditation";
import HydrationPage from "@/pages/hydration";
import GoalsPage from "@/pages/goals-simple";
import RemindersPage from "@/pages/reminders";

// import TrainerPage from "@/pages/trainer";
import NotFound from "@/pages/not-found";
import FloatingRemindersButton from "@/components/FloatingRemindersButton";

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
      <Route path="/goals" component={GoalsPage} />
      <Route path="/reminders" component={RemindersPage} />

      {/* <Route path="/trainer" component={TrainerPage} /> */}
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [hasShownLoading, setHasShownLoading] = useState(false);

  useEffect(() => {
    // Check if we've already shown the loading screen in this session
    const hasShown = sessionStorage.getItem('fitcircle_loading_shown');
    if (hasShown) {
      setShowLoading(false);
      setHasShownLoading(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    setShowLoading(false);
    setHasShownLoading(true);
    // Mark that we've shown the loading screen for this session
    sessionStorage.setItem('fitcircle_loading_shown', 'true');
  };

  // Temporarily disable loading screen to fix React hook errors
  // if (showLoading && !hasShownLoading) {
  //   return <SimpleLoadingScreen onComplete={handleLoadingComplete} />;
  // }

  return (
    <div>
      <Router />
      <FloatingRemindersButton />
    </div>
  );
}

export default App;
