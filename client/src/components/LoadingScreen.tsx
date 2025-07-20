import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [stage, setStage] = useState<'text' | 'ring' | 'check' | 'complete'>('text');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('ring');
    }, 1000); // Show text for 1 second

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (stage === 'ring') {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 4; // Complete in ~25 steps (100ms each = 2.5s)
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => setStage('check'), 200);
            return 100;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'check') {
      const timer = setTimeout(() => {
        setStage('complete');
        setTimeout(onComplete, 300);
      }, 1000); // Show checkmark for 1 second

      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-300 ${
        stage === 'complete' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}
    >
      <div className="flex flex-col items-center">
        {/* FitCircle Text */}
        <div 
          className={`text-4xl font-bold text-white mb-8 transition-all duration-1000 ${
            stage === 'text' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          FitCircle
        </div>

        {/* Loading Ring */}
        <div 
          className={`relative transition-all duration-500 ${
            stage === 'ring' || stage === 'check' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <svg width="200" height="200" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="rgb(71, 85, 105)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="rgb(34, 197, 94)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-100 ease-out"
            />
          </svg>

          {/* Checkmark */}
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              stage === 'check' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <div className="bg-green-500 rounded-full p-4">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}