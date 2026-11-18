// MasterTV UniTV-Style Kids Bento Showcase & Synchronized Cartoons Catalog
// Exact 1:1 match to UniTV Kids interface (media_1794979782484_0f6c5b62.jpg)
// Fully synchronized with real imported Desenhos, Kids Series, Movies & Live Channels from MySQL/M3U
// Strictly ASCII comments only

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Play, Sparkles, Search, Tv, Film, Clapperboard, ChevronDown, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';
import { AdminService } from '../../services/adminService';
import type { AdminContentItem } from '../../types/admin';
import type { MediaItem, Channel } from '../../types/iptv';

export interface KidsShowcaseSlot {
  id: string;
  defaultTitle: string;
  defaultCategory: string;
  image: string;
  defaultTag?: string;
  searchKeywords: string[];
  streamUrl?: string;
  mediaItem?: MediaItem;
}

const SHOWCASE_SLOTS: KidsShowcaseSlot[] = [
  {
    id: 'kids-peanuts-movie',
    defaultTitle: 'The Peanuts Movie',
    defaultCategory: 'Filme Animacao',
    image: './assets/img/covers/kids_peanuts_movie.webp',
    defaultTag: 'Destaque Kids',
    searchKeywords: ['peanuts', 'snoopy', 'charlie brown'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'kids-galinha',
    defaultTitle: 'Galinha Pintadinha',
    defaultCategory: 'Desenho & Cancoes',
    image: './assets/img/covers/kids_galinha.webp',
    defaultTag: 'Sucesso Infantil',
    searchKeywords: ['galinha pintadinha', 'galinha'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'kids-dbillions',
    defaultTitle: 'DBillions',
    defaultCategory: 'Musica & Danca',
    image: './assets/img/covers/kids_dbillions.webp',
    defaultTag: 'Educativo',
    searchKeywords: ['dbillions', 'd billions'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'kids-mais',
    defaultTitle: 'Mais Desenhos',
    defaultCategory: 'Explorar Catalogo',
    image: './assets/img/covers/kids_mais.webp',
    defaultTag: 'Ver Todos',
    searchKeywords: ['mais'],
  },
  {
    id: 'kids-animes',
    defaultTitle: 'Animes Kids',
    defaultCategory: 'Animes & Shonen',
    image: './assets/img/covers/kids_animes.webp',
    defaultTag: 'Animes',
    searchKeywords: ['anime'],
  },
  {
    id: 'kids-oddbods',
    defaultTitle: 'Oddbods',
    defaultCategory: 'Comedia Infantil',
    image: './assets/img/covers/kids_oddbods.webp',
    defaultTag: 'Diversao',
    searchKeywords: ['oddbods', 'odd bods'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'kids-snoopy-lar',
    defaultTitle: 'Lar, Snoopy',
    defaultCategory: 'Serie Animada',
    image: './assets/img/covers/kids_snoopy_lar.webp',
    defaultTag: 'Especial',
    searchKeywords: ['lar, snoopy', 'snoopy no espaco', 'snoopy'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    id: 'kids-evolution',
    defaultTitle: 'Evolution',
    defaultCategory: 'Aventura & Ciencia',
    image: './assets/img/covers/kids_evolution.webp',
    defaultTag: 'Animacao 3D',
    searchKeywords: ['evolution', 'evolucao'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
];

// Helper to test if an item is a cartoon or kids content
function isKidsContentItem(item: AdminContentItem | Channel): boolean {
  const title = (
    ('title' in item ? item.title : '') ||
    ('name' in item ? (item as any).name : '') ||
    ''
  ).toLowerCase();

  const category = (
    ('channelCategory' in item ? (item.channelCategory || '') : '') ||
    ('category' in item ? ((item as any).category || '') : '') ||
    ('groupTitle' in item ? ((item as any).groupTitle || '') : '') ||
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
    'tooncami',
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
    'naruto',
    'pokemon',
    'pokémon',
    'dragon ball',
  ];

  if (kidsKeywords.some((k) => category.includes(k))) return true;
  if (kidsKeywords.some((k) => genres.some((g) => g.includes(k)))) return true;
  if (kidsKeywords.some((k) => title.includes(k))) return true;

  return false;
}

// Convert AdminContentItem to MediaItem format
function toMediaItem(c: AdminContentItem): MediaItem {
  return {
    id: String(c.id || `custom-vod-${Math.random()}`),
    title: String(c.title || 'Titulo'),
    tagline: c.tagline ? String(c.tagline) : undefined,
    type: (c.type as 'movie' | 'series' | 'anime' | 'dorama') || 'movie',
    year: Number(c.year) || 2026,
    rating: Number(c.rating) || 8.0,
    duration: String(c.duration || '1h 30m'),
    contentRating: c.contentRating ? String(c.contentRating) : 'Livre',
    genres: Array.isArray(c.genres)
      ? c.genres.map(String).filter(Boolean)
      : typeof c.genres === 'string'
      ? String(c.genres).split(',').map((g) => g.trim()).filter(Boolean)
      : ['Kids & Animacao'],
    posterUrl: String(c.posterUrl || ''),
    backdropUrl: String(c.backdropUrl || c.posterUrl || ''),
    description: String(c.description || `${c.title} - Disponivel no catalogo MasterTV Kids.`),
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
  };
}

export const KidsView: React.FC = () => {
  const { playMediaStream, channels, setCurrentChannel, setSelectedMedia } = useApp();
  const { navigateTo } = useNavigation();
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [catalogRevision, setCatalogRevision] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'series' | 'movies' | 'live'>('all');
  const catalogRef = useRef<HTMLDivElement | null>(null);

  // Sync catalog from remote database on mount and listen to updates
  useEffect(() => {
    AdminService.fetchRemoteContents().catch(() => {});
    const handleUpdate = () => setCatalogRevision((prev) => prev + 1);
    window.addEventListener('mastertv_catalog_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_catalog_updated', handleUpdate);
  }, []);

  // Synchronize all contents and isolate kids items
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

    // Filter live channels for kids/desenhos categories
    const liveKids = (channels || []).filter((ch) => isKidsContentItem(ch));

    return {
      kidsMediaItems: mediaItems,
      kidsLiveChannels: liveKids,
    };
  }, [channels, catalogRevision]);

  // Match imported items to the 8 UniTV Bento showcase cards
  const matchedShowcaseItems = useMemo(() => {
    return SHOWCASE_SLOTS.map((slot, index) => {
      // 1. Try finding by matching keywords in title
      const foundByKeyword = kidsMediaItems.find((item) => {
        const itemTitle = (item.title || '').toLowerCase();
        return slot.searchKeywords.some((kw) => itemTitle.includes(kw));
      });

      if (foundByKeyword) {
        return {
          ...slot,
          title: foundByKeyword.title,
          category: foundByKeyword.type === 'series' ? 'Serie Animada' : 'Filme Infantil',
          tag: slot.defaultTag || (foundByKeyword.type === 'series' ? 'Serie' : 'Filme'),
          mediaItem: foundByKeyword,
          streamUrl: foundByKeyword.streamUrl || foundByKeyword.episodeList?.[0]?.streamUrl,
        };
      }

      // 2. If slot is Mais or Animes, keep their special shortcut action
      if (slot.id === 'kids-mais' || slot.id === 'kids-animes') {
        return {
          ...slot,
          title: slot.defaultTitle,
          category: slot.defaultCategory,
          tag: slot.defaultTag,
        };
      }

      // 3. Fallback to positional imported item if available
      const fallbackItem = kidsMediaItems[index];
      if (fallbackItem) {
        return {
          ...slot,
          title: fallbackItem.title,
          category: fallbackItem.type === 'series' ? 'Serie Animada' : 'Filme Infantil',
          tag: slot.defaultTag || 'Importado',
          mediaItem: fallbackItem,
          streamUrl: fallbackItem.streamUrl || fallbackItem.episodeList?.[0]?.streamUrl,
        };
      }

      // 4. Default slot representation
      return {
        ...slot,
        title: slot.defaultTitle,
        category: slot.defaultCategory,
        tag: slot.defaultTag,
      };
    });
  }, [kidsMediaItems]);

  // Filtered catalog list for the bottom section
  const filteredCatalog = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    let list = kidsMediaItems;

    if (activeTab === 'series') {
      list = list.filter((i) => i.type === 'series');
    } else if (activeTab === 'movies') {
      list = list.filter((i) => i.type === 'movie');
    }

    if (!q) return list;

    return list.filter((i) => {
      const matchTitle = (i.title || '').toLowerCase().includes(q);
      const matchGenre = (i.genres || []).some((g) => g.toLowerCase().includes(q));
      return matchTitle || matchGenre;
    });
  }, [kidsMediaItems, searchFilter, activeTab]);

  // Handle selecting any card (Bento card or Catalog card)
  const handleSelectMediaItem = useCallback(
    (item: MediaItem) => {
      // If series has episodes, open detail modal for episode selection
      if (item.type === 'series' && item.episodeList && item.episodeList.length > 0) {
        setSelectedMedia(item);
        return;
      }

      const stream = item.streamUrl || item.episodeList?.[0]?.streamUrl;
      if (stream) {
        playMediaStream(stream, item.title, item);
        navigateTo('vod-player');
      } else {
        setSelectedMedia(item);
      }
    },
    [navigateTo, playMediaStream, setSelectedMedia]
  );

  // Handle live channel selection
  const handleSelectChannel = useCallback(
    (ch: Channel) => {
      setCurrentChannel(ch);
      playMediaStream(ch.streamUrl, ch.name);
      navigateTo('player');
    },
    [navigateTo, playMediaStream, setCurrentChannel]
  );

  // Handle Bento card click
  const handleSelectBentoSlot = useCallback(
    (slotIndex: number) => {
      const slot = matchedShowcaseItems[slotIndex];
      if (!slot) return;

      // Special action: Mais (smooth scroll down to imported catalog)
      if (slot.id === 'kids-mais') {
        if (catalogRef.current) {
          catalogRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      // Special action: Animes (navigate to anime view)
      if (slot.id === 'kids-animes') {
        navigateTo('anime');
        return;
      }

      // If matched to an imported MediaItem
      if (slot.mediaItem) {
        handleSelectMediaItem(slot.mediaItem);
        return;
      }

      // If matched to a live kids channel fallback
      const fallbackChannel = kidsLiveChannels[0] || channels[0];
      const targetUrl = slot.streamUrl || fallbackChannel?.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

      if (fallbackChannel && !slot.streamUrl) {
        handleSelectChannel(fallbackChannel);
        return;
      }

      playMediaStream(targetUrl, slot.title, {
        id: slot.id,
        title: slot.title,
        type: 'movie',
        genres: ['Kids & Animacao'],
        rating: 9.6,
        year: 2026,
        posterUrl: slot.image,
        backdropUrl: slot.image,
        duration: '1h 30m',
        description: `${slot.title} - Conteudo especial para toda a familia e criancas no MasterTV Kids.`,
        streamUrl: targetUrl,
      });
      navigateTo('vod-player');
    },
    [channels, handleSelectChannel, handleSelectMediaItem, kidsLiveChannels, matchedShowcaseItems, navigateTo, playMediaStream]
  );

  // D-Pad remote control navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 1 || prev === 2) return 0; // Galinha or DBillions -> Peanuts
            if (prev === 4) return 3; // Animes -> Mais
            if (prev === 5) return 4; // Oddbods -> Animes
            if (prev === 7) return 6; // Evolution -> Snoopy Lar
            return prev;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 0) return 1; // Peanuts -> Galinha
            if (prev === 3) return 4; // Mais -> Animes
            if (prev === 4) return 5; // Animes -> Oddbods
            if (prev === 6) return 7; // Snoopy Lar -> Evolution
            if (prev === 1 || prev === 2 || prev === 5 || prev === 7) {
              if (catalogRef.current) {
                catalogRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }
            return prev;
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 2) return 1; // DBillions -> Galinha
            if (prev === 3 || prev === 4) return 0; // Mais or Animes -> Peanuts
            if (prev === 5) return 2; // Oddbods -> DBillions
            if (prev === 6) return 3; // Snoopy Lar -> Mais
            if (prev === 7) return 5; // Evolution -> Oddbods
            return prev;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 0) return 3; // Peanuts -> Mais
            if (prev === 1) return 2; // Galinha -> DBillions
            if (prev === 2) return 5; // DBillions -> Oddbods
            if (prev === 3 || prev === 4) return 6; // Mais or Animes -> Snoopy Lar
            if (prev === 5) return 7; // Oddbods -> Evolution
            return prev;
          });
          break;
        case 'Enter':
          e.preventDefault();
          handleSelectBentoSlot(focusedIndex);
          break;
        default:
          break;
      }
    },
    [focusedIndex, handleSelectBentoSlot]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const seriesCount = kidsMediaItems.filter((i) => i.type === 'series').length;
  const moviesCount = kidsMediaItems.filter((i) => i.type === 'movie').length;
  const liveCount = kidsLiveChannels.length;
  const totalCount = kidsMediaItems.length + liveCount;

  return (
    <div className="relative w-full flex flex-col justify-start items-center select-none pb-16">
      {/* Background ambient lighting effects (UniTV red & warm gold glow trails) */}
      <div className="pointer-events-none absolute -bottom-10 left-0 right-0 h-44 bg-gradient-to-t from-red-600/15 via-red-950/10 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      {/* ========================================================================= */}
      {/* DESKTOP & TV BOX VIEW (Landscape / TV / Screen width >= 768px)             */}
      {/* Exact 1:1 UniTV 3-Column Bento Showcase matching screenshot                */}
      {/* ========================================================================= */}
      <div className="hidden md:flex w-full max-w-[1720px] mx-auto h-[calc(100vh-6.2rem)] min-h-[500px] max-h-[820px] flex-row gap-3.5 p-2 sm:p-4 shrink-0">
        
        {/* COLUMN 1 (LEFT COLUMN - 42% width): Peanuts Hero top + Galinha & DBillions bottom */}
        <div className="w-[42%] flex flex-col gap-3.5 h-full">
          {/* Card 0: The Peanuts Movie (Hero Card, ~64% height) */}
          <div
            onClick={() => handleSelectBentoSlot(0)}
            onMouseEnter={() => setFocusedIndex(0)}
            className={`group relative flex-[64] min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
              focusedIndex === 0
                ? 'scale-[1.02] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={matchedShowcaseItems[0].image}
              alt={matchedShowcaseItems[0].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Carousel Dot Indicator at Bottom-Right */}
            <div className="absolute bottom-3.5 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm pointer-events-none z-10">
              <span className="w-4 h-1.5 rounded-full bg-red-500 shadow-sm" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-black text-sm sm:text-base drop-shadow-md">
                    {matchedShowcaseItems[0].title}
                  </p>
                  <p className="text-cyan-300 font-bold text-xs">Assistir Agora</p>
                </div>
              </div>
            </div>
            {/* Corner Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{matchedShowcaseItems[0].tag}</span>
            </div>
          </div>

          {/* Bottom Row of Column 1 (~36% height): Galinha Pintadinha & DBillions Side-by-Side */}
          <div className="flex-[36] min-h-0 grid grid-cols-2 gap-3.5">
            {/* Card 1: Galinha Pintadinha */}
            <div
              onClick={() => handleSelectBentoSlot(1)}
              onMouseEnter={() => setFocusedIndex(1)}
              className={`group relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
                focusedIndex === 1
                  ? 'scale-[1.03] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                  : 'border-white/10 hover:border-cyan-400/60'
              }`}
            >
              <img
                src={matchedShowcaseItems[1].image}
                alt={matchedShowcaseItems[1].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-xs truncate">{matchedShowcaseItems[1].title}</span>
                </div>
              </div>
            </div>

            {/* Card 2: DBillions */}
            <div
              onClick={() => handleSelectBentoSlot(2)}
              onMouseEnter={() => setFocusedIndex(2)}
              className={`group relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
                focusedIndex === 2
                  ? 'scale-[1.03] border-amber-400 shadow-[0_0_25px_rgba(255,210,0,0.45)] ring-2 ring-amber-400/50 z-20'
                  : 'border-white/10 hover:border-amber-400/60'
              }`}
            >
              <img
                src={matchedShowcaseItems[2].image}
                alt={matchedShowcaseItems[2].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-xs truncate">{matchedShowcaseItems[2].title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (MIDDLE COLUMN - 23% width): Mais, Animes, Oddbods (3 stacked equal cards) */}
        <div className="w-[23%] flex flex-col gap-3.5 h-full">
          {/* Card 3: Mais (Explore More Kids) */}
          <div
            onClick={() => handleSelectBentoSlot(3)}
            onMouseEnter={() => setFocusedIndex(3)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 3
                ? 'scale-[1.03] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={matchedShowcaseItems[3].image}
              alt={matchedShowcaseItems[3].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Center "Mais" Translucent Pill Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-colors flex items-center gap-1.5">
                <span>Mais</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 4: Animes (Direct shortcut to Anime tab) */}
          <div
            onClick={() => handleSelectBentoSlot(4)}
            onMouseEnter={() => setFocusedIndex(4)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 4
                ? 'scale-[1.03] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={matchedShowcaseItems[4].image}
              alt={matchedShowcaseItems[4].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Center "Animes" Translucent Pill Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-colors">
                Animes
              </div>
            </div>
          </div>

          {/* Card 5: Oddbods */}
          <div
            onClick={() => handleSelectBentoSlot(5)}
            onMouseEnter={() => setFocusedIndex(5)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 5
                ? 'scale-[1.03] border-amber-400 shadow-[0_0_25px_rgba(255,210,0,0.45)] ring-2 ring-amber-400/50 z-20'
                : 'border-white/10 hover:border-amber-400/60'
            }`}
          >
            <img
              src={matchedShowcaseItems[5].image}
              alt={matchedShowcaseItems[5].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span className="text-white font-bold text-xs truncate">{matchedShowcaseItems[5].title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3 (RIGHT COLUMN - 35% width): Lar, Snoopy top + Evolution bottom */}
        <div className="w-[35%] flex flex-col gap-3.5 h-full">
          {/* Card 6: Lar, Snoopy (~50% height) */}
          <div
            onClick={() => handleSelectBentoSlot(6)}
            onMouseEnter={() => setFocusedIndex(6)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
              focusedIndex === 6
                ? 'scale-[1.02] border-fuchsia-400 shadow-[0_0_25px_rgba(232,121,249,0.45)] ring-2 ring-fuchsia-400/50 z-20'
                : 'border-white/10 hover:border-fuchsia-400/60'
            }`}
          >
            <img
              src={matchedShowcaseItems[6].image}
              alt={matchedShowcaseItems[6].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-black text-sm drop-shadow-md">{matchedShowcaseItems[6].title}</p>
                  <p className="text-fuchsia-300 font-bold text-xs">Assistir Agora</p>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-fuchsia-300 flex items-center gap-1 shadow-md">
              <span>{matchedShowcaseItems[6].tag}</span>
            </div>
          </div>

          {/* Card 7: Evolution (~50% height) */}
          <div
            onClick={() => handleSelectBentoSlot(7)}
            onMouseEnter={() => setFocusedIndex(7)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
              focusedIndex === 7
                ? 'scale-[1.02] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={matchedShowcaseItems[7].image}
              alt={matchedShowcaseItems[7].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/40">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-black text-sm drop-shadow-md">{matchedShowcaseItems[7].title}</p>
                  <p className="text-cyan-300 font-bold text-xs">Assistir Agora</p>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
              <span>{matchedShowcaseItems[7].tag}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE / PORTRAIT / SMALL SCREEN VIEW (Screen width < 768px)               */}
      {/* ========================================================================= */}
      <div className="flex md:hidden w-full flex-col gap-3.5 px-3 py-2 pb-6">
        
        {/* Card 0: The Peanuts Movie (Hero Card) */}
        <div
          onClick={() => handleSelectBentoSlot(0)}
          className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-white/15 shadow-lg active:scale-95 transition-transform"
        >
          <img
            src={matchedShowcaseItems[0].image}
            alt={matchedShowcaseItems[0].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm pointer-events-none">
            <span className="w-3.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{matchedShowcaseItems[0].tag}</span>
          </div>
        </div>

        {/* Row 2: Galinha Pintadinha & DBillions (2 Columns) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => handleSelectBentoSlot(1)}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={matchedShowcaseItems[1].image}
              alt={matchedShowcaseItems[1].title}
              className="w-full h-full object-cover"
            />
          </div>
          <div
            onClick={() => handleSelectBentoSlot(2)}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={matchedShowcaseItems[2].image}
              alt={matchedShowcaseItems[2].title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Row 3: Mais, Animes, Oddbods (3 Columns) */}
        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => handleSelectBentoSlot(3)}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={matchedShowcaseItems[3].image}
              alt={matchedShowcaseItems[3].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/20 text-white font-black text-[10px]">
                Mais
              </span>
            </div>
          </div>
          <div
            onClick={() => handleSelectBentoSlot(4)}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={matchedShowcaseItems[4].image}
              alt={matchedShowcaseItems[4].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/20 text-white font-black text-[10px]">
                Animes
              </span>
            </div>
          </div>
          <div
            onClick={() => handleSelectBentoSlot(5)}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={matchedShowcaseItems[5].image}
              alt={matchedShowcaseItems[5].title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Row 4: Lar Snoopy & Evolution (2 Columns) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => handleSelectBentoSlot(6)}
            className="relative aspect-[16/11] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={matchedShowcaseItems[6].image}
              alt={matchedShowcaseItems[6].title}
              className="w-full h-full object-cover"
            />
          </div>
          <div
            onClick={() => handleSelectBentoSlot(7)}
            className="relative aspect-[16/11] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={matchedShowcaseItems[7].image}
              alt={matchedShowcaseItems[7].title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: CATALOGO SINCRONIZADO DE DESENHOS E CONTEUDO KIDS IMPORTADO      */}
      {/* ========================================================================= */}
      <div
        ref={catalogRef}
        className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col gap-6"
      >
        {/* Header with Title, Stats and Quick Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.7)]" />
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Catalogo de Desenhos &amp; Kids
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-bold text-xs">
                {totalCount} disponiveis
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">
              Sincronizado automaticamente com os desenhos, series e filmes infantis importados no seu servidor.
            </p>
          </div>

          {/* Search bar inside kids catalog */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar desenhos infantis..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos ({totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('series')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'series'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Desenhos &amp; Series ({seriesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'movies'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmes Infantis ({moviesCount})</span>
          </button>

          {liveCount > 0 && (
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'live'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Canais Ao Vivo ({liveCount})</span>
            </button>
          )}
        </div>

        {/* Content Grid */}
        {activeTab === 'live' ? (
          // Live Kids Channels Grid
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            {kidsLiveChannels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => handleSelectChannel(ch)}
                className="group relative cursor-pointer flex flex-col gap-2 p-2.5 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-cyan-400/80 transition-all hover:scale-105"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src={ch.logo || './assets/img/icons/favicon.svg'}
                    alt={ch.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './assets/img/icons/favicon.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs truncate group-hover:text-cyan-400 transition-colors">
                    {ch.name}
                  </span>
                  <span className="text-slate-400 text-[10px] truncate">
                    {ch.category || 'Canal Kids'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCatalog.length === 0 ? (
          // Empty State
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <Clapperboard className="w-12 h-12 text-slate-600" />
            <h3 className="text-white font-bold text-base sm:text-lg">
              {searchFilter
                ? `Nenhum desenho encontrado para "${searchFilter}"`
                : 'Nenhum desenho sincronizado no banco de dados'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md">
              {searchFilter
                ? 'Tente buscar com outro nome de desenho ou limpe a pesquisa.'
                : 'Importe sua lista M3U no Painel de Administracao para carregar centenas de desenhos, series e filmes infantis automaticamente.'}
            </p>
          </div>
        ) : (
          // Media Items Grid (Series & Movies)
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectMediaItem(item)}
                className="group relative cursor-pointer flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1.5"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-cyan-400/80 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all">
                  <img
                    src={item.posterUrl || './assets/img/icons/favicon.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './assets/img/icons/favicon.svg';
                    }}
                  />
                  {/* Subtle Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm border border-white/15 text-[10px] font-black text-cyan-300">
                    {item.type === 'series' ? 'Serie' : 'Filme'}
                  </div>
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{item.year || 2026}</span>
                    {item.episodeList && item.episodeList.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{item.episodeList.length} eps</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
