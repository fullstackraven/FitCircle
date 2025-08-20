
import { useState, useEffect } from 'react';
import { ArrowLeft, User, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  const [, navigate] = useLocation();
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      sessionStorage.setItem('fitcircle_dashboard_open', 'true');
      navigate('/');
    } else {
      navigate('/');
    }
  };
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');

  useEffect(() => {
    // Load saved profile data
    setName(localStorage.getItem('fitcircle_username') || '');
    setAge(localStorage.getItem('fitcircle_age') || '');
    setFitnessGoal(localStorage.getItem('fitcircle_fitness_goal') || '');
  }, []);

  const handleSave = () => {
    localStorage.setItem('fitcircle_username', name);
    localStorage.setItem('fitcircle_age', age);
    localStorage.setItem('fitcircle_fitness_goal', fitnessGoal);
    navigate('/');
  };

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="fitcircle-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="fitcircle-page-title">Profile</h1>
          <div className="w-16"></div>
        </div>

        {/* Profile Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center border-2 border-green-400">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Profile Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="fitcircle-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="fitcircle-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fitness Goal</label>
            <Textarea
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              placeholder="e.g., Build muscle, lose weight, stay healthy, train for a marathon..."
              className="fitcircle-input h-24 resize-none"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
