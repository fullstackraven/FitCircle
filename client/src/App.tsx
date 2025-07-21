// import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
// import LoadingScreen from "@/components/LoadingScreen";
import Home from "@/pages/home";
import CalendarPage from "@/pages/calendar";
import ProfilePage from "@/pages/profile";
import MeasurementsPage from "@/pages/measurements";
import SettingsPage from "@/pages/settings";
import FastingPage from "@/pages/fasting";
import MeditationPage from "@/pages/meditation";
import HydrationPage from "@/pages/hydration";
import GoalsPage from "@/pages/goals";
// import TrainerPage from "@/pages/trainer";
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
      <Route path="/goals" component={GoalsPage} />
      {/* <Route path="/trainer" component={TrainerPage} /> */}
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div>
      <Router />
    </div>
  );
}

export default App;
