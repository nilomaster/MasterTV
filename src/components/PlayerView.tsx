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
  ChevronDown,
  Play
} from 'lucide-react';
import type { Channel, Category } from '../types/iptv';
import { getLiveEPGForChannel, getChannelTimelinePrograms } from '../services/epgService';
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
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
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
  const [mobileTab, setMobileTab] = useState<'channels' | 'categories' | 'epg'>('channels');
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

  // TV Box Remote Control & D-Pad Navigation state
  const [tvFocusedIndex, setTvFocusedIndex] = useState<number>(0);
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

  const activeSourceObj = channelSources.find((s) => s.id === activeSource) || channelSources[0];
  const streamToPlay = activeSourceObj?.url || currentChannel?.streamUrl || '';

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
      setActiveSource((prev) => {
        const currentIdx = channelSources.findIndex((s) => s.id === prev);
        if (currentIdx !== -1 && currentIdx < channelSources.length - 1) {
          return channelSources[currentIdx + 1].id;
        }
        setIsLoadingStream(false);
        setStreamError('Sinal temporariamente indisponivel nesta fonte');
        return prev;
      });
    }, 15000);

    if (isHlsStream) {
      // High-performance low latency config for fast channel zapping and low memory devices
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startFragPrefetch: true,
        backBufferLength: 10,
        maxBufferLength: 8,
        maxMaxBufferLength: 15,
        maxBufferSize: 30 * 1000 * 1000,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        fragLoadingTimeOut: 15000,
        manifestLoadingTimeOut: 15000,
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

        video.muted = isMuted;
        video.volume = isMuted ? 0 : volume;
        video.play().catch(() => {
          // If unmuted autoplay is rejected by mobile policy, play muted safely without stalling
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {
            setIsAutoplayBlocked(true);
            setIsLoadingStream(false);
          });
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
                setActiveSource((prev) => {
                  const currentIdx = channelSources.findIndex((s) => s.id === prev);
                  if (currentIdx !== -1 && currentIdx < channelSources.length - 1) {
                    return channelSources[currentIdx + 1].id;
                  }
                  setStreamError('Sinal temporariamente indisponivel nesta fonte');
                  setIsLoadingStream(false);
                  hls.destroy();
                  return prev;
                });
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
        video.muted = isMuted;
        video.volume = isMuted ? 0 : volume;
        video.play().catch(() => {
          // If unmuted autoplay is rejected by mobile policy, play muted safely without stalling
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {
            setIsAutoplayBlocked(true);
            setIsLoadingStream(false);
          });
        });
      };
      video.onloadedmetadata = handleReady;
      video.oncanplay = handleReady;
      video.onerror = () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setActiveSource((prev) => {
          const currentIdx = channelSources.findIndex((s) => s.id === prev);
          if (currentIdx !== -1 && currentIdx < channelSources.length - 1) {
            return channelSources[currentIdx + 1].id;
          }
          setIsLoadingStream(false);
          setStreamError('Transmissao temporariamente indisponivel nesta fonte');
          return prev;
        });
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
  }, [currentChannelId, streamToPlay, zeroDelayActive, channelSources]);

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
      } else if (e.key === 'Escape' || e.key === 'Back') {
        if (isDrawerOpen) {
          e.preventDefault();
          setIsDrawerOpen(false);
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

  // Get full timeline programs for mobile EPG tab
  const currentTimeline = useMemo(() => {
    if (!currentChannel) return [];
    void epgRevision;
    const now = Date.now();
    return getChannelTimelinePrograms(
      currentChannel.id,
      now - 4 * 3600 * 1000,
      now + 16 * 3600 * 1000,
      now
    );
  }, [currentChannel, epgRevision]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full bg-[#07090e] select-none font-sans ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen overflow-hidden'
          : 'h-[100dvh] overflow-hidden flex flex-col md:block relative'
      }`}
    >
      {/* Video Container (Pinned 16:9 on Mobile, Full-screen Cinema on Desktop) */}
      <div
        className={`relative bg-black shrink-0 transition-all ${
          isFullscreen
            ? 'w-full h-full'
            : 'w-full aspect-video md:static md:w-full md:h-full md:aspect-auto'
        }`}
      >
        {/* Video Element - Live TV without pause capability */}
        <video
          ref={videoRef}
          className={`w-full h-full object-${aspectRatio === 'cover' ? 'cover' : 'contain'} cursor-default`}
          playsInline
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          autoPlay
          muted={isMuted}
          onClick={() => {
            setShowControls((prev) => !prev);
            // On user tap, if muted by mobile autoplay policy, unmute seamlessly
            if (isMuted && videoRef.current) {
              videoRef.current.muted = false;
              videoRef.current.volume = volume;
              setIsMuted(false);
            }
          }}
        />

        {/* Small floating Unmute button on mobile if video started muted */}
        {isMuted && !isLoadingStream && !streamError && !isAutoplayBlocked && (
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.volume = volume;
                setIsMuted(false);
              }
            }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 border border-cyan-400/60 backdrop-blur-md text-cyan-300 text-xs font-semibold shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer animate-pulse"
          >
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
            <span>Toque para ativar o som</span>
          </button>
        )}

        {/* Big Tap to Play Button when mobile browser blocks autoplay */}
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
            <div className="w-16 h-16 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.6)] animate-pulse mb-3">
              <Play className="w-8 h-8 fill-slate-950 ml-1" />
            </div>
            <span className="text-white text-sm font-bold tracking-wide">Toque para Assistir</span>
            <span className="text-cyan-400 text-xs font-semibold mt-1">{currentChannel?.name}</span>
          </button>
        )}

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
            {channelSources.length > 1
              ? `Voce pode alternar entre as ${channelSources.length} fontes disponiveis ou selecionar outro canal.`
              : 'Voce pode tentar recarregar a transmissao ou selecionar outro canal.'}
          </p>
          <div className="flex gap-3">
            {channelSources.length > 1 && (
              <button
                onClick={cycleSource}
                className="px-4 py-2 bg-[#4fe3d0] hover:bg-[#38d4c1] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#4fe3d0]/20"
              >
                Alternar Fonte ({channelSources.findIndex((s) => s.id === activeSource) + 1}/{channelSources.length})
              </button>
            )}
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

      {/* MOBILE COMPACT OVERLAY ON VIDEO (When not in fullscreen) */}
      {!isFullscreen && (
        <div
          className={`md:hidden absolute inset-0 flex flex-col justify-between p-2.5 bg-gradient-to-b from-black/80 via-transparent to-black/85 pointer-events-none transition-opacity duration-300 z-20 ${
            isControlsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Row: Live badge, Source switch, Mute, Cinema Mode */}
          <div className="flex items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md shadow-red-600/30">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                AO VIVO
              </span>
              {channelSources.length > 1 && (
                <button
                  onClick={cycleSource}
                  className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold border border-white/20 backdrop-blur-md cursor-pointer"
                >
                  Fonte {channelSources.findIndex((s) => s.id === activeSource) + 1}/{channelSources.length}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </button>
              <button
                onClick={toggleFullscreen}
                title="Modo Cinema em Tela Cheia"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] shadow-lg shadow-cyan-500/30 backdrop-blur-md cursor-pointer"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>Cinema</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Quick Prev/Next zapping & aspect ratio */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => jumpChannels('prev')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-slate-200 text-xs font-semibold border border-white/15 backdrop-blur-md cursor-pointer"
              >
                <SkipBack className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px]">Anterior</span>
              </button>
              <button
                onClick={() => jumpChannels('next')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-slate-200 text-xs font-semibold border border-white/15 backdrop-blur-md cursor-pointer"
              >
                <span className="text-[10px]">Próximo</span>
                <SkipForward className="w-3 h-3 text-cyan-400" />
              </button>
            </div>

            <button
              onClick={() => setAspectRatio(aspectRatio === 'contain' ? 'cover' : 'contain')}
              className="px-2 py-1 rounded-lg bg-black/70 text-slate-200 text-[10px] font-bold border border-white/15 backdrop-blur-md cursor-pointer"
            >
              {aspectRatio === 'contain' ? 'Ajustar' : 'Expandir'}
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR OVERLAY - Anchored to top: 0 with seamless downward gradient */}
      <div
        className={`${isFullscreen ? 'flex' : 'hidden md:flex'} absolute top-0 left-0 right-0 pt-16 sm:pt-20 px-4 sm:px-6 lg:px-8 pb-10 bg-gradient-to-b from-black/95 via-black/60 to-transparent items-start justify-between z-20 pointer-events-none transition-opacity duration-300 ${
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

      {/* LEFT CHANNEL DRAWER - Desktop */}
      {isDrawerOpen && (
        <aside
          className="hidden md:flex absolute top-16 sm:top-20 bottom-16 sm:bottom-20 left-2 right-2 sm:right-auto sm:left-4 sm:w-88 lg:w-96 rounded-[24px] bg-[#0b0e14]/90 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex-col z-30 overflow-hidden border border-white/15 animate-in fade-in slide-in-from-left-4 duration-200"
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
                const isTvFocused = filteredChannels[tvFocusedIndex]?.id === ch.id;
                const chLive = getLiveEPGForChannel(ch.id);
                return (
                  <div
                    key={ch.id}
                    id={`channel-item-desk-${ch.id}`}
                    tabIndex={0}
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
                    className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border-2 outline-none ${
                      isSelected
                        ? 'bg-white/15 border-[#4fe3d0] shadow-[0_0_20px_rgba(79,227,208,0.25)]'
                        : isTvFocused
                        ? 'bg-white/20 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.4)] scale-[1.01]'
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
          {channelSources.length > 1 && (
            <button
              onClick={() => {
                cycleSource();
                setContextMenu(null);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
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
        className={`${isFullscreen ? 'flex' : 'hidden md:flex'} absolute bottom-16 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 lg:left-8 lg:right-8 z-30 transition-opacity duration-300 ${
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
            {channelSources.length > 1 && (
              <button
                onClick={cycleSource}
                title="Alternar Fonte de Transmissao"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
              >
                <span>Fonte {channelSources.findIndex((s) => s.id === activeSource) + 1}/{channelSources.length}</span>
              </button>
            )}

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

      {/* TV OSD Channel Banner (TiviMate style when zapping with remote) */}
      {osdChannel && (
        <div className="absolute bottom-6 left-6 right-6 max-w-2xl mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none">
          <div className="bg-[#0b0e14]/95 backdrop-blur-2xl border-2 border-cyan-400 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,240,255,0.35)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-950 border border-white/15 flex items-center justify-center p-1.5 shrink-0">
                <img
                  src={osdChannel.logo}
                  alt={osdChannel.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-black text-xs sm:text-sm">
                    CH {String(osdChannel.number).padStart(2, '0')}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    {osdChannel.name}
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    {osdChannel.quality || 'HD'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold truncate mt-0.5">
                  {getLiveEPGForChannel(osdChannel.id).currentProgram || osdChannel.currentProgram || 'Ao Vivo'}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="text-cyan-400 font-mono font-bold">
                    {getLiveEPGForChannel(osdChannel.id).currentProgramTime || osdChannel.currentProgramTime || 'Agora'}
                  </span>
                  <span>· {getLiveEPGForChannel(osdChannel.id).durationText || 'Ao Vivo'}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                AO VIVO
              </span>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* MOBILE APP INTERFACE (TiviMate / Smarters style) - Below Video */}
      {!isFullscreen && (
        <div className="flex-1 min-h-0 flex flex-col w-full bg-[#07090e] md:hidden overflow-hidden">
          {/* Active Channel Strip Header */}
          <div className="shrink-0 p-3 bg-gradient-to-b from-[#0b0e14] to-[#07090e] border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-xl bg-slate-900 border border-cyan-500/30 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                {currentChannel?.logo ? (
                  <img
                    src={currentChannel.logo}
                    alt={currentChannel.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Tv className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    CH {currentChannel?.number ? String(currentChannel.number).padStart(2, '0') : '01'}
                  </span>
                  <h2 className="text-sm font-extrabold text-white truncate">
                    {currentChannel?.name || 'Canal'}
                  </h2>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {currentChannel?.quality || 'HD'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-semibold truncate mt-0.5">
                  {currentLiveInfo?.currentProgram || currentChannel?.currentProgram || 'Programacao Ao Vivo'}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="text-cyan-400 font-mono font-bold">
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
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
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
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
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
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
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
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
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
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
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
                          ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/25'
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
                    const isTvFocused = filteredChannels[tvFocusedIndex]?.id === ch.id;
                    const chLive = getLiveEPGForChannel(ch.id);
                    return (
                      <div
                        key={ch.id}
                        id={`channel-item-${ch.id}`}
                        tabIndex={0}
                        onClick={() => onSelectChannel(ch)}
                        className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border outline-none ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                            : isTvFocused
                            ? 'bg-white/20 border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] scale-[1.01]'
                            : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Channel Number */}
                          <span
                            className={`font-mono text-xs w-6 text-right shrink-0 font-black ${
                              isSelected ? 'text-cyan-400' : 'text-slate-500'
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
                                  isSelected ? 'text-cyan-300' : 'text-white'
                                }`}
                              >
                                {ch.name}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400">
                                {ch.quality || 'HD'}
                              </span>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-cyan-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
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
                                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
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
                    className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/50 transition-all text-left cursor-pointer group shadow-lg"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                      <Tv className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
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
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                          ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                          : 'bg-slate-900/60 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              item.isLive ? 'text-cyan-400' : 'text-slate-400'
                            }`}
                          >
                            {item.startTime} - {item.endTime}
                          </span>
                          {item.isLive && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white animate-pulse">
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
