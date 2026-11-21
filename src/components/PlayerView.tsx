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
  Zap,
  Search,
  Star,
  X,
  Copy,
  Check,
  Radio,
  Play,
  Pause,
  ArrowLeft,
  RefreshCw,
  Filter,
  Settings,
  PictureInPicture2
} from 'lucide-react';
import type { Channel, Category } from '../types/iptv';
import { getLiveEPGForChannel, getChannelTimelinePrograms } from '../services/epgService';
import { EPGGuideView } from './EPGGuideView';
import { resolvePlayableStreamUrl } from '../services/streamResolver';

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
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // Channel drawer opens by default on desktop screens so users immediately see their channels
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
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
  const [mobileTab, setMobileTab] = useState<'channels' | 'categories' | 'epg'>('channels');
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  // Focus channel search input when header search button is clicked
  useEffect(() => {
    const handleFocusSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };
    window.addEventListener('mastertv_focus_channel_search', handleFocusSearch);
    return () => window.removeEventListener('mastertv_focus_channel_search', handleFocusSearch);
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!isFilterMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isFilterMenuOpen]);

  // Toggle live play/pause
  const togglePlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      if (hlsRef.current && hlsRef.current.liveSyncPosition) {
        vid.currentTime = hlsRef.current.liveSyncPosition;
      }
      vid.play().catch(() => {});
      setIsPaused(false);
    } else {
      vid.pause();
      setIsPaused(true);
    }
  }, []);

  // TV Box Remote Control & D-Pad Navigation state
  const [tvFocusedIndex, setTvFocusedIndex] = useState<number>(0);
  const [isKeyboardNavActive, setIsKeyboardNavActive] = useState<boolean>(false);
  const [osdChannel, setOsdChannel] = useState<Channel | null>(null);
  const osdTimeoutRef = useRef<number | null>(null);
  const digitBufferRef = useRef<string>('');
  const digitTimerRef = useRef<number | null>(null);

  // Reset active source and errors whenever channel changes
  useEffect(() => {
    setActiveSource(1);
    setStreamError(null);
    setIsAutoplayBlocked(false);
  }, [currentChannel?.id]);

  const showOSD = useCallback((ch: Channel) => {
    setOsdChannel(ch);
    if (osdTimeoutRef.current) {
      window.clearTimeout(osdTimeoutRef.current);
    }
    osdTimeoutRef.current = window.setTimeout(() => {
      setOsdChannel(null);
    }, 3500);
  }, []);

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

  // Auto-Restart and Freeze Recovery state (Strictly ASCII comments)
  const [streamNonce, setStreamNonce] = useState<number>(0);
  const [isAutoRecovering, setIsAutoRecovering] = useState<boolean>(false);
  const [autoRecoverySecondsLeft, setAutoRecoverySecondsLeft] = useState<number>(5);
  const [isAutoRestartEnabled, setIsAutoRestartEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('mastertv_client_preferences');
      if (raw) return JSON.parse(raw).autoRestartOnFreeze ?? true;
    } catch {}
    return true;
  });

  const lastCurrentTimeRef = useRef<number>(0);
  const consecutiveFrozenSecondsRef = useRef<number>(0);
  const isVideoStalledRef = useRef<boolean>(false);
  const restartAttemptsRef = useRef<number>(0);

  const restartStream = useCallback(() => {
    setIsAutoRecovering(true);
    setStreamError(null);
    setIsLoadingStream(true);
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch {}
    }
    lastLoadedStreamRef.current = '';
    setStreamNonce((n) => n + 1);
  }, []);

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

  // Resolve all available stream sources for the active channel
  const channelSources = useMemo(() => {
    if (!currentChannel) return [];
    if (currentChannel.sources && currentChannel.sources.length > 0) {
      return currentChannel.sources;
    }
    const list = [
      { id: 1, name: 'Fonte 1', url: currentChannel.streamUrl, quality: currentChannel.quality || 'HD' }
    ];
    if (currentChannel.backupStreamUrl) {
      list.push({ id: 2, name: 'Fonte 2', url: currentChannel.backupStreamUrl, quality: 'HD' });
    }
    return list;
  }, [currentChannel]);

  const channelSourcesRef = useRef(channelSources);
  channelSourcesRef.current = channelSources;

  const activeSourceObj = channelSources.find((s) => s.id === activeSource) || channelSources[0];
  const rawStream = activeSourceObj?.url || currentChannel?.streamUrl || '';
  const streamToPlay = resolvePlayableStreamUrl(rawStream);

  const cycleSource = useCallback(() => {
    if (channelSources.length <= 1) return;
    setActiveSource((prev) => {
      const idx = channelSources.findIndex((s) => s.id === prev);
      const nextIdx = (idx + 1) % channelSources.length;
      return channelSources[nextIdx].id;
    });
  }, [channelSources]);

  // Initialize and update HLS stream
  useEffect(() => {
    if (!videoRef.current || !streamToPlay) return;

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
      rawStream.includes('.mp4') ||
      rawStream.includes('.mkv') ||
      streamToPlay.includes('.mp4') ||
      streamToPlay.includes('.mkv') ||
      streamToPlay.includes('workers.dev');

    // Support standard HLS m3u8 as well as proxy endpoints and obfuscated txt streams
    const isHlsStream =
      !isDirectVideo &&
      Hls.isSupported() &&
      (rawStream.includes('.m3u8') ||
        rawStream.includes('.txt') ||
        streamToPlay.includes('.m3u8') ||
        streamToPlay.includes('/api/stream') ||
        streamToPlay.includes('/api/proxy') ||
        streamToPlay.includes('m3u8'));

    // Resilient helper to start playback without triggering false autoplay blocks
    const attemptPlayback = () => {
      if (!videoRef.current) return;
      const vid = videoRef.current;
      vid.muted = isMuted;
      vid.volume = isMuted ? 0 : volume;

      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsAutoplayBlocked(false);
            setIsLoadingStream(false);
          })
          .catch((err: any) => {
            // AbortError is normal during fast channel switching or initial buffering
            if (err && err.name === 'AbortError') {
              return;
            }
            // If browser autoplay policy denied unmuted audio, switch to muted autoplay immediately
            vid.muted = true;
            setIsMuted(true);
            const retryPromise = vid.play();
            if (retryPromise !== undefined) {
              retryPromise
                .then(() => {
                  setIsAutoplayBlocked(false);
                  setIsLoadingStream(false);
                })
                .catch((retryErr: any) => {
                  if (retryErr && retryErr.name === 'AbortError') {
                    return;
                  }
                  // Only show tap overlay on mobile touch screens if muted autoplay was strictly denied
                  const isMobileTouch = 'ontouchstart' in window && window.innerWidth < 768;
                  if (isMobileTouch) {
                    setIsAutoplayBlocked(true);
                  }
                  setIsLoadingStream(false);
                });
            }
          });
      }
    };

    // Safety timeout to avoid getting stuck indefinitely on Sintonizando
    let connectTimeout: number | null = window.setTimeout(() => {
      setActiveSource((prev) => {
        const sources = channelSourcesRef.current;
        const currentIdx = sources.findIndex((s) => s.id === prev);
        if (currentIdx !== -1 && currentIdx < sources.length - 1) {
          return sources[currentIdx + 1].id;
        }
        setIsLoadingStream(false);
        setStreamError('Sinal temporariamente indisponivel nesta fonte');
        return prev;
      });
    }, 25000);

    const handleVideoPlaying = () => {
      if (connectTimeout) {
        window.clearTimeout(connectTimeout);
        connectTimeout = null;
      }
      setIsLoadingStream(false);
      setStreamError(null);
    };
    video.addEventListener('playing', handleVideoPlaying);
    video.addEventListener('timeupdate', handleVideoPlaying);

    if (isHlsStream) {
      // Optimized resilient config for all Android devices and desktop browsers
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        startFragPrefetch: true,
        backBufferLength: 5,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        maxBufferSize: 25 * 1000 * 1000,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 10,
        initialLiveManifestSize: 1,
        maxBufferHole: 1.0,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 10,
        fragLoadingTimeOut: 25000,
        manifestLoadingTimeOut: 25000,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamToPlay);
      hls.attachMedia(video);

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setIsLoadingStream(false);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setIsLoadingStream(false);

        // Populate available resolutions only from actual stream levels
        if (data && data.levels && data.levels.length > 1) {
          const lvls = data.levels.map((lvl, index) => ({
            id: index,
            name: lvl.height ? `${lvl.height}p` : `Nivel ${index + 1}`,
          }));
          setAvailableLevels([{ id: -1, name: 'Auto' }, ...lvls]);
        } else if (data && data.levels && data.levels.length === 1) {
          const height = data.levels[0].height;
          setAvailableLevels([
            { id: -1, name: 'Auto' },
            { id: 0, name: height ? `${height}p` : 'HD' },
          ]);
        } else {
          setAvailableLevels([{ id: -1, name: 'Auto' }]);
        }

        attemptPlayback();
      });

      let networkRetryCount = 0;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              networkRetryCount++;
              if (networkRetryCount <= 3) {
                hls.startLoad();
              } else {
                networkRetryCount = 0;
                if (connectTimeout) {
                  window.clearTimeout(connectTimeout);
                  connectTimeout = null;
                }
                const sources = channelSourcesRef.current;
                const currentIdx = sources.findIndex((s) => s.id === activeSource);
                if (currentIdx !== -1 && currentIdx < sources.length - 1) {
                  setActiveSource(sources[currentIdx + 1].id);
                } else if (isAutoRestartEnabled) {
                  restartStream();
                } else {
                  setStreamError('Sinal temporariamente indisponivel nesta fonte');
                  setIsLoadingStream(false);
                }
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (isAutoRestartEnabled) {
                restartStream();
              } else {
                if (connectTimeout) {
                  window.clearTimeout(connectTimeout);
                  connectTimeout = null;
                }
                setStreamError('Sinal temporariamente indisponivel nesta fonte');
                setIsLoadingStream(false);
              }
              break;
          }
        } else {
          // Handle non-fatal buffer stalls immediately by jumping to live sync edge
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
            if (hls.liveSyncPosition) {
              video.currentTime = hls.liveSyncPosition;
            }
            hls.startLoad();
            video.play().catch(() => {});
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
        attemptPlayback();
      };
      video.onloadedmetadata = handleReady;
      video.oncanplay = handleReady;
      video.onerror = () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        const sources = channelSourcesRef.current;
        const currentIdx = sources.findIndex((s) => s.id === activeSource);
        if (currentIdx !== -1 && currentIdx < sources.length - 1) {
          setActiveSource(sources[currentIdx + 1].id);
        } else if (isAutoRestartEnabled) {
          restartStream();
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
      video.removeEventListener('playing', handleVideoPlaying);
      video.removeEventListener('timeupdate', handleVideoPlaying);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      lastLoadedStreamRef.current = '';
    };
  }, [streamToPlay, streamNonce]);

  // Auto-retry countdown when streamError occurs
  useEffect(() => {
    if (!streamError || !isAutoRestartEnabled) {
      setAutoRecoverySecondsLeft(5);
      return;
    }
    setAutoRecoverySecondsLeft(5);
    const interval = window.setInterval(() => {
      setAutoRecoverySecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          restartStream();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [streamError, isAutoRestartEnabled, restartStream]);

  // Live Stream Anti-Freeze Watchdog (Strictly ASCII comments)
  useEffect(() => {
    if (!isAutoRestartEnabled) return;
    const video = videoRef.current;
    if (!video) return;

    const onWaiting = () => {
      isVideoStalledRef.current = true;
    };
    const onPlaying = () => {
      isVideoStalledRef.current = false;
      consecutiveFrozenSecondsRef.current = 0;
      setIsAutoRecovering(false);
      restartAttemptsRef.current = 0;
    };
    const onTimeUpdate = () => {
      isVideoStalledRef.current = false;
      consecutiveFrozenSecondsRef.current = 0;
      setIsAutoRecovering(false);
    };

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);

    const watchdog = window.setInterval(() => {
      if (!videoRef.current || isLoadingStream || streamError || isAutoplayBlocked) {
        return;
      }
      const vid = videoRef.current;
      if (vid.paused || vid.ended) {
        consecutiveFrozenSecondsRef.current = 0;
        return;
      }

      const cur = vid.currentTime;
      const last = lastCurrentTimeRef.current;
      const advanced = Math.abs(cur - last) > 0.05;
      lastCurrentTimeRef.current = cur;

      if (!advanced || isVideoStalledRef.current || vid.readyState <= 2) {
        consecutiveFrozenSecondsRef.current += 1;
        const frozen = consecutiveFrozenSecondsRef.current;

        // Stage 1: Fast live catch-up after 4 seconds of stall
        if (frozen === 4) {
          setIsAutoRecovering(true);
          if (hlsRef.current) {
            if (hlsRef.current.liveSyncPosition) {
              vid.currentTime = hlsRef.current.liveSyncPosition;
            } else if (Number.isFinite(vid.duration) && vid.duration > 1) {
              vid.currentTime = Math.max(0, vid.duration - 0.5);
            }
            hlsRef.current.startLoad();
          } else {
            vid.currentTime += 0.2;
          }
          vid.play().catch(() => {});
        }

        // Stage 2: Media Error Recovery at 7 seconds
        if (frozen === 7) {
          setIsAutoRecovering(true);
          if (hlsRef.current) {
            hlsRef.current.recoverMediaError();
            hlsRef.current.startLoad(-1);
          }
          vid.play().catch(() => {});
        }

        // Stage 3: Full Stream Restart at 9 seconds
        if (frozen >= 9) {
          consecutiveFrozenSecondsRef.current = 0;
          restartAttemptsRef.current += 1;
          const sources = channelSourcesRef.current;
          if (restartAttemptsRef.current >= 3 && sources.length > 1) {
            restartAttemptsRef.current = 0;
            cycleSource();
          } else {
            restartStream();
          }
        }
      } else {
        consecutiveFrozenSecondsRef.current = 0;
        if (isAutoRecovering) {
          setIsAutoRecovering(false);
        }
      }
    }, 1000);

    return () => {
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      window.clearInterval(watchdog);
    };
  }, [isLoadingStream, streamError, isAutoplayBlocked, isAutoRestartEnabled, cycleSource, restartStream, isAutoRecovering]);

  // Effective controls visibility takes navbar hover into account
  const isControlsVisible = showControls || isNavbarHovered;

  // Synchronize controls visibility with parent component (Navbar)
  useEffect(() => {
    onControlsVisibilityChange?.(isControlsVisible);
  }, [isControlsVisible, onControlsVisibilityChange]);

  // Handle auto-hide controls on mouse and touch activity
  const resetControlsTimer = useCallback(() => {
    setIsKeyboardNavActive(false);
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

  const handleMouseMove = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleMouseEnter = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  // Hide controls smoothly when cursor leaves player area (desktop only)
  const handleMouseLeave = useCallback(() => {
    // Ignore on touch devices to avoid synthetic touch flicker
    if (typeof window !== 'undefined' && 'ontouchstart' in window && navigator.maxTouchPoints > 0) {
      return;
    }
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isDrawerOpen && !isNavbarHovered) {
        setShowControls(false);
      }
    }, 2500);
  }, [isDrawerOpen, isNavbarHovered]);

  // Global mouse activity listener (desktop only) to restore controls when cursor moves
  useEffect(() => {
    const handleActivity = () => {
      resetControlsTimer();
    };

    window.addEventListener('mousemove', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
    };
  }, [resetControlsTimer]);

  // Global document mouseleave to immediately hide when leaving browser window (desktop only)
  useEffect(() => {
    const handleDocumentMouseLeave = (e: MouseEvent) => {
      // Ignore on touch devices to avoid synthetic touch flicker
      if (typeof window !== 'undefined' && 'ontouchstart' in window && navigator.maxTouchPoints > 0) {
        return;
      }
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
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        if (containerRef.current && !document.fullscreenElement && containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  // Sync fullscreen state when user exits via ESC or browser UI
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle hardware and Android back button events
  useEffect(() => {
    const handleBackButton = () => {
      if (isFullscreen) {
        toggleFullscreen();
        (window as unknown as { __mastertv_player_handled_back?: boolean }).__mastertv_player_handled_back = true;
        return;
      }
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        (window as unknown as { __mastertv_player_handled_back?: boolean }).__mastertv_player_handled_back = true;
        return;
      }
      if (internalEPGOpen) {
        setInternalEPGOpen(false);
        (window as unknown as { __mastertv_player_handled_back?: boolean }).__mastertv_player_handled_back = true;
        return;
      }
    };
    window.addEventListener('mastertv_back_button', handleBackButton);
    return () => window.removeEventListener('mastertv_back_button', handleBackButton);
  }, [isFullscreen, isDrawerOpen, internalEPGOpen, toggleFullscreen]);

  // Build real categories list: always Todos and Favoritos, plus only categories with real channels
  const availableCategories = useMemo(() => {
    const result: { id: string; name: string; count: number }[] = [
      { id: 'todos', name: 'Todos', count: channels.length },
      { id: 'favoritos', name: 'Favoritos', count: channels.filter((c) => c.isFavorite).length },
    ];
    const seen = new Set<string>(['todos', 'favoritos']);

    categories.forEach((cat) => {
      const idLow = cat.id.toLowerCase();
      if (seen.has(idLow)) return;
      const count = channels.filter((c) => (c.category || '').toLowerCase() === idLow).length;
      if (count > 0) {
        seen.add(idLow);
        result.push({ id: cat.id, name: cat.name, count });
      }
    });

    // Include any additional real categories imported from M3U playlists
    const dynamicCounts = new Map<string, { label: string; count: number }>();
    channels.forEach((ch) => {
      const rawCat = (ch.category || '').trim();
      if (!rawCat) return;
      const key = rawCat.toLowerCase();
      if (seen.has(key)) return;
      const existing = dynamicCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        dynamicCounts.set(key, { label: rawCat, count: 1 });
      }
    });

    dynamicCounts.forEach((val, key) => {
      result.push({ id: key, name: val.label, count: val.count });
    });

    return result;
  }, [channels, categories]);

  // Filter channels based on search and category
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
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
  }, [channels, searchChannel, selectedCategory]);

  // Keep TV remote focused index aligned with the active channel so index 0 is not falsely highlighted
  useEffect(() => {
    if (currentChannel && filteredChannels.length > 0) {
      const idx = filteredChannels.findIndex((c) => c.id === currentChannel.id);
      if (idx !== -1) {
        setTvFocusedIndex(idx);
      }
    }
  }, [currentChannel?.id, isDrawerOpen, filteredChannels]);

  // Keyboard and TV Box Remote Control navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Automatically restore unmuted audio on any remote control interaction
      if (videoRef.current && videoRef.current.muted && !isMuted) {
        videoRef.current.muted = false;
        videoRef.current.volume = volume;
      }

      const isNavigatingList = isDrawerOpen || mobileTab === 'channels';

      // 1. Direct channel number input (0 - 9)
      if (/^[0-9]$/.test(e.key)) {
        digitBufferRef.current += e.key;
        if (digitTimerRef.current) window.clearTimeout(digitTimerRef.current);
        digitTimerRef.current = window.setTimeout(() => {
          const targetNum = parseInt(digitBufferRef.current, 10);
          digitBufferRef.current = '';
          const found = channels.find((c) => c.number === targetNum);
          if (found) {
            onSelectChannel(found);
            showOSD(found);
          }
        }, 1200);
        return;
      }

      // 2. D-Pad Down / Next Channel / Page Down
      if (e.key === 'ArrowDown' || e.key === 'ChannelDown' || e.key === 'PageDown') {
        e.preventDefault();
        setIsKeyboardNavActive(true);
        if (isNavigatingList && filteredChannels.length > 0) {
          const nextIdx = (tvFocusedIndex + 1) % filteredChannels.length;
          setTvFocusedIndex(nextIdx);
          const el = document.getElementById(`channel-item-${filteredChannels[nextIdx]?.id}`);
          el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if (currentChannel && channels.length > 0) {
          const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);
          const nextIndex = (currentIndex + 1) % channels.length;
          const nextChan = channels[nextIndex];
          onSelectChannel(nextChan);
          showOSD(nextChan);
        }
      }

      // 3. D-Pad Up / Previous Channel / Page Up
      else if (e.key === 'ArrowUp' || e.key === 'ChannelUp' || e.key === 'PageUp') {
        e.preventDefault();
        setIsKeyboardNavActive(true);
        if (isNavigatingList && filteredChannels.length > 0) {
          const prevIdx = (tvFocusedIndex - 1 + filteredChannels.length) % filteredChannels.length;
          setTvFocusedIndex(prevIdx);
          const el = document.getElementById(`channel-item-${filteredChannels[prevIdx]?.id}`);
          el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if (currentChannel && channels.length > 0) {
          const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);
          const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
          const prevChan = channels[prevIndex];
          onSelectChannel(prevChan);
          showOSD(prevChan);
        }
      }

      // 4. D-Pad Center / OK / Enter
      else if (e.key === 'Enter' || e.key === 'Select' || e.keyCode === 13) {
        e.preventDefault();
        if (isNavigatingList && filteredChannels.length > 0) {
          const chosen = filteredChannels[tvFocusedIndex];
          if (chosen) {
            onSelectChannel(chosen);
            showOSD(chosen);
            if (isDrawerOpen) setIsDrawerOpen(false);
          }
        } else {
          // Toggle channel drawer in video mode
          setIsDrawerOpen((prev) => !prev);
          setShowControls(true);
        }
      }

      // 5. D-Pad Left / Right (switch category or switch source)
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isNavigatingList) {
          const catIdx = categories.findIndex((c) => c.id === selectedCategory);
          if (catIdx > 0) {
            setSelectedCategory(categories[catIdx - 1].id);
          }
        } else {
          cycleSource();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isNavigatingList) {
          const catIdx = categories.findIndex((c) => c.id === selectedCategory);
          if (catIdx !== -1 && catIdx < categories.length - 1) {
            setSelectedCategory(categories[catIdx + 1].id);
          }
        } else {
          cycleSource();
        }
      }

      // 6. Shortcuts and Back button
      else if (e.key === 'm' || e.key === 'M' || e.key === 'AudioVolumeMute') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsDrawerOpen((prev) => !prev);
      } else if (e.key === 'Escape' || e.key === 'Back' || e.keyCode === 10009 || e.key === 'XF86Back') {
        if (isDrawerOpen) {
          e.preventDefault();
          setIsDrawerOpen(false);
        }
      } else if (e.key === 'ChannelUp' || e.keyCode === 427) {
        e.preventDefault();
        if (currentChannel) {
          const curIdx = filteredChannels.findIndex((c) => c.id === currentChannel.id);
          if (curIdx !== -1 && curIdx < filteredChannels.length - 1) {
            onSelectChannel(filteredChannels[curIdx + 1]);
          }
        }
      } else if (e.key === 'ChannelDown' || e.keyCode === 428) {
        e.preventDefault();
        if (currentChannel) {
          const curIdx = filteredChannels.findIndex((c) => c.id === currentChannel.id);
          if (curIdx > 0) {
            onSelectChannel(filteredChannels[curIdx - 1]);
          }
        }
      }
    },
    [
      channels,
      currentChannel,
      filteredChannels,
      tvFocusedIndex,
      isDrawerOpen,
      mobileTab,
      categories,
      selectedCategory,
      onSelectChannel,
      showOSD,
      cycleSource,
      toggleMute,
      toggleFullscreen,
      isMuted,
      volume,
    ]
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
    if (availableLevels.length > 1) {
      const currentIdx = availableLevels.findIndex((l) => l.name === quality);
      const nextIdx = (currentIdx + 1) % availableLevels.length;
      const nextLevel = availableLevels[nextIdx];
      setQuality(nextLevel.name);
      if (hlsRef.current) {
        hlsRef.current.currentLevel = nextLevel.id;
      }
    } else {
      setQuality('Auto');
      if (hlsRef.current) {
        hlsRef.current.currentLevel = -1;
      }
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
    return currentChannel ? getLiveEPGForChannel(currentChannel) : null;
  }, [currentChannel, epgRevision]);

  // Get full timeline programs for mobile EPG tab
  const currentTimeline = useMemo(() => {
    if (!currentChannel) return [];
    void epgRevision;
    const now = Date.now();
    return getChannelTimelinePrograms(
      currentChannel,
      now - 4 * 3600 * 1000,
      now + 16 * 3600 * 1000,
      now
    );
  }, [currentChannel, epgRevision]);

  const hasRealCurrentEPG = Boolean(
    currentLiveInfo?.currentProgram &&
      currentLiveInfo.currentProgram !== 'Programacao Normal' &&
      currentLiveInfo.currentProgram !== 'Programacao ao Vivo'
  );
  const hasRealNextEPG = Boolean(
    currentLiveInfo?.nextProgram &&
      currentLiveInfo.nextProgram !== 'Proxima atracao'
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full select-none font-sans ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden bg-black'
          : 'w-full h-full overflow-hidden flex flex-col relative bg-[#060912] md:bg-transparent'
      }`}
    >

      {/* MAIN TWO-COLUMN DESKTOP WORKSPACE (Mobile falls back cleanly to stacked video + tabs) */}
      <div
        className={`relative z-10 w-full flex-1 min-h-0 ${
          isFullscreen
            ? 'h-full w-full'
            : 'flex flex-col md:flex-row md:gap-4 lg:gap-5 md:px-5 lg:px-7 md:pb-5 md:pt-1 max-w-[1920px] mx-auto overflow-hidden'
        }`}
      >
        {/* LEFT COLUMN — CHANNEL LIST (Desktop 30%-33% width, independent scroll) */}
        {!isFullscreen && (
          <aside className="hidden md:flex md:w-[32%] lg:w-[31%] xl:w-[30%] min-w-[290px] max-w-[430px] h-full flex-col rounded-2xl bg-[#0a1120]/90 backdrop-blur-xl border border-sky-400/20 shadow-[0_18px_50px_rgba(0,0,0,0.65)] overflow-hidden shrink-0">
            {/* Search Bar + Filter Dropdown Button */}
            <div className="p-3.5 pb-3 flex items-center gap-2.5 border-b border-white/[0.06] shrink-0">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar canal..."
                  value={searchChannel}
                  onChange={(e) => setSearchChannel(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-[#0e172a] border border-white/10 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400/70 transition-all"
                />
                {searchChannel && (
                  <button
                    onClick={() => setSearchChannel('')}
                    className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Button & Dropdown Menu */}
              <div ref={filterMenuRef} className="relative shrink-0">
                <button
                  onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                    isFilterMenuOpen || selectedCategory !== 'todos'
                      ? 'bg-sky-500/20 border-sky-400/60 text-sky-300'
                      : 'bg-[#0e172a] hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                  title="Filtrar por categoria"
                  aria-label="Filtrar por categoria"
                >
                  <Filter className="w-4 h-4" />
                  {selectedCategory !== 'todos' && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400" />
                  )}
                </button>

                {isFilterMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 max-h-80 overflow-y-auto custom-scroll rounded-2xl bg-[#0d1528]/98 backdrop-blur-xl border border-sky-400/25 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1">
                      Categorias ({availableCategories.length})
                    </div>
                    {availableCategories.map((cat) => {
                      const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setIsFilterMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                            isActive
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                              : 'text-slate-300 hover:bg-white/[0.06] hover:text-white border border-transparent'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 ml-2 shrink-0">
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Active Category Indicator Chip (when filtered) */}
            {selectedCategory !== 'todos' && (
              <div className="px-3.5 py-2 flex items-center justify-between bg-sky-500/10 border-b border-sky-400/15 text-xs shrink-0">
                <span className="text-sky-300 font-semibold truncate">
                  Filtro: {availableCategories.find((c) => c.id.toLowerCase() === selectedCategory.toLowerCase())?.name || selectedCategory}
                </span>
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer ml-2 shrink-0"
                >
                  Limpar
                </button>
              </div>
            )}

            {/* Independent Scrollable Channel Cards */}
            <div
              onMouseMove={() => setIsKeyboardNavActive(false)}
              className="flex-1 min-h-0 overflow-y-auto px-3 py-2.5 space-y-2 custom-scroll"
            >
              {filteredChannels.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Nenhum canal encontrado.
                </div>
              ) : (
                filteredChannels.map((ch) => {
                  const isSelected = currentChannel?.id === ch.id;
                  const isTvFocused = isKeyboardNavActive && filteredChannels[tvFocusedIndex]?.id === ch.id;
                  const chLive = getLiveEPGForChannel(ch);
                  const programLabel =
                    chLive?.currentProgram && chLive.currentProgram !== 'Programacao Normal'
                      ? chLive.currentProgram
                      : ch.currentProgram || ch.category || '';

                  return (
                    <div
                      key={ch.id}
                      id={`channel-item-desk-${ch.id}`}
                      tabIndex={0}
                      onClick={() => onSelectChannel(ch)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          channel: ch,
                        });
                      }}
                      className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border outline-none ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#0f335c]/95 via-[#0c2647]/90 to-[#0a1b36]/90 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                          : isTvFocused
                          ? 'bg-[#122544] border-sky-400/60 ring-1 ring-sky-400/50'
                          : 'bg-[#0e1627]/80 border-white/[0.05] hover:bg-[#132038]/90 hover:border-sky-400/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* 3-Digit Channel Number */}
                        <span
                          className={`font-mono text-xs w-7 shrink-0 text-left ${
                            isSelected ? 'text-sky-300 font-bold' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {String(ch.number).padStart(3, '0')}
                        </span>

                        {/* Original Channel Logo */}
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {ch.logo ? (
                            <img
                              src={ch.logo}
                              alt={ch.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Tv className="w-5 h-5 text-slate-500" />
                          )}
                        </div>

                        {/* Channel Name & Current Program */}
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-sm font-bold truncate leading-tight ${
                              isSelected ? 'text-white' : 'text-slate-100 group-hover:text-white'
                            }`}
                          >
                            {ch.name}
                          </span>
                          {programLabel && (
                            <span className="text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
                              {programLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Favorite Star Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(ch.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors shrink-0 cursor-pointer"
                        title={ch.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        aria-label={ch.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Star
                          className={`w-4 h-4 transition-all ${
                            ch.isFavorite
                              ? 'fill-sky-400 text-sky-400'
                              : isSelected
                              ? 'text-sky-300/80 hover:text-sky-300'
                              : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* RIGHT COLUMN — PLAYER IPTV 16:9 + BOTTOM 3-SECTION INFO PANEL */}
        <div
          className={`flex flex-col min-w-0 ${
            isFullscreen
              ? 'w-full h-full'
              : 'w-full md:flex-1 md:h-full md:gap-3.5 overflow-hidden shrink-0 md:shrink'
          }`}
        >
          {/* VIDEO PLAYER CONTAINER (Preserves exact <video> + HLS engine) */}
          <div
            className={`relative bg-black shrink-0 md:shrink transition-all overflow-hidden ${
              isFullscreen
                ? 'w-full h-full rounded-none border-0'
                : 'w-full aspect-video md:aspect-auto md:flex-1 md:min-h-0 md:rounded-2xl md:border md:border-sky-400/20 md:shadow-[0_18px_50px_rgba(0,0,0,0.7)]'
            }`}
          >
            {/* Video Element */}
            <video
              ref={videoRef}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              className={`w-full h-full object-${aspectRatio === 'cover' ? 'cover' : 'contain'} cursor-default`}
              playsInline
              poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              autoPlay
              muted={isMuted}
            />

            {/* Video Tap Overlay Surface */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowControls((prev) => {
                  const next = !prev;
                  if (next) {
                    resetControlsTimer();
                  } else if (controlsTimeoutRef.current) {
                    window.clearTimeout(controlsTimeoutRef.current);
                  }
                  return next;
                });
                if (isMuted && videoRef.current) {
                  videoRef.current.muted = false;
                  videoRef.current.volume = volume;
                  setIsMuted(false);
                }
              }}
              className="absolute inset-0 z-10 cursor-pointer"
            />

            {/* Floating Unmute Button if Video Started Muted */}
            {isMuted && !isLoadingStream && !streamError && !isAutoplayBlocked && (
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.volume = volume;
                    setIsMuted(false);
                  }
                }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-sky-500/60 backdrop-blur-md text-sky-300 text-xs font-semibold shadow-md cursor-pointer transition-colors"
              >
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                <span>Clique ou toque para ativar o som</span>
              </button>
            )}

            {/* Play Button Fallback when Mobile Autoplay is Blocked */}
            {isAutoplayBlocked && (
              <button
                onClick={() => {
                  setIsAutoplayBlocked(false);
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.volume = volume;
                    setIsMuted(false);
                    videoRef.current.play().catch(() => {
                      if (videoRef.current) {
                        videoRef.current.muted = true;
                        setIsMuted(true);
                        videoRef.current.play().catch(() => {});
                      }
                    });
                  }
                }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg mb-3 transition-transform hover:scale-105">
                  <Play className="w-8 h-8 fill-white ml-1" />
                </div>
                <span className="text-white text-sm font-bold tracking-wide">Clique ou Toque para Assistir</span>
                <span className="text-sky-400 text-xs font-semibold mt-1">{currentChannel?.name}</span>
              </button>
            )}

            {/* Auto-Recovery Pulsing Indicator */}
            {isAutoRecovering && !streamError && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/90 border border-sky-500/40 backdrop-blur-md shadow-lg text-sky-300 text-xs font-semibold animate-pulse pointer-events-none">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Sinal instavel detectado. Sincronizando transmissao...</span>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoadingStream && (
              <div className="absolute inset-0 bg-[#070b14]/85 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none z-10 animate-in fade-in duration-200">
                <div className="w-18 h-18 rounded-2xl bg-[#0e172a] border border-sky-400/30 p-3 shadow-lg flex items-center justify-center mb-3">
                  {currentChannel?.logo ? (
                    <img
                      src={currentChannel.logo}
                      alt={currentChannel.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Tv className="w-8 h-8 text-sky-400" />
                  )}
                </div>
                <h3 className="text-white text-sm font-bold tracking-wide">
                  Sintonizando {currentChannel?.name || 'Canal'}...
                </h3>
                <p className="text-xs text-sky-400 mt-1 font-medium">
                  Carregando transmissao ao vivo
                </p>
              </div>
            )}

            {/* Stream Error Overlay */}
            {streamError && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
                  <Tv className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">{streamError}</h3>
                <p className="text-xs text-slate-400 max-w-md mb-3">
                  {channelSources.length > 1
                    ? `Voce pode alternar entre as ${channelSources.length} fontes disponiveis ou aguardar a reconexao automatica.`
                    : 'O sinal sera reiniciado automaticamente para restaurar a transmissao.'}
                </p>

                {isAutoRestartEnabled && (
                  <div className="flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-sky-950/70 border border-sky-500/30 text-sky-300 text-xs font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>Reconectando automaticamente em {autoRecoverySecondsLeft}s...</span>
                  </div>
                )}

                <div className="flex gap-3">
                  {channelSources.length > 1 && (
                    <button
                      onClick={cycleSource}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Alternar Fonte ({channelSources.findIndex((s) => s.id === activeSource) + 1}/{channelSources.length})
                    </button>
                  )}
                  <button
                    onClick={() => restartStream()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-sky-400" />
                    <span>Reconectar Agora</span>
                  </button>
                </div>
              </div>
            )}

            {/* MOBILE COMPACT OVERLAY ON VIDEO (Preserved) */}
            <div
              className={`md:hidden absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-b from-black/85 via-transparent to-black/90 pointer-events-none transition-opacity duration-300 z-20 ${
                isControlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  {isFullscreen ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                        resetControlsTimer();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-sky-500/50 text-white text-xs font-bold backdrop-blur-md cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 text-sky-400" />
                      <span>Sair</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      AO VIVO
                    </span>
                  )}
                  {channelSources.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleSource();
                        resetControlsTimer();
                      }}
                      className="px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-bold border border-white/20 backdrop-blur-md cursor-pointer"
                    >
                      Fonte {channelSources.findIndex((s) => s.id === activeSource) + 1}/{channelSources.length}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                      resetControlsTimer();
                    }}
                    className="p-1.5 rounded-lg bg-black/60 text-white border border-white/20 backdrop-blur-md cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                      resetControlsTimer();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-[10px] cursor-pointer"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize className="w-3.5 h-3.5" />
                        <span>Sair</span>
                      </>
                    ) : (
                      <>
                        <Maximize className="w-3.5 h-3.5" />
                        <span>Cinema</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpChannels('prev');
                      resetControlsTimer();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 text-slate-200 text-xs font-semibold border border-white/15 cursor-pointer"
                  >
                    <SkipBack className="w-3 h-3 text-sky-400" />
                    <span className="text-[10px]">Anterior</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpChannels('next');
                      resetControlsTimer();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 text-slate-200 text-xs font-semibold border border-white/15 cursor-pointer"
                  >
                    <span className="text-[10px]">Proximo</span>
                    <SkipForward className="w-3 h-3 text-sky-400" />
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAspectRatio(aspectRatio === 'contain' ? 'cover' : 'contain');
                    resetControlsTimer();
                  }}
                  className="px-2 py-1 rounded-lg bg-black/70 text-slate-200 text-[10px] font-bold border border-white/15 cursor-pointer"
                >
                  {aspectRatio === 'contain' ? 'Ajustar' : 'Expandir'}
                </button>
              </div>
            </div>

            {/* DESKTOP TOP PLAYER OVERLAY: Red AO VIVO Badge + Discreet PiP & Fullscreen Icons */}
            <div
              className={`${
                isFullscreen ? 'flex' : 'hidden md:flex'
              } absolute top-0 left-0 right-0 px-4 py-3.5 bg-gradient-to-b from-black/75 via-black/25 to-transparent items-center justify-between z-20 pointer-events-none transition-opacity duration-300 ${
                isControlsVisible || !isFullscreen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                onClick={jumpToLiveEdge}
                title="Sincronizar transmissao ao vivo"
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg cursor-pointer transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>AO VIVO</span>
              </button>

              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  onClick={togglePiP}
                  title="Picture-in-Picture"
                  className="w-9 h-9 rounded-lg bg-black/50 hover:bg-black/75 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
                  className="w-9 h-9 rounded-lg bg-black/50 hover:bg-black/75 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* DESKTOP BOTTOM PLAYER CONTROL BAR (Reference-faithful, preserving all features) */}
            <div
              className={`${
                isFullscreen ? 'flex' : 'hidden md:flex'
              } absolute bottom-0 left-0 right-0 px-4 py-3.5 bg-gradient-to-t from-black/90 via-black/55 to-transparent items-center justify-between gap-3 z-20 transition-opacity duration-300 ${
                isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Left Controls: Blue Play/Pause, Prev/Next, Volume Slider */}
              <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
                <button
                  onClick={togglePlayPause}
                  title={isPaused ? 'Retomar reproducao' : 'Pausar'}
                  className="w-10 h-9 rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer shrink-0"
                >
                  {isPaused ? (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  ) : (
                    <Pause className="w-4 h-4 fill-current" />
                  )}
                </button>

                <button
                  onClick={() => jumpChannels('prev')}
                  title="Canal anterior"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => jumpChannels('next')}
                  title="Proximo canal"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={toggleMute}
                    title={isMuted ? 'Ativar som (M)' : 'Silenciar (M)'}
                    className="p-1.5 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    className="w-24 lg:w-32 h-1.5 bg-white/25 rounded-full appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              {/* Right Controls: Source, Zero Delay, Anti-Trava, Aspect, Quality Pill, Fullscreen */}
              <div className="flex items-center gap-2 shrink-0">
                {channelSources.length > 1 && (
                  <button
                    onClick={cycleSource}
                    title="Alternar Fonte de Transmissao"
                    className="px-2.5 py-1.5 rounded-lg bg-black/55 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    Fonte {channelSources.findIndex((s) => s.id === activeSource) + 1}/{channelSources.length}
                  </button>
                )}

                <button
                  onClick={() => setZeroDelayActive(!zeroDelayActive)}
                  title="Alternar Modo Zero Delay"
                  className={`hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-colors cursor-pointer ${
                    zeroDelayActive
                      ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                      : 'bg-black/50 border-white/10 text-slate-400'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Zero Delay</span>
                </button>

                <button
                  onClick={() => {
                    const nextVal = !isAutoRestartEnabled;
                    setIsAutoRestartEnabled(nextVal);
                    try {
                      const raw = localStorage.getItem('mastertv_client_preferences');
                      const cur = raw ? JSON.parse(raw) : {};
                      localStorage.setItem(
                        'mastertv_client_preferences',
                        JSON.stringify({ ...cur, autoRestartOnFreeze: nextVal })
                      );
                    } catch {}
                  }}
                  title="Anti-Trava: Reinicia automaticamente se o sinal congelar"
                  className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-colors cursor-pointer ${
                    isAutoRestartEnabled
                      ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                      : 'bg-black/50 border-white/10 text-slate-400'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isAutoRecovering ? 'animate-spin' : ''}`} />
                  <span>Anti-Trava</span>
                </button>

                <button
                  onClick={() => setAspectRatio(aspectRatio === 'contain' ? 'cover' : 'contain')}
                  title={`Ajuste de Tela: ${aspectRatio === 'contain' ? 'Original' : 'Preencher'}`}
                  className="w-8 h-8 rounded-lg bg-black/55 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white hidden xl:flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={cycleQuality}
                  title="Alternar Qualidade de Video"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/65 hover:bg-white/15 border border-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-300" />
                  <span>
                    {quality === 'Auto' ? `AUTO (${currentChannel?.quality || 'HD'})` : quality}
                  </span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
                  className="w-9 h-9 rounded-lg bg-black/55 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* TV OSD Channel Banner (when zapping with remote / digits) */}
            {osdChannel && (
              <div className="absolute bottom-16 left-6 right-6 max-w-xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none">
                <div className="bg-[#0a1222]/95 backdrop-blur-xl border border-sky-400/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                      <img src={osdChannel.logo} alt={osdChannel.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sky-400 font-bold text-xs">
                          {String(osdChannel.number).padStart(3, '0')}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate">{osdChannel.name}</h3>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">
                        {getLiveEPGForChannel(osdChannel).currentProgram || osdChannel.currentProgram || 'Ao Vivo'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shrink-0">
                    AO VIVO
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM 3-SECTION CHANNEL & EPG INFO PANEL (Desktop only, non-fullscreen) */}
          {!isFullscreen && (
            <div className="hidden md:grid grid-cols-12 items-center rounded-2xl bg-[#0a1222]/95 backdrop-blur-xl border border-sky-400/20 px-5 py-3.5 shadow-[0_12px_35px_rgba(0,0,0,0.55)] shrink-0">
              {/* SECTION 1 — CURRENT CHANNEL */}
              <div className="col-span-4 flex items-center gap-3.5 pr-4 border-r border-white/10 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                  {currentChannel?.logo ? (
                    <img
                      src={currentChannel.logo}
                      alt={currentChannel.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Tv className="w-6 h-6 text-sky-400" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-sm lg:text-base font-extrabold text-white truncate leading-tight">
                    {currentChannel?.name || 'Selecione um canal'}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                    <span className="text-slate-300 font-semibold">
                      {currentChannel ? String(currentChannel.number).padStart(3, '0') : '---'}
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="truncate font-sans uppercase text-[11px] tracking-wide">
                      {currentChannel?.category || currentChannel?.quality || 'TV Ao Vivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2 — CURRENT PROGRAM (REAL EPG) */}
              <div className="col-span-4 flex flex-col justify-center px-5 border-r border-white/10 min-w-0">
                {hasRealCurrentEPG && currentLiveInfo ? (
                  <>
                    <h3 className="text-sm font-bold text-white truncate leading-tight">
                      {currentLiveInfo.currentProgram}
                    </h3>
                    <span className="text-xs font-mono text-slate-400 mt-1">
                      {currentLiveInfo.currentProgramTime}
                    </span>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-sky-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, currentLiveInfo.progressPercent || 0))}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-300 truncate">
                      {currentChannel?.currentProgram && currentChannel.currentProgram !== 'Programacao Normal'
                        ? currentChannel.currentProgram
                        : 'Programacao indisponivel'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Informacoes de EPG nao disponiveis para este canal
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 3 — NEXT PROGRAM (REAL EPG + CLICK TO OPEN FULL EPG GUIDE) */}
              <div
                onClick={handleOpenEPG}
                title="Abrir Guia de Programacao Completo"
                className="col-span-4 flex items-center gap-3.5 pl-5 min-w-0 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition-colors shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-sky-400 leading-tight">
                    Próximo programa:
                  </span>
                  {hasRealNextEPG && currentLiveInfo ? (
                    <>
                      <h4 className="text-sm font-bold text-white truncate mt-0.5 group-hover:text-sky-300 transition-colors leading-tight">
                        {currentLiveInfo.nextProgram}
                      </h4>
                      <span className="text-xs font-mono text-slate-400 mt-0.5">
                        {currentLiveInfo.nextProgramTime || ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 mt-0.5 truncate">
                      Programacao indisponivel
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Click Context Menu for Channels */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-52 bg-[#0d1528]/98 backdrop-blur-xl border border-sky-400/25 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 text-xs text-white animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold text-sky-400 uppercase tracking-wider border-b border-white/10">
            {contextMenu.channel.name}
          </div>
          <button
            onClick={() => {
              onToggleFavorite(contextMenu.channel.id);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {contextMenu.channel.isFavorite ? 'Remover dos Favoritos' : 'Favoritar Canal'}
            </span>
          </button>
          {channelSources.length > 1 && (
            <button
              onClick={() => {
                cycleSource();
                setContextMenu(null);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Alternar Fonte ({channelSources.findIndex((s) => s.id === activeSource) + 1}/{channelSources.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.channel.streamUrl);
              setCopiedUrl(true);
              setTimeout(() => {
                setCopiedUrl(false);
                setContextMenu(null);
              }, 1200);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors cursor-pointer"
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

      {/* MOBILE APP INTERFACE (TiviMate / Smarters style) - Below Video */}
      {!isFullscreen && (
        <div className="flex-1 min-h-0 flex flex-col w-full bg-[#07090e] md:hidden overflow-hidden">
          {/* Active Channel Strip Header */}
          <div className="shrink-0 p-3 bg-gradient-to-b from-[#0b0e14] to-[#07090e] border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-xl bg-slate-900 border border-blue-500/30 p-1 flex items-center justify-center shrink-0 shadow-md shadow-blue-950/30">
                {currentChannel?.logo ? (
                  <img
                    src={currentChannel.logo}
                    alt={currentChannel.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Tv className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-blue-400">
                    CH {currentChannel?.number ? String(currentChannel.number).padStart(2, '0') : '01'}
                  </span>
                  <h2 className="text-sm font-extrabold text-white truncate">
                    {currentChannel?.name || 'Canal'}
                  </h2>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {currentChannel?.quality || 'HD'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-semibold truncate mt-0.5">
                  {currentLiveInfo?.currentProgram || currentChannel?.currentProgram || 'Programacao Ao Vivo'}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="text-blue-400 font-mono font-bold">
                    {currentLiveInfo?.currentProgramTime || currentChannel?.currentProgramTime || 'Agora'}
                  </span>
                  <span>· {currentLiveInfo?.durationText || 'Ao Vivo'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => currentChannel && onToggleFavorite(currentChannel.id)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 shrink-0 transition-all cursor-pointer"
              title="Favoritar"
            >
              <Star
                className={`w-5 h-5 ${
                  currentChannel?.isFavorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-400'
                }`}
              />
            </button>
          </div>

          {/* Progress bar of current program */}
          {currentLiveInfo && (
            <div className="shrink-0 w-full h-1 bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${currentLiveInfo.progressPercent}%` }}
              />
            </div>
          )}

          {/* Mobile App Navigation Tabs (Smarters / TiviMate style) */}
          <div className="shrink-0 grid grid-cols-3 bg-[#0d111a] border-b border-white/10 p-1 gap-1">
            <button
              onClick={() => setMobileTab('channels')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'channels'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Canais ({filteredChannels.length})</span>
            </button>

            <button
              onClick={() => setMobileTab('categories')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categorias</span>
            </button>

            <button
              onClick={() => setMobileTab('epg')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'epg'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Guia EPG</span>
            </button>
          </div>

          {/* TAB 1: CANAIS */}
          {mobileTab === 'channels' && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 custom-scroll pb-24">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar canal ou programa..."
                  value={searchChannel}
                  onChange={(e) => setSearchChannel(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
                {searchChannel && (
                  <button
                    onClick={() => setSearchChannel('')}
                    className="absolute right-3 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pills Horizontal Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => {
                  const isCatActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isCatActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                          : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Channel Cards (Zapping Rapido) */}
              <div className="space-y-2">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Nenhum canal encontrado nesta categoria.
                  </div>
                ) : (
                  filteredChannels.map((ch) => {
                    const isSelected = currentChannel?.id === ch.id;
                    const isTvFocused = isKeyboardNavActive && filteredChannels[tvFocusedIndex]?.id === ch.id;
                    const chLive = getLiveEPGForChannel(ch);
                    return (
                      <div
                        key={ch.id}
                        id={`channel-item-${ch.id}`}
                        tabIndex={0}
                        onClick={() => onSelectChannel(ch)}
                        className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border outline-none ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-900/30 ring-1 ring-blue-500'
                            : isTvFocused
                            ? 'bg-white/15 border-blue-400 ring-2 ring-blue-500 shadow-lg shadow-blue-900/40 scale-[1.01]'
                            : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Channel Number */}
                          <span
                            className={`font-mono text-xs w-6 text-right shrink-0 font-black ${
                              isSelected ? 'text-blue-400' : 'text-slate-500'
                            }`}
                          >
                            {String(ch.number).padStart(2, '0')}
                          </span>

                          {/* Channel Logo */}
                          <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            <img
                              src={ch.logo}
                              alt={ch.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>

                          {/* Channel Name, Program & Progress */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm truncate font-bold ${
                                  isSelected ? 'text-blue-300' : 'text-white'
                                }`}
                              >
                                {ch.name}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400">
                                {ch.quality || 'HD'}
                              </span>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-blue-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm"></span>
                                  NO AR
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 truncate max-w-[220px] mt-0.5 font-medium">
                              {chLive.currentProgram}
                            </span>
                            {/* Real-time progress bar */}
                            <div className="w-full max-w-[180px] h-[3px] bg-slate-800 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${chLive.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Star Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(ch.id);
                          }}
                          className="p-2 text-slate-400 hover:text-yellow-400 transition-all shrink-0 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              ch.isFavorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'opacity-30'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIAS */}
          {mobileTab === 'categories' && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 grid grid-cols-2 gap-2.5 custom-scroll pb-24">
              {categories.map((cat) => {
                const count =
                  cat.id === 'todos'
                    ? channels.length
                    : cat.id === 'favoritos'
                    ? channels.filter((c) => c.isFavorite).length
                    : channels.filter((c) => c.category.toLowerCase() === cat.id.toLowerCase()).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setMobileTab('channels');
                    }}
                    className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-blue-500/50 transition-all text-left cursor-pointer group shadow-lg"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-105 transition-transform">
                      <Tv className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-extrabold text-white group-hover:text-blue-300 transition-colors">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {count} {count === 1 ? 'canal' : 'canais'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: GUIA EPG */}
          {mobileTab === 'epg' && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 custom-scroll pb-24">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Grade de Programacao
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentChannel?.name}
                  </p>
                </div>
                <button
                  onClick={handleOpenEPG}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Grade Completa</span>
                </button>
              </div>

              {/* Timeline Items */}
              <div className="space-y-2">
                {currentTimeline.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Carregando guia de programacao...
                  </div>
                ) : (
                  currentTimeline.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        item.isLive
                          ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-900/30'
                          : 'bg-slate-900/60 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              item.isLive ? 'text-blue-400' : 'text-slate-400'
                            }`}
                          >
                            {item.startTime} - {item.endTime}
                          </span>
                          {item.isLive && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white shadow-sm shadow-red-600/30">
                              NO AR AGORA
                            </span>
                          )}
                        </div>
                        {item.rating && (
                          <span className="text-[10px] font-mono font-bold px-1 rounded bg-white/10 text-slate-300">
                            {item.rating}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-bold ${
                          item.isLive ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.synopsis && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {item.synopsis}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
