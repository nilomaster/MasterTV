// Modern Media Details Modal matching Saimo TV reference design
// Features horizontal backdrop header, vertical poster, rating badges, sources selector and cast list
// All comments strictly follow ASCII rules

import React, { useState, useEffect } from 'react';
import { X, Play, Heart, Tv } from 'lucide-react';
import type { MediaItem, Channel, EPGProgram, EpisodeItem, CastMember } from '../types/iptv';

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

  if (!isOpen || (!mediaItem && !programItem)) return null;

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
    const targetUrl = mediaItem?.streamUrl || mainStreamUrl;
    if (hasEpisodes && mediaItem?.episodeList && mediaItem.episodeList.length > 0) {
      onPlayMedia(targetUrl, `${title} - ${mediaItem.episodeList[0].title}`, mediaItem, mediaItem.episodeList[0]);
    } else {
      onPlayMedia(targetUrl, title, mediaItem || undefined);
    }
    onClose();
  };

  const handlePlayEpisode = (episode: EpisodeItem) => {
    if (mediaItem) {
      onPlayMedia(episode.streamUrl || mediaItem?.streamUrl || mainStreamUrl, `${mediaItem.title} - ${episode.title}`, mediaItem, episode);
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

              {/* Badges Row (Rating, Year, Duration, Age) */}
              <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                {/* Rating Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-amber-400/30 text-amber-300 text-xs font-bold shadow-sm">
                  ★ {rating}
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

          {/* Series Episodes List (if available) */}
          {hasEpisodes && mediaItem?.episodeList && (
            <div className="px-6 sm:px-8 pb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    Episódios ({mediaItem.episodeList.length} disponíveis)
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Temporada 1</span>
              </div>

              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {mediaItem.episodeList.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                        {ep.number}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                          {ep.title}
                        </h4>
                        {ep.duration && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {ep.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlayEpisode(ep)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Assistir</span>
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