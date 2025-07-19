import { Switch, Route } from "wouter";

function SimpleHome() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white flex items-center justify-center">
      <h1 className="text-3xl font-bold">FitCircle - Simple Test</h1>
    </div>
  );
}

function SimpleApp() {
  return (
    <Switch>
      <Route path="/" component={SimpleHome} />
      <Route path="/goals" component={() => <div className="text-white">Goals Test</div>} />
    </Switch>
  );
}

export default SimpleApp;