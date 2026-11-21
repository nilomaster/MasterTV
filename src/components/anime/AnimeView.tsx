// MasterTV Redesigned Desktop Anime Catalog View
// Clean dark & orange Crunchyroll-inspired interface with ZERO neon effects
// Scoped palette: #101116 / #17191F / #14161B / #202229 / #FF6400 / #FF8533 / #FFFFFF / #B8BBC5 / #30333B / #282B32
// Preserves 100% of real API/MySQL anime catalog, seasons, episodes, lazy loading, pagination and MediaModal/Player
// Strictly ASCII comments only as per project guidelines

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Flame,
  Tv,
  Film,
  Swords,
  Compass,
  Smile,
  Sparkles,
  Play,
  Search,
  ChevronRight,
  X,
  Loader2,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminService } from '../../services/adminService';
import type { AdminContentItem } from '../../types/admin';
import type { MediaItem } from '../../types/iptv';

interface AnimeViewProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

const PAGE_SIZE = 36;

// Detect if a content item belongs to the Anime catalog
function isAnimeContentItem(c: AdminContentItem): boolean {
  if (!c || c.type === 'channel') return false;
  if (c.type === 'anime') return true;
  const genres: string[] = Array.isArray(c.genres)
    ? c.genres.map((g) => String(g).toLowerCase())
    : typeof c.genres === 'string'
    ? String(c.genres).toLowerCase().split(',').map((g) => g.trim())
    : [];
  const title = (c.title || '').toLowerCase();
  return (
    genres.some((g) => g.includes('anime') || g.includes('shonen') || g.includes('seinen')) ||
    title.includes('anime')
  );
}

// Convert AdminContentItem to MediaItem preserving all real seasons, episodes, IDs and URLs
function toAnimeMediaItem(c: AdminContentItem): MediaItem {
  return {
    id: String(c.id || `anime-${Math.random()}`),
    title: String(c.title || 'Titulo'),
    tagline: c.tagline ? String(c.tagline) : undefined,
    type: (c.type as 'anime' | 'series' | 'movie' | 'dorama') || 'anime',
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
  };
}

// Extract quality badge only when present in real metadata
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

// Discreet monochrome/orange icons for sidebar categories
function getAnimeCategoryIcon(id: string, name: string) {
  const key = `${id} ${name}`.toLowerCase();
  if (id === 'todos') return LayoutGrid;
  if (id === 'lancamentos') return Flame;
  if (id === 'series') return Tv;
  if (id === 'movies') return Film;
  if (key.includes('acao') || key.includes('ação') || key.includes('action') || key.includes('shonen')) return Swords;
  if (key.includes('aventura') || key.includes('adventure')) return Compass;
  if (key.includes('comedia') || key.includes('comédia') || key.includes('comedy')) return Smile;
  if (key.includes('fantas')) return Sparkles;
  return Layers;
}

interface AnimeCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}

const AnimePosterCard: React.FC<AnimeCardProps> = React.memo(({ item, onSelect }) => {
  const qualityBadge = extractRealQualityBadge(item);
  const coverSrc = item.posterUrl || item.backdropUrl || './assets/img/icons/favicon.svg';
  const primaryGenre = item.genres && item.genres.length > 0 && item.genres[0] !== 'Geral' ? item.genres[0] : null;
  const seasonsLabel = item.seasons && item.seasons > 0 ? `${item.seasons} ${item.seasons === 1 ? 'Temp.' : 'Temps.'}` : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group relative w-full aspect-[2/3] rounded-[10px] overflow-hidden bg-[#202229] border border-[#30333B] hover:border-[#FF6400] shadow-[0_6px_18px_rgba(0,0,0,0.45)] hover:shadow-[0_14px_28px_rgba(0,0,0,0.7)] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FF6400] cursor-pointer text-left"
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
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />

      {/* Clean Dark Bottom Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#101116] via-[#101116]/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

      {/* Quality Badge (solid orange pill, only when real metadata exists) */}
      {qualityBadge && (
        <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-[#FF6400] text-[10px] font-extrabold tracking-wider text-white">
          {qualityBadge}
        </span>
      )}

      {/* Discreet Hover Play Button (Zero neon) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="w-11 h-11 rounded-full bg-[#FF6400] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>
      </div>

      {/* Title & Real Metadata at Base */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 flex flex-col gap-0.5">
        <h3 className="text-xs font-bold text-white truncate leading-tight">
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-[#B8BBC5] opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-6 transition-all duration-200 overflow-hidden">
          {item.year ? <span>{item.year}</span> : null}
          {seasonsLabel ? (
            <>
              {item.year ? <span>·</span> : null}
              <span className="text-[#FF8533] font-semibold shrink-0">{seasonsLabel}</span>
            </>
          ) : null}
          {primaryGenre ? (
            <>
              <span>·</span>
              <span className="truncate">{primaryGenre}</span>
            </>
          ) : null}
        </div>
      </div>
    </button>
  );
});

export const AnimeView: React.FC<AnimeViewProps> = ({
  searchQuery = '',
  onClearSearch,
}) => {
  const { setSelectedMedia } = useApp();
  const [catalogRevision, setCatalogRevision] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const catalogScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync real animes from MySQL API on mount and listen to updates
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

  // Load real animes from AdminService (strictly no fictitious data)
  const realAnimes: MediaItem[] = useMemo(() => {
    try {
      const all = AdminService.getContents();
      if (!Array.isArray(all)) return [];
      return all.filter(isAnimeContentItem).map(toAnimeMediaItem);
    } catch {
      return [];
    }
  }, [catalogRevision]);

  const animeMovies = useMemo(
    () => realAnimes.filter((a) => a.type === 'movie'),
    [realAnimes]
  );

  const animeSeries = useMemo(
    () => realAnimes.filter((a) => a.type !== 'movie'),
    [realAnimes]
  );

  // Real recent releases based on actual release years in catalog
  const releasesList = useMemo(() => {
    if (realAnimes.length === 0) return [];
    const maxYear = realAnimes.reduce((max, a) => (a.year && a.year > max ? a.year : max), 0);
    if (maxYear > 0) {
      const recent = realAnimes.filter((a) => a.year >= maxYear - 1);
      if (recent.length > 0) return recent;
    }
    return realAnimes;
  }, [realAnimes]);

  // Real featured selection from existing catalog (without inventing audience metrics)
  const featuredList = useMemo(() => {
    if (realAnimes.length === 0) return [];
    const releaseIds = new Set(releasesList.slice(0, 6).map((a) => a.id));
    const remaining = realAnimes.filter((a) => !releaseIds.has(a.id));
    const pool = remaining.length >= 6 ? remaining : realAnimes;
    return [...pool].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [realAnimes, releasesList]);

  // Build sidebar strictly from real categories/genres present in realAnimes
  const sidebarCategories = useMemo(() => {
    const list: { id: string; name: string; count: number }[] = [
      { id: 'todos', name: 'Todos os Animes', count: realAnimes.length },
    ];

    if (releasesList.length > 0) {
      list.push({ id: 'lancamentos', name: 'Lançamentos', count: releasesList.length });
    }
    if (animeSeries.length > 0 && animeMovies.length > 0) {
      list.push({ id: 'series', name: 'Séries de Anime', count: animeSeries.length });
      list.push({ id: 'movies', name: 'Filmes de Anime', count: animeMovies.length });
    } else if (animeMovies.length > 0) {
      list.push({ id: 'movies', name: 'Filmes de Anime', count: animeMovies.length });
    }

    const genreMap = new Map<string, { label: string; count: number }>();
    realAnimes.forEach((anime) => {
      anime.genres.forEach((raw) => {
        const clean = raw.trim();
        if (!clean || clean.toLowerCase() === 'geral' || clean.toLowerCase() === 'anime') return;
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
        id: `genre:${key}`,
        name: val.label,
        count: val.count,
      }));

    return [...list, ...sortedGenres];
  }, [realAnimes, releasesList, animeSeries, animeMovies]);

  // Active filtered animes for category or search
  const activeFilteredAnimes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base = realAnimes;

    if (selectedCategory === 'lancamentos') {
      base = releasesList;
    } else if (selectedCategory === 'destaques') {
      base = featuredList;
    } else if (selectedCategory === 'series') {
      base = animeSeries;
    } else if (selectedCategory === 'movies') {
      base = animeMovies;
    } else if (selectedCategory.startsWith('genre:')) {
      const targetGenre = selectedCategory.replace('genre:', '');
      base = realAnimes.filter((a) =>
        a.genres.some((g) => g.toLowerCase() === targetGenre)
      );
    }

    if (!q) return base;

    return base.filter((a) => {
      const titleMatch = (a.title || '').toLowerCase().includes(q);
      const genreMatch = a.genres.some((g) => g.toLowerCase().includes(q));
      const yearMatch = a.year ? String(a.year).includes(q) : false;
      return titleMatch || genreMatch || yearMatch;
    });
  }, [realAnimes, releasesList, featuredList, animeSeries, animeMovies, selectedCategory, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const isOverviewMode = !isSearching && selectedCategory === 'todos';
  const activeCategoryLabel =
    selectedCategory === 'destaques'
      ? 'Animes em Destaque'
      : sidebarCategories.find((c) => c.id === selectedCategory)?.name || 'Animes';

  const paginatedItems = activeFilteredAnimes.slice(0, visibleCount);
  const hasMoreItems = visibleCount < activeFilteredAnimes.length;

  return (
    <div className="anime-theme relative w-full flex-1 min-h-0 bg-[#101116] flex flex-col md:flex-row max-w-[1920px] mx-auto overflow-hidden select-none">
      {/* LEFT SIDEBAR — #14161B (19%-21% width, independent vertical scroll, ZERO neon) */}
      <aside className="hidden md:flex md:w-[21%] lg:w-[20%] xl:w-[19%] min-w-[220px] max-w-[290px] h-full flex-col bg-[#14161B] border-r border-[#282B32] relative overflow-hidden shrink-0">
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-3.5 space-y-1.5 custom-scroll">
          {sidebarCategories.map((cat) => {
            const Icon = getAnimeCategoryIcon(cat.id, cat.name);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[10px] text-left transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF6400] hover:bg-[#FF8533] text-white font-bold'
                    : 'bg-transparent hover:bg-[#202229] text-[#B8BBC5] hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isSelected ? 'text-white' : 'text-[#B8BBC5]'
                    }`}
                  />
                  <span className="text-sm truncate">{cat.name}</span>
                </div>
                <span
                  className={`text-[11px] font-mono shrink-0 ${
                    isSelected ? 'text-white/90 font-bold' : 'text-[#B8BBC5]/60'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtle Solid Orange Graphic Corner Ribbon at Bottom-Left (matching reference, zero neon) */}
        <svg
          className="pointer-events-none absolute bottom-0 left-0 w-44 h-28 opacity-95"
          viewBox="0 0 180 120"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0,24 C65,36 122,74 156,120 L108,120 C76,84 36,64 0,58 Z" fill="#FF6400" />
          <path d="M0,74 C36,80 68,96 90,120 L0,120 Z" fill="#FF6400" />
        </svg>
      </aside>

      {/* MOBILE / TABLET HORIZONTAL CATEGORY BAR */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2.5 bg-[#14161B] border-b border-[#282B32] shrink-0">
        {sidebarCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#FF6400] text-white'
                  : 'bg-[#202229] text-[#B8BBC5] border border-[#30333B]'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* RIGHT MAIN AREA — BANNER & REAL ANIME CATALOG (Independent vertical scroll) */}
      <div
        ref={catalogScrollRef}
        className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-7 py-5 space-y-6 custom-scroll"
      >
        {/* DECORATIVE ANIME BANNER (Static original illustration, zero neon, zero copyrighted characters) */}
        {!isSearching && (
          <div className="relative w-full h-[175px] sm:h-[210px] lg:h-[235px] xl:h-[260px] rounded-xl overflow-hidden bg-[#17191F] border border-[#30333B] shadow-[0_12px_30px_rgba(0,0,0,0.5)] shrink-0">
            <img
              src="./assets/img/home/banner_anime.png"
              alt="Anime Series Filmes Lancamentos"
              className="absolute inset-0 w-full h-full object-cover object-left sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#101116]/35 to-[#101116]/90 pointer-events-none" />

            {/* Right-aligned Clean Editorial Typography */}
            <div className="relative z-10 h-full w-full flex items-center justify-end px-6 sm:px-10 lg:px-14">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                  Anime
                </h2>
                <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#B8BBC5] mt-2.5">
                  Séries • Filmes • Lançamentos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && realAnimes.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#B8BBC5]">
            <Loader2 className="w-8 h-8 text-[#FF6400] animate-spin" />
            <span className="text-sm font-medium">Carregando catálogo de animes...</span>
          </div>
        ) : realAnimes.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-20 flex flex-col items-center justify-center gap-3 rounded-[10px] bg-[#17191F] border border-[#30333B] text-center px-6">
            <Tv className="w-10 h-10 text-[#B8BBC5]" />
            <h3 className="text-base font-bold text-white">Nenhum anime disponível no catálogo</h3>
            <p className="text-xs text-[#B8BBC5] max-w-md">
              Importe sua lista de animes no painel administrativo para visualizar todas as temporadas, episódios e filmes aqui.
            </p>
          </div>
        ) : isOverviewMode ? (
          /* OVERVIEW MODE: Lancamentos + Em Destaque + Catalogo Paginado */
          <div className="space-y-7 pb-6">
            {/* SECTION 1: LANCAMENTOS */}
            {releasesList.length > 0 && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1 h-5 rounded-sm bg-[#FF6400]" />
                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                      Lançamentos
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('lancamentos')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#B8BBC5] hover:text-[#FF8533] transition-colors cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {releasesList.slice(0, 6).map((anime) => (
                    <AnimePosterCard key={anime.id} item={anime} onSelect={setSelectedMedia} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: EM DESTAQUE (Real catalog selection, no invented audience stats) */}
            {featuredList.length > 0 && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1 h-5 rounded-sm bg-[#FF6400]" />
                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                      Em Destaque
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('destaques')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#B8BBC5] hover:text-[#FF8533] transition-colors cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {featuredList.slice(0, 6).map((anime) => (
                    <AnimePosterCard key={anime.id} item={anime} onSelect={setSelectedMedia} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 3: CATALOGO COMPLETO (Progressive Pagination) */}
            {realAnimes.length > 12 && (
              <section className="space-y-3.5 pt-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-1 h-5 rounded-sm bg-[#FF6400]" />
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Catálogo Completo
                    <span className="ml-2 text-xs font-mono font-normal text-[#B8BBC5]">
                      ({realAnimes.length} títulos)
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {paginatedItems.map((anime) => (
                    <AnimePosterCard key={anime.id} item={anime} onSelect={setSelectedMedia} />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-[10px] bg-[#FF6400] hover:bg-[#FF8533] text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Carregar mais animes ({activeFilteredAnimes.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          /* FILTERED CATEGORY OR SEARCH RESULTS VIEW */
          <section className="space-y-4 pb-6">
            <div className="flex items-center justify-between border-b border-[#282B32] pb-3 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-1 h-5 rounded-sm bg-[#FF6400] shrink-0" />
                {isSearching && <Search className="w-4 h-4 text-[#FF6400] shrink-0" />}
                <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {isSearching ? `Resultados para "${searchQuery}"` : activeCategoryLabel}
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#202229] border border-[#30333B] text-[11px] font-mono font-bold text-[#B8BBC5] shrink-0">
                  {activeFilteredAnimes.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isSearching && onClearSearch) {
                    onClearSearch();
                  } else {
                    setSelectedCategory('todos');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#202229] hover:bg-[#30333B] border border-[#30333B] text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isSearching ? 'Limpar busca' : 'Ver todos'}</span>
              </button>
            </div>

            {activeFilteredAnimes.length === 0 ? (
              <div className="py-16 text-center text-[#B8BBC5] text-sm rounded-[10px] bg-[#17191F] border border-[#30333B]">
                Nenhum anime encontrado para os critérios selecionados.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {paginatedItems.map((anime) => (
                    <AnimePosterCard key={anime.id} item={anime} onSelect={setSelectedMedia} />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-[10px] bg-[#FF6400] hover:bg-[#FF8533] text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Carregar mais animes ({activeFilteredAnimes.length - visibleCount} restantes)
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
