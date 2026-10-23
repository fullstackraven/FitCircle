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

import { startAppearanceController } from "@/lib/appearance";

import { recoverInterruptedRestore } from "@/lib/backup";

recoverInterruptedRestore();
// Light is an internal development preview until every route is converted.
// There is no production URL, storage value or UI control that enables it yet.
startAppearanceController({ allowPreview: import.meta.env.DEV });
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
