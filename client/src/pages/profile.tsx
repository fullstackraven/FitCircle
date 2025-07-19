
import { useState, useEffect } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const [, navigate] = useLocation();
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?dashboard=open');
    } else {
      navigate('/');
    }
  };
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');

  useEffect(() => {
    // Load saved profile data
    setName(localStorage.getItem('fitcircle_username') || '');
    setAge(localStorage.getItem('fitcircle_age') || '');
    setBirthday(localStorage.getItem('fitcircle_birthday') || '');
    setFitnessGoal(localStorage.getItem('fitcircle_fitness_goal') || '');
  }, []);

  const handleSave = () => {
    localStorage.setItem('fitcircle_username', name);
    localStorage.setItem('fitcircle_age', age);
    localStorage.setItem('fitcircle_birthday', birthday);
    localStorage.setItem('fitcircle_fitness_goal', fitnessGoal);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="w-16"></div>
        </div>

        {/* Profile Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-slate-400" />
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
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Birthday</label>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fitness Goal</label>
            <Input
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              placeholder="e.g., Build muscle, Lose weight, Stay healthy"
              className="bg-slate-800 border-slate-700 text-white"
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
