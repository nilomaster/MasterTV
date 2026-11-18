// MasterTV UniTV-Style Anime Billboard View
// Exact 1:1 match to UniTV Anime interface (media_1794976219378_10d1184c.jpg)
// Layout: 4 Columns (Demon Slayer, X-Men 97, Avatar Aang, Column 4 with Naruto top and One Piece bottom)
// Fully optimized for Web, Android APK, TV Box and D-Pad Remote Control
// All comments in this file strictly follow ASCII rules

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Flame, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AnimeCardItem {
  id: string;
  title: string;
  category: string;
  image: string;
  tag?: string;
  streamUrl?: string;
}

const ANIME_ITEMS: AnimeCardItem[] = [
  {
    id: 'anime-demon-slayer',
    title: 'Demon Slayer: Castelo Infinito',
    category: 'Shonen / Acao',
    image: './assets/img/covers/anime_demon_slayer.webp',
    tag: 'Top 1 Anime',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'anime-xmen97',
    title: "X-Men '97",
    category: 'Animacao / Herois',
    image: './assets/img/covers/anime_xmen97.webp',
    tag: 'Sucesso Global',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'anime-avatar',
    title: 'Avatar Aang: O Ultimo Mestre do Ar',
    category: 'Aventura / Fantasia',
    image: './assets/img/covers/anime_avatar.webp',
    tag: 'Dublado HD',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'anime-naruto',
    title: 'Naruto',
    category: 'Anime Classico',
    image: './assets/img/covers/anime_naruto.webp',
    tag: 'Classico',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'anime-one-piece',
    title: 'One Piece',
    category: 'Anime Epico',
    image: './assets/img/covers/anime_one_piece.webp',
    tag: 'Em Alta',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
];

export const AnimeView: React.FC = () => {
  const { playMediaStream, channels } = useApp();
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Play anime content
  const handleSelectCard = useCallback(
    (item: AnimeCardItem) => {
      // Look for anime channels or use high definition demo stream
      const animeChannel = channels.find((c) => {
        const name = (c.name || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        return cat.includes('anime') || name.includes('anime') || name.includes('crunchyroll');
      });

      const targetUrl = item.streamUrl || animeChannel?.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      playMediaStream(targetUrl, item.title, {
        id: item.id,
        title: item.title,
        type: 'anime',
        genres: ['Anime', 'Animacao Japonesa'],
        rating: 9.8,
        year: 2026,
        posterUrl: item.image,
        backdropUrl: item.image,
        duration: '24m por ep',
        description: `${item.title} em definicao Ultra HD no catalogo de Animes do MasterTV.`,
        streamUrl: targetUrl,
      });
    },
    [channels, playMediaStream]
  );

  // D-Pad remote control navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 4) return 3; // One Piece -> Naruto
            return prev;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 3) return 4; // Naruto -> One Piece
            return prev;
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 1) return 0;
            if (prev === 2) return 1;
            if (prev === 3 || prev === 4) return 2;
            return prev;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev === 0) return 1;
            if (prev === 1) return 2;
            if (prev === 2) return 3;
            return prev;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (ANIME_ITEMS[focusedIndex]) {
            handleSelectCard(ANIME_ITEMS[focusedIndex]);
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
      {/* Background ambient lighting effects (UniTV dark crimson red & gold trails) */}
      <div className="pointer-events-none absolute -bottom-10 left-0 right-0 h-44 bg-gradient-to-t from-red-600/15 via-red-950/10 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />

      {/* Main UniTV Anime 4-Column Showcase Grid */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto h-[78vh] min-h-[520px] max-h-[820px] grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-3.5 p-2 sm:p-4">
        
        {/* COLUMN 1: Demon Slayer: Castelo Infinito (Full Height Tall Poster) */}
        <div
          onClick={() => handleSelectCard(ANIME_ITEMS[0])}
          onMouseEnter={() => setFocusedIndex(0)}
          className={`group relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
            focusedIndex === 0
              ? 'scale-[1.02] border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.45)] ring-2 ring-red-500/50 z-20'
              : 'border-white/10 hover:border-red-500/60'
          }`}
        >
          <img
            src={ANIME_ITEMS[0].image}
            alt={ANIME_ITEMS[0].title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle Hover Gradient Overlay with Play Button */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/50">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div>
                <p className="text-white font-black text-sm sm:text-base drop-shadow-md">
                  {ANIME_ITEMS[0].title}
                </p>
                <p className="text-red-400 font-bold text-xs">Assistir Agora</p>
              </div>
            </div>
          </div>
          {/* Top Corner Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-red-400 flex items-center gap-1 shadow-md">
            <Flame className="w-3 h-3 text-red-500 fill-current" />
            <span>{ANIME_ITEMS[0].tag}</span>
          </div>
        </div>

        {/* COLUMN 2: X-Men '97 (Full Height Tall Poster) */}
        <div
          onClick={() => handleSelectCard(ANIME_ITEMS[1])}
          onMouseEnter={() => setFocusedIndex(1)}
          className={`group relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
            focusedIndex === 1
              ? 'scale-[1.02] border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.45)] ring-2 ring-amber-400/50 z-20'
              : 'border-white/10 hover:border-amber-400/60'
          }`}
        >
          <img
            src={ANIME_ITEMS[1].image}
            alt={ANIME_ITEMS[1].title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/50">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div>
                <p className="text-white font-black text-sm sm:text-base drop-shadow-md">
                  {ANIME_ITEMS[1].title}
                </p>
                <p className="text-amber-300 font-bold text-xs">Assistir Agora</p>
              </div>
            </div>
          </div>
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-amber-300 flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{ANIME_ITEMS[1].tag}</span>
          </div>
        </div>

        {/* COLUMN 3: Avatar Aang (Full Height Tall Poster) */}
        <div
          onClick={() => handleSelectCard(ANIME_ITEMS[2])}
          onMouseEnter={() => setFocusedIndex(2)}
          className={`group relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-xl ${
            focusedIndex === 2
              ? 'scale-[1.02] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-cyan-400/50 z-20'
              : 'border-white/10 hover:border-cyan-400/60'
          }`}
        >
          <img
            src={ANIME_ITEMS[2].image}
            alt={ANIME_ITEMS[2].title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/50">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div>
                <p className="text-white font-black text-sm sm:text-base drop-shadow-md">
                  {ANIME_ITEMS[2].title}
                </p>
                <p className="text-cyan-300 font-bold text-xs">Assistir Agora</p>
              </div>
            </div>
          </div>
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-md">
            <span>{ANIME_ITEMS[2].tag}</span>
          </div>
        </div>

        {/* COLUMN 4: Naruto (Top) + One Piece (Bottom) Stacked */}
        <div className="flex flex-col gap-3 sm:gap-3.5 h-full">
          {/* Card 3: Naruto (Top Card) */}
          <div
            onClick={() => handleSelectCard(ANIME_ITEMS[3])}
            onMouseEnter={() => setFocusedIndex(3)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 3
                ? 'scale-[1.03] border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.45)] ring-2 ring-orange-500/50 z-20'
                : 'border-white/10 hover:border-orange-500/60'
            }`}
          >
            <img
              src={ANIME_ITEMS[3].image}
              alt={ANIME_ITEMS[3].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* UniTV-style semi-transparent capsule pill title at the bottom */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white font-bold text-xs tracking-wide shadow-lg group-hover:bg-orange-500 group-hover:border-orange-400 transition-colors pointer-events-none">
              {ANIME_ITEMS[3].title}
            </div>
          </div>

          {/* Card 4: One Piece (Bottom Card) */}
          <div
            onClick={() => handleSelectCard(ANIME_ITEMS[4])}
            onMouseEnter={() => setFocusedIndex(4)}
            className={`group relative flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border transition-all duration-300 cursor-pointer shadow-lg ${
              focusedIndex === 4
                ? 'scale-[1.03] border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.45)] ring-2 ring-red-500/50 z-20'
                : 'border-white/10 hover:border-red-500/60'
            }`}
          >
            <img
              src={ANIME_ITEMS[4].image}
              alt={ANIME_ITEMS[4].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* UniTV-style semi-transparent capsule pill title at the bottom */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white font-bold text-xs tracking-wide shadow-lg group-hover:bg-red-500 group-hover:border-red-400 transition-colors pointer-events-none">
              {ANIME_ITEMS[4].title}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
