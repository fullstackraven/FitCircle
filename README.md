# FitCircle - Mobile-First Fitness & Wellness Tracker

A comprehensive, fully offline fitness and wellness tracking Progressive Web App inspired by iOS design principles. FitCircle provides an intuitive, touch-optimized interface for managing workouts, health metrics, and wellness goals with complete data privacy.

## ✨ Current Features

### 🏋️‍♂️ Workout Management
- **Custom Workouts**: Create up to 10 personalized workouts with custom names, colors, and daily goals
- **Smart Scheduling**: Set specific days of the week for each workout with automatic filtering
- **Progress Circles**: Large (100px), tappable workout counters with animated progress rings
- **Weight Tracking**: Optional weight logging per workout for strength training
- **Daily Goals**: Flexible daily targets that maintain historical accuracy when changed
- **Workout Statistics**: Comprehensive analytics showing monthly and all-time performance

### 🏃‍♂️ Cardio Activity Tracking
- **Activity Types**: Walking, running, cycling, swimming, and custom activities
- **Detailed Logging**: Duration (minutes), distance (miles), and custom notes
- **Recent Activity**: Compact timeline view with edit and delete functionality
- **Flexible Data**: Support for duration-only or distance-only entries

### 📊 Body Measurements & Health Metrics
- **Comprehensive Tracking**: Weight, height, body fat percentage with trend analysis
- **Detailed Body Measurements**: Chest, waist, hips, biceps, forearms, thighs, calves (left/right)
- **Trend Visualization**: Interactive line charts showing measurement trends over time
- **Progress Indicators**: Visual trend arrows and percentage changes
- **BMI Calculation**: Automatic BMI computation with health status indicators

### 🍃 Intermittent Fasting
- **Live Fasting Timer**: Real-time fasting session tracking with pause/resume
- **Session History**: Complete log of fasting periods with duration and timing
- **Goal Management**: Customizable daily fasting targets
- **Statistics**: Average fasting time, longest streak, and consistency tracking
- **Visual Progress**: Heat map visualization of fasting consistency

### 🧘‍♀️ Meditation & Mindfulness
- **Countdown Timer**: Beautiful circular timer with pause/resume functionality
- **Session Logging**: Automatic tracking of meditation duration
- **Audio Feedback**: Completion sound effects
- **Goal Tracking**: Daily meditation targets with 7-day averaging
- **Progress Visualization**: Circular progress rings for goal achievement

### 💧 Hydration Tracking
- **Beverage Types**: Water, coffee, tea, and custom liquid tracking
- **Smart Increments**: Quick-add buttons for common serving sizes
- **Daily Goals**: Customizable hydration targets (32-128 oz range)
- **Progress Visualization**: Real-time progress bars with completion percentages
- **History Logging**: Daily hydration logs with beverage type breakdown

### 💊 Supplement Tracking
- **Custom Supplements**: Add personalized supplements with custom names
- **Daily Logging**: Simple tap-to-increment interface for supplement intake
- **Flexible Goals**: Set daily targets for each supplement
- **Progress Tracking**: Visual progress indicators and completion status

### 🎯 Unified Goals Dashboard
- **Visual Overview**: 2x2 grid showing Hydration, Meditation, Fasting, and Health goals
- **Circular Progress**: Beautiful SVG progress rings for each goal category
- **Real-Time Updates**: Live progress calculation and display
- **Quick Access**: Direct navigation to detailed tracking pages
- **Goal Management**: Easy editing of targets for all categories

### 📊 Advanced Analytics & Insights
- **Workout Statistics**: Detailed analytics with monthly breakdowns and trends
- **Recovery Tracking**: Rest day analysis and workout frequency insights  
- **Energy Level Monitoring**: Daily energy tracking (1-10 scale) with trend analysis
- **Wellness Score**: Composite wellness score based on multiple health metrics
- **Fitness Calculators**: BMI, Calorie, and Macro calculators with data integration

### 📝 Food & Nutrition
- **Macro Tracking**: Protein, carbs, fat, and calorie logging
- **Food Database Integration**: Quick food lookup and macro calculation
- **Daily Targets**: Customizable macro and calorie goals
- **Progress Visualization**: Real-time macro distribution and goal progress

### 📱 User Experience & Interface
- **Mobile-First Design**: Large, touch-optimized elements (100px workout circles)
- **Consistent Styling**: Unified "fitcircle" design language across all pages
- **Dark Theme**: Elegant slate color scheme with vibrant accent colors
- **Responsive Layout**: Optimized for mobile devices with tablet support
- **PWA Ready**: Progressive Web App with offline capabilities and native installation
- **Accessibility**: High contrast design with screen reader support

### 🎨 Advanced UI Components
- **Interactive Calendars**: Date-based navigation with activity indicators
- **Daily Journal**: Rich text journaling with mood and energy tracking
- **Quote System**: Curated daily inspirational quotes with manual refresh
- **Settings Panel**: Comprehensive app configuration and data management
- **Profile Management**: User profile with fitness goals and personal information

### 💾 Data Management & Privacy
- **100% Offline**: All data stored locally in browser localStorage
- **Export/Import**: Complete app state backup and restore via JSON
- **Data Migration**: Automatic schema updates preserving historical data
- **Privacy First**: No server communication, complete user data control
- **Error Handling**: Comprehensive localStorage error protection and recovery

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for form management
- **Custom Hooks** for state management and data persistence

### Styling & UI
- **Tailwind CSS** for utility-first styling with custom color variables
- **Streamlined shadcn/ui** components (12 active components)
- **Lucide React** for consistent iconography
- **Framer Motion** for smooth animations and transitions

### Development & Build
- **Vite** for fast development server and optimized production builds
- **TypeScript** for enhanced developer experience and code reliability
- **Express.js** backend (minimal, prepared for future API expansion)
- **Hot Module Replacement** for instant development feedback

### Data & Visualization
- **localStorage** for client-side data persistence with error handling
- **Recharts** for interactive data visualization and trend charts
- **Date-fns** for robust date manipulation and formatting
- **Custom Analytics** for workout statistics and health insights

## 🏃‍♂️ Getting Started

### Prerequisites
- **Node.js 18+** (with npm package manager)
- Modern web browser with localStorage support
- Mobile device or desktop for testing responsive design

### Installation & Development
1. **Clone the repository**
```bash
git clone https://github.com/fullstackraven/FitCircleApp.git
cd FitCircleApp
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
# Server will be available at http://localhost:5000
```

4. **Build for production**
```bash
npm run build
# Static files will be generated in dist/
```

### Database Setup (Optional)
The app includes PostgreSQL support for future features:
```bash
# Database migrations (when needed)
npm run db:push
```

## 📱 How to Use FitCircle

### Getting Started
1. **Open the app** in your mobile browser or install as PWA
2. **Set up your profile** with name, age, and fitness goals
3. **Create your first workout** by tapping the "+" button
4. **Explore the dashboard** to access all features via hamburger menu

### Workout Management
- **Add Workouts**: Tap "+" → Enter name, goal, color, and schedule → Save
- **Track Progress**: Tap workout circles to increment, long-press for quick increments  
- **Undo/Delete**: Use arrow icon to undo, trash icon to delete workouts
- **Edit Workouts**: Access via "All Workouts" section for full editing
- **Schedule Workouts**: Set specific days of the week for each workout

### Health & Measurements
- **Log Measurements**: Navigate to Measurements → Enter values → Save
- **View Trends**: Scroll horizontally through measurement charts
- **Track Weight**: Use quick increment buttons or manual entry
- **Monitor BMI**: Automatic calculation with health status indicators

### Cardio & Activity
- **Log Activities**: Cardio page → Select type → Enter duration/distance → Save
- **Edit Entries**: Use edit/delete buttons in Recent Activity section
- **Track Progress**: View all activities in chronological order

### Wellness Tracking
- **Fasting**: Start/stop fasting timer, view session history and statistics
- **Meditation**: Set timer → Start → Pause/resume as needed → Complete
- **Hydration**: Select beverage type → Use increment buttons → Monitor progress
- **Supplements**: Add custom supplements → Set daily goals → Track intake

### Goals & Analytics
- **View Goals**: Access unified dashboard showing all wellness goals
- **Edit Targets**: Tap edit icon on any goal to modify targets
- **Monitor Progress**: Real-time circular progress indicators
- **View Statistics**: Detailed analytics in Workout Statistics page

### Advanced Features
- **Energy Tracking**: Daily energy level logging (1-10 scale) via Calendar
- **Food Tracking**: Log macros and calories with built-in calculators
- **Daily Journal**: Rich text journaling with mood and energy correlation
- **Recovery Analysis**: Track rest days and workout frequency patterns

## 🔧 Configuration & Customization

### Workout Customization
- **12 Color Options**: Green, Blue, Purple, Amber, Red, Pink, Cyan, Lime, Orange, Indigo, Emerald, Yellow
- **Daily Goals**: Set individual daily targets for each workout (1-999 range)
- **Weight Tracking**: Optional weight logging per workout for strength training
- **Scheduling**: Configure specific days of the week for each workout
- **Maximum Workouts**: Support for up to 10 custom workouts

### Goal Configuration
- **Hydration**: 32-128 oz daily targets with beverage type selection
- **Meditation**: 5-120 minute daily targets with session averaging
- **Fasting**: 12-24+ hour fasting goals with flexibility for longer fasts
- **Health Metrics**: Weight, body fat, and measurement tracking goals

### Interface Settings
- **Profile Management**: Customize name, age, and fitness objectives
- **Data Export/Import**: Complete app state backup and restoration
- **Cache Management**: Clear browser cache and reset app data
- **Theme Consistency**: Unified dark theme with customizable accent colors

### Privacy & Security
- **100% Local Storage**: All data remains in your browser
- **No Server Communication**: Complete offline operation
- **Export Control**: User-controlled data backup and sharing
- **Data Ownership**: Full control over personal fitness information

## 📈 Data Export & Analytics

### Export Format
The app exports complete app state as JSON, including:
- **Workouts**: Daily logs, goals, colors, schedules, and statistics
- **Measurements**: Historical body metrics with timestamps
- **Cardio Activities**: Exercise logs with duration, distance, and notes
- **Fasting Sessions**: Complete fasting history with start/end times
- **Meditation**: Session logs with duration and goal tracking
- **Hydration**: Daily consumption logs with beverage types
- **Supplements**: Custom supplement tracking and daily logs
- **Goals**: All wellness goal configurations and progress
- **Profile**: User information and fitness objectives

### Analytics & Insights
- **Workout Statistics**: Monthly and all-time performance analysis
- **Trend Analysis**: Visual charts showing progress over time
- **Recovery Metrics**: Rest day analysis and workout frequency insights
- **Energy Correlation**: Daily energy levels with activity patterns
- **Wellness Score**: Composite health score from multiple metrics
- **Consistency Tracking**: Streak analysis and habit formation insights

## 🎨 Design Philosophy & Architecture

### Mobile-First Approach
- **Large Touch Targets**: 100px workout circles optimized for finger interaction
- **Thumb-Friendly Navigation**: Bottom-accessible controls and navigation
- **Gesture Support**: Tap, long-press, and swipe interactions
- **Responsive Design**: Seamless experience across device sizes

### Visual Design Principles  
- **iOS-Inspired Interface**: Clean, minimalist design inspired by Apple's design language
- **Consistent Color System**: 12-color workout palette with semantic color meanings
- **Dark Theme Optimization**: Reduced eye strain with high contrast accents
- **Unified Styling**: "fitcircle" design system applied consistently across all pages

### User Experience Focus
- **Immediate Feedback**: Visual and haptic responses to user interactions  
- **Progress Visualization**: Circular progress rings and animated counters
- **Error Prevention**: Comprehensive input validation and safe defaults
- **Accessibility First**: Screen reader support and keyboard navigation

### Technical Architecture
- **Component Reusability**: Centralized utility functions and shared hooks
- **Performance Optimization**: Efficient state management and minimal re-renders
- **Error Resilience**: Comprehensive error handling for localStorage operations
- **Data Integrity**: Safe JSON parsing and automatic data migration

## 📋 Current Status & Recent Updates

### Completed Features (August 2025)
- ✅ **Complete UI Consistency**: Unified styling across all 20+ pages
- ✅ **Comprehensive Error Handling**: Safe localStorage operations with recovery
- ✅ **Codebase Optimization**: Eliminated redundancy, streamlined utilities
- ✅ **Cardio Activity Tracking**: Full implementation with edit/delete functionality
- ✅ **Profile Management**: Enhanced profile page with larger fitness goal input
- ✅ **Navigation Standardization**: Consistent back button and navigation patterns

### Core Architecture Achievements
- ✅ **Zero Server Dependencies**: 100% client-side operation
- ✅ **PWA Functionality**: Service worker for offline capabilities  
- ✅ **Data Migration System**: Automatic updates preserving historical data
- ✅ **Mobile Optimization**: Touch-first design with large interactive elements
- ✅ **Privacy by Design**: Complete user data ownership and control

## 🔮 Potential Future Enhancements

### Advanced Analytics
- **Machine Learning Insights**: Pattern recognition for personalized recommendations
- **Comparative Analysis**: Benchmark against fitness standards and personal bests
- **Predictive Modeling**: Goal achievement probability and timeline predictions
- **Advanced Visualizations**: Heat maps, correlation analysis, and trend forecasting

### Extended Functionality
- **Workout Templates**: Pre-built exercise routines for different fitness levels
- **Social Integration**: Progress sharing and community challenges (optional)
- **Sleep Tracking**: Integration with rest and recovery monitoring
- **Nutrition Database**: Expanded food tracking with comprehensive macro data
- **Wearable Integration**: Connection with fitness trackers and smartwatches

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments & Credits

### Design & Inspiration
- **iOS Push-Ups App**: Primary design inspiration for circular workout interface
- **Apple Human Interface Guidelines**: Mobile-first design principles and accessibility standards
- **Material Design**: Color theory and responsive design patterns

### Technology & Libraries
- **shadcn/ui**: Streamlined component library (12 active components)
- **Lucide React**: Comprehensive icon library with consistent styling
- **Recharts**: Powerful data visualization and charting capabilities
- **Tailwind CSS**: Utility-first CSS framework enabling rapid development

### Development Tools
- **Vite**: Lightning-fast development server and build optimization
- **TypeScript**: Type safety and enhanced developer experience
- **React Hook Form + Zod**: Robust form handling and validation

---

## 🎯 Project Summary

**FitCircle** is a production-ready, mobile-first fitness tracking Progressive Web App that prioritizes user privacy, data ownership, and intuitive design. With comprehensive workout management, health metrics tracking, and wellness goal monitoring, FitCircle provides a complete fitness companion that works entirely offline while maintaining the polish and functionality of native mobile applications.

**Key Differentiators:**
- 100% offline operation with complete data privacy
- iOS-inspired design optimized for mobile interaction  
- Comprehensive feature set covering all aspects of fitness and wellness
- Zero-redundancy codebase with robust error handling
- PWA capabilities for native-like mobile experience

**Perfect for:** Fitness enthusiasts, health-conscious individuals, and anyone seeking a private, comprehensive, and beautifully designed fitness tracking solution.