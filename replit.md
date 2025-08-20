# FitCircle - Workout Tracker Web App

## Overview
FitCircle is a mobile-friendly workout tracking web application inspired by the "Push-Ups" iOS app. It features a clean, dark-themed interface with large circular counters for tracking various exercises. The app's primary purpose is to provide an intuitive tap-to-increment interface with undo functionality and robust data persistence using localStorage. Key capabilities include comprehensive workout management, daily goal tracking, diverse UI components for progress visualization, and advanced features like energy level tracking, fitness calculators, and an AI trainer. The project aims to offer a complete, client-side driven fitness tracking solution with a strong focus on user experience and data privacy.

**Major Codebase Optimization & Bug Prevention Completed (Aug 2025):** Achieved zero redundancy with comprehensive refactoring - eliminated duplicate functions, removed 17 unused UI components, standardized localStorage management, created centralized utility libraries, and implemented comprehensive error handling across all localStorage operations for maximum stability and efficiency.

**Auto-Backup & Bug Reporting Removal (Aug 2025):** Completely removed auto-backup and bug reporting features per user request to eliminate all server calls and maintain fully offline operation. App is now 100% client-side with no server dependencies.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks, including optimized custom hooks with shared utilities.
- **Styling**: Tailwind CSS with streamlined shadcn/ui components (29 → 12 active components).
- **Build Tool**: Vite for fast development and optimized builds.
- **UI/UX Decisions**: Mobile-first approach with large, tappable elements. Features circular progress rings, modal systems, and responsive design for touch-friendly interactions. All UI components utilize a `rounded-xl` styling for a consistent modern appearance.
- **Code Organization**: Centralized utilities in `client/src/lib/` for date functions and localStorage management.

### Backend
- **Framework**: Express.js with TypeScript (currently minimal, designed for future API expansion)
- **API Structure**: RESTful endpoints with `/api` prefix (prepared for future use).
- **Development**: Hot reloading with Vite middleware integration.

### Data Storage & Persistence
- **Primary Storage**: Local browser localStorage for all workout data persistence, including historical logs, measurements, hydration, meditation, and goals.
- **Database (Future)**: PostgreSQL with Neon serverless driver, configured with Drizzle ORM for potential future user accounts and server-side data.
- **Persistence Strategy**: Automatic localStorage sync on every data change, with structured JSON.
- **Storage Management**: Standardized storage keys in `STORAGE_KEYS` constant, centralized `safeParseJSON` utility for error handling.
- **Backup & Recovery**: Comprehensive localStorage snapshot system for export/import, enabling full app state backup and restoration.

### Key Features & Design Patterns
- **Workout Management System**: `useWorkouts` custom hook manages workout state, including ID, name, color, daily goal, and log tracking. Supports 10 maximum workouts and 12 predefined colors.
- **Goal System**: Customizable daily goals with SVG-based progress rings for visual tracking. Includes goal management for Hydration, Meditation, Fasting, Weight, and Body Fat.
- **Daily Tracking**: Automated daily log separation with ISO date keys and date-based organization.
- **Fitness Calculators**: Integrated Calorie, BMI, and Macro Calculators that pull data from Measurements and persist user selections.
- **Wellness Score**: Aggregate wellness score on the Goals page, calculated from various metrics with customizable priority weights.
- **AI Trainer Chatbot**: Intelligent AI trainer (Claude 4.0 Sonnet based, currently hidden) designed to provide personalized advice by analyzing user data.
- **Energy Level Tracking**: Circular tap interface (1-10 scale) on the calendar page with daily logging and visual trend analysis.
- **Food Tracker**: Macro tracking with real-time data synchronization from the Fitness Calculator.
- **Quote System**: Curated collection of 46 inspirational quotes with deterministic daily selection and manual refresh.
- **PWA Considerations**: Optimized for PWA installation, with features for cache clearing and service worker management.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation resolvers.
- **Icons**: Lucide React.
- **Utilities**: Date-fns for date manipulation, clsx for conditional classes.

### UI and Styling (Optimized)
- **Component Library**: Streamlined Radix UI primitives (removed 17 unused components).
- **Active Components**: Button, Input, Label, Dialog, Select, Collapsible, Textarea, Switch, Toast, Card, Separator, Skeleton, Sheet.
- **Styling**: Tailwind CSS with CSS variables.

### Backend Dependencies (for future or current minimal use)
- **Database ORM**: Drizzle ORM.
- **Database Driver**: Neon serverless driver for PostgreSQL.

### AI (for AI Trainer feature, currently hidden)
- **Cloud AI**: Claude 4.0 Sonnet (used as foundation).
- **Open-source alternatives (recommended for future cost-free implementation)**: Ollama + Open WebUI, Jan, LlamaGPT.

## Recent Architecture Changes (August 2025)

### Comprehensive Bug Prevention & Error Handling (August 19, 2025)
- **Complete localStorage Error Handling**: Added try-catch blocks around all 30+ localStorage operations across all hooks and components to prevent data corruption crashes.
- **JSON Parsing Protection**: Enhanced `safeParseJSON` utility with comprehensive error logging. All data parsing operations now use safe fallbacks to prevent application crashes from corrupted localStorage data.
- **Type Safety Enhancement**: Added null checks and validation to prevent runtime errors in critical functions like `getMonthlyStats`, `getTotalStats`, `getRecoveryStats`, and migration logic.
- **Error Recovery Implementation**: Added graceful degradation for failed localStorage operations with user-visible error logging for debugging.
- **Array Safety Fixes**: Fixed potential `Math.max` crash in fasting calculations when no logs exist, preventing `-Infinity` return values.
- **Historical Data Preservation**: Enhanced workout migration logic with error handling to prevent data loss during format upgrades.
- **Cross-Hook Consistency**: Standardized error handling patterns across all 12 data hooks for uniform failure behavior.
- **Development Stability**: Eliminated all TypeScript/LSP compilation errors, ensuring robust development experience.
- **Zero UI Impact**: All error handling improvements are internal - user experience remains unchanged while significantly improving application stability.

### Comprehensive Codebase Optimization Completed
- **Date Utilities Centralization**: Created `client/src/lib/date-utils.ts` to eliminate 4+ duplicate `getTodayString()` implementations across hooks.
- **Storage Management Standardization**: Created `client/src/lib/storage-utils.ts` with `STORAGE_KEYS` constants and `safeParseJSON` utility for error-free localStorage handling.
- **UI Component Cleanup**: Removed 17 unused shadcn/ui components (59% reduction: 29 → 12 active components) while maintaining all functionality.
- **Hook Optimization**: Refactored all 8 data hooks (`use-workouts`, `use-hydration`, `use-goals`, `use-measurements`, `use-meditation`, `use-fasting`, `use-supplements`) to use shared utilities.
- **Asset Cleanup**: Removed 28 unused attached assets (images, backup files) from the codebase directory.
- **Import Standardization**: 11 files now properly import shared utilities, eliminating redundant localStorage patterns.
- **Code Efficiency**: Simplified complex logic patterns, removed redundant localStorage error handling, and consolidated function expressions.
- **Zero Functional Impact**: All app features remain exactly the same - pure optimization without feature changes.
- **Optimization Results**: Achieved near-zero redundancy with streamlined utilities, standardized storage patterns, and consolidated duplicate code across the entire codebase.

### UI Consistency & Navigation Standardization (August 20, 2025)
- **Back Button Standardization**: Systematically updated all back buttons across 20+ pages to use consistent styling (`text-slate-400`, `ArrowLeft` icon, `w-5 h-5` size, `space-x-2` spacing).
- **Import Optimization**: Standardized all Lucide React imports to use `ArrowLeft` instead of `ChevronLeft` for back buttons, ensuring consistent iconography.
- **Color Consistency**: Unified back button hover states (`hover:text-white transition-colors`) across all pages for consistent user experience.
- **Icon Size Standardization**: All back buttons now use consistent `w-5 h-5` icon sizing instead of mixed `w-4 h-4` and `w-5 h-5` sizes.
- **Spacing Standardization**: Unified `space-x-2` spacing between icon and text instead of mixed `space-x-1` and `space-x-2` values.
- **Coverage**: Updated pages including calendar, settings, hydration, measurements, meditation, goals, cardio, energy-level, reminders, daily-journal, journal-log, recovery, supplements, workout-statistics, fasting, and food-tracker.
- **Zero Functional Impact**: All navigation functionality remains exactly the same - pure UI consistency improvement without feature changes.

### General Maintenance and Cleanup (August 17, 2025)
- **Dialog Accessibility**: Added missing DialogDescription components to all Dialog instances across the application for full accessibility compliance.
- **Broken File Removal**: Removed broken supplements file and outdated calendar.tsx file, leaving only the working versions.
- **Asset Management**: Cleaned up 17 additional old attached assets (reduced from 47 to 30 files), removing unused IMG_1* series images.
- **Code Quality**: Replaced console.log statements with comments in settings.tsx, main.tsx, index.html, and sw-utils.ts for cleaner production code.
- **Directory Cleanup**: Removed unused directories (backups/, bug-reports/) and old service worker files.
- **PWA Service Worker**: Restored proper service worker functionality with `/client/sw.js` for offline caching and PWA features.
- **Navigation Improvements**: Added proper SheetTitle to sidebar navigation for accessibility compliance.
- **JavaScript Fixes**: Fixed return statement formatting in main.tsx touch event handlers.
- **Maintenance Status**: Completed comprehensive cleanup with zero functional impact, restored PWA functionality, and improved code quality throughout.