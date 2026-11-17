// UniTV-style Account & Profile Center for MasterTV
// Strictly ASCII comments only as per project guidelines

import React from 'react';
import {
  X,
  User,
  ShieldCheck,
  QrCode,
  Gift,
  Ticket,
  LogOut,
  Crown,
  Heart,
} from 'lucide-react';
import type { ClientSession } from '../../types/admin';
import type { MediaItem, Channel } from '../../types/iptv';

interface UniTVProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSession: ClientSession | null;
  onLogout: () => void;
  onSelectMedia?: (item: MediaItem) => void;
  onSelectChannel?: (channel: Channel) => void;
  favoritesCount?: number;
}

export const UniTVProfileModal: React.FC<UniTVProfileModalProps> = ({
  isOpen,
  onClose,
  clientSession,
  onLogout,
  favoritesCount = 0,
}) => {
  if (!isOpen) return null;

  const username = clientSession?.username || clientSession?.customerName || 'MasterVIP';
  const expiresAt = clientSession?.expiresAt ? new Date(clientSession.expiresAt) : new Date(Date.now() + 365 * 86400000);
  const formattedDate = `${String(expiresAt.getDate()).padStart(2, '0')}-${String(
    expiresAt.getMonth() + 1
  ).padStart(2, '0')}-${expiresAt.getFullYear()}`;

  // Mock watch history items (UniTV Photo 3 style)
  const historyItems = [
    { id: 'hist-1', title: 'Salem Temp. 2', type: 'Série', image: './assets/img/covers/DeathNoteAnime.webp' },
    { id: 'hist-2', title: 'Só Por Uma Noite', type: 'Filme', image: './assets/img/covers/HomenAranhaUmNovoDia.webp' },
    { id: 'hist-3', title: 'Anne com um E', type: 'Série', image: './assets/img/covers/VisionQuest.webp' },
    { id: 'hist-4', title: 'Carrie: A Estranha', type: 'Filme', image: './assets/img/covers/DeathNoteAnime.webp' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090d16] border border-cyan-500/25 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-transparent to-blue-950/30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black tracking-wider text-cyan-400 uppercase">MasterTV Central</span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-300 font-bold">Perfil do Assinante & Seguranca</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Two Column UniTV Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: User Card & Account Actions (Photo 3) */}
          <div className="lg:col-span-4 rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between space-y-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar with VIP Crown */}
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-1 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#07090e] flex items-center justify-center text-cyan-300">
                    <User className="w-12 h-12" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                  <Crown className="w-4 h-4 fill-current stroke-[2.5]" />
                </div>
              </div>

              <h2 className="text-xl font-black text-white tracking-tight">{username}</h2>
              <span className="mt-1 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                Plano MasterTV Ativo
              </span>

              <p className="mt-4 text-xs font-semibold text-slate-300">
                Seu plano expirara em:{' '}
                <strong className="text-cyan-400 font-mono text-sm">{formattedDate}</strong>
              </p>
              <span className="text-[10px] text-slate-500 font-mono">(dd-mm-yyyy)</span>

              <p className="mt-4 text-[11px] text-slate-400 leading-relaxed max-w-xs">
                O telefone celular ou e-mail vinculados podem ser usados para fazer login e sincronizar em outros dispositivos.
              </p>
            </div>

            {/* Account Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-white/10">
              <button
                onClick={() => alert('Dispositivo ja vinculado com sua linha MasterTV!')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Vincular agora
              </button>

              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition-colors cursor-pointer"
              >
                Entrar com outras contas
              </button>

              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Deslogar</span>
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: 4 UniTV Feature Tiles + History + Favorites (Photo 3) */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            {/* 4 Big UniTV Feature Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Tile 1: Seguranca da conta (Blue) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-950/40 text-white flex flex-col justify-between h-28 cursor-pointer hover:scale-[1.02] transition-transform">
                <ShieldCheck className="w-8 h-8 text-blue-200" />
                <span className="text-xs font-black leading-tight">Seguranca da conta</span>
              </div>

              {/* Tile 2: Logar no celular (Green) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-lg shadow-emerald-950/40 text-white flex flex-col justify-between h-28 cursor-pointer hover:scale-[1.02] transition-transform">
                <QrCode className="w-8 h-8 text-emerald-200" />
                <span className="text-xs font-black leading-tight">Logar no celular</span>
              </div>

              {/* Tile 3: Centro de resgate (Orange) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg shadow-orange-950/40 text-white flex flex-col justify-between h-28 cursor-pointer hover:scale-[1.02] transition-transform">
                <Ticket className="w-8 h-8 text-amber-200" />
                <span className="text-xs font-black leading-tight">Centro de resgate</span>
              </div>

              {/* Tile 4: Centro de Eventos / Ajuda (Red/Pink) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 shadow-lg shadow-rose-950/40 text-white flex flex-col justify-between h-28 cursor-pointer hover:scale-[1.02] transition-transform">
                <Gift className="w-8 h-8 text-rose-200" />
                <span className="text-xs font-black leading-tight">Centro de Eventos</span>
              </div>
            </div>

            {/* Historico Row */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">Historico de Reproducao</h3>
                <span className="text-xs text-slate-400">Ultimos reproduzidos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-400 cursor-pointer transition-all hover:scale-105"
                  >
                    <div className="aspect-[2/3] w-full bg-slate-900 overflow-hidden relative">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs font-bold text-white truncate">{item.title}</p>
                        <span className="text-[10px] text-cyan-300">{item.type}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* "+ Mais" Card (UniTV style) */}
                <div className="aspect-[2/3] rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border-2 border-dashed border-cyan-500/30 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-black mb-1 shadow-md shadow-cyan-500/30">
                    +
                  </div>
                  <span className="text-xs font-bold text-cyan-300">Mais</span>
                </div>
              </div>
            </div>

            {/* Minha Lista de Favoritos */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span>Minha lista de favoritos ({favoritesCount})</span>
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {favoritesCount > 0
                    ? `Voce possui ${favoritesCount} canais e filmes favoritados para acesso rapido.`
                    : 'Nenhum canal ou filme favoritado ainda. Clique na estrela ao assistir para adicionar aqui.'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono">
                  {favoritesCount} Salvos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
