// MasterTV VOD Catalog View with UniTV-Style Movie Showcase (Photo 2)
// Features Hero Movie Carousel + 4 Colorful Quick Filter Buttons (Genero, 2026, No Cinema, Todos)
// Supports TV Box Remote Control / D-Pad focus with glowing cyan borders
// Strictly ASCII comments only as per project guidelines

import React, { useState, useMemo, useEffect } from 'react';
import {
  Film,
  Play,
  Star,
  Tv2,
  Sparkles,
  HeartHandshake,
  Calendar,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import type { MediaItem } from '../types/iptv';
import { AdminService } from '../services/adminService';
import { detectQualityFromUrl } from '../services/qualityDetector';

interface VODViewProps {
  onSelectMedia: (item: MediaItem) => void;
  searchQuery: string;
  initialFilter?: 'all' | 'movies' | 'series' | 'animes' | 'doramas';
}

export const VODView: React.FC<VODViewProps> = ({ onSelectMedia, searchQuery = '', initialFilter = 'all' }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'series' | 'animes' | 'doramas'>(initialFilter);
  const [catalogRevision, setCatalogRevision] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(48);
  const [selectedSubFilter, setSelectedSubFilter] = useState<'todos' | 'genero' | '2026' | 'cinema'>('todos');

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(48);
  }, [activeFilter, searchQuery, selectedSubFilter]);

  useEffect(() => {
    // Sync remote contents from MySQL API when browsing VOD catalog
    AdminService.fetchRemoteContents().catch(() => {});
    const handleUpdate = () => setCatalogRevision((prev) => prev + 1);
    window.addEventListener('mastertv_catalog_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_catalog_updated', handleUpdate);
  }, []);

  // Custom media items registered via Admin Panel
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

  // Only items synchronized from the database
  const allItems: MediaItem[] = useMemo(() => {
    return Array.isArray(customMediaItems) ? customMediaItems.filter(Boolean) : [];
  }, [customMediaItems]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts = { movies: 0, series: 0, animes: 0, doramas: 0 };
    for (const item of allItems) {
      if (!item) continue;
      if (item.type === 'movie') counts.movies++;
      else if (item.type === 'series') counts.series++;
      else if (item.type === 'anime') counts.animes++;
      else if (item.type === 'dorama') counts.doramas++;
    }
    return counts;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    return allItems.filter((item) => {
      if (!item) return false;
      const itemType = String(item.type || 'movie');
      const matchesFilter =
        activeFilter === 'movies' || activeFilter === 'all'
          ? itemType === 'movie'
          : activeFilter === 'series'
          ? itemType === 'series'
          : activeFilter === 'animes'
          ? itemType === 'anime'
          : itemType === 'dorama';

      if (!matchesFilter) return false;

      // UniTV Photo 2 Sub-Filters
      if (selectedSubFilter === '2026' && item.year !== 2026) return false;
      if (selectedSubFilter === 'cinema' && Number(item.rating || 0) < 8.5) return false;

      if (!q) return true;

      const titleMatch = String(item.title || '').toLowerCase().includes(q);
      const genreList = Array.isArray(item.genres)
        ? item.genres
        : typeof item.genres === 'string'
        ? [String(item.genres)]
        : [];
      const genreMatch = genreList.some((g) => String(g || '').toLowerCase().includes(q));

      return titleMatch || genreMatch;
    });
  }, [allItems, activeFilter, searchQuery, selectedSubFilter]);

  // Paginated/Lazy-loaded slice to prevent DOM thrashing
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // Fallback items for UniTV Photo 2 Hero Showcase
  const fallbackHero = useMemo(() => {
    return [
      {
        id: 'hero-1',
        title: 'Just Play Dead',
        tagline: 'Sobrevivencia no Paraiso Tropical',
        image: './assets/img/covers/VisionQuest.webp',
      },
      {
        id: 'hero-2',
        title: 'Nao Nos Rendemos',
        tagline: 'Resistencia e Coragem Sem Limites',
        image: './assets/img/covers/DeathNoteAnime.webp',
      },
      {
        id: 'hero-3',
        title: 'Boiuna Terror no Amazonas',
        tagline: 'O Maior Desafio e Sair com Vida',
        image: './assets/img/covers/HomenAranhaUmNovoDia.webp',
      },
    ];
  }, []);

  // Page title, icon and metadata based on active catalog page
  const pageMeta = useMemo(() => {
    switch (activeFilter) {
      case 'series':
        return {
          title: 'Catalogo Series',
          subtitle:
            filteredItems.length === 1
              ? '1 serie disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} series disponiveis com reproducao em alta definicao.`,
          icon: Tv2,
          badge: 'Series',
          badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        };
      case 'animes':
        return {
          title: 'Catalogo Animes',
          subtitle:
            filteredItems.length === 1
              ? '1 anime disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} animes disponiveis com reproducao em alta definicao.`,
          icon: Sparkles,
          badge: 'Animes',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'doramas':
        return {
          title: 'Catalogo Doramas',
          subtitle:
            filteredItems.length === 1
              ? '1 dorama disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} doramas disponiveis com reproducao em alta definicao.`,
          icon: HeartHandshake,
          badge: 'Doramas',
          badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'movies':
      case 'all':
      default:
        return {
          title: 'Catalogo Filmes',
          subtitle:
            filteredItems.length === 1
              ? '1 filme disponivel com reproducao em alta definicao.'
              : `${filteredItems.length.toLocaleString('pt-BR')} filmes disponiveis com reproducao em alta definicao.`,
          icon: Film,
          badge: 'Filmes',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
    }
  }, [activeFilter, filteredItems.length]);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-5 flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Category Navigation Pills (MasterTV Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveFilter('movies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'movies' || activeFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Filmes ({categoryCounts.movies.toLocaleString('pt-BR')})
        </button>

        <button
          onClick={() => setActiveFilter('series')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'series'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Tv2 className="w-3.5 h-3.5" />
          Series ({categoryCounts.series.toLocaleString('pt-BR')})
        </button>

        <button
          onClick={() => setActiveFilter('animes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'animes'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-black'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Animes ({categoryCounts.animes.toLocaleString('pt-BR')})
        </button>

        <button
          onClick={() => setActiveFilter('doramas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'doramas'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-black'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Doramas ({categoryCounts.doramas.toLocaleString('pt-BR')})
        </button>
      </div>

      {/* UNITV PHOTO 2 MOVIE SHOWCASE (Hero Carousel + 4 Quick Color Filters + 2 Tall Posters) */}
      {(activeFilter === 'movies' || activeFilter === 'all') && !searchQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* LEFT 6 COLS: Featured Carousel Banner + 4 UniTV Filter Buttons */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {/* 16:9 Featured Movie Banner Card with Dots */}
            <div
              onClick={() => {
                const target = filteredItems[0];
                if (target) onSelectMedia(target);
              }}
              className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/10 hover:border-cyan-400 group cursor-pointer transition-all duration-300 shadow-2xl"
            >
              <img
                src={filteredItems[0]?.backdropUrl || filteredItems[0]?.posterUrl || fallbackHero[0].image}
                alt={filteredItems[0]?.title || fallbackHero[0].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

              {/* Carousel Dots Top Right (UniTV Photo 2 style) */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
              </div>

              {/* Title & Tagline at Base */}
              <div className="absolute bottom-4 left-5 right-5 space-y-1">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  Lancamento em Destaque
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">
                  {filteredItems[0]?.title || fallbackHero[0].title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {filteredItems[0]?.description || fallbackHero[0].tagline}
                </p>
              </div>
            </div>

            {/* 4 UniTV Colorful Quick Filter Buttons (UniTV Photo 2 style) */}
            <div className="grid grid-cols-4 gap-2.5">
              {/* Button 1: Genero (Green) */}
              <button
                onClick={() => setSelectedSubFilter(selectedSubFilter === 'genero' ? 'todos' : 'genero')}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-lg transition-transform hover:scale-[1.03] cursor-pointer ${
                  selectedSubFilter === 'genero'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-300'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white hover:brightness-110'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Gênero</span>
              </button>

              {/* Button 2: 2026 / Lancamento (Red) */}
              <button
                onClick={() => setSelectedSubFilter(selectedSubFilter === '2026' ? 'todos' : '2026')}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-lg transition-transform hover:scale-[1.03] cursor-pointer ${
                  selectedSubFilter === '2026'
                    ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white ring-2 ring-red-300'
                    : 'bg-gradient-to-tr from-rose-600 to-red-700 text-white hover:brightness-110'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>2026</span>
              </button>

              {/* Button 3: No Cinema (Orange) */}
              <button
                onClick={() => setSelectedSubFilter(selectedSubFilter === 'cinema' ? 'todos' : 'cinema')}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-lg transition-transform hover:scale-[1.03] cursor-pointer ${
                  selectedSubFilter === 'cinema'
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white ring-2 ring-amber-300'
                    : 'bg-gradient-to-tr from-amber-600 to-orange-700 text-white hover:brightness-110'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>No Cinema</span>
              </button>

              {/* Button 4: Todos (Cyan MasterTV) */}
              <button
                onClick={() => setSelectedSubFilter('todos')}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-lg transition-transform hover:scale-[1.03] cursor-pointer ${
                  selectedSubFilter === 'todos'
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black ring-2 ring-cyan-300'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-700 text-white hover:brightness-110'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Todos</span>
              </button>
            </div>
          </div>

          {/* RIGHT 6 COLS: Two Tall Movie Posters (Nao Nos Rendemos & Boiuna style) */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {/* Tall Poster 1 */}
            <div
              onClick={() => {
                const target = filteredItems[1] || filteredItems[0];
                if (target) onSelectMedia(target);
              }}
              className="group relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/10 hover:border-cyan-400 cursor-pointer transition-all duration-300 shadow-2xl flex flex-col justify-end p-5"
            >
              <img
                src={filteredItems[1]?.posterUrl || fallbackHero[1].image}
                alt={filteredItems[1]?.title || fallbackHero[1].title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">
                  Alta Definicao
                </span>
                <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight drop-shadow-md">
                  {filteredItems[1]?.title || fallbackHero[1].title}
                </h4>
                <p className="text-[11px] text-slate-300 truncate">
                  {filteredItems[1]?.description || fallbackHero[1].tagline}
                </p>
              </div>
            </div>

            {/* Tall Poster 2 */}
            <div
              onClick={() => {
                const target = filteredItems[2] || filteredItems[0];
                if (target) onSelectMedia(target);
              }}
              className="group relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/10 hover:border-cyan-400 cursor-pointer transition-all duration-300 shadow-2xl flex flex-col justify-end p-5"
            >
              <img
                src={filteredItems[2]?.posterUrl || fallbackHero[2].image}
                alt={filteredItems[2]?.title || fallbackHero[2].title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Super Estreia
                </span>
                <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight drop-shadow-md">
                  {filteredItems[2]?.title || fallbackHero[2].title}
                </h4>
                <p className="text-[11px] text-slate-300 truncate">
                  {filteredItems[2]?.description || fallbackHero[2].tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Catalog Section Header */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white">
            {pageMeta.title}
          </h2>
          <p className="text-xs text-slate-400">{pageMeta.subtitle}</p>
        </div>
        <span className="text-xs font-mono font-bold text-cyan-400">
          {filteredItems.length.toLocaleString('pt-BR')} titulos
        </span>
      </div>

      {/* Empty State or Full Catalog Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <pageMeta.icon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum titulo encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery
              ? 'Nenhum resultado corresponde a sua pesquisa.'
              : `Nenhum conteudo cadastrado em ${pageMeta.title}. Adicione ou importe novos titulos pelo Painel Administrativo.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {displayedItems.map((item) => {
              const firstGenre = Array.isArray(item.genres) && item.genres.length > 0
                ? String(item.genres[0])
                : typeof item.genres === 'string'
                ? String(item.genres)
                : 'Geral';
              const displayRating = Number(item.rating || 0).toFixed(1);
              const primarySource = item.sources && item.sources.length > 0 ? item.sources[0] : null;
              const qualityInfo = detectQualityFromUrl(
                primarySource?.streamUrl || primarySource?.url || item.streamUrl,
                primarySource?.name || item.title,
                primarySource?.quality
              );

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className="group relative cursor-pointer flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1.5"
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all">
                    <img
                      src={item.posterUrl || './assets/img/icons/favicon.svg'}
                      alt={item.title || 'Capa'}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './assets/img/icons/favicon.svg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-md shadow-cyan-500/40">
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      </div>
                    </div>

                    {/* Quality Badge */}
                    <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded backdrop-blur-md text-[9px] font-mono font-bold border shadow-sm ${qualityInfo.badgeBg} ${qualityInfo.borderBg}`}>
                      {qualityInfo.short}
                    </div>

                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      {displayRating}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {item.year || 2026} · {firstGenre}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lazy Load Controls */}
          {visibleCount < filteredItems.length && (
            <div className="flex flex-col items-center justify-center gap-3 pt-6 pb-12">
              <p className="text-xs text-slate-400 font-medium">
                Exibindo <span className="text-white font-bold">{displayedItems.length}</span> de{' '}
                <span className="text-cyan-400 font-bold">{filteredItems.length.toLocaleString('pt-BR')}</span> titulos
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 48, filteredItems.length))}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-cyan-500/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  Carregar Mais Titulos (+48)
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
