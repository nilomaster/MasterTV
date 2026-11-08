// Main application entry and view router
// Strictly ASCII comments only

import React, { useState, useEffect, useMemo } from 'react';
import type { Channel, MediaItem, EpisodeItem } from './types/iptv';
import {
  INITIAL_CATEGORIES,
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
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginView } from './components/auth/LoginView';
import type { ClientSession } from './types/admin';
import { AdminService } from './services/adminService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MasterTV Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-[#0b0e14] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xl">
              !
            </div>
            <h2 className="text-lg font-black text-white">
              {this.props.fallbackTitle || 'Ocorreu um imprevisto na visualizacao'}
            </h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'Os dados foram preservados com seguranca.'}
            </p>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.hash = '#/ao-vivo';
                  window.location.reload();
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                Voltar ao Player
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
              >
                Recarregar Pagina
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type ViewType = 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin';

const VIEW_HASH_MAP: Record<ViewType, string> = {
  home: '#/inicio',
  player: '#/ao-vivo',
  epg: '#/guia',
  vod: '#/on-demand',
  favorites: '#/favoritos',
  radios: '#/radios',
  'vod-player': '#/assistir',
  admin: '#/admin',
};

function getViewFromHash(): ViewType {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('admin') || hash.includes('painel') || hash.includes('revenda')) return 'admin';
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
  if (saved && ['home', 'player', 'epg', 'vod', 'favorites', 'radios', 'vod-player', 'admin'].includes(saved)) {
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
  const [clientSession, setClientSession] = useState<ClientSession | null>(() =>
    AdminService.getClientSession()
  );
  const [isPlayerControlsVisible, setIsPlayerControlsVisible] = useState<boolean>(true);
  const [isNavbarHovered, setIsNavbarHovered] = useState<boolean>(false);

  // Helper to retrieve custom channels registered via Admin Panel
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
          sources: c.sourcesList && c.sourcesList.length > 0 ? c.sourcesList.map((s) => ({
            id: s.id,
            name: s.name,
            url: s.streamUrl,
            quality: s.quality,
          })) : undefined,
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
    // Purge old mock channel cache keys
    ['mastertv_channels_v12', 'mastertv_channels_v11', 'mastertv_channels_v10', 'mastertv_channels_v6'].forEach(
      (k) => localStorage.removeItem(k)
    );
    return getCustomChannels();
  });

  // Automatically fetch synchronized remote contents from MySQL API on launch
  useEffect(() => {
    AdminService.fetchRemoteContents().then(() => {
      const refreshed = getCustomChannels();
      setChannels(refreshed);
      setCurrentChannel((prev) => {
        if (prev && refreshed.some((c) => c.id === prev.id)) return prev;
        return refreshed[0] || null;
      });
    });

    const handleCatalogUpdate = () => {
      const custom = getCustomChannels();
      setChannels(custom);
    };
    window.addEventListener('mastertv_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('mastertv_catalog_updated', handleCatalogUpdate);
  }, []);

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

    // Initial sync of remote contents from MySQL API (works for Web, Android TV and Tablet)
    AdminService.fetchRemoteContents().catch(() => {});

    const handleEPGUpdated = () => {
      setCurrentTime(new Date());
    };

    const handleFocus = () => {
      AdminService.fetchRemoteContents().catch(() => {});
    };

    window.addEventListener('mastertv_epg_updated', handleEPGUpdated);
    window.addEventListener('focus', handleFocus);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    // Sync remote catalog every 2 minutes in background
    const catalogTimer = setInterval(() => {
      AdminService.fetchRemoteContents().catch(() => {});
    }, 120000);

    return () => {
      clearInterval(timer);
      clearInterval(catalogTimer);
      window.removeEventListener('mastertv_epg_updated', handleEPGUpdated);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Enriched channels with live real-time programming
  const liveChannels = useMemo(() => {
    return enrichChannelsWithLiveEPG(channels, currentTime);
  }, [channels, currentTime]);

  const [currentChannel, setCurrentChannel] = useState<Channel | null>(() => {
    const custom = getCustomChannels();
    const savedChannelId = localStorage.getItem('mastertv_last_channel_id');
    if (savedChannelId) {
      const found = custom.find((c) => c.id === savedChannelId);
      if (found) return found;
    }
    return custom[0] || null;
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
    localStorage.setItem('mastertv_channels_v12', JSON.stringify(channels));
  }, [channels]);

  // Global Android and TV Box Back Button handler
  useEffect(() => {
    (window as unknown as { __mastertv_handle_back?: () => boolean }).__mastertv_handle_back = () => {
      // 1. Close open modals first
      if (isPlaylistModalOpen) {
        setIsPlaylistModalOpen(false);
        return true;
      }
      if (isSettingsModalOpen) {
        setIsSettingsModalOpen(false);
        return true;
      }
      if (selectedMedia) {
        setSelectedMedia(null);
        return true;
      }
      if (selectedProgramItem) {
        setSelectedProgramItem(null);
        return true;
      }

      // 2. Dispatch event for PlayerView and VODPlayerView to exit cinema mode or close drawers
      window.dispatchEvent(new CustomEvent('mastertv_back_button'));
      const playerHandled = (window as unknown as { __mastertv_player_handled_back?: boolean }).__mastertv_player_handled_back;
      if (playerHandled) {
        (window as unknown as { __mastertv_player_handled_back?: boolean }).__mastertv_player_handled_back = false;
        return true;
      }

      // 3. If in VOD Player, go back to VOD catalog
      if (currentView === 'vod-player') {
        handleViewChange('vod');
        return true;
      }

      // 4. If in Admin Dashboard, go back to Player or Home
      if (currentView === 'admin') {
        handleViewChange('player');
        return true;
      }

      // 5. If on another view, return to Home
      if (currentView !== 'home') {
        handleViewChange('home');
        return true;
      }

      // 6. Already on Home with nothing open: return false to let Android minimize the app
      return false;
    };

    return () => {
      delete (window as unknown as { __mastertv_handle_back?: () => boolean }).__mastertv_handle_back;
    };
  }, [
    isPlaylistModalOpen,
    isSettingsModalOpen,
    selectedMedia,
    selectedProgramItem,
    currentView,
  ]);

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
    const custom = getCustomChannels();
    setChannels(custom);
    setCurrentChannel(custom[0] || null);
  };

  const handleClearCache = () => {
    localStorage.clear();
    const custom = getCustomChannels();
    setChannels(custom);
    setCurrentChannel(custom[0] || null);
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
    const allContents = AdminService.getContents();
    const firstMovie = allContents.find((c) => c && (c.type === 'movie' || c.type === 'series'));
    if (firstMovie) {
      const mediaItem: MediaItem = {
        id: firstMovie.id,
        type: firstMovie.type === 'series' ? 'series' : 'movie',
        title: firstMovie.title,
        rating: firstMovie.rating,
        year: firstMovie.year,
        genres: firstMovie.genres,
        posterUrl: firstMovie.posterUrl,
        backdropUrl: firstMovie.backdropUrl || firstMovie.posterUrl,
        streamUrl: firstMovie.streamUrl,
        description: firstMovie.description,
      };
      return {
        mediaItem,
        streamUrl: firstMovie.streamUrl,
        title: firstMovie.title,
      };
    }
    return {
      mediaItem: {
        id: '',
        type: 'movie',
        title: '',
        rating: 0,
        year: 2026,
        genres: [],
        posterUrl: '',
        backdropUrl: '',
        streamUrl: '',
        description: '',
      },
      streamUrl: '',
      title: '',
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

  const handleLogout = () => {
    AdminService.clearClientSession();
    setClientSession(null);
    handleViewChange('home');
  };

  // Client Authentication Guard: require login before accessing player and catalog
  if (!clientSession && currentView !== 'admin') {
    return (
      <LoginView
        onLoginSuccess={(session) => {
          setClientSession(session);
          handleViewChange('home');
        }}
        onOpenAdmin={() => handleViewChange('admin')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Top Navigation Bar - Hidden during VOD Player or Admin Dashboard for full immersion */}
      {currentView !== 'vod-player' && currentView !== 'admin' && (
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
          clientSession={clientSession}
          onLogout={handleLogout}
        />
      )}

      {/* Main View Router */}
      <main className={`flex-1 flex flex-col ${
        currentView === 'vod-player' || currentView === 'admin'
          ? 'pb-0 overflow-hidden'
          : currentView === 'player'
          ? 'h-[100dvh] overflow-hidden'
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
          <ErrorBoundary fallbackTitle="Catálogo On Demand">
            <VODView
              onSelectMedia={(item) => setSelectedMedia(item)}
              searchQuery={searchQuery}
              initialFilter={vodFilter}
            />
          </ErrorBoundary>
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

        {currentView === 'admin' && (
          <ErrorBoundary fallbackTitle="Painel Administrativo MasterTV">
            <AdminDashboard onBackToPlayer={() => handleViewChange('player')} />
          </ErrorBoundary>
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
        onOpenAdmin={() => handleViewChange('admin')}
        clientSession={clientSession}
        onLogout={handleLogout}
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
