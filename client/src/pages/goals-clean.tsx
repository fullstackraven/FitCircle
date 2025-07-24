import { useState, useEffect } from 'react';
import { ChevronLeft, Droplet, Brain, Clock, Scale, Edit, Percent, Target } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGoals } from '@/hooks/use-goals';

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

function CircularProgress({ percentage, color, size = 120, strokeWidth = 8, children }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(71, 85, 105)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [, navigate] = useLocation();
  
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?dashboard=open');
    } else {
      navigate('/');
    }
  };

  const { goals, calculateProgress } = useGoals();
  
  const [progress, setProgress] = useState({
    hydrationProgress: 0,
    meditationProgress: 0,
    fastingProgress: 0,
    weightProgress: 0,
    targetWeightProgress: 0,
    targetBodyFatProgress: 0,
    workoutConsistencyProgress: 0
  });
  
  useEffect(() => {
    const updateProgress = async () => {
      try {
        const newProgress = await calculateProgress();
        setProgress(newProgress);
      } catch (e) {
        console.error('Error updating progress:', e);
      }
    };
    
    updateProgress();
    const interval = setInterval(updateProgress, 5000);
    return () => clearInterval(interval);
  }, [calculateProgress]);

  const basicGoals = [
    {
      key: 'hydrationOz' as keyof typeof goals,
      title: 'Daily Hydration',
      unit: 'oz',
      icon: Droplet,
      progress: progress.hydrationProgress,
      color: 'rgb(59, 130, 246)',
      value: goals.hydrationOz
    },
    {
      key: 'meditationMinutes' as keyof typeof goals,
      title: 'Daily Meditation',
      unit: 'min',
      icon: Brain,
      progress: progress.meditationProgress,
      color: 'rgb(147, 51, 234)',
      value: goals.meditationMinutes
    },
    {
      key: 'fastingHours' as keyof typeof goals,
      title: 'Intermittent Fasting',
      unit: 'hrs',
      icon: Clock,
      progress: progress.fastingProgress,
      color: 'rgb(245, 158, 11)',
      value: goals.fastingHours
    },
    {
      key: 'weightLbs' as keyof typeof goals,
      title: 'Target Weight',
      unit: 'lbs',
      icon: Scale,
      progress: progress.weightProgress,
      color: 'rgb(34, 197, 94)',
      value: goals.weightLbs
    }
  ];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Goals</h1>
          <div className="w-16"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {basicGoals.map((item) => {
            const IconComponent = item.icon;
            
            return (
              <div key={item.key} className="bg-slate-800 rounded-xl p-4 relative">
                <div className="flex flex-col items-center mb-4">
                  <CircularProgress
                    percentage={Math.min(item.progress, 100)}
                    color={item.color}
                    size={100}
                    strokeWidth={6}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {item.value}
                        <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {Math.round(item.progress)}%
                      </div>
                    </div>
                  </CircularProgress>
                </div>

                <div className="flex items-center justify-center space-x-2 mb-2">
                  <IconComponent className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-medium text-white text-center">{item.title}</h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-slate-400 text-sm">
          Track your daily wellness goals with visual progress indicators
        </div>
      </div>
    </div>
  );
}