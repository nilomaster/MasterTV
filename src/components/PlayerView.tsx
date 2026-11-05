// Modern IPTV Video Player with overlay controls, channels drawer and EPG integration
// All comments in this file strictly follow ASCII rules

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Tv,
  List,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Search,
  Star,
  X,
  Copy,
  Check,
  Radio,
  Sliders,
  ChevronDown
} from 'lucide-react';
import type { Channel, Category } from '../types/iptv';
import { getLiveEPGForChannel } from '../services/epgService';
import { EPGGuideView } from './EPGGuideView';

interface PlayerViewProps {
  channels: Channel[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onOpenEPG?: () => void;
  isEPGOpenProp?: boolean;
  onCloseEPG?: () => void;
  categories: Category[];
  onControlsVisibilityChange?: (visible: boolean) => void;
  isNavbarHovered?: boolean;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  channels,
  currentChannel,
  onSelectChannel,
  onToggleFavorite,
  onOpenEPG,
  isEPGOpenProp,
  onCloseEPG,
  categories,
  onControlsVisibilityChange,
  isNavbarHovered = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('mastertv_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('mastertv_muted') === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // Channel drawer is closed by default to avoid blocking the video stream on page load
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [searchChannel, setSearchChannel] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeSource, setActiveSource] = useState<number>(1);
  const [quality, setQuality] = useState<string>('Auto');
  const [availableLevels, setAvailableLevels] = useState<{ id: number; name: string }[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | '16-9'>('contain');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoadingStream, setIsLoadingStream] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [zeroDelayActive, setZeroDelayActive] = useState<boolean>(true);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [internalEPGOpen, setInternalEPGOpen] = useState<boolean>(false);

  const isEPGModalVisible = isEPGOpenProp !== undefined ? isEPGOpenProp : internalEPGOpen;

  const handleOpenEPG = () => {
    if (onOpenEPG) onOpenEPG();
    setInternalEPGOpen(true);
  };

  const handleCloseEPG = () => {
    setInternalEPGOpen(false);
    if (onCloseEPG) onCloseEPG();
  };

  // Context menu state for channel items
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    channel: Channel;
  } | null>(null);

  const controlsTimeoutRef = useRef<number | null>(null);
  const lastLoadedStreamRef = useRef<string>('');

  // Clean up HLS when PlayerView unmounts
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        lastLoadedStreamRef.current = '';
      }
    };
  }, []);

  const currentChannelId = currentChannel?.id;
  const streamToPlay =
    activeSource === 2 && currentChannel?.backupStreamUrl
      ? currentChannel.backupStreamUrl
      : currentChannel?.streamUrl || '';

  // Initialize and update HLS stream
  useEffect(() => {
    if (!currentChannelId || !videoRef.current || !streamToPlay) return;

    // Prevent destroying and reloading the stream on periodic EPG metadata updates
    if (lastLoadedStreamRef.current === streamToPlay && hlsRef.current) {
      return;
    }

    lastLoadedStreamRef.current = streamToPlay;
    setIsLoadingStream(true);
    setStreamError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    // Check if the stream is a direct video container (MP4, MKV or CDN workers file)
    const isDirectVideo =
      streamToPlay.includes('.mp4') ||
      streamToPlay.includes('.mkv') ||
      streamToPlay.includes('workers.dev');

    // Support standard HLS m3u8 as well as proxy endpoints and obfuscated txt streams
    const isHlsStream =
      !isDirectVideo &&
      Hls.isSupported() &&
      (streamToPlay.includes('.m3u8') ||
        streamToPlay.includes('.txt') ||
        streamToPlay.includes('/api/proxy') ||
        streamToPlay.includes('stream') ||
        streamToPlay.includes('m3u8'));

    // Safety timeout to avoid getting stuck indefinitely on Sintonizando
    let connectTimeout: number | null = window.setTimeout(() => {
      if (activeSource === 1 && currentChannel?.backupStreamUrl) {
        setActiveSource(2);
      } else {
        setIsLoadingStream(false);
        setStreamError('Sinal temporariamente indisponivel nesta fonte');
      }
    }, 7500);

    if (isHlsStream) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: zeroDelayActive,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 8,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamToPlay);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setIsLoadingStream(false);

        // Populate available resolutions
        if (data && data.levels && data.levels.length > 0) {
          const lvls = data.levels.map((lvl, index) => ({
            id: index,
            name: lvl.height ? `${lvl.height}p` : `Nivel ${index + 1}`,
          }));
          setAvailableLevels([{ id: -1, name: 'Auto' }, ...lvls]);
        } else {
          setAvailableLevels([
            { id: -1, name: 'Auto' },
            { id: 1, name: '1080p' },
            { id: 2, name: '720p' },
          ]);
        }

        video.play().catch(() => {
          setIsMuted(true);
          video.muted = true;
          video.play().catch(() => {});
        });
      });

      let networkRetryCount = 0;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              networkRetryCount++;
              if (networkRetryCount <= 2) {
                hls.startLoad();
              } else {
                if (connectTimeout) {
                  window.clearTimeout(connectTimeout);
                  connectTimeout = null;
                }
                if (activeSource === 1 && currentChannel?.backupStreamUrl) {
                  setActiveSource(2);
                } else {
                  setStreamError('Sinal temporariamente indisponivel nesta fonte');
                  setIsLoadingStream(false);
                  hls.destroy();
                }
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (connectTimeout) {
                window.clearTimeout(connectTimeout);
                connectTimeout = null;
              }
              setStreamError('Sinal temporariamente indisponivel nesta fonte');
              setIsLoadingStream(false);
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = streamToPlay;
      const handleReady = () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setIsLoadingStream(false);
        video.play().catch(() => {
          setIsMuted(true);
          video.muted = true;
          video.play().catch(() => {});
        });
      };
      video.onloadedmetadata = handleReady;
      video.oncanplay = handleReady;
      video.onerror = () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        if (activeSource === 1 && currentChannel?.backupStreamUrl) {
          setActiveSource(2);
        } else {
          setIsLoadingStream(false);
          setStreamError('Transmissao temporariamente indisponivel nesta fonte');
        }
      };
    }

    return () => {
      if (connectTimeout) {
        window.clearTimeout(connectTimeout);
        connectTimeout = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        lastLoadedStreamRef.current = '';
      }
    };
  }, [currentChannelId, streamToPlay, zeroDelayActive]);

  // Effective controls visibility takes navbar hover into account
  const isControlsVisible = showControls || isNavbarHovered;

  // Synchronize controls visibility with parent component (Navbar)
  useEffect(() => {
    onControlsVisibilityChange?.(isControlsVisible);
  }, [isControlsVisible, onControlsVisibilityChange]);

  // Handle auto-hide controls on mouse idle
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isDrawerOpen && !isNavbarHovered) {
        setShowControls(false);
      }
    }, 4500);
  }, [isDrawerOpen, isNavbarHovered]);

  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isDrawerOpen && !isNavbarHovered) {
        setShowControls(false);
      }
    }, 4500);
  }, [isDrawerOpen, isNavbarHovered]);

  // Hide controls smoothly when cursor leaves player area
  const handleMouseLeave = useCallback(() => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isDrawerOpen && !isNavbarHovered) {
        setShowControls(false);
      }
    }, 350);
  }, [isDrawerOpen, isNavbarHovered]);

  // Global document mouseleave to immediately hide when leaving browser window
  useEffect(() => {
    const handleDocumentMouseLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        if (!isDrawerOpen && !isNavbarHovered) {
          setShowControls(false);
        }
      }
    };
    document.addEventListener('mouseleave', handleDocumentMouseLeave);
    return () => document.removeEventListener('mouseleave', handleDocumentMouseLeave);
  }, [isDrawerOpen, isNavbarHovered]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
      }
      localStorage.setItem('mastertv_muted', String(nextMuted));
      return nextMuted;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Sync fullscreen state when user exits via ESC or browser UI
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation for channels (Arrow Up and Arrow Down)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!currentChannel || channels.length === 0) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % channels.length;
        onSelectChannel(channels[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
        onSelectChannel(channels[prevIndex]);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsDrawerOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isDrawerOpen) {
        e.preventDefault();
        setIsDrawerOpen(false);
      }
    },
    [channels, currentChannel, onSelectChannel, toggleMute, toggleFullscreen, isDrawerOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem('mastertv_volume', String(val));
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
        localStorage.setItem('mastertv_muted', 'true');
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
        localStorage.setItem('mastertv_muted', 'false');
      }
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error', err);
    }
  };

  const jumpChannels = (direction: 'next' | 'prev') => {
    if (!currentChannel || channels.length === 0) return;
    const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % channels.length;
      onSelectChannel(channels[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
      onSelectChannel(channels[prevIndex]);
    }
  };

  const cycleQuality = () => {
    if (availableLevels.length > 0) {
      const currentIdx = availableLevels.findIndex((l) => l.name === quality);
      const nextIdx = (currentIdx + 1) % availableLevels.length;
      const nextLevel = availableLevels[nextIdx];
      setQuality(nextLevel.name);
      if (hlsRef.current) {
        hlsRef.current.currentLevel = nextLevel.id;
      }
    } else {
      const defaultList = ['Auto', '1080p', '720p'];
      const nextIdx = (defaultList.indexOf(quality) + 1) % defaultList.length;
      setQuality(defaultList[nextIdx]);
    }
  };

  // Jump to live sync edge
  const jumpToLiveEdge = () => {
    if (hlsRef.current && videoRef.current) {
      if (hlsRef.current.liveSyncPosition) {
        videoRef.current.currentTime = hlsRef.current.liveSyncPosition;
      } else {
        videoRef.current.currentTime = videoRef.current.duration - 1;
      }
      videoRef.current.play().catch(() => {});
    }
  };

  // Close context menu on global click
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  // Listen for real-time online EPG updates
  const [epgRevision, setEpgRevision] = useState<number>(0);

  useEffect(() => {
    const handleUpdate = () => setEpgRevision((prev) => prev + 1);
    window.addEventListener('mastertv_epg_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_epg_updated', handleUpdate);
  }, []);

  // Get real-time live EPG data for current channel
  const currentLiveInfo = useMemo(() => {
    void epgRevision;
    return currentChannel ? getLiveEPGForChannel(currentChannel.id) : null;
  }, [currentChannel, epgRevision]);

  // Filter channels based on search and category
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch =
      ch.name.toLowerCase().includes(searchChannel.toLowerCase()) ||
      ch.number.toString().includes(searchChannel) ||
      (ch.currentProgram && ch.currentProgram.toLowerCase().includes(searchChannel.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'todos'
        ? true
        : selectedCategory === 'favoritos'
        ? ch.isFavorite
        : ch.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full bg-black overflow-hidden select-none font-sans ${
        isFullscreen
          ? 'h-screen fixed inset-0 z-50'
          : 'h-[100dvh]'
      }`}
    >
      {/* Video Element - Live TV without pause capability */}
      <video
        ref={videoRef}
        className={`w-full h-full object-${aspectRatio === 'cover' ? 'cover' : 'contain'} cursor-default`}
        playsInline
        autoPlay
        muted={isMuted}
        onClick={() => setShowControls((prev) => !prev)}
        onPause={(e) => {
          // Security lock: prevent pausing live TV stream
          e.currentTarget.play().catch(() => {});
        }}
      />

      {/* Loading Overlay - Splash Neon Effect matching Saimo TV */}
      {isLoadingStream && (
        <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none z-10 animate-in fade-in duration-200">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00F0FF]/20 to-[#8b5cf6]/20 border border-[#00F0FF]/40 p-3 shadow-[0_0_30px_rgba(0,240,255,0.35)] flex items-center justify-center">
              {currentChannel?.logo ? (
                <img
                  src={currentChannel.logo}
                  alt={currentChannel.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Tv className="w-8 h-8 text-[#00F0FF]" />
              )}
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-[#00F0FF]/30 animate-ping pointer-events-none"></div>
          </div>
          <h3 className="text-white text-base font-bold tracking-wide">
            Sintonizando {currentChannel?.name || 'Canal'}...
          </h3>
          <p className="text-xs text-[#00F0FF] mt-1 font-mono tracking-wider font-semibold">
            Sinal 100% HD em tempo real
          </p>
        </div>
      )}

      {/* Stream Error Overlay */}
      {streamError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
            <Tv className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{streamError}</h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Voce pode alternar entre a Fonte 1 e a Fonte 2 de transmissao ou selecionar outro canal.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveSource(activeSource === 1 ? 2 : 1)}
              className="px-4 py-2 bg-[#4fe3d0] hover:bg-[#38d4c1] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#4fe3d0]/20"
            >
              Alternar para Fonte {activeSource === 1 ? '2' : '1'}
            </button>
            <button
              onClick={() => {
                setStreamError(null);
                setIsLoadingStream(true);
                if (hlsRef.current) {
                  hlsRef.current.startLoad();
                }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR OVERLAY - Anchored to top: 0 with seamless downward gradient */}
      <div
        className={`absolute top-0 left-0 right-0 pt-16 sm:pt-20 px-4 sm:px-6 lg:px-8 pb-10 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-start justify-between z-20 pointer-events-none transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Left: Current Program Info */}
        <div className="flex flex-col gap-1 max-w-2xl pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse shadow-md shadow-red-600/30">
              AGORA
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight drop-shadow-md">
              {currentLiveInfo?.currentProgram || currentChannel?.currentProgram || 'Programacao ao Vivo'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-[#4fe3d0] font-mono font-bold">
              {currentLiveInfo?.currentProgramTime || currentChannel?.currentProgramTime || 'Ao Vivo'}
            </span>
            <span className="text-slate-400 font-medium">
              {currentLiveInfo?.durationText || '1h'}
            </span>
            {(currentLiveInfo?.synopsis || currentChannel?.synopsis) && (
              <span className="hidden sm:inline text-slate-400 line-clamp-1">
                · {currentLiveInfo?.synopsis || currentChannel?.synopsis}
              </span>
            )}
          </div>
        </div>

        {/* Right: Next Program & Guia Button */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="hidden md:flex items-center gap-2 bg-[#0b0e14]/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] uppercase font-bold text-[#4fe3d0] tracking-wider">
                A Seguir {currentLiveInfo?.nextProgramTime ? `· ${currentLiveInfo.nextProgramTime}` : ''}
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {currentLiveInfo?.nextProgram || currentChannel?.nextProgram || 'Proxima atracao'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            onClick={handleOpenEPG}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0b0e14]/80 hover:bg-[#8b5cf6] hover:text-white text-white border border-white/10 hover:border-[#8b5cf6] font-bold text-xs transition-all shadow-lg backdrop-blur-md cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#8b5cf6] group-hover:text-white" />
            <span>Guia</span>
          </button>
        </div>
      </div>

      {/* LEFT CHANNEL DRAWER - Faithful to Saimo TV PainelDeCanais */}
      {isDrawerOpen && (
        <aside
          className="absolute top-16 sm:top-20 bottom-16 sm:bottom-20 left-2 right-2 sm:right-auto sm:left-4 sm:w-88 lg:w-96 rounded-[24px] bg-[#0b0e14]/90 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex flex-col z-30 overflow-hidden border border-white/15 animate-in fade-in slide-in-from-left-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <h3 className="font-extrabold text-xl text-white tracking-tight">Canais</h3>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-base font-bold text-[#4fe3d0]">
                  {currentChannel?.number ? String(currentChannel.number).padStart(2, '0') : '01'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {filteredChannels.length}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-105"
              title="Fechar lista de canais"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search channel box */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar canal..."
                value={searchChannel}
                onChange={(e) => setSearchChannel(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/10 rounded-full text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#4fe3d0] focus:bg-white/15 transition-all"
              />
              {searchChannel && (
                <button
                  onClick={() => setSearchChannel('')}
                  className="absolute right-3 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills Horizontal Scroll */}
          <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/5">
            {categories.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isCatActive
                      ? 'bg-white text-slate-950 font-bold shadow-md'
                      : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Channel items list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scroll">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Nenhum canal encontrado.
              </div>
            ) : (
              filteredChannels.map((ch) => {
                const isSelected = currentChannel?.id === ch.id;
                const chLive = getLiveEPGForChannel(ch.id);
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      onSelectChannel(ch);
                      if (window.innerWidth < 768) {
                        setIsDrawerOpen(false);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        channel: ch,
                      });
                    }}
                    className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-white/15 border-[#4fe3d0] shadow-[0_0_20px_rgba(79,227,208,0.25)]'
                        : 'bg-slate-900/30 border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Channel Number */}
                      <span
                        className={`font-mono text-xs w-6 text-right shrink-0 ${
                          isSelected ? 'text-[#4fe3d0] font-bold' : 'text-white/40 font-semibold'
                        }`}
                      >
                        {String(ch.number).padStart(2, '0')}
                      </span>

                      {/* Logo Icon Tile */}
                      <div className="relative w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <img
                          src={ch.logo}
                          alt={ch.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Title, Program & Progress */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                            }`}
                          >
                            {ch.name}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1 rounded bg-[#4fe3d0]/20 text-[#4fe3d0]">
                            {ch.quality || 'HD'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {chLive.currentProgram}
                        </span>
                        {/* Real-time progress bar */}
                        <div className="w-full max-w-[150px] h-[3px] bg-white/10 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-[#4fe3d0] rounded-full transition-all duration-500"
                            style={{ width: `${chLive.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Star Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ch.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-yellow-400 transition-all shrink-0 hover:scale-110"
                      title={ch.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          ch.isFavorite
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'opacity-40 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Hint - Matching Saimo TV */}
          <div className="p-2.5 bg-black/40 border-t border-white/10 text-[10px] text-slate-400 text-center">
            Clique: assiste · botao direito: fontes e favoritos · ↑↓ trocam de canal
          </div>
        </aside>
      )}

      {/* Sleek Right Click Context Menu for Channels */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-52 bg-[#12161e]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 text-xs text-white animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold text-[#4fe3d0] uppercase tracking-wider border-b border-white/10">
            {contextMenu.channel.name}
          </div>
          <button
            onClick={() => {
              onToggleFavorite(contextMenu.channel.id);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              {contextMenu.channel.isFavorite ? 'Remover dos Favoritos' : 'Favoritar Canal'}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveSource(activeSource === 1 ? 2 : 1);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alternar para Fonte {activeSource === 1 ? '2' : '1'}</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.channel.streamUrl);
              setCopiedUrl(true);
              setTimeout(() => {
                setCopiedUrl(false);
                setContextMenu(null);
              }, 1200);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            {copiedUrl ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copiedUrl ? 'URL Copiada!' : 'Copiar URL do Stream'}</span>
          </button>
        </div>
      )}

      {/* BOTTOM FLOATING CONTROLS BAR - Responsive Glass Controlbar */}
      <div
        className={`absolute bottom-16 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 lg:left-8 lg:right-8 z-30 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-5xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl bg-[#0b0e14]/90 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-1 sm:gap-2 border border-white/15">
          {/* Left Controls: Drawer toggle, Prev, Next */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              title="Abrir lista de canais (C)"
              className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                isDrawerOpen
                  ? 'bg-[#4fe3d0] text-slate-950 font-bold shadow-lg shadow-[#4fe3d0]/20'
                  : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
              }`}
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => jumpChannels('prev')}
              title="Canal anterior (Seta Cima)"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => jumpChannels('next')}
              title="Proximo canal (Seta Baixo)"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Middle Controls: Quality, Source, Live Jump, Volume */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Quality pill */}
            <button
              onClick={cycleQuality}
              title="Alternar Resolucao"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-mono font-bold text-slate-200 transition-colors"
            >
              <span>{quality}</span>
            </button>

            {/* Source switch */}
            <button
              onClick={() => setActiveSource(activeSource === 1 ? 2 : 1)}
              title="Alternar Fonte de Transmissao"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap"
            >
              <span>Fonte {activeSource}/2</span>
            </button>

            {/* Quick Live Jump button */}
            <button
              onClick={jumpToLiveEdge}
              title="Sincronizar Ao Vivo com baixa latencia"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>-0.0s AO VIVO</span>
            </button>

            {/* Volume slider */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleMute}
                className="p-1 sm:p-1.5 text-slate-300 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#4fe3d0]" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4fe3d0]"
              />
            </div>
          </div>

          {/* Right Controls: Zero Latency, Aspect Ratio, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Low Latency Zero Badge */}
            <button
              onClick={() => setZeroDelayActive(!zeroDelayActive)}
              title="Alternar Modo Zero Delay"
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                zeroDelayActive
                  ? 'bg-[#4fe3d0]/15 border border-[#4fe3d0]/50 text-[#4fe3d0] shadow-[0_0_12px_rgba(79,227,208,0.25)]'
                  : 'bg-white/5 border border-white/10 text-slate-400'
              }`}
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>ZERO DELAY</span>
            </button>

            {/* Stereo Audio Mode */}
            <div
              title="Modo de Audio: Estereo Inteligente"
              className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5"
            >
              <Sliders className="w-3 h-3 text-[#4fe3d0]" />
              <span>Estereo</span>
            </div>

            {/* Aspect ratio */}
            <button
              onClick={() => {
                if (aspectRatio === 'contain') setAspectRatio('cover');
                else setAspectRatio('contain');
              }}
              title={`Ajuste de Tela: ${aspectRatio}`}
              className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all hidden sm:block"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* PiP */}
            <button
              onClick={togglePiP}
              title="Picture in Picture"
              className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all hidden sm:block"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              title="Tela cheia (F)"
              className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* EPG Guide Modal Overlay */}
      {isEPGModalVisible && (
        <EPGGuideView
          channels={channels}
          currentChannel={currentChannel}
          onSelectChannel={(ch) => {
            onSelectChannel(ch);
            handleCloseEPG();
          }}
          onClose={handleCloseEPG}
        />
      )}
    </div>
  );
};
