import { Home, CalendarDays, Dumbbell, CheckSquare, Folder } from 'lucide-react';
import { useLocation } from 'wouter';

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

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
    <nav 
      className="navigation-bar-absolute"
      style={{
        position: 'fixed !important' as any,
        bottom: '0px !important' as any,
        left: '0px !important' as any,
        right: '0px !important' as any,
        height: '88px !important' as any,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgb(51, 65, 85)',
        zIndex: 2147483647, // Maximum z-index value
        backdropFilter: 'none !important' as any,
        WebkitBackdropFilter: 'none !important' as any,
        display: 'flex !important' as any,
        alignItems: 'center !important' as any,
        justifyContent: 'center !important' as any,
        padding: '12px 8px 24px 8px',
        boxSizing: 'border-box',
        isolation: 'isolate',
        contain: 'strict', // Strongest containment
        willChange: 'transform',
        transform: 'translate3d(0, 0, 0) !important' as any,
        WebkitTransform: 'translate3d(0, 0, 0) !important' as any,
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
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