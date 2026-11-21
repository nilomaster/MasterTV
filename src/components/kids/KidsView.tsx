// MasterTV Redesigned Desktop Kids Catalog View
// Cheerful, colorful cartoon-style interface with zero excessive neon
// Two-column layout: Left Kids Sidebar (#07539A with #FFD93D active pill) + Right Banner & Real Kids Catalog
// Preserves 100% of real synchronized cartoons, series, movies, live kids channels, search and MediaModal/Player
// Strictly ASCII comments only as per project guidelines

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Star,
  Rocket,
  Tv,
  Film,
  Clapperboard,
  BookOpen,
  Music,
  Sparkles,
  Play,
  Search,
  ChevronRight,
  X,
  Loader2,
  Heart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';
import { AdminService } from '../../services/adminService';
import type { AdminContentItem } from '../../types/admin';
import type { MediaItem, Channel } from '../../types/iptv';

interface KidsViewProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

const PAGE_SIZE = 36;

// Detect if an item belongs to Kids / Desenhos catalog
function isKidsContentItem(item: AdminContentItem | Channel): boolean {
  const title = (
    ('title' in item ? item.title : '') ||
    ('name' in item ? (item as any).name : '') ||
    ''
  ).toLowerCase();

  const category = (
    ('channelCategory' in item ? item.channelCategory || '' : '') ||
    ('category' in item ? (item as any).category || '' : '') ||
    ('groupTitle' in item ? (item as any).groupTitle || '' : '') ||
    ''
  ).toLowerCase();

  const genres: string[] = Array.isArray((item as any).genres)
    ? (item as any).genres.map((g: any) => String(g).toLowerCase())
    : typeof (item as any).genres === 'string'
    ? (item as any).genres.toLowerCase().split(',').map((g: string) => g.trim())
    : [];

  const kidsKeywords = [
    'infantil',
    'desenho',
    'desenhos',
    'kids',
    'cartoon',
    'animacao',
    'animação',
    'animation',
    'sessao desenho',
    'sessão desenho',
    'disney',
    'gloob',
    'nickelodeon',
    'nick',
    'nick jr',
    'discovery kids',
    'baby tv',
    'peppa',
    'galinha pintadinha',
    'bob esponja',
    'chaves em desenho',
    'turma da monica',
    'turma da mônica',
    'patrulha canina',
    'paw patrol',
    'dbillions',
    'oddbods',
    'snoopy',
    'peanuts',
    'ben 10',
    'tom & jerry',
    'tom e jerry',
    'looney tunes',
    'mickey',
    'pocoyo',
    'dora',
    'baby shark',
  ];

  if (kidsKeywords.some((k) => category.includes(k))) return true;
  if (kidsKeywords.some((k) => genres.some((g) => g.includes(k)))) return true;
  if (kidsKeywords.some((k) => title.includes(k))) return true;
  return false;
}

// Convert AdminContentItem to MediaItem preserving all real seasons, episodes, IDs and URLs
function toMediaItem(c: AdminContentItem): MediaItem {
  return {
    id: String(c.id || `kids-vod-${Math.random()}`),
    title: String(c.title || 'Titulo'),
    tagline: c.tagline ? String(c.tagline) : undefined,
    type: (c.type as 'movie' | 'series' | 'anime' | 'dorama') || 'movie',
    year: Number(c.year) || 0,
    rating: Number(c.rating) || 0,
    duration: c.duration ? String(c.duration) : undefined,
    contentRating: c.contentRating ? String(c.contentRating) : 'Livre',
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

// Friendly colorful icon badge mapping for Kids sidebar
function getKidsCategoryIconInfo(id: string, name: string) {
  const key = `${id} ${name}`.toLowerCase();
  if (id === 'todos') return { Icon: Star, color: 'text-[#FFD93D]', fill: true };
  if (id === 'lancamentos') return { Icon: Rocket, color: 'text-[#FF70B5]', fill: false };
  if (id === 'series') return { Icon: Tv, color: 'text-[#65C94A]', fill: false };
  if (id === 'movies') return { Icon: Film, color: 'text-[#FFD93D]', fill: false };
  if (id === 'live') return { Icon: Tv, color: 'text-[#5CC8FF]', fill: false };
  if (key.includes('music') || key.includes('canc')) return { Icon: Music, color: 'text-[#FFD93D]', fill: false };
  if (key.includes('educat')) return { Icon: BookOpen, color: 'text-[#65C94A]', fill: false };
  if (key.includes('animac') || key.includes('animaç')) return { Icon: Clapperboard, color: 'text-[#FF70B5]', fill: false };
  if (key.includes('favorit')) return { Icon: Heart, color: 'text-[#FF70B5]', fill: true };
  return { Icon: Sparkles, color: 'text-[#FFD93D]', fill: false };
}

interface KidsCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}

const KidsPosterCard: React.FC<KidsCardProps> = React.memo(({ item, onSelect }) => {
  const qualityBadge = extractRealQualityBadge(item);
  const coverSrc = item.posterUrl || item.backdropUrl || './assets/img/icons/favicon.svg';

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group relative w-full aspect-[4/4.2] sm:aspect-[2/2.3] rounded-2xl overflow-hidden bg-[#07539A] border-2 border-white/30 hover:border-[#FFD93D] shadow-[0_10px_24px_rgba(4,40,80,0.35)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] focus:outline-none focus:ring-3 focus:ring-[#FFD93D] cursor-pointer text-left"
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

      {/* Soft Bottom Gradient for Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#053568]/95 via-[#053568]/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

      {/* Quality Badge (only when real metadata exists) */}
      {qualityBadge && (
        <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-[#042A52]/85 border border-white/25 text-[10px] font-extrabold tracking-wider text-white">
          {qualityBadge}
        </span>
      )}

      {/* Friendly Centered Play Button */}
      <div className="absolute inset-x-0 bottom-9 sm:bottom-10 z-10 flex justify-center pointer-events-none transition-transform duration-300 group-hover:-translate-y-1.5">
        <div className="w-10 h-10 rounded-full bg-[#042A52]/75 group-hover:bg-[#FFD93D] border-2 border-white text-white group-hover:text-[#042A52] flex items-center justify-center shadow-md transition-colors duration-200">
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </div>
      </div>

      {/* Title at Base */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-2.5 pb-2 pt-1">
        <h3 className="text-xs font-extrabold text-white truncate text-center drop-shadow">
          {item.title}
        </h3>
      </div>
    </button>
  );
});

export const KidsView: React.FC<KidsViewProps> = ({
  searchQuery = '',
  onClearSearch,
}) => {
  const { playMediaStream, channels, setCurrentChannel, setSelectedMedia } = useApp();
  const { navigateTo } = useNavigation();
  const [catalogRevision, setCatalogRevision] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const catalogScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync catalog from remote MySQL API on mount and listen to catalog updates
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

  // Reset pagination when changing category or search
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (catalogScrollRef.current) {
      catalogScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory, searchQuery]);

  // Extract real kids items & live kids channels from synchronized database
  const { kidsMediaItems, kidsLiveChannels } = useMemo(() => {
    const allContents = AdminService.getContents();
    const mediaItems: MediaItem[] = [];

    if (Array.isArray(allContents)) {
      allContents.forEach((c) => {
        if (!c || c.type === 'channel') return;
        if (isKidsContentItem(c)) {
          mediaItems.push(toMediaItem(c));
        }
      });
    }

    const liveKids = (channels || []).filter((ch) => isKidsContentItem(ch));
    return {
      kidsMediaItems: mediaItems,
      kidsLiveChannels: liveKids,
    };
  }, [channels, catalogRevision]);

  const kidsSeries = useMemo(() => kidsMediaItems.filter((i) => i.type === 'series'), [kidsMediaItems]);
  const kidsMovies = useMemo(() => kidsMediaItems.filter((i) => i.type === 'movie'), [kidsMediaItems]);

  // Real recent releases based on actual release years in kids catalog
  const releasesList = useMemo(() => {
    if (kidsMediaItems.length === 0) return [];
    const maxYear = kidsMediaItems.reduce((max, i) => (i.year && i.year > max ? i.year : max), 0);
    if (maxYear > 0) {
      const recent = kidsMediaItems.filter((i) => i.year >= maxYear - 1);
      if (recent.length > 0) return recent;
    }
    return kidsMediaItems;
  }, [kidsMediaItems]);

  // Real popular / most watched ordering from existing catalog (no invented metrics)
  const popularList = useMemo(() => {
    if (kidsMediaItems.length === 0) return [];
    const releaseIds = new Set(releasesList.slice(0, 6).map((i) => i.id));
    const remaining = kidsMediaItems.filter((i) => !releaseIds.has(i.id));
    const pool = remaining.length >= 6 ? remaining : kidsMediaItems;
    return [...pool].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [kidsMediaItems, releasesList]);

  // Build real sidebar categories strictly from actual data present (no empty/fictitious categories)
  const sidebarCategories = useMemo(() => {
    const list: { id: string; name: string; count: number }[] = [
      { id: 'todos', name: 'Todos os Desenhos', count: kidsMediaItems.length },
    ];

    if (releasesList.length > 0) {
      list.push({ id: 'lancamentos', name: 'Lançamentos', count: releasesList.length });
    }
    if (kidsSeries.length > 0) {
      list.push({ id: 'series', name: 'Séries Infantis', count: kidsSeries.length });
    }
    if (kidsMovies.length > 0) {
      list.push({ id: 'movies', name: 'Filmes Infantis', count: kidsMovies.length });
    }
    if (kidsLiveChannels.length > 0) {
      list.push({ id: 'live', name: 'Canais Kids', count: kidsLiveChannels.length });
    }

    const genreMap = new Map<string, { label: string; count: number }>();
    kidsMediaItems.forEach((item) => {
      item.genres.forEach((raw) => {
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
        id: `genre:${key}`,
        name: val.label,
        count: val.count,
      }));

    return [...list, ...sortedGenres];
  }, [kidsMediaItems, releasesList, kidsSeries, kidsMovies, kidsLiveChannels]);

  // Open existing MediaModal or VOD player preserving seasons, episodes, history and playback
  const handleSelectMediaItem = useCallback(
    (item: MediaItem) => {
      setSelectedMedia(item);
    },
    [setSelectedMedia]
  );

  const handleSelectChannel = useCallback(
    (ch: Channel) => {
      setCurrentChannel(ch);
      playMediaStream(ch.streamUrl, ch.name);
      navigateTo('player');
    },
    [navigateTo, playMediaStream, setCurrentChannel]
  );

  // Filtered list for category or search
  const activeFilteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base = kidsMediaItems;

    if (selectedCategory === 'lancamentos') {
      base = releasesList;
    } else if (selectedCategory === 'populares') {
      base = popularList;
    } else if (selectedCategory === 'series') {
      base = kidsSeries;
    } else if (selectedCategory === 'movies') {
      base = kidsMovies;
    } else if (selectedCategory.startsWith('genre:')) {
      const targetGenre = selectedCategory.replace('genre:', '');
      base = kidsMediaItems.filter((i) =>
        i.genres.some((g) => g.toLowerCase() === targetGenre)
      );
    }

    if (!q) return base;

    return base.filter((i) => {
      const titleMatch = (i.title || '').toLowerCase().includes(q);
      const genreMatch = i.genres.some((g) => g.toLowerCase().includes(q));
      return titleMatch || genreMatch;
    });
  }, [kidsMediaItems, releasesList, popularList, kidsSeries, kidsMovies, selectedCategory, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const isOverviewMode = !isSearching && selectedCategory === 'todos';
  const activeCategoryLabel =
    selectedCategory === 'populares'
      ? 'Mais Assistidos'
      : sidebarCategories.find((c) => c.id === selectedCategory)?.name || 'Desenhos';

  const paginatedItems = activeFilteredItems.slice(0, visibleCount);
  const hasMoreItems = visibleCount < activeFilteredItems.length;

  return (
    <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col md:flex-row gap-4 lg:gap-5 px-4 lg:px-7 pb-5 pt-2 max-w-[1920px] mx-auto overflow-hidden select-none">
      {/* LEFT COLUMN — KIDS CATEGORIES SIDEBAR (#07539A, friendly icons, #FFD93D selected pill) */}
      <aside className="hidden md:flex md:w-[23%] lg:w-[21%] xl:w-[20%] min-w-[225px] max-w-[300px] h-full flex-col rounded-3xl bg-[#07539A]/92 border-2 border-white/25 shadow-[0_14px_34px_rgba(4,40,80,0.38)] overflow-hidden shrink-0">
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scroll">
          {sidebarCategories.map((cat) => {
            const { Icon, color, fill } = getKidsCategoryIconInfo(cat.id, cat.name);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`group w-full flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFD93D] text-[#053363] font-extrabold shadow-[0_6px_16px_rgba(4,40,80,0.28)]'
                    : 'bg-[#0861B3]/70 hover:bg-[#0B73D1] text-white font-bold'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#053363]/10' : 'bg-white/15'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#053363]' : color
                      } ${fill ? 'fill-current' : ''}`}
                    />
                  </div>
                  <span className="text-sm truncate">{cat.name}</span>
                </div>
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-[#053363]/15 text-[#053363]'
                      : 'bg-white/15 text-white/90'
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
              className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                isSelected
                  ? 'bg-[#FFD93D] text-[#053363]'
                  : 'bg-[#07539A]/90 border border-white/25 text-white'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* RIGHT COLUMN — KIDS BANNER & REAL CATALOG (Independent vertical scroll) */}
      <div
        ref={catalogScrollRef}
        className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden pr-1 space-y-5 custom-scroll"
      >
        {/* DECORATIVE KIDS BANNER (Original 3D illustration, static, zero copyrighted characters) */}
        {!isSearching && (
          <div className="relative w-full h-[175px] sm:h-[210px] lg:h-[235px] xl:h-[255px] rounded-3xl overflow-hidden bg-[#168FE8] border-2 border-white/35 shadow-[0_14px_34px_rgba(4,40,80,0.35)] shrink-0">
            <img
              src="./assets/img/home/banner_kids.png"
              alt="Kids Filmes e Series Infantis"
              className="absolute inset-0 w-full h-full object-cover object-left sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0874CB]/55 pointer-events-none" />

            {/* Right-aligned Colorful Cartoon Typography */}
            <div className="relative z-10 h-full w-full flex items-center justify-end px-6 sm:px-10 lg:px-14">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-5xl sm:text-6xl lg:text-7xl font-black tracking-wide drop-shadow-[0_5px_0_rgba(5,51,99,0.55)]">
                  <span className="text-[#FFD93D]">K</span>
                  <span className="text-[#FF70B5]">I</span>
                  <span className="text-[#5CC8FF]">D</span>
                  <span className="text-[#65C94A]">S</span>
                </div>
                <div className="mt-2 px-4 sm:px-5 py-1.5 rounded-full bg-[#FF4D6D] border-2 border-white/80 text-white font-extrabold text-[11px] sm:text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5">
                  <span>FILMES E SÉRIES INFANTIS</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && kidsMediaItems.length === 0 && kidsLiveChannels.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#07539A]/85 border-2 border-white/20 text-white">
            <Loader2 className="w-8 h-8 text-[#FFD93D] animate-spin" />
            <span className="text-sm font-bold">Carregando desenhos infantis...</span>
          </div>
        ) : selectedCategory === 'live' ? (
          /* LIVE KIDS CHANNELS VIEW */
          <section className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-[#FFD93D]" />
                <h3 className="text-lg font-black text-white drop-shadow-sm">
                  Canais Kids Ao Vivo ({kidsLiveChannels.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('todos')}
                className="px-3.5 py-1.5 rounded-full bg-[#07539A] hover:bg-[#0A66BC] border border-white/25 text-xs font-bold text-white cursor-pointer"
              >
                Voltar
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {kidsLiveChannels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChannel(ch)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#07539A]/90 hover:bg-[#0A66BC] border-2 border-white/25 hover:border-[#FFD93D] shadow-md transition-all hover:-translate-y-1 cursor-pointer"
                >
                  <div className="w-full aspect-video rounded-xl bg-white/10 flex items-center justify-center p-2 overflow-hidden">
                    <img
                      src={ch.logo || './assets/img/icons/favicon.svg'}
                      alt={ch.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-white truncate w-full text-center">
                    {ch.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : kidsMediaItems.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#07539A]/85 border-2 border-white/20 text-center px-6">
            <Clapperboard className="w-11 h-11 text-[#FFD93D]" />
            <h3 className="text-base font-extrabold text-white">
              Nenhum desenho sincronizado no catálogo
            </h3>
            <p className="text-xs sm:text-sm text-white/85 max-w-md">
              Importe sua lista de desenhos e filmes infantis no painel administrativo para vê-los automaticamente aqui.
            </p>
          </div>
        ) : isOverviewMode ? (
          /* OVERVIEW MODE: Lancamentos + Mais Assistidos + Catalogo Paginado */
          <div className="space-y-6 pb-8">
            {/* SECTION 1: LANCAMENTOS */}
            {releasesList.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#FFD93D] fill-[#FFD93D] drop-shadow" />
                    <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-sm">
                      Lançamentos
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('lancamentos')}
                    className="flex items-center gap-1 px-3.5 py-1 rounded-full bg-[#07539A]/85 hover:bg-[#FFD93D] text-white hover:text-[#053363] border border-white/25 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {releasesList.slice(0, 6).map((item) => (
                    <KidsPosterCard key={item.id} item={item} onSelect={handleSelectMediaItem} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: MAIS ASSISTIDOS */}
            {popularList.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clapperboard className="w-5 h-5 text-[#FF70B5] drop-shadow" />
                    <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-sm">
                      Mais Assistidos
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('populares')}
                    className="flex items-center gap-1 px-3.5 py-1 rounded-full bg-[#07539A]/85 hover:bg-[#FFD93D] text-white hover:text-[#053363] border border-white/25 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {popularList.slice(0, 6).map((item) => (
                    <KidsPosterCard key={item.id} item={item} onSelect={handleSelectMediaItem} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 3: TODOS OS DESENHOS (Progressive Pagination) */}
            {kidsMediaItems.length > 12 && (
              <section className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FFD93D]" />
                  <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-sm">
                    Todos os Desenhos ({kidsMediaItems.length})
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {paginatedItems.map((item) => (
                    <KidsPosterCard key={item.id} item={item} onSelect={handleSelectMediaItem} />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-full bg-[#FFD93D] hover:bg-[#FFE46B] text-[#053363] font-extrabold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Carregar mais desenhos ({activeFilteredItems.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          /* FILTERED CATEGORY OR SEARCH RESULTS VIEW */
          <section className="space-y-4 pb-8">
            <div className="flex items-center justify-between gap-3 bg-[#07539A]/85 border border-white/25 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {isSearching && <Search className="w-4 h-4 text-[#FFD93D] shrink-0" />}
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  {isSearching ? `Resultados para "${searchQuery}"` : activeCategoryLabel}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFD93D] text-[#053363] text-xs font-extrabold shrink-0">
                  {activeFilteredItems.length}
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
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isSearching ? 'Limpar busca' : 'Ver todos'}</span>
              </button>
            </div>

            {activeFilteredItems.length === 0 ? (
              <div className="py-16 text-center text-white/90 text-sm font-semibold rounded-3xl bg-[#07539A]/80 border-2 border-white/20">
                Nenhum desenho encontrado para os critérios selecionados.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {paginatedItems.map((item) => (
                    <KidsPosterCard key={item.id} item={item} onSelect={handleSelectMediaItem} />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-full bg-[#FFD93D] hover:bg-[#FFE46B] text-[#053363] font-extrabold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Carregar mais desenhos ({activeFilteredItems.length - visibleCount} restantes)
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
