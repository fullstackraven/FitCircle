import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Download, Trash2, Clock, Shield, RotateCcw } from 'lucide-react';
import { useLocation } from 'wouter';
import { useControls } from '@/hooks/use-controls';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getTodayString } from '@/lib/date-utils';
import { STORAGE_KEYS } from '@/lib/storage-utils';


export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showEraseConfirm, setShowEraseConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings, updateSetting } = useControls();


  
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
      // Generate unique ID with date and time
      const now = new Date();
      const dateStr = getTodayString();
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS format
      const uniqueId = Math.random().toString(36).substr(2, 6); // 6-character random string
      link.download = `fitcircle-backup-${dateStr}-${timeStr}-${uniqueId}.json`;
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
        // File content processed for export
        
        const snapshot = JSON.parse(content);
        // Snapshot keys parsed successfully
        
        if (typeof snapshot !== 'object' || !snapshot) {
          throw new Error('Invalid file format');
        }
        
        // Clear localStorage first
        // Clearing localStorage...
        localStorage.clear();
        
        let count = 0;
        let errors = 0;
        
        for (const [key, value] of Object.entries(snapshot)) {
          // Processing key restoration
          
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

  // Force refresh - clear caches and reload
  const forceRefresh = async () => {
    try {
      setStatus('Clearing caches and refreshing...');
      
      // Clear all caches first
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Force a hard reload with cache busting
      setTimeout(() => {
        window.location.href = window.location.href.split('?')[0] + '?refresh=' + Date.now();
      }, 500);
    } catch (error) {
      console.error('Force refresh failed:', error);
      setStatus('Refresh failed. Please try again.');
      setTimeout(() => setStatus(''), 3000);
    }
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
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="fitcircle-page-title">Settings</h1>
          <div className="w-5"></div>
        </div>

        {/* Backup & Restore Section */}
        <div className="fitcircle-card-lg mb-6">
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

        {/* COMMENTED OUT: Auto-Backup Section removed per user request - no server calls */}
        {/* <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
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

          {autoBackupEnabled && (
            <div className="space-y-3">
              {lastAutoBackup && (
                <div className="text-xs text-slate-400">
                  Last backup: {new Date(lastAutoBackup).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
              
              <div className="text-xs text-slate-400">
                Backups are saved to the /backups folder in your codebase.
              </div>
            </div>
          )}
        </div> */}

        {/* Force Refresh Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">App Updates</h2>
          
          <div className="space-y-4">
            <button
              onClick={forceRefresh}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
              data-testid="button-force-refresh"
            >
              <RotateCcw className="w-5 h-5" />
              Force Refresh App
            </button>
            
            <p className="text-xs text-slate-400 text-center">
              Use this if the app looks broken or outdated. Clears all caches and reloads with fresh content.
            </p>
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

        {/* REMOVED: Bug reporting section removed per user request - no server calls */}
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