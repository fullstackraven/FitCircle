import React, { useState, useEffect } from "react";
import { ArrowLeft, Zap, Undo2, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useEnergyLevel } from "../hooks/use-energy-level";
import { format } from "date-fns";

// Energy Level Trend Visualization Component
const EnergyTrendVisualization = () => {
  const { getEnergyLevelData } = useEnergyLevel();
  const energyData = getEnergyLevelData();
  
  // Get last 7 days of data
  const last7Days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const energy = energyData[dateStr] || 0;
    last7Days.push({
      date: format(date, 'EEE'),
      energy: energy,
      dateStr: dateStr
    });
  }

  const maxEnergy = 10;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end h-32 bg-slate-800 rounded-xl p-4">
        {last7Days.map((day, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <div className="flex flex-col items-center justify-end h-20">
              <div 
                className="bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-md transition-all duration-300"
                style={{ 
                  height: `${(day.energy / maxEnergy) * 100}%`,
                  width: '16px',
                  minHeight: day.energy > 0 ? '4px' : '0px'
                }}
              />
            </div>
            <span className="text-xs text-slate-400">{day.date}</span>
            <span className="text-xs text-yellow-400 font-medium">{day.energy || '-'}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 text-center">
        Energy levels over the past 7 days (1-10 scale)
      </p>
    </div>
  );
};

export function EnergyLevelPage() {
  const [, navigate] = useLocation();
  const { getEnergyLevel, setEnergyLevelForDate } = useEnergyLevel();
  const [energyLevel, setEnergyLevel] = useState(0);

  useEffect(() => {
    // Load today's energy level
    const today = new Date();
    const energy = getEnergyLevel(today);
    setEnergyLevel(energy);
  }, []);

  const handleEnergyTap = () => {
    const newLevel = energyLevel >= 10 ? 1 : energyLevel + 1;
    setEnergyLevel(newLevel);
  };

  const handleEnergyUndo = () => {
    const newLevel = energyLevel <= 1 ? 0 : energyLevel - 1;
    setEnergyLevel(newLevel);
  };

  const handleEnergySave = () => {
    if (energyLevel > 0) {
      const today = new Date();
      setEnergyLevelForDate(today, energyLevel);
      alert('Energy level saved successfully!');
    }
  };

  const getEnergyColor = (level: number) => {
    if (level === 0) return 'text-slate-500';
    if (level <= 3) return 'text-red-400';
    if (level <= 6) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getEnergyDescription = (level: number) => {
    if (level === 0) return 'Not set';
    if (level <= 2) return 'Very Low';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/calendar")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Calendar"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-xl font-bold text-white">Energy Level</h1>
        <div className="w-[42px]" />
      </div>

      <div className="space-y-6">
        {/* Energy Level Trend */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Energy Trends</h2>
          </div>
          <EnergyTrendVisualization />
        </div>

        {/* Today's Energy Level */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Today's Energy Level</h2>
              <p className="text-sm text-slate-400">{format(new Date(), "MMMM d, yyyy")}</p>
            </div>

            {/* Energy Level Circle with Progress Ring */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#475569"
                    strokeWidth="6"
                    fill="none"
                    className="opacity-30"
                  />
                  {/* Progress circle */}
                  {energyLevel > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke={energyLevel <= 3 ? '#ef4444' : energyLevel <= 6 ? '#fbbf24' : '#22c55e'}
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(energyLevel / 10) * 314.159} 314.159`}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  )}
                </svg>
                {/* Clickable button */}
                <button
                  onClick={handleEnergyTap}
                  className="absolute inset-2 rounded-full bg-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-slate-600"
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getEnergyColor(energyLevel)}`}>
                      {energyLevel}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {getEnergyDescription(energyLevel)}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="text-sm text-slate-300">
              Tap the circle to increase your energy level (1-10 scale)
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 justify-center">
              <button
                onClick={handleEnergyUndo}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                disabled={energyLevel === 0}
              >
                <Undo2 className="w-4 h-4" />
                <span>Undo</span>
              </button>
              
              <button
                onClick={handleEnergySave}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors font-medium"
              >
                Save Level
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-300">
            <Calendar className="w-4 h-4 inline mr-2" />
            Tip: Tap any day on the calendar to view or edit past energy levels
          </p>
        </div>
      </div>
    </div>
  );
}