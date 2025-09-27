import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function RoutinesPage() {
  const [, navigate] = useLocation();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="fitcircle-page pb-20"> {/* Added pb-20 for bottom nav space */}
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
          <h1 className="fitcircle-page-title">Routines</h1>
          <div className="w-16"></div> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏋️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Coming Soon</h2>
          <p className="text-slate-400 text-lg">
            Workout routines and exercise plans will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}