// Main application entry and view router
// Strictly ASCII comments only

import React, { useState, useEffect, useMemo } from 'react';
import type { Channel, MediaItem, EpisodeItem } from './types/iptv';
import {
  INITIAL_CHANNELS,
  INITIAL_CATEGORIES,
  HERO_FEATURED,
  TRENDING_MOVIES,
} from './services/mockData';
import {
  enrichChannelsWithLiveEPG,
  generateRealTimeEPGSchedule,
  initOnlineEPG,
} from './services/epgService';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PlayerView } from './components/PlayerView';
import { VODView } from './components/VODView';
import { VODPlayerView } from './components/VODPlayerView';
import { PlaylistModal } from './components/PlaylistModal';
import { MediaModal } from './components/MediaModal';
import { SettingsModal } from './components/SettingsModal';

type ViewType = 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player';

const VIEW_HASH_MAP: Record<ViewType, string> = {
  home: '#/inicio',
  player: '#/ao-vivo',
  epg: '#/guia',
  vod: '#/on-demand',
  favorites: '#/favoritos',
  radios: '#/radios',
  'vod-player': '#/assistir',
};

function getViewFromHash(): ViewType {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('assistir') || hash.includes('vod-player')) return 'vod-player';
  if (hash.includes('ao-vivo') || hash.includes('player')) return 'player';
  if (hash.includes('guia') || hash.includes('epg')) return 'epg';
  if (
    hash.includes('filmes') ||
    hash.includes('series') ||
    hash.includes('animes') ||
    hash.includes('on-demand') ||
    hash.includes('vod')
  ) {
    return 'vod';
  }
  if (hash.includes('favoritos')) return 'favorites';
  if (hash.includes('radios')) return 'radios';
  if (hash.includes('inicio') || hash === '#/' || hash === '#') return 'home';

  const saved = localStorage.getItem('mastertv_current_view') as ViewType | null;
  if (saved && ['home', 'player', 'epg', 'vod', 'favorites', 'radios', 'vod-player'].includes(saved)) {
    return saved;
  }
  return 'home';
}

function getVodFilterFromHash(): 'all' | 'movies' | 'series' | 'animes' | 'doramas' {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('filmes')) return 'movies';
  if (hash.includes('series')) return 'series';
  if (hash.includes('animes')) return 'animes';
  if (hash.includes('doramas')) return 'doramas';
  return 'all';
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(() => getViewFromHash());
  const [isPlayerControlsVisible, setIsPlayerControlsVisible] = useState<boolean>(true);
  const [isNavbarHovered, setIsNavbarHovered] = useState<boolean>(false);
  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved =
      localStorage.getItem('mastertv_channels_v10') ||
      localStorage.getItem('mastertv_channels_v9');
    if (saved) {
      try {
        const parsed: Channel[] = JSON.parse(saved);
        const initialMap = new Map(INITIAL_CHANNELS.map((c) => [c.id, c]));
        // Keep user favorites but sync updated streamUrl and logo from master catalog
        const updated = parsed.map((c) => {
          const init = initialMap.get(c.id);
          if (init) {
            return {
              ...c,
              streamUrl: init.streamUrl,
              backupStreamUrl: init.backupStreamUrl,
              logo: init.logo,
            };
          }
          return c;
        });
        const existingIds = new Set(updated.map((c) => c.id));
        const missing = INITIAL_CHANNELS.filter((c) => !existingIds.has(c.id));
        if (missing.length > 0) {
          return [...updated, ...missing];
        }
        return updated;
      } catch {
        // Fallback to initial
      }
    }
    return INITIAL_CHANNELS;
  });

  const handleViewChange = (
    view: ViewType,
    category?: 'all' | 'movies' | 'series' | 'animes' | 'doramas'
  ) => {
    setCurrentView(view);
    localStorage.setItem('mastertv_current_view', view);
    if (view === 'vod' && category) {
      setVodFilter(category);
      if (category === 'movies') window.location.hash = '#/filmes';
      else if (category === 'series') window.location.hash = '#/series';
      else if (category === 'animes') window.location.hash = '#/animes';
      else window.location.hash = '#/on-demand';
    } else {
      window.location.hash = VIEW_HASH_MAP[view];
    }
    setIsPlayerControlsVisible(true);
  };

  useEffect(() => {
    // Synchronize initial URL hash
    if (!window.location.hash) {
      window.location.hash = VIEW_HASH_MAP[currentView];
    }

    const handleHashChange = () => {
      const v = getViewFromHash();
      const f = getVodFilterFromHash();
      setCurrentView(v);
      if (f !== 'all') {
        setVodFilter(f);
      }
      localStorage.setItem('mastertv_current_view', v);
      setIsPlayerControlsVisible(true);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Real-time clock tick every 30 seconds to update live broadcast states
  useEffect(() => {
    // Initialize real-time online XMLTV EPG
    initOnlineEPG();

    const handleEPGUpdated = () => {
      setCurrentTime(new Date());
    };

    window.addEventListener('mastertv_epg_updated', handleEPGUpdated);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mastertv_epg_updated', handleEPGUpdated);
    };
  }, []);

  // Enriched channels with live real-time programming
  const liveChannels = useMemo(() => {
    return enrichChannelsWithLiveEPG(channels, currentTime);
  }, [channels, currentTime]);

  const [currentChannel, setCurrentChannel] = useState<Channel | null>(() => {
    const savedChannelId = localStorage.getItem('mastertv_last_channel_id');
    if (savedChannelId) {
      const found = INITIAL_CHANNELS.find((c) => c.id === savedChannelId);
      if (found) return found;
    }
    return INITIAL_CHANNELS[0]; // Globo SP default
  });

  const activeCurrentChannel = useMemo(() => {
    if (!currentChannel) return liveChannels[0] || null;
    return liveChannels.find((c) => c.id === currentChannel.id) || currentChannel;
  }, [currentChannel, liveChannels]);

  const { programs: epgPrograms } = useMemo(() => {
    return generateRealTimeEPGSchedule(liveChannels, currentTime);
  }, [liveChannels, currentTime]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vodFilter, setVodFilter] = useState<'all' | 'movies' | 'series' | 'animes' | 'doramas'>(() => getVodFilterFromHash());

  const handleOpenVODCategory = (
    view: ViewType,
    cat?: 'all' | 'movies' | 'series' | 'animes' | 'doramas'
  ) => {
    handleViewChange(view, cat);
  };

  // Modals state
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedProgramItem, setSelectedProgramItem] = useState<{
    program: typeof epgPrograms[0];
    channel: Channel;
  } | null>(null);

  // Sync channels to localStorage
  useEffect(() => {
    localStorage.setItem('mastertv_channels_v10', JSON.stringify(channels));
  }, [channels]);

  // Toggle favorite channel
  const handleToggleFavorite = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch
      )
    );
  };

  // Switch channel and go to player
  const handleSelectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    localStorage.setItem('mastertv_last_channel_id', channel.id);
  };

  const handleApplyImportedChannels = (newChannels: Channel[]) => {
    setChannels(newChannels);
    if (newChannels.length > 0) {
      setCurrentChannel(newChannels[0]);
    }
  };

  const handleResetDefaults = () => {
    localStorage.removeItem('mastertv_channels_v6');
    setChannels(INITIAL_CHANNELS);
    setCurrentChannel(INITIAL_CHANNELS[0]);
  };

  const handleClearCache = () => {
    localStorage.clear();
    setChannels(INITIAL_CHANNELS);
    setCurrentChannel(INITIAL_CHANNELS[0]);
    setIsSettingsModalOpen(false);
  };

  const [activeVOD, setActiveVOD] = useState<{
    mediaItem: MediaItem;
    currentEpisode?: EpisodeItem;
    streamUrl: string;
    title: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('mastertv_active_vod');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mediaItem && parsed.streamUrl) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse error and fallback
    }
    const defaultMedia = TRENDING_MOVIES[0] || HERO_FEATURED;
    return {
      mediaItem: defaultMedia,
      streamUrl: defaultMedia.streamUrl,
      title: defaultMedia.title,
    };
  });

  const handlePlayMediaStream = (
    streamUrl: string,
    title: string,
    mediaItem?: MediaItem,
    episode?: EpisodeItem
  ) => {
    if (mediaItem) {
      const vodData = {
        mediaItem,
        currentEpisode: episode || (mediaItem.episodeList ? mediaItem.episodeList[0] : undefined),
        streamUrl,
        title,
      };
      setActiveVOD(vodData);
      try {
        localStorage.setItem('mastertv_active_vod', JSON.stringify(vodData));
      } catch {
        // Storage full or quota exceeded
      }
      handleViewChange('vod-player');
    } else {
      const temporaryChannel: Channel = {
        id: `temp-${Date.now()}`,
        number: 999,
        name: title,
        logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80',
        category: 'filmes',
        streamUrl: streamUrl,
        currentProgram: title,
        currentProgramTime: 'Agora',
        nextProgram: 'Fim da transmissão',
        nextProgramTime: '',
        synopsis: 'Exibição em alta definição.',
        isFavorite: false,
        quality: '1080p',
      };
      setCurrentChannel(temporaryChannel);
      handleViewChange('player');
    }
  };

  const favoritesCount = channels.filter((c) => c.isFavorite).length;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Top Navigation Bar - Hidden during VOD Player playback for full immersion */}
      {currentView !== 'vod-player' && (
        <Navbar
          currentView={currentView}
          vodFilter={vodFilter}
          setCurrentView={handleViewChange}
          onNavigateCategory={handleOpenVODCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          favoritesCount={favoritesCount}
          isPlayerControlsVisible={isPlayerControlsVisible}
          onNavbarMouseEnter={() => {
            setIsNavbarHovered(true);
            setIsPlayerControlsVisible(true);
          }}
          onNavbarMouseLeave={() => setIsNavbarHovered(false)}
        />
      )}

      {/* Main View Router */}
      <main className={`flex-1 flex flex-col ${
        currentView === 'vod-player'
          ? 'pb-0 overflow-hidden'
          : currentView === 'player'
          ? 'pb-16 md:pb-0 overflow-y-auto md:overflow-hidden'
          : 'pb-16 sm:pb-0'
      }`}>
        {currentView === 'home' && (
          <HomeView
            channels={liveChannels}
            onSelectChannel={handleSelectChannel}
            onOpenPlayer={() => handleViewChange('player')}
            onSelectMedia={(item) => setSelectedMedia(item)}
            onOpenEPG={() => handleViewChange('epg')}
            onOpenVODCategory={(cat) => handleViewChange('vod', cat)}
          />
        )}

        {(currentView === 'player' || currentView === 'epg') && (
          <PlayerView
            channels={liveChannels}
            currentChannel={activeCurrentChannel}
            onSelectChannel={handleSelectChannel}
            onToggleFavorite={handleToggleFavorite}
            onOpenEPG={() => handleViewChange('epg')}
            isEPGOpenProp={currentView === 'epg'}
            onCloseEPG={() => handleViewChange('player')}
            categories={INITIAL_CATEGORIES}
            onControlsVisibilityChange={setIsPlayerControlsVisible}
            isNavbarHovered={isNavbarHovered}
          />
        )}

        {currentView === 'vod-player' && (
          <VODPlayerView
            mediaItem={activeVOD.mediaItem}
            currentEpisode={activeVOD.currentEpisode}
            streamUrl={activeVOD.streamUrl}
            title={activeVOD.title}
            onBack={() => {
              const category =
                activeVOD.mediaItem.type === 'movie'
                  ? 'movies'
                  : activeVOD.mediaItem.type === 'series'
                  ? 'series'
                  : activeVOD.mediaItem.type === 'anime'
                  ? 'animes'
                  : 'all';
              handleViewChange('vod', category);
            }}
            onSelectEpisode={(ep) => {
              const updated = {
                ...activeVOD,
                currentEpisode: ep,
                streamUrl: ep.streamUrl,
                title: `${activeVOD.mediaItem.title} - ${ep.title}`,
              };
              setActiveVOD(updated);
              try {
                localStorage.setItem('mastertv_active_vod', JSON.stringify(updated));
              } catch {
                // Ignore storage error
              }
            }}
          />
        )}

        {currentView === 'vod' && (
          <VODView
            onSelectMedia={(item) => setSelectedMedia(item)}
            searchQuery={searchQuery}
            initialFilter={vodFilter}
          />
        )}

        {currentView === 'favorites' && (
          <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Seus Canais Favoritos ({favoritesCount})</span>
            </h1>
            {favoritesCount === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-white/5">
                Você ainda não favoritou nenhum canal. Clique no ícone de coração nos canais ou no guia para adicioná-los aqui!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {channels
                  .filter((c) => c.isFavorite)
                  .map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => {
                        handleSelectChannel(ch);
                        setCurrentView('player');
                      }}
                      className="bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-cyan-400 p-3 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="w-12 h-12 mx-auto my-2 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                        <img
                          src={ch.logo}
                          alt={ch.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{ch.currentProgram}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'radios' && (
          <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
            <h1 className="text-xl font-bold text-white">Rádios Online</h1>
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-white/5 text-xs">
              Módulo de Web Rádios integrado ao reprodutor MasterTV.
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onApplyChannels={handleApplyImportedChannels}
        onResetDefaults={handleResetDefaults}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onClearCache={handleClearCache}
      />

      <MediaModal
        isOpen={!!selectedMedia || !!selectedProgramItem}
        mediaItem={selectedMedia}
        programItem={selectedProgramItem}
        onClose={() => {
          setSelectedMedia(null);
          setSelectedProgramItem(null);
        }}
        onPlayMedia={handlePlayMediaStream}
      />
    </div>
  );
};

export default App;
