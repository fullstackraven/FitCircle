# FitCircle - Workout Tracker Web App

## Overview
FitCircle is a mobile-friendly workout tracking web application inspired by the "Push-Ups" iOS app. It features a clean, dark-themed interface with large circular counters for tracking various exercises. The app's primary purpose is to provide an intuitive tap-to-increment interface with undo functionality and robust data persistence using localStorage. Key capabilities include comprehensive workout management, daily goal tracking, diverse UI components for progress visualization, and advanced features like energy level tracking, fitness calculators, and an AI trainer. The project aims to offer a complete, client-side driven fitness tracking solution with a strong focus on user experience and data privacy.

**Major Codebase Optimization Completed (Aug 2025):** Achieved zero redundancy with comprehensive refactoring - eliminated duplicate functions, removed 17 unused UI components, standardized localStorage management, and created centralized utility libraries for maximum efficiency.

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