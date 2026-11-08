// Favorites configuration and storage helpers
// Strictly ASCII comments only

export const FAVORITES_STORAGE_KEY = 'mastertv_favorites_v2';

export function getSavedFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage quota
  }
}

