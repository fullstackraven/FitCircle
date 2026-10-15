import { Home, CalendarDays, Dumbbell, CheckSquare, Folder } from 'lucide-react';
import { useLocation } from 'wouter';

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  // Hide navigation on wellness sub-pages
  const wellnessSubPages = [
    '/cardio',
    '/fasting', 
    '/meditation',
    '/hydration',
    '/measurements',
    '/food-tracker',
    '/recovery',
    '/journal-log',
    '/energy-level',
    '/supplements-page'
  ];

  // Don't render navigation on wellness sub-pages
  if (wellnessSubPages.includes(location)) {
    return null;
  }

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home'
    },
    {
      path: '/calendar',
      icon: CalendarDays,
      label: 'Calendar'
    },
    {
      path: '/routines',
      icon: Dumbbell,
      label: 'Routines'
    },
    {
      path: '/wellness',
      icon: Folder,
      label: 'Logs'
    },
    {
      path: '/reminders',
      icon: CheckSquare,
      label: 'Reminders'
    }
  ];

  return (
    <div className="dock-wrap">
      <nav aria-label="Bottom navigation" className="dock-nav glass-nav">
        <div className="dock-items">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              className="dock-tab"
              aria-current={location === path ? 'page' : undefined}
              onClick={() => navigate(path)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
