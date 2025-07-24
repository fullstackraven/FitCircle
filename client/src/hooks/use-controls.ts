import { useState, useEffect } from 'react';
import { useIndexedDB } from './use-indexed-db';

interface ControlSettings {
  hideQuoteOfTheDay: boolean;
  hideTodaysTotals: boolean;
  hideRecentActivity: boolean;
}

const CONTROLS_STORAGE_KEY = 'fitcircle_control_settings';

const defaultSettings: ControlSettings = {
  hideQuoteOfTheDay: false,
  hideTodaysTotals: false,
  hideRecentActivity: false,
};

export function useControls() {
  const [settings, setSettings] = useState<ControlSettings>(defaultSettings);
  const { isReady, getItem, setItem } = useIndexedDB();

  // Load settings from IndexedDB on mount
  useEffect(() => {
    if (!isReady) return;

    const loadSettings = async () => {
      try {
        const savedSettings = await getItem<ControlSettings>(CONTROLS_STORAGE_KEY);
        if (savedSettings) {
          setSettings({ ...defaultSettings, ...savedSettings });
        }
      } catch (error) {
        console.error('Failed to parse control settings:', error);
      }
    };

    loadSettings();
  }, [isReady, getItem]);

  // Save settings to IndexedDB whenever they change
  const updateSetting = async (key: keyof ControlSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (isReady) {
      try {
        await setItem(CONTROLS_STORAGE_KEY, newSettings);
      } catch (error) {
        console.error('Failed to save control settings:', error);
      }
    }
  };

  return {
    settings,
    updateSetting,
    isQuoteHidden: settings.hideQuoteOfTheDay,
    isTodaysTotalsHidden: settings.hideTodaysTotals,
    isRecentActivityHidden: settings.hideRecentActivity,
  };
}