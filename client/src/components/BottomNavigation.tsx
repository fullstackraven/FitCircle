import React, { useState, useEffect } from 'react';
import { Home, CalendarDays, Dumbbell, CheckSquare, Folder } from 'lucide-react';
import { useLocation } from 'wouter';

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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

  // Keyboard detection for hiding dock
  useEffect(() => {
    if (!window.visualViewport) {
      return;
    }

    const handleViewportChange = () => {
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;
      
      // Consider keyboard open if viewport height is significantly smaller
      const keyboardThreshold = 150; // pixels
      const keyboardOffset = windowHeight - viewport.height - viewport.offsetTop;
      setIsKeyboardOpen(keyboardOffset > keyboardThreshold);
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    // Initial check
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Don't render navigation on wellness sub-pages or when keyboard is open
  if (wellnessSubPages.includes(location) || isKeyboardOpen) {
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

  // Floating dock-style navigation
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}
    >
      <nav 
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          borderRadius: '24px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: '8px'
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
                  padding: '10px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(51, 65, 85, 0.5)' : 'transparent',
                  color: isActive ? 'white' : 'rgb(148, 163, 184)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  minWidth: '56px',
                  minHeight: '52px',
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
    </div>
  );
}