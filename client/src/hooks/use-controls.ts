import { useState, useEffect } from 'react';

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

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(CONTROLS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse control settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateSetting = (key: keyof ControlSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(CONTROLS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  return {
    settings,
    updateSetting,
    isQuoteHidden: settings.hideQuoteOfTheDay,
    isTodaysTotalsHidden: settings.hideTodaysTotals,
    isRecentActivityHidden: settings.hideRecentActivity,
  };
}