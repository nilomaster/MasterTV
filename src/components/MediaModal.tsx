// Modern Media Details Modal matching Saimo TV reference design
// Features horizontal backdrop header, vertical poster, rating badges, sources selector and cast list
// All comments strictly follow ASCII rules

import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Heart, Tv } from 'lucide-react';
import type { MediaItem, Channel, EPGProgram, EpisodeItem, CastMember } from '../types/iptv';
import { detectQualityFromUrl } from '../services/qualityDetector';

interface MediaModalProps {
  mediaItem: MediaItem | null;
  programItem?: { program: EPGProgram; channel: Channel } | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (streamUrl: string, title: string, mediaItem?: MediaItem, episode?: EpisodeItem) => void;
}

// Fallback curated cast for popular titles
const DEFAULT_CAST_MAP: Record<string, CastMember[]> = {
  'as-branquelas': [
    { name: 'Shawn Wayans', character: 'Kevin Copeland', photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
    { name: 'Marlon Wayans', character: 'Marcus Copeland', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Frankie Faison', character: 'Chief Elliott', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { name: 'Terry Crews', character: 'Latrell Spencer', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { name: 'Faune Chambers', character: 'Gina Copeland', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'Rochelle Aytes', character: 'Denise Porter', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
    { name: 'John Heard', character: 'Warren', photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
    { name: 'Lochlyn Munro', character: 'Agent Jake', photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Busy Philipps', character: 'Karen', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  ],
  'homem-aranha': [
    { name: 'Tom Holland', character: 'Peter Parker / Homem-Aranha', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Zendaya', character: 'Michelle Jones (MJ)', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'Jacob Batalon', character: 'Ned Leeds', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { name: 'Benedict Cumberbatch', character: 'Doutor Estranho', photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
    { name: 'Jon Favreau', character: 'Happy Hogan', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { name: 'Marisa Tomei', character: 'Tia May', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  ],
  'visionquest': [
    { name: 'Paul Bettany', character: 'Visao', photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
    { name: 'James Spader', character: 'Ultron', photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Kerry Condon', character: 'F.R.I.D.A.Y.', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'Todd Stashwick', character: 'Assassino Desconhecido', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  ],
};

const GENERIC_CAST_FALLBACK: CastMember[] = [
  { name: 'Ator Principal', character: 'Protagonista', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Atriz Coadjuvante', character: 'Personagem Central', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Personagem de Apoio', character: 'Investigador', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Ator Convidado', character: 'Comandante', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { name: 'Atriz Convidada', character: 'Aliada', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
];

export const MediaModal: React.FC<MediaModalProps> = ({
  mediaItem,
  programItem,
  isOpen,
  onClose,
  onPlayMedia,
}) => {
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [selectedSourceIdx, setSelectedSourceIdx] = useState<number>(0);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  // Extract sorted unique seasons available for the active series
  const availableSeasons = useMemo(() => {
    const eps = mediaItem?.episodeList || [];
    if (eps.length === 0) return [1];
    const set = new Set<number>();
    eps.forEach((ep) => set.add(ep.season && ep.season > 0 ? ep.season : 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [mediaItem]);

  // Reset selected source and default season whenever media item changes
  useEffect(() => {
    setSelectedSourceIdx(0);
    setSelectedSeason(availableSeasons[0] || 1);
  }, [mediaItem, availableSeasons]);

  // Episodes belonging to the selected season
  const seasonEpisodes = useMemo(() => {
    const eps = mediaItem?.episodeList || [];
    return eps.filter((ep) => (ep.season && ep.season > 0 ? ep.season : 1) === selectedSeason);
  }, [mediaItem, selectedSeason]);

  // Close modal on TV remote back button (Escape, Back, Tizen 10009)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Back' || e.keyCode === 10009) {
        e.preventDefault();
        onClose();
      }
    };
    const handleTizenBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('tizen-back', handleTizenBack);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('tizen-back', handleTizenBack);
    };
  }, [isOpen, onClose]);

  const title = mediaItem ? mediaItem.title : programItem?.program.title || 'Titulo';
  const tagline = mediaItem?.tagline;
  const description = mediaItem ? mediaItem.description : programItem?.program.description || 'Sem descricao disponivel.';
  const rating = mediaItem ? Number(mediaItem.rating || 7.0).toFixed(1) : '7.0';
  const year = mediaItem?.year || 2026;
  const duration = mediaItem?.duration || '1h 50m';
  const contentRating = mediaItem?.contentRating || '12';
  const genres = mediaItem?.genres?.length ? mediaItem.genres : [programItem?.program.category || 'Geral'];
  const poster = mediaItem?.posterUrl || programItem?.channel.logo || './assets/img/icons/favicon.svg';
  const backdrop = mediaItem?.backdropUrl || mediaItem?.posterUrl || programItem?.channel.logo || '';
  const mainStreamUrl = mediaItem ? mediaItem.streamUrl : programItem?.channel.streamUrl || '';

  // Resolved sources list supporting multiple sources with their respective qualities
  const resolvedSources = useMemo(() => {
    if (mediaItem?.sources && mediaItem.sources.length > 0) {
      return mediaItem.sources.map((s, idx) => {
        const sUrl = s.streamUrl || s.url || '';
        const qInfo = detectQualityFromUrl(sUrl, s.name, s.quality);
        return {
          id: s.id ?? idx + 1,
          name: s.name || `Fonte ${idx + 1}`,
          streamUrl: sUrl,
          quality: s.quality,
          qualityInfo: qInfo,
        };
      });
    }
    const list = [];
    const s1Url = mediaItem?.streamUrl || mainStreamUrl;
    if (s1Url) {
      list.push({
        id: 1,
        name: 'Fonte 1',
        streamUrl: s1Url,
        quality: undefined,
        qualityInfo: detectQualityFromUrl(s1Url, title),
      });
    }
    if (mediaItem?.backupStreamUrl && mediaItem.backupStreamUrl !== mediaItem.streamUrl) {
      list.push({
        id: 2,
        name: 'Fonte 2',
        streamUrl: mediaItem.backupStreamUrl,
        quality: undefined,
        qualityInfo: detectQualityFromUrl(mediaItem.backupStreamUrl, title),
      });
    }
    return list;
  }, [mediaItem, mainStreamUrl, title]);

  if (!isOpen || (!mediaItem && !programItem)) return null;

  const activeSource = resolvedSources[selectedSourceIdx] || resolvedSources[0];
  const activeQuality = activeSource?.qualityInfo || detectQualityFromUrl(mediaItem?.streamUrl || mainStreamUrl, title);
  const activeTargetUrl = activeSource?.streamUrl || mediaItem?.streamUrl || mainStreamUrl;

  // Helper to format clean quality label (e.g. 720P - HD, 1080P - FHD) strictly eliminating "Fonte 1, 2, 3"
  const getSourceDisplayLabel = (
    src: typeof resolvedSources[0],
    allSources: typeof resolvedSources
  ): string => {
    let label = '720P - HD';
    const q = (src.quality || src.qualityInfo.short || '').toUpperCase();
    if (q.includes('4K') || q.includes('2160') || q.includes('UHD')) {
      label = '4K - UHD';
    } else if (q.includes('2K') || q.includes('1440') || q.includes('QHD')) {
      label = '2K - QHD';
    } else if (q.includes('1080') || q.includes('FHD') || q.includes('FULL HD')) {
      label = '1080P - FHD';
    } else if (q.includes('720') || q.includes('HD')) {
      label = '720P - HD';
    } else if (q.includes('480') || q.includes('SD')) {
      label = '480P - SD';
    }

    const matching = allSources.filter((s) => {
      const sq = (s.quality || s.qualityInfo.short || '').toUpperCase();
      if (label === '1080P - FHD') return sq.includes('1080') || sq.includes('FHD') || sq.includes('FULL HD');
      if (label === '720P - HD') return sq.includes('720') || (sq.includes('HD') && !sq.includes('FHD'));
      if (label === '4K - UHD') return sq.includes('4K') || sq.includes('2160') || sq.includes('UHD');
      return false;
    });

    if (matching.length > 1) {
      const idx = matching.indexOf(src);
      return `${label} (${idx >= 0 ? idx + 1 : 1})`;
    }

    return label;
  };

  const hasEpisodes = Boolean(mediaItem?.episodeList && mediaItem.episodeList.length > 0);

  // Cast members resolution
  const cleanTitle = title.toLowerCase();
  let castList: CastMember[] = mediaItem?.cast || [];
  if (!castList || castList.length === 0) {
    if (cleanTitle.includes('branquela') || cleanTitle.includes('white chick')) {
      castList = DEFAULT_CAST_MAP['as-branquelas'];
    } else if (cleanTitle.includes('aranha') || cleanTitle.includes('spider')) {
      castList = DEFAULT_CAST_MAP['homem-aranha'];
    } else if (cleanTitle.includes('vision')) {
      castList = DEFAULT_CAST_MAP['visionquest'];
    } else {
      castList = GENERIC_CAST_FALLBACK;
    }
  }

  const handlePlayCurrentSource = () => {
    const targetUrl = activeTargetUrl;
    if (hasEpisodes && seasonEpisodes.length > 0 && mediaItem) {
      const firstEp = seasonEpisodes[0];
      onPlayMedia(
        firstEp.streamUrl || targetUrl,
        `${title} - T${String(firstEp.season || selectedSeason).padStart(2, '0')}E${String(firstEp.number).padStart(2, '0')}`,
        mediaItem,
        firstEp
      );
    } else if (hasEpisodes && mediaItem?.episodeList && mediaItem.episodeList.length > 0) {
      onPlayMedia(targetUrl, `${title} - ${mediaItem.episodeList[0].title}`, mediaItem, mediaItem.episodeList[0]);
    } else {
      onPlayMedia(targetUrl, title, mediaItem || undefined);
    }
    onClose();
  };

  const handlePlayEpisode = (episode: EpisodeItem) => {
    if (mediaItem) {
      const seasonPrefix = episode.season ? `T${String(episode.season).padStart(2, '0')} ` : '';
      onPlayMedia(
        episode.streamUrl || mediaItem?.streamUrl || mainStreamUrl,
        `${mediaItem.title} - ${seasonPrefix}${episode.title}`,
        mediaItem,
        episode
      );
    } else {
      onPlayMedia(episode.streamUrl, episode.title);
    }
    onClose();
  };

  const categoryLabel = mediaItem
    ? mediaItem.type === 'movie'
      ? 'FILME'
      : mediaItem.type === 'series'
      ? 'SÉRIE'
      : mediaItem.type === 'anime'
      ? 'ANIME'
      : mediaItem.type === 'dorama'
      ? 'DORAMA'
      : 'VOD'
    : 'CANAL AO VIVO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-5xl bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto overflow-x-hidden flex flex-col scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {/* Top Hero Section with Horizontal Backdrop and Vertical Poster */}
          <div className="relative w-full p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            {/* Horizontal Backdrop Layer */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
              <img
                src={backdrop}
                alt={title}
                className="w-full h-full object-cover object-top opacity-35 filter blur-[0.5px]"
              />
              {/* Gradient masks for seamless dark integration */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/75 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-[#0b0e14]/85 md:via-[#0b0e14]/70 to-transparent" />
            </div>

            {/* Left Column: Vertical Poster Card */}
            <div className="shrink-0 relative z-10 w-44 sm:w-52 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border border-white/15 bg-slate-900 group mx-auto md:mx-0">
              <img
                src={poster}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={handlePlayCurrentSource}
                  className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/40 transform scale-90 group-hover:scale-100 transition-transform cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Title, Metadata, Buttons and Synopsis */}
            <div className="flex-1 relative z-10 flex flex-col text-left">
              {/* Category Badge */}
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-1.5 block">
                {categoryLabel}
              </span>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {title}
              </h1>

              {/* Tagline */}
              {tagline && (
                <p className="text-xs sm:text-sm text-slate-400 italic font-medium mt-1 mb-2.5">
                  {tagline}
                </p>
              )}

              {/* Badges Row (Rating, Quality, Year, Duration, Age) */}
              <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                {/* Rating Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-amber-400/30 text-amber-300 text-xs font-bold shadow-sm">
                  ★ {rating}
                </span>

                {/* Detected Quality Badge from Source */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-bold font-mono shadow-sm ${activeQuality.badgeBg} ${activeQuality.borderBg}`}>
                  {activeQuality.full}
                </span>

                {/* Year Badge */}
                {year && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/10 text-slate-300 text-xs font-semibold">
                    {year}
                  </span>
                )}

                {/* Duration Badge */}
                {duration && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/10 text-slate-300 text-xs font-semibold">
                    {duration}
                  </span>
                )}

                {/* Age Rating Badge */}
                {contentRating && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                    {contentRating}
                  </span>
                )}

                {/* Seasons Count for Series */}
                {mediaItem?.seasons && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/10 text-slate-300 text-xs font-semibold">
                    {mediaItem.seasons} {mediaItem.seasons === 1 ? 'temporada' : 'temporadas'}
                  </span>
                )}
              </div>

              {/* Multiple Quality Sources Selector */}
              {resolvedSources.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 my-2">
                  <span className="text-xs text-slate-400 font-semibold">Qualidade:</span>
                  {resolvedSources.map((src, idx) => {
                    const isSelected = selectedSourceIdx === idx;
                    const displayLabel = getSourceDisplayLabel(src, resolvedSources);
                    return (
                      <button
                        key={src.id || idx}
                        onClick={() => setSelectedSourceIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Genres Line */}
              <div className="text-xs font-medium text-slate-300 mb-4">
                {genres.join(' · ')}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3 mb-4">
                {/* Play Button */}
                <button
                  onClick={handlePlayCurrentSource}
                  className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-white/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Assistir</span>
                </button>

                {/* Favorite Button */}
                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`px-5 py-2.5 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                    isFavorited
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-md shadow-rose-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-200 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400 text-rose-400' : 'text-slate-300'}`} />
                  <span>{isFavorited ? 'Favoritado' : 'Favoritar'}</span>
                </button>
              </div>

              {/* Synopsis */}
              <p className="text-xs sm:text-sm text-slate-300/95 leading-relaxed max-w-2xl">
                {description}
              </p>

              {/* Credits (Direcao, Roteiro, Producao) */}
              {(mediaItem?.director || mediaItem?.writers || mediaItem?.creator || mediaItem?.production) && (
                <div className="mt-4 flex flex-col gap-1 text-xs">
                  {mediaItem.director && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 w-16 shrink-0 font-medium">Direção</span>
                      <span className="text-slate-200 font-semibold">{mediaItem.director}</span>
                    </div>
                  )}
                  {mediaItem.writers && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 w-16 shrink-0 font-medium">Roteiro</span>
                      <span className="text-slate-200 font-semibold">{mediaItem.writers}</span>
                    </div>
                  )}
                  {mediaItem.creator && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 w-16 shrink-0 font-medium">Criação</span>
                      <span className="text-slate-200 font-semibold">{mediaItem.creator}</span>
                    </div>
                  )}
                  {mediaItem.production && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 w-16 shrink-0 font-medium">Produção</span>
                      <span className="text-slate-200 font-semibold">{mediaItem.production}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Netflix-Style Seasons & Episodes Organizer */}
          {hasEpisodes && mediaItem?.episodeList && (
            <div className="px-6 sm:px-8 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4 text-sky-400" />
                  <h3 className="text-base font-extrabold text-white">
                    Episódios
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-slate-300">
                    {seasonEpisodes.length} {seasonEpisodes.length === 1 ? 'episódio' : 'episódios'}
                  </span>
                </div>

                {/* Season Selector (Dropdown + Quick Tabs) */}
                {availableSeasons.length > 1 ? (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {availableSeasons.length <= 6 ? (
                      availableSeasons.map((seasonNum) => {
                        const isActive = selectedSeason === seasonNum;
                        return (
                          <button
                            key={seasonNum}
                            type="button"
                            onClick={() => setSelectedSeason(seasonNum)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                              isActive
                                ? 'bg-sky-500 text-slate-950 border-sky-400'
                                : 'bg-slate-900/90 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            Temporada {seasonNum}
                          </button>
                        );
                      })
                    ) : (
                      <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(Number(e.target.value))}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                      >
                        {availableSeasons.map((seasonNum) => (
                          <option key={seasonNum} value={seasonNum}>
                            Temporada {seasonNum}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold">
                    Temporada {selectedSeason}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1 custom-scroll">
                {seasonEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => handlePlayEpisode(ep)}
                    className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/75 hover:bg-slate-800/90 border border-white/10 hover:border-sky-400/50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Episode Thumbnail or Number Tile */}
                      {ep.thumbnailUrl ? (
                        <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-slate-950 border border-white/10 shrink-0">
                          <img
                            src={ep.thumbnailUrl}
                            alt={ep.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                            <div className="w-7 h-7 rounded-full bg-black/70 group-hover:bg-sky-500 text-white group-hover:text-slate-950 flex items-center justify-center transition-colors">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] font-mono font-bold text-white">
                            E{String(ep.number).padStart(2, '0')}
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/25 flex items-center justify-center text-xs font-mono font-bold text-sky-400 shrink-0">
                          E{String(ep.number).padStart(2, '0')}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                          {ep.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                          <span>T{String(ep.season || selectedSeason).padStart(2, '0')} · E{String(ep.number).padStart(2, '0')}</span>
                          {ep.duration && (
                            <>
                              <span>·</span>
                              <span>{ep.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayEpisode(ep);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Assistir</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cast Section (Elenco) with Circular Avatars */}
          {castList && castList.length > 0 && (
            <div className="px-6 sm:px-8 pb-6">
              <h3 className="text-sm font-bold text-white mb-3 tracking-wide">
                Elenco
              </h3>
              <div className="flex items-start gap-4 sm:gap-5 overflow-x-auto pb-2 scrollbar-none">
                {castList.map((actor, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center shrink-0 w-20 sm:w-22 text-center group"
                  >
                    {/* Circle Avatar */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-blue-400/60 shadow-lg shadow-black/60 bg-slate-800 mb-1.5 transition-all group-hover:scale-105">
                      <img
                        src={actor.photoUrl}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback avatar placeholder if image fails to load
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    {/* Actor Name */}
                    <span className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                      {actor.name}
                    </span>
                    {/* Character Name */}
                    {actor.character && (
                      <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {actor.character}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};