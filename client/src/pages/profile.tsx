
import { useState, useEffect } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Load saved profile data
    setName(localStorage.getItem('fitcircle_username') || '');
    setAge(localStorage.getItem('fitcircle_age') || '');
    setBirthday(localStorage.getItem('fitcircle_birthday') || '');
    setFitnessGoal(localStorage.getItem('fitcircle_fitness_goal') || '');
    
    // Load theme
    const savedTheme = localStorage.getItem('fitcircle_theme');
    const isDark = savedTheme === 'dark' || !savedTheme;
    setIsDarkMode(isDark);
  }, []);

  const handleSave = () => {
    localStorage.setItem('fitcircle_username', name);
    localStorage.setItem('fitcircle_age', age);
    localStorage.setItem('fitcircle_birthday', birthday);
    localStorage.setItem('fitcircle_fitness_goal', fitnessGoal);
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
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
          <div className={`w-24 h-24 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded-full flex items-center justify-center`}>
            <User className={`w-12 h-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} />
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
              className={isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className={isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Birthday</label>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className={isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fitness Goal</label>
            <Input
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              placeholder="e.g., Build muscle, Lose weight, Stay healthy"
              className={isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}
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
