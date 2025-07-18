
import { useState, useEffect } from 'react';
import { ArrowLeft, Download, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = () => {
    setIsExporting(true);
    
    // Collect all app data
    const data = {
      profile: {
        name: localStorage.getItem('fitcircle_username'),
        age: localStorage.getItem('fitcircle_age'),
        birthday: localStorage.getItem('fitcircle_birthday'),
        fitnessGoal: localStorage.getItem('fitcircle_fitness_goal'),
      },
      measurements: {
        weight: localStorage.getItem('fitcircle_weight'),
        height: localStorage.getItem('fitcircle_height'),
        bodyFat: localStorage.getItem('fitcircle_body_fat'),
        neck: localStorage.getItem('fitcircle_neck'),
        chest: localStorage.getItem('fitcircle_chest'),
        waist: localStorage.getItem('fitcircle_waist'),
        hips: localStorage.getItem('fitcircle_hips'),
        bicep: localStorage.getItem('fitcircle_bicep'),
        forearm: localStorage.getItem('fitcircle_forearm'),
        thigh: localStorage.getItem('fitcircle_thigh'),
        calf: localStorage.getItem('fitcircle_calf'),
      },
      workouts: {},
      settings: {
        theme: localStorage.getItem('fitcircle_theme'),
      },
      exportDate: new Date().toISOString(),
    };

    // Get all workout-related data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('fitcircle_workouts') || key.startsWith('fitcircle_logs')) {
        data.workouts[key] = localStorage.getItem(key);
      }
    });

    // Create and download CSV
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `fitcircle-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const convertToCSV = (data: any) => {
    const rows = [];
    rows.push(['Category', 'Field', 'Value']);
    
    // Profile data
    Object.entries(data.profile).forEach(([key, value]) => {
      rows.push(['Profile', key, value || '']);
    });
    
    // Measurements data
    Object.entries(data.measurements).forEach(([key, value]) => {
      rows.push(['Measurements', key, value || '']);
    });
    
    // Workout data
    Object.entries(data.workouts).forEach(([key, value]) => {
      rows.push(['Workouts', key, value || '']);
    });
    
    // Settings data
    Object.entries(data.settings).forEach(([key, value]) => {
      rows.push(['Settings', key, value || '']);
    });
    
    return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const refreshData = () => {
    // This would typically sync with a server, for now just reload the page
    window.location.reload();
  };

  const eraseAllData = () => {
    // Clear all FitCircle related localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('fitcircle_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Navigate back to home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
          <h1 className="text-xl font-semibold">Settings</h1>
          <div className="w-16"></div>
        </div>

        {/* Manage Data Section */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6 text-white">Manage Data</h2>
          
          <div className="space-y-4">
            {/* Export Data */}
            <Button
              onClick={exportData}
              disabled={isExporting}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </Button>

            {/* Refresh Data */}
            <Button
              onClick={refreshData}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh All Data</span>
            </Button>

            {/* Erase All Data */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Erase All Data</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center space-x-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Erase All Data</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-300">
                    This action cannot be undone. This will permanently delete all your profile data, 
                    measurements, workout history, and settings from this device.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={eraseAllData}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, erase everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Additional Settings can be added here */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            More settings options coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
