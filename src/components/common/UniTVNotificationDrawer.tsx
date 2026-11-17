// UniTV-style Slide-in Left Notification Drawer for MasterTV
// Strictly ASCII comments only as per project guidelines

import React from 'react';
import { X, Bell, Trash2, CheckCircle2 } from 'lucide-react';

export interface UniTVNotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  isUnread?: boolean;
  type?: 'update' | 'info' | 'system';
}

interface UniTVNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UniTVNotificationItem[];
  onClearAll: () => void;
}

export const UniTVNotificationDrawer: React.FC<UniTVNotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-[#0b0e14]/95 border-r border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-transparent to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">MasterTV</span>
              </div>
              <h3 className="text-base font-black text-white">Caixa de mensagens</h3>
              <p className="text-[11px] text-slate-400">
                Voce tem <strong className="text-cyan-300">{unreadCount}</strong> mensagens nao lidas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-400">Nenhuma mensagem no momento</p>
              <p className="text-xs text-slate-600 mt-1">Sua caixa de mensagens esta limpa e atualizada.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.isUnread
                    ? 'bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent border-red-500/40 shadow-lg shadow-red-950/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {item.type === 'update' ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                    <h4 className="text-xs font-bold text-white truncate max-w-[240px]">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{item.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#07090e] flex items-center justify-between gap-3">
          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-bold text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>Esvaziar</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
