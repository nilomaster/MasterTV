// Mobile Bottom Navigation Bar (Android Mobile & Small Touch Screens)
// Strictly hidden on Tablet/Desktop (md:hidden) to preserve Web Desktop and TV layouts
// Strictly ASCII comments only

import React, { useState } from 'react';
import {
  Home,
  Tv,
  Film,
  Clapperboard,
  LayoutGrid,
  Sparkles,
  Flame,
  Heart,
  Calendar,
  Settings,
  X,
} from 'lucide-react';
import type { ViewType, VODFilterType } from '../../context/NavigationContext';

interface MobileBottomNavProps {
  currentView: ViewType;
  vodFilter: VODFilterType;
  favoritesCount: number;
  onNavigate: (view: ViewType, filter?: VODFilterType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  vodFilter,
  favoritesCount,
  onNavigate,
}) => {
  const [moreOpen, setMoreOpen] = useState<boolean>(false);

  // Never render on fullscreen playback or admin panel
  if (currentView === 'vod-player' || currentView === 'admin') {
    return null;
  }

  const isHome = currentView === 'home';
  const isTV = currentView === 'player';
  const isMovies = currentView === 'vod' && (vodFilter === 'movies' || vodFilter === 'all' || !vodFilter);
  const isSeries = currentView === 'vod' && vodFilter === 'series';
  const isKids = currentView === 'kids';
  const isAnime = currentView === 'anime' || (currentView === 'vod' && vodFilter === 'animes');
  const isMoreActive = isKids || isAnime || currentView === 'favorites' || currentView === 'epg' || currentView === 'settings';

  const handleNav = (view: ViewType, filter?: VODFilterType) => {
    setMoreOpen(false);
    onNavigate(view, filter);
  };

  // Match page palette subtly on Kids and Anime
  const barThemeClass = isKids
    ? 'bg-[#064A8E]/96 border-white/25'
    : isAnime
    ? 'bg-[#14161B]/96 border-[#282B32]'
    : 'bg-[#060c1a]/96 border-white/10';

  const activeColorClass = isKids
    ? 'text-[#FFD93D]'
    : isAnime
    ? 'text-[#FF6400]'
    : 'text-sky-400';

  return (
    <>
      {/* Backdrop + More Drawer Sheet */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-[#0a1224] border-t border-white/15 px-5 pt-4 pb-safe shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Mais Opcoes MasterTV
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 text-slate-200 flex items-center justify-center"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-4">
              <button
                type="button"
                onClick={() => handleNav('kids')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  isKids
                    ? 'bg-[#168FE8]/25 border-[#FFD93D]/70 text-white'
                    : 'bg-white/[0.05] border-white/10 text-slate-200 active:bg-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#168FE8]/25 text-[#FFD93D] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-extrabold">KIDS</span>
                  <span className="block text-[10px] text-slate-400 truncate">Area Infantil</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('anime')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  isAnime
                    ? 'bg-[#FF6400]/20 border-[#FF6400]/70 text-white'
                    : 'bg-white/[0.05] border-white/10 text-slate-200 active:bg-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF6400]/20 text-[#FF6400] flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-extrabold">ANIME</span>
                  <span className="block text-[10px] text-slate-400 truncate">Catalogo Anime</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('favorites')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  currentView === 'favorites'
                    ? 'bg-red-500/20 border-red-400/60 text-white'
                    : 'bg-white/[0.05] border-white/10 text-slate-200 active:bg-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold">Favoritos</span>
                  <span className="block text-[10px] text-slate-400">{favoritesCount} salvos</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('epg')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  currentView === 'epg'
                    ? 'bg-sky-500/20 border-sky-400/60 text-white'
                    : 'bg-white/[0.05] border-white/10 text-slate-200 active:bg-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold">Guia EPG</span>
                  <span className="block text-[10px] text-slate-400 truncate">Programacao TV</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('settings')}
                className={`col-span-2 flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  currentView === 'settings'
                    ? 'bg-sky-500/20 border-sky-400/60 text-white'
                    : 'bg-white/[0.05] border-white/10 text-slate-200 active:bg-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 text-slate-200 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold">Configuracoes e Conta</span>
                  <span className="block text-[10px] text-slate-400">Ajustes do player, cache e aplicativo</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (Mobile Only) */}
      <nav
        aria-label="Navegacao principal mobile"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.55)] pb-safe ${barThemeClass}`}
      >
        <div className="grid grid-cols-5 items-center h-[60px] px-1">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] rounded-xl transition-colors ${
              isHome ? activeColorClass : 'text-slate-400 active:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none">Inicio</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('player')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] rounded-xl transition-colors ${
              isTV ? activeColorClass : 'text-slate-400 active:text-white'
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none">TV</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('vod', 'movies')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] rounded-xl transition-colors ${
              isMovies ? activeColorClass : 'text-slate-400 active:text-white'
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none">Filmes</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('vod', 'series')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] rounded-xl transition-colors ${
              isSeries ? activeColorClass : 'text-slate-400 active:text-white'
            }`}
          >
            <Clapperboard className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none">Series</span>
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] rounded-xl transition-colors ${
              moreOpen || isMoreActive ? activeColorClass : 'text-slate-400 active:text-white'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};
