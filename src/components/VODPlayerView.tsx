// Dedicated VOD (Video on Demand) Player View for Movies, Series and Animes
// Features full timeline scrubbing, play/pause, skip 10s, speed, episode selector and back navigation
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
  Check,
  PictureInPicture,
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

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | '16-9'>('contain');

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
      if (isPlaying && !isEpisodeDrawerOpen && !isSpeedMenuOpen && !isDraggingProgress) {
        setShowControls(false);
      }
    }, 3500);
  }, [isPlaying, isEpisodeDrawerOpen, isSpeedMenuOpen, isDraggingProgress]);

  // Handle mouse move
  useEffect(() => {
    const handleActivity = () => resetControlsTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimer]);

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

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
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
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (connectTimeout) {
            window.clearTimeout(connectTimeout);
            connectTimeout = null;
          }
          setIsLoadingStream(false);
          setStreamError('Erro ao carregar a transmissao deste episodio.');
          hls.destroy();
        }
      });
    } else {
      video.src = effectiveStreamUrl;

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
        // Automatically try fallback source if available
        if (activeSource === 1 && mediaItem?.backupStreamUrl && mediaItem.backupStreamUrl !== mediaItem.streamUrl) {
          setActiveSource(2);
          return;
        }
        const err = video.error;
        let msg = 'Erro ao reproduzir o arquivo de video.';
        if (err) {
          if (err.code === 4) {
            msg = 'Fonte de transmissao temporariamente indisponivel. Tente alternar para outra fonte.';
          } else if (err.code === 2) {
            msg = 'Falha de conexao com a fonte de transmissao. Tente novamente ou selecione outra fonte.';
          } else if (err.code === 3) {
            msg = 'Erro na decodificacao do fluxo de video.';
          }
        }
        setStreamError(msg);
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
      // Calculate buffered end
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

  // Skip 10 seconds forward / backward
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
    const targetTime = percentage * duration;

    video.currentTime = targetTime;
    setCurrentTime(targetTime);
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
    setHoverPosition(hoverX);
    setHoverTime(percentage * duration);
  };

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      const container = containerRef.current;
      if (next) {
        if (container && !document.fullscreenElement && container.requestFullscreen) {
          container.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  // Sync native fullscreen exits
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
      if (isEpisodeDrawerOpen) {
        setIsEpisodeDrawerOpen(false);
        (window as unknown as { __mastertv_player_handled_back?: boolean }).__mastertv_player_handled_back = true;
        return;
      }
    };
    window.addEventListener('mastertv_back_button', handleBackButton);
    return () => window.removeEventListener('mastertv_back_button', handleBackButton);
  }, [isFullscreen, isEpisodeDrawerOpen]);

  // Picture in picture toggle
  const togglePiP = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (document.pictureInPictureEnabled) {
      video.requestPictureInPicture().catch(() => {});
    }
  };

  // Next episode calculation
  const hasEpisodes = Boolean(mediaItem.episodeList && mediaItem.episodeList.length > 0);
  const currentEpIndex = mediaItem.episodeList && currentEpisode
    ? mediaItem.episodeList.findIndex((ep) => ep.id === currentEpisode.id)
    : 0;
  const nextEpisode = hasEpisodes && mediaItem.episodeList && currentEpIndex < mediaItem.episodeList.length - 1
    ? mediaItem.episodeList[currentEpIndex + 1]
    : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case 'm':
          setIsMuted((m) => !m);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'escape':
          if (isEpisodeDrawerOpen) setIsEpisodeDrawerOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isEpisodeDrawerOpen]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        onClick={togglePlay}
        className={`w-full h-full cursor-pointer transition-all ${
          aspectRatio === 'cover'
            ? 'object-cover'
            : aspectRatio === '16-9'
            ? 'aspect-video object-contain'
            : 'object-contain'
        }`}
      />

      {/* Loading Spinner */}
      {isLoadingStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4 shadow-[0_0_20px_rgba(0,240,255,0.4)]" />
          <p className="text-sm font-bold text-white tracking-wide">Carregando vídeo em alta definição...</p>
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
            Ocorreu uma instabilidade na reprodução deste título. Tente recarregar ou voltar para o catálogo.
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
              Voltar ao Catálogo
            </button>
          </div>
        </div>
      )}

      {/* Big Center Play Icon (Shown when paused) */}
      {!isPlaying && !isLoadingStream && !streamError && (
        <button
          onClick={togglePlay}
          className="absolute z-10 w-20 h-20 rounded-full bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.4)] transition-all hover:scale-110 cursor-pointer"
        >
          <Play className="w-9 h-9 fill-slate-950 ml-1" />
        </button>
      )}

      {/* TOP HEADER OVERLAY */}
      <div
        className={`absolute top-0 left-0 right-0 pt-4 sm:pt-6 px-4 sm:px-8 pb-8 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between z-20 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 transition-all shadow-lg backdrop-blur-md cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold">Voltar</span>
          </button>

          {/* Title and Metadata */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950">
                {mediaItem.type === 'movie' ? 'Filme' : mediaItem.type === 'series' ? 'Série' : 'Anime'}
              </span>
              {mediaItem.contentRating && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {mediaItem.contentRating}
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium">
                {mediaItem.year}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight drop-shadow-md">
              {mediaItem.title}
            </h1>

            {currentEpisode && (
              <p className="text-xs text-cyan-300 font-semibold drop-shadow">
                Temporada 1 · Episódio {currentEpisode.number}: {currentEpisode.title}
              </p>
            )}
          </div>
        </div>

        {/* Right side tags */}
        <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900/80 text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-lg">
            1080p Full HD
          </span>
        </div>
      </div>

      {/* BOTTOM VOD CONTROLS BAR */}
      <div
        className={`absolute bottom-6 left-4 right-4 sm:left-8 sm:right-8 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-2.5 p-3 sm:p-4 rounded-2xl bg-[#0b0e14]/90 backdrop-blur-2xl border border-white/15 shadow-2xl">
          {/* Interactive Progress Bar */}
          <div
            ref={progressBarRef}
            onMouseDown={handleProgressBarMouseDown}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={handleProgressBarMouseLeave}
            className="group relative w-full h-2.5 sm:h-3 rounded-full bg-white/15 hover:h-4 transition-all cursor-pointer flex items-center"
          >
            {/* Buffered Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-white/25 transition-all pointer-events-none"
              style={{ width: `${bufferedPercent}%` }}
            />

            {/* Played Progress Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all pointer-events-none shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Thumb Handle */}
            <div
              className="absolute -ml-2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-110 pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Hover Time Tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/95 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-400/30 shadow-lg pointer-events-none whitespace-nowrap"
                style={{ left: `${hoverPosition}px` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Bottom Row Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Left Controls: Play/Pause, -10s, +10s, Time */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play / Pause button */}
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
                className="p-2 sm:p-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-md shadow-cyan-400/20 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
              </button>

              {/* Skip -10s */}
              <button
                onClick={() => handleSkip(-10)}
                title="Voltar 10 segundos (Seta Esquerda)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Skip +10s */}
              <button
                onClick={() => handleSkip(10)}
                title="Avançar 10 segundos (Seta Direita)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Time Display */}
              <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1 select-none">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Episodes, Next Ep, Speed, Volume, Ratio, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Next Episode Button */}
              {nextEpisode && onSelectEpisode && (
                <button
                  onClick={() => onSelectEpisode(nextEpisode)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Próximo Ep.</span>
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Episodes Drawer Toggle */}
              {hasEpisodes && (
                <button
                  onClick={() => setIsEpisodeDrawerOpen(!isEpisodeDrawerOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isEpisodeDrawerOpen
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                      : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Episódios</span>
                </button>
              )}

              {/* Playback Speed Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                  title="Velocidade de Reprodução"
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-mono font-bold border border-white/10 transition-all cursor-pointer"
                >
                  {playbackSpeed}x
                </button>

                {isSpeedMenuOpen && (
                  <div className="absolute bottom-11 right-0 w-28 bg-[#12161e]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          setPlaybackSpeed(spd);
                          setIsSpeedMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                          playbackSpeed === spd
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{spd === 1 ? '1x (Normal)' : `${spd}x`}</span>
                        {playbackSpeed === spd && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Source Switcher */}
              {Boolean(mediaItem.backupStreamUrl || currentEpisode?.backupStreamUrl) && (
                <button
                  onClick={() => setActiveSource((s) => (s === 1 ? 2 : 1))}
                  title="Alternar entre Fonte 1 e Fonte 2"
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-mono font-bold border border-white/10 transition-all cursor-pointer whitespace-nowrap"
                >
                  Fonte {activeSource}/2
                </button>
              )}

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
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
                  className="w-14 sm:w-20 h-1.5 accent-cyan-400 bg-white/20 rounded-full cursor-pointer"
                />
              </div>

              {/* Aspect Ratio */}
              <button
                onClick={() => {
                  setAspectRatio((prev) => (prev === 'contain' ? 'cover' : prev === 'cover' ? '16-9' : 'contain'));
                }}
                title="Ajustar Proporção da Tela"
                className="hidden sm:flex items-center px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[11px] font-mono font-bold transition-all cursor-pointer"
              >
                {aspectRatio === 'contain' ? 'Ajustar' : aspectRatio === 'cover' ? 'Preencher' : '16:9'}
              </button>

              {/* PiP */}
              <button
                onClick={togglePiP}
                title="Picture in Picture"
                className="hidden sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                title="Tela Cheia (F)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EPISODE DRAWER OVERLAY (Right Side Panel) */}
      {isEpisodeDrawerOpen && hasEpisodes && mediaItem.episodeList && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsEpisodeDrawerOpen(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md h-full bg-[#0e1320] border-l border-white/10 p-5 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">
                  Lista de Episódios ({mediaItem.episodeList.length})
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

            {/* Episode List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {mediaItem.episodeList.map((ep) => {
                const isSelected = currentEpisode?.id === ep.id;
                return (
                  <div
                    key={ep.id}
                    onClick={() => {
                      if (onSelectEpisode) {
                        onSelectEpisode(ep);
                      }
                      setIsEpisodeDrawerOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30'
                            : 'bg-slate-800 text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {ep.number}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-bold truncate max-w-[190px] ${
                            isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                          }`}
                        >
                          {ep.title}
                        </span>
                        {ep.duration && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {ep.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSelected ? (
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
                          Tocando
                        </span>
                      ) : (
                        <Play className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      )}
                    </div>
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
