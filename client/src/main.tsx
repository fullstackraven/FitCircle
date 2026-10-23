// src/main.tsx

import { createRoot } from "react-dom/client";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "./index.css";
import "./styles/glass.css";
import "./styles/appearance.css";
import { Router } from "wouter";
import { restorePagesRoute, registerPWA } from "@/lib/pwa";

import { CardioDataBoundary } from "@/components/CardioDataRecovery";
import { WorkoutDataBoundary } from "@/components/WorkoutDataRecovery";

import { initializeAppearance } from "@/lib/appearance";

import { recoverInterruptedRestore } from "@/lib/backup";

recoverInterruptedRestore();
// Reconcile the early bootstrap with recovered storage before App can render.
initializeAppearance();
restorePagesRoute();
registerPWA();

// Recover storage before loading modules that initialize fitness state.
import("./App").then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(
    <WorkoutDataBoundary>
      <CardioDataBoundary>
      <Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <App />
      </Router>
      </CardioDataBoundary>
    </WorkoutDataBoundary>
  );
});
