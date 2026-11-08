// Modal for importing and managing M3U / M3U8 playlists
// All comments in this file strictly follow ASCII rules

import React, { useState } from 'react';
import { X, UploadCloud, Link as LinkIcon, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { parseM3U, fetchAndParseM3U } from '../services/m3uParser';
import type { Channel } from '../types/iptv';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyChannels: (newChannels: Channel[]) => void;
  onResetDefaults: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onApplyChannels,
  onResetDefaults,
}) => {
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [rawM3U, setRawM3U] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'url' | 'raw'>('url');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleLoadUrl = async () => {
    if (!playlistUrl.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetchAndParseM3U(playlistUrl.trim());
      if (res.channels.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Nenhum canal válido encontrado na lista informada.',
        });
      } else {
        onApplyChannels(res.channels);
        setStatusMessage({
          type: 'success',
          text: `Sucesso! ${res.channels.length} canais carregados.`,
        });
        setTimeout(onClose, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar URL';
      setStatusMessage({
        type: 'error',
        text: `${msg}. Se a URL tiver bloqueio de CORS, você pode colar o conteúdo na aba "Colar Conteúdo".`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseRaw = () => {
    if (!rawM3U.trim()) return;
    try {
      const res = parseM3U(rawM3U);
      if (res.channels.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Formato M3U inválido ou nenhum canal encontrado.',
        });
      } else {
        onApplyChannels(res.channels);
        setStatusMessage({
          type: 'success',
          text: `Sucesso! ${res.channels.length} canais carregados do arquivo.`,
        });
        setTimeout(onClose, 1200);
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao interpretar o texto M3U.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e1320] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Importar Lista IPTV (M3U / M3U8)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'url'
                ? 'border-blue-500 text-blue-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            URL da Lista
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'raw'
                ? 'border-blue-500 text-blue-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Colar Texto M3U
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'url' ? (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-300">
                Endereço URL da lista (.m3u ou .m3u8):
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://exemplo.com/lista.m3u"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Suporta listas com tags padrão #EXTINF, logos, agrupamento por categorias e identificadores EPG.
              </p>
              <button
                onClick={handleLoadUrl}
                disabled={isLoading || !playlistUrl.trim()}
                className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando lista...</span>
                  </>
                ) : (
                  <span>Carregar Lista</span>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-300">
                Cole o conteúdo bruto da playlist M3U:
              </label>
              <textarea
                rows={6}
                placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-name=&quot;Canal Exemplo&quot; group-title=&quot;Abertos&quot;,Canal Exemplo&#10;https://stream.exemplo.com/live.m3u8"
                value={rawM3U}
                onChange={(e) => setRawM3U(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 custom-scroll resize-none"
              />
              <button
                onClick={handleParseRaw}
                disabled={!rawM3U.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
              >
                <span>Importar Texto M3U</span>
              </button>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">Quer voltar aos canais padrões?</span>
            <button
              onClick={() => {
                onResetDefaults();
                setStatusMessage({
                  type: 'success',
                  text: 'Lista restaurada para os canais padrão com sucesso!',
                });
                setTimeout(onClose, 1000);
              }}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
            >
              Restaurar Lista Padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
