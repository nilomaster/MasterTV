// Dedicated VOD (Video on Demand) Player View for Movies, Series and Animes
// Styled strictly identical to Saimo TV (edge-to-edge controls, center red play button, settings popover)
// Strictly ASCII comments only as per project guidelines

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  ArrowLeft,
  Tv,
  List,
  PictureInPicture,
  Settings,
  X,
  Sliders,
} from 'lucide-react';
import type { MediaItem, EpisodeItem } from '../types/iptv';

interface VODPlayerViewProps {
  mediaItem: MediaItem;
  currentEpisode?: EpisodeItem;
  streamUrl: string;
  title: string;
  onBack: () => void;
  onSelectEpisode?: (episode: EpisodeItem) => void;
}

export const VODPlayerView: React.FC<VODPlayerViewProps> = ({
  mediaItem,
  currentEpisode,
  streamUrl,
  title,
  onBack,
  onSelectEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [skipSeconds, setSkipSeconds] = useState<number>(10);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | '16-9' | 'original'>('contain');
  const [superResolution, setSuperResolution] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);

  // Settings & Popover state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [availableLevels, setAvailableLevels] = useState<{ id: number; name: string }[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
  const [subtitleSync, setSubtitleSync] = useState<number>(0);

  // Volume state
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('mastertv_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('mastertv_muted') === 'true';
  });

  // UI state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoadingStream, setIsLoadingStream] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState<boolean>(false);
  const [activeSource, setActiveSource] = useState<number>(1);

  const controlsTimeoutRef = useRef<number | null>(null);

  // Active stream URL based on selected source
  const effectiveStreamUrl =
    activeSource === 2 && (currentEpisode?.backupStreamUrl || mediaItem.backupStreamUrl)
      ? (currentEpisode?.backupStreamUrl || mediaItem.backupStreamUrl || streamUrl)
      : streamUrl;

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const totalSecs = Math.floor(timeInSeconds);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Reset controls timer
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !isEpisodeDrawerOpen && !isSettingsOpen && !isDraggingProgress) {
        setShowControls(false);
      }
    }, 4500);
  }, [isPlaying, isEpisodeDrawerOpen, isSettingsOpen, isDraggingProgress]);

  // Handle desktop mouse movement to reveal controls
  useEffect(() => {
    const handleActivity = () => resetControlsTimer();
    window.addEventListener('mousemove', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimer]);

  // Close settings popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  // Video source initializer (HLS vs native MP4)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveStreamUrl) return;

    setIsLoadingStream(true);
    setStreamError(null);
    const resumeTime = video.currentTime > 0 ? video.currentTime : 0;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isDirectVideo =
      effectiveStreamUrl.includes('.mp4') ||
      effectiveStreamUrl.includes('.mkv') ||
      effectiveStreamUrl.includes('workers.dev');

    const isHls =
      !isDirectVideo &&
      Hls.isSupported() &&
      (effectiveStreamUrl.includes('.m3u8') || effectiveStreamUrl.includes('.txt') || effectiveStreamUrl.includes('/api/proxy'));

    let connectTimeout: number | null = window.setTimeout(() => {
      setIsLoadingStream(false);
      setStreamError('Nao foi possivel carregar o video. Tente novamente.');
    }, 12000);

    if (isHls) {
      const hls = new Hls({
        enableWorker: true,
        startFragPrefetch: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
      });

      hlsRef.current = hls;
      hls.loadSource(effectiveStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setIsLoadingStream(false);

        // Populate Saimo TV Quality options from stream levels
        if (data && data.levels && data.levels.length > 1) {
          const lvls = data.levels.map((lvl, index) => ({
            id: index,
            name: lvl.height ? `${lvl.height}p` : `Nivel ${index + 1}`,
          }));
          setAvailableLevels([{ id: -1, name: 'Automatica' }, ...lvls]);
        } else if (data && data.levels && data.levels.length === 1) {
          const h = data.levels[0].height;
          setAvailableLevels([
            { id: -1, name: 'Automatica' },
            { id: 0, name: h ? `${h}p` : '1080p' },
          ]);
        } else {
          setAvailableLevels([{ id: -1, name: 'Automatica' }]);
        }

        if (resumeTime > 0) {
          video.currentTime = resumeTime;
        }
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (connectTimeout) {
            window.clearTimeout(connectTimeout);
            connectTimeout = null;
          }
          // Automatically try fallback source if available
          if (activeSource === 1 && (mediaItem?.backupStreamUrl || currentEpisode?.backupStreamUrl)) {
            setActiveSource(2);
            return;
          }
          setIsLoadingStream(false);
          setStreamError('Erro ao carregar a transmissao deste titulo.');
          hls.destroy();
        }
      });
    } else {
      video.src = effectiveStreamUrl;
      setAvailableLevels([
        { id: -1, name: 'Automatica' },
        { id: 0, name: '1080p' },
      ]);

      const handleReady = () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setIsLoadingStream(false);
        if (resumeTime > 0) {
          video.currentTime = resumeTime;
        }
        video.play().catch(() => {
          setIsPlaying(false);
        });
      };

      video.onloadedmetadata = handleReady;
      video.oncanplay = handleReady;
      video.onerror = () => {
        if (connectTimeout) {
          window.clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setIsLoadingStream(false);
        if (activeSource === 1 && mediaItem?.backupStreamUrl && mediaItem.backupStreamUrl !== mediaItem.streamUrl) {
          setActiveSource(2);
          return;
        }
        setStreamError('Erro ao reproduzir o arquivo de video.');
      };
    }

    return () => {
      if (connectTimeout) window.clearTimeout(connectTimeout);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onerror = null;
      }
    };
  }, [effectiveStreamUrl]);

  // Video time and buffer listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isDraggingProgress) {
        setCurrentTime(video.currentTime);
      }
      if (video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
            setBufferedEnd(video.buffered.end(i));
            break;
          }
        }
      }
    };

    const handleDurationChange = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isDraggingProgress]);

  // Volume sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
    localStorage.setItem('mastertv_volume', volume.toString());
    localStorage.setItem('mastertv_muted', isMuted ? 'true' : 'false');
  }, [volume, isMuted]);

  // Playback speed sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Play/Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  // Skip seconds forward / backward
  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.min(Math.max(0, video.currentTime + seconds), duration || 999999);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimer();
  };

  // Timeline scrub handling
  const seekToPosition = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimer();
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingProgress(true);
    seekToPosition(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      seekToPosition(moveEvent);
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = hoverX / rect.width;
    setHoverTime(percentage * duration);
    setHoverPosition(hoverX);
  };

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Picture in Picture toggle
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch {}
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.keyCode === 10009) {
        e.preventDefault();
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isEpisodeDrawerOpen) {
          setIsEpisodeDrawerOpen(false);
        } else {
          onBack();
        }
        return;
      }
      switch (e.key) {
        case ' ':
        case 'k':
        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause':
          e.preventDefault();
          togglePlay();
          resetControlsTimer();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'MediaRewind':
          e.preventDefault();
          handleSkip(-skipSeconds);
          break;
        case 'ArrowRight':
        case 'l':
        case 'MediaFastForward':
          e.preventDefault();
          handleSkip(skipSeconds);
          break;
        case 'MediaStop':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((prev) => Math.min(1, prev + 0.05));
          setIsMuted(false);
          resetControlsTimer();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((prev) => Math.max(0, prev - 0.05));
          resetControlsTimer();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          resetControlsTimer();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
        case 'Back':
        case 'XF86Back':
          e.preventDefault();
          if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else if (isEpisodeDrawerOpen) {
            setIsEpisodeDrawerOpen(false);
          } else {
            onBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, skipSeconds, isSettingsOpen, isEpisodeDrawerOpen, onBack]);

  const hasEpisodes = Boolean(
    (mediaItem.type === 'series' || mediaItem.type === 'anime') &&
    mediaItem.episodeList &&
    mediaItem.episodeList.length > 0
  );

  const nextEpisode = currentEpisode && mediaItem.episodeList
    ? mediaItem.episodeList.find((ep) => ep.number === currentEpisode.number + 1)
    : undefined;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  // Change HLS level
  const handleQualityChange = (levelId: number) => {
    setSelectedLevel(levelId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
    }
  };

  const currentLevelName = availableLevels.find((l) => l.id === selectedLevel)?.name || '1080p';

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center select-none font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        style={{
          filter: `${brightness !== 100 ? `brightness(${brightness}%)` : ''} ${superResolution ? 'contrast(1.08) saturate(1.08)' : ''}`,
          imageRendering: superResolution ? '-webkit-optimize-contrast' : 'auto',
        }}
        className={`w-full h-full cursor-default transition-all ${
          aspectRatio === 'cover'
            ? 'object-cover'
            : aspectRatio === '16-9'
            ? 'aspect-video object-contain'
            : aspectRatio === 'original'
            ? 'object-none'
            : 'object-contain'
        }`}
      />

      {/* Video Tap Overlay Surface - Clean tap to toggle controls */}
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
        }}
        className="absolute inset-0 z-10 cursor-pointer"
      />

      {/* Loading Spinner */}
      {isLoadingStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4 shadow-[0_0_20px_rgba(0,240,255,0.4)]" />
          <p className="text-sm font-bold text-white tracking-wide">Carregando em alta definicao...</p>
          <span className="text-xs text-slate-400 mt-1">{title}</span>
        </div>
      )}

      {/* Stream Error Modal */}
      {streamError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
            <Tv className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{streamError}</h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Ocorreu uma instabilidade na reproducao deste titulo. Tente recarregar ou voltar para o catalogo.
          </p>
          <div className="flex gap-3">
            {Boolean(mediaItem.backupStreamUrl || currentEpisode?.backupStreamUrl) && (
              <button
                onClick={() => {
                  setActiveSource((s) => (s === 1 ? 2 : 1));
                  setStreamError(null);
                  setIsLoadingStream(true);
                }}
                className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-400/25 cursor-pointer"
              >
                Alternar para Fonte {activeSource === 1 ? '2' : '1'}
              </button>
            )}
            <button
              onClick={() => {
                setStreamError(null);
                setIsLoadingStream(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Tentar Novamente
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Voltar ao Catalogo
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER OVERLAY (Saimo TV Clean Style) */}
      <div
        className={`absolute top-0 left-0 right-0 pt-4 sm:pt-6 px-4 sm:px-8 pb-12 bg-gradient-to-b from-black/90 via-black/45 to-transparent flex items-center justify-between z-20 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-3.5 pointer-events-auto">
          {/* Saimo TV Back Icon */}
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/15 text-slate-200 hover:text-white transition-all cursor-pointer group"
            title="Voltar ao Catalogo"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Saimo TV Title and Category */}
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow leading-tight">
              {mediaItem.title}
            </h1>
            <span className="text-xs text-slate-400 font-medium capitalize mt-0.5">
              {currentEpisode
                ? `Temporada 1 · Ep. ${currentEpisode.number} - ${currentEpisode.title}`
                : mediaItem.type === 'movie'
                ? 'Filmes'
                : mediaItem.type === 'series'
                ? 'Series'
                : 'Animes'}
            </span>
          </div>
        </div>

        {/* Right side resolution pill */}
        <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white/10 text-cyan-300 border border-white/10 backdrop-blur-md shadow">
            {currentLevelName === 'Automatica' ? '1080P Full HD' : currentLevelName.toUpperCase()}
          </span>
        </div>
      </div>

      {/* BOTTOM VOD CONTROLS BAR (Saimo TV Full-Width Edge-to-Edge) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 pb-3 sm:pb-4 pt-12 px-4 sm:px-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full flex flex-col gap-2.5">
          {/* 1. Saimo TV Full-width Progress Bar */}
          <div
            ref={progressBarRef}
            onMouseDown={handleProgressBarMouseDown}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={handleProgressBarMouseLeave}
            className="group relative w-full h-1.5 hover:h-2.5 transition-all cursor-pointer bg-white/20 rounded-full flex items-center"
          >
            {/* Buffered Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-white/30 transition-all pointer-events-none"
              style={{ width: `${bufferedPercent}%` }}
            />

            {/* Played Progress Bar (Purple Saimo TV Gradient) */}
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-purple-600 transition-all pointer-events-none shadow-[0_0_10px_rgba(168,85,247,0.7)]"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Saimo TV Purple Thumb Handle */}
            <div
              className="absolute -ml-2 w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow-[0_0_12px_rgba(168,85,247,0.9)] opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-110 pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Hover Time Tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/95 text-purple-300 font-mono text-[11px] font-bold border border-purple-500/30 shadow-lg pointer-events-none whitespace-nowrap"
                style={{ left: `${hoverPosition}px` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* 2. Saimo TV Controls Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Left Controls: Skip -10s, Skip +10s, Volume, Time, Quality Badge */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Skip backward */}
              <button
                onClick={() => handleSkip(-skipSeconds)}
                title={`Voltar ${skipSeconds} segundos`}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Skip forward */}
              <button
                onClick={() => handleSkip(skipSeconds)}
                title={`Avancar ${skipSeconds} segundos`}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-5 h-5 text-slate-200" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-slate-200" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    setIsMuted(newVol === 0);
                  }}
                  className="w-14 sm:w-20 h-1 accent-purple-500 bg-white/20 rounded-full cursor-pointer"
                />
              </div>

              {/* Time Display */}
              <div className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5 select-none">
                <span className="text-white font-semibold">{formatTime(currentTime)}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>

              {/* Saimo TV Quality pill badge */}
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold">
                {currentLevelName === 'Automatica' ? '1080P' : currentLevelName.toUpperCase()}
              </span>
            </div>

            {/* Center: Saimo TV Signature Big Circular Red Play/Pause Button */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pausar (Espaco)' : 'Reproduzir (Espaco)'}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:scale-105 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Right Controls: Episodes, Next Ep, PiP, Settings Gear, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Next Episode Quick Button */}
              {nextEpisode && onSelectEpisode && (
                <button
                  onClick={() => onSelectEpisode(nextEpisode)}
                  title={`Proximo: Ep. ${nextEpisode.number} - ${nextEpisode.title}`}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Proximo Ep.</span>
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Episodes Drawer Toggle */}
              {hasEpisodes && (
                <button
                  onClick={() => setIsEpisodeDrawerOpen(!isEpisodeDrawerOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isEpisodeDrawerOpen
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Episodios</span>
                </button>
              )}

              {/* Picture in Picture */}
              <button
                onClick={togglePiP}
                title="Picture-in-Picture"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <PictureInPicture className="w-5 h-5" />
              </button>

              {/* Saimo TV Settings Button (Gear) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen(!isSettingsOpen);
                }}
                title="Configuracoes do Player"
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isSettingsOpen
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                title="Tela Cheia (F)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SAIMO TV SETTINGS POPOVER (Matched from Screenshots 3 & 4) */}
      {isSettingsOpen && (
        <div
          ref={settingsRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 right-3 sm:right-6 z-40 w-72 sm:w-80 bg-[#101422]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.85)] text-white animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <span className="font-bold text-sm tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Configuracoes do Player
            </span>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3.5 max-h-[60vh] overflow-y-auto custom-scroll pr-1 text-xs">
            {/* 1. Qualidade */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Qualidade</label>
              <select
                value={selectedLevel}
                onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
                className="w-full bg-[#181f33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {availableLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Legendas */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Legendas</label>
              <select
                value={selectedSubtitle}
                onChange={(e) => setSelectedSubtitle(e.target.value)}
                className="w-full bg-[#181f33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="off">Desativado</option>
                <option value="pt">Portugues (Brasil) 1</option>
                <option value="en">Ingles</option>
              </select>
            </div>

            {/* 3. Sincronia da legenda */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sincronia da legenda</label>
              <select
                value={subtitleSync}
                onChange={(e) => setSubtitleSync(parseFloat(e.target.value))}
                className="w-full bg-[#181f33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="-2">-2.0s</option>
                <option value="-1">-1.0s</option>
                <option value="-0.5">-0.5s</option>
                <option value="0">Original</option>
                <option value="0.5">+0.5s</option>
                <option value="1">+1.0s</option>
                <option value="2">+2.0s</option>
              </select>
            </div>

            {/* 4. Velocidade */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Velocidade</label>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-full bg-[#181f33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">Normal</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* 5. Pular (segundos) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Pular (segundos)</label>
              <select
                value={skipSeconds}
                onChange={(e) => setSkipSeconds(parseInt(e.target.value, 10))}
                className="w-full bg-[#181f33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="5">5s</option>
                <option value="10">10s</option>
                <option value="15">15s</option>
                <option value="30">30s</option>
              </select>
            </div>

            {/* 6. Proporcao */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Proporcao</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-[#181f33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="contain">Auto</option>
                <option value="16-9">16:9</option>
                <option value="cover">Ajustar a tela</option>
                <option value="original">Original</option>
              </select>
            </div>

            {/* 7. Super Resolucao (Upscaling) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Super Resolucao (Upscaling)</label>
              <select
                value={superResolution ? 'on' : 'off'}
                onChange={(e) => setSuperResolution(e.target.value === 'on')}
                className="w-full bg-[#181f33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="off">Desligado</option>
                <option value="on">Ativado</option>
              </select>
            </div>

            {/* 8. Brilho */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                <span>Brilho: {brightness}%</span>
                {brightness !== 100 && (
                  <button
                    onClick={() => setBrightness(100)}
                    className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                  >
                    Resetar
                  </button>
                )}
              </div>
              <input
                type="range"
                min="40"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* EPISODE DRAWER OVERLAY (Right Side Panel for Series and Animes) */}
      {isEpisodeDrawerOpen && hasEpisodes && mediaItem.episodeList && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsEpisodeDrawerOpen(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md h-full bg-[#0e1320] border-l border-white/10 p-5 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-extrabold text-white">
                  Lista de Episodios ({mediaItem.episodeList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsEpisodeDrawerOpen(false)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {/* Series Title info */}
            <div className="text-xs text-slate-400">
              <span className="font-bold text-white block text-sm">{mediaItem.title}</span>
              <span>Temporada 1</span>
            </div>

            {/* Episode Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
              {mediaItem.episodeList.map((ep) => {
                const isSelected = currentEpisode?.id === ep.id || currentEpisode?.number === ep.number;
                return (
                  <div
                    key={ep.id}
                    onClick={() => {
                      if (onSelectEpisode) {
                        onSelectEpisode(ep);
                        setIsEpisodeDrawerOpen(false);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900/40 border-white/5 hover:bg-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/10 font-mono text-xs font-bold flex items-center justify-center shrink-0 text-slate-200">
                        {ep.number}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                          {ep.title}
                        </span>
                        {ep.duration && (
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {ep.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider shrink-0">
                        Assistindo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
