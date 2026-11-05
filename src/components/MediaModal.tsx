// Modal displaying media item or program details
// Strictly ASCII comments only

import React from 'react';
import { X, Play, Star, Clock, Tv, Calendar, Heart } from 'lucide-react';
import type { MediaItem, Channel, EPGProgram, EpisodeItem } from '../types/iptv';

interface MediaModalProps {
  mediaItem: MediaItem | null;
  programItem?: { program: EPGProgram; channel: Channel } | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (streamUrl: string, title: string, mediaItem?: MediaItem, episode?: EpisodeItem) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  mediaItem,
  programItem,
  isOpen,
  onClose,
  onPlayMedia,
}) => {
  const [isFavorited, setIsFavorited] = React.useState(false);

  if (!isOpen || (!mediaItem && !programItem)) return null;

  const title = mediaItem ? mediaItem.title : programItem?.program.title;
  const description = mediaItem ? mediaItem.description : programItem?.program.description;
  const rating = mediaItem ? mediaItem.rating : programItem?.program.rating || '12+';
  const genres = mediaItem ? mediaItem.genres : [programItem?.program.category || 'Geral'];
  const backdrop = mediaItem
    ? mediaItem.backdropUrl
    : programItem?.channel.logo || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200';
  const streamUrl = mediaItem ? mediaItem.streamUrl : programItem?.channel.streamUrl;

  const hasEpisodes = Boolean(mediaItem?.episodeList && mediaItem.episodeList.length > 0);

  const handlePlayEpisode = (episode: EpisodeItem) => {
    if (mediaItem) {
      onPlayMedia(episode.streamUrl, `${mediaItem.title} - ${episode.title}`, mediaItem, episode);
    } else {
      onPlayMedia(episode.streamUrl, episode.title);
    }
    onClose();
  };

  const handlePlayMain = () => {
    if (hasEpisodes && mediaItem?.episodeList && mediaItem.episodeList.length > 0) {
      handlePlayEpisode(mediaItem.episodeList[0]);
    } else if (streamUrl) {
      onPlayMedia(streamUrl, title || '', mediaItem || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e1320] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner with Backdrop */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src={backdrop}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1320] via-[#0e1320]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title on Backdrop */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950">
                {mediaItem ? (mediaItem.type === 'movie' ? 'Filme' : mediaItem.type === 'series' ? 'Série' : mediaItem.type === 'anime' ? 'Anime' : mediaItem.type) : 'Canal ao vivo'}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/20">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                {rating}
              </span>
              {mediaItem?.year && (
                <span className="text-xs text-slate-300 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {mediaItem.year}
                </span>
              )}
              {mediaItem?.contentRating && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {mediaItem.contentRating}
                </span>
              )}
              {mediaItem?.seasons && (
                <span className="text-xs text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  {mediaItem.seasons} {mediaItem.seasons === 1 ? 'temporada' : 'temporadas'}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </h2>
            {mediaItem?.tagline && (
              <p className="text-xs sm:text-sm text-cyan-300/90 italic font-medium mt-1">
                {mediaItem.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {genres.map((g, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-white/5"
              >
                {g}
              </span>
            ))}
            {programItem && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-800 text-cyan-300 border border-white/5">
                <Clock className="w-3.5 h-3.5" />
                {programItem.program.startTime} - {programItem.program.endTime}
              </span>
            )}
          </div>

          {/* Synopsis */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sinopse</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Credits / Technical info if available */}
          {(mediaItem?.director || mediaItem?.writers || mediaItem?.creator || mediaItem?.production) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
              {mediaItem.director && (
                <div>
                  <span className="text-slate-500 block font-semibold">Direção</span>
                  <span className="text-slate-200 font-medium">{mediaItem.director}</span>
                </div>
              )}
              {mediaItem.writers && (
                <div>
                  <span className="text-slate-500 block font-semibold">Roteiro</span>
                  <span className="text-slate-200 font-medium">{mediaItem.writers}</span>
                </div>
              )}
              {mediaItem.creator && (
                <div>
                  <span className="text-slate-500 block font-semibold">Criação</span>
                  <span className="text-slate-200 font-medium">{mediaItem.creator}</span>
                </div>
              )}
              {mediaItem.production && (
                <div>
                  <span className="text-slate-500 block font-semibold">Produção</span>
                  <span className="text-slate-200 font-medium">{mediaItem.production}</span>
                </div>
              )}
            </div>
          )}

          {/* Episodes list for Series */}
          {hasEpisodes && mediaItem?.episodeList && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Episódios ({mediaItem.episodeList.length} episódios)
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Temporada 1</span>
              </div>

              <div className="flex flex-col gap-2">
                {mediaItem.episodeList.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {ep.number}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
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
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Assistir</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-white/10">
            {streamUrl && (
              <button
                onClick={handlePlayMain}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{hasEpisodes ? 'Assistir T1 E1' : 'Assistir Agora'}</span>
              </button>
            )}

            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className={`py-3 px-4 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                isFavorited
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400' : ''}`} />
              <span>{isFavorited ? 'Favoritado' : 'Favoritar'}</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
