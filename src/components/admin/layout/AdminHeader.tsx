// MasterTV Admin Top Header Component
// Compact, clean dark header matching MasterX inspiration without excess neon
// Strictly ASCII comments only

import React from 'react';
import {
  Menu,
  RefreshCw,
  CheckCircle2,
  Coins,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { Reseller } from '../../../types/admin';
import type { AdminTabKey } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTabKey;
  activeContentFilter: string;
  currentRole: 'admin' | 'reseller';
  activeReseller?: Reseller;
  isRefreshing?: boolean;
  onChangeRole: (role: 'admin' | 'reseller') => void;
  onOpenMobileSidebar: () => void;
  onRefreshData: () => void;
  onBackToPlayer: () => void;
}

function getSectionTitle(activeTab: AdminTabKey, contentFilter: string): { title: string; subtitle: string } {
  switch (activeTab) {
    case 'dashboard':
      return {
        title: 'Dashboard',
        subtitle: 'Visao geral do catalogo, clientes e operacao MasterTV',
      };
    case 'clients':
      return {
        title: 'Clientes & Linhas',
        subtitle: 'Gerencie assinantes, renovacoes, bloqueios e credenciais',
      };
    case 'trials':
      return {
        title: 'Gerador de Testes',
        subtitle: 'Crie acessos temporarios e envie rapidamente via WhatsApp',
      };
    case 'resellers':
      return {
        title: 'Revendedores',
        subtitle: 'Controle revendas cadastradas, creditos e clientes vinculados',
      };
    case 'contents':
      if (contentFilter === 'channel') {
        return { title: 'TV ao Vivo', subtitle: 'Canais importados e configuracoes de transmissao' };
      }
      if (contentFilter === 'movie') {
        return { title: 'Filmes', subtitle: 'Catalogo de filmes sincronizados com o banco MySQL' };
      }
      if (contentFilter === 'series') {
        return { title: 'Series', subtitle: 'Catalogo de series, temporadas e episodios' };
      }
      return {
        title: 'Gerenciador de Catalogo',
        subtitle: 'Canais, filmes, series, importacao M3U e sincronizacao',
      };
    case 'settings':
      return {
        title: 'Configuracoes',
        subtitle: 'Preferencias do servidor, links do player e modelo de mensagens',
      };
    default:
      return {
        title: 'Painel Administrativo',
        subtitle: 'MasterTV',
      };
  }
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  activeContentFilter,
  currentRole,
  activeReseller,
  isRefreshing = false,
  onChangeRole,
  onOpenMobileSidebar,
  onRefreshData,
  onBackToPlayer,
}) => {
  const { title, subtitle } = getSectionTitle(activeTab, activeContentFilter);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#101827]/95 backdrop-blur-md border-b border-[#253247] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
      {/* Left: Mobile Drawer Toggle + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden w-9 h-9 rounded-xl bg-[#151E2E] hover:bg-[#1c283e] border border-[#253247] text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-tight truncate">
            {title}
          </h1>
          <p className="text-[11px] text-[#94A3B8] truncate hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Status Badge + Refresh + Role Switcher + Back to Player */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Panel Active Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16B981]/10 border border-[#16B981]/30 text-[#16B981] text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Painel ativo</span>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="w-9 h-9 rounded-xl bg-[#151E2E] hover:bg-[#1c283e] border border-[#253247] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
          title="Atualizar dados do banco"
          aria-label="Atualizar dados do banco"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#009DFF]' : ''}`} />
        </button>

        {/* Role Switcher (Preserves Master Admin / Reseller permissions) */}
        <div className="flex items-center gap-1 bg-[#070B16] p-1 rounded-xl border border-[#253247]">
          <button
            type="button"
            onClick={() => onChangeRole('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-[#009DFF] text-[#070B16] font-bold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin Master</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeRole('reseller')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentRole === 'reseller'
                ? 'bg-[#0077D9] text-white font-bold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Revendedor</span>
          </button>
        </div>

        {/* Reseller Credits Indicator */}
        {currentRole === 'reseller' && activeReseller && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/30 text-[#F5B942] text-xs font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>{activeReseller.credits} cr.</span>
          </div>
        )}

        {/* Quick Back to Player Button (Mobile/Tablet convenience) */}
        <button
          type="button"
          onClick={onBackToPlayer}
          className="lg:hidden flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#151E2E] hover:bg-[#1c283e] border border-[#253247] text-xs font-semibold text-[#F8FAFC] cursor-pointer"
          title="Voltar ao Player"
        >
          <ArrowLeft className="w-4 h-4 text-[#009DFF]" />
          <span className="hidden sm:inline">Player</span>
        </button>
      </div>
    </header>
  );
};
