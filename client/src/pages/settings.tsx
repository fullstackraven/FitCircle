
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Upload, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
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
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Get all workout-related data, meditation logs, and fasting logs
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('fitcircle_workouts') || 
          key.startsWith('fitcircle_logs') || 
          key.startsWith('fitcircle_meditation_logs') ||
          key.startsWith('fitcircle_fasting_logs')) {
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const result = parseCSVAndRestore(csv);
        
        if (result.success) {
          setImportStatus(`Successfully imported ${result.itemsRestored} data items!`);
          setTimeout(() => {
            setImportStatus('');
            navigate('/'); // Go back to home to see the restored data
          }, 2000);
        } else {
          setImportStatus(`Import failed: ${result.error}`);
        }
      } catch (error) {
        setImportStatus('Failed to read file. Please ensure it\'s a valid FitCircle CSV export.');
      } finally {
        setIsImporting(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setImportStatus('Failed to read file.');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const parseCSVAndRestore = (csv: string) => {
    try {
      const lines = csv.split('\n');
      const header = lines[0];
      
      // Verify it's our CSV format
      if (!header.includes('Category') || !header.includes('Field') || !header.includes('Value')) {
        return { success: false, error: 'Invalid CSV format. Please use a FitCircle export file.' };
      }

      let itemsRestored = 0;
      const dataToRestore: { [key: string]: string } = {};

      // Parse each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV row (handle quoted values)
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches || matches.length < 3) continue;

        const category = matches[0].replace(/"/g, '');
        const field = matches[1].replace(/"/g, '');
        const value = matches[2].replace(/"/g, '');

        if (!value) continue;

        // Convert back to localStorage keys
        if (category === 'Profile') {
          dataToRestore[`fitcircle_${field}`] = value;
          itemsRestored++;
        } else if (category === 'Measurements') {
          dataToRestore[`fitcircle_${field}`] = value;
          itemsRestored++;
        } else if (category === 'Workouts') {
          dataToRestore[field] = value; // Workout keys already have full fitcircle_ prefix
          itemsRestored++;
        } else if (category === 'Settings') {
          dataToRestore[`fitcircle_${field}`] = value;
          itemsRestored++;
        }
      }

      // Restore data to localStorage
      Object.entries(dataToRestore).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      return { success: true, itemsRestored };
    } catch (error) {
      return { success: false, error: 'Failed to parse CSV data.' };
    }
  };

  const refreshData = () => {
    // Clear service worker cache and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
        // Clear all caches
        if ('caches' in window) {
          caches.keys().then(function(names) {
            return Promise.all(names.map(function(name) {
              return caches.delete(name);
            }));
          }).then(function() {
            window.location.reload(true);
          });
        } else {
          window.location.reload(true);
        }
      });
    } else {
      window.location.reload(true);
    }
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
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
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

            {/* Import Data */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Button
                onClick={handleImportClick}
                disabled={isImporting}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
              </Button>
              {importStatus && (
                <p className={`text-sm mt-2 ${importStatus.includes('failed') || importStatus.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                  {importStatus}
                </p>
              )}
            </div>

            {/* Refresh Data */}
            <Button
              onClick={refreshData}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Force App Update</span>
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
