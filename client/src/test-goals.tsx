// Simple test component to verify Goals page works
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function TestGoals() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white p-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-gray-400 hover:text-white mr-4"
        >
          <ChevronLeft className="w-6 h-6" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Goals Test Page</h1>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Hydration</h2>
          <div className="w-24 h-24 rounded-full bg-blue-500/20 border-4 border-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium">64oz</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">75%</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Meditation</h2>
          <div className="w-24 h-24 rounded-full bg-purple-500/20 border-4 border-purple-500 flex items-center justify-center">
            <span className="text-sm font-medium">10min</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">50%</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Fasting</h2>
          <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center">
            <span className="text-sm font-medium">16hrs</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">80%</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Weight</h2>
          <div className="w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center">
            <span className="text-sm font-medium">150lbs</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Goal</p>
        </div>
      </div>
    </div>
  );
}