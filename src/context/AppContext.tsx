// Global Application State Context
// Strictly ASCII comments only

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Channel, MediaItem, EpisodeItem, EPGProgram } from '../types/iptv';
import type { ClientSession } from '../types/admin';
import { AdminService } from '../services/adminService';
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

  // Helper to load channels from database
  const getCustomChannels = (): Channel[] => {
    try {
      const all = AdminService.getContents();
      if (!Array.isArray(all)) return [];
      return all
        .filter((c) => c && c.type === 'channel')
        .map((c, idx) => ({
          id: String(c.id || `channel-${idx + 1}`),
          epgId: c.epgId || c.title || undefined,
          number: Number(c.channelNumber) || idx + 1,
          name: String(c.title || 'Canal'),
          logo: c.posterUrl || '',
          category: c.channelCategory || 'aberta',
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
          isFavorite: false,
        }));
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
    AdminService.fetchRemoteContents().then(() => {
      const refreshed = getCustomChannels();
      setChannels(refreshed);
      setCurrentChannel((prev) => {
        if (prev && refreshed.some((c) => c.id === prev.id)) return prev;
        return refreshed[0] || null;
      });
    });
    initOnlineEPG();
  }, []);

  const liveChannels = enrichChannelsWithLiveEPG(channels);
  const favoritesCount = channels.filter((c) => c.isFavorite).length;

  const toggleFavorite = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch))
    );
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
