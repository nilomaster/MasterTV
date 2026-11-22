// MasterTV Navigation Header
// Clean premium minimal header on Home view (matching desktop reference design)
// Preserves full UniTV tab navigation on all internal pages
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
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import type { ClientSession } from '../types/admin';
import type { ViewType, VODFilterType } from '../context/NavigationContext';
import { UniTVClock } from './common/UniTVClock';
import {
  UniTVNotificationDrawer,
  type UniTVNotificationItem,
} from './common/UniTVNotificationDrawer';
import { UniTVProfileModal } from './auth/UniTVProfileModal';
import { useDeviceLayout } from '../hooks/useDeviceLayout';

interface NavbarProps {
  currentView: ViewType;
  vodFilter?: VODFilterType;
  setCurrentView: (view: ViewType) => void;
  onNavigateCategory?: (view: ViewType, category?: VODFilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettingsModal: () => void;
  favoritesCount: number;
  isPlayerControlsVisible?: boolean;
  onNavbarMouseEnter?: () => void;
  onNavbarMouseLeave?: () => void;
  clientSession?: ClientSession | null;
  onLogout?: () => void;
  isSyncingCatalog?: boolean;
  onSyncCatalog?: () => void;
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
  onNavbarMouseEnter,
  onNavbarMouseLeave,
  clientSession,
  onLogout,
  isSyncingCatalog = false,
  onSyncCatalog,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchBarOpen, setSearchBarOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const { isMobileLandscape, isTabletLandscape, useCompactLiveHeader } = useDeviceLayout();

  // System notifications state for notification drawer
  const [notifications, setNotifications] = useState<UniTVNotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Mensagem de atualizacao: MasterTV Desktop',
      message: 'Nova interface inicial instalada com navegacao rapida por cards e transmissao HLS.',
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
    view: ViewType,
    category?: VODFilterType
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
  const isKidsActive = currentView === 'kids';
  const isAnimeActive = currentView === 'anime' || (currentView === 'vod' && vodFilter === 'animes');

  const unreadNotifCount = notifications.filter((n) => n.isUnread).length;

  // Clean Desktop Home Header (No horizontal category bar, faithful to reference)
  if (isHomeActive) {
    return (
      <>
        <header className="z-40 w-full bg-transparent sticky top-0">
          <div className="flex items-center justify-between px-6 sm:px-10 lg:px-14 pt-5 pb-3 max-w-[1920px] mx-auto gap-4">
            {/* LEFT: Original MasterTV Logo + ULTRA HD TV */}
            <div
              onClick={() => {
                setSearchQuery('');
                handleNavClick('home');
              }}
              className="flex items-center gap-3.5 cursor-pointer group select-none shrink-0"
              title="MasterTV - Inicio"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden">
                <img
                  src="./assets/img/icons/logo.png"
                  alt="MasterTV Logo"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight leading-none flex items-center">
                  <span className="text-white">Master</span>
                  <span className="text-sky-400">TV</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.26em] leading-none mt-1.5">
                  ULTRA HD TV
                </span>
              </div>
            </div>

            {/* RIGHT: Clean Circular Actions (Sync, Search, Profile, Settings) + Divider + Clock & Date */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
              {onSyncCatalog && (
                <button
                  onClick={onSyncCatalog}
                  disabled={isSyncingCatalog}
                  className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                  title="Sincronizar catalogo"
                  aria-label="Sincronizar catalogo"
                >
                  <RefreshCw className={`w-[18px] h-[18px] ${isSyncingCatalog ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              )}

              <button
                onClick={() => setSearchBarOpen((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border ${
                  searchBarOpen || searchQuery
                    ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
                    : 'bg-white/[0.08] hover:bg-white/[0.15] border-white/10 text-slate-200'
                }`}
                title="Pesquisar conteudos"
                aria-label="Pesquisar conteudos"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Perfil do Usuario"
                aria-label="Perfil do Usuario"
              >
                <User className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={onOpenSettingsModal}
                className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Configuracoes"
                aria-label="Configuracoes"
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>

              <div className="hidden sm:block h-8 w-px bg-white/15 mx-1" />

              <div className="hidden sm:block">
                <UniTVClock showDate />
              </div>
            </div>
          </div>

          {/* Expandable Search Input Bar */}
          {searchBarOpen && (
            <div className="px-6 sm:px-10 lg:px-14 pb-3 animate-in fade-in duration-200">
              <div className="max-w-xl ml-auto relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-sky-400" />
                <input
                  type="text"
                  placeholder="Pesquisar canais, filmes, series ou animes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#0d1322]/95 border border-white/15 rounded-full pl-11 pr-10 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400/70 shadow-xl backdrop-blur-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* User Profile & Account Modal */}
        <UniTVProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          clientSession={clientSession || null}
          onLogout={onLogout || (() => {})}
          favoritesCount={favoritesCount}
        />
      </>
    );
  }

  // Dedicated Live TV Header (Adaptive Compact Mobile/Tablet Header + Desktop reference design)
  if (isTVActive) {
    // Hide header completely on Phone Landscape so video maximizes fullscreen
    if (isMobileLandscape) {
      return null;
    }

    return (
      <>
        {useCompactLiveHeader ? (
          /* Compact Mobile & Tablet Live TV Header (Vertical & Horizontal) */
          <header className="z-40 w-full bg-[#070D18]/98 backdrop-blur-xl border-b border-[#293A50]/70 relative shrink-0">
            <div className="flex items-center justify-between px-3 sm:px-5 py-2 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className="w-10 h-10 rounded-full bg-[#142136] active:bg-[#1e3150] border border-[#293A50] text-white flex items-center justify-center shrink-0 cursor-pointer"
                  aria-label="Voltar ao inicio"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-none truncate">
                    {isTabletLandscape ? 'MasterTV — TV AO VIVO' : 'TV AO VIVO'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onSyncCatalog && (
                  <button
                    type="button"
                    onClick={onSyncCatalog}
                    disabled={isSyncingCatalog}
                    className="w-10 h-10 rounded-full bg-[#142136] active:bg-[#1e3150] border border-[#293A50] text-slate-200 flex items-center justify-center cursor-pointer"
                    title="Sincronizar catalogo"
                    aria-label="Sincronizar catalogo"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingCatalog ? 'animate-spin text-[#00BFFF]' : ''}`} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('mastertv_focus_channel_search'))}
                  className="w-10 h-10 rounded-full bg-[#142136] active:bg-[#1e3150] border border-[#293A50] text-slate-200 flex items-center justify-center cursor-pointer"
                  aria-label="Buscar canal"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(true)}
                  className="relative w-10 h-10 rounded-full bg-[#142136] active:bg-[#1e3150] border border-[#293A50] text-slate-200 flex items-center justify-center cursor-pointer"
                  aria-label="Notificacoes"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => (isTabletLandscape ? onOpenSettingsModal() : setIsProfileOpen(true))}
                  className="w-10 h-10 rounded-full bg-[#008DFF]/20 active:bg-[#008DFF]/35 border border-[#00BFFF]/40 text-[#00BFFF] flex items-center justify-center cursor-pointer"
                  aria-label={isTabletLandscape ? 'Configuracoes' : 'Perfil do Usuario'}
                >
                  {isTabletLandscape ? <Settings className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </header>
        ) : (
          <header
            onMouseEnter={() => onNavbarMouseEnter?.()}
            onMouseLeave={() => onNavbarMouseLeave?.()}
            className="z-40 w-full bg-transparent relative shrink-0"
          >
          <div className="flex items-center justify-between px-5 lg:px-7 py-3 max-w-[1920px] mx-auto gap-4">
            {/* LEFT: MasterTV Logo (returns to Home) + Divider + Pure White TV AO VIVO Title */}
            <div className="flex items-center gap-5 min-w-0">
              <div
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
                title="Voltar para a Pagina Inicial"
              >
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img
                    src="./assets/img/icons/logo.png"
                    alt="MasterTV Logo"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight leading-none flex items-center">
                    <span className="text-white">Master</span>
                    <span className="text-sky-400">TV</span>
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.24em] leading-none mt-1">
                    ULTRA HD TV
                  </span>
                </div>
              </div>

              <div className="h-9 w-px bg-white/15 shrink-0" />

              <div className="flex flex-col min-w-0">
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-none">
                  TV AO VIVO
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1 truncate">
                  Assista aos seus canais favoritos em tempo real
                </p>
              </div>
            </div>

            {/* RIGHT: Sync, Search, Notifications, User Profile, Divider, Clock & Date */}
            <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
              {onSyncCatalog && (
                <button
                  onClick={onSyncCatalog}
                  disabled={isSyncingCatalog}
                  className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                  title="Sincronizar catalogo"
                  aria-label="Sincronizar catalogo"
                >
                  <RefreshCw className={`w-[18px] h-[18px] ${isSyncingCatalog ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              )}

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('mastertv_focus_channel_search'))}
                className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Buscar canal"
                aria-label="Buscar canal"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Notificacoes"
                aria-label="Notificacoes"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center shadow">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Perfil do Usuario"
                aria-label="Perfil do Usuario"
              >
                <User className="w-[18px] h-[18px]" />
              </button>

              <div className="h-8 w-px bg-white/15 mx-1" />

              <UniTVClock showDate />
            </div>
          </div>
          </header>
        )}

        {/* Notification Drawer Component */}
        <UniTVNotificationDrawer
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onClearAll={() => setNotifications([])}
        />

        {/* User Profile & Account Modal */}
        <UniTVProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          clientSession={clientSession || null}
          onLogout={onLogout || (() => {})}
          favoritesCount={favoritesCount}
        />
      </>
    );
  }

  // Dedicated Movies Header (Matching TV AO VIVO and Desktop reference, no horizontal category menu)
  if (isMoviesActive) {
    return (
      <>
        <header className="z-40 w-full bg-transparent relative shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-7 py-3 max-w-[1920px] mx-auto gap-4">
            {/* LEFT: MasterTV Logo (returns to Home) + Divider + Pure White FILMES Title */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div
                onClick={() => {
                  setSearchQuery('');
                  handleNavClick('home');
                }}
                className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
                title="Voltar para a Pagina Inicial"
              >
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img
                    src="./assets/img/icons/logo.png"
                    alt="MasterTV Logo"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight leading-none flex items-center">
                    <span className="text-white">Master</span>
                    <span className="text-sky-400">TV</span>
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.24em] leading-none mt-1 hidden sm:block">
                    ULTRA HD TV
                  </span>
                </div>
              </div>

              <div className="h-9 w-px bg-white/15 shrink-0" />

              <div className="flex flex-col min-w-0">
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-none">
                  FILMES
                </h1>
                <p className="text-xs text-[#AAB7C8] font-medium mt-1 truncate hidden sm:block">
                  Um catálogo completo com os melhores filmes
                </p>
              </div>
            </div>

            {/* RIGHT: Search, Notifications, User Profile, Divider, Clock & Date */}
            <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
              <button
                onClick={() => setSearchBarOpen((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                  searchBarOpen || searchQuery
                    ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
                    : 'bg-white/[0.08] hover:bg-white/[0.15] border-white/10 text-slate-200'
                }`}
                title="Pesquisar filmes"
                aria-label="Pesquisar filmes"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Notificacoes"
                aria-label="Notificacoes"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center shadow">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Perfil do Usuario"
                aria-label="Perfil do Usuario"
              >
                <User className="w-[18px] h-[18px]" />
              </button>

              <div className="hidden sm:block h-8 w-px bg-white/15 mx-1" />

              <div className="hidden sm:block">
                <UniTVClock showDate />
              </div>
            </div>
          </div>

          {/* Expandable Search Input Bar for Movies */}
          {searchBarOpen && (
            <div className="px-4 sm:px-6 lg:px-7 pb-3 animate-in fade-in duration-200">
              <div className="max-w-xl ml-auto relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-sky-400" />
                <input
                  type="text"
                  placeholder="Pesquisar filmes por titulo, genero ou ano..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#09182A]/95 border border-sky-400/35 rounded-full pl-11 pr-10 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 shadow-xl backdrop-blur-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Notification Drawer Component */}
        <UniTVNotificationDrawer
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onClearAll={() => setNotifications([])}
        />

        {/* User Profile & Account Modal */}
        <UniTVProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          clientSession={clientSession || null}
          onLogout={onLogout || (() => {})}
          favoritesCount={favoritesCount}
        />
      </>
    );
  }

  // Dedicated Series Header (Blue identity matching TV AO VIVO & Movies, no horizontal category menu)
  if (isSeriesActive) {
    return (
      <>
        <header className="z-40 w-full bg-transparent relative shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-7 py-3 max-w-[1920px] mx-auto gap-4">
            {/* LEFT: MasterTV Logo (returns to Home) + Divider + Pure White SERIES Title */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div
                onClick={() => {
                  setSearchQuery('');
                  handleNavClick('home');
                }}
                className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
                title="Voltar para a Pagina Inicial"
              >
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img
                    src="./assets/img/icons/logo.png"
                    alt="MasterTV Logo"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight leading-none flex items-center">
                    <span className="text-white">Master</span>
                    <span className="text-sky-400">TV</span>
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.24em] leading-none mt-1 hidden sm:block">
                    ULTRA HD TV
                  </span>
                </div>
              </div>

              <div className="h-9 w-px bg-white/15 shrink-0" />

              <div className="flex flex-col min-w-0">
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-none">
                  SÉRIES
                </h1>
                <p className="text-xs text-[#A9B8CC] font-medium mt-1 truncate hidden sm:block">
                  As melhores séries, com temporadas completas
                </p>
              </div>
            </div>

            {/* RIGHT: Search, Notifications, User Profile, Divider, Clock & Date */}
            <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
              <button
                onClick={() => setSearchBarOpen((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                  searchBarOpen || searchQuery
                    ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
                    : 'bg-white/[0.08] hover:bg-white/[0.15] border-white/10 text-slate-200'
                }`}
                title="Pesquisar series"
                aria-label="Pesquisar series"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Notificacoes"
                aria-label="Notificacoes"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center shadow">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Perfil do Usuario"
                aria-label="Perfil do Usuario"
              >
                <User className="w-[18px] h-[18px]" />
              </button>

              <div className="hidden sm:block h-8 w-px bg-white/15 mx-1" />

              <div className="hidden sm:block">
                <UniTVClock showDate />
              </div>
            </div>
          </div>

          {/* Expandable Search Input Bar for Series */}
          {searchBarOpen && (
            <div className="px-4 sm:px-6 lg:px-7 pb-3 animate-in fade-in duration-200">
              <div className="max-w-xl ml-auto relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-sky-400" />
                <input
                  type="text"
                  placeholder="Pesquisar series por titulo, genero ou ano..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#07182B]/95 border border-sky-400/35 rounded-full pl-11 pr-10 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 shadow-xl backdrop-blur-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Notification Drawer Component */}
        <UniTVNotificationDrawer
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onClearAll={() => setNotifications([])}
        />

        {/* User Profile & Account Modal */}
        <UniTVProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          clientSession={clientSession || null}
          onLogout={onLogout || (() => {})}
          favoritesCount={favoritesCount}
        />
      </>
    );
  }

  // Dedicated Kids Header (Cheerful blue bar, colorful KIDS letters, no TV icon beside title, no horizontal category menu)
  if (isKidsActive) {
    return (
      <>
        <header className="z-40 w-full bg-[#064A8E]/92 backdrop-blur-md border-b border-white/15 relative shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-7 py-3 max-w-[1920px] mx-auto gap-4">
            {/* LEFT: MasterTV Logo (returns to Home) + Divider + Colorful KIDS Title */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div
                onClick={() => {
                  setSearchQuery('');
                  handleNavClick('home');
                }}
                className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
                title="Voltar para a Pagina Inicial"
              >
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img
                    src="./assets/img/icons/logo.png"
                    alt="MasterTV Logo"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight leading-none flex items-center">
                    <span className="text-white">Master</span>
                    <span className="text-sky-300">TV</span>
                  </span>
                  <span className="text-[9px] font-semibold text-white/75 uppercase tracking-[0.24em] leading-none mt-1 hidden sm:block">
                    ULTRA HD TV
                  </span>
                </div>
              </div>

              <div className="h-9 w-px bg-white/25 shrink-0" />

              <div className="flex flex-col min-w-0">
                <h1 className="text-2xl lg:text-[26px] font-black tracking-wide leading-none flex items-center gap-0.5 drop-shadow-[0_2px_0_rgba(4,40,80,0.45)]">
                  <span className="text-[#FFD93D]">K</span>
                  <span className="text-[#FF70B5]">I</span>
                  <span className="text-[#5CC8FF]">D</span>
                  <span className="text-[#65C94A]">S</span>
                </h1>
                <p className="text-xs text-white/90 font-semibold mt-1 truncate hidden sm:block">
                  Diversão garantida para toda a criançada
                </p>
              </div>
            </div>

            {/* RIGHT: Search, Notifications, User Profile, Divider, Clock & Date */}
            <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
              <button
                onClick={() => setSearchBarOpen((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                  searchBarOpen || searchQuery
                    ? 'bg-[#FFD93D] border-white text-[#053363]'
                    : 'bg-[#04366B]/80 hover:bg-[#0857A8] border-white/25 text-white'
                }`}
                title="Pesquisar desenhos"
                aria-label="Pesquisar desenhos"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative w-10 h-10 rounded-full bg-[#04366B]/80 hover:bg-[#0857A8] border border-white/25 text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Notificacoes"
                aria-label="Notificacoes"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center shadow">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-[#0D74D1] hover:bg-[#168FE8] border border-white/35 text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Perfil do Usuario"
                aria-label="Perfil do Usuario"
              >
                <User className="w-[18px] h-[18px]" />
              </button>

              <div className="hidden sm:block h-8 w-px bg-white/25 mx-1" />

              <div className="hidden sm:block">
                <UniTVClock showDate />
              </div>
            </div>
          </div>

          {/* Expandable Search Input Bar for Kids */}
          {searchBarOpen && (
            <div className="px-4 sm:px-6 lg:px-7 pb-3 animate-in fade-in duration-200">
              <div className="max-w-xl ml-auto relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-[#053363]" />
                <input
                  type="text"
                  placeholder="Pesquisar desenhos, filmes ou series infantis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-white border-2 border-[#FFD93D] rounded-full pl-11 pr-10 py-2 text-sm text-[#053363] font-semibold placeholder-slate-500 focus:outline-none shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 text-slate-500 hover:text-[#053363] cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Notification Drawer Component */}
        <UniTVNotificationDrawer
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onClearAll={() => setNotifications([])}
        />

        {/* User Profile & Account Modal */}
        <UniTVProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          clientSession={clientSession || null}
          onLogout={onLogout || (() => {})}
          favoritesCount={favoritesCount}
        />
      </>
    );
  }

  // Dedicated Anime Header (Clean dark #14161B & #FF6400 orange accents, ZERO neon, NO icon beside Anime title)
  if (isAnimeActive) {
    return (
      <>
        <header className="z-40 w-full bg-[#14161B] border-b border-[#282B32] relative shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-7 py-3 max-w-[1920px] mx-auto gap-4">
            {/* LEFT: MasterTV Logo (returns to Home) + Divider + Pure White Anime Title (no icon) */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div
                onClick={() => {
                  setSearchQuery('');
                  handleNavClick('home');
                }}
                className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
                title="Voltar para a Pagina Inicial"
              >
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img
                    src="./assets/img/icons/logo.png"
                    alt="MasterTV Logo"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight leading-none flex items-center">
                    <span className="text-white">Master</span>
                    <span className="text-[#FF6400]">TV</span>
                  </span>
                  <span className="text-[9px] font-semibold text-[#B8BBC5] uppercase tracking-[0.24em] leading-none mt-1 hidden sm:block">
                    ULTRA HD TV
                  </span>
                </div>
              </div>

              <div className="h-9 w-px bg-[#282B32] shrink-0" />

              <div className="flex flex-col min-w-0">
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-none">
                  Anime
                </h1>
                <p className="text-xs text-[#B8BBC5] font-medium mt-1 truncate hidden sm:block">
                  O melhor do mundo dos animes em um só lugar
                </p>
              </div>
            </div>

            {/* RIGHT: Search, Notifications, User Profile, Divider, Clock & Date */}
            <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
              <button
                onClick={() => setSearchBarOpen((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-150 cursor-pointer ${
                  searchBarOpen || searchQuery
                    ? 'bg-[#FF6400] border-[#FF6400] text-white'
                    : 'bg-[#202229] hover:bg-[#30333B] border-[#30333B] text-white'
                }`}
                title="Pesquisar animes"
                aria-label="Pesquisar animes"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative w-10 h-10 rounded-full bg-[#202229] hover:bg-[#30333B] border border-[#30333B] text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
                title="Notificacoes"
                aria-label="Notificacoes"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6400]" />
                )}
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-[#202229] hover:bg-[#30333B] border border-[#30333B] text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
                title="Perfil do Usuario"
                aria-label="Perfil do Usuario"
              >
                <User className="w-[18px] h-[18px]" />
              </button>

              <div className="hidden sm:block h-8 w-px bg-[#282B32] mx-1" />

              <div className="hidden sm:block">
                <UniTVClock showDate />
              </div>
            </div>
          </div>

          {/* Expandable Search Input Bar for Anime */}
          {searchBarOpen && (
            <div className="px-4 sm:px-6 lg:px-7 pb-3">
              <div className="max-w-xl ml-auto relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-[#FF6400]" />
                <input
                  type="text"
                  placeholder="Pesquisar animes por titulo, genero ou ano..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#17191F] border border-[#30333B] rounded-[10px] pl-11 pr-10 py-2.5 text-sm text-white placeholder-[#B8BBC5] focus:outline-none focus:border-[#FF6400]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 text-[#B8BBC5] hover:text-white cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Notification Drawer Component */}
        <UniTVNotificationDrawer
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onClearAll={() => setNotifications([])}
        />

        {/* User Profile & Account Modal */}
        <UniTVProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          clientSession={clientSession || null}
          onLogout={onLogout || (() => {})}
          favoritesCount={favoritesCount}
        />
      </>
    );
  }

  return (
    <>
      {/* Top Header Navigation - Internal Pages (Preserved) */}
      <header
        className="z-40 w-full bg-[#070a10]/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ease-in-out sticky top-0"
      >
        <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3 max-w-[1920px] mx-auto gap-3">
          {/* LEFT: MasterTV Logo (Click returns to Home) */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
            title="MasterTV - Voltar ao Inicio"
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

          {/* CENTER: Internal Pages Navigation Tabs */}
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

            {/* INICIO */}
            <button
              onClick={() => handleNavClick('home')}
              className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
            >
              INICIO
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

            {/* KIDS */}
            <button
              onClick={() => handleNavClick('kids')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isKidsActive
                  ? 'border-2 border-cyan-400 bg-cyan-500/15 shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-105'
                  : 'border border-transparent hover:bg-white/5'
              }`}
            >
              <span className="font-black text-xs sm:text-sm tracking-widest inline-flex items-center gap-0.5">
                <span className="text-[#FF2A85]">K</span>
                <span className="text-[#FFD200]">I</span>
                <span className="text-[#00E5FF]">D</span>
                <span className="text-[#00E676]">S</span>
              </span>
            </button>

            {/* ANIME */}
            <button
              onClick={() => handleNavClick('anime')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                isAnimeActive
                  ? 'border-2 border-red-500 bg-red-500/15 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.35)] scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className={isAnimeActive ? 'text-red-500 font-black' : ''}>ANIME</span>
            </button>

            {/* EXPLORAR */}
            <button
              onClick={() => handleNavClick('vod', 'all')}
              className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
            >
              EXPLORAR
            </button>
          </nav>

          {/* RIGHT: Circular Action Buttons & Real-Time Clock */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
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

            <button
              onClick={() => handleNavClick('vod', 'all')}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center justify-center transition-all cursor-pointer hidden sm:flex"
              title="Filtro de Generos"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center justify-center transition-all cursor-pointer hidden sm:flex"
              title="Historico de reproducao"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="relative w-9 h-9 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
              title="Central do Assinante & Perfil"
            >
              <User className="w-4 h-4" />
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#070a10]" />
            </button>

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

            <div
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-400 items-center justify-center hidden md:flex"
              title="Dispositivo Conectado: Android TV / TV Box"
            >
              <ScreenShare className="w-4 h-4" />
            </div>

            <div className="hidden sm:block border-l border-white/10 pl-2">
              <UniTVClock />
            </div>

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
              <span className="font-bold">INICIO</span>
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
              onClick={() => handleNavClick('kids')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <span className="font-black text-xs sm:text-sm tracking-widest inline-flex items-center gap-0.5">
                <span className="text-[#FF2A85]">K</span>
                <span className="text-[#FFD200]">I</span>
                <span className="text-[#00E5FF]">D</span>
                <span className="text-[#00E676]">S</span>
              </span>
            </button>
            <button
              onClick={() => handleNavClick('anime')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white hover:bg-white/10"
            >
              <span className={isAnimeActive ? 'text-red-500 font-black' : ''}>ANIME</span>
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
              <span>Configuracoes</span>
            </button>
          </div>
        )}
      </header>

      {/* Notification Drawer Component */}
      <UniTVNotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
      />

      {/* Profile & Account Modal Component */}
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
