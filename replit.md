# FitCircle - Workout Tracker Web App

## Overview

FitCircle is a mobile-friendly workout tracking web app inspired by the "Push-Ups" iOS app. It features a clean, dark-themed interface with large circular counters for tracking different exercises. The app uses localStorage for data persistence and provides an intuitive tap-to-increment interface with undo functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks with custom workout management hook
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: RESTful endpoints with `/api` prefix
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Management**: Prepared for connect-pg-simple sessions
- **Development**: Hot reloading with Vite middleware integration

### Data Storage Solutions
- **Primary Storage**: Local browser localStorage for workout data persistence
- **Database**: PostgreSQL with Neon serverless driver (configured for future use)
- **Schema**: Workout and workout log tables defined with Drizzle ORM
- **Current Implementation**: localStorage-based for simplicity and immediate functionality

## Key Components

### Workout Management System
- **Custom Hook**: `useWorkouts` handles all workout state management
- **Data Structure**: Workouts stored with ID, name, color, daily goal, and daily log tracking
- **Goal System**: Each workout has a customizable daily goal with visual progress tracking
- **Persistence**: Automatic localStorage sync on every data change
- **Color System**: 8 predefined workout colors (green, blue, purple, amber, red, pink, cyan, lime)

### UI Components
- **Progress Circles**: Large, tappable workout tracking buttons with animated progress rings
- **Goal Visualization**: SVG-based progress rings that fill as users approach their daily goals
- **Modal System**: Add/edit workout modal with name, goal, and color selection
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Dark Theme**: Default dark background with bright colored accent elements

### State Management
- **Workout State**: Managed through useWorkouts hook with automatic persistence
- **UI State**: Local component state for modals, animations, and user interactions
- **Date Tracking**: Automatic daily log separation with ISO date keys

## Data Flow

1. **App Initialization**: Load saved workout data from localStorage on mount
2. **User Interaction**: Tap workout circle → increment count → update state → save to localStorage
3. **Data Persistence**: All changes immediately synced to localStorage with structured JSON
4. **Daily Tracking**: Workouts automatically tracked per day with date-based organization
5. **Undo Operations**: Decrement functionality with immediate state updates

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **State Management**: TanStack React Query for future API integration
- **Form Handling**: React Hook Form with Zod validation resolvers

### UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Icons**: Lucide React for consistent iconography
- **Animations**: Class Variance Authority for component variants

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL and Neon serverless driver
- **Utilities**: Date-fns for date manipulation, clsx for conditional classes

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: Express server with TypeScript compilation via tsx
- **Database**: Environment-based DATABASE_URL configuration

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: esbuild compilation to ESM format
- **Static Assets**: Served from Express with proper routing fallbacks
- **Environment**: NODE_ENV-based configuration switching

### Build Commands
- `npm run dev`: Development mode with hot reloading
- `npm run build`: Production build (frontend + backend)
- `npm run start`: Production server startup
- `npm run db:push`: Database schema updates via Drizzle

### Static Deployment
- **Static Build**: `npx vite build --config vite.config.static.ts`
- **Output Directory**: `dist/` (ready for static hosting)
- **Configuration**: Uses `vite.config.static.ts` for static-only builds
- **Dependencies**: Removed React Query client - app works purely with localStorage
- **Deployment Target**: Set to static in Replit deployment configuration

### Recent Changes
- **Erase All Data Feature (July 24, 2025)**: Added comprehensive data deletion feature to Settings page with red warning styling, two-step confirmation dialog, and complete localStorage clearing functionality. Includes safety messaging recommending backup creation before data erasure.
- **Goals Page Complete Restoration (July 24, 2025)**: Successfully fixed persistent JavaScript syntax errors preventing Goals page navigation by rebuilding the page using the proven GoalCircle component pattern from working page modals. Identified that individual page goal modals worked perfectly while main Goals page failed, so replicated the exact working code structure. Fixed data retrieval to match user's localStorage backup structure (fitcircle_weight, fitcircle_body_fat, workout-tracker-data). Now displays all six goal categories (hydration, meditation, fasting, weight, body fat, workouts) with goal values centered in progress rings, small percentages below, edit buttons in top-right corners, and proper Wellness Score calculation showing overall wellness number only.

- **Delete Functionality**: Added trash can icon next to undo button for workout deletion
- **Icon-Based Controls**: Replaced text "UNDO" button with backward arrow (Undo2) icon
- **Expanded Color System**: Added 4 new colors (orange, indigo, emerald, yellow) for 12 total colors
- **Color Selection Freedom**: All 12 colors available for every workout creation (no longer filters used colors)
- **Workout Limit**: Confirmed 10 maximum workouts (increased from previous 7-workout constraint)
- **Complete Data Cleanup**: Delete function removes workout and all historical log data
- **Static Deployment Ready**: Converted app for static deployment by removing backend dependencies
- **Tailwind CSS Fix**: Fixed dark mode configuration for build compatibility
- **Single Theme**: Removed all dark/light mode functionality, using consistent "hsl(222, 47%, 11%)" background
- **Hamburger Menu**: Added hamburger menu icon to home page for easy dashboard access
- **Left/Right Measurements**: Added separate fields for left and right measurements (biceps, forearms, thighs, calves)
- **Measurements Icon**: Changed from scale to human body icon (User) in dashboard
- **Intermittent Fasting**: Added complete intermittent fasting log feature with duration tracking and heat bar visualization
- **Meditation Feature**: Added meditation timer with circular progress indicator, pause/resume functionality, meditation session logging, and gong sound effect on completion
- **Data Import/Export**: Added CSV import functionality to restore data from previous exports, creating a complete backup and recovery system
- **Hydration Tracking**: Added comprehensive hydration tracker with daily goals, progress visualization, and logging
- **Goals Management**: Created centralized goals page with progress bars for hydration, meditation, fasting, and weight goals
- **Enhanced Measurements**: Updated measurements page with trend tracking and horizontal scrolling line graphs for time-series data
- **Complete Export System**: Updated data export to include all new hydration, goals, and measurement history data
- **Dashboard Navigation Fix**: Added URL parameter tracking for dashboard navigation - back buttons now return to dashboard instead of home page when accessed via hamburger menu
- **Complete Swipe Prevention**: Implemented comprehensive touch event prevention in main.tsx to completely disable all horizontal swipe navigation, including history-based navigation, gesture events, and overscroll behaviors
- **Liquid Type Selection**: Enhanced hydration tracking with liquid type selection (Water, Coffee, Tea, Custom) with custom input field for personalized entries
- **Enhanced Hydration Export**: Upgraded CSV export to include liquid types in structured format with dedicated columns for better data analysis
- **Improved Auto-Backup**: Fixed auto-backup scheduling with better persistence, status display, and daily 11:59pm trigger reliability
- **Data Migration**: Added automatic migration for existing hydration entries to include liquid type (defaults to "Water" for legacy data)
- **Complete Rounded Corner Implementation**: Updated all UI components throughout the entire app to use rounded-xl styling instead of sharp edges - includes all boxes, graphs, buttons, containers, modals, and form elements for consistent modern appearance (January 2025)
- **Controls Section**: Added comprehensive Controls section in Settings with toggle switches to hide/show Quote of the Day, Today's Totals, and Recent Activity sections on home page - includes real-time localStorage persistence and conditional rendering
- **AI Trainer Chatbot**: Implemented intelligent AI trainer accessible via dashboard that analyzes user data and provides personalized fitness advice, nutrition recommendations, training modifications, and goal-setting guidance using Claude 4.0 Sonnet (currently hidden via comments - can be re-enabled by uncommenting relevant sections in home.tsx, App.tsx, and routes.ts)
- **PWA Cache Clearing Solution**: Fixed persistent PWA caching issues by completely removing loading screen conflicts, enhancing Force App Update with comprehensive cache clearing, service worker unregistration, and deployment URL redirection with data backup/restoration
- **Enhanced CSV Import**: Upgraded CSV import parser to handle both localStorage key-value format and structured workout data exports, automatically detecting format and converting data appropriately for seamless data recovery
- **localStorage Snapshot Backup System**: Replaced CSV import with complete localStorage snapshot system - exports entire localStorage as JSON file and restores complete app state, providing perfect data migration between devices
- **JSON Auto Backup**: Updated auto backup functionality to work with new JSON localStorage snapshot format, maintaining daily 11:59pm automatic backups
- **Restored Controls Section**: Re-implemented Controls section in Settings with toggle switches for hiding Quote of the Day, Today's Totals, and Recent Activity sections on home page
- **Energy Level Tracking**: Added comprehensive energy level feature to calendar page with circular tap interface (1-10 scale), daily logging, purple dot indicators on calendar days, and integration with journal entries for complete daily tracking
- **Machine Learning Wellness Predictions**: Implemented comprehensive ML-based trend prediction system that analyzes historical data (workouts, energy, hydration, meditation, fasting, weight, measurements) using linear regression algorithms to predict 7-day and 30-day trends with confidence scores, overall wellness scoring, personalized recommendations, and accessible dashboard navigation
- **Wellness Score Integration**: Removed standalone Wellness Predictions page and integrated as weighted wellness score section within Goals page. Features large circular progress ring showing aggregate score out of 100, customizable priority weights (default: Workout Consistency 40%, Target Body Fat 20%, others 10%), and user-editable priorities dialog with localStorage persistence.
- **Major Codebase Refactor (July 2025)**: Completed comprehensive cleanup removing 12+ redundant files including duplicate wellness prediction files, broken settings files, old measurement components, and unused LoadingScreen components while preserving all functionality including AI trainer code (hidden but intact)
- **Critical Bug Fixes**: Fixed energy level undo button to properly stop at 0 instead of cycling back to 10, and resolved workout reset detection bug ensuring "Goals Hit Total" percentage correctly updates when daily workouts reset at midnight
- **Energy Level Trend Visualization**: Added creative 14-day wave chart in calendar dropdown featuring gradient-filled SVG visualization, mini statistics (average energy, days logged, today's level), smart trend indicators with color-coded status (trending up/down/stable), and purple-themed design matching energy feature aesthetics
- **Timezone Fix for Backups**: Fixed backup file naming to use local timezone instead of UTC, ensuring backup files are correctly dated according to user's local time zone rather than showing next day when created in evening hours
- **Enhanced Auto Backup System**: Added ability to view and download previous auto backups from last 7 days, with automatic cleanup of old backups and localStorage storage for later access
- **Floating Reminders Feature**: Added Apple Reminders-style page accessible via persistent floating gray button in bottom-right corner of all pages. Features clean reminder list interface with circular checkboxes, inline editing, hover controls, and blue accent colors matching iOS design. Includes localStorage persistence and automatic backup integration
- **Enhanced Goal Modals with Progress Visualization**: Upgraded goal setting buttons in Measurements, Hydration, Fasting, and Meditation pages to display goal completion circles alongside editing forms. Each modal now shows current progress vs target goals with color-coded circular progress indicators, providing users immediate visual feedback on their goal achievement status directly within the page-specific goal interface (January 27, 2025)
- **Body Fat Goal Calculation Fix**: Fixed body fat percentage goal circle to properly handle null values when no body fat measurements exist yet, ensuring accurate progress visualization
- **Fasting Goal Color Consistency**: Updated fasting goal ring color to amber (rgb(245, 158, 11)) to match the color scheme used in the main Goals page for consistent visual branding
- **Apple Authentication Fix (July 2025)**: Resolved Apple Sign In authentication errors by replacing Apple ID dependency with device-based secure backup system. Fixed "Sign Up Not Completed" errors by implementing local device fingerprinting for encryption keys instead of requiring Apple Developer credentials. Updated all UI components and maintained full AES-256 encryption functionality with device-specific authentication.
- **Auto Backup Removal (July 2025)**: Completely removed Auto Backup functionality and section from Settings page due to iOS compatibility issues. iOS does not allow automatic file downloads to specific paths in Files app, making the feature unreliable for mobile users. Users now rely solely on the manual Complete Data Backup section which provides on-demand JSON export functionality that works consistently across all platforms.

### Data Persistence and iOS Considerations

**localStorage Reliability**: Your data is stored in the browser's localStorage, which is generally persistent across phone restarts and app updates. However, there are some iOS-specific considerations:

- **iOS Updates**: Major iOS updates typically preserve localStorage data, but it's not 100% guaranteed
- **Phone Restarts**: Regular restarts should not affect your data
- **Storage Pressure**: If your device runs very low on storage, iOS may clear browser data including localStorage
- **PWA Installation**: Installing the app as a PWA (Add to Home Screen) provides better data persistence than using it in Safari

**PWA Caching Considerations**: When using the app as a PWA, changes may not appear immediately due to service worker caching:

- **New Features**: After app updates, new features may not appear until cache is cleared
- **Cache Clearing**: Use the "Force App Update" button in Settings to clear all caches and refresh the app
- **Service Worker**: PWA caches HTML/CSS/JS files for offline use, which can delay showing new features
- **Manual Refresh**: Force-refresh by closing the PWA completely and reopening it

**Backup and Recovery Features**: 
- **Export Data**: Create CSV backups of all your data (workouts, measurements, fasting logs, meditation sessions)
- **Import Data**: Restore data from previously exported CSV files
- **Data Included**: Profile information, body measurements, workout history, intermittent fasting logs, meditation session logs

### Key Architectural Decisions

1. **localStorage over Database**: Chose client-side storage for simplicity and offline functionality, with database prepared for future user accounts
2. **Minimal Backend**: Express server ready for API expansion but core features work entirely client-side
3. **Mobile-First Design**: Optimized for touch interactions with large, easily tappable elements
4. **Component Modularity**: Shadcn/ui components for consistency and maintainability
5. **TypeScript Throughout**: Full type safety across frontend, backend, and shared schemas

## Cost-Free AI Trainer Alternatives (Future Implementation)

For when you want to re-enable AI trainer functionality without API costs, here are researched open-source alternatives:

### **Top Recommendations**:

1. **Ollama + Open WebUI** (Most Popular)
   - Local LLM runner with ChatGPT-like interface
   - Models: Llama 3.1, Mistral, Code Llama, Gemma
   - Setup: Docker deployment or native install
   - Hardware: Works on CPU (slow) or GPU (fast)

2. **Jan** (Best for Desktop)
   - 100% offline ChatGPT desktop app
   - Models: Llama 3, Gemma, Mistral
   - Easy setup for non-technical users

3. **LlamaGPT** (Fully Offline)
   - Self-hosted, privacy-first ChatGPT clone
   - One-click Docker install
   - All data stays on device

### **Integration Strategy**:
- Replace Anthropic API calls with local Ollama API endpoints
- Modify trainer route to call localhost:11434 instead of Claude API
- Same conversation interface, just different backend
- Estimated setup cost: $300-800 for GPU hardware vs $20/month API fees

### **Hardware Requirements**:
- **Minimal**: 8GB+ RAM, CPU-only (30-60s response)
- **Optimal**: 16GB+ RAM, RTX 3060+ GPU (1-3s response)