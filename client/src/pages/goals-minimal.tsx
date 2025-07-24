import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function GoalsPageMinimal() {
  const [, navigate] = useLocation();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Goals - Minimal Test</h1>
        <div className="w-16"></div>
      </div>

      <div className="p-4">
        <p className="text-white">
          This is a minimal Goals page to test if the basic page loads without JavaScript errors.
        </p>
      </div>
    </div>
  );
}