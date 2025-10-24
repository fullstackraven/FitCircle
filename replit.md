# FitCircle - Workout Tracker Web App

## Overview
FitCircle is a mobile-friendly, client-side workout tracking web application inspired by the "Push-Ups" iOS app. It provides an intuitive tap-to-increment interface with undo functionality and robust data persistence using localStorage. The app focuses on comprehensive workout management, daily goal tracking, progress visualization, and advanced features like energy level tracking, fitness calculators, and an AI trainer. The project aims to offer a complete, offline-first fitness tracking solution with a strong emphasis on user experience and data privacy. All server calls, auto-backup, and bug reporting features have been removed to ensure 100% client-side operation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: React hooks, including optimized custom hooks with shared utilities.
- **Styling**: Tailwind CSS with streamlined shadcn/ui components (12 active components).
- **Build Tool**: Vite
- **UI/UX Decisions**: Mobile-first design with large, tappable circular elements, modal systems, and responsive design. All UI components use a `rounded-xl` styling.
- **Code Organization**: Centralized utilities in `client/src/lib/` for date functions and localStorage management.
- **PWA Considerations**: Optimized for PWA installation, including robust service worker management for offline capabilities and iOS PWA safe area optimization for seamless mobile experience.

### Backend
- **Framework**: Express.js with TypeScript (minimal, designed for future API expansion)
- **API Structure**: RESTful endpoints with `/api` prefix (prepared for future use).
- **Development**: Hot reloading with Vite middleware integration.

### Data Storage & Persistence
- **Primary Storage**: Local browser localStorage for all workout data, historical logs, measurements, hydration, meditation, goals, and food database.
- **Food Database**: Fully editable 480-item food database stored in localStorage (reduced from 29,766 to eliminate nonsensical items). Includes 465 built-in foods and supports unlimited custom foods.
- **Migration System**: One-time automatic migration from JSON and IndexedDB to localStorage on first load, preserving all existing data.
- **Persistence Strategy**: Automatic localStorage sync on every data change, with structured JSON.
- **Storage Management**: Standardized storage keys and `safeParseJSON` utility for error handling.
- **Backup & Recovery**: Comprehensive localStorage snapshot system for export/import, including full food database with backward compatibility for legacy backups.
- **Database (Future)**: PostgreSQL with Neon serverless driver and Drizzle ORM for potential server-side data.

### Key Features & Design Patterns
- **Workout Management System**: Custom hook manages workout state (ID, name, color, daily goal, log tracking). Supports 10 maximum workouts and 12 predefined colors.
- **Goal System**: Customizable daily goals with SVG-based progress rings for visual tracking (Hydration, Meditation, Fasting, Weight, Body Fat).
- **Daily Tracking**: Automated daily log separation with ISO date keys.
- **Fitness Calculators**: Integrated Calorie, BMI, and Macro Calculators.
- **Wellness Score**: Aggregate score on Goals page based on various metrics.
- **AI Trainer Chatbot**: Intelligent AI trainer (Claude 4.0 Sonnet based, currently hidden) for personalized advice.
- **Energy Level Tracking**: Circular tap interface (1-10 scale) on calendar page with daily logging.
- **Food Tracker**: Macro tracking with real-time data synchronization. Features a localStorage-based food database (480 foods, 98.4% reduced from original 29,766) with full CRUD capabilities - add, edit, delete any food item through the database UI.
- **Quote System**: 46 inspirational quotes with deterministic daily selection.
- **Error Handling**: Comprehensive try-catch blocks and null checks across all localStorage operations and data processing for stability.
- **Code Optimization**: Centralized utilities, standardized storage management, and reduced unused UI components (17 removed).

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.
- **Icons**: Lucide React.
- **Utilities**: Date-fns, clsx.

### UI and Styling
- **Component Library**: Streamlined Radix UI primitives.
- **Active Components**: Button, Input, Label, Dialog, Select, Collapsible, Textarea, Switch, Toast, Card, Separator, Skeleton, Sheet.
- **Styling**: Tailwind CSS with CSS variables.

### Backend Dependencies (for future or minimal use)
- **Database ORM**: Drizzle ORM.
- **Database Driver**: Neon serverless driver for PostgreSQL.

### AI (for AI Trainer feature, currently hidden)
- **Cloud AI**: Claude 4.0 Sonnet (foundation).
- **Open-source alternatives (recommended for future cost-free implementation)**: Ollama + Open WebUI, Jan, LlamaGPT.