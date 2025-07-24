import { useState, useRef } from 'react';
import { ChevronLeft, Upload, Download } from 'lucide-react';
import { useLocation } from 'wouter';
import { useControls } from '@/hooks/use-controls';


export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings, updateSetting } = useControls();

  
  // Function to get local date string (not UTC)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';

  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?dashboard=open');
    } else {
      navigate('/');
    }
  };

  // Export complete localStorage as JSON
  const exportSnapshot = () => {
    setIsExporting(true);
    try {
      const snapshot: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) snapshot[key] = value;
        }
      }
      
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitcircle-backup-${getLocalDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus(`Exported ${Object.keys(snapshot).length} items successfully!`);
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Export failed. Please try again.');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Import localStorage from JSON
  const importSnapshot = (file: File) => {
    setIsImporting(true);
    setStatus('Restoring data...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const snapshot = JSON.parse(content);
        
        if (typeof snapshot !== 'object' || !snapshot) {
          throw new Error('Invalid file format');
        }
        
        // Clear and restore localStorage
        localStorage.clear();
        let count = 0;
        Object.entries(snapshot).forEach(([key, value]) => {
          if (typeof value === 'string') {
            localStorage.setItem(key, value);
            count++;
          }
        });
        
        setStatus(`Successfully restored ${count} items!`);
        setTimeout(() => {
          setStatus('');
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        setStatus('Invalid backup file. Please select a valid FitCircle backup.');
        setTimeout(() => setStatus(''), 3000);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.onerror = () => {
      setStatus('Failed to read file.');
      setIsImporting(false);
    };
    
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importSnapshot(file);
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Settings</h1>
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      <div className="container mx-auto p-4 max-w-md">

        {/* Backup & Restore Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Complete Data Backup</h2>
          
          <div className="space-y-4">
            <button
              onClick={exportSnapshot}
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Creating Backup...' : 'Download Complete Backup'}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {isImporting ? 'Restoring...' : 'Restore from Backup'}
            </button>
            
            {status && (
              <div className={`p-3 rounded-xl text-sm text-center ${
                status.includes('Success') || status.includes('Exported') 
                  ? 'bg-green-900/50 text-green-300 border border-green-700' 
                  : 'bg-red-900/50 text-red-300 border border-red-700'
              }`}>
                {status}
              </div>
            )}
            
            <p className="text-xs text-slate-400 text-center">
              This creates a complete snapshot of all your FitCircle data. Restore replaces all current data.
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Controls</h2>
          
          <div className="space-y-4">
            {/* Hide Quote of the Day */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide Quote of the Day</p>
              </div>
              <button
                onClick={() => updateSetting('hideQuoteOfTheDay', !settings.hideQuoteOfTheDay)}
                className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideQuoteOfTheDay ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.hideQuoteOfTheDay ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Hide Today's Totals */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide Today's Totals</p>
              </div>
              <button
                onClick={() => updateSetting('hideTodaysTotals', !settings.hideTodaysTotals)}
                className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideTodaysTotals ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.hideTodaysTotals ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Hide Recent Activity */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide Recent Activity</p>
              </div>
              <button
                onClick={() => updateSetting('hideRecentActivity', !settings.hideRecentActivity)}
                className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideRecentActivity ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.hideRecentActivity ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}