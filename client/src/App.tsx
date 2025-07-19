import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import CalendarPage from "@/pages/calendar";
import ProfilePage from "@/pages/profile";
import MeasurementsPage from "@/pages/measurements";
import SettingsPage from "@/pages/settings";
import FastingPage from "@/pages/fasting";
import MeditationPage from "@/pages/meditation";
import HydrationPage from "@/pages/hydration";
import TestGoals from "@/test-goals";
import NotFound from "@/pages/not-found";

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
      <Route path="/goals" component={TestGoals} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div>
      <Toaster />
      <Router />
    </div>
  );
}

export default App;
