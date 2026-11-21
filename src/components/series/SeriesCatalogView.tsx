// MasterTV Redesigned Desktop Series Catalog View
// Premium Blue Identity (#030A16 / #07182B / #0A1B30 / #00BFFF)
// Two-column layout: Left independent Categories Sidebar + Right Decorative Series Banner & Real Series Grid
// Preserves all real API/MySQL data, seasons, episodes, lazy loading, pagination, search and MediaModal integration
// Strictly ASCII comments only as per project guidelines

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Layers,
  Flame,
  Star,
  Tv,
  Calendar,
  Play,
  Film,
  BookOpen,
  Sparkles,
  Search,
  ChevronRight,
  X,
  Loader2,
  Zap,
  Compass,
  Smile,
  Orbit,
  Lock,
  Skull,
  Heart,
  Puzzle,
} from 'lucide-react';
import type { MediaItem } from '../../types/iptv';
import { AdminService } from '../../services/adminService';

interface SeriesCatalogViewProps {
  onSelectMedia: (item: MediaItem) => void;
  searchQuery: string;
  onClearSearch?: () => void;
}

const PAGE_SIZE = 36;

// Extract real quality badge only if present in metadata, sources or title
function extractRealQualityBadge(item: MediaItem): string | null {
  const fromSource = item.sources?.find((s) => s.quality)?.quality;
  if (fromSource) {
    const q = fromSource.toUpperCase();
    if (q.includes('4K') || q.includes('UHD')) return '4K';
    if (q.includes('FHD') || q.includes('1080')) return 'FHD';
    if (q.includes('HD') || q.includes('720')) return 'HD';
  }
  const t = (item.title || '').toUpperCase();
  if (/\b(4K|UHD)\b/.test(t)) return '4K';
  if (/\b(FHD|1080P)\b/.test(t)) return 'FHD';
  if (/\b(HD|720P)\b/.test(t)) return 'HD';
  return null;
}

// Map real series category/genre to a discreet icon
function getSeriesCategoryIcon(id: string, name: string) {
  const key = `${id} ${name}`.toLowerCase();
  if (id === 'todas') return Layers;
  if (id === 'lancamentos') return Flame;
  if (key.includes('document')) return BookOpen;
  if (key.includes('reality')) return Tv;
  if (key.includes('mini')) return Calendar;
  if (key.includes('acao') || key.includes('ação') || key.includes('action')) return Zap;
  if (key.includes('aventura') || key.includes('adventure')) return Compass;
  if (key.includes('comedia') || key.includes('comédia') || key.includes('comedy')) return Smile;
  if (key.includes('drama')) return Sparkles;
  if (key.includes('ficc') || key.includes('ficç') || key.includes('sci-fi') || key.includes('scifi')) return Orbit;
  if (key.includes('suspense') || key.includes('thriller') || key.includes('crime') || key.includes('policial')) return Lock;
  if (key.includes('terror') || key.includes('horror')) return Skull;
  if (key.includes('romance')) return Heart;
  if (key.includes('animac') || key.includes('animaç') || key.includes('infantil') || key.includes('kids') || key.includes('desenho')) return Puzzle;
  return Film;
}

interface SeriesCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}

const SeriesPosterCard: React.FC<SeriesCardProps> = React.memo(({ item, onSelect }) => {
  const qualityBadge = extractRealQualityBadge(item);
  const coverSrc = item.posterUrl || item.backdropUrl || './assets/img/icons/favicon.svg';
  const primaryGenre = item.genres && item.genres.length > 0 && item.genres[0] !== 'Geral' ? item.genres[0] : null;
  const seasonsLabel = item.seasons && item.seasons > 0 ? `${item.seasons} ${item.seasons === 1 ? 'Temp.' : 'Temps.'}` : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#0A1B30] border border-white/10 hover:border-[#00BFFF]/75 shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#00BFFF]/80 cursor-pointer text-left"
    >
      {/* Original API Cover with Lazy Loading */}
      <img
        src={coverSrc}
        alt={item.title}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.dataset.fallbackApplied) {
            target.dataset.fallbackApplied = '1';
            target.src = './assets/img/icons/favicon.svg';
          }
        }}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Subtle Bottom Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030A16]/95 via-[#030A16]/25 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

      {/* Quality Badge (only when real metadata exists) */}
      {qualityBadge && (
        <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-black/70 border border-white/20 text-[10px] font-bold tracking-wider text-white backdrop-blur-sm">
          {qualityBadge}
        </span>
      )}

      {/* Centered Discreet Play Button (matching reference card design) */}
      <div className="absolute inset-x-0 bottom-10 sm:bottom-11 z-10 flex justify-center pointer-events-none transition-transform duration-300 group-hover:-translate-y-2">
        <div className="w-9 h-9 rounded-full bg-black/55 group-hover:bg-[#00BFFF] border border-white/75 group-hover:border-[#00BFFF] text-white group-hover:text-[#030A16] flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-300">
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </div>
      </div>

      {/* Title & Real Series Metadata Revealed Cleanly at Base */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 flex flex-col gap-0.5">
        <h3 className="text-xs font-bold text-white truncate leading-tight drop-shadow">
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-[#A9B8CC] opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-6 transition-all duration-300 overflow-hidden">
          {item.year ? <span>{item.year}</span> : null}
          {seasonsLabel ? (
            <>
              {item.year ? <span>·</span> : null}
              <span className="text-[#00BFFF] font-semibold shrink-0">{seasonsLabel}</span>
            </>
          ) : null}
          {primaryGenre ? (
            <>
              <span>·</span>
              <span className="truncate">{primaryGenre}</span>
            </>
          ) : null}
          {item.rating && item.rating > 0 ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 text-amber-300 shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-300" />
                {Number(item.rating).toFixed(1)}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </button>
  );
});

export const SeriesCatalogView: React.FC<SeriesCatalogViewProps> = ({
  onSelectMedia,
  searchQuery = '',
  onClearSearch,
}) => {
  const [catalogRevision, setCatalogRevision] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const catalogScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync real series from MySQL API on mount and listen to catalog updates
  useEffect(() => {
    const existing = AdminService.getContents();
    if (!existing || existing.length === 0) {
      setIsLoading(true);
    }
    AdminService.fetchRemoteContents()
      .catch(() => {})
      .finally(() => setIsLoading(false));

    const handleUpdate = () => setCatalogRevision((prev) => prev + 1);
    window.addEventListener('mastertv_catalog_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_catalog_updated', handleUpdate);
  }, []);

  // Reset pagination on category or search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (catalogScrollRef.current) {
      catalogScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory, searchQuery]);

  // Load real series from AdminService preserving all seasons, episodes, IDs and stream URLs
  const realSeries: MediaItem[] = useMemo(() => {
    try {
      const all = AdminService.getContents();
      if (!Array.isArray(all)) return [];
      return all
        .filter((c) => c && c.type === 'series')
        .map((c) => ({
          id: String(c.id || `series-${Math.random()}`),
          title: String(c.title || 'Titulo'),
          tagline: c.tagline ? String(c.tagline) : undefined,
          type: 'series' as const,
          year: Number(c.year) || 0,
          rating: Number(c.rating) || 0,
          duration: c.duration ? String(c.duration) : undefined,
          contentRating: c.contentRating ? String(c.contentRating) : undefined,
          genres: Array.isArray(c.genres)
            ? c.genres.map(String).map((g) => g.trim()).filter(Boolean)
            : typeof c.genres === 'string'
            ? String(c.genres).split(',').map((g) => g.trim()).filter(Boolean)
            : [],
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

  // Real recent releases based on actual release years in catalog
  const releasesList = useMemo(() => {
    if (realSeries.length === 0) return [];
    const maxYear = realSeries.reduce((max, s) => (s.year && s.year > max ? s.year : max), 0);
    if (maxYear > 0) {
      const recent = realSeries.filter((s) => s.year >= maxYear - 1);
      if (recent.length > 0) return recent;
    }
    return realSeries;
  }, [realSeries]);

  // Featured series reusing real catalog ordering/rating (without inventing metrics)
  const featuredList = useMemo(() => {
    if (realSeries.length === 0) return [];
    const releaseIds = new Set(releasesList.slice(0, 6).map((s) => s.id));
    const remaining = realSeries.filter((s) => !releaseIds.has(s.id));
    const pool = remaining.length >= 6 ? remaining : realSeries;
    return [...pool].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [realSeries, releasesList]);

  // Build real categories sidebar strictly from genres present in realSeries (no empty/fictitious categories)
  const sidebarCategories = useMemo(() => {
    const list: { id: string; name: string; count: number }[] = [
      { id: 'todas', name: 'Todas as Séries', count: realSeries.length },
    ];

    if (releasesList.length > 0) {
      list.push({ id: 'lancamentos', name: 'Lançamentos', count: releasesList.length });
    }

    const genreMap = new Map<string, { label: string; count: number }>();
    realSeries.forEach((series) => {
      series.genres.forEach((raw) => {
        const clean = raw.trim();
        if (!clean || clean.toLowerCase() === 'geral') return;
        const key = clean.toLowerCase();
        const existing = genreMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          genreMap.set(key, { label: clean, count: 1 });
        }
      });
    });

    const sortedGenres = Array.from(genreMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, val]) => ({
        id: key,
        name: val.label,
        count: val.count,
      }));

    return [...list, ...sortedGenres];
  }, [realSeries, releasesList]);

  // Active filtered series for category or search
  const activeFilteredSeries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base = realSeries;

    if (selectedCategory === 'lancamentos') {
      base = releasesList;
    } else if (selectedCategory === 'destaques') {
      base = featuredList;
    } else if (selectedCategory !== 'todas') {
      base = realSeries.filter((s) =>
        s.genres.some((g) => g.toLowerCase() === selectedCategory.toLowerCase())
      );
    }

    if (!q) return base;

    return base.filter((s) => {
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const genreMatch = s.genres.some((g) => g.toLowerCase().includes(q));
      const yearMatch = s.year ? String(s.year).includes(q) : false;
      return titleMatch || genreMatch || yearMatch;
    });
  }, [realSeries, releasesList, featuredList, selectedCategory, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const isOverviewMode = !isSearching && selectedCategory === 'todas';
  const activeCategoryLabel =
    selectedCategory === 'destaques'
      ? 'Séries em Destaque'
      : sidebarCategories.find((c) => c.id === selectedCategory)?.name || 'Séries';

  const paginatedItems = activeFilteredSeries.slice(0, visibleCount);
  const hasMoreItems = visibleCount < activeFilteredSeries.length;

  return (
    <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col md:flex-row gap-4 lg:gap-5 px-4 lg:px-7 pb-5 pt-1 max-w-[1920px] mx-auto overflow-hidden select-none">
      {/* LEFT COLUMN — REAL CATEGORIES SIDEBAR (Desktop 20%-22%, independent vertical scroll) */}
      <aside className="hidden md:flex md:w-[23%] lg:w-[21%] xl:w-[20%] min-w-[220px] max-w-[300px] h-full flex-col rounded-2xl bg-[#07182B]/85 backdrop-blur-xl border border-[#00BFFF]/20 shadow-[0_18px_50px_rgba(0,0,0,0.6)] overflow-hidden shrink-0">
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 custom-scroll">
          {sidebarCategories.map((cat) => {
            const Icon = getSeriesCategoryIcon(cat.id, cat.name);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`group w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#004B96] via-[#083566] to-[#07182B] border-[#00BFFF]/85 text-white shadow-[0_0_16px_rgba(0,191,255,0.22)]'
                    : 'bg-transparent border-transparent text-[#A9B8CC] hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isSelected ? 'text-[#00BFFF]' : 'text-slate-300/80 group-hover:text-white'
                    }`}
                  />
                  <span className={`text-sm truncate ${isSelected ? 'font-bold text-white' : 'font-medium'}`}>
                    {cat.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono shrink-0 ${
                    isSelected ? 'text-[#00BFFF] font-bold' : 'text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MOBILE / TABLET HORIZONTAL CATEGORY PILLS */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
        {sidebarCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#00BFFF]/20 border-[#00BFFF]/70 text-white'
                  : 'bg-[#07182B]/80 border-white/10 text-[#A9B8CC]'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* RIGHT COLUMN — SERIES CATALOG (Independent vertical scroll) */}
      <div
        ref={catalogScrollRef}
        className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden pr-1 space-y-6 custom-scroll"
      >
        {/* DECORATIVE BLUE SERIES BANNER (Static original illustration, zero real series posters) */}
        {!isSearching && (
          <div className="relative w-full h-[170px] sm:h-[205px] lg:h-[235px] xl:h-[260px] rounded-2xl overflow-hidden bg-[#07182B] border border-[#00BFFF]/25 shadow-[0_18px_45px_rgba(0,0,0,0.65)] shrink-0">
            <img
              src="./assets/img/home/banner_series.png"
              alt="Series Temporadas Completas"
              className="absolute inset-0 w-full h-full object-cover object-left sm:object-center"
            />
            {/* Smooth Dark Blue Gradient for Crisp Typography */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#030A16]/20 via-[#030A16]/35 to-[#030A16]/90 pointer-events-none" />

            {/* Right-aligned Banner Typography (matching reference) */}
            <div className="relative z-10 h-full w-full flex items-center justify-end px-6 sm:px-10 lg:px-14">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)]">
                  SÉRIES
                </h2>
                <div className="w-44 sm:w-56 h-[2px] bg-gradient-to-r from-transparent via-[#00BFFF] to-transparent my-2.5" />
                <p className="text-xs sm:text-sm font-semibold tracking-[0.26em] text-slate-200 uppercase">
                  TEMPORADAS COMPLETAS
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && realSeries.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#A9B8CC]">
            <Loader2 className="w-8 h-8 text-[#00BFFF] animate-spin" />
            <span className="text-sm font-medium">Carregando catalogo de series...</span>
          </div>
        ) : realSeries.length === 0 ? (
          /* EMPTY CATALOG STATE */
          <div className="py-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#07182B]/60 border border-white/10 text-center px-6">
            <Tv className="w-10 h-10 text-slate-500" />
            <h3 className="text-base font-bold text-white">Nenhuma serie disponivel no catalogo</h3>
            <p className="text-xs text-[#A9B8CC] max-w-md">
              Importe sua lista de series no painel administrativo para visualizar todas as temporadas e episodios aqui.
            </p>
          </div>
        ) : isOverviewMode ? (
          /* OVERVIEW MODE (Todas as Series): Lancamentos + Series em Destaque + Catalogo Paginado */
          <div className="space-y-7 pb-6">
            {/* SECTION 1: LANCAMENTOS */}
            {releasesList.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Lançamentos
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('lancamentos')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#A9B8CC] hover:text-[#00BFFF] transition-colors cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {releasesList.slice(0, 6).map((series) => (
                    <SeriesPosterCard key={series.id} item={series} onSelect={onSelectMedia} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: SERIES EM DESTAQUE */}
            {featuredList.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Séries em Destaque
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('destaques')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#A9B8CC] hover:text-[#00BFFF] transition-colors cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {featuredList.slice(0, 6).map((series) => (
                    <SeriesPosterCard key={series.id} item={series} onSelect={onSelectMedia} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 3: EXPLORAR CATALOGO (Progressive Pagination) */}
            {realSeries.length > 12 && (
              <section className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Explorar Séries
                    <span className="ml-2 text-xs font-mono font-normal text-[#A9B8CC]">
                      ({realSeries.length} títulos)
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {paginatedItems.map((series) => (
                    <SeriesPosterCard key={series.id} item={series} onSelect={onSelectMedia} />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-xl bg-[#07182B] hover:bg-[#0A1B30] border border-[#00BFFF]/40 hover:border-[#00BFFF] text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Carregar mais séries ({activeFilteredSeries.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          /* FILTERED CATEGORY OR SEARCH RESULTS VIEW */
          <section className="space-y-4 pb-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {isSearching && <Search className="w-4 h-4 text-[#00BFFF] shrink-0" />}
                <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {isSearching ? `Resultados para "${searchQuery}"` : activeCategoryLabel}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#00BFFF]/15 border border-[#00BFFF]/30 text-[11px] font-mono font-bold text-[#00BFFF] shrink-0">
                  {activeFilteredSeries.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isSearching && onClearSearch) {
                    onClearSearch();
                  } else {
                    setSelectedCategory('todas');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isSearching ? 'Limpar busca' : 'Ver todas'}</span>
              </button>
            </div>

            {activeFilteredSeries.length === 0 ? (
              <div className="py-16 text-center text-[#A9B8CC] text-sm rounded-2xl bg-[#07182B]/50 border border-white/5">
                Nenhuma serie encontrada para os criterios selecionados.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {paginatedItems.map((series) => (
                    <SeriesPosterCard key={series.id} item={series} onSelect={onSelectMedia} />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-xl bg-[#07182B] hover:bg-[#0A1B30] border border-[#00BFFF]/40 hover:border-[#00BFFF] text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Carregar mais séries ({activeFilteredSeries.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
