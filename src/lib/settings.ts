import { League } from './sports/types';

export interface AppSettings {
  favoriteTeams: string[]; // ['ravens', 'razorbacks']
  favoriteTeamIds: string[];
  razorbacksSport: 'ncaaf' | 'ncaam';
  selectedLeagues: League[];
  refreshInterval: number; // ms
  demoMode: boolean;
  kioskMode: boolean;
  lightMode: boolean;
  alertCloseMargin: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  scenePreset: 'custom' | 'game-night' | 'halftime' | 'music-mode';
}

export const DEFAULT_SETTINGS: AppSettings = {
  favoriteTeams: ['ravens', 'razorbacks'],
  favoriteTeamIds: ['ravens', 'razorbacks'],
  razorbacksSport: 'ncaam',
  selectedLeagues: ['nfl', 'ncaam', 'ncaaf'],
  refreshInterval: 30000,
  demoMode: true,
  kioskMode: false,
  lightMode: false,
  alertCloseMargin: 3,
  quietHoursEnabled: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  scenePreset: 'custom',
};

const STORAGE_KEY = 'ipad-ticker-settings';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const favoriteTeamIds = parsed.favoriteTeamIds
      ?? (Array.isArray(parsed.favoriteTeams) ? parsed.favoriteTeams : DEFAULT_SETTINGS.favoriteTeamIds);
    return { ...DEFAULT_SETTINGS, ...parsed, favoriteTeamIds };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
