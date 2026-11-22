// MasterTV Admin Sidebar Navigation Component
// Clean MasterX-inspired dark sidebar with MasterTV brand identity (zero excess neon)
// Strictly ASCII comments only

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Zap,
  Coins,
  ListVideo,
  Tv,
  Film,
  Clapperboard,
  FolderKanban,
  Settings,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  FolderTree,
  Calendar,
  LogOut,
} from 'lucide-react';
import type { Reseller } from '../../../types/admin';

export type AdminTabKey =
  | 'dashboard'
  | 'clients'
  | 'trials'
  | 'resellers'
  | 'contents'
  | 'categories'
  | 'epg'
  | 'settings';

export type AdminCatalogShortcut = 'all' | 'channel' | 'movie' | 'series';

interface AdminSidebarProps {
  activeTab: AdminTabKey;
  activeContentFilter: string;
  currentRole: 'admin' | 'reseller';
  authUserName?: string;
  activeReseller?: Reseller;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  counts: {
    clients: number;
    resellers: number;
    channels: number;
    movies: number;
    series: number;
    totalContents: number;
  };
  onSelectTab: (tab: AdminTabKey) => void;
  onSelectCatalogShortcut: (filter: AdminCatalogShortcut) => void;
  onOpenM3UImporter: () => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onBackToPlayer: () => void;
  onLogoutAdmin?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  activeContentFilter,
  currentRole,
  authUserName,
  activeReseller,
  isCollapsed,
  isMobileOpen,
  counts,
  onSelectTab,
  onSelectCatalogShortcut,
  onOpenM3UImporter,
  onToggleCollapse,
  onCloseMobile,
  onBackToPlayer,
  onLogoutAdmin,
}) => {
  const isAdmin = currentRole === 'admin';

  const handleNav = (fn: () => void) => {
    fn();
    onCloseMobile();
  };

  const navItemClass = (isActive: boolean) =>
    `group w-full flex items-center ${
      isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
    } py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer border ${
      isActive
        ? 'bg-[#009DFF]/15 text-[#F8FAFC] border-[#009DFF]/40 font-semibold'
        : 'bg-transparent text-[#94A3B8] border-transparent hover:bg-[#151E2E] hover:text-[#F8FAFC]'
    }`;

  const iconClass = (isActive: boolean) =>
    `w-[18px] h-[18px] shrink-0 transition-colors ${
      isActive ? 'text-[#009DFF]' : 'text-[#94A3B8] group-hover:text-[#F8FAFC]'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#101827] border-r border-[#253247] text-[#F8FAFC] select-none">
      {/* Top Brand Header */}
      <div
        className={`flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        } h-16 border-b border-[#253247] shrink-0`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#151E2E] border border-[#253247] p-1.5 flex items-center justify-center shrink-0">
            <img
              src="./assets/img/icons/logo.png"
              alt="MasterTV"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base tracking-tight leading-none flex items-center">
                <span className="text-[#F8FAFC]">Master</span>
                <span className="text-[#009DFF]">TV</span>
              </span>
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#94A3B8] mt-1 whitespace-nowrap">
                Painel Administrativo
              </span>
            </div>
          )}
        </div>

        {/* Close button on Mobile Drawer */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden w-8 h-8 rounded-lg bg-[#151E2E] border border-[#253247] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Collapse toggle on Desktop */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-[#151E2E] hover:bg-[#1d293f] border border-[#253247] text-[#94A3B8] hover:text-white items-center justify-center cursor-pointer transition-colors"
            title="Recolher menu lateral"
            aria-label="Recolher menu lateral"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Authenticated Role Badge */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-[#253247]/70 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#151E2E] border border-[#253247]">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isAdmin ? 'bg-[#009DFF]/15 text-[#009DFF]' : 'bg-[#F5B942]/15 text-[#F5B942]'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#F8FAFC] truncate">
                {authUserName || (isAdmin ? 'Admin Master' : activeReseller?.name || 'Revendedor')}
              </span>
              <span className="text-[11px] text-[#94A3B8] truncate">
                {isAdmin
                  ? 'Administrador Master'
                  : `${activeReseller?.credits ?? 0} creditos disponiveis`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expand button when collapsed on Desktop */}
      {isCollapsed && (
        <div className="hidden lg:flex justify-center py-2.5 border-b border-[#253247]/70 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg bg-[#151E2E] hover:bg-[#1d293f] border border-[#253247] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Expandir menu lateral"
            aria-label="Expandir menu lateral"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Navigation Sections */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 custom-scroll">
        {/* PRINCIPAL */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]/80">
              Principal
            </p>
          )}

          <button
            type="button"
            onClick={() => handleNav(() => onSelectTab('dashboard'))}
            className={navItemClass(activeTab === 'dashboard')}
            title="Dashboard"
          >
            <div className="flex items-center gap-3 min-w-0">
              <LayoutDashboard className={iconClass(activeTab === 'dashboard')} />
              {!isCollapsed && <span className="truncate">Dashboard</span>}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNav(() => onSelectTab('clients'))}
            className={navItemClass(activeTab === 'clients')}
            title="Clientes e Linhas"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Users className={iconClass(activeTab === 'clients')} />
              {!isCollapsed && <span className="truncate">Clientes &amp; Linhas</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-[#0F1726] text-[#94A3B8]">
                {counts.clients}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNav(() => onSelectTab('trials'))}
            className={navItemClass(activeTab === 'trials')}
            title="Gerador de Testes"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Zap className={iconClass(activeTab === 'trials')} />
              {!isCollapsed && <span className="truncate">Gerador de Testes</span>}
            </div>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav(() => onSelectTab('resellers'))}
              className={navItemClass(activeTab === 'resellers')}
              title="Revendedores"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Coins className={iconClass(activeTab === 'resellers')} />
                {!isCollapsed && <span className="truncate">Revendedores</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-[#0F1726] text-[#94A3B8]">
                  {counts.resellers}
                </span>
              )}
            </button>
          )}
        </div>

        {/* CATALOGO (Admin Master Only) */}
        {isAdmin && (
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]/80">
                Catalogo
              </p>
            )}

            <button
              type="button"
              onClick={() => handleNav(onOpenM3UImporter)}
              className={navItemClass(false)}
              title="Importar Listas M3U"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ListVideo className={iconClass(false)} />
                {!isCollapsed && <span className="truncate">Listas M3U</span>}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav(() => onSelectCatalogShortcut('channel'))}
              className={navItemClass(activeTab === 'contents' && activeContentFilter === 'channel')}
              title="TV ao Vivo"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Tv className={iconClass(activeTab === 'contents' && activeContentFilter === 'channel')} />
                {!isCollapsed && <span className="truncate">TV ao Vivo</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-[#0F1726] text-[#94A3B8]">
                  {counts.channels}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNav(() => onSelectCatalogShortcut('movie'))}
              className={navItemClass(activeTab === 'contents' && activeContentFilter === 'movie')}
              title="Filmes"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Film className={iconClass(activeTab === 'contents' && activeContentFilter === 'movie')} />
                {!isCollapsed && <span className="truncate">Filmes</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-[#0F1726] text-[#94A3B8]">
                  {counts.movies}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNav(() => onSelectCatalogShortcut('series'))}
              className={navItemClass(activeTab === 'contents' && activeContentFilter === 'series')}
              title="Series"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Clapperboard
                  className={iconClass(activeTab === 'contents' && activeContentFilter === 'series')}
                />
                {!isCollapsed && <span className="truncate">Series</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-[#0F1726] text-[#94A3B8]">
                  {counts.series}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNav(() => onSelectTab('categories'))}
              className={navItemClass(activeTab === 'categories')}
              title="Categorias"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FolderTree className={iconClass(activeTab === 'categories')} />
                {!isCollapsed && <span className="truncate">Categorias</span>}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav(() => onSelectTab('epg'))}
              className={navItemClass(activeTab === 'epg')}
              title="EPG"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Calendar className={iconClass(activeTab === 'epg')} />
                {!isCollapsed && <span className="truncate">EPG</span>}
              </div>
            </button>
          </div>
        )}

        {/* GERENCIAMENTO */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]/80">
              Gerenciamento
            </p>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav(() => onSelectCatalogShortcut('all'))}
              className={navItemClass(activeTab === 'contents' && activeContentFilter === 'all')}
              title="Gerenciador de Conteudo"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FolderKanban
                  className={iconClass(activeTab === 'contents' && activeContentFilter === 'all')}
                />
                {!isCollapsed && <span className="truncate">Gerenciar Catalogo</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-[#0F1726] text-[#94A3B8]">
                  {counts.totalContents}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNav(() => onSelectTab('settings'))}
            className={navItemClass(activeTab === 'settings')}
            title="Configuracoes"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Settings className={iconClass(activeTab === 'settings')} />
              {!isCollapsed && <span className="truncate">Configuracoes</span>}
            </div>
          </button>
        </div>
      </nav>

      {/* Footer Account Actions: Back to Player & Logout */}
      <div className="p-3 border-t border-[#253247] shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => handleNav(onBackToPlayer)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
          } py-2.5 rounded-xl bg-[#151E2E] hover:bg-[#1c283e] border border-[#253247] text-sm font-semibold text-[#F8FAFC] transition-colors cursor-pointer`}
          title="Voltar ao Player"
        >
          <ArrowLeft className="w-4 h-4 text-[#009DFF] shrink-0" />
          {!isCollapsed && <span className="truncate">Voltar ao Player</span>}
        </button>

        {onLogoutAdmin && (
          <button
            type="button"
            onClick={() => handleNav(onLogoutAdmin)}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            } py-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/25 text-xs font-semibold text-[#EF4444] transition-colors cursor-pointer`}
            title="Sair do Painel"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Sair do Painel</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Fixed Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-40 transition-all duration-200 ${
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex animate-in fade-in duration-150"
          onClick={onCloseMobile}
        >
          <div
            className="w-[260px] max-w-[82vw] h-full shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
