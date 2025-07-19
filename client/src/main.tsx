// src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router } from "wouter";

// Completely disable browser swipe navigation
let startX = 0;
let startY = 0;
let isScrollable = false;

document.addEventListener('touchstart', function(e) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isScrollable = false;
}, { passive: false });

document.addEventListener('touchmove', function(e) {
  if (!startX || !startY) return;
  
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  const deltaX = Math.abs(currentX - startX);
  const deltaY = Math.abs(currentY - startY);
  
  // Check if user is trying to scroll vertically within content
  const target = e.target as HTMLElement;
  const scrollableElement = target.closest('[data-scrollable="true"]') || 
                           target.closest('.overflow-y-auto') ||
                           target.closest('.overflow-auto') ||
                           target.closest('.scroll-container');
  
  // Allow vertical scrolling but prevent ALL horizontal swipes
  if (deltaX > deltaY) {
    // This is a horizontal swipe - always prevent it
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }
  
  // For vertical scrolling, only allow if within scrollable content
  if (deltaY > deltaX && scrollableElement) {
    isScrollable = true;
    // Allow vertical scrolling
    return;
  }
  
  // For any significant movement that's not clearly vertical scrolling, prevent it
  if (deltaX > 10 || deltaY > 50) {
    if (!isScrollable) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}, { passive: false });

document.addEventListener('touchend', function(e) {
  startX = 0;
  startY = 0;
  isScrollable = false;
}, { passive: false });

// Additional prevention for gesture navigation
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', function(e) {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', function(e) {
  e.preventDefault();
}, { passive: false });

// Prevent all forms of gesture-based navigation
window.history.pushState(null, '', window.location.href);

window.addEventListener('popstate', function(e) {
  // Always prevent back navigation via gestures
  window.history.pushState(null, '', window.location.href);
});

// Disable overscroll behavior that can trigger navigation
document.body.style.overscrollBehavior = 'none';
document.documentElement.style.overscrollBehavior = 'none';

// Targeted CSS to prevent browser navigation swipes while allowing legitimate scrolling
const antiSwipeStyle = document.createElement('style');
antiSwipeStyle.textContent = `
  html, body {
    touch-action: pan-y pinch-zoom !important;
    -webkit-touch-action: pan-y pinch-zoom !important;
    -ms-touch-action: pan-y pinch-zoom !important;
    overscroll-behavior: none !important;
    overscroll-behavior-x: none !important;
  }
  
  /* Allow horizontal scrolling in specific containers */
  .horizontal-scroll {
    touch-action: pan-x pan-y !important;
    -webkit-touch-action: pan-x pan-y !important;
    overscroll-behavior-x: auto !important;
  }
  
  /* Prevent overscroll on main page containers only */
  .main-container {
    overscroll-behavior: none !important;
    overscroll-behavior-x: none !important;
  }
`;
document.head.appendChild(antiSwipeStyle);

createRoot(document.getElementById("root")!).render(
  <Router>
    <App />
  </Router>
);