import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Download } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    navigate('/');
  };

  // Export complete localStorage snapshot
  const exportLocalStorageSnapshot = () => {
    setIsExporting(true);
    
    try {
      // Create complete localStorage snapshot
      const snapshot: { [key: string]: string } = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            snapshot[key] = value;
          }
        }
      }
      
      // Create downloadable file
      const dataStr = JSON.stringify(snapshot, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `fitcircle-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Exported localStorage snapshot with', Object.keys(snapshot).length, 'items');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Processing CSV file...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Check if it's a JSON snapshot or CSV
        if (file.name.endsWith('.json')) {
          const result = restoreLocalStorageSnapshot(content);
          if (result.success) {
            setImportStatus(`Successfully restored ${result.itemsRestored} localStorage items!`);
            setTimeout(() => {
              setImportStatus('');
              window.location.href = '/';
            }, 2000);
          } else {
            setImportStatus(`Import failed: ${result.error}`);
          }
        } else {
          // Fallback to CSV parsing
          const result = parseCSVAndRestore(content);
          if (result.success) {
            setImportStatus(`Successfully imported ${result.itemsRestored} data items!`);
            setTimeout(() => {
              setImportStatus('');
              window.location.href = '/';
            }, 2000);
          } else {
            setImportStatus(`Import failed: ${result.error}`);
          }
        }
      } catch (error) {
        setImportStatus('Failed to read file. Please ensure it\'s a valid backup file.');
      } finally {
        setIsImporting(false);
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

  // Restore complete localStorage from JSON snapshot
  const restoreLocalStorageSnapshot = (jsonContent: string): { success: boolean; error?: string; itemsRestored?: number } => {
    try {
      const snapshot = JSON.parse(jsonContent);
      
      if (typeof snapshot !== 'object' || snapshot === null) {
        return { success: false, error: 'Invalid backup file format. Expected JSON object.' };
      }
      
      // Clear current localStorage
      localStorage.clear();
      
      let itemsRestored = 0;
      
      // Restore all items from snapshot
      Object.entries(snapshot).forEach(([key, value]) => {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
          itemsRestored++;
        }
      });
      
      console.log('✅ Restored localStorage snapshot with', itemsRestored, 'items');
      console.log('🔍 Restored keys:', Object.keys(snapshot));
      
      return { success: true, itemsRestored };
    } catch (error) {
      console.error('JSON parsing error:', error);
      return { success: false, error: 'Failed to parse backup file. Please ensure it\'s a valid JSON backup.' };
    }
  };

  const parseCSVAndRestore = (csv: string): { success: boolean; error?: string; itemsRestored?: number } => {
    try {
      const lines = csv.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, error: 'Invalid CSV format. File appears to be empty or corrupted.' };
      }
      
      const header = lines[0].replace(/"/g, '').toLowerCase();
      let itemsRestored = 0;
      
      console.log('🔍 Processing CSV with header:', header);
      
      // Check for your specific format: DataType, Date, Time, Category, Value, LiquidType, Notes
      if (header.includes('datatype') || header.includes('type')) {
        const hydrationData: any = { logs: {} };
        const fastingLogs: any = {};
        const meditationSessions: any = [];
        const goalsData: any = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(val => val.replace(/"/g, ''));
          const [type, date, time, category, value, liquidType, notes] = values;
          
          console.log('🔍 Processing:', { type, date, time, category, value, liquidType, notes });
          
          if (type === 'Hydration' && value) {
            if (!hydrationData.logs[date]) hydrationData.logs[date] = { total: 0, entries: [] };
            const amount = parseFloat(value.replace('oz', '')) || 0;
            hydrationData.logs[date].total += amount;
            
            if (!hydrationData.logs[date].entries) hydrationData.logs[date].entries = [];
            hydrationData.logs[date].entries.push({
              amount: amount,
              liquidType: liquidType || 'Water',
              time: time || '12:00 PM'
            });
            itemsRestored++;
          }
          else if (type === 'Fasting' && value) {
            const duration = parseInt(value.replace('hrs', '')) || 0;
            fastingLogs[date] = { 
              duration, 
              startTime: notes?.split('Start: ')[1]?.split(',')[0] || '',
              endTime: notes?.split('End: ')[1] || '' 
            };
            itemsRestored++;
          }
          else if (type === 'Meditation' && value) {
            const duration = parseInt(value.replace('min', '')) || 0;
            if (duration > 0) {
              meditationSessions.push({
                date: date,
                duration: duration,
                completedAt: time || '12:00 PM',
                notes: notes || ''
              });
              itemsRestored++;
            }
          }
          else if (type === 'Goal' && category && value) {
            goalsData[category.toLowerCase()] = {
              target: value,
              current: 0,
              unit: value.includes('oz') ? 'oz' : value.includes('hrs') ? 'hrs' : value.includes('lbs') ? 'lbs' : ''
            };
            itemsRestored++;
          }
        }
        
        // Store all the imported data
        if (Object.keys(hydrationData.logs).length > 0) {
          localStorage.setItem('fitcircle_hydration_data', JSON.stringify(hydrationData));
          console.log('✅ Stored hydration data:', hydrationData);
        }
        if (Object.keys(fastingLogs).length > 0) {
          localStorage.setItem('fitcircle_fasting_logs', JSON.stringify(fastingLogs));
          console.log('✅ Stored fasting data:', fastingLogs);
        }
        if (meditationSessions.length > 0) {
          localStorage.setItem('fitcircle_meditation_sessions', JSON.stringify(meditationSessions));
          console.log('✅ Stored meditation data:', meditationSessions);
        }
        if (Object.keys(goalsData).length > 0) {
          localStorage.setItem('fitcircle_goals_data', JSON.stringify(goalsData));
          console.log('✅ Stored goals data:', goalsData);
        }
        
        console.log('✅ Total items restored:', itemsRestored);
      }
      else {
        return { success: false, error: 'Unrecognized CSV format. Please use a FitCircle backup file.' };
      }

      if (itemsRestored === 0) {
        return { success: false, error: 'No valid FitCircle data found in the CSV file.' };
      }

      return { success: true, itemsRestored };
    } catch (error) {
      console.error('CSV parsing error:', error);
      return { success: false, error: 'Failed to parse CSV data. Please check the file format.' };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
        </div>

        {/* Backup & Restore Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Backup & Restore</h2>
          
          <div className="space-y-4">
            {/* Export Section */}
            <Button
              onClick={exportLocalStorageSnapshot}
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-5 h-5 mr-2" />
              {isExporting ? 'Creating Backup...' : 'Download Complete Backup'}
            </Button>
            
            {/* Import Section */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <Button
              onClick={handleFileSelect}
              disabled={isImporting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-5 h-5 mr-2" />
              {isImporting ? 'Restoring...' : 'Restore from Backup'}
            </Button>
            
            {importStatus && (
              <div className={`p-3 rounded-xl text-sm ${
                importStatus.includes('Success') 
                  ? 'bg-green-900/50 text-green-300 border border-green-700' 
                  : 'bg-red-900/50 text-red-300 border border-red-700'
              }`}>
                {importStatus}
              </div>
            )}
            
            <p className="text-xs text-slate-400">
              Backup creates a complete snapshot of all your data. Restore will replace all current data with the backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}