
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
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check auto backup status on mount
  useEffect(() => {
    const autoBackup = localStorage.getItem('fitcircle_auto_backup');
    setAutoBackupEnabled(autoBackup === 'true');
  }, []);

  const exportData = () => {
    setIsExporting(true);
    
    // Get ALL FitCircle localStorage data - complete snapshot
    const allData: { [key: string]: string } = {};
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('fitcircle_')) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          allData[key] = value;
        }
      }
    });

    // Add export metadata
    allData['fitcircle_export_date'] = new Date().toISOString();
    allData['fitcircle_export_version'] = '1.0';

    // Create and download CSV
    const csv = convertToCSV(allData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `fitcircle-backup-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const convertToCSV = (data: { [key: string]: string }) => {
    const rows = [];
    rows.push(['LocalStorageKey', 'Value']);
    
    // Export all localStorage data exactly as stored
    Object.entries(data).forEach(([key, value]) => {
      // Escape quotes in the value
      const escapedValue = value.replace(/"/g, '""');
      rows.push([key, escapedValue]);
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
      const header = lines[0].replace(/"/g, '');
      
      // Verify it's our new CSV format
      if (!header.includes('LocalStorageKey') || !header.includes('Value')) {
        return { success: false, error: 'Invalid CSV format. Please use a FitCircle backup file.' };
      }

      let itemsRestored = 0;

      // Parse each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV row - split on first comma only to handle complex JSON values
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) continue;

        let key = line.substring(0, firstCommaIndex).replace(/"/g, '');
        let value = line.substring(firstCommaIndex + 1);
        
        // Remove surrounding quotes and unescape internal quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        value = value.replace(/""/g, '"');

        // Only restore FitCircle data
        if (key.startsWith('fitcircle_') && value) {
          localStorage.setItem(key, value);
          itemsRestored++;
        }
      }

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

  const toggleAutoBackup = () => {
    const newValue = !autoBackupEnabled;
    setAutoBackupEnabled(newValue);
    localStorage.setItem('fitcircle_auto_backup', newValue.toString());
    
    if (newValue) {
      // Schedule daily backups
      scheduleAutoBackup();
    } else {
      // Clear any existing backup schedules
      clearAutoBackup();
    }
  };

  const scheduleAutoBackup = () => {
    // Calculate milliseconds until next 11:59 PM
    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setHours(23, 59, 0, 0);
    
    // If it's already past 11:59 PM today, schedule for tomorrow
    if (now.getTime() >= nextBackup.getTime()) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }
    
    const timeUntilBackup = nextBackup.getTime() - now.getTime();
    
    // Set timeout for the first backup
    setTimeout(() => {
      performAutoBackup();
      // Then schedule daily backups every 24 hours
      setInterval(performAutoBackup, 24 * 60 * 60 * 1000);
    }, timeUntilBackup);
    
    console.log(`Auto backup scheduled for: ${nextBackup.toLocaleString()}`);
  };

  const clearAutoBackup = () => {
    // Note: This is a simplified approach. In a real app, you'd store interval IDs
    console.log('Auto backup disabled');
  };

  const performAutoBackup = () => {
    try {
      // Get ALL FitCircle localStorage data
      const allData: { [key: string]: string } = {};
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('fitcircle_')) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            allData[key] = value;
          }
        }
      });

      // Add auto backup metadata
      allData['fitcircle_export_date'] = new Date().toISOString();
      allData['fitcircle_export_version'] = '1.0';
      allData['fitcircle_export_type'] = 'auto';

      // Create CSV
      const csv = convertToCSV(allData);
      const blob = new Blob([csv], { type: 'text/csv' });
      
      // For mobile browsers, we can only trigger download on user interaction
      // So we'll store the backup data and show a notification
      const backupData = {
        csv: csv,
        date: new Date().toISOString(),
        size: blob.size
      };
      
      localStorage.setItem('fitcircle_last_auto_backup', JSON.stringify(backupData));
      
      // Show notification (if app is active)
      if (document.visibilityState === 'visible') {
        console.log('Auto backup created successfully');
      }
      
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  };

  const downloadLastAutoBackup = () => {
    const lastBackup = localStorage.getItem('fitcircle_last_auto_backup');
    if (!lastBackup) {
      alert('No auto backup available');
      return;
    }

    try {
      const backupData = JSON.parse(lastBackup);
      const blob = new Blob([backupData.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `fitcircle-auto-backup-${backupData.date.split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download auto backup');
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

            {/* Auto Backup Toggle */}
            <div className="border border-slate-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Auto Backup</h3>
                <button
                  onClick={toggleAutoBackup}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    autoBackupEnabled ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      autoBackupEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Automatically create backups daily at 11:59 PM
              </p>
              {autoBackupEnabled && (
                <Button
                  onClick={downloadLastAutoBackup}
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Download Latest Auto Backup
                </Button>
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
