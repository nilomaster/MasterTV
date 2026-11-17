// VOD Catalog view with categories, genres filter and search
// Strictly ASCII comments only

import React, { useState, useMemo, useEffect } from 'react';
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
  const [visibleCount, setVisibleCount] = useState<number>(48);

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(48);
  }, [activeFilter, searchQuery]);

  useEffect(() => {
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
          sources: Array.isArray((c as any).sourcesList) && (c as any).sourcesList.length > 0
            ? (c as any).sourcesList.map((s: any, idx: number) => ({
                id: Number(s.id) || idx + 1,
                name: String(s.name || `Fonte ${idx + 1}`),
                quality: s.quality ? String(s.quality) : undefined,
                streamUrl: String(s.streamUrl || s.url || ''),
                url: String(s.streamUrl || s.url || ''),
                backupStreamUrl: s.backupStreamUrl ? String(s.backupStreamUrl) : undefined,
              }))
            : Array.isArray((c as any).sources) && (c as any).sources.length > 0
            ? (c as any).sources
            : undefined,
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

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts = { movies: 0, series: 0, animes: 0, doramas: 0 };
    for (const item of allItems) {
      if (!item) continue;
      if (item.type === 'movie') counts.movies++;
      else if (item.type === 'series') counts.series++;
      else if (item.type === 'anime') counts.animes++;
      else if (item.type === 'dorama') counts.doramas++;
    }
    return counts;
  }, [allItems]);

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

  // Paginated/Lazy-loaded slice to prevent DOM thrashing
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // Page title, icon and metadata based on active catalog page
  const pageMeta = useMemo(() => {
    switch (activeFilter) {
      case 'series':
        return {
          title: 'Catalogo Serie',
          subtitle:
            filteredItems.length === 1
              ? '1 serie disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} series disponiveis com reproducao em alta definicao.`,
          icon: Tv2,
          badge: 'Serie',
          badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        };
      case 'animes':
        return {
          title: 'Catalogo Anime',
          subtitle:
            filteredItems.length === 1
              ? '1 anime disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} animes disponiveis com reproducao em alta definicao.`,
          icon: Sparkles,
          badge: 'Anime',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'doramas':
        return {
          title: 'Catalogo Serie Dorama',
          subtitle:
            filteredItems.length === 1
              ? '1 dorama disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} doramas disponiveis com reproducao em alta definicao.`,
          icon: HeartHandshake,
          badge: 'Dorama',
          badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'movies':
      case 'all':
      default:
        return {
          title: 'Catalogo Filme',
          subtitle:
            filteredItems.length === 1
              ? '1 filme disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} filmes disponiveis com reproducao em alta definicao.`,
          icon: Film,
          badge: 'Filme',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
    }
  }, [activeFilter, filteredItems.length]);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
      {/* Sleek Modern Header */}
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

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveFilter('movies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'movies' || activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Filmes ({categoryCounts.movies.toLocaleString('pt-BR')})
        </button>

        <button
          onClick={() => setActiveFilter('series')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'series'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Tv2 className="w-3.5 h-3.5" />
          Series ({categoryCounts.series.toLocaleString('pt-BR')})
        </button>

        <button
          onClick={() => setActiveFilter('animes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'animes'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Animes ({categoryCounts.animes.toLocaleString('pt-BR')})
        </button>

        <button
          onClick={() => setActiveFilter('doramas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'doramas'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Doramas ({categoryCounts.doramas.toLocaleString('pt-BR')})
        </button>
      </div>

      {/* Empty State or Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <pageMeta.icon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum titulo encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery
              ? 'Nenhum resultado corresponde a sua pesquisa.'
              : `Nenhum conteudo cadastrado em ${pageMeta.title}. Adicione ou importe novos titulos pelo Painel Administrativo.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {displayedItems.map((item) => {
              const firstGenre = Array.isArray(item.genres) && item.genres.length > 0
                ? String(item.genres[0])
                : typeof item.genres === 'string'
                ? String(item.genres)
                : 'Geral';
              const displayRating = Number(item.rating || 0).toFixed(1);
              const primarySource = item.sources && item.sources.length > 0 ? item.sources[0] : null;
              const qualityInfo = detectQualityFromUrl(
                primarySource?.streamUrl || primarySource?.url || item.streamUrl,
                primarySource?.name || item.title,
                primarySource?.quality
              );

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
                      loading="lazy"
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

          {/* Lazy Load Controls */}
          {visibleCount < filteredItems.length && (
            <div className="flex flex-col items-center justify-center gap-3 pt-6 pb-12">
              <p className="text-xs text-slate-400 font-medium">
                Exibindo <span className="text-white font-bold">{displayedItems.length}</span> de{' '}
                <span className="text-blue-400 font-bold">{filteredItems.length.toLocaleString('pt-BR')}</span> titulos
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 48, filteredItems.length))}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Carregar Mais Titulos (+48)
                </button>
                {filteredItems.length - displayedItems.length > 48 && (
                  <button
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 240, filteredItems.length))}
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs tracking-wide border border-white/10 transition-all cursor-pointer"
                  >
                    Carregar +240
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
