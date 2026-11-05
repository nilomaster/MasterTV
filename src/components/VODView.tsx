// VOD Catalog view with categories, genres filter and search
// Strictly ASCII comments only

import React, { useState } from 'react';
import { Film, Play, Star } from 'lucide-react';
import type { MediaItem } from '../types/iptv';
import {
  TRENDING_MOVIES,
  TRENDING_SERIES,
  ANIMES_LIST,
  DORAMAS_LIST,
} from '../services/mockData';

interface VODViewProps {
  onSelectMedia: (item: MediaItem) => void;
  searchQuery: string;
  initialFilter?: 'all' | 'movies' | 'series' | 'animes' | 'doramas';
}

export const VODView: React.FC<VODViewProps> = ({ onSelectMedia, searchQuery, initialFilter = 'all' }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'series' | 'animes' | 'doramas'>(initialFilter);

  React.useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  const allItems: MediaItem[] = [
    ...TRENDING_MOVIES,
    ...TRENDING_SERIES,
    ...ANIMES_LIST,
    ...DORAMAS_LIST,
  ];

  const filteredItems = allItems.filter((item) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'movies'
        ? item.type === 'movie'
        : activeFilter === 'series'
        ? item.type === 'series'
        : activeFilter === 'animes'
        ? item.type === 'anime'
        : item.type === 'dorama';

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-white/10 glass-panel">
        <div className="flex items-center gap-3">
          <Film className="w-6 h-6 text-cyan-400" />
          <div>
            <h1 className="text-xl font-extrabold text-white">Catálogo On Demand</h1>
            <p className="text-xs text-slate-400">
              Mais de {allItems.length} títulos disponíveis com reprodução em alta definição.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('movies')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'movies'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Filmes
          </button>
          <button
            onClick={() => setActiveFilter('series')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'series'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Séries
          </button>
          <button
            onClick={() => setActiveFilter('animes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'animes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Animes
          </button>
          <button
            onClick={() => setActiveFilter('doramas')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'doramas'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Doramas
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectMedia(item)}
            className="group relative cursor-pointer flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1.5"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all">
              <img
                src={item.posterUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/50">
                  <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                </div>
              </div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-300" />
                {item.rating}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                {item.title}
              </h4>
              <p className="text-[10px] text-slate-400">
                {item.year} · {item.genres[0]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
