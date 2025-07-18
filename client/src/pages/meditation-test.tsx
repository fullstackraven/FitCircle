import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function MeditationTestPage() {
  const [, navigate] = useLocation();
  
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Meditation Test</h1>
          <div className="w-16"></div>
        </div>
        
        <div className="text-center">
          <p>This is a test meditation page.</p>
          <p>If you can see this, the routing is working.</p>
        </div>
      </div>
    </div>
  );
}