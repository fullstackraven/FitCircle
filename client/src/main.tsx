// src/main.tsx

import { createRoot } from "react-dom/client";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "./index.css";
import "./styles/glass.css";
import { Router } from "wouter";
import { restorePagesRoute, registerPWA } from "@/lib/pwa";

import { recoverInterruptedRestore } from "@/lib/backup";

recoverInterruptedRestore();
restorePagesRoute();
registerPWA();

// Recover storage before loading modules that initialize fitness state.
import("./App").then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(
    <Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <App />
    </Router>
  );
});
