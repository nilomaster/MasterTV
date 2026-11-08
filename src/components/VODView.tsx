// VOD Catalog view with categories, genres filter and search
// Strictly ASCII comments only

import React, { useState, useMemo } from 'react';
import { Film, Play, Star, Tv2, Sparkles, HeartHandshake } from 'lucide-react';
import type { MediaItem } from '../types/iptv';
import { AdminService } from '../services/adminService';
import { detectQualityFromUrl } from '../services/qualityDetector';

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
        activeFilter === 'movies' || activeFilter === 'all'
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

  // Page title, icon and metadata based on active catalog page
  const pageMeta = useMemo(() => {
    switch (activeFilter) {
      case 'series':
        return {
          title: 'Catálogo Série',
          subtitle:
            filteredItems.length === 1
              ? '1 série disponível com reprodução em alta definição.'
              : `${filteredItems.length} séries disponíveis com reprodução em alta definição.`,
          icon: Tv2,
          badge: 'Série',
          badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        };
      case 'animes':
        return {
          title: 'Catálogo Anime',
          subtitle:
            filteredItems.length === 1
              ? '1 anime disponível com reprodução em alta definição.'
              : `${filteredItems.length} animes disponíveis com reprodução em alta definição.`,
          icon: Sparkles,
          badge: 'Anime',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'doramas':
        return {
          title: 'Catálogo Série Dorama',
          subtitle:
            filteredItems.length === 1
              ? '1 dorama disponível com reprodução em alta definição.'
              : `${filteredItems.length} doramas disponíveis com reprodução em alta definição.`,
          icon: HeartHandshake,
          badge: 'Dorama',
          badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'movies':
      case 'all':
      default:
        return {
          title: 'Catálogo Filme',
          subtitle:
            filteredItems.length === 1
              ? '1 filme disponível com reprodução em alta definição.'
              : `${filteredItems.length} filmes disponíveis com reprodução em alta definição.`,
          icon: Film,
          badge: 'Filme',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
    }
  }, [activeFilter, filteredItems.length]);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
      {/* Sleek Modern Header (No category pills, authentic brand styling) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1424]/90 to-slate-900/90 border border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3.5 sm:gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md shadow-blue-900/30 shrink-0">
            <pageMeta.icon className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {pageMeta.title}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${pageMeta.badgeColor}`}>
                {pageMeta.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
      </div>

      {/* Empty State or Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <pageMeta.icon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum título encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery
              ? 'Nenhum resultado corresponde à sua pesquisa.'
              : `Nenhum conteúdo cadastrado em ${pageMeta.title}. Adicione ou importe novos títulos pelo Painel Administrativo.`}
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
            const qualityInfo = detectQualityFromUrl(item.streamUrl, item.title);

            return (
              <div
                key={item.id}
                onClick={() => onSelectMedia(item)}
                className="group relative cursor-pointer flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1.5"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-blue-500/60 group-hover:shadow-lg group-hover:shadow-blue-900/30 transition-all">
                  <img
                    src={item.posterUrl || './assets/img/icons/favicon.svg'}
                    alt={item.title || 'Capa'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './assets/img/icons/favicon.svg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/40">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Quality Badge from Source */}
                  <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded backdrop-blur-md text-[9px] font-mono font-bold border shadow-sm ${qualityInfo.badgeBg} ${qualityInfo.borderBg}`}>
                    {qualityInfo.short}
                  </div>

                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                    {displayRating}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-300 truncate">
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