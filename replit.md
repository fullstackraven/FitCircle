# FitCircle - Workout Tracker Web App

## Overview
FitCircle is a mobile-friendly workout tracking web application inspired by the "Push-Ups" iOS app. It features a clean, dark-themed interface with large circular counters for tracking various exercises. The app's primary purpose is to provide an intuitive tap-to-increment interface with undo functionality and robust data persistence using localStorage. Key capabilities include comprehensive workout management, daily goal tracking, diverse UI components for progress visualization, and advanced features like energy level tracking, fitness calculators, and an AI trainer. The project aims to offer a complete, client-side driven fitness tracking solution with a strong focus on user experience and data privacy.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks, including a custom `useWorkouts` hook for workout data.
- **Styling**: Tailwind CSS with shadcn/ui for components, featuring a consistent dark theme with bright accent colors.
- **Build Tool**: Vite for fast development and optimized builds.
- **UI/UX Decisions**: Mobile-first approach with large, tappable elements. Features circular progress rings, modal systems, and responsive design for touch-friendly interactions. All UI components utilize a `rounded-xl` styling for a consistent modern appearance.

### Backend
- **Framework**: Express.js with TypeScript (currently minimal, designed for future API expansion)
- **API Structure**: RESTful endpoints with `/api` prefix (prepared for future use).
- **Development**: Hot reloading with Vite middleware integration.

### Data Storage & Persistence
- **Primary Storage**: Local browser localStorage for all workout data persistence, including historical logs, measurements, hydration, meditation, and goals.
- **Database (Future)**: PostgreSQL with Neon serverless driver, configured with Drizzle ORM for potential future user accounts and server-side data.
- **Persistence Strategy**: Automatic localStorage sync on every data change, with structured JSON.
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

### UI and Styling
- **Component Library**: Radix UI primitives.
- **Styling**: Tailwind CSS with CSS variables.

### Backend Dependencies (for future or current minimal use)
- **Database ORM**: Drizzle ORM.
- **Database Driver**: Neon serverless driver for PostgreSQL.

### AI (for AI Trainer feature, currently hidden)
- **Cloud AI**: Claude 4.0 Sonnet (used as foundation).
- **Open-source alternatives (recommended for future cost-free implementation)**: Ollama + Open WebUI, Jan, LlamaGPT.