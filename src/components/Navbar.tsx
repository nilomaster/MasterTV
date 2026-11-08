// Mobile-first responsive navigation header and bottom mobile bar
// All comments in this file strictly follow ASCII rules

import React, { useState } from 'react';
import {
  Tv,
  Search,
  Home,
  Film,
  Tv2,
  Sparkles,
  Heart,
  Settings,
  Menu,
  X,
  User,
} from 'lucide-react';
import type { ClientSession } from '../types/admin';

interface NavbarProps {
  currentView: 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin';
  vodFilter?: 'all' | 'movies' | 'series' | 'animes' | 'doramas';
  setCurrentView: (view: 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin') => void;
  onNavigateCategory?: (view: 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin', category?: 'all' | 'movies' | 'series' | 'animes' | 'doramas') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettingsModal: () => void;
  favoritesCount: number;
  isPlayerControlsVisible?: boolean;
  onNavbarMouseEnter?: () => void;
  onNavbarMouseLeave?: () => void;
  clientSession?: ClientSession | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  vodFilter = 'all',
  setCurrentView,
  onNavigateCategory,
  searchQuery,
  setSearchQuery,
  onOpenSettingsModal,
  favoritesCount,
  isPlayerControlsVisible = true,
  onNavbarMouseEnter,
  onNavbarMouseLeave,
  clientSession,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);

  const handleNavClick = (
    view: 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios',
    category?: 'all' | 'movies' | 'series' | 'animes' | 'doramas'
  ) => {
    if (onNavigateCategory) {
      onNavigateCategory(view, category);
    } else {
      setCurrentView(view);
    }
    setMobileMenuOpen(false);
  };

  const isMoviesActive = currentView === 'vod' && (vodFilter === 'movies' || vodFilter === 'all');
  const isSeriesActive = currentView === 'vod' && vodFilter === 'series';
  const isAnimesActive = currentView === 'vod' && vodFilter === 'animes';

  return (
    <>
      {/* Top Header */}
      <header
        onMouseEnter={() => {
          if (currentView === 'player') {
            onNavbarMouseEnter?.();
          }
        }}
        onMouseLeave={() => {
          if (currentView === 'player') {
            onNavbarMouseLeave?.();
          }
        }}
        className={`z-40 w-full bg-[#0B0E14]/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ease-in-out ${currentView === 'player'
            ? `hidden md:block fixed top-0 left-0 right-0 ${isPlayerControlsVisible
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : '-translate-y-full opacity-0 pointer-events-none'
            }`
            : 'sticky top-0'
          }`}
      >
        <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 max-w-[1920px] mx-auto gap-2">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-fuchsia-600 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all duration-300">
              <div className="w-full h-full bg-[#0D1322] rounded-[10px] flex items-center justify-center">
                <Tv className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  MasterTV
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BETA
                </span>
              </div>
              <p className="text-[9px] text-slate-400 leading-none hidden sm:block">IPTV & EPG Player</p>
            </div>
          </div>

          {/* Desktop/Tablet Search Bar */}
          <div className="relative hidden lg:flex items-center flex-1 max-w-xs xl:max-w-md mx-2">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar canal, filme ou série..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Desktop Navigation Links (Visible on xl screens) */}
          <nav className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => handleNavClick('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${currentView === 'home'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Início</span>
            </button>

            <button
              onClick={() => handleNavClick('player')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${currentView === 'player'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Ao vivo</span>
            </button>

            <button
              onClick={() => handleNavClick('vod', 'movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isMoviesActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Filmes</span>
            </button>

            <button
              onClick={() => handleNavClick('vod', 'series')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isSeriesActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Tv2 className="w-3.5 h-3.5" />
              <span>Séries</span>
            </button>

            <button
              onClick={() => handleNavClick('vod', 'animes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isAnimesActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Animes</span>
            </button>

            <button
              onClick={() => handleNavClick('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${currentView === 'favorites'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Favoritos</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-300 hover:text-white lg:hidden transition-colors"
              title="Pesquisar"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Client Session Badge */}
            {clientSession && (
              <div
                onClick={onOpenSettingsModal}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-xs cursor-pointer transition-all shadow-sm"
                title="Sua conta MasterTV (Clique para gerenciar)"
              >
                <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-white text-[11px] leading-tight max-w-[110px] truncate">
                    {clientSession.customerName}
                  </span>
                  <span className="text-[9px] text-cyan-400 font-mono font-semibold uppercase leading-tight">
                    {clientSession.planDuration}
                  </span>
                </div>
              </div>
            )}

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              title="Configurações"
              className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-300 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mobile Menu Hamburger Button (Hidden on xl screens) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800/90 text-white xl:hidden border border-white/10 transition-colors"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Overlay */}
        {mobileSearchOpen && (
          <div className="px-3 pb-3 pt-1 border-t border-white/5 lg:hidden animate-in fade-in duration-150">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar canal, filme ou série..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs text-slate-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden px-4 py-4 bg-[#0B0E14]/98 border-t border-white/10 flex flex-col gap-2 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => handleNavClick('home')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentView === 'home'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              onClick={() => handleNavClick('player')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentView === 'player'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Tv className="w-4 h-4" />
              <span>Ao Vivo</span>
            </button>

            <button
              onClick={() => handleNavClick('vod', 'movies')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isMoviesActive
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Film className="w-4 h-4" />
              <span>Filmes</span>
            </button>

            <button
              onClick={() => handleNavClick('vod', 'series')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isSeriesActive
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Tv2 className="w-4 h-4" />
              <span>Séries</span>
            </button>

            <button
              onClick={() => handleNavClick('vod', 'animes')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isAnimesActive
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Animes</span>
            </button>

            <button
              onClick={() => handleNavClick('favorites')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentView === 'favorites'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4" />
                <span>Favoritos</span>
              </div>
              {favoritesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>
        )}
      </header>

      {/* MOBILE-FIRST BOTTOM APP BAR (Fixed at bottom for mobile phones & small tablets) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around sm:hidden transition-all duration-300 ease-in-out ${currentView === 'player' && !isPlayerControlsVisible
            ? 'translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 pointer-events-auto'
          }`}
      >
        <button
          onClick={() => handleNavClick('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors ${currentView === 'home' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Início</span>
        </button>

        <button
          onClick={() => handleNavClick('player')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors ${currentView === 'player' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Tv className="w-4 h-4" />
          <span className="text-[10px]">Ao Vivo</span>
        </button>

        <button
          onClick={() => handleNavClick('vod', 'movies')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${isMoviesActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Film className="w-4 h-4" />
          <span className="text-[10px]">Filmes</span>
        </button>

        <button
          onClick={() => handleNavClick('vod', 'series')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${isSeriesActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Tv2 className="w-4 h-4" />
          <span className="text-[10px]">Séries</span>
        </button>

        <button
          onClick={() => handleNavClick('vod', 'animes')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${isAnimesActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Animes</span>
        </button>

        <button
          onClick={() => handleNavClick('favorites')}
          className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors ${currentView === 'favorites' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Heart className="w-4 h-4" />
          <span className="text-[10px]">Favoritos</span>
          {favoritesCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-red-500"></span>
          )}
        </button>
      </div>
    </>
  );
};
