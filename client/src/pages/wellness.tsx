import { useState, useEffect } from 'react';
import { Heart, BookOpen, Zap, Pill, Activity, Clock, Brain, Droplet, User, UtensilsCrossed, Menu, Settings, Calculator, CheckCircle, Edit2, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const DEFAULT_FEATURES = [
  {
    id: 'cardio',
    title: 'Cardio',
    icon: Activity,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    hoverBg: 'hover:bg-green-400/20',
    path: '/cardio'
  },
  {
    id: 'fasting',
    title: 'Intermittent Fasting',
    icon: Clock,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    hoverBg: 'hover:bg-orange-400/20',
    path: '/fasting'
  },
  {
    id: 'meditation',
    title: 'Meditation',
    icon: Brain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    hoverBg: 'hover:bg-purple-400/20',
    path: '/meditation'
  },
  {
    id: 'hydration',
    title: 'Hydration',
    icon: Droplet,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    hoverBg: 'hover:bg-cyan-400/20',
    path: '/hydration'
  },
  {
    id: 'measurements',
    title: 'Measurements',
    icon: User,
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
    hoverBg: 'hover:bg-teal-400/20',
    path: '/measurements'
  },
  {
    id: 'food-tracker',
    title: 'Food Tracker',
    icon: UtensilsCrossed,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    hoverBg: 'hover:bg-amber-400/20',
    path: '/food-tracker'
  },
  {
    id: 'recovery',
    title: 'Recovery',
    icon: Heart,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    hoverBg: 'hover:bg-orange-400/20',
    path: '/recovery'
  },
  {
    id: 'journal',
    title: 'Daily Journal',
    icon: BookOpen,
    color: 'text-purple-400', 
    bgColor: 'bg-purple-400/10',
    hoverBg: 'hover:bg-purple-400/20',
    path: '/journal-log'
  },
  {
    id: 'energy',
    title: 'Energy Level',
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10', 
    hoverBg: 'hover:bg-yellow-400/20',
    path: '/energy-level'
  },
  {
    id: 'supplements',
    title: 'Supplements',
    icon: Pill,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    hoverBg: 'hover:bg-blue-400/20', 
    path: '/supplements-page'
  }
];

export default function WellnessPage() {
  const [, navigate] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fitcircle_username') || 'User');
  const [isEditMode, setIsEditMode] = useState(false);
  const [wellnessFeatures, setWellnessFeatures] = useState(() => {
    try {
      const savedOrder = localStorage.getItem('fitcircle_wellness_layout');
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        return orderIds.map((id: string) => 
          DEFAULT_FEATURES.find(f => f.id === id)
        ).filter(Boolean);
      }
    } catch (error) {
      // Error loading saved layout
    }
    return DEFAULT_FEATURES;
  });

  useEffect(() => {
    const shouldOpenDashboard = new URLSearchParams(window.location.search).get('dashboard') === 'open';
    const dashboardState = sessionStorage.getItem('fitcircle_dashboard_open');
    
    if (shouldOpenDashboard || dashboardState === 'true') {
      setIsSidebarOpen(true);
      window.history.replaceState({}, '', '/wellness');
      sessionStorage.removeItem('fitcircle_dashboard_open');
    }
  }, []);
  const moveItem = (index: number, direction: 'up' | 'down' | 'left' | 'right') => {
    const newFeatures = [...wellnessFeatures];
    let swapIndex = -1;

    switch (direction) {
      case 'up':
        swapIndex = index - 2; // Move up one row (2 columns)
        break;
      case 'down':
        swapIndex = index + 2; // Move down one row (2 columns)
        break;
      case 'left':
        swapIndex = index - 1; // Move left one column
        break;
      case 'right':
        swapIndex = index + 1; // Move right one column
        break;
    }

    if (swapIndex >= 0 && swapIndex < newFeatures.length) {
      [newFeatures[index], newFeatures[swapIndex]] = [newFeatures[swapIndex], newFeatures[index]];
      setWellnessFeatures(newFeatures);
    }
  };

  const handleDone = () => {
    try {
      const orderIds = wellnessFeatures.map((f: any) => f.id);
      localStorage.setItem('fitcircle_wellness_layout', JSON.stringify(orderIds));
    } catch (error) {
      // Error saving layout
    }
    setIsEditMode(false);
  };

  const canMoveUp = (index: number) => index >= 2;
  const canMoveDown = (index: number) => index < wellnessFeatures.length - 2;
  const canMoveLeft = (index: number) => index % 2 === 1; // Only right column can move left
  const canMoveRight = (index: number) => index % 2 === 0 && index < wellnessFeatures.length - 1; // Only left column can move right

  return (
    <div className="fitcircle-page">
      {/* Universal Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,11%)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="relative text-center max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-0 left-4 text-slate-400 hover:text-white transition-colors"
            title="Open Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-2xl font-bold text-white">FitCircle</h1>
        </div>
      </header>
      
      {/* Main content with top padding to offset fixed header */}
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 56px)' }}>
        <div className="fitcircle-container">

        {/* Edit/Done Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => isEditMode ? handleDone() : setIsEditMode(true)}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
            title={isEditMode ? "Done editing" : "Edit layout"}
            data-testid={isEditMode ? "button-done-edit" : "button-edit-layout"}
          >
            {isEditMode ? (
              <>
                <Check size={20} />
                <span className="text-sm font-medium">Done</span>
              </>
            ) : (
              <Edit2 size={20} />
            )}
          </button>
        </div>

        {/* Wellness Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          {wellnessFeatures.map((feature: any, index: number) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="relative">
                {/* Directional Arrows in Edit Mode */}
                {isEditMode && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 z-10 pointer-events-none">
                    {canMoveUp(index) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'up');
                        }}
                        className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto transition-opacity hover:opacity-70"
                        data-testid={`button-move-up-${feature.id}`}
                      >
                        <ChevronUp className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {canMoveDown(index) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'down');
                        }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-auto transition-opacity hover:opacity-70"
                        data-testid={`button-move-down-${feature.id}`}
                      >
                        <ChevronDown className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {canMoveLeft(index) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'left');
                        }}
                        className="absolute top-1/2 -translate-y-1/2 left-2 pointer-events-auto transition-opacity hover:opacity-70"
                        data-testid={`button-move-left-${feature.id}`}
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {canMoveRight(index) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'right');
                        }}
                        className="absolute top-1/2 -translate-y-1/2 right-2 pointer-events-auto transition-opacity hover:opacity-70"
                        data-testid={`button-move-right-${feature.id}`}
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => !isEditMode && navigate(`${feature.path}?from=wellness`)}
                  className={`aspect-square p-6 ${feature.bgColor} ${!isEditMode && feature.hoverBg} rounded-2xl transition-all duration-200 ${!isEditMode && 'hover:scale-105 active:scale-95'} flex flex-col items-center justify-center space-y-4 w-full ${isEditMode ? 'opacity-75' : ''}`}
                  disabled={isEditMode}
                  data-testid={`card-${feature.id}`}
                >
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                  <span className="text-white font-medium text-center text-sm leading-tight">
                    {feature.title}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Dashboard */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 bg-slate-900 border-slate-700">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div 
              className="flex items-center space-x-3 p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
              onClick={() => {
                setIsSidebarOpen(false);
                navigate('/profile?from=dashboard');
              }}
            >
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center border-2 border-green-400">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">{userName}</div>
                <div className="text-slate-400 text-xs">view profile</div>
              </div>
            </div>

            <div className="flex-1 py-4">
              <div 
                className="flex items-center space-x-3 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate('/settings?from=dashboard');
                }}
              >
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="text-white">Settings</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="text-slate-500 text-xs text-center">Version 2.1.0</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}