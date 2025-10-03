import React, { useState, useEffect } from "react";
import { ArrowLeft, Zap, Undo2, Calendar, Repeat } from "lucide-react";
import { useLocation } from "wouter";
import { useEnergyLevel } from "../hooks/use-energy-level";
import { getDateString } from '@/lib/date-utils';
import { format } from 'date-fns';

// Enhanced Energy Level Trend Visualization Component
const EnergyTrendVisualization = ({ showAllTime }: { showAllTime: boolean }) => {
  const { getEnergyLevelData } = useEnergyLevel();
  const energyData = getEnergyLevelData();
  
  // Get data based on view mode
  const trendData: Array<{ date: string; energy: number; dateStr: string }> = [];
  const today = new Date();
  
  if (showAllTime) {
    // Get all-time data
    const allDates = Object.keys(energyData).sort();
    if (allDates.length > 0) {
      allDates.forEach(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
          energy: (energyData as any)[dateStr] || 0,
          dateStr: dateStr
        });
      });
    }
  } else {
    // Get last 14 days of data
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateString(date);
      const energy = (energyData as any)[dateStr] || 0;
      trendData.push({
        date: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        energy: energy,
        dateStr: dateStr
      });
    }
  }
  
  const last14Days = trendData;

  // Calculate statistics
  const nonZeroEnergies = last14Days.filter(day => day.energy > 0);
  const avgEnergy = nonZeroEnergies.length > 0 
    ? (nonZeroEnergies.reduce((sum, day) => sum + day.energy, 0) / nonZeroEnergies.length).toFixed(1)
    : '0';
  const daysLogged = nonZeroEnergies.length;
  const todayEnergy = (energyData as any)[getDateString(today)] || 0;

  // Create SVG path for the trend line
  const createPath = (data: Array<{ date: string; energy: number; dateStr: string }>) => {
    const width = 300;
    const height = 140;
    const padding = 20;
    
    const validData = data.filter(d => d.energy > 0);
    if (validData.length < 2) return '';
    
    const xStep = (width - padding * 2) / (data.length - 1);
    const yScale = (height - padding * 2) / 10; // Max energy is 10
    
    let path = '';
    validData.forEach((point, index) => {
      const dataIndex = data.findIndex(d => d.dateStr === point.dateStr);
      const x = padding + (dataIndex * xStep);
      const y = height - padding - (point.energy * yScale);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const pathData = createPath(last14Days);

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20">
      <h2 className="text-lg font-semibold text-white mb-4">
        {showAllTime ? 'All Time Energy Level Trends' : 'Energy Level Trends (14 Days)'}
      </h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{avgEnergy}</div>
          <div className="text-xs text-slate-400">Avg Energy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{daysLogged}</div>
          <div className="text-xs text-slate-400">Days Logged</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{todayEnergy}</div>
          <div className="text-xs text-slate-400">Today</div>
        </div>
      </div>

      {/* Trend Line Chart */}
      <div className="relative mb-4">
        <svg width="100%" height="180" viewBox="0 0 320 180" className="overflow-visible">
          {/* Grid lines */}
          {[...Array(6)].map((_, i) => (
            <line
              key={i}
              x1="20"
              y1={20 + (i * 24)}
              x2="280"
              y2={20 + (i * 24)}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Y-axis labels */}
          {[10, 8, 6, 4, 2, 0].map((value, i) => (
            <text
              key={value}
              x="290"
              y={20 + (i * 24) + 4}
              fill="rgba(148, 163, 184, 0.6)"
              fontSize="10"
              textAnchor="start"
            >
              {value}
            </text>
          ))}
          
          {/* Trend line */}
          {pathData && (
            <path
              d={pathData}
              stroke="url(#energyGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          
          {/* Data points - only show in 14-day view */}
          {!showAllTime && last14Days.filter(d => d.energy > 0).map((point, index) => {
            const dataIndex = last14Days.findIndex(d => d.dateStr === point.dateStr);
            const x = 20 + (dataIndex * (260 / (last14Days.length - 1)));
            const y = 160 - (point.energy * 12);
            
            return (
              <circle
                key={point.dateStr}
                cx={x}
                cy={y}
                r="4"
                fill="url(#energyGradient)"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Date labels */}
        <div className="flex justify-between mt-2 px-5">
          <span className="text-xs text-slate-400">{last14Days[0]?.date}</span>
          <span className="text-xs text-slate-400">{last14Days[Math.floor(last14Days.length / 2)]?.date}</span>
          <span className="text-xs text-slate-400">{last14Days[last14Days.length - 1]?.date}</span>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-sm text-yellow-400">Energy stable</span>
        </div>
      </div>
    </div>
  );
};

export function EnergyLevelPage() {
  const [, navigate] = useLocation();
  const { getEnergyLevel, setEnergyLevelForDate } = useEnergyLevel();
  const [energyLevel, setEnergyLevel] = useState(0);
  const [showAllTime, setShowAllTime] = useState(false);
  
  // Check if we came from wellness page
  const urlParams = new URLSearchParams(window.location.search);
  const fromWellness = urlParams.get('from') === 'wellness';
  
  const handleBack = () => {
    if (fromWellness) {
      navigate('/wellness');
    } else {
      navigate('/calendar');
    }
  };

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
    <div className="p-4 max-w-3xl mx-auto min-h-dvh" style={{ backgroundColor: 'hsl(222, 47%, 11%)', paddingBottom: 'var(--bottom-nav-padding)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-white transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-bold text-white">Energy Level</h1>
        <div className="w-5" />
      </div>

      <div className="space-y-6">
        {/* Energy Level Trend */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Energy Trends</h2>
            </div>
            <button
              onClick={() => setShowAllTime(!showAllTime)}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700 focus:outline-none"
              title={showAllTime ? "Show 14 Days" : "Show All Time"}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>
          <EnergyTrendVisualization showAllTime={showAllTime} />
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
              <div className="relative w-40 h-40">
                {(() => {
                  // Larger circle with more spacing
                  const size = 120;
                  const strokeWidth = 8;
                  const progress = energyLevel / 10;
                  const padding = strokeWidth + 4;
                  const svgSize = size + padding * 2;
                  const radius = (size / 2) + (strokeWidth / 2) + 2;
                  const circumference = radius * 2 * Math.PI;
                  const strokeDasharray = circumference;
                  const strokeDashoffset = isNaN(progress) ? circumference : circumference - (progress * circumference);
                  
                  return (
                    <>
                      {/* SVG Progress Ring - Exact workout logic */}
                      <svg
                        className="absolute transform -rotate-90"
                        width={svgSize}
                        height={svgSize}
                        style={{ top: 0, left: 0 }}
                      >
                        {/* Background ring - darker and thicker */}
                        <circle
                          cx={svgSize / 2}
                          cy={svgSize / 2}
                          r={radius}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth={strokeWidth + 2}
                          fill="none"
                        />
                        {/* Progress ring - Apple fitness style */}
                        <circle
                          cx={svgSize / 2}
                          cy={svgSize / 2}
                          r={radius}
                          stroke={energyLevel <= 3 ? '#ef4444' : energyLevel <= 6 ? '#fbbf24' : '#22c55e'}
                          strokeWidth={strokeWidth + 2}
                          fill="none"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-500 ease-out"
                          style={{
                            filter: energyLevel >= 8 ? 'drop-shadow(0 0 16px currentColor) drop-shadow(0 0 32px currentColor)' : 'drop-shadow(0 0 4px currentColor)',
                            opacity: 0.9
                          }}
                        />
                      </svg>
                      {/* Clickable button */}
                      <button
                        onClick={handleEnergyTap}
                        className="absolute rounded-full bg-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-slate-600"
                        style={{ 
                          width: size, 
                          height: size, 
                          top: padding, 
                          left: padding 
                        }}
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
                    </>
                  );
                })()}
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