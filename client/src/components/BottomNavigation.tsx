import React from 'react';
import { Home, CalendarDays, Dumbbell, CheckSquare, Folder } from 'lucide-react';
import { useLocation } from 'wouter';

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  // Defensive cleanup of any residual body styles from modals on route changes
  React.useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.position = '';
  }, [location]);

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

  // Render navigation normally since sub-pages don't show it
  return (
    <nav 
      className="navigation-bar-absolute"
      style={{
        position: 'fixed',
        bottom: '0px',
        left: '0px',
        right: '0px',
        width: '100%',
        height: 'var(--bottom-nav-height)',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgb(51, 65, 85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(12px + env(safe-area-inset-top)) 8px calc(24px + env(safe-area-inset-bottom)) 8px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          width: '100%',
          maxWidth: '448px',
          margin: '0 auto'
        }}
      >
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isActive ? 'rgba(51, 65, 85, 0.5)' : 'transparent',
                color: isActive ? 'white' : 'rgb(148, 163, 184)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.3)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(148, 163, 184)';
                }
              }}
            >
              <Icon 
                style={{
                  width: '20px',
                  height: '20px',
                  marginBottom: '4px'
                }}
              />
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: '300',
                  lineHeight: '1'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}