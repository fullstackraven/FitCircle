// src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router } from "wouter";

// Disable browser swipe navigation globally
let isScrolling = false;
let startX = 0;
let startY = 0;

document.addEventListener('touchstart', function(e) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isScrolling = false;
}, { passive: false });

document.addEventListener('touchmove', function(e) {
  if (!startX || !startY) return;
  
  const deltaX = Math.abs(e.touches[0].clientX - startX);
  const deltaY = Math.abs(e.touches[0].clientY - startY);
  
  // Determine if this is a horizontal swipe that could trigger navigation
  if (deltaX > deltaY && deltaX > 30) {
    // This is a horizontal swipe, prevent it from triggering browser navigation
    e.preventDefault();
    e.stopPropagation();
  }
}, { passive: false });

document.addEventListener('touchend', function(e) {
  startX = 0;
  startY = 0;
  isScrolling = false;
}, { passive: false });

createRoot(document.getElementById("root")!).render(
  <Router>
    <App />
  </Router>
);