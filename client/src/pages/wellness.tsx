import { Heart, BookOpen, Zap, Pill, Activity, Clock, Brain, Droplet, User, UtensilsCrossed } from 'lucide-react';
import { useLocation } from 'wouter';

export default function WellnessPage() {
  const [, navigate] = useLocation();


  const wellnessFeatures = [
    // Moved from dashboard in specified order
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
    // Original wellness features
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
      path: '/daily-journal'
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

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="fitcircle-page-title">Logs</h1>
        </div>

        {/* Wellness Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          {wellnessFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => navigate(`${feature.path}?from=wellness`)}
                className={`aspect-square p-6 ${feature.bgColor} ${feature.hoverBg} rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex flex-col items-center justify-center space-y-4`}
              >
                <Icon className={`w-8 h-8 ${feature.color}`} />
                <span className="text-white font-medium text-center text-sm leading-tight">
                  {feature.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}