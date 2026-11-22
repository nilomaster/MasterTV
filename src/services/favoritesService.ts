// Per-User Favorites Sync Service (Local Cache + MySQL API)
// Keeps favorite channels synced between Web Desktop and Android APK
// Strictly ASCII comments only

import { AdminService } from './adminService';

const FALLBACK_API_BASE = 'https://mastertvhd.online/api';

function getStorageKey(username?: string | null, itemType = 'channel'): string {
  const userKey = (username || 'guest').trim().toLowerCase();
  return `mastertv_favorites_v1_${itemType}_${userKey}`;
}

export class FavoritesService {
  static getLocalFavorites(username?: string | null, itemType = 'channel'): string[] {
    try {
      const raw = localStorage.getItem(getStorageKey(username, itemType));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  static saveLocalFavorites(username: string | null | undefined, ids: string[], itemType = 'channel'): void {
    try {
      const unique = Array.from(new Set(ids.map(String)));
      localStorage.setItem(getStorageKey(username, itemType), JSON.stringify(unique));
    } catch {
      // Ignore storage quota errors
    }
  }

  static async fetchRemoteFavorites(username?: string | null, itemType = 'channel'): Promise<string[]> {
    const cleanUser = (username || '').trim();
    if (!cleanUser) {
      return this.getLocalFavorites(username, itemType);
    }

    const apiBase = AdminService.getApiBaseUrl();
    const query = `?username=${encodeURIComponent(cleanUser)}&item_type=${encodeURIComponent(itemType)}`;
    const primaryUrl = `${apiBase}/favorites.php${query}`;
    const fallbackUrl = `${FALLBACK_API_BASE}/favorites.php${query}`;

    try {
      let res: Response;
      try {
        res = await fetch(primaryUrl, { cache: 'no-store' });
        if (!res.ok && primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store' });
        }
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store' });
        } else {
          throw err;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.favorites)) {
          const remoteIds = data.favorites.map(String);
          this.saveLocalFavorites(cleanUser, remoteIds, itemType);
          return remoteIds;
        }
      }
    } catch {
      // Keep local cache if offline
    }

    return this.getLocalFavorites(cleanUser, itemType);
  }

  static async toggleRemoteFavorite(
    username: string | null | undefined,
    itemId: string,
    desiredState: boolean,
    itemType = 'channel'
  ): Promise<string[] | null> {
    const cleanUser = (username || '').trim();
    const cleanId = String(itemId).trim();
    if (!cleanId) return null;

    // Optimistic local update
    const current = new Set(this.getLocalFavorites(cleanUser, itemType));
    if (desiredState) {
      current.add(cleanId);
    } else {
      current.delete(cleanId);
    }
    this.saveLocalFavorites(cleanUser, Array.from(current), itemType);

    if (!cleanUser) {
      return Array.from(current);
    }

    const apiBase = AdminService.getApiBaseUrl();
    const primaryUrl = `${apiBase}/favorites.php`;
    const fallbackUrl = `${FALLBACK_API_BASE}/favorites.php`;
    const payload = JSON.stringify({
      action: 'toggle',
      username: cleanUser,
      item_id: cleanId,
      item_type: itemType,
      desired_state: desiredState,
    });

    try {
      let res: Response;
      try {
        res = await fetch(primaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
        if (!res.ok && primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
        }
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
        } else {
          throw err;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.favorites)) {
          const remoteIds = data.favorites.map(String);
          this.saveLocalFavorites(cleanUser, remoteIds, itemType);
          return remoteIds;
        }
      }
    } catch {
      // Optimistic local state remains preserved
    }

    return null;
  }
}
