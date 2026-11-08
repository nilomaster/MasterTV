// Settings and configuration modal component
// Strictly ASCII comments only

import React, { useState } from 'react';
import { X, Sliders, User, LogOut, Calendar, ShieldCheck } from 'lucide-react';
import type { ClientSession } from '../types/admin';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache: () => void;
  onOpenAdmin?: () => void;
  clientSession?: ClientSession | null;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearCache,
  onOpenAdmin,
  clientSession,
  onLogout,
}) => {
  const [hardwareAcceleration, setHardwareAcceleration] = useState<boolean>(true);
  const [lowLatency, setLowLatency] = useState<boolean>(true);
  const [bufferSize, setBufferSize] = useState<string>('30s');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1320] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Configurações do MasterTV</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 text-xs text-slate-300">
          {/* Active Client Account Info */}
          {clientSession && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{clientSession.customerName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {clientSession.planDuration}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{clientSession.username}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Vence: {new Date(clientSession.expiresAt).toLocaleDateString('pt-BR')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Sair desta conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          )}

          {/* Toggles */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
            <div>
              <span className="font-bold text-white block">Aceleração de Hardware</span>
              <span className="text-[11px] text-slate-400">
                Utiliza a GPU para decodificação suave de vídeo 4K/1080p.
              </span>
            </div>
            <button
              onClick={() => setHardwareAcceleration(!hardwareAcceleration)}
              className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                hardwareAcceleration ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 shadow"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
            <div>
              <span className="font-bold text-white block">Modo Zero Delay (Low Latency)</span>
              <span className="text-[11px] text-slate-400">
                Minimiza o atraso nas transmissões ao vivo de esportes e jornalismo.
              </span>
            </div>
            <button
              onClick={() => setLowLatency(!lowLatency)}
              className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                lowLatency ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 shadow"></div>
            </button>
          </div>

          {/* Buffer Size */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
            <div>
              <span className="font-bold text-white block">Tamanho do Buffer de Vídeo</span>
              <span className="text-[11px] text-slate-400">
                Evita travamentos em conexões instáveis.
              </span>
            </div>
            <select
              value={bufferSize}
              onChange={(e) => setBufferSize(e.target.value)}
              className="bg-slate-800 text-white font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="15s">15 segundos</option>
              <option value="30s">30 segundos (Padrão)</option>
              <option value="60s">60 segundos</option>
            </select>
          </div>

          {/* Painel Administrativo e Revenda */}
          {onOpenAdmin && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block text-xs">Painel Admin & Revendedores</span>
                <span className="text-[11px] text-blue-400">
                  Gerencie clientes IPTV, testes rápidos e revendas com créditos.
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/25 cursor-pointer shrink-0 ml-2"
              >
                Abrir Painel
              </button>
            </div>
          )}

          {/* Cache reset */}
          <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Cache e Histórico Local</span>
              <span className="text-[11px] text-slate-400">
                Limpa canais em cache e restaura os padrões.
              </span>
            </div>
            <button
              onClick={onClearCache}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold transition-colors"
            >
              Limpar Cache
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
          >
            {savedSuccess ? 'Salvo!' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
