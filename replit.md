# Workout Tracker Web App

## Overview

This is a mobile-friendly workout tracking web app inspired by the "Push-Ups" iOS app. It features a clean, dark-themed interface with large circular counters for tracking different exercises. The app uses localStorage for data persistence and provides an intuitive tap-to-increment interface with undo functionality.

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

### Key Architectural Decisions

1. **localStorage over Database**: Chose client-side storage for simplicity and offline functionality, with database prepared for future user accounts
2. **Minimal Backend**: Express server ready for API expansion but core features work entirely client-side
3. **Mobile-First Design**: Optimized for touch interactions with large, easily tappable elements
4. **Component Modularity**: Shadcn/ui components for consistency and maintainability
5. **TypeScript Throughout**: Full type safety across frontend, backend, and shared schemas