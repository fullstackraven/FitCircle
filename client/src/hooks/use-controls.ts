import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

interface ControlSettings {
  hideQuoteOfTheDay: boolean;
  hideTodaysTotals: boolean;
  hideRecentActivity: boolean;
}

// Using existing STORAGE_KEYS pattern for consistency

const defaultSettings: ControlSettings = {
  hideQuoteOfTheDay: false,
  hideTodaysTotals: false,
  hideRecentActivity: false,
};

export function useControls() {
  const [settings, setSettings] = useState<ControlSettings>(() => {
    return safeParseJSON(localStorage.getItem(STORAGE_KEYS.CONTROL_SETTINGS), defaultSettings);
  });

  // Save settings to localStorage whenever they change
  const updateSetting = (key: keyof ControlSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.CONTROL_SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save control settings:', error);
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