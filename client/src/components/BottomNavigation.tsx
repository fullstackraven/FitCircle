import { Home, CalendarDays, Dumbbell, CheckSquare, Folder } from 'lucide-react';
import { useLocation } from 'wouter';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  // Ensure body styles don't interfere with navigation positioning
  useEffect(() => {
    const cleanup = () => {
      // Force restore normal body styles that modals might have changed
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      
      // Remove any classes that might affect positioning
      document.body.classList.remove('overflow-hidden', 'fixed', 'scroll-lock');
      document.documentElement.classList.remove('overflow-hidden', 'fixed', 'scroll-lock');
    };
    
    // Clean up immediately
    cleanup();
    
    // Set up periodic cleanup to handle lingering modal effects
    const interval = setInterval(cleanup, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [location]); // Re-run cleanup when navigating

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

  const navigationElement = (
    <div 
      className="bottom-navigation-fixed fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 px-2 py-3 z-50"
      style={{ 
        position: 'fixed !important',
        bottom: 'env(safe-area-inset-bottom, 0) !important',
        left: '0 !important',
        right: '0 !important',
        zIndex: 99999,
        transform: 'none !important',
        willChange: 'auto !important',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0))',
        isolation: 'isolate',
        contain: 'layout style paint',
        pointerEvents: 'auto'
      }}
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors ${
                isActive 
                  ? 'text-white bg-slate-800/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-light text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render via portal to document.body to isolate from modal DOM changes
  return typeof document !== 'undefined' ? createPortal(navigationElement, document.body) : null;
}