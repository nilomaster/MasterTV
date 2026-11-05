// Settings and configuration modal component
// Strictly ASCII comments only

import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearCache,
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
            <Sliders className="w-5 h-5 text-cyan-400" />
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
                hardwareAcceleration ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
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
                lowLatency ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
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
              className="bg-slate-800 text-white font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-400"
            >
              <option value="15s">15 segundos</option>
              <option value="30s">30 segundos (Padrão)</option>
              <option value="60s">60 segundos</option>
            </select>
          </div>

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
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            {savedSuccess ? 'Salvo!' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
