// iCloud Drive integration for FitCircle backups
// Uses Web Share API and file picker for iCloud Drive integration

export interface CloudBackupOptions {
  data: Record<string, string>;
  encrypted: boolean;
  userId?: string;
}

// Save encrypted backup to iCloud Drive using Web Share API
export async function saveToiCloudDrive(blob: Blob, filename: string): Promise<boolean> {
  try {
    // First try the Web Share API (works great on iOS Safari)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'application/json' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'FitCircle Backup',
          text: 'Save this backup to your iCloud Drive or Files app',
          files: [file]
        });
        return true;
      }
    }
    
    // Fallback: Standard download (user can manually save to iCloud)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // For iOS, add instructions
    if (isIOS()) {
      link.title = 'Tap to download, then save to Files app > iCloud Drive';
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to save to iCloud Drive:', error);
    return false;
  }
}

// Open file picker to restore from iCloud Drive
export function openCloudFilePicker(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = false;
    
    // iOS Safari supports accessing Files app (including iCloud Drive)
    if (isIOS()) {
      input.accept = '.json,application/json';
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error('No file selected'));
      }
    };
    
    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };
    
    input.click();
  });
}

// Detect iOS for enhanced iCloud integration
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Check if device supports iCloud Drive integration
export function supportsCloudIntegration(): boolean {
  // Web Share API with files support (iOS Safari)
  let hasWebShareFiles = false;
  try {
    if (navigator.share && navigator.canShare) {
      hasWebShareFiles = !!navigator.canShare({ files: [new File([''], 'test.json')] });
    }
  } catch {
    hasWebShareFiles = false;
  }
  
  // Standard file picker (all modern browsers)
  const hasFilePicker = typeof document !== 'undefined' && 
                       typeof document.createElement === 'function';
  
  return hasWebShareFiles || hasFilePicker;
}

// Get appropriate instruction text based on device capabilities
export function getCloudInstructionText(): string {
  if (isIOS()) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      return 'This will let you save your encrypted backup directly to iCloud Drive or Files app.';
    } else {
      return 'Download the backup file and save it to your Files app > iCloud Drive folder.';
    }
  } else {
    return 'Download the backup file and save it to your preferred cloud storage (Google Drive, Dropbox, etc.).';
  }
}

// Create filename with timestamp
export function createBackupFilename(encrypted: boolean = false): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  
  const prefix = encrypted ? 'fitcircle-secure-backup' : 'fitcircle-backup';
  return `${prefix}-${year}-${month}-${day}-${time}.json`;
}