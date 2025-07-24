import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Download, ToggleLeft, ToggleRight, Folder, FileText } from 'lucide-react';
import { useLocation } from 'wouter';
import { useControls } from '@/hooks/use-controls';


export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [showBackupLog, setShowBackupLog] = useState(false);
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [customBackupPath, setCustomBackupPath] = useState('');
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

  // Enhanced backup checking that also responds to data changes
  const checkAndPerformBackup = () => {
    const now = new Date();
    const lastBackupStr = localStorage.getItem('fitcircle_last_backup_date');
    const today = getLocalDateString();
    
    // Perform backup if:
    // 1. We haven't backed up today and it's past 11:00 PM, OR
    // 2. Data has changed significantly since last backup (regardless of time)
    const shouldBackupByTime = lastBackupStr !== today && now.getHours() >= 23;
    
    if (shouldBackupByTime) {
      performAutoBackup();
      localStorage.setItem('fitcircle_last_backup_date', today);
    } else {
      // Check for data changes even if it's not backup time
      performAutoBackup(); // This function now has built-in change detection
    }
  };

  const scheduleAutoBackup = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    
    const timeUntilBackup = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      performAutoBackup();
      localStorage.setItem('fitcircle_last_backup_date', getLocalDateString());
      // Schedule next backup
      scheduleAutoBackup();
    }, timeUntilBackup);
  };

  const performAutoBackup = () => {
    try {
      const snapshot: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) snapshot[key] = value;
        }
      }
      
      // Check if data has actually changed since last backup
      const currentDataHash = btoa(JSON.stringify(snapshot)).slice(0, 16);
      const lastBackupInfo = localStorage.getItem('fitcircle_last_auto_backup_info');
      let shouldBackup = true;
      
      if (lastBackupInfo) {
        try {
          const info = JSON.parse(lastBackupInfo);
          if (info.dataHash === currentDataHash) {
            shouldBackup = false; // No changes detected
          }
        } catch {}
      }
      
      if (shouldBackup) {
        const backupData = JSON.stringify(snapshot, null, 2);
        
        // Download backup with consistent filename (overwrites previous)
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // iOS Files app doesn't support custom paths in download attribute
        // The file will always save to Downloads folder first
        link.download = 'fitcircle-auto-backup.json';
        
        // Make download silent and iOS-compatible
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Save backup info for change detection
        const backupInfo = {
          timestamp: new Date().toISOString(),
          itemCount: Object.keys(snapshot).length,
          dataHash: currentDataHash
        };
        localStorage.setItem('fitcircle_last_auto_backup_info', JSON.stringify(backupInfo));
        
        console.log('✅ Auto backup completed with', Object.keys(snapshot).length, 'items');
        console.log('📱 File saved to Downloads - move to desired Files app location');
      }
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  };

  // Set up auto backup monitoring system
  useEffect(() => {
    const autoBackup = localStorage.getItem('fitcircle_auto_backup');
    const isEnabled = autoBackup === 'true';
    setAutoBackupEnabled(isEnabled);
    
    // Load custom backup path
    const savedPath = localStorage.getItem('fitcircle_backup_path');
    if (savedPath) setCustomBackupPath(savedPath);
    
    if (isEnabled) {
      // Initial backup check when app loads
      setTimeout(() => checkAndPerformBackup(), 2000);
      
      // Set up localStorage monitoring for data changes
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key: string, value: string) {
        const result = originalSetItem.call(this, key, value);
        
        // Only trigger backup for actual app data (not backup metadata)
        if (!key.startsWith('fitcircle_auto_backup') && 
            !key.startsWith('fitcircle_last_backup') &&
            isEnabled) {
          // Debounce backup calls to avoid too many downloads
          clearTimeout((window as any).backupTimeout);
          (window as any).backupTimeout = setTimeout(() => {
            checkAndPerformBackup();
          }, 5000); // Wait 5 seconds after last data change
        }
        
        return result;
      };
      
      // Schedule daily backup
      scheduleAutoBackup();
      
      // Check when app becomes visible (user returns to app)
      const handleVisibilityChange = () => {
        if (!document.hidden && isEnabled) {
          setTimeout(() => checkAndPerformBackup(), 1000);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        // Restore original localStorage.setItem
        localStorage.setItem = originalSetItem;
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if ((window as any).backupTimeout) {
          clearTimeout((window as any).backupTimeout);
        }
      };
    }
  }, [autoBackupEnabled]);





  const toggleAutoBackup = () => {
    const newState = !autoBackupEnabled;
    setAutoBackupEnabled(newState);
    localStorage.setItem('fitcircle_auto_backup', newState.toString());
    
    if (newState) {
      // Immediate backup when enabled
      setTimeout(() => {
        performAutoBackup();
        localStorage.setItem('fitcircle_last_backup_date', getLocalDateString());
      }, 500);
      scheduleAutoBackup();
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
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto p-4 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 text-white hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
        </div>

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



        {/* Auto Backup Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Auto Backup</h2>
            <button
              onClick={() => setShowPathSelector(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Set backup file path"
            >
              <Folder className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-medium">Smart Auto Backup</p>
            </div>
            <button
              onClick={toggleAutoBackup}
              className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                autoBackupEnabled ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full transition-transform ${
                  autoBackupEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>


          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">How it works:</strong> When enabled, auto backup monitors for data changes and downloads updated JSON files to your device's Downloads folder. 
              The backup file "fitcircle-auto-backup.json" will need to be manually moved to your desired Files app location for organization.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              <strong className="text-slate-300">iOS Note:</strong> Due to iOS security restrictions, files cannot be directly saved to custom paths in the Files app. 
              After download, you can move the file from Downloads to your preferred folder in the Files app.
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

      {/* Path Selector Modal */}
      {showPathSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">Set Backup Path</h3>
              <button
                onClick={() => setShowPathSelector(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Custom File Path (optional)
                </label>
                <input
                  type="text"
                  value={customBackupPath}
                  onChange={(e) => setCustomBackupPath(e.target.value)}
                  placeholder="e.g., FitCircle/Backups"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Leave empty to save directly to Files app root. Use forward slashes for folders.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('fitcircle_backup_path', customBackupPath);
                    setShowPathSelector(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors"
                >
                  Save Path
                </button>
                <button
                  onClick={() => {
                    setCustomBackupPath('');
                    localStorage.removeItem('fitcircle_backup_path');
                    setShowPathSelector(false);
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg transition-colors"
                >
                  Clear Path
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Current path:</strong> {customBackupPath || 'Files app root'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}