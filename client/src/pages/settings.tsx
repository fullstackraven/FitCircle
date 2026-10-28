import { PageHeader } from '@/components/ui/presentation';
import '@/styles/dashboard-settings.css';
import { useState, useRef, useSyncExternalStore, Fragment } from 'react';
import { Upload, Download, Trash2, RotateCcw, Palette, CheckCircle2, Quote, ChartNoAxesColumnIncreasing, History, ShieldCheck, HardDrive, Info, LockKeyhole } from 'lucide-react';
import { useLocation } from 'wouter';
import { AppHeader } from '@/components/AppHeader';
import { dashboardContext, reopenDashboard } from '@/lib/dashboard-navigation';
import { getAppearanceController, type AppearancePreference } from '@/lib/appearance';
import { useControls } from '@/hooks/use-controls';
import { refreshApp } from '@/lib/pwa-update';
import { getTodayString } from '@/lib/date-utils';
import { localFoodService } from '@/lib/local-food-service';
import { createBackup, prepareRestore, applyRestore, isAppKey } from '@/lib/backup';


export default function SettingsPage({ section = 'legacy' }: { section?: 'legacy' | 'account' | 'display' }) {
  const [, navigate] = useLocation();
  const appearanceController = getAppearanceController();
  const appearance = useSyncExternalStore(appearanceController.subscribe, appearanceController.getSnapshot);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showEraseConfirm, setShowEraseConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings, updateSetting } = useControls();



  const context = dashboardContext();
  const handleBack = () => {
    if (context.fromDashboard) reopenDashboard();
    navigate(context.fromDashboard ? context.returnTo : '/');
  };

  // Export complete localStorage data as JSON (includes food database)
  const exportSnapshot = async () => {
    setIsExporting(true);
    try {
      await localFoodService.ready;
      const warnings: string[] = [];
      const completeSnapshot = await createBackup(undefined, undefined, warning => warnings.push(warning));
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

      setStatus(`Exported ${Object.keys(completeSnapshot.localStorage).length} items successfully!${warnings.length ? ' ' + warnings.join(' ') : ''}`);
      if (!warnings.length) setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setStatus(`Export failed: ${error instanceof Error ? error.message : 'Storage could not be read. Please try again.'}`);
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Import data to localStorage from JSON (includes food database)
  const importSnapshot = (file: File) => {
    setIsImporting(true);
    setStatus('Restoring data...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await localFoodService.ready;
        const plan = prepareRestore(JSON.parse(e.target?.result as string));
        if (!window.confirm(`Restore ${Object.keys(plan.entries).length} FitCircle items? Matching items will be replaced; other data will be kept. Download a backup first if needed.`)) { setStatus('Restore cancelled.'); return; }
        applyRestore(plan);
        window.location.href = import.meta.env.BASE_URL;
      } catch (error) {
        setStatus(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` );
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

  const forceRefresh = async () => {
    setIsRefreshing(true);
    setStatus('Checking for updates...');
    try {
      await refreshApp();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Update failed. Please try again.');
      setIsRefreshing(false);
    }
  };

  // Erase all data function (clears localStorage including food database)
  const eraseAllData = async () => {
    try {
      // Clear all localStorage data (includes food database)
      const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
      keys.forEach(key => { if (key && isAppKey(key)) localStorage.removeItem(key); });

      setStatus('All data has been erased successfully!');
      setShowEraseConfirm(false);

      // Redirect to home page after a short delay
      setTimeout(() => {
        setStatus('');
        window.location.href = import.meta.env.BASE_URL;
      }, 2000);
    } catch (error) {
      console.error('Failed to erase data:', error);
      setStatus('Failed to erase data. Please try again.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const Header = section === 'legacy' ? Fragment : AppHeader;
  // Preserve compatibility-route controls while sharing the presentation standard.
  return (section as string) === 'legacy' ? (
    <div className="fitcircle-page">
      <div className={`fitcircle-container ${section === 'legacy' ? '' : 'pt-4'}`}>
        {/* Header */}
        <Header><PageHeader title={section === 'account' ? 'Account Data' : section === 'display' ? 'Display' : 'Settings'} onBack={handleBack} className={section === 'legacy' ? '' : 'w-full max-w-md mx-auto px-4 min-h-14 mb-0'} /></Header>

        {section !== 'display' && <>
        {/* Backup & Restore Section */}
        <div className="fitcircle-card-lg mb-6">
          <h2 className="text-lg font-semibold text-strong mb-4">Complete Data Backup</h2>

          <div className="space-y-4">
            <button
              onClick={exportSnapshot}
              disabled={isExporting}
              className="w-full bg-action hover:bg-action-hover disabled:opacity-50 text-on-action py-3 px-4 rounded-xl flex items-center justify-center gap-2"
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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-on-action py-3 px-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {isImporting ? 'Restoring...' : 'Restore from Backup'}
            </button>

            {status && (
              <div role="status" aria-live="polite" className={`p-3 rounded-xl text-sm text-center ${
                status.includes('Success') || status.includes('Exported')
                  ? 'bg-feature-green-tint/50 text-accent-soft border border-green-700'
                  : 'bg-feature-red-deep-tint/50 text-feature-red-soft border border-red-700'
              }`}>
                {status}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              This creates a complete snapshot of all your FitCircle data. Restore validates the entire file, replaces matching FitCircle items, and keeps other data. Close other FitCircle tabs before restoring.
            </p>
          </div>
        </div>

        </>}
        {section !== 'account' && <>
        {section === 'display' && status && <p role="status" className="mb-4 text-sm text-supporting">{status}</p>}
        {/* Force Refresh Section */}
        <div className="glass-panel bg-surface rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-strong mb-4">App Updates</h2>

          <div className="space-y-4">
            <button
              onClick={forceRefresh}
              disabled={isRefreshing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-on-action py-3 px-4 rounded-xl flex items-center justify-center gap-2"
              data-testid="button-force-refresh"
            >
              <RotateCcw className="w-5 h-5" />
              {isRefreshing ? 'Updating app...' : 'Force Refresh App'}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Reloads the app, just like closing and reopening it. Your data stays safe.
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="glass-panel bg-surface rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-strong mb-6">Controls</h2>

          <div className="space-y-4">
            {/* Hide Quote of the Day */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-strong font-small">Hide Quote of the Day</p>
              </div>
              <button
                onClick={() => updateSetting('hideQuoteOfTheDay', !settings.hideQuoteOfTheDay)}
                aria-label="Hide Quote of the Day"
                aria-pressed={settings.hideQuoteOfTheDay}
                className={`settings-toggle relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideQuoteOfTheDay ? 'bg-green-400' : 'bg-control-strong'
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
                <p className="text-strong font-small">Hide Today's Totals</p>
              </div>
              <button
                onClick={() => updateSetting('hideTodaysTotals', !settings.hideTodaysTotals)}
                aria-label="Hide Today's Totals"
                aria-pressed={settings.hideTodaysTotals}
                className={`settings-toggle relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideTodaysTotals ? 'bg-green-400' : 'bg-control-strong'
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
                <p className="text-strong font-small">Hide Recent Activity</p>
              </div>
              <button
                onClick={() => updateSetting('hideRecentActivity', !settings.hideRecentActivity)}
                aria-label="Hide Recent Activity"
                aria-pressed={settings.hideRecentActivity}
                className={`settings-toggle relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                  settings.hideRecentActivity ? 'bg-green-400' : 'bg-control-strong'
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


        </>}
        {section !== 'display' && <>
        {/* REMOVED: Bug reporting section removed per user request - no server calls */}
        {/* Erase All Data Section */}
        <div className="bg-feature-red-deep-tint/20 border border-red-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-feature-red mb-4">Danger Zone</h2>

          <div className="space-y-4">
            {!showEraseConfirm ? (
              <>
                <button
                  onClick={() => setShowEraseConfirm(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-on-action py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Erase All Data
                </button>
              </>
            ) : (
              <>
                <p className="text-error-soft text-sm font-medium mb-4">
                  ⚠️ Are you absolutely sure? This action cannot be undone!
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={eraseAllData}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-on-action py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Yes, Erase Everything
                  </button>
                  <button
                    onClick={() => setShowEraseConfirm(false)}
                    className="flex-1 bg-control-strong hover:bg-surface-secondary text-strong py-3 px-4 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </>}
        {section !== 'account' && <section className="glass-panel bg-surface rounded-xl p-6 mb-6" aria-labelledby="appearance-heading">
          <h2 id="appearance-heading" className="text-lg font-semibold text-strong mb-4">Appearance</h2>
          <fieldset aria-describedby="appearance-description" className="min-w-0">
            <legend className="sr-only">Appearance</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as AppearancePreference[]).map(preference => (
                <label key={preference} className="min-w-0 cursor-pointer">
                  <input type="radio" name="appearance" value={preference}
                    checked={appearance.preference === preference}
                    onChange={() => appearanceController.setPreference(preference)}
                    className="peer sr-only" />
                  <span className="flex min-h-11 items-center justify-center rounded-xl border border-control-border bg-input-background px-2 text-sm text-strong peer-checked:border-accent-text peer-checked:bg-feature-green-tint peer-checked:text-accent-text peer-checked:font-semibold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                    {preference[0].toUpperCase() + preference.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p id="appearance-description" className="text-xs text-muted-foreground mt-3">System follows your device’s appearance settings.</p>
          {appearance.error && <p role="alert" className="text-sm text-feature-red mt-3">{appearance.error}</p>}
        </section>}

      </div>
    </div>
  ) : (
    <div className="fitcircle-page dashboard-settings">
      <div className={`fitcircle-container ${section === 'legacy' ? '' : 'pt-4'}`}>
        {/* Header */}
        <Header><PageHeader title={section === 'account' ? 'Account Data' : section === 'display' ? 'Display' : 'Settings'} onBack={handleBack} className={section === 'legacy' ? '' : 'w-full max-w-md mx-auto px-4 min-h-14 mb-0'} /></Header>

        <p className="settings-intro">{section === 'account' ? 'Keep your fitness records safe and under your control.' : 'Customize your FitCircle experience.'}</p>
        {section !== 'account' && <>
          <h2 className="settings-section-title" id="appearance-heading">Appearance</h2>
          <section className="fc-section settings-card" aria-labelledby="appearance-heading">
            <div className="settings-row-heading"><span className="settings-icon text-feature-purple"><Palette size={23}/></span><div><h3>App Theme</h3><p>Choose how FitCircle looks</p></div></div>
            <fieldset aria-describedby="appearance-description" className="min-w-0 mt-4">
              <legend className="sr-only">Appearance</legend>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as AppearancePreference[]).map(preference => <label key={preference} className="min-w-0 cursor-pointer">
                  <input type="radio" name="appearance" value={preference} checked={appearance.preference === preference} onChange={() => appearanceController.setPreference(preference)} className="peer sr-only"/>
                  <span className="settings-theme-option peer-checked:border-feature-purple peer-checked:bg-feature-purple-tint/40 peer-checked:ring-1 peer-checked:ring-feature-purple peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                    <span aria-hidden="true" className={`settings-preview settings-preview-${preference}`}><i/><i/></span>
                    <span className="inline-flex items-center justify-center gap-1"><CheckCircle2 size={13} aria-hidden="true" className={appearance.preference === preference ? 'text-feature-purple' : 'invisible'}/>{preference[0].toUpperCase() + preference.slice(1)}</span>
                  </span>
                </label>)}
              </div>
            </fieldset>
            <p id="appearance-description" className="settings-note mt-3">{appearance.preference[0].toUpperCase() + appearance.preference.slice(1)} appearance selected.{appearance.preference === 'system' ? ' System follows your device’s appearance settings.' : ''}</p>
            {appearance.error && <p role="alert" className="text-sm text-feature-red mt-3">{appearance.error}</p>}
          </section>
          <h2 className="settings-section-title">Home Screen</h2>
          <section className="fc-section settings-card settings-home" aria-label="Home Screen">
            {([
              {key:'hideQuoteOfTheDay',label:'Quote of the Day',description:'Show daily motivation',Icon:Quote},
              {key:'hideTodaysTotals',label:"Today's Totals",description:'Show daily activity summary',Icon:ChartNoAxesColumnIncreasing},
              {key:'hideRecentActivity',label:'Recent Activity',description:'Show your latest workouts',Icon:History},
            ] as const).map(({key,label,description,Icon}) => <div key={key} className="settings-home-row">
              <span className="settings-icon"><Icon size={22}/></span>
              <div className="min-w-0 flex-1"><label htmlFor={`visibility-${key}`} className="font-semibold text-sm cursor-pointer">{label}</label><p className="settings-note">{description}</p></div>
              <button id={`visibility-${key}`} type="button" role="switch" aria-label={label} aria-checked={!settings[key]} onClick={()=>updateSetting(key,!settings[key])} className={`settings-visibility ${!settings[key] ? 'bg-action' : 'bg-control-strong'}`}><span className={!settings[key] ? 'translate-x-5' : 'translate-x-0'}/></button>
            </div>)}
          </section>
          <p className="settings-note mt-3">Switches indicate whether each section is visible on Home.</p>
          <h2 className="settings-section-title">App Updates</h2>
          <section className="fc-section settings-card" aria-label="App Updates">
            <div className="flex items-center gap-3"><span className="settings-icon text-feature-purple bg-feature-purple-tint"><RotateCcw size={22}/></span><div className="min-w-0 flex-1"><h3 className="font-semibold text-sm">Refresh FitCircle</h3><p className="settings-note">Reload the current app</p></div><button onClick={forceRefresh} disabled={isRefreshing} data-testid="button-force-refresh" aria-label="Refresh FitCircle" className="fc-action fc-action-secondary shrink-0 settings-refresh">{isRefreshing ? 'Updating…' : 'Refresh'}</button></div>
            <p className="settings-note mt-4 flex items-start gap-2"><ShieldCheck size={17} className="shrink-0 mt-0.5"/>Your locally saved fitness data is not intentionally cleared by refreshing.</p>
            {section === 'display' && status && <p role="status" aria-live="polite" className="mt-3 text-sm text-supporting">{status}</p>}
          </section>
        </>}
        {section !== 'display' && <>
          <section className="fc-section settings-card settings-local" aria-label="Local data information"><div className="flex items-center gap-2 mb-2"><HardDrive size={22} className="text-accent-text"/><h2 className="font-semibold">Stored on this device</h2></div><p className="settings-note">FitCircle saves your records locally. Export a backup regularly to protect against device or browser data loss. There is no automatic cloud backup.</p></section>
          <h2 className="settings-section-title">Backup &amp; Restore</h2>
          <section className="fc-section settings-card" aria-label="Backup and Restore">
            <div className="settings-row-heading"><span className="settings-icon bg-feature-green-tint text-accent-text"><Download size={23}/></span><div><h3>Export Backup</h3><p>Save all FitCircle records as JSON</p></div></div>
            <button onClick={exportSnapshot} disabled={isExporting} className="fc-action w-full settings-wide-button bg-action hover:bg-action-hover text-on-action mt-4"><Download size={18}/>{isExporting ? 'Creating Backup...' : 'Download Complete Backup'}</button>
            <div className="border-t border-separator my-5"/>
            <div className="settings-row-heading"><span className="settings-icon bg-feature-blue-tint text-feature-blue"><Upload size={23}/></span><div><h3>Restore Backup</h3><p>Import a previously saved backup</p></div></div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" aria-label="Backup file"/>
            <button onClick={()=>fileInputRef.current?.click()} disabled={isImporting} className="fc-action w-full settings-wide-button border border-control-border text-supporting hover:bg-surface-secondary mt-4"><Upload size={18}/>{isImporting ? 'Restoring...' : 'Choose Backup File'}</button>
            <p className="settings-note mt-3 flex items-start gap-2"><Info size={17} className="shrink-0 mt-0.5"/><span>Restore validates the backup, replaces matching FitCircle records, and preserves unrelated browser data. Close other FitCircle tabs before restoring.</span></p>
            {status && <p role="status" aria-live="polite" className="mt-3 text-sm text-supporting">{status}</p>}
          </section>
          <h2 className="settings-section-title">Data Management</h2>
          <section className="fc-section settings-card" aria-label="Data Management">
            <div className="settings-row-heading"><span className="settings-icon bg-feature-red-deep-tint/40 text-feature-red"><Trash2 size={22}/></span><div><h3>Erase All Data</h3><p>Permanently remove locally saved records</p></div></div>
            {!showEraseConfirm ? <button onClick={()=>setShowEraseConfirm(true)} className="fc-action w-full settings-wide-button border border-feature-red text-feature-red hover:bg-feature-red-deep-tint/20 mt-4">Erase FitCircle Data</button> : <div className="mt-4"><p className="text-error-soft text-sm font-medium mb-3">⚠️ Are you absolutely sure? This action cannot be undone!</p><div className="flex flex-wrap gap-2"><button onClick={eraseAllData} className="fc-action w-full settings-wide-button flex-1 bg-red-600 text-white">Yes, Erase Everything</button><button onClick={()=>setShowEraseConfirm(false)} className="fc-action w-full settings-wide-button flex-1 border border-control-border text-strong">Cancel</button></div></div>}
          </section>
          <p className="settings-note mt-5 flex justify-center items-center gap-2"><LockKeyhole size={15}/>Local-first data management</p>
        </>}

      </div>
    </div>
  );
}
