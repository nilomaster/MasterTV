// MasterTV Redesigned Desktop Home View
// Clean 5-Card Vertical Hub (TV, Filmes, Series, Kids, Anime)
// Reproduces reference design with layered PNG backgrounds & icons, subtle bottom waves,
// keyboard navigation, and integrated global search over real catalog data
// Strictly ASCII comments only as per project guidelines

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Search, Tv, X } from 'lucide-react';
import type { Channel, MediaItem } from '../types/iptv';
import { AdminService } from '../services/adminService';

interface HomeViewProps {
  channels?: Channel[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onSelectChannel: (channel: Channel) => void;
  onOpenPlayer: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onOpenEPG: () => void;
  onOpenVODCategory?: (category: 'all' | 'movies' | 'series' | 'animes' | 'doramas') => void;
  onOpenKids?: () => void;
  onOpenAnime?: () => void;
}

interface HomeCategoryCard {
  id: 'tv' | 'movies' | 'series' | 'kids' | 'anime';
  title: string;
  subtitle: string;
  bgImage: string;
  iconImage: string;
  accentBarClass: string;
  focusRingClass: string;
  hoverBorderClass: string;
}

const HOME_CARDS: HomeCategoryCard[] = [
  {
    id: 'tv',
    title: 'TV',
    subtitle: 'CANAIS AO VIVO',
    bgImage: './assets/img/home/tv_fundo.png',
    iconImage: './assets/img/home/tv_icone.png',
    accentBarClass: 'bg-sky-400',
    focusRingClass: 'ring-2 ring-sky-400/80 border-sky-400/70',
    hoverBorderClass: 'hover:border-sky-400/60',
  },
  {
    id: 'movies',
    title: 'FILMES',
    subtitle: 'VASTO CATÁLOGO',
    bgImage: './assets/img/home/filmes_fundo.png',
    iconImage: './assets/img/home/filmes_icone.png',
    accentBarClass: 'bg-red-500',
    focusRingClass: 'ring-2 ring-red-400/80 border-red-400/70',
    hoverBorderClass: 'hover:border-red-400/60',
  },
  {
    id: 'series',
    title: 'SÉRIES',
    subtitle: 'TEMPORADAS COMPLETAS',
    bgImage: './assets/img/home/series_fundo.png',
    iconImage: './assets/img/home/series_icone.png',
    accentBarClass: 'bg-purple-500',
    focusRingClass: 'ring-2 ring-purple-400/80 border-purple-400/70',
    hoverBorderClass: 'hover:border-purple-400/60',
  },
  {
    id: 'kids',
    title: 'KIDS',
    subtitle: 'CONTEÚDO INFANTIL',
    bgImage: './assets/img/home/kids_fundo.png',
    iconImage: './assets/img/home/kids_icone.png',
    accentBarClass: 'bg-sky-400',
    focusRingClass: 'ring-2 ring-sky-400/80 border-sky-400/70',
    hoverBorderClass: 'hover:border-sky-400/60',
  },
  {
    id: 'anime',
    title: 'ANIME',
    subtitle: 'ANIMAÇÕES E ANIMES',
    bgImage: './assets/img/home/anime_fundo.png',
    iconImage: './assets/img/home/anime_icone.png',
    accentBarClass: 'bg-orange-500',
    focusRingClass: 'ring-2 ring-orange-400/80 border-orange-400/70',
    hoverBorderClass: 'hover:border-orange-400/60',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  channels = [],
  searchQuery = '',
  onClearSearch,
  onSelectChannel,
  onOpenPlayer,
  onSelectMedia,
  onOpenVODCategory,
  onOpenKids,
  onOpenAnime,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [dbContents, setDbContents] = useState(() => AdminService.getContents());

  // Keep local catalog synced in background for global search
  useEffect(() => {
    AdminService.fetchRemoteContents()
      .then((remote) => {
        if (remote && remote.length > 0) setDbContents(remote);
      })
      .catch(() => {});

    const handleUpdate = () => {
      setDbContents(AdminService.getContents());
    };
    window.addEventListener('mastertv_catalog_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_catalog_updated', handleUpdate);
  }, []);

  // Route handler for each of the 5 cards using existing real routes
  const handleCardSelect = useCallback(
    (cardId: HomeCategoryCard['id']) => {
      switch (cardId) {
        case 'tv':
          onOpenPlayer();
          break;
        case 'movies':
          onOpenVODCategory?.('movies');
          break;
        case 'series':
          onOpenVODCategory?.('series');
          break;
        case 'kids':
          if (onOpenKids) {
            onOpenKids();
          } else {
            window.location.hash = '#/kids';
          }
          break;
        case 'anime':
          if (onOpenAnime) {
            onOpenAnime();
          } else {
            window.location.hash = '#/anime';
          }
          break;
      }
    },
    [onOpenPlayer, onOpenVODCategory, onOpenKids, onOpenAnime]
  );

  // Keyboard navigation (Left / Right / Enter) when not typing inside an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (searchQuery.trim().length > 0) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % HOME_CARDS.length));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev <= 0 ? HOME_CARDS.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < HOME_CARDS.length) {
        e.preventDefault();
        handleCardSelect(HOME_CARDS[focusedIndex].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, handleCardSelect, searchQuery]);

  // Real search results when user types in header search bar
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { matchedChannels: [] as Channel[], matchedMedia: [] as MediaItem[] };

    const matchedChannels = channels
      .filter(
        (ch) =>
          (ch.name || '').toLowerCase().includes(q) ||
          (ch.category || '').toLowerCase().includes(q)
      )
      .slice(0, 12);

    const matchedMedia: MediaItem[] = dbContents
      .filter((c) => c && c.type !== 'channel')
      .filter((c) => {
        const titleMatch = String(c.title || '').toLowerCase().includes(q);
        const genresArr = Array.isArray(c.genres) ? c.genres : [String(c.genres || '')];
        const genreMatch = genresArr.some((g) => String(g).toLowerCase().includes(q));
        return titleMatch || genreMatch;
      })
      .slice(0, 24)
      .map((c) => ({
        id: String(c.id || Math.random()),
        title: String(c.title || 'Titulo'),
        tagline: c.tagline ? String(c.tagline) : undefined,
        type: (c.type as 'movie' | 'series' | 'anime' | 'dorama') || 'movie',
        year: Number(c.year) || 2026,
        rating: Number(c.rating) || 8.0,
        duration: String(c.duration || '1h 45m'),
        contentRating: c.contentRating ? String(c.contentRating) : '12',
        genres: Array.isArray(c.genres) ? c.genres.map(String) : ['Geral'],
        posterUrl: String(c.posterUrl || ''),
        backdropUrl: String(c.backdropUrl || c.posterUrl || ''),
        description: String(c.description || ''),
        streamUrl: String(c.streamUrl || ''),
        backupStreamUrl: c.backupStreamUrl ? String(c.backupStreamUrl) : undefined,
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

    return { matchedChannels, matchedMedia };
  }, [searchQuery, channels, dbContents]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="relative flex-1 w-full min-h-[calc(100dvh-84px)] bg-transparent flex flex-col justify-between overflow-hidden select-none">
      {/* Subtle Blue-Black Atmospheric Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 right-0 w-[65vw] h-[55vh] bg-gradient-to-bl from-[#151e34]/45 via-[#0b1120]/20 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-[45vw] h-[50vh] bg-gradient-to-tr from-[#0d182e]/35 to-transparent blur-3xl" />

        {/* Discreet Decorative Bottom Waves (matching reference composition) */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[210px] sm:h-[250px] lg:h-[280px]"
          viewBox="0 0 1920 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="homeWaveDark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0e1424" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#171f33" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#0a0e19" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="homeWaveAccent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="32%" stopColor="#94a3b8" stopOpacity="0.22" />
              <stop offset="58%" stopColor="#ef4444" stopOpacity="0.68" />
              <stop offset="76%" stopColor="#b91c1c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#060912" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="homeWaveFloor" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#090d18" stopOpacity="0.98" />
              <stop offset="55%" stopColor="#121826" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#070a12" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {/* Upper subtle wave */}
          <path
            d="M0,185 C340,120 640,260 1020,175 C1360,98 1640,155 1920,130 L1920,320 L0,320 Z"
            fill="url(#homeWaveDark)"
          />
          {/* Subtle crimson/silver ribbon line */}
          <path
            d="M0,210 C380,150 680,265 1060,182 C1390,110 1660,170 1920,148"
            fill="none"
            stroke="url(#homeWaveAccent)"
            strokeWidth="5"
          />
          {/* Foreground dark wave */}
          <path
            d="M0,228 C420,175 720,285 1110,202 C1440,132 1690,192 1920,172 L1920,320 L0,320 Z"
            fill="url(#homeWaveFloor)"
          />
        </svg>
      </div>

      {/* MAIN CONTENT AREA */}
      {isSearching ? (
        /* Global Search Results View */
        <div className="relative z-10 w-full max-w-[1640px] mx-auto px-6 sm:px-10 lg:px-14 py-6 flex-1 flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">
                Resultados para &quot;<span className="text-sky-400">{searchQuery}</span>&quot;
              </h2>
            </div>
            {onClearSearch && (
              <button
                onClick={onClearSearch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Voltar aos Cards</span>
              </button>
            )}
          </div>

          {searchResults.matchedChannels.length === 0 && searchResults.matchedMedia.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Nenhum canal, filme ou serie encontrado para &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="flex flex-col gap-8 pb-8">
              {searchResults.matchedChannels.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-sky-400" />
                    <span>Canais Ao Vivo ({searchResults.matchedChannels.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {searchResults.matchedChannels.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => onSelectChannel(ch)}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-sky-400/50 transition-all text-left cursor-pointer"
                      >
                        <img
                          src={ch.logo || './assets/img/icons/favicon.svg'}
                          alt={ch.name}
                          className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-sky-300">
                            {ch.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{ch.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.matchedMedia.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Filmes, Series e Animes ({searchResults.matchedMedia.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {searchResults.matchedMedia.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectMedia(item)}
                        className="group flex flex-col gap-2 text-left cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-sky-400/60 transition-all">
                          <img
                            src={item.posterUrl || './assets/img/icons/favicon.svg'}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-300">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 5 LARGE VERTICAL CATEGORY CARDS (Balanced Mobile 1+2x2, Tablet 3-col, Desktop 5-col) */
        <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 sm:px-8 lg:px-14 py-3 sm:py-4 pb-mobile-nav">
          <div className="w-full max-w-[1640px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 xl:gap-6">
            {HOME_CARDS.map((card, index) => {
              const isFocused = focusedIndex === index;
              const isMobileFeatured = index === 0;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardSelect(card.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onMouseLeave={() => setFocusedIndex(-1)}
                  onFocus={() => setFocusedIndex(index)}
                  className={`group relative w-full rounded-2xl overflow-hidden border bg-[#0b101d] cursor-pointer text-center flex transition-all duration-300 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.65)] hover:-translate-y-1.5 hover:scale-[1.02] focus:outline-none ${
                    isMobileFeatured
                      ? 'col-span-2 sm:col-span-1 h-[155px] sm:h-[320px] lg:h-[clamp(370px,58vh,540px)] flex-row sm:flex-col items-center sm:items-stretch justify-between'
                      : 'h-[195px] sm:h-[320px] lg:h-[clamp(370px,58vh,540px)] flex-col justify-between'
                  } ${
                    isFocused
                      ? `${card.focusRingClass} -translate-y-1.5 scale-[1.02] z-20`
                      : `border-white/15 ${card.hoverBorderClass}`
                  }`}
                >
                  {/* Layered Background Image */}
                  <img
                    src={card.bgImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />

                  {/* Soft Vignette for Text Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10 pointer-events-none" />

                  {/* Upper Illustration / Icon Area */}
                  <div
                    className={`relative z-10 flex items-center justify-center overflow-hidden ${
                      isMobileFeatured
                        ? 'w-[42%] sm:w-full h-full sm:flex-1 px-4 sm:pt-5 sm:pb-1'
                        : 'flex-1 w-full px-3 sm:px-4 pt-3 sm:pt-5 pb-1'
                    }`}
                  >
                    <img
                      src={card.iconImage}
                      alt={card.title}
                      className={`object-contain transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1 drop-shadow-[0_14px_24px_rgba(0,0,0,0.45)] ${
                        card.id === 'anime'
                          ? 'w-[86%] max-w-[235px] max-h-full'
                          : 'w-[76%] max-w-[205px] max-h-full'
                      }`}
                    />
                  </div>

                  {/* Lower Title, Accent Line & Subtitle */}
                  <div
                    className={`relative z-10 flex flex-col ${
                      isMobileFeatured
                        ? 'w-[58%] sm:w-full items-start sm:items-center text-left sm:text-center pr-5 sm:px-4 py-4 sm:pb-7 lg:pb-8 sm:pt-2'
                        : 'w-full items-center px-3 sm:px-4 pb-4 sm:pb-7 lg:pb-8 pt-1 sm:pt-2'
                    }`}
                  >
                    <h2 className="text-xl sm:text-3xl xl:text-[34px] font-black tracking-wide text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
                      {card.title}
                    </h2>
                    <span
                      className={`block w-10 sm:w-14 h-[3px] rounded-full my-2 sm:my-3 transition-all duration-300 group-hover:w-16 ${card.accentBarClass}`}
                    />
                    <p className="text-[10px] sm:text-[11px] xl:text-xs font-semibold tracking-[0.12em] sm:tracking-[0.14em] text-slate-200/90 uppercase leading-snug">
                      {card.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtle Bottom-Left Brand Signature (hidden on small mobile where BottomNav sits) */}
      <div className="hidden md:flex relative z-10 w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-14 pb-5 pt-1 items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 opacity-45">
          <img
            src="./assets/img/icons/logo.png"
            alt="MasterTV"
            className="w-7 h-7 object-contain grayscale brightness-125"
          />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-slate-300">MasterTV</span>
            <span className="text-[8px] font-semibold tracking-[0.22em] text-slate-400 uppercase mt-0.5">
              ULTRA HD TV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
