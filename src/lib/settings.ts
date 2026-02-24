import { League } from './sports/types';

export interface AppSettings {
  favoriteTeams: string[]; // ['ravens', 'razorbacks']
  razorbacksSport: 'ncaaf' | 'ncaam';
  selectedLeagues: League[];
  refreshInterval: number; // ms
  demoMode: boolean;
  kioskMode: boolean;
  lightMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  favoriteTeams: ['ravens', 'razorbacks'],
  razorbacksSport: 'ncaam',
  selectedLeagues: ['nfl', 'ncaam', 'ncaaf'],
  refreshInterval: 30000,
  demoMode: true,
  kioskMode: false,
  lightMode: false,
};

const STORAGE_KEY = 'ipad-ticker-settings';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
