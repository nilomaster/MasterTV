// MasterTV Admin EPG Guide Status & XMLTV Sync View
// Uses real epgService diagnostic status (xmltv vs static vs fallback) without false positives
// Strictly ASCII comments only

import React, { useMemo, useState } from 'react';
import { Calendar, RefreshCw, CheckCircle2, AlertCircle, Tv, Edit, Search, Radio } from 'lucide-react';
import type { AdminContentItem } from '../../../types/admin';
import { fetchAndSyncXMLTV, getLiveEPGForChannel, getChannelEPGStatus } from '../../../services/epgService';

interface AdminEPGViewProps {
  contents: AdminContentItem[];
  onEditChannel: (item: AdminContentItem) => void;
}

export const AdminEPGView: React.FC<AdminEPGViewProps> = ({ contents, onEditChannel }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncFeedback, setLastSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'xmltv' | 'static' | 'unmapped'>('all');
  const [search, setSearch] = useState<string>('');
  const [epgTick, setEpgTick] = useState<number>(0);

  const channelItems = useMemo(() => {
    void epgTick;
    return contents
      .filter((c) => c && c.type === 'channel')
      .map((ch) => {
        const channelObj = {
          id: ch.id,
          epgId: ch.epgId || undefined,
          number: ch.channelNumber || 1,
          name: ch.title,
          logo: ch.posterUrl || '',
          category: ch.channelCategory || 'aberta',
          streamUrl: ch.streamUrl || '',
          currentProgram: ch.currentProgram || '',
          currentProgramTime: '',
          synopsis: ch.description || '',
          isFavorite: false,
        };

        const status = getChannelEPGStatus(channelObj, ch.title);
        const liveInfo = status.source !== 'fallback' ? getLiveEPGForChannel(channelObj) : null;

        return {
          item: ch,
          source: status.source,
          canonicalId: status.canonicalId,
          hasExplicitEpgId: status.hasExplicitEpgId,
          xmltvProgramsCount: status.xmltvProgramsCount,
          currentProgram: liveInfo?.currentProgram || null,
          currentTime: liveInfo?.currentProgramTime || '',
        };
      });
  }, [contents, epgTick]);

  const stats = useMemo(() => {
    const total = channelItems.length;
    const explicitId = channelItems.filter((c) => c.hasExplicitEpgId).length;
    const xmltvActive = channelItems.filter((c) => c.source === 'xmltv').length;
    const staticMatched = channelItems.filter((c) => c.source === 'static').length;
    const unmapped = channelItems.filter((c) => c.source === 'fallback').length;
    return { total, explicitId, xmltvActive, staticMatched, unmapped };
  }, [channelItems]);

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return channelItems.filter((entry) => {
      const matchesFilter =
        filterMode === 'all'
          ? true
          : filterMode === 'xmltv'
          ? entry.source === 'xmltv'
          : filterMode === 'static'
          ? entry.source === 'static'
          : entry.source === 'fallback';

      const matchesSearch =
        !q ||
        entry.item.title.toLowerCase().includes(q) ||
        (entry.item.epgId || '').toLowerCase().includes(q) ||
        (entry.canonicalId || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [channelItems, filterMode, search]);

  const handleSyncXMLTV = async () => {
    setIsSyncing(true);
    setLastSyncFeedback(null);
    try {
      const ok = await fetchAndSyncXMLTV();
      setEpgTick((t) => t + 1);
      if (ok) {
        setLastSyncFeedback({
          type: 'success',
          text: `Sincronizacao XMLTV concluida as ${new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}.`,
        });
      } else {
        setLastSyncFeedback({
          type: 'error',
          text: 'Fonte XMLTV indisponivel no momento. Mantendo grades locais ja carregadas.',
        });
      }
    } catch {
      setLastSyncFeedback({
        type: 'error',
        text: 'Erro de rede ao tentar sincronizar a fonte XMLTV.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Header + Manual Sync Button */}
      <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#009DFF]/15 border border-[#009DFF]/30 text-[#009DFF] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">Guia de Programacao (EPG / XMLTV)</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Status real por canal: diferencia XMLTV sincronizado, grade local por nome e canais sem EPG.
            </p>
            {lastSyncFeedback && (
              <div
                className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                  lastSyncFeedback.type === 'success'
                    ? 'bg-[#16B981]/15 border-[#16B981]/30 text-[#16B981]'
                    : 'bg-[#F5B942]/15 border-[#F5B942]/30 text-[#F5B942]'
                }`}
              >
                {lastSyncFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{lastSyncFeedback.text}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncXMLTV}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#009DFF] hover:bg-[#0077D9] text-[#070B16] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando XMLTV...' : 'Sincronizar EPG Agora'}</span>
        </button>
      </div>

      {/* Real EPG KPI Cards (Honest separation between XMLTV, Static and Unmapped) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4">
          <span className="text-xs font-semibold text-[#94A3B8]">Total de Canais</span>
          <p className="text-2xl font-extrabold text-[#F8FAFC] mt-2">{stats.total}</p>
          <span className="text-[11px] text-[#94A3B8]">{stats.explicitId} com EPG ID salvo</span>
        </div>
        <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4">
          <span className="text-xs font-semibold text-[#94A3B8]">XMLTV Online Ativo</span>
          <p className="text-2xl font-extrabold text-[#16B981] mt-2">{stats.xmltvActive}</p>
          <span className="text-[11px] text-[#94A3B8]">grade real sincronizada</span>
        </div>
        <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4">
          <span className="text-xs font-semibold text-[#94A3B8]">Grade Local (Auto)</span>
          <p className="text-2xl font-extrabold text-[#009DFF] mt-2">{stats.staticMatched}</p>
          <span className="text-[11px] text-[#94A3B8]">correspondencia por nome/ID</span>
        </div>
        <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4">
          <span className="text-xs font-semibold text-[#94A3B8]">Sem Programacao</span>
          <p className="text-2xl font-extrabold text-[#F5B942] mt-2">{stats.unmapped}</p>
          <span className="text-[11px] text-[#94A3B8]">apenas fallback generico</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all' as const, label: `Todos (${stats.total})` },
            { id: 'xmltv' as const, label: `XMLTV Online (${stats.xmltvActive})` },
            { id: 'static' as const, label: `Grade Local (${stats.staticMatched})` },
            { id: 'unmapped' as const, label: `Sem EPG (${stats.unmapped})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                filterMode === tab.id
                  ? 'bg-[#009DFF]/15 text-[#F8FAFC] border-[#009DFF]/50'
                  : 'bg-[#0F1726] text-[#94A3B8] border-[#253247] hover:text-[#F8FAFC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[230px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar canal ou EPG ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1726] border border-[#253247] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#009DFF]"
          />
        </div>
      </div>

      {/* Channels EPG Table */}
      <div className="bg-[#0F1726] border border-[#253247] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#101827] border-b border-[#253247] text-[#94A3B8]">
                <th className="py-3 px-4 font-semibold">Canal</th>
                <th className="py-3 px-4 font-semibold">EPG ID (Salvo / Detectado)</th>
                <th className="py-3 px-4 font-semibold">Programa Atual</th>
                <th className="py-3 px-4 font-semibold">Origem / Status</th>
                <th className="py-3 px-4 font-semibold text-right">Mapear</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#253247]/60">
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#94A3B8]">
                    Nenhum canal encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredChannels.map(
                  ({ item, source, canonicalId, hasExplicitEpgId, xmltvProgramsCount, currentProgram, currentTime }) => (
                    <tr key={item.id} className="hover:bg-[#151E2E] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-8 rounded-lg bg-[#151E2E] border border-[#253247] p-1 flex items-center justify-center shrink-0">
                            {item.posterUrl ? (
                              <img src={item.posterUrl} alt={item.title} className="w-full h-full object-contain" />
                            ) : (
                              <Tv className="w-4 h-4 text-[#94A3B8]" />
                            )}
                          </div>
                          <span className="font-semibold text-[#F8FAFC]">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {hasExplicitEpgId ? (
                          <span className="text-[#25C4E8]">{item.epgId}</span>
                        ) : canonicalId ? (
                          <span className="text-[#94A3B8]" title="Detectado automaticamente pelo nome do canal">
                            auto: {canonicalId}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]/70">Nao definido</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#F8FAFC]">
                        {currentProgram ? (
                          <div>
                            <span className="font-medium">{currentProgram}</span>
                            {currentTime && (
                              <span className="ml-2 font-mono text-[11px] text-[#94A3B8]">{currentTime}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#94A3B8]">Sem programacao mapeada</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {source === 'xmltv' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#16B981]/15 text-[#16B981] border border-[#16B981]/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> XMLTV ({xmltvProgramsCount} prog.)
                          </span>
                        ) : source === 'static' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#009DFF]/15 text-[#25C4E8] border border-[#009DFF]/30 text-[10px] font-semibold">
                            <Radio className="w-3 h-3" /> Grade Local
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/30 text-[10px] font-semibold">
                            <AlertCircle className="w-3 h-3" /> Sem EPG
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onEditChannel(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151E2E] hover:bg-[#009DFF]/20 border border-[#253247] hover:border-[#009DFF]/50 text-[#94A3B8] hover:text-[#009DFF] font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar EPG</span>
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
