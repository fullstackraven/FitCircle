import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Download, ToggleLeft, ToggleRight, History, FileText, Cloud, Shield, User, LogOut, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useControls } from '@/hooks/use-controls';
import { 
  initializeSecureBackup, 
  signInWithDevice, 
  isSignedIn, 
  getCurrentUser, 
  signOut,
  getUserIdForEncryption,
  type SecureUser 
} from '@/lib/apple-auth';
import { 
  isEncryptionSupported,
  createEncryptedBackupFile,
  parseEncryptedBackupFile 
} from '@/lib/backup-encryption';
import { 
  saveToiCloudDrive,
  openCloudFilePicker,
  supportsCloudIntegration,
  getCloudInstructionText,
  createBackupFilename 
} from '@/lib/icloud-backup';

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [showBackupLog, setShowBackupLog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings, updateSetting } = useControls();

  // Secure backup states
  const [secureUser, setSecureUser] = useState<SecureUser | null>(null);
  const [secureSignedIn, setSecureSignedIn] = useState(false);
  const [isInitializingSecure, setIsInitializingSecure] = useState(false);
  const [isCreatingSecureBackup, setIsCreatingSecureBackup] = useState(false);
  const [isRestoringSecureBackup, setIsRestoringSecureBackup] = useState(false);
  const [secureBackupStatus, setSecureBackupStatus] = useState<string>('');
  
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

  // Check auto backup status on mount and set up scheduling
  useEffect(() => {
    const autoBackup = localStorage.getItem('fitcircle_auto_backup');
    const isEnabled = autoBackup === 'true';
    setAutoBackupEnabled(isEnabled);
    
    // Check secure backup status
    setSecureSignedIn(isSignedIn());
    setSecureUser(getCurrentUser());
    
    // If auto backup is enabled, check if we need to perform a backup
    if (isEnabled) {
      checkAndPerformBackup();
      scheduleAutoBackup();
      
      // Check every minute when the page is active
      const interval = setInterval(checkAndPerformBackup, 60000);
      
      // Also check when the page becomes visible again
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          checkAndPerformBackup();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  const checkAndPerformBackup = () => {
    const now = new Date();
    const lastBackupStr = localStorage.getItem('fitcircle_last_backup_date');
    const today = getLocalDateString();
    
    // If we haven't backed up today and it's past 11:00 PM (more flexible window), perform backup
    if (lastBackupStr !== today && now.getHours() >= 23) {
      performAutoBackup();
      localStorage.setItem('fitcircle_last_backup_date', today);
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
      
      // Store the backup data in localStorage for later access
      const backupData = JSON.stringify(snapshot, null, 2);
      const dateKey = getLocalDateString();
      localStorage.setItem(`fitcircle_auto_backup_${dateKey}`, backupData);
      
      // Also download immediately as before
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitcircle-auto-backup-${dateKey}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Track this automatic download
      trackBackupDownload(dateKey);
      
      // Clean up old backups (keep only last 7 days)
      cleanupOldBackups();
      
      console.log('✅ Auto backup completed with', Object.keys(snapshot).length, 'items');
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  };

  const cleanupOldBackups = () => {
    const today = new Date();
    for (let i = 8; i <= 30; i++) { // Remove backups older than 7 days
      const oldDate = new Date(today);
      oldDate.setDate(oldDate.getDate() - i);
      const oldDateKey = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;
      localStorage.removeItem(`fitcircle_auto_backup_${oldDateKey}`);
    }
  };

  const getStoredBackups = () => {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fitcircle_auto_backup_')) {
        const date = key.replace('fitcircle_auto_backup_', '');
        backups.push(date);
      }
    }
    return backups.sort().reverse(); // Most recent first
  };

  const downloadStoredBackup = (date: string) => {
    const backupData = localStorage.getItem(`fitcircle_auto_backup_${date}`);
    if (backupData) {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitcircle-auto-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Track this download
      trackBackupDownload(date);
    }
  };

  const trackBackupDownload = (date: string) => {
    const downloadLog = getBackupDownloadLog();
    const downloadEntry = {
      date,
      downloadedAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    // Add to the beginning of the array (most recent first)
    downloadLog.unshift(downloadEntry);
    
    // Keep only the last 30 downloads
    const trimmedLog = downloadLog.slice(0, 30);
    
    localStorage.setItem('fitcircle_backup_download_log', JSON.stringify(trimmedLog));
  };

  const getBackupDownloadLog = () => {
    const logStr = localStorage.getItem('fitcircle_backup_download_log');
    if (!logStr) return [];
    
    try {
      return JSON.parse(logStr);
    } catch {
      return [];
    }
  };

  const getLatestAvailableBackup = () => {
    const backups = getStoredBackups();
    return backups.length > 0 ? backups[0] : null;
  };

  const downloadLatestBackup = () => {
    const latestBackup = getLatestAvailableBackup();
    if (latestBackup) {
      downloadStoredBackup(latestBackup);
    }
  };

  const toggleAutoBackup = () => {
    const newState = !autoBackupEnabled;
    setAutoBackupEnabled(newState);
    localStorage.setItem('fitcircle_auto_backup', newState.toString());
    
    if (newState) {
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

  // Secure Backup Functions
  const handleSecureSignIn = async () => {
    setIsInitializingSecure(true);
    setSecureBackupStatus('Setting up secure backup...');
    
    try {
      await initializeSecureBackup();
      const result = await signInWithDevice();
      
      setSecureSignedIn(true);
      setSecureUser(result.user || null);
      setSecureBackupStatus('Secure backup ready!');
      
      setTimeout(() => setSecureBackupStatus(''), 3000);
    } catch (error) {
      setSecureBackupStatus('Failed to set up secure backup. Please try again.');
      setTimeout(() => setSecureBackupStatus(''), 3000);
    } finally {
      setIsInitializingSecure(false);
    }
  };

  const handleSecureSignOut = () => {
    signOut();
    setSecureSignedIn(false);
    setSecureUser(null);
    setSecureBackupStatus('Signed out successfully');
    setTimeout(() => setSecureBackupStatus(''), 3000);
  };

  const createSecureBackup = async () => {
    if (!secureSignedIn) {
      setSecureBackupStatus('Please set up secure backup first');
      setTimeout(() => setSecureBackupStatus(''), 3000);
      return;
    }

    const userId = getUserIdForEncryption();
    if (!userId) {
      setSecureBackupStatus('No encryption key available');
      setTimeout(() => setSecureBackupStatus(''), 3000);
      return;
    }

    setIsCreatingSecureBackup(true);
    setSecureBackupStatus('Creating encrypted backup...');

    try {
      // Create snapshot of all localStorage data
      const snapshot: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) snapshot[key] = value;
        }
      }

      // Create encrypted backup file
      const encryptedBlob = await createEncryptedBackupFile(snapshot, userId);
      const filename = createBackupFilename(true);

      // Save to iCloud Drive
      const success = await saveToiCloudDrive(encryptedBlob, filename);
      
      if (success) {
        setSecureBackupStatus(`Secure backup created! ${Object.keys(snapshot).length} items encrypted.`);
      } else {
        setSecureBackupStatus('Backup created but failed to save to iCloud Drive');
      }
      
      setTimeout(() => setSecureBackupStatus(''), 4000);
    } catch (error) {
      setSecureBackupStatus('Failed to create secure backup. Please try again.');
      setTimeout(() => setSecureBackupStatus(''), 3000);
    } finally {
      setIsCreatingSecureBackup(false);
    }
  };

  const restoreSecureBackup = async () => {
    if (!secureSignedIn) {
      setSecureBackupStatus('Please set up secure backup first');
      setTimeout(() => setSecureBackupStatus(''), 3000);
      return;
    }

    const userId = getUserIdForEncryption();
    if (!userId) {
      setSecureBackupStatus('No decryption key available');
      setTimeout(() => setSecureBackupStatus(''), 3000);
      return;
    }

    setIsRestoringSecureBackup(true);
    setSecureBackupStatus('Choose encrypted backup file...');

    try {
      const file = await openCloudFilePicker();
      setSecureBackupStatus('Decrypting backup...');
      
      const decryptedData = await parseEncryptedBackupFile(file, userId);
      
      // Clear and restore localStorage
      localStorage.clear();
      let count = 0;
      Object.entries(decryptedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
        count++;
      });
      
      setSecureBackupStatus(`Successfully restored ${count} items from secure backup!`);
      setTimeout(() => {
        setSecureBackupStatus('');
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      setSecureBackupStatus('Failed to restore backup. Check that the file is valid.');
      setTimeout(() => setSecureBackupStatus(''), 4000);
    } finally {
      setIsRestoringSecureBackup(false);
    }
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

        {/* Apple iCloud Secure Backup Section */}
        {isEncryptionSupported() && supportsCloudIntegration() && (
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Secure Cloud Backup</h2>
            </div>
            
            <p className="text-sm text-slate-400 mb-6">
              Set up secure backup to create encrypted backups that only you can access. 
              {getCloudInstructionText()}
            </p>
            
            {/* Secure Backup Status */}
            <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-white">
                      {secureSignedIn ? 'Secure backup enabled' : 'Secure backup not set up'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {secureSignedIn ? 'Ready for secure backups' : 'Set up to enable encrypted backups'}
                    </p>
                  </div>
                </div>
                
                {secureSignedIn ? (
                  <button
                    onClick={handleSecureSignOut}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Reset
                  </button>
                ) : (
                  <button
                    onClick={handleSecureSignIn}
                    disabled={isInitializingSecure}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Shield className="w-3 h-3" />
                    {isInitializingSecure ? 'Setting up...' : 'Set Up'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Secure Backup Actions */}
            <div className="space-y-3">
              <button
                onClick={createSecureBackup}
                disabled={!secureSignedIn || isCreatingSecureBackup}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Lock className="w-5 h-5" />
                {isCreatingSecureBackup ? 'Creating Encrypted Backup...' : 'Create Secure Backup'}
              </button>
              
              <button
                onClick={restoreSecureBackup}
                disabled={!secureSignedIn || isRestoringSecureBackup}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:opacity-50 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-5 h-5" />
                {isRestoringSecureBackup ? 'Restoring from Backup...' : 'Restore Secure Backup'}
              </button>
            </div>
            
            {secureBackupStatus && (
              <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
                secureBackupStatus.includes('Success') || secureBackupStatus.includes('created') || secureBackupStatus.includes('restored')
                  ? 'bg-green-900/50 text-green-300 border border-green-700' 
                  : secureBackupStatus.includes('Failed') || secureBackupStatus.includes('Error')
                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                  : 'bg-blue-900/50 text-blue-300 border border-blue-700'
              }`}>
                {secureBackupStatus}
              </div>
            )}
            
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Security:</strong> Your data is encrypted with AES-256 using your device as the key. 
                Only your device can decrypt your backups. We never store your encryption keys or have access to your unencrypted data.
              </p>
            </div>
          </div>
        )}

        {/* Auto Backup Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Auto Backup</h2>
            <button
              onClick={() => setShowBackupLog(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="View backup download log"
            >
              <History className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-medium">Daily Auto Backup</p>
              <p className="text-sm text-slate-400">Automatically backup at 11:59 PM daily</p>
            </div>
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

          {/* Download Latest Auto Backup Button */}
          {getLatestAvailableBackup() && (
            <div className="mb-4">
              <button
                onClick={downloadLatestBackup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Latest Auto Backup ({getLatestAvailableBackup()})
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                Latest auto backup available from {getLatestAvailableBackup()}
              </p>
            </div>
          )}

          {/* Recent Auto Backups */}
          {getStoredBackups().length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-600">
              <div className="text-sm font-medium text-slate-300 mb-3">Recent Auto Backups</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getStoredBackups().slice(0, 7).map((date) => (
                  <div key={date} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                    <span className="text-sm text-slate-300">{date}</span>
                    <button
                      onClick={() => downloadStoredBackup(date)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Auto backups are kept for 7 days
              </div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Controls</h2>
          
          <div className="space-y-4">
            {/* Hide Quote of the Day */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide Quote of the Day</p>
                <p className="text-sm text-slate-400">Remove inspirational quotes from home page</p>
              </div>
              <button
                onClick={() => updateSetting('hideQuoteOfTheDay', !settings.hideQuoteOfTheDay)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.hideQuoteOfTheDay ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.hideQuoteOfTheDay ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Hide Today's Totals */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide Today's Totals</p>
                <p className="text-sm text-slate-400">Remove workout summary from home page</p>
              </div>
              <button
                onClick={() => updateSetting('hideTodaysTotals', !settings.hideTodaysTotals)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.hideTodaysTotals ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.hideTodaysTotals ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Hide Recent Activity */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide Recent Activity</p>
                <p className="text-sm text-slate-400">Remove recent workouts from home page</p>
              </div>
              <button
                onClick={() => updateSetting('hideRecentActivity', !settings.hideRecentActivity)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.hideRecentActivity ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.hideRecentActivity ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Download Log Modal */}
      {showBackupLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">Backup Download Log</h3>
              <button
                onClick={() => setShowBackupLog(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {getBackupDownloadLog().length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No backups downloaded yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Downloaded auto backups will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getBackupDownloadLog().map((entry: any, index: number) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">
                            Backup: {entry.date}
                          </p>
                          <p className="text-slate-400 text-xs">
                            Downloaded: {new Date(entry.downloadedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-green-400">
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-600">
              <p className="text-xs text-slate-500 text-center">
                Shows the last 30 backup downloads
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}