import React, { useState, useEffect, forwardRef } from 'react';
import { Home, CalendarDays, Dumbbell, CheckSquare, Folder } from 'lucide-react';
import { useLocation } from 'wouter';

const BottomNavigation = forwardRef<HTMLDivElement>((props, ref) => {
  const [location, navigate] = useLocation();
  const [keyboardState, setKeyboardState] = useState({ open: false, offset: 0 });

  // Track text input to trigger reload on navigation
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        sessionStorage.setItem('fitcircle_text_input_occurred', 'true');
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

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

  // Robust keyboard detection - only update on resize and focus events, NOT scroll
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let timerId: number | null = null;

    const compute = () => {
      const docHeight = document.documentElement.clientHeight;
      const keyboardHeight = Math.max(0, docHeight - (vv.height + vv.offsetTop));
      const open = keyboardHeight > 80; // Threshold to determine if keyboard is truly open
      setKeyboardState({ open, offset: open ? keyboardHeight : 0 });
    };

    // Deferred update helps with iOS keyboard dismissal timing
    const deferredCompute = () => {
      if (timerId !== null) clearTimeout(timerId);
      timerId = window.setTimeout(compute, 50);
    };

    vv.addEventListener('resize', compute);
    window.addEventListener('focusin', compute);
    window.addEventListener('focusout', deferredCompute);
    
    // Initial check
    compute();

    return () => {
      if (timerId !== null) clearTimeout(timerId);
      vv.removeEventListener('resize', compute);
      window.removeEventListener('focusin', compute);
      window.removeEventListener('focusout', deferredCompute);
    };
  }, []);

  // Reset keyboard state on route change to avoid stale values
  useEffect(() => {
    setTimeout(() => {
      setKeyboardState({ open: false, offset: 0 });
    }, 0);
  }, [location]);

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

  const handleNavigation = (path: string) => {
    const textInputOccurred = sessionStorage.getItem('fitcircle_text_input_occurred') === 'true';
    
    if (textInputOccurred && location !== path) {
      sessionStorage.removeItem('fitcircle_text_input_occurred');
      window.location.href = path;
    } else {
      navigate(path);
    }
  };

  // Floating dock-style navigation with stable bottom position
  const baseBottom = 'calc(env(safe-area-inset-bottom) + 24px)';
  const translateY = keyboardState.open ? -(keyboardState.offset + 16) : 0;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: baseBottom,
        left: '50%',
        transform: `translate(-50%, ${translateY}px) translateZ(0)`,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        padding: '0 16px',
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease-out',
        willChange: 'transform',
        backfaceVisibility: 'hidden' as const,
        WebkitBackfaceVisibility: 'hidden' as const
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
                onClick={() => handleNavigation(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: isActive ? 'white' : 'rgb(148, 163, 184)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  minWidth: '52px',
                  minHeight: '48px',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
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
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;