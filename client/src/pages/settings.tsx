import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Upload, Download, Trash2, Bug, Clock, Shield } from 'lucide-react';
import { useLocation } from 'wouter';
import { useControls } from '@/hooks/use-controls';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showEraseConfirm, setShowEraseConfirm] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => {
    return localStorage.getItem('fitcircle_auto_backup_enabled') === 'true';
  });
  const [lastAutoBackup, setLastAutoBackup] = useState(() => {
    return localStorage.getItem('fitcircle_last_auto_backup') || null;
  });

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

  // Function to perform auto-backup
  const performAutoBackup = async () => {
    try {
      // Get all localStorage data (same as manual export)
      const completeSnapshot: Record<string, any> = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            try {
              completeSnapshot[key] = JSON.parse(value);
            } catch {
              completeSnapshot[key] = value;
            }
          }
        }
      }

      // Send backup to server
      const response = await fetch('/api/save-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupData: completeSnapshot }),
      });

      if (response.ok) {
        const result = await response.json();
        const now = new Date().toISOString();
        localStorage.setItem('fitcircle_last_auto_backup', now);
        setLastAutoBackup(now);
        console.log('Auto-backup completed successfully:', result.filename);
        return true;
      } else {
        throw new Error('Failed to save auto-backup');
      }
    } catch (error) {
      console.error('Auto-backup failed:', error);
      return false;
    }
  };

  // Check if backup needed and schedule next one
  const scheduleAutoBackup = () => {
    if (!autoBackupEnabled) return;

    const now = new Date();
    const today = getLocalDateString();
    const lastBackupDate = lastAutoBackup ? new Date(lastAutoBackup).toLocaleDateString('en-CA') : null;

    // If we haven't backed up today, do it now
    if (lastBackupDate !== today) {
      performAutoBackup();
    }

    // Calculate time until next midnight
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule next backup
    setTimeout(() => {
      if (localStorage.getItem('fitcircle_auto_backup_enabled') === 'true') {
        performAutoBackup();
        // Schedule recurring daily backups
        setInterval(() => {
          if (localStorage.getItem('fitcircle_auto_backup_enabled') === 'true') {
            performAutoBackup();
          }
        }, 24 * 60 * 60 * 1000); // 24 hours
      }
    }, msUntilMidnight);
  };

  // Toggle auto-backup
  const handleAutoBackupToggle = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('fitcircle_auto_backup_enabled', enabled.toString());
    
    if (enabled) {
      scheduleAutoBackup();
      setStatus('Auto-backup enabled! Nightly backups will save to your codebase.');
    } else {
      setStatus('Auto-backup disabled.');
    }
    
    setTimeout(() => setStatus(''), 3000);
  };

  // Initialize auto-backup scheduling on component mount
  useEffect(() => {
    if (autoBackupEnabled) {
      scheduleAutoBackup();
    }
  }, [autoBackupEnabled]);
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';

  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?dashboard=open');
    } else {
      navigate('/');
    }
  };

  // Export complete localStorage data as JSON
  const exportSnapshot = () => {
    setIsExporting(true);
    try {
      // Get all localStorage data
      const completeSnapshot: Record<string, any> = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            try {
              // Try to parse JSON values, keep strings as-is
              completeSnapshot[key] = JSON.parse(value);
            } catch {
              completeSnapshot[key] = value;
            }
          }
        }
      }
      
      const blob = new Blob([JSON.stringify(completeSnapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitcircle-backup-${getLocalDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus(`Exported ${Object.keys(completeSnapshot).length} items successfully!`);
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setStatus('Export failed. Please try again.');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Import data to localStorage from JSON
  const importSnapshot = (file: File) => {
    setIsImporting(true);
    setStatus('Restoring data...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        console.log('File content length:', content.length);
        
        const snapshot = JSON.parse(content);
        console.log('Parsed snapshot keys:', Object.keys(snapshot));
        
        if (typeof snapshot !== 'object' || !snapshot) {
          throw new Error('Invalid file format');
        }
        
        // Clear localStorage first
        console.log('Clearing localStorage...');
        localStorage.clear();
        
        let count = 0;
        let errors = 0;
        
        for (const [key, value] of Object.entries(snapshot)) {
          console.log(`Processing key: ${key}, type: ${typeof value}`);
          
          // Skip invalid keys that contain functions or are clearly invalid
          if (typeof value === 'function' || key === 'setItem' || key.includes('function')) {
            console.log(`Skipping invalid key during restore: ${key}`);
            continue;
          }
          
          try {
            // Store all data in localStorage
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, stringValue);
            count++;
            console.log(`Restored localStorage key: ${key}`);
          } catch (error) {
            console.error(`Failed to restore key "${key}":`, error);
            errors++;
          }
        }
        
        console.log(`Restoration complete: ${count} items restored, ${errors} errors`);
        setStatus(`Successfully restored ${count} items!${errors > 0 ? ` (${errors} errors)` : ''}`);
        
        setTimeout(() => {
          setStatus('');
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        console.error('Import failed:', error);
        setStatus(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => setStatus(''), 5000);
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

  // Erase all data function
  const eraseAllData = () => {
    try {
      // Clear all localStorage data
      localStorage.clear();
      setStatus('All data has been erased successfully!');
      setShowEraseConfirm(false);
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        setStatus('');
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Failed to erase data:', error);
      setStatus('Failed to erase data. Please try again.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
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

        {/* Auto-Backup Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Auto-Backup</h2>
            <button
              onClick={() => handleAutoBackupToggle(!autoBackupEnabled)}
              className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                autoBackupEnabled ? 'bg-green-400' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full transition-transform ${
                  autoBackupEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-6">Controls</h2>
          
          <div className="space-y-4">
            {/* Hide Quote of the Day */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-small">Hide Quote of the Day</p>
              </div>
              <button
                onClick={() => updateSetting('hideQuoteOfTheDay', !settings.hideQuoteOfTheDay)}
                className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideQuoteOfTheDay ? 'bg-green-400' : 'bg-slate-600'
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
                <p className="text-white font-small">Hide Today's Totals</p>
              </div>
              <button
                onClick={() => updateSetting('hideTodaysTotals', !settings.hideTodaysTotals)}
                className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideTodaysTotals ? 'bg-green-400' : 'bg-slate-600'
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
                <p className="text-white font-small">Hide Recent Activity</p>
              </div>
              <button
                onClick={() => updateSetting('hideRecentActivity', !settings.hideRecentActivity)}
                className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideRecentActivity ? 'bg-green-400' : 'bg-slate-600'
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

        {/* Report Bug Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Help & Feedback</h2>
          
          <button
            onClick={() => navigate('/report-bug')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
          >
            <Bug className="w-5 h-5" />
            Report a Problem
          </button>
          
          <p className="text-xs text-slate-400 text-center mt-3">
            Found an issue? Help us improve the app by reporting bugs and problems.
          </p>
        </div>
        {/* Erase All Data Section */}
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>

          <div className="space-y-4">
            {!showEraseConfirm ? (
              <>
                <button
                  onClick={() => setShowEraseConfirm(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Erase All Data
                </button>
              </>
            ) : (
              <>
                <p className="text-red-200 text-sm font-medium mb-4">
                  ⚠️ Are you absolutely sure? This action cannot be undone!
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={eraseAllData}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Yes, Erase Everything
                  </button>
                  <button
                    onClick={() => setShowEraseConfirm(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}