// Modal displaying media item or program details
// Strictly ASCII comments only

import React from 'react';
import { X, Play, Star, Clock } from 'lucide-react';
import type { MediaItem, Channel, EPGProgram } from '../types/iptv';

interface MediaModalProps {
  mediaItem: MediaItem | null;
  programItem?: { program: EPGProgram; channel: Channel } | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (streamUrl: string, title: string) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  mediaItem,
  programItem,
  isOpen,
  onClose,
  onPlayMedia,
}) => {
  if (!isOpen || (!mediaItem && !programItem)) return null;

  const title = mediaItem ? mediaItem.title : programItem?.program.title;
  const description = mediaItem ? mediaItem.description : programItem?.program.description;
  const rating = mediaItem ? mediaItem.rating : programItem?.program.rating || '12+';
  const genres = mediaItem ? mediaItem.genres : [programItem?.program.category || 'Geral'];
  const backdrop = mediaItem
    ? mediaItem.backdropUrl
    : programItem?.channel.logo || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200';
  const streamUrl = mediaItem ? mediaItem.streamUrl : programItem?.channel.streamUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e1320] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner with Backdrop */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
          <img
            src={backdrop}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1320] via-[#0e1320]/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title on Backdrop */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500 text-slate-950">
                {mediaItem ? mediaItem.type : 'Canal ao vivo'}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                {rating}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
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
          <p className="text-sm text-slate-300 leading-relaxed">
            {description}
          </p>

          {/* Action button */}
          <div className="pt-2 flex items-center gap-3">
            {streamUrl && (
              <button
                onClick={() => {
                  onPlayMedia(streamUrl, title || '');
                  onClose();
                }}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Assistir Agora</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
