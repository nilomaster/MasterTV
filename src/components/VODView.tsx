1// VOD Catalog view with categories, genres filter and search
// Strictly ASCII comments only

import React, { useState, useMemo } from 'react';
import { Film, Play, Star } from 'lucide-react';
import type { MediaItem } from '../types/iptv';
import { AdminService } from '../services/adminService';

interface VODViewProps {
  onSelectMedia: (item: MediaItem) => void;
  searchQuery: string;
  initialFilter?: 'all' | 'movies' | 'series' | 'animes' | 'doramas';
}

export const VODView: React.FC<VODViewProps> = ({ onSelectMedia, searchQuery = '', initialFilter = 'all' }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'series' | 'animes' | 'doramas'>(initialFilter);
  const [catalogRevision, setCatalogRevision] = useState<number>(0);

  React.useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  React.useEffect(() => {
    // Sync remote contents from MySQL API when browsing VOD catalog
    AdminService.fetchRemoteContents().catch(() => {});
    const handleUpdate = () => setCatalogRevision((prev) => prev + 1);
    window.addEventListener('mastertv_catalog_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_catalog_updated', handleUpdate);
  }, []);

  // Custom media items registered via Admin Panel
  const customMediaItems: MediaItem[] = useMemo(() => {
    try {
      const all = AdminService.getContents();
      if (!Array.isArray(all)) return [];
      return all
        .filter((c) => c && c.type !== 'channel')
        .map((c) => ({
          id: String(c.id || `custom-vod-${Math.random()}`),
          title: String(c.title || 'Titulo'),
          tagline: c.tagline ? String(c.tagline) : undefined,
          type: (c.type as 'movie' | 'series' | 'anime' | 'dorama') || 'movie',
          year: Number(c.year) || 2026,
          rating: Number(c.rating) || 8.0,
          duration: String(c.duration || '1h 45m'),
          contentRating: c.contentRating ? String(c.contentRating) : '12',
          genres: Array.isArray(c.genres)
            ? c.genres.map(String).filter(Boolean)
            : typeof c.genres === 'string'
            ? String(c.genres).split(',').map((g) => g.trim()).filter(Boolean)
            : ['Geral'],
          posterUrl: String(c.posterUrl || ''),
          backdropUrl: String(c.backdropUrl || c.posterUrl || ''),
          description: String(c.description || ''),
          streamUrl: String(c.streamUrl || ''),
          backupStreamUrl: c.backupStreamUrl ? String(c.backupStreamUrl) : undefined,
          director: c.director ? String(c.director) : undefined,
          writers: c.writers ? String(c.writers) : undefined,
          production: c.production ? String(c.production) : undefined,
          cast: Array.isArray(c.cast) && c.cast.length > 0 ? c.cast : undefined,
          seasons: Number(c.seasons) || undefined,
          episodes: Number(c.episodes) || undefined,
          episodeList: Array.isArray(c.episodesList)
            ? c.episodesList.map((ep) => ({
                id: String(ep.id || Math.random()),
                number: Number(ep.number) || 1,
                title: String(ep.title || 'Episodio'),
                streamUrl: String(ep.streamUrl || ''),
                backupStreamUrl: ep.backupStreamUrl ? String(ep.backupStreamUrl) : undefined,
                duration: ep.duration ? String(ep.duration) : undefined,
              }))
            : undefined,
        }));
    } catch {
      return [];
    }
  }, [catalogRevision]);

  // Only items synchronized from the database
  const allItems: MediaItem[] = useMemo(() => {
    return Array.isArray(customMediaItems) ? customMediaItems.filter(Boolean) : [];
  }, [customMediaItems]);

  const filteredItems = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    return allItems.filter((item) => {
      if (!item) return false;
      const itemType = String(item.type || 'movie');
      const matchesFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'movies'
          ? itemType === 'movie'
          : activeFilter === 'series'
          ? itemType === 'series'
          : activeFilter === 'animes'
          ? itemType === 'anime'
          : itemType === 'dorama';

      if (!matchesFilter) return false;
      if (!q) return true;

      const titleMatch = String(item.title || '').toLowerCase().includes(q);
      const genreList = Array.isArray(item.genres)
        ? item.genres
        : typeof item.genres === 'string'
        ? [String(item.genres)]
        : [];
      const genreMatch = genreList.some((g) => String(g || '').toLowerCase().includes(q));

      return titleMatch || genreMatch;
    });
  }, [allItems, activeFilter, searchQuery]);

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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('movies')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'movies'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Filmes
          </button>
          <button
            onClick={() => setActiveFilter('series')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'series'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Séries
          </button>
          <button
            onClick={() => setActiveFilter('animes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'animes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Animes
          </button>
          <button
            onClick={() => setActiveFilter('doramas')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'doramas'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Doramas
          </button>
        </div>
      </div>

      {/* Empty State or Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum titulo encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery
              ? 'Nenhum resultado corresponde a sua pesquisa.'
              : 'Nenhum conteudo cadastrado nesta categoria. Adicione ou importe novos titulos pelo Painel Administrativo.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredItems.map((item) => {
            const firstGenre = Array.isArray(item.genres) && item.genres.length > 0
              ? String(item.genres[0])
              : typeof item.genres === 'string'
              ? String(item.genres)
              : 'Geral';
            const displayRating = Number(item.rating || 0).toFixed(1);

            return (
              <div
                key={item.id}
                onClick={() => onSelectMedia(item)}
                className="group relative cursor-pointer flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1.5"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all">
                  <img
                    src={item.posterUrl || './favicon.svg'}
                    alt={item.title || 'Capa'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './favicon.svg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/50">
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                    {displayRating}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {item.year || 2026} · {firstGenre}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};