// MasterTV UniTV-Style Kids Bento Showcase View
// Exact 1:1 match to UniTV Kids interface (media_1794979782484_0f6c5b62.jpg)
// Layout:
// - Left: Peanuts Movie (Hero top) + Galinha Pintadinha & DBillions (Bottom row)
// - Center: Mais (top), Animes (center), Oddbods (bottom)
// - Right: Lar, Snoopy (top), Evolution (bottom)
// Fully optimized for Web, Mobile Browsers, Android APK, TV Box and D-Pad Remote Control
// All comments in this file strictly follow ASCII rules

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export interface KidsCardItem {
  id: string;
  title: string;
  category: string;
  image: string;
  tag?: string;
  streamUrl?: string;
}

export const KIDS_ITEMS: KidsCardItem[] = [
  {
    id: 'kids-peanuts-movie',
    title: 'The Peanuts Movie',
    category: 'Filme Animacao',
    image: './assets/img/covers/kids_peanuts_movie.webp',
    tag: 'Destaque Kids',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'kids-galinha',
    title: 'Galinha Pintadinha',
    category: 'Desenho & Cancoes',
    image: './assets/img/covers/kids_galinha.webp',
    tag: 'Sucesso Infantil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'kids-dbillions',
    title: 'DBillions',
    category: 'Musica & Danca',
    image: './assets/img/covers/kids_dbillions.webp',
    tag: 'Educativo',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'kids-mais',
    title: 'Mais Desenhos',
    category: 'Explorar Catalogo',
    image: './assets/img/covers/kids_mais.webp',
    tag: 'Ver Todos',
  },
  {
    id: 'kids-animes',
    title: 'Animes Kids',
    category: 'Animes & Shonen',
    image: './assets/img/covers/kids_animes.webp',
    tag: 'Animes',
  },
  {
    id: 'kids-oddbods',
    title: 'Oddbods',
    category: 'Comedia Infantil',
    image: './assets/img/covers/kids_oddbods.webp',
    tag: 'Diversao',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'kids-snoopy-lar',
    title: 'Lar, Snoopy',
    category: 'Serie Animada',
    image: './assets/img/covers/kids_snoopy_lar.webp',
    tag: 'Especial',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    id: 'kids-evolution',
    title: 'Evolution',
    category: 'Aventura & Ciencia',
    image: './assets/img/covers/kids_evolution.webp',
    tag: 'Animacao 3D',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
];

export const KidsView: React.FC = () => {
  const { playMediaStream, channels } = useApp();
  const { navigateTo } = useNavigation();
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Handle card selection
  const handleSelectCard = useCallback(
    (item: KidsCardItem) => {
      // Navigation shortcuts
      if (item.id === 'kids-mais') {
        navigateTo('vod', 'series');
        return;
      }
      if (item.id === 'kids-animes') {
        navigateTo('anime');
        return;
      }

      // Try finding corresponding live kids channel if available
      const kidsLiveChannel = channels.find((c) => {
        const name = (c.name || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        return (
          cat.includes('infantil') ||
          cat.includes('desenho') ||
          cat.includes('kids') ||
          name.includes('cartoon') ||
          name.includes('gloob') ||
          name.includes('disney') ||
          name.includes('nick')
        );
      });

      const targetUrl = item.streamUrl || kidsLiveChannel?.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      playMediaStream(targetUrl, item.title, {
        id: item.id,
        title: item.title,
        type: 'movie',
        genres: ['Kids & Animacao'],
        rating: 9.6,
        year: 2026,
        posterUrl: item.image,
        backdropUrl: item.image,
        duration: '1h 30m',
        description: `${item.title} - Conteudo especial para toda a familia e criancas no MasterTV Kids.`,
        streamUrl: targetUrl,
      });
    },
    [channels, navigateTo, playMediaStream]
  );

  // D-Pad navigation map
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
          if (KIDS_ITEMS[focusedIndex]) {
            handleSelectCard(KIDS_ITEMS[focusedIndex]);
          }
          break;
        default:
          break;
      }
    },
    [focusedIndex, handleSelectCard]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative w-full flex flex-col justify-center items-center py-1 sm:py-2 select-none">
      {/* Background ambient lighting effects (UniTV red & warm gold glow trails) */}
      <div className="pointer-events-none absolute -bottom-10 left-0 right-0 h-44 bg-gradient-to-t from-red-600/15 via-red-950/10 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      {/* ========================================================================= */}
      {/* DESKTOP & TV BOX VIEW (Landscape / TV / Screen width >= 768px)             */}
      {/* Exact 1:1 UniTV 3-Column Bento Showcase matching screenshot                */}
      {/* ========================================================================= */}
      <div className="hidden md:flex w-full max-w-[1720px] mx-auto h-[calc(100dvh-5.5rem)] min-h-[500px] max-h-[820px] flex-row gap-3.5 p-2 sm:p-4">
        
        {/* COLUMN 1 (LEFT COLUMN - 42% width): Peanuts Hero top + Galinha & DBillions bottom */}
        <div className="w-[42%] flex flex-col gap-3.5 h-full">
          {/* Card 0: The Peanuts Movie (Hero Card, ~64% height) */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[0])}
            onMouseEnter={() => setFocusedIndex(0)}
            className={`group relative flex-[64] min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
              focusedIndex === 0
                ? 'scale-[1.02] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[0].image}
              alt={KIDS_ITEMS[0].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Carousel Dot Indicator at Bottom-Right (Exact UniTV style) */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm pointer-events-none">
              <span className="w-4 h-1.5 rounded-full bg-red-500 shadow-sm" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-black text-sm sm:text-base drop-shadow-md">
                    {KIDS_ITEMS[0].title}
                  </p>
                  <p className="text-cyan-300 font-bold text-xs">Assistir Agora</p>
                </div>
              </div>
            </div>
            {/* Corner Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{KIDS_ITEMS[0].tag}</span>
            </div>
          </div>

          {/* Bottom Row of Column 1 (~36% height): Galinha Pintadinha & DBillions Side-by-Side */}
          <div className="flex-[36] min-h-0 grid grid-cols-2 gap-3.5">
            {/* Card 1: Galinha Pintadinha */}
            <div
              onClick={() => handleSelectCard(KIDS_ITEMS[1])}
              onMouseEnter={() => setFocusedIndex(1)}
              className={`group relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
                focusedIndex === 1
                  ? 'scale-[1.03] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                  : 'border-white/10 hover:border-cyan-400/60'
              }`}
            >
              <img
                src={KIDS_ITEMS[1].image}
                alt={KIDS_ITEMS[1].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-xs truncate">{KIDS_ITEMS[1].title}</span>
                </div>
              </div>
            </div>

            {/* Card 2: DBillions */}
            <div
              onClick={() => handleSelectCard(KIDS_ITEMS[2])}
              onMouseEnter={() => setFocusedIndex(2)}
              className={`group relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
                focusedIndex === 2
                  ? 'scale-[1.03] border-amber-400 shadow-[0_0_25px_rgba(255,210,0,0.45)] ring-2 ring-amber-400/50 z-20'
                  : 'border-white/10 hover:border-amber-400/60'
              }`}
            >
              <img
                src={KIDS_ITEMS[2].image}
                alt={KIDS_ITEMS[2].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-xs truncate">{KIDS_ITEMS[2].title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (MIDDLE COLUMN - 23% width): Mais, Animes, Oddbods (3 stacked equal cards) */}
        <div className="w-[23%] flex flex-col gap-3.5 h-full">
          {/* Card 3: Mais (Explore More Kids) */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[3])}
            onMouseEnter={() => setFocusedIndex(3)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 3
                ? 'scale-[1.03] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[3].image}
              alt={KIDS_ITEMS[3].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Center "Mais" Translucent Pill Badge (Exact UniTV style) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-colors">
                Mais
              </div>
            </div>
          </div>

          {/* Card 4: Animes (Direct shortcut to Anime tab) */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[4])}
            onMouseEnter={() => setFocusedIndex(4)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 4
                ? 'scale-[1.03] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[4].image}
              alt={KIDS_ITEMS[4].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Center "Animes" Translucent Pill Badge (Exact UniTV style) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-colors">
                Animes
              </div>
            </div>
          </div>

          {/* Card 5: Oddbods */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[5])}
            onMouseEnter={() => setFocusedIndex(5)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 5
                ? 'scale-[1.03] border-amber-400 shadow-[0_0_25px_rgba(255,210,0,0.45)] ring-2 ring-amber-400/50 z-20'
                : 'border-white/10 hover:border-amber-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[5].image}
              alt={KIDS_ITEMS[5].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span className="text-white font-bold text-xs truncate">{KIDS_ITEMS[5].title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3 (RIGHT COLUMN - 35% width): Lar, Snoopy top + Evolution bottom */}
        <div className="w-[35%] flex flex-col gap-3.5 h-full">
          {/* Card 6: Lar, Snoopy (~50% height) */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[6])}
            onMouseEnter={() => setFocusedIndex(6)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
              focusedIndex === 6
                ? 'scale-[1.02] border-fuchsia-400 shadow-[0_0_25px_rgba(232,121,249,0.45)] ring-2 ring-fuchsia-400/50 z-20'
                : 'border-white/10 hover:border-fuchsia-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[6].image}
              alt={KIDS_ITEMS[6].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-black text-sm drop-shadow-md">{KIDS_ITEMS[6].title}</p>
                  <p className="text-fuchsia-300 font-bold text-xs">Assistir Agora</p>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-fuchsia-300 flex items-center gap-1 shadow-md">
              <span>{KIDS_ITEMS[6].tag}</span>
            </div>
          </div>

          {/* Card 7: Evolution (~50% height) */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[7])}
            onMouseEnter={() => setFocusedIndex(7)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
              focusedIndex === 7
                ? 'scale-[1.02] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                : 'border-white/10 hover:border-cyan-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[7].image}
              alt={KIDS_ITEMS[7].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/40">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-black text-sm drop-shadow-md">{KIDS_ITEMS[7].title}</p>
                  <p className="text-cyan-300 font-bold text-xs">Assistir Agora</p>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
              <span>{KIDS_ITEMS[7].tag}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE / PORTRAIT / SMALL SCREEN VIEW (Screen width < 768px)               */}
      {/* Fully responsive, natural aspect ratios, smooth touch scroll - zero bugs  */}
      {/* ========================================================================= */}
      <div className="flex md:hidden w-full flex-col gap-3.5 px-3 py-2 pb-16">
        
        {/* Card 0: The Peanuts Movie (Hero Card) */}
        <div
          onClick={() => handleSelectCard(KIDS_ITEMS[0])}
          className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-white/15 shadow-lg active:scale-95 transition-transform"
        >
          <img
            src={KIDS_ITEMS[0].image}
            alt={KIDS_ITEMS[0].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm pointer-events-none">
            <span className="w-3.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{KIDS_ITEMS[0].tag}</span>
          </div>
        </div>

        {/* Row 2: Galinha Pintadinha & DBillions (2 Columns) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Galinha */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[1])}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={KIDS_ITEMS[1].image}
              alt={KIDS_ITEMS[1].title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* DBillions */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[2])}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={KIDS_ITEMS[2].image}
              alt={KIDS_ITEMS[2].title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Row 3: Mais, Animes, Oddbods (3 Columns) */}
        <div className="grid grid-cols-3 gap-2">
          {/* Mais */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[3])}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={KIDS_ITEMS[3].image}
              alt={KIDS_ITEMS[3].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/20 text-white font-black text-[10px]">
                Mais
              </span>
            </div>
          </div>
          {/* Animes */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[4])}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={KIDS_ITEMS[4].image}
              alt={KIDS_ITEMS[4].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/20 text-white font-black text-[10px]">
                Animes
              </span>
            </div>
          </div>
          {/* Oddbods */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[5])}
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={KIDS_ITEMS[5].image}
              alt={KIDS_ITEMS[5].title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Row 4: Lar Snoopy & Evolution (2 Columns) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Lar Snoopy */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[6])}
            className="relative aspect-[16/11] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={KIDS_ITEMS[6].image}
              alt={KIDS_ITEMS[6].title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Evolution */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[7])}
            className="relative aspect-[16/11] rounded-xl overflow-hidden bg-slate-950 border border-white/15 shadow-md active:scale-95 transition-transform"
          >
            <img
              src={KIDS_ITEMS[7].image}
              alt={KIDS_ITEMS[7].title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
