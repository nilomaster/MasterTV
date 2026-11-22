// Global Application State Context
// Strictly ASCII comments only

import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Sync with remote database on mount
  useEffect(() => {
    AdminService.fetchRemoteChannels().then(() => {
      const refreshed = getCustomChannels();
      setChannels(refreshed);
      setCurrentChannel((prev) => {
        if (prev && refreshed.some((c) => c.id === prev.id)) return prev;
        return refreshed[0] || null;
      });
    });
    // Also fetch general contents in background
    AdminService.fetchRemoteContents().catch(() => {});
    initOnlineEPG();

    const handleCatalogUpdated = () => {
      const refreshed = getCustomChannels();
      setChannels(refreshed);
      setCurrentChannel((prev) => {
        if (prev && refreshed.some((c) => c.id === prev.id)) return prev;
        return refreshed[0] || null;
      });
    };
    window.addEventListener('mastertv_catalog_updated', handleCatalogUpdated);
    return () => window.removeEventListener('mastertv_catalog_updated', handleCatalogUpdated);
  }, []);

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
