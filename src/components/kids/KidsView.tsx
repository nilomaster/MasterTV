// MasterTV UniTV-Style Kids Bento Mosaic View
// Exact 1:1 match to UniTV Kids interface (media_1794975753788_2dce4f2b.jpg)
// Layout: Left (Wallace & Gromit top + DBillions & Bluey bottom),
// Center (Mais, Dinos, Peppa stacked), Right (Coyote vs Acme top + A Ilha Esquecida bottom)
// Fully optimized for Web, Android APK, TV Box and D-Pad Remote Control
// All comments in this file strictly follow ASCII rules

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

interface KidsCardItem {
  id: string;
  title: string;
  category: string;
  image: string;
  tag?: string;
  streamUrl?: string;
}

const KIDS_ITEMS: KidsCardItem[] = [
  {
    id: 'kids-wallace-gromit',
    title: 'Wallace & Gromit: A Maldicao do Coelhomem',
    category: 'Filme Animacao',
    image: './assets/img/covers/kids_wallace_gromit.webp',
    tag: 'Destaque Kids',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'kids-dbillions',
    title: 'DBillions',
    category: 'Musica & Danca',
    image: './assets/img/covers/kids_dbillions.webp',
    tag: 'Sucesso',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'kids-bluey',
    title: 'Bluey',
    category: 'Serie Infantil',
    image: './assets/img/covers/kids_bluey.webp',
    tag: 'Top 1 Kids',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'kids-mais',
    title: 'Mais Desenhos',
    category: 'Explorar Mais',
    image: './assets/img/covers/kids_mais.webp',
    tag: 'Ver Todos',
  },
  {
    id: 'kids-dino',
    title: 'Cancoes de Dinossauro',
    category: 'Musicas Educativas',
    image: './assets/img/covers/kids_dinossauro.webp',
    tag: 'Educativo',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'kids-peppa',
    title: 'Peppa Pig',
    category: 'Desenho Animado',
    image: './assets/img/covers/kids_peppa.webp',
    tag: 'Favorito',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    id: 'kids-coyote',
    title: 'COYOTE vs. ACME',
    category: 'Cinema Kids',
    image: './assets/img/covers/kids_coyote.webp',
    tag: 'Lancamento',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  },
  {
    id: 'kids-ilha',
    title: 'A ILHA ESQUECIDA',
    category: 'Aventura & Misterio',
    image: './assets/img/covers/kids_ilha.webp',
    tag: 'Aventura',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
];

export const KidsView: React.FC = () => {
  const { playMediaStream, channels } = useApp();
  const { navigateTo } = useNavigation();
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Play kids content or find live kids channel as fallback
  const handleSelectCard = useCallback(
    (item: KidsCardItem) => {
      if (item.id === 'kids-mais') {
        navigateTo('vod', 'series');
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
        rating: 9.5,
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
            if (prev === 1 || prev === 2) return 0; // DBillions or Bluey -> Wallace
            if (prev === 4) return 3; // Dino -> Mais
            if (prev === 5) return 4; // Peppa -> Dino
            if (prev === 7) return 6; // Ilha -> Coyote
            return prev;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 0) return 1; // Wallace -> DBillions
            if (prev === 3) return 4; // Mais -> Dino
            if (prev === 4) return 5; // Dino -> Peppa
            if (prev === 6) return 7; // Coyote -> Ilha
            return prev;
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 2) return 1; // Bluey -> DBillions
            if (prev === 3 || prev === 4) return 0; // Mais or Dino -> Wallace
            if (prev === 5) return 2; // Peppa -> Bluey
            if (prev === 6) return 3; // Coyote -> Mais
            if (prev === 7) return 5; // Ilha -> Peppa
            return prev;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 0) return 3; // Wallace -> Mais
            if (prev === 1) return 2; // DBillions -> Bluey
            if (prev === 2) return 5; // Bluey -> Peppa
            if (prev === 3 || prev === 4) return 6; // Mais or Dino -> Coyote
            if (prev === 5) return 7; // Peppa -> Ilha
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
    <div className="relative w-full h-full flex flex-col justify-center items-center py-2 sm:py-3 select-none">
      {/* Background ambient lighting effects (UniTV dark red & cyan glow trails) */}
      <div className="pointer-events-none absolute -bottom-10 left-0 right-0 h-40 bg-gradient-to-t from-red-600/10 via-amber-500/5 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      {/* Main UniTV Kids Bento Mosaic Grid Container */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto h-[78vh] min-h-[520px] max-h-[820px] grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-3.5 p-2 sm:p-4">
        
        {/* SECTION 1 (LEFT COLUMN - ~38% width, spans 5 cols): Wallace & Gromit + DBillions & Bluey */}
        <div className="md:col-span-5 flex flex-col gap-3 sm:gap-3.5 h-full">
          {/* Card 0: Wallace & Gromit (Large Hero ~64% height) */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[0])}
            onMouseEnter={() => setFocusedIndex(0)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
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
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 sm:p-5">
              <div className="flex items-center gap-2">
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
            {/* Discrete Corner Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{KIDS_ITEMS[0].tag}</span>
            </div>
          </div>

          {/* Bottom Row of Section 1 (~36% height): DBillions & Bluey Side-by-Side */}
          <div className="h-[36%] grid grid-cols-2 gap-3 sm:gap-3.5">
            {/* Card 1: DBillions */}
            <div
              onClick={() => handleSelectCard(KIDS_ITEMS[1])}
              onMouseEnter={() => setFocusedIndex(1)}
              className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
                focusedIndex === 1
                  ? 'scale-[1.03] border-amber-400 shadow-[0_0_25px_rgba(255,210,0,0.45)] ring-2 ring-amber-400/50 z-20'
                  : 'border-white/10 hover:border-amber-400/60'
              }`}
            >
              <img
                src={KIDS_ITEMS[1].image}
                alt={KIDS_ITEMS[1].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-xs truncate">{KIDS_ITEMS[1].title}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Bluey */}
            <div
              onClick={() => handleSelectCard(KIDS_ITEMS[2])}
              onMouseEnter={() => setFocusedIndex(2)}
              className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
                focusedIndex === 2
                  ? 'scale-[1.03] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
                  : 'border-white/10 hover:border-cyan-400/60'
              }`}
            >
              <img
                src={KIDS_ITEMS[2].image}
                alt={KIDS_ITEMS[2].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span className="text-white font-bold text-xs truncate">{KIDS_ITEMS[2].title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 (MIDDLE COLUMN - ~21% width, spans 3 cols): Mais, Dino, Peppa stacked vertically */}
        <div className="md:col-span-3 flex flex-col gap-3 sm:gap-3.5 h-full">
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
            {/* Center "Mais" Translucent Pill Badge (Exactly as seen on UniTV) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-colors">
                Mais
              </div>
            </div>
          </div>

          {/* Card 4: Cancoes de Dinossauro */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[4])}
            onMouseEnter={() => setFocusedIndex(4)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 4
                ? 'scale-[1.03] border-rose-400 shadow-[0_0_25px_rgba(255,42,133,0.45)] ring-2 ring-rose-400/50 z-20'
                : 'border-white/10 hover:border-rose-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[4].image}
              alt={KIDS_ITEMS[4].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span className="text-white font-bold text-xs truncate">{KIDS_ITEMS[4].title}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Peppa Pig */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[5])}
            onMouseEnter={() => setFocusedIndex(5)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 5
                ? 'scale-[1.03] border-emerald-400 shadow-[0_0_25px_rgba(0,230,118,0.45)] ring-2 ring-emerald-400/50 z-20'
                : 'border-white/10 hover:border-emerald-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[5].image}
              alt={KIDS_ITEMS[5].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span className="text-white font-bold text-xs truncate">{KIDS_ITEMS[5].title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 (RIGHT COLUMN - ~41% width, spans 4 cols): Coyote vs Acme + A Ilha Esquecida */}
        <div className="md:col-span-4 flex flex-col gap-3 sm:gap-3.5 h-full">
          {/* Card 6: Coyote vs Acme (~50% height) */}
          <div
            onClick={() => handleSelectCard(KIDS_ITEMS[6])}
            onMouseEnter={() => setFocusedIndex(6)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
              focusedIndex === 6
                ? 'scale-[1.02] border-amber-400 shadow-[0_0_25px_rgba(255,210,0,0.45)] ring-2 ring-amber-400/50 z-20'
                : 'border-white/10 hover:border-amber-400/60'
            }`}
          >
            <img
              src={KIDS_ITEMS[6].image}
              alt={KIDS_ITEMS[6].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/40">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-white font-black text-sm drop-shadow-md">{KIDS_ITEMS[6].title}</p>
                  <p className="text-amber-300 font-bold text-xs">Assistir Agora</p>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/15 text-[10px] font-black text-amber-300 flex items-center gap-1 shadow-md">
              <span>{KIDS_ITEMS[6].tag}</span>
            </div>
          </div>

          {/* Card 7: A Ilha Esquecida (~50% height) */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
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
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
              <span>{KIDS_ITEMS[7].tag}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
