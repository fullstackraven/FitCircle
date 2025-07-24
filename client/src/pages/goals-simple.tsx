import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function GoalsPage() {
  const [, navigate] = useLocation();
  
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
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

        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">Goals Page - Simplified Test</h2>
          <p>This is a simplified version to test if the page loads correctly.</p>
        </div>
      </div>
    </div>
  );
}