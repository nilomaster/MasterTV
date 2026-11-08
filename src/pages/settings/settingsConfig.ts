// Client and Admin Settings Configuration Defaults
// Strictly ASCII comments only

export interface ClientPlayerPreferences {
  hardwareAcceleration: boolean;
  lowLatency: boolean;
  bufferSize: string;
  smartAudio: boolean;
  upscale4K: boolean;
}

export const DEFAULT_CLIENT_PREFERENCES: ClientPlayerPreferences = {
  hardwareAcceleration: true,
  lowLatency: true,
  bufferSize: '30s',
  smartAudio: true,
  upscale4K: false,
};

export const SETTINGS_STORAGE_KEY = 'mastertv_client_preferences';

export function getClientPreferences(): ClientPlayerPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_CLIENT_PREFERENCES;
    return { ...DEFAULT_CLIENT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CLIENT_PREFERENCES;
  }
}

export function saveClientPreferences(prefs: ClientPlayerPreferences): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage quota
  }
}

