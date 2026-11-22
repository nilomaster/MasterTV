// Global Application State Context
// Strictly ASCII comments only

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Channel, MediaItem, EpisodeItem, EPGProgram } from '../types/iptv';
import type { ClientSession } from '../types/admin';
import { AdminService } from '../services/adminService';
import { FavoritesService } from '../services/favoritesService';
import { enrichChannelsWithLiveEPG, initOnlineEPG } from '../services/epgService';

interface ActiveVODState {
  mediaItem: MediaItem;
  currentEpisode?: EpisodeItem;
  streamUrl: string;
  title: string;
}

interface AppContextType {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  currentChannel: Channel | null;
  setCurrentChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
  liveChannels: Channel[];
  favoritesCount: number;
  toggleFavorite: (channelId: string) => void;
  clientSession: ClientSession | null;
  setClientSession: React.Dispatch<React.SetStateAction<ClientSession | null>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMedia: MediaItem | null;
  setSelectedMedia: (item: MediaItem | null) => void;
  selectedProgramItem: { program: EPGProgram; channel: Channel } | null;
  setSelectedProgramItem: (item: { program: EPGProgram; channel: Channel } | null) => void;
  activeVOD: ActiveVODState;
  setActiveVOD: React.Dispatch<React.SetStateAction<ActiveVODState>>;
  isPlaylistModalOpen: boolean;
  setIsPlaylistModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isPlayerControlsVisible: boolean;
  setIsPlayerControlsVisible: (visible: boolean) => void;
  isNavbarHovered: boolean;
  setIsNavbarHovered: (hovered: boolean) => void;
  handleLogout: () => void;
  handleClearCache: () => void;
  playMediaStream: (streamUrl: string, title: string, mediaItem?: MediaItem, episode?: EpisodeItem) => void;
  isSyncingCatalog: boolean;
  lastSyncedAt: number | null;
  syncCatalog: (force?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientSession, setClientSession] = useState<ClientSession | null>(() =>
    AdminService.getClientSession()
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedProgramItem, setSelectedProgramItem] = useState<{ program: EPGProgram; channel: Channel } | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isPlayerControlsVisible, setIsPlayerControlsVisible] = useState<boolean>(true);
  const [isNavbarHovered, setIsNavbarHovered] = useState<boolean>(false);
  const [isSyncingCatalog, setIsSyncingCatalog] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const syncInFlightRef = useRef<boolean>(false);
  const lastSyncTimestampRef = useRef<number>(0);

  // Helper to load channels from database applying synced per-user favorites
  const getCustomChannels = (favoriteIds?: Set<string>): Channel[] => {
    try {
      const all = AdminService.getChannels();
      if (!Array.isArray(all)) return [];
      const favSet =
        favoriteIds || new Set(FavoritesService.getLocalFavorites(clientSession?.username, 'channel'));
      return all
        .filter((c) => c && c.type === 'channel')
        .map((c, idx) => {
          // Resolve real channel quality from saved sourcesList or title
          const srcQ = (c.sourcesList?.[0]?.quality || c.sourcesList?.[0]?.name || '').toUpperCase();
          const titleUp = String(c.title || '').toUpperCase();
          let resolvedQuality: string | undefined;
          if (srcQ.includes('4K') || srcQ.includes('UHD') || /\b(4K|UHD)\b/.test(titleUp)) {
            resolvedQuality = '4K';
          } else if (srcQ.includes('FHD') || srcQ.includes('1080') || /\b(FHD|1080P)\b/.test(titleUp)) {
            resolvedQuality = 'FHD';
          } else if (srcQ.includes('SD') || srcQ.includes('480') || /\b(SD|480P)\b/.test(titleUp)) {
            resolvedQuality = 'SD';
          } else if (srcQ.includes('HD') || srcQ.includes('720') || /\b(HD|720P)\b/.test(titleUp)) {
            resolvedQuality = 'HD';
          }

          const channelId = String(c.id || `channel-${idx + 1}`);
          return {
            id: channelId,
            epgId: c.epgId || c.title || undefined,
            number: Number(c.channelNumber) || idx + 1,
            name: String(c.title || 'Canal'),
            logo: c.posterUrl || '',
            category: c.channelCategory || 'aberta',
            quality: resolvedQuality,
            streamUrl: c.streamUrl || '',
            backupStreamUrl: c.backupStreamUrl,
            sources: c.sourcesList && c.sourcesList.length > 0
              ? c.sourcesList.map((s) => ({
                  id: s.id,
                  name: s.name,
                  url: s.streamUrl,
                  quality: s.quality,
                }))
              : undefined,
            currentProgram: c.currentProgram || 'Transmissao ao Vivo',
            currentProgramTime: 'Ao Vivo',
            synopsis: c.description || 'Canal sincronizado no banco de dados MasterTV.',
            isFavorite: favSet.has(channelId),
          };
        });
    } catch {
      return [];
    }
  };

  const [channels, setChannels] = useState<Channel[]>(() => {
    ['mastertv_channels_v12', 'mastertv_channels_v11', 'mastertv_channels_v10', 'mastertv_channels_v6'].forEach(
      (k) => localStorage.removeItem(k)
    );
    return getCustomChannels();
  });

  const [currentChannel, setCurrentChannel] = useState<Channel | null>(() => channels[0] || null);

  const [activeVOD, setActiveVOD] = useState<ActiveVODState>(() => {
    try {
      const saved = localStorage.getItem('mastertv_active_vod');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore parse error
    }
    return {
      mediaItem: {
        id: 'vod-default',
        title: 'MasterTV VOD',
        type: 'movie',
        genre: 'Cinema',
        rating: 9.0,
        year: 2026,
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
        backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&auto=format&fit=crop&q=80',
        synopsis: 'Selecione um titulo do catalogo para assistir em alta definicao.',
      },
      streamUrl: '',
      title: 'MasterTV VOD',
    };
  });

  // Unified catalog and favorites sync (used on mount, manual button and app resume)
  const syncCatalog = useCallback(
    async (force = false): Promise<void> => {
      const now = Date.now();
      if (syncInFlightRef.current) return;
      // Throttle automatic background resumes to once every 30 seconds
      if (!force && now - lastSyncTimestampRef.current < 30000) return;

      syncInFlightRef.current = true;
      setIsSyncingCatalog(true);

      try {
        const username = clientSession?.username;
        const [, , remoteFavIds] = await Promise.all([
          AdminService.fetchRemoteChannels().catch(() => []),
          AdminService.fetchRemoteContents().catch(() => []),
          username
            ? FavoritesService.fetchRemoteFavorites(username, 'channel').catch(() =>
                FavoritesService.getLocalFavorites(username, 'channel')
              )
            : Promise.resolve(FavoritesService.getLocalFavorites(username, 'channel')),
        ]);

        const favSet = new Set(remoteFavIds);
        const refreshed = getCustomChannels(favSet);
        setChannels(refreshed);
        setCurrentChannel((prev) => {
          if (prev) {
            const updatedCurrent = refreshed.find((c) => c.id === prev.id);
            if (updatedCurrent) return updatedCurrent;
          }
          return refreshed[0] || null;
        });

        const completedAt = Date.now();
        lastSyncTimestampRef.current = completedAt;
        setLastSyncedAt(completedAt);
        window.dispatchEvent(new Event('mastertv_catalog_updated'));
      } finally {
        syncInFlightRef.current = false;
        setIsSyncingCatalog(false);
      }
    },
    [clientSession?.username]
  );

  // Sync with remote database on mount and auto-sync when returning from background or reconnecting
  useEffect(() => {
    syncCatalog(true);
    initOnlineEPG();

    const handleCatalogUpdated = () => {
      const refreshed = getCustomChannels();
      setChannels(refreshed);
      setCurrentChannel((prev) => {
        if (prev) {
          const updatedCurrent = refreshed.find((c) => c.id === prev.id);
          if (updatedCurrent) return updatedCurrent;
        }
        return refreshed[0] || null;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCatalog(false);
      }
    };

    const handleResumeOrOnline = () => {
      syncCatalog(false);
    };

    window.addEventListener('mastertv_catalog_updated', handleCatalogUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('resume', handleResumeOrOnline);
    window.addEventListener('online', handleResumeOrOnline);

    return () => {
      window.removeEventListener('mastertv_catalog_updated', handleCatalogUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('resume', handleResumeOrOnline);
      window.removeEventListener('online', handleResumeOrOnline);
    };
  }, [syncCatalog]);

  // Sync per-user favorites from MySQL whenever user logs in or switches account
  useEffect(() => {
    const username = clientSession?.username;
    if (!username) return;
    FavoritesService.fetchRemoteFavorites(username, 'channel').then((remoteIds) => {
      const favSet = new Set(remoteIds);
      setChannels((prev) => prev.map((ch) => ({ ...ch, isFavorite: favSet.has(ch.id) })));
      setCurrentChannel((prev) => (prev ? { ...prev, isFavorite: favSet.has(prev.id) } : prev));
    });
  }, [clientSession?.username]);

  const liveChannels = enrichChannelsWithLiveEPG(channels);
  const favoritesCount = channels.filter((c) => c.isFavorite).length;

  const toggleFavorite = (channelId: string) => {
    let nextState = false;
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === channelId) {
          nextState = !ch.isFavorite;
          return { ...ch, isFavorite: nextState };
        }
        return ch;
      })
    );
    setCurrentChannel((prev) =>
      prev && prev.id === channelId ? { ...prev, isFavorite: nextState } : prev
    );

    // Persist favorite state to local cache and MySQL backend for cross-device sync
    FavoritesService.toggleRemoteFavorite(clientSession?.username, channelId, nextState, 'channel').catch(() => {});
  };

  const handleLogout = () => {
    AdminService.clearClientSession();
    setClientSession(null);
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const playMediaStream = (
    streamUrl: string,
    title: string,
    mediaItem?: MediaItem,
    episode?: EpisodeItem
  ) => {
    if (mediaItem) {
      const vodData = {
        mediaItem,
        currentEpisode: episode,
        streamUrl,
        title: episode ? `${mediaItem.title} - ${episode.title}` : title,
      };
      setActiveVOD(vodData);
      try {
        localStorage.setItem('mastertv_active_vod', JSON.stringify(vodData));
      } catch {
        // Storage full
      }
    } else {
      const temporaryChannel: Channel = {
        id: `temp-${Date.now()}`,
        number: 999,
        name: title,
        logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80',
        category: 'filmes',
        streamUrl,
        currentProgram: title,
        currentProgramTime: 'Agora',
        nextProgram: 'Fim da transmissao',
        nextProgramTime: '',
        synopsis: 'Exibicao em alta definicao.',
        isFavorite: false,
        quality: '1080p',
      };
      setCurrentChannel(temporaryChannel);
    }
  };

  return (
    <AppContext.Provider
      value={{
        channels,
        setChannels,
        currentChannel,
        setCurrentChannel,
        liveChannels,
        favoritesCount,
        toggleFavorite,
        clientSession,
        setClientSession,
        searchQuery,
        setSearchQuery,
        selectedMedia,
        setSelectedMedia,
        selectedProgramItem,
        setSelectedProgramItem,
        activeVOD,
        setActiveVOD,
        isPlaylistModalOpen,
        setIsPlaylistModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isPlayerControlsVisible,
        setIsPlayerControlsVisible,
        isNavbarHovered,
        setIsNavbarHovered,
        handleLogout,
        handleClearCache,
        playMediaStream,
        isSyncingCatalog,
        lastSyncedAt,
        syncCatalog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
