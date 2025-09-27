import { ArrowLeft, Heart, BookOpen, Zap, Pill } from 'lucide-react';
import { useLocation } from 'wouter';

export default function WellnessPage() {
  const [, navigate] = useLocation();

  const handleBack = () => {
    navigate('/');
  };

  const wellnessFeatures = [
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
    <div className="fitcircle-page pb-20">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="fitcircle-page-title">Logs</h1>
          <div className="w-16"></div> {/* Spacer */}
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