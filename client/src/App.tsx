
import { Switch, Route } from "wouter";

import Home from "@/pages/home";
import CalendarPage from "@/pages/calendar";
import FitnessCalculatorPage from "@/pages/fitness-calculator";
import FoodTrackerPage from "@/pages/food-tracker";
// REMOVED: Bug reporting feature removed per user request
import ProfilePage from "@/pages/profile";
import MeasurementsPage from "@/pages/measurements";
import SettingsPage from "@/pages/settings";
import FastingPage from "@/pages/fasting";
import MeditationPage from "@/pages/meditation";
import HydrationPage from "@/pages/hydration";
import GoalsPage from "@/pages/goals";
import RemindersPage from "@/pages/reminders";
import CardioPage from "@/pages/cardio";


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
      <Route path="/fitness-calculator" component={FitnessCalculatorPage} />
      <Route path="/food-tracker" component={FoodTrackerPage} />
      <Route path="/cardio" component={CardioPage} />
      {/* REMOVED: Bug reporting route removed per user request */}

      <Route path="/reminders" component={RemindersPage} />

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
      <FloatingRemindersButton />
    </div>
  );
}

export default App;
