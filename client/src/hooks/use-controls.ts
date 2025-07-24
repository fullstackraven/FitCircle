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
  const [settings, setSettings] = useState<ControlSettings>(() => {
    const saved = localStorage.getItem(CONTROLS_STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to parse control settings:', error);
      }
    }
    return defaultSettings;
  });

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