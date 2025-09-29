import React from 'react';
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

  // Visual viewport-aware navigation that follows keyboard state
  return (
    <nav 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: 'var(--bottom-nav-height)',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgb(51, 65, 85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 8px calc(16px + env(safe-area-inset-bottom)) 8px',
        boxSizing: 'border-box',
        transform: 'translateY(calc(var(--keyboard-offset, 0px) * -1))',
        willChange: 'transform',
        transition: 'transform 0.2s ease-out'
      }}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          width: '100%',
          margin: '0 auto',
          padding: '0 12px'
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
                padding: '12px 16px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: isActive ? 'rgba(51, 65, 85, 0.5)' : 'transparent',
                color: isActive ? 'white' : 'rgb(148, 163, 184)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                minWidth: '64px',
                minHeight: '56px',
                gap: '4px'
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
                  width: '28px',
                  height: '28px',
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