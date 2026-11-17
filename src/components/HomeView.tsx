// MasterTV UniTV-Style Destaques Cinema Mosaic (Home View)
// Matches the exact UniTV 4-column mosaic layout: 3 tall posters + 1 stacked landscape column
// Supports TV Box Remote Control / D-Pad focus with glowing cyan borders
// Strictly ASCII comments only as per project guidelines

import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import type { Channel, MediaItem } from '../types/iptv';
import { AdminService } from '../services/adminService';

interface HomeViewProps {
  channels?: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onOpenPlayer: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onOpenEPG: () => void;
  onOpenVODCategory?: (category: 'all' | 'movies' | 'series' | 'animes' | 'doramas') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenPlayer,
  onSelectMedia,
}) => {
  const [dbContents, setDbContents] = useState(() => AdminService.getContents());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

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

  // Filter movies and series from database
  const movies = dbContents.filter((c) => c && c.type === 'movie');
  const series = dbContents.filter((c) => c && c.type === 'series');

  // Fallback featured items matching the UniTV Photo 1 visual vibe
  const fallbackMosaic = [
    {
      id: 'destaque-1',
      title: 'A Odisseia',
      subtitle: 'Guerra & Aventura Epica',
      image: './assets/img/covers/VisionQuest.webp',
      type: 'Filme',
      year: 2026,
      rating: 9.2,
      duration: '2h 15m',
    },
    {
      id: 'destaque-2',
      title: 'Resident Evil',
      subtitle: 'Sobrevivencia & Terror',
      image: './assets/img/covers/DeathNoteAnime.webp',
      type: 'Filme',
      year: 2026,
      rating: 8.8,
      duration: '1h 50m',
    },
    {
      id: 'destaque-3',
      title: 'Coracao Selvagem',
      subtitle: 'Acao & Adrenalina Pura',
      image: './assets/img/covers/HomenAranhaUmNovoDia.webp',
      type: 'Filme',
      year: 2026,
      rating: 9.0,
      duration: '2h 05m',
    },
    {
      id: 'destaque-4-top',
      title: 'Os Aneis de Poder',
      subtitle: 'A Segunda Era da Terra-media',
      image: './assets/img/covers/VisionQuest.webp',
      type: 'Serie',
      year: 2026,
      rating: 9.5,
      duration: '2 Temporadas',
    },
    {
      id: 'destaque-4-bottom',
      title: 'Cidade de Deus',
      subtitle: 'A Luta Pela Sobrevivencia',
      image: './assets/img/covers/HomenAranhaUmNovoDia.webp',
      type: 'Serie',
      year: 2026,
      rating: 9.4,
      duration: '1 Temporada',
    },
  ];

  // Resolve items for Mosaic: prioritize MySQL database items, fall back to default covers
  const item1 = movies[0]
    ? {
        id: String(movies[0].id),
        title: movies[0].title,
        subtitle: movies[0].tagline || 'Super Lancamento Exclusivo',
        image: movies[0].posterUrl || movies[0].backdropUrl || fallbackMosaic[0].image,
        type: 'Filme',
        year: movies[0].year || 2026,
        rating: movies[0].rating || 9.0,
        streamUrl: movies[0].streamUrl,
      }
    : fallbackMosaic[0];

  const item2 = movies[1]
    ? {
        id: String(movies[1].id),
        title: movies[1].title,
        subtitle: movies[1].tagline || 'Alta Definicao 4K',
        image: movies[1].posterUrl || movies[1].backdropUrl || fallbackMosaic[1].image,
        type: 'Filme',
        year: movies[1].year || 2026,
        rating: movies[1].rating || 8.8,
        streamUrl: movies[1].streamUrl,
      }
    : fallbackMosaic[1];

  const item3 = series[0]
    ? {
        id: String(series[0].id),
        title: series[0].title,
        subtitle: series[0].tagline || 'Serie Completa',
        image: series[0].posterUrl || series[0].backdropUrl || fallbackMosaic[2].image,
        type: 'Serie',
        year: series[0].year || 2026,
        rating: series[0].rating || 9.1,
        streamUrl: series[0].streamUrl,
      }
    : fallbackMosaic[2];

  const item4Top = movies[2]
    ? {
        id: String(movies[2].id),
        title: movies[2].title,
        subtitle: movies[2].tagline || 'Destaque do Cinema',
        image: movies[2].backdropUrl || movies[2].posterUrl || fallbackMosaic[3].image,
        type: 'Filme',
        year: movies[2].year || 2026,
        rating: movies[2].rating || 9.3,
        streamUrl: movies[2].streamUrl,
      }
    : fallbackMosaic[3];

  const item4Bottom = series[1]
    ? {
        id: String(series[1].id),
        title: series[1].title,
        subtitle: series[1].tagline || 'Temporadas Completas',
        image: series[1].backdropUrl || series[1].posterUrl || fallbackMosaic[4].image,
        type: 'Serie',
        year: series[1].year || 2026,
        rating: series[1].rating || 9.4,
        streamUrl: series[1].streamUrl,
      }
    : fallbackMosaic[4];

  // Remote D-Pad Navigation Listener for Android TV Boxes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        if (e.key === 'ArrowRight') {
          setFocusedIndex((prev) => Math.min(prev + 1, 4));
        } else if (e.key === 'ArrowLeft') {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'ArrowDown') {
          if (focusedIndex === 3) setFocusedIndex(4);
        } else if (e.key === 'ArrowUp') {
          if (focusedIndex === 4) setFocusedIndex(3);
        } else if (e.key === 'Enter') {
          const selected = [item1, item2, item3, item4Top, item4Bottom][focusedIndex];
          if (selected) {
            handlePlayItem(selected);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, item1, item2, item3, item4Top, item4Bottom]);

  const handlePlayItem = (item: any) => {
    if (item.streamUrl) {
      const mediaItem: MediaItem = {
        id: item.id,
        title: item.title,
        type: item.type === 'Serie' ? 'series' : 'movie',
        year: item.year || 2026,
        rating: item.rating || 9.0,
        duration: '2h',
        contentRating: '14',
        genres: ['Destaque'],
        posterUrl: item.image,
        backdropUrl: item.image,
        description: item.subtitle,
        streamUrl: item.streamUrl,
      };
      onSelectMedia(mediaItem);
    } else {
      onOpenPlayer();
    }
  };

  return (
    <div className="flex-1 w-full bg-[#07090e] flex flex-col justify-start p-3 sm:p-5 lg:p-6 space-y-5 animate-in fade-in duration-300">
      {/* UniTV CINEMA MOSAIC GRID (Photo 1) */}
      <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 min-h-[580px] lg:h-[calc(100vh-160px)]">
        {/* COLUMN 1: Tall Hero Card 1 (A Odisseia style) */}
        <div
          tabIndex={0}
          onClick={() => handlePlayItem(item1)}
          onMouseEnter={() => setFocusedIndex(0)}
          className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 select-none flex flex-col justify-end p-5 lg:p-6 shadow-2xl ${
            focusedIndex === 0
              ? 'border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_40px_rgba(0,240,255,0.45)] scale-[1.02] z-20'
              : 'border-white/10 hover:border-cyan-400/70 hover:shadow-[0_0_25px_rgba(0,240,255,0.3)]'
          }`}
        >
          {/* Full Artwork */}
          <img
            src={item1.image}
            alt={item1.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Cinematic Dark Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              Destaque 4K
            </span>
          </div>

          {/* Typography at Base */}
          <div className="relative z-10 space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              {item1.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-cyan-300 drop-shadow">
              {item1.subtitle}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Assistir Agora</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Tall Hero Card 2 (Resident Evil style) */}
        <div
          tabIndex={0}
          onClick={() => handlePlayItem(item2)}
          onMouseEnter={() => setFocusedIndex(1)}
          className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 select-none flex flex-col justify-end p-5 lg:p-6 shadow-2xl ${
            focusedIndex === 1
              ? 'border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_40px_rgba(0,240,255,0.45)] scale-[1.02] z-20'
              : 'border-white/10 hover:border-cyan-400/70 hover:shadow-[0_0_25px_rgba(0,240,255,0.3)]'
          }`}
        >
          <img
            src={item2.image}
            alt={item2.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/40 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              Top 10 Brasil
            </span>
          </div>

          <div className="relative z-10 space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              {item2.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-300 drop-shadow">
              {item2.subtitle}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs border border-white/20 backdrop-blur-md">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reproduzir</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Tall Hero Card 3 (Coracao Selvagem style) */}
        <div
          tabIndex={0}
          onClick={() => handlePlayItem(item3)}
          onMouseEnter={() => setFocusedIndex(2)}
          className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 select-none flex flex-col justify-end p-5 lg:p-6 shadow-2xl ${
            focusedIndex === 2
              ? 'border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_40px_rgba(0,240,255,0.45)] scale-[1.02] z-20'
              : 'border-white/10 hover:border-cyan-400/70 hover:shadow-[0_0_25px_rgba(0,240,255,0.3)]'
          }`}
        >
          <img
            src={item3.image}
            alt={item3.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              Nova Temporada
            </span>
          </div>

          <div className="relative z-10 space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              {item3.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-cyan-300 drop-shadow">
              {item3.subtitle}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs border border-white/20 backdrop-blur-md">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Episodios</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 4: Stacked Landscape Pair (Os Aneis de Poder & Cidade de Deus style) */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 h-full">
          {/* Top Landscape Card */}
          <div
            tabIndex={0}
            onClick={() => handlePlayItem(item4Top)}
            onMouseEnter={() => setFocusedIndex(3)}
            className={`flex-1 group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 select-none flex flex-col justify-end p-4 lg:p-5 shadow-xl ${
              focusedIndex === 3
                ? 'border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_35px_rgba(0,240,255,0.45)] scale-[1.02] z-20'
                : 'border-white/10 hover:border-cyan-400/70'
            }`}
          >
            <img
              src={item4Top.image}
              alt={item4Top.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                Exclusivo MasterTV
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">
                {item4Top.title}
              </h3>
              <p className="text-[11px] text-slate-300 truncate">{item4Top.subtitle}</p>
            </div>
          </div>

          {/* Bottom Landscape Card */}
          <div
            tabIndex={0}
            onClick={() => handlePlayItem(item4Bottom)}
            onMouseEnter={() => setFocusedIndex(4)}
            className={`flex-1 group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 select-none flex flex-col justify-end p-4 lg:p-5 shadow-xl ${
              focusedIndex === 4
                ? 'border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_35px_rgba(0,240,255,0.45)] scale-[1.02] z-20'
                : 'border-white/10 hover:border-cyan-400/70'
            }`}
          >
            <img
              src={item4Bottom.image}
              alt={item4Bottom.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                Original Remasterizado
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">
                {item4Bottom.title}
              </h3>
              <p className="text-[11px] text-slate-300 truncate">{item4Bottom.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
