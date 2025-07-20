# FitCircle - Comprehensive Fitness & Wellness Tracker

A comprehensive fitness and wellness tracking application that empowers users to manage their physical and mental health through advanced tracking, logging, and interactive features.

## ✨ Features

### 🏋️‍♂️ Workout Tracking
- **Custom Workouts**: Create personalized workout routines with custom names and colors
- **Daily Goals**: Set and track daily exercise targets with visual progress indicators
- **Progress Circles**: Large, tappable workout buttons with animated progress rings
- **Workout History**: Track daily performance with automatic data persistence

### 📊 Body Measurements
- **Comprehensive Tracking**: Monitor weight, height, body fat, and detailed body measurements
- **Left/Right Measurements**: Separate tracking for biceps, forearms, thighs, and calves
- **Trend Visualization**: Interactive line graphs showing measurement trends over time
- **Progress Indicators**: Visual trend arrows (up, down, neutral) for each measurement

### 🍃 Intermittent Fasting
- **Session Logging**: Track fasting periods with start/end times and duration
- **All-Time Averaging**: Calculate and display lifetime fasting averages
- **Goal Management**: Set fasting targets with progress visualization
- **Heat Bar Visualization**: Visual representation of fasting consistency

### 🧘‍♀️ Meditation Timer
- **Circular Progress Timer**: Beautiful countdown timer with pause/resume functionality
- **Session Logging**: Automatic tracking of meditation sessions with duration
- **Audio Feedback**: Gong sound effect on completion
- **Goal Tracking**: Set daily meditation targets with 7-day averaging

### 💧 Hydration Tracking
- **Liquid Type Selection**: Track different beverages (Water, Coffee, Tea, Custom)
- **Daily Goals**: Customizable hydration targets with progress visualization
- **Smart Logging**: Quick increment buttons for common serving sizes
- **Progress Tracking**: Real-time progress bars and completion percentages

### 🎯 Centralized Goals Management
- **Unified Dashboard**: 2x2 grid layout showing all wellness goals
- **Circular Progress Rings**: Beautiful progress indicators for each goal category
- **Real-Time Updates**: Live progress calculation and display
- **Easy Goal Editing**: Quick access to modify targets for all categories

### 📱 Mobile-First Design
- **Touch-Optimized**: Large, easily tappable elements designed for mobile use
- **Responsive Layout**: Optimized for various screen sizes
- **Dark Theme**: Consistent dark UI with bright colored accents
- **PWA Support**: Install as a Progressive Web App for native-like experience

### 💾 Data Management
- **Local Storage**: All data stored locally in browser for privacy and offline access
- **Export/Import**: Complete CSV backup and restore functionality
- **Auto-Backup**: Scheduled daily backups with status tracking
- **Data Migration**: Automatic updates for new features and data structures

## 🚀 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized builds
- **Charts**: Recharts for data visualization
- **Audio**: Web Audio API for meditation sounds
- **Storage**: Browser localStorage with automatic persistence

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/fullstackraven/FitCircleApp.git
cd FitCircleApp
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Build for production
```bash
npx vite build --config vite.config.static.ts
```

## 📱 Usage

### Adding Workouts
1. Tap the "+" button on the home screen
2. Enter workout name, daily goal, and select a color
3. Tap "Add Workout" to save

### Tracking Progress
1. Tap any workout circle to increment your count
2. Use the undo button (arrow icon) to decrement
3. Use the delete button (trash icon) to remove workouts

### Recording Measurements
1. Navigate to Measurements from the dashboard
2. Enter current measurements in the input fields
3. Tap "Save Measurements" to record with timestamp
4. View trends in the horizontal scrolling graph section

### Logging Fasting Sessions
1. Go to Intermittent Fasting page
2. Tap "Start Fast" to begin timing
3. Tap "End Fast" when complete
4. View your fasting history and averages

### Using Meditation Timer
1. Navigate to Meditation page
2. Set desired duration with +/- buttons
3. Tap "Start" to begin meditation
4. Use pause/resume as needed
5. Gong sound plays when timer completes

### Managing Hydration
1. Open Hydration page from dashboard
2. Select liquid type (Water, Coffee, Tea, Custom)
3. Tap increment buttons to log consumption
4. Monitor daily progress toward your goal

### Setting Goals
1. Access Goals page from hamburger menu or dashboard
2. Tap edit icon on any goal category
3. Adjust target values as needed
4. Progress rings update automatically

## 🔧 Configuration

### Customization Options
- **Workout Colors**: Choose from 12 vibrant color options
- **Goal Targets**: Customize daily/weekly targets for all categories
- **Measurement Units**: Support for imperial measurements
- **Backup Schedule**: Configure automatic backup timing

### Data Privacy
- All data stored locally in your browser
- No external servers or data transmission
- Export functionality for personal backups
- Complete control over your fitness data

## 📈 Data Export Format

The app exports comprehensive CSV files including:
- **Profile**: Personal information and current measurements
- **Workouts**: Daily workout logs with dates and counts
- **Measurements**: Historical body measurement data
- **Fasting**: Intermittent fasting session logs
- **Meditation**: Meditation session history
- **Hydration**: Daily hydration logs with liquid types

## 🎨 Design Philosophy

FitCircle emphasizes simplicity and usability with:
- **Large Touch Targets**: Easy interaction on mobile devices
- **Visual Feedback**: Immediate response to user actions
- **Progress Visualization**: Clear indication of goal achievement
- **Consistent Interface**: Unified design language throughout
- **Accessibility**: High contrast and readable typography

## 🔮 Future Enhancements

- **Data Sync**: Cloud backup and multi-device synchronization
- **Social Features**: Share progress with friends and family
- **Advanced Analytics**: Detailed insights and trend analysis
- **Workout Templates**: Pre-built exercise routines
- **Nutrition Tracking**: Calorie and macro monitoring
- **Sleep Monitoring**: Rest and recovery tracking

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Design Inspiration**: iOS "Push-Ups" app interface
- **Component Library**: shadcn/ui for beautiful React components
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization

---

**FitCircle** - Take control of your fitness journey with comprehensive tracking and beautiful visualizations. 🎯💪