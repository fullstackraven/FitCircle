import { useEffect } from 'react';

interface SimpleLoadingScreenProps {
  onComplete: () => void;
}

const SimpleLoadingScreen = ({ onComplete }: SimpleLoadingScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}
    >
      <div className="text-center">
        <div className="text-4xl font-bold text-white mb-4">
          FitCircle
        </div>
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default SimpleLoadingScreen;