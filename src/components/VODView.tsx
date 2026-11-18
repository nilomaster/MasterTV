// MasterTV UniTV-Style Movie Billboard View (Photo 1 & Photo 2)
// Exact match to UniTV layout: Left 16:9 Hero + 4 Colored Buttons, Center Tall Poster, Right Tall Poster
// Fully responsive for Web, Android APK, TV Box and Smart TV with Remote Control D-Pad focus
// All comments in this file strictly follow ASCII rules

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Film,
  Play,
  Star,
  Calendar,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import type { MediaItem } from '../types/iptv';
import { AdminService } from '../services/adminService';

interface VODViewProps {
  onSelectMedia: (item: MediaItem) => void;
  searchQuery: string;
  initialFilter?: 'all' | 'movies' | 'series' | 'animes' | 'doramas';
}

export const VODView: React.FC<VODViewProps> = ({
  onSelectMedia,
  searchQuery = '',
  initialFilter = 'movies',
}) => {
  const [catalogRevision, setCatalogRevision] = useState<number>(0);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [selectedSubFilter, setSelectedSubFilter] = useState<'todos' | 'genero' | '2026' | 'cinema'>('todos');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  useEffect(() => {
    // Sincroniza catalogo remoto do MySQL ao entrar na tela de filmes
    AdminService.fetchRemoteContents().catch(() => {});
    const handleUpdate = () => setCatalogRevision((prev) => prev + 1);
    window.addEventListener('mastertv_catalog_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_catalog_updated', handleUpdate);
  }, []);

  // Carrega itens cadastrados no banco de dados
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

  // Fallback visual com posters compativeis caso banco de dados esteja vazio
  const fallbackMovies: MediaItem[] = useMemo(() => {
    return [
      {
        id: 'hero-1',
        title: 'Just Play Dead',
        tagline: 'Sobrevivencia no Paraiso Tropical',
        type: 'movie',
        year: 2026,
        rating: 9.2,
        duration: '1h 55m',
        genres: ['Acao', 'Suspense'],
        posterUrl: './assets/img/covers/VisionQuest.webp',
        backdropUrl: './assets/img/covers/VisionQuest.webp',
        description: 'Uma jornada eletrizante de sobrevivencia onde cada segundo conta.',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      },
      {
        id: 'hero-2',
        title: 'Nao Nos Rendemos',
        tagline: 'Resistencia e Coragem Sem Limites',
        type: 'movie',
        year: 2026,
        rating: 8.9,
        duration: '2h 10m',
        genres: ['Aventura', 'Guerra'],
        posterUrl: './assets/img/covers/DeathNoteAnime.webp',
        backdropUrl: './assets/img/covers/DeathNoteAnime.webp',
        description: 'Um grupo de sobreviventes enfrenta forcas implacaveis em territorio hostil.',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      },
      {
        id: 'hero-3',
        title: 'Boiuna Terror no Amazonas',
        tagline: 'O Maior Desafio e Sair com Vida',
        type: 'movie',
        year: 2026,
        rating: 8.7,
        duration: '1h 48m',
        genres: ['Terror', 'Misterio'],
        posterUrl: './assets/img/covers/HomenAranhaUmNovoDia.webp',
        backdropUrl: './assets/img/covers/HomenAranhaUmNovoDia.webp',
        description: 'Lendas ancestrais ganham vida nas profundezas da floresta amazonica.',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      },
    ];
  }, []);

  // Lista de filmes disponiveis (apenas filmes ou all)
  const movieList: MediaItem[] = useMemo(() => {
    let items = customMediaItems.filter((i) => {
      if (initialFilter === 'series') return i.type === 'series';
      if (initialFilter === 'animes') return i.type === 'anime';
      if (initialFilter === 'doramas') return i.type === 'dorama';
      return i.type === 'movie' || !i.type;
    });

    if (items.length === 0) {
      items = fallbackMovies;
    }

    // Sub-filtros estilo UniTV
    if (selectedSubFilter === '2026') {
      const f = items.filter((i) => i.year === 2026);
      if (f.length > 0) return f;
    } else if (selectedSubFilter === 'cinema') {
      const f = items.filter((i) => Number(i.rating || 0) >= 8.5);
      if (f.length > 0) return f;
    }

    return items;
  }, [customMediaItems, fallbackMovies, initialFilter, selectedSubFilter]);

  // Itens para o trio em destaque da UniTV (Left Hero + Center + Right)
  const currentHero = movieList[featuredIndex % movieList.length] || fallbackMovies[0];
  const currentPoster1 = movieList[(featuredIndex + 1) % movieList.length] || fallbackMovies[1];
  const currentPoster2 = movieList[(featuredIndex + 2) % movieList.length] || fallbackMovies[2];

  // Avanco automatico suave da vitrine a cada 8 segundos (estilo Smart TV)
  useEffect(() => {
    if (movieList.length <= 1) return;
    const interval = window.setInterval(() => {
      if (!isHoveredRef.current) {
        setFeaturedIndex((prev) => (prev + 1) % movieList.length);
      }
    }, 8000);
    return () => window.clearInterval(interval);
  }, [movieList.length]);

  const handleNext = useCallback(() => {
    setFeaturedIndex((prev) => (prev + 1) % movieList.length);
  }, [movieList.length]);

  const handlePrev = useCallback(() => {
    setFeaturedIndex((prev) => (prev - 1 + movieList.length) % movieList.length);
  }, [movieList.length]);

  // Se o usuario pesquisou algo na barra de pesquisa superior, exibe os resultados da busca
  const searchResults = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return [];
    return customMediaItems.filter((item) => {
      const titleMatch = String(item.title || '').toLowerCase().includes(q);
      const genreList = Array.isArray(item.genres)
        ? item.genres
        : typeof item.genres === 'string'
        ? [String(item.genres)]
        : [];
      const genreMatch = genreList.some((g) => String(g || '').toLowerCase().includes(q));
      return titleMatch || genreMatch;
    });
  }, [customMediaItems, searchQuery]);

  // Suporte a controle remoto D-Pad (0: Hero, 1-4: Botoes, 5: Poster 1, 6: Poster 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        if (e.key === 'ArrowRight') {
          setFocusedIndex((prev) => Math.min(prev + 1, 6));
        } else if (e.key === 'ArrowLeft') {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'ArrowDown') {
          if (focusedIndex === 0) setFocusedIndex(1);
        } else if (e.key === 'ArrowUp') {
          if (focusedIndex >= 1 && focusedIndex <= 4) setFocusedIndex(0);
        } else if (e.key === 'Enter') {
          if (focusedIndex === 0) onSelectMedia(currentHero);
          else if (focusedIndex === 1) setSelectedSubFilter('genero');
          else if (focusedIndex === 2) setSelectedSubFilter('2026');
          else if (focusedIndex === 3) setSelectedSubFilter('cinema');
          else if (focusedIndex === 4) handleNext();
          else if (focusedIndex === 5) onSelectMedia(currentPoster1);
          else if (focusedIndex === 6) onSelectMedia(currentPoster2);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, currentHero, currentPoster1, currentPoster2, onSelectMedia, handleNext]);

  // Caso esteja pesquisando, exibe a grade de busca
  if (searchQuery.trim().length > 0) {
    return (
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-5 flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Search className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">
            Resultados para &quot;<span className="text-cyan-400">{searchQuery}</span>&quot; ({searchResults.length})
          </h2>
        </div>

        {searchResults.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            Nenhum titulo corresponde aos termos pesquisados.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {searchResults.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectMedia(item)}
                className="group relative cursor-pointer flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1.5"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-cyan-400 transition-all">
                  <img
                    src={item.posterUrl || './assets/img/icons/favicon.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-400">{item.title}</h4>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // UNITV IDENTICAL CINEMA SHOWCASE (Photo 1)
  // Left (50%): 16:9 Featured Hero + 4 Colored Buttons in a single row
  // Center (25%): Full-height Tall Poster 1
  // Right (25%): Full-height Tall Poster 2
  return (
    <div
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-3 lg:py-5 flex flex-col justify-center animate-in fade-in duration-300 select-none min-h-[calc(100vh-100px)]"
    >
      {/* 3-Column UniTV Cinema Billboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5 items-stretch flex-1">
        {/* COLUMN 1 (50% width on Desktop): Left Hero Card + 4 Buttons */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-3 sm:gap-4 h-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]">
          {/* Top 16:9 Hero Movie Card */}
          <div
            onClick={() => onSelectMedia(currentHero)}
            className={`flex-1 relative rounded-3xl overflow-hidden bg-slate-950/80 border-2 transition-all duration-300 shadow-2xl group cursor-pointer flex flex-col justify-end p-5 sm:p-6 ${
              focusedIndex === 0
                ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.35)] scale-[1.01]'
                : 'border-white/10 hover:border-cyan-400/80'
            }`}
          >
            {/* Background Backdrop Image */}
            <img
              src={currentHero.backdropUrl || currentHero.posterUrl}
              alt={currentHero.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Cinematic Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />

            {/* Top Carousel Dots (UniTV Photo 1/2 Red Active Dot + White Dots) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              {Array.from({ length: Math.min(movieList.length, 5) }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeaturedIndex(i);
                  }}
                  className={`transition-all rounded-full ${
                    i === featuredIndex % Math.min(movieList.length, 5)
                      ? 'w-4 h-2 bg-red-600 rounded-full'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            {/* Manual Carousel Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              title="Filme Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-cyan-500 hover:text-slate-950 text-white flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              title="Proximo Filme"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-cyan-500 hover:text-slate-950 text-white flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Info overlay matching UniTV Photo 1 */}
            <div className="relative z-10 space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  LANCAMENTO EM DESTAQUE
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  {currentHero.year || 2026}
                </span>
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-300" />
                  {Number(currentHero.rating || 9.0).toFixed(1)}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight drop-shadow-lg line-clamp-1">
                {currentHero.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed drop-shadow">
                {currentHero.description || currentHero.tagline || 'Transmissao em alta definicao com som espacial e imagem cristalina.'}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <div className="px-5 py-2.5 rounded-xl bg-cyan-500 group-hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition-all">
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Assistir Agora</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 4 UniTV Color Action Buttons (Green, Red, Yellow, Cyan) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5 h-20 sm:h-24 shrink-0">
            {/* Button 1: Genero (Green) */}
            <button
              onClick={() => {
                setSelectedSubFilter((prev) => (prev === 'genero' ? 'todos' : 'genero'));
                handleNext();
              }}
              className={`rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 font-black text-xs sm:text-sm shadow-xl transition-all duration-200 cursor-pointer ${
                focusedIndex === 1
                  ? 'ring-2 ring-emerald-300 scale-[1.03]'
                  : 'hover:scale-[1.02]'
              } bg-gradient-to-tr from-emerald-700 via-emerald-600 to-green-500 text-white border border-emerald-400/30`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-wide">Gênero</span>
            </button>

            {/* Button 2: 2026 (Red) */}
            <button
              onClick={() => {
                setSelectedSubFilter((prev) => (prev === '2026' ? 'todos' : '2026'));
                handleNext();
              }}
              className={`rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 font-black text-xs sm:text-sm shadow-xl transition-all duration-200 cursor-pointer ${
                focusedIndex === 2
                  ? 'ring-2 ring-rose-300 scale-[1.03]'
                  : 'hover:scale-[1.02]'
              } bg-gradient-to-tr from-red-700 via-rose-600 to-red-500 text-white border border-rose-400/30`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-wide">2026</span>
            </button>

            {/* Button 3: No Cinema (Yellow / Gold) */}
            <button
              onClick={() => {
                setSelectedSubFilter((prev) => (prev === 'cinema' ? 'todos' : 'cinema'));
                handleNext();
              }}
              className={`rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 font-black text-xs sm:text-sm shadow-xl transition-all duration-200 cursor-pointer ${
                focusedIndex === 3
                  ? 'ring-2 ring-yellow-200 scale-[1.03]'
                  : 'hover:scale-[1.02]'
              } bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 border border-yellow-200/50`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/15 flex items-center justify-center backdrop-blur-sm">
                <Film className="w-4 h-4 text-slate-950" />
              </div>
              <span className="tracking-wide font-black">No Cinema</span>
            </button>

            {/* Button 4: Todos (Cyan MasterTV) */}
            <button
              onClick={() => {
                setSelectedSubFilter('todos');
                handleNext();
              }}
              className={`rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 font-black text-xs sm:text-sm shadow-xl transition-all duration-200 cursor-pointer ${
                focusedIndex === 4
                  ? 'ring-2 ring-cyan-200 scale-[1.03]'
                  : 'hover:scale-[1.02]'
              } bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-500 text-slate-950 border border-cyan-300/40`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/15 flex items-center justify-center backdrop-blur-sm">
                <Layers className="w-4 h-4 text-slate-950" />
              </div>
              <span className="tracking-wide font-black">Todos</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2 (25% width on Desktop): Center Tall Movie Poster (UniTV Photo 1/2) */}
        <div
          onClick={() => onSelectMedia(currentPoster1)}
          className={`lg:col-span-3 relative rounded-3xl overflow-hidden bg-slate-950/80 border-2 transition-all duration-300 shadow-2xl group cursor-pointer flex flex-col justify-end p-5 sm:p-6 min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] ${
            focusedIndex === 5
              ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.35)] scale-[1.01]'
              : 'border-white/10 hover:border-cyan-400/80'
          }`}
        >
          {/* Vertical Poster Cover */}
          <img
            src={currentPoster1.posterUrl || currentPoster1.backdropUrl}
            alt={currentPoster1.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Cinematic Gradient Mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Hover Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/50 transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-7 h-7 fill-slate-950 ml-1" />
            </div>
          </div>

          {/* Bottom Title Overlay */}
          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
              {currentPoster1.genres?.[0] || 'FILME RECOMENDADO'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-md line-clamp-2">
              {currentPoster1.title}
            </h3>
            <p className="text-[11px] text-slate-300 truncate">
              {currentPoster1.description || currentPoster1.tagline || 'Disponivel em alta definicao'}
            </p>
          </div>
        </div>

        {/* COLUMN 3 (25% width on Desktop): Right Tall Movie Poster (UniTV Photo 1/2) */}
        <div
          onClick={() => onSelectMedia(currentPoster2)}
          className={`lg:col-span-3 relative rounded-3xl overflow-hidden bg-slate-950/80 border-2 transition-all duration-300 shadow-2xl group cursor-pointer flex flex-col justify-end p-5 sm:p-6 min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] ${
            focusedIndex === 6
              ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.35)] scale-[1.01]'
              : 'border-white/10 hover:border-cyan-400/80'
          }`}
        >
          {/* Vertical Poster Cover */}
          <img
            src={currentPoster2.posterUrl || currentPoster2.backdropUrl}
            alt={currentPoster2.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Cinematic Gradient Mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Hover Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/50 transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-7 h-7 fill-slate-950 ml-1" />
            </div>
          </div>

          {/* Bottom Title Overlay */}
          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              {currentPoster2.genres?.[0] || 'SUPER ESTREIA'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-md line-clamp-2">
              {currentPoster2.title}
            </h3>
            <p className="text-[11px] text-slate-300 truncate">
              {currentPoster2.description || currentPoster2.tagline || 'Disponivel em alta definicao'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
