// MasterTV UniTV-Style Navigation Header & Android TV Interface
// Features UniTV tab system (TV, JOGOS, DESTAQUES, FILMES, SERIES, KIDS, ANIME, EXPLORAR)
// System circle action buttons (Search, Filter, History, Profile, Notification, Clock)
// Strictly ASCII comments only as per project guidelines

import React, { useState } from 'react';
import {
  Tv,
  Search,
  SlidersHorizontal,
  History,
  Bell,
  User,
  Settings,
  Menu,
  X,
  Heart,
  ScreenShare,
} from 'lucide-react';
import type { ClientSession } from '../types/admin';
import { UniTVClock } from './common/UniTVClock';
import {
  UniTVNotificationDrawer,
  type UniTVNotificationItem,
} from './common/UniTVNotificationDrawer';
import { UniTVProfileModal } from './auth/UniTVProfileModal';

interface NavbarProps {
  currentView: 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin' | 'settings';
  vodFilter?: 'all' | 'movies' | 'series' | 'animes' | 'doramas';
  setCurrentView: (view: 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin' | 'settings') => void;
  onNavigateCategory?: (view: 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin' | 'settings', category?: 'all' | 'movies' | 'series' | 'animes' | 'doramas') => void;
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
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchBarOpen, setSearchBarOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // System notifications state for UniTV notification drawer
  const [notifications, setNotifications] = useState<UniTVNotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Mensagem de atualizacao: MasterTV UniTV Style',
      message: 'Nova interface de Smart TV instalada com layout UniTV, mosaico e transmissao HLS.',
      date: 'Hoje',
      isUnread: true,
      type: 'update',
    },
    {
      id: 'notif-2',
      title: 'Servidores de Transmissao 100% Online',
      message: 'Todos os canais em FHD e HD com redundancia automatica e zero delay.',
      date: 'Ontem',
      isUnread: false,
      type: 'info',
    },
  ]);

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

  const isHomeActive = currentView === 'home';
  const isTVActive = currentView === 'player';
  const isMoviesActive = currentView === 'vod' && (vodFilter === 'movies' || vodFilter === 'all' || !vodFilter);
  const isSeriesActive = currentView === 'vod' && vodFilter === 'series';
  const isAnimesActive = currentView === 'vod' && vodFilter === 'animes';
  const isDoramasActive = currentView === 'vod' && vodFilter === 'doramas';

  const unreadNotifCount = notifications.filter((n) => n.isUnread).length;

  return (
    <>
      {/* Top Header Navigation - UniTV Style */}
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
        className={`z-40 w-full bg-[#070a10]/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ease-in-out ${
          currentView === 'player'
            ? `hidden md:block fixed top-0 left-0 right-0 ${
                isPlayerControlsVisible
                  ? 'translate-y-0 opacity-100 pointer-events-auto'
                  : '-translate-y-full opacity-0 pointer-events-none'
              }`
            : 'sticky top-0'
        }`}
      >
        <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3 max-w-[1920px] mx-auto gap-3">
          {/* LEFT: MasterTV Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
            title="MasterTV - Inicio"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#0b0e14] border border-cyan-500/40 p-1 shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300 flex items-center justify-center overflow-hidden">
              <img
                src="./assets/img/icons/logo.png"
                alt="MasterTV Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5 leading-none">
                MasterTV
              </span>
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest leading-none mt-1 hidden sm:block">
                Ultra HD TV
              </span>
            </div>
          </div>

          {/* CENTER: UniTV Navigation Tabs (TV, JOGOS, DESTAQUES, FILMES, SERIES, KIDS, ANIME, EXPLORAR) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* TV (Ao Vivo) */}
            <button
              onClick={() => handleNavClick('player')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isTVActive
                  ? 'border-2 border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              TV
            </button>

            {/* JOGOS (Esportes / Futebol) */}
            <button
              onClick={() => handleNavClick('player')}
              className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
            >
              JOGOS
            </button>

            {/* DESTAQUES (Home Mosaico - UniTV Hero) */}
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isHomeActive
                  ? 'border-2 border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              DESTAQUES
            </button>

            {/* FILMES */}
            <button
              onClick={() => handleNavClick('vod', 'movies')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isMoviesActive
                  ? 'border-2 border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              FILMES
            </button>

            {/* SERIES */}
            <button
              onClick={() => handleNavClick('vod', 'series')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isSeriesActive
                  ? 'border-2 border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              SÉRIES
            </button>

            {/* KIDS (Colorful UniTV Style Badge) */}
            <button
              onClick={() => handleNavClick('vod', 'doramas')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isDoramasActive
                  ? 'border-2 border-cyan-400 bg-cyan-500/15 shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-105'
                  : 'border border-transparent hover:bg-white/5'
              }`}
            >
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent font-black">
                KIDS
              </span>
            </button>

            {/* ANIME */}
            <button
              onClick={() => handleNavClick('vod', 'animes')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isAnimesActive
                  ? 'border-2 border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              ANIME
            </button>

            {/* EXPLORAR */}
            <button
              onClick={() => handleNavClick('vod', 'all')}
              className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
            >
              EXPLORAR
            </button>
          </nav>

          {/* RIGHT: UniTV Circular Action Buttons & Real-Time Clock */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Search Circle Button */}
            <button
              onClick={() => setSearchBarOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                searchBarOpen
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
              title="Pesquisar conteudos"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Filter Circle Button (UniTV Photo 1) */}
            <button
              onClick={() => handleNavClick('vod', 'all')}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center justify-center transition-all cursor-pointer hidden sm:flex"
              title="Filtro de Generos"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* History Circle Button (UniTV Photo 1) */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center justify-center transition-all cursor-pointer hidden sm:flex"
              title="Historico de reproducao"
            >
              <History className="w-4 h-4" />
            </button>

            {/* User Profile Circle Button with Online Status Dot (UniTV Photo 1 & 3) */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="relative w-9 h-9 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
              title="Central do Assinante & Perfil"
            >
              <User className="w-4 h-4" />
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#070a10]" />
            </button>

            {/* Notification Bell Circle with Unread Counter (UniTV Photo 1 & 5) */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
              title="Caixa de Mensagens"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Screen / TV Cast Indicator (UniTV Photo 1) */}
            <div
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-400 items-center justify-center hidden md:flex"
              title="Dispositivo Conectado: Android TV / TV Box"
            >
              <ScreenShare className="w-4 h-4" />
            </div>

            {/* Real-time Digital Clock (UniTV Photo 1) */}
            <div className="hidden sm:block border-l border-white/10 pl-2">
              <UniTVClock />
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-white/10 text-white lg:hidden flex items-center justify-center border border-white/10 cursor-pointer"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        {searchBarOpen && (
          <div className="px-4 py-2.5 border-t border-white/10 bg-[#0b0e14]/95 animate-in fade-in duration-200">
            <div className="max-w-2xl mx-auto relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="Pesquisar canais, filmes, series ou animes no MasterTV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#07090e] border border-cyan-500/40 rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-xs text-slate-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Dropdown Menu for Small Screens */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 py-4 bg-[#090d16]/98 border-t border-white/10 flex flex-col gap-2 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => handleNavClick('player')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>TV (Canais Ao Vivo)</span>
            </button>
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <span className="font-bold">DESTAQUES</span>
            </button>
            <button
              onClick={() => handleNavClick('vod', 'movies')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <span>FILMES</span>
            </button>
            <button
              onClick={() => handleNavClick('vod', 'series')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <span>SÉRIES</span>
            </button>
            <button
              onClick={() => handleNavClick('vod', 'doramas')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent font-black">
                KIDS
              </span>
            </button>
            <button
              onClick={() => handleNavClick('vod', 'animes')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <span>ANIME</span>
            </button>
            <button
              onClick={() => handleNavClick('favorites')}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-red-400" />
                <span>Favoritos</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold">
                {favoritesCount}
              </span>
            </button>
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10"
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </div>
        )}
      </header>

      {/* UniTV Notification Drawer Component (Photo 5) */}
      <UniTVNotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
      />

      {/* UniTV Profile & Account Modal Component (Photo 3) */}
      <UniTVProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        clientSession={clientSession || null}
        onLogout={onLogout || (() => {})}
        favoritesCount={favoritesCount}
      />
    </>
  );
};
