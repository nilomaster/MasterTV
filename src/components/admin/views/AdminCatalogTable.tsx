// MasterTV Admin Catalog Manager View (Table default + Cards toggle)
// MasterX-inspired dark administrative table with MasterTV identity and zero excess neon
// Preserves all existing operations: Save to DB, Import M3U, Clear Catalog, Add, Edit, Delete
// Strictly ASCII comments only

import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Database,
  Download,
  Trash2,
  Plus,
  Edit,
  Copy,
  Check,
  CheckCircle2,
  Film,
  Tv,
  Clapperboard,
  LayoutGrid,
  Table2,
  Star,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import type { AdminContentItem } from '../../../types/admin';

interface CatalogCounts {
  channels: number;
  movies: number;
  series: number;
  animes: number;
  doramas: number;
  total: number;
}

interface AdminCatalogTableProps {
  contents: AdminContentItem[];
  filteredContents: AdminContentItem[];
  catalogCounts: CatalogCounts;
  contentFilter: 'all' | 'movie' | 'series' | 'channel' | 'anime' | 'dorama';
  contentSearchQuery: string;
  selectedCategoryFilter?: string;
  contentPage: number;
  contentItemsPerPage: number;
  isSyncingDatabase: boolean;
  syncProgress: number;
  syncFeedback: string | null;
  isClearingCatalog: boolean;
  copiedId: string | null;
  onChangeFilter: (filter: 'all' | 'movie' | 'series' | 'channel' | 'anime' | 'dorama') => void;
  onChangeCategoryFilter?: (category: string) => void;
  onChangeSearch: (query: string) => void;
  onChangePage: (page: number) => void;
  onRefreshFromDB: () => void;
  onSaveAllToDB: () => void;
  onOpenM3UImporter: () => void;
  onClearAllContents: () => void;
  onAddContent: () => void;
  onEditContent: (item: AdminContentItem) => void;
  onDeleteContent: (item: AdminContentItem) => void;
  onCopyUrl: (url: string, id: string) => void;
}

// Extract safe display hostname without exposing credentials or tokens
function getSafeSourceHost(url?: string): string {
  if (!url) return 'Sem fonte';
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname || 'Fonte M3U';
  } catch {
    return 'Fonte M3U';
  }
}

// Resolve real quality badge from item metadata
function getItemQuality(item: AdminContentItem): string | null {
  const srcQ = (item.sourcesList?.[0]?.quality || item.sourcesList?.[0]?.name || '').toUpperCase();
  const titleUp = (item.title || '').toUpperCase();
  if (srcQ.includes('4K') || srcQ.includes('UHD') || /\b(4K|UHD)\b/.test(titleUp)) return '4K';
  if (srcQ.includes('FHD') || srcQ.includes('1080') || /\b(FHD|1080P)\b/.test(titleUp)) return 'FHD';
  if (srcQ.includes('SD') || srcQ.includes('480') || /\b(SD|480P)\b/.test(titleUp)) return 'SD';
  if (srcQ.includes('HD') || srcQ.includes('720') || /\b(HD|720P)\b/.test(titleUp)) return 'HD';
  return null;
}

export const AdminCatalogTable: React.FC<AdminCatalogTableProps> = ({
  contents,
  filteredContents,
  catalogCounts,
  contentFilter,
  contentSearchQuery,
  selectedCategoryFilter,
  contentPage,
  contentItemsPerPage,
  isSyncingDatabase,
  syncProgress,
  syncFeedback,
  isClearingCatalog,
  copiedId,
  onChangeFilter,
  onChangeCategoryFilter,
  onChangeSearch,
  onChangePage,
  onRefreshFromDB,
  onSaveAllToDB,
  onOpenM3UImporter,
  onClearAllContents,
  onAddContent,
  onEditContent,
  onDeleteContent,
  onCopyUrl,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [internalCategoryFilter, setInternalCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title_asc' | 'title_desc' | 'year_desc'>('recent');

  const categoryFilter = selectedCategoryFilter !== undefined ? selectedCategoryFilter : internalCategoryFilter;
  const setCategoryFilter = (nextCat: string) => {
    setInternalCategoryFilter(nextCat);
    onChangeCategoryFilter?.(nextCat);
  };

  // Available categories derived from filteredContents
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    filteredContents.forEach((item) => {
      if (item.type === 'channel') {
        const cat = (item.channelCategory || '').trim();
        if (cat) set.add(cat);
      } else if (Array.isArray(item.genres)) {
        item.genres.forEach((g) => {
          const clean = String(g || '').trim();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [filteredContents]);

  // Apply secondary category filter and sorting
  const processedContents = useMemo(() => {
    let list = filteredContents;
    if (categoryFilter !== 'all') {
      const target = categoryFilter.toLowerCase();
      list = list.filter((item) => {
        if (item.type === 'channel') {
          return (item.channelCategory || '').trim().toLowerCase() === target;
        }
        return Array.isArray(item.genres) && item.genres.some((g) => String(g).trim().toLowerCase() === target);
      });
    }

    if (sortBy === 'title_asc') {
      return [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
    }
    if (sortBy === 'title_desc') {
      return [...list].sort((a, b) => (b.title || '').localeCompare(a.title || '', 'pt-BR'));
    }
    if (sortBy === 'year_desc') {
      return [...list].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }
    return list;
  }, [filteredContents, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedContents.length / contentItemsPerPage));
  const safePage = Math.min(contentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * contentItemsPerPage;
    return processedContents.slice(start, start + contentItemsPerPage);
  }, [processedContents, safePage, contentItemsPerPage]);

  const getTypeMeta = (type: AdminContentItem['type']) => {
    switch (type) {
      case 'channel':
        return { label: 'AO VIVO', cls: 'bg-[#16B981]/15 text-[#16B981] border-[#16B981]/30' };
      case 'series':
        return { label: 'SERIE', cls: 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/30' };
      case 'anime':
        return { label: 'ANIME', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
      case 'dorama':
        return { label: 'DORAMA', cls: 'bg-pink-500/15 text-pink-400 border-pink-500/30' };
      default:
        return { label: 'FILME', cls: 'bg-[#009DFF]/15 text-[#25C4E8] border-[#009DFF]/30' };
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Action Toolbar Panel */}
      <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#009DFF]/15 border border-[#009DFF]/30 text-[#009DFF] flex items-center justify-center shrink-0">
            {contentFilter === 'channel' ? (
              <Tv className="w-5 h-5" />
            ) : contentFilter === 'series' ? (
              <Clapperboard className="w-5 h-5" />
            ) : (
              <Film className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#F8FAFC] leading-tight">
              {contentFilter === 'channel'
                ? 'Canais de TV ao Vivo'
                : contentFilter === 'movie'
                ? 'Catalogo de Filmes'
                : contentFilter === 'series'
                ? 'Catalogo de Series'
                : 'Gerenciador de Catalogo & Conteudo'}
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Gerencie filmes, series, canais ao vivo e importacoes M3U sincronizados com o banco MySQL.
            </p>
            {syncFeedback && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16B981]/15 border border-[#16B981]/30 text-[#16B981] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>
        </div>

        {/* Preserved Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefreshFromDB}
            title="Atualizar lista do banco"
            className="h-9 w-9 rounded-xl bg-[#0F1726] hover:bg-[#192438] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#253247] flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onSaveAllToDB}
            disabled={isSyncingDatabase || !contents || contents.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16B981]/15 hover:bg-[#16B981]/25 border border-[#16B981]/35 text-[#16B981] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Salvar todos os conteudos atuais permanentemente no banco de dados MySQL"
          >
            {isSyncingDatabase ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#16B981] border-t-transparent rounded-full animate-spin" />
                <span>Salvando ({syncProgress}%)</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Salvar no Banco ({contents.length})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenM3UImporter}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0F1726] hover:bg-[#192438] border border-[#253247] text-[#F8FAFC] font-semibold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#009DFF]" />
            <span>Importar M3U</span>
          </button>

          <button
            type="button"
            onClick={onClearAllContents}
            disabled={isClearingCatalog || !contents || contents.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Apagar todos os conteudos do banco de dados (requer confirmacao)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearingCatalog ? 'Limpando...' : 'Limpar Catalogo'}</span>
          </button>

          <button
            type="button"
            onClick={onAddContent}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#009DFF] hover:bg-[#0077D9] text-[#070B16] font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar Conteudo</span>
          </button>
        </div>
      </div>

      {/* Filters, Search, Sort & Table/Cards Toggle Bar */}
      <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            {
              id: 'all' as const,
              label: 'Todos',
              count: catalogCounts.total > 0 ? catalogCounts.total : contents.length,
            },
            {
              id: 'channel' as const,
              label: 'TV ao Vivo',
              count:
                catalogCounts.channels > 0
                  ? catalogCounts.channels
                  : contents.filter((c) => c && c.type === 'channel').length,
            },
            {
              id: 'movie' as const,
              label: 'Filmes',
              count:
                catalogCounts.movies > 0
                  ? catalogCounts.movies
                  : contents.filter((c) => c && c.type === 'movie').length,
            },
            {
              id: 'series' as const,
              label: 'Series',
              count:
                catalogCounts.series > 0
                  ? catalogCounts.series
                  : contents.filter((c) => c && c.type === 'series').length,
            },
            {
              id: 'anime' as const,
              label: 'Animes',
              count:
                catalogCounts.animes > 0
                  ? catalogCounts.animes
                  : contents.filter((c) => c && c.type === 'anime').length,
            },
            {
              id: 'dorama' as const,
              label: 'Doramas',
              count:
                catalogCounts.doramas > 0
                  ? catalogCounts.doramas
                  : contents.filter((c) => c && c.type === 'dorama').length,
            },
          ].map((tab) => {
            const isSelected = contentFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onChangeFilter(tab.id);
                  setCategoryFilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? 'bg-[#009DFF]/15 text-[#F8FAFC] border-[#009DFF]/50'
                    : 'bg-[#0F1726] text-[#94A3B8] border-[#253247] hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}{' '}
                <span className="font-mono text-[11px] opacity-80">
                  ({tab.count.toLocaleString('pt-BR')})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Category Dropdown + Sort + View Mode Switch */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por titulo, categoria ou genero..."
              value={contentSearchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="w-full bg-[#0F1726] border border-[#253247] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#009DFF] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <div className="relative flex items-center">
                <Filter className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 pointer-events-none" />
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    onChangePage(1);
                  }}
                  className="bg-[#0F1726] border border-[#253247] rounded-xl pl-8 pr-7 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#009DFF] cursor-pointer max-w-[190px]"
                >
                  <option value="all">Todas categorias</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Selector */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[#0F1726] border border-[#253247] rounded-xl pl-8 pr-6 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#009DFF] cursor-pointer"
              >
                <option value="recent">Padrao / Recentes</option>
                <option value="title_asc">Titulo (A-Z)</option>
                <option value="title_desc">Titulo (Z-A)</option>
                <option value="year_desc">Ano (mais novo)</option>
              </select>
            </div>

            {/* Table / Cards View Switcher */}
            <div className="flex items-center bg-[#0F1726] p-1 rounded-xl border border-[#253247]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#009DFF] text-[#070B16]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
                title="Visualizacao em Tabela"
              >
                <Table2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#009DFF] text-[#070B16]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
                title="Visualizacao em Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {processedContents.length === 0 ? (
        <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0F1726] border border-[#253247] flex items-center justify-center text-[#94A3B8]">
            <Film className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#F8FAFC]">Nenhum conteudo encontrado</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm">
            {contentSearchQuery || categoryFilter !== 'all'
              ? 'Nenhum resultado corresponde aos filtros atuais. Tente limpar a busca ou trocar a categoria.'
              : 'Nenhum item cadastrado nesta categoria. Importe uma lista M3U ou adicione manualmente.'}
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={onOpenM3UImporter}
              className="px-4 py-2 rounded-xl bg-[#0F1726] hover:bg-[#192438] border border-[#253247] text-[#F8FAFC] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-[#009DFF]" />
              <span>Importar Lista M3U</span>
            </button>
            <button
              type="button"
              onClick={onAddContent}
              className="px-4 py-2 rounded-xl bg-[#009DFF] hover:bg-[#0077D9] text-[#070B16] font-bold text-xs transition-colors cursor-pointer"
            >
              + Adicionar Conteudo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-[#151E2E] border border-[#253247] text-xs">
            <span className="text-[#94A3B8]">
              Mostrando{' '}
              <strong className="text-[#F8FAFC]">
                {(safePage - 1) * contentItemsPerPage + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-[#F8FAFC]">
                {Math.min(safePage * contentItemsPerPage, processedContents.length)}
              </strong>{' '}
              de{' '}
              <strong className="text-[#009DFF]">
                {processedContents.length.toLocaleString('pt-BR')}
              </strong>{' '}
              itens
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangePage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg bg-[#0F1726] hover:bg-[#192438] border border-[#253247] disabled:opacity-40 text-[#F8FAFC] font-semibold cursor-pointer transition-colors"
                >
                  Anterior
                </button>
                <span className="text-[#94A3B8] font-mono px-1.5">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => onChangePage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-[#0F1726] hover:bg-[#192438] border border-[#253247] disabled:opacity-40 text-[#F8FAFC] font-semibold cursor-pointer transition-colors"
                >
                  Proxima
                </button>
              </div>
            )}
          </div>

          {/* MODE 1: PROFESSIONAL ADMINISTRATIVE TABLE (DEFAULT) */}
          {viewMode === 'table' ? (
            <div className="bg-[#0F1726] border border-[#253247] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#101827] border-b border-[#253247] text-[#94A3B8]">
                      <th className="py-3 px-4 font-semibold">Conteudo</th>
                      <th className="py-3 px-4 font-semibold">Tipo</th>
                      <th className="py-3 px-4 font-semibold">Categoria</th>
                      <th className="py-3 px-4 font-semibold">Ano / Qualidade</th>
                      <th className="py-3 px-4 font-semibold">Origem</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#253247]/60">
                    {paginatedItems.map((item) => {
                      const typeMeta = getTypeMeta(item.type);
                      const quality = getItemQuality(item);
                      const categoryLabel =
                        item.type === 'channel'
                          ? item.channelCategory || 'TV ao Vivo'
                          : Array.isArray(item.genres) && item.genres.length > 0
                          ? item.genres.slice(0, 2).join(', ')
                          : 'Geral';
                      const safeHost = getSafeSourceHost(item.streamUrl);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#151E2E] transition-colors"
                        >
                          {/* Poster/Logo + Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[210px] max-w-[340px]">
                              <div
                                className={`${
                                  item.type === 'channel'
                                    ? 'w-11 h-9 p-1 bg-[#151E2E]'
                                    : 'w-9 h-12 bg-[#151E2E]'
                                } rounded-lg border border-[#253247] overflow-hidden shrink-0 flex items-center justify-center`}
                              >
                                {item.posterUrl ? (
                                  <img
                                    src={item.posterUrl}
                                    alt={item.title}
                                    loading="lazy"
                                    className={`w-full h-full ${
                                      item.type === 'channel' ? 'object-contain' : 'object-cover'
                                    }`}
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Film className="w-4 h-4 text-[#94A3B8]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-[#F8FAFC] truncate">
                                  {item.type === 'channel' && item.channelNumber ? (
                                    <span className="font-mono text-[#009DFF] mr-1.5">
                                      {String(item.channelNumber).padStart(3, '0')}
                                    </span>
                                  ) : null}
                                  {item.title}
                                </div>
                                <div className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                                  {item.type === 'series' && (item.seasons || item.episodes)
                                    ? `${item.seasons || 1} temp. · ${item.episodes || item.episodesList?.length || 1} ep.`
                                    : item.duration || item.currentProgram || 'Catalogo MasterTV'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${typeMeta.cls}`}
                            >
                              {typeMeta.label}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-[#94A3B8] max-w-[180px] truncate">
                            {categoryLabel}
                          </td>

                          {/* Year / Quality */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {item.year ? (
                                <span className="font-mono text-[#F8FAFC]">{item.year}</span>
                              ) : (
                                <span className="text-[#94A3B8]">—</span>
                              )}
                              {quality && (
                                <span className="px-1.5 py-0.5 rounded bg-[#151E2E] border border-[#253247] text-[10px] font-mono font-bold text-[#25C4E8]">
                                  {quality}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Safe Source Domain (no tokens/credentials exposed) */}
                          <td className="py-3 px-4 text-[#94A3B8] font-mono text-[11px] whitespace-nowrap max-w-[170px] truncate">
                            {safeHost}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                item.status === 'inactive'
                                  ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                                  : 'bg-[#16B981]/15 text-[#16B981] border-[#16B981]/30'
                              }`}
                            >
                              {item.status === 'inactive' ? 'Oculto' : 'Ativo'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onCopyUrl(item.streamUrl, `url-${item.id}`)}
                                title="Copiar link do stream"
                                className="p-1.5 rounded-lg bg-[#151E2E] hover:bg-[#1e2b42] border border-[#253247] text-[#94A3B8] hover:text-[#25C4E8] transition-colors cursor-pointer"
                              >
                                {copiedId === `url-${item.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-[#16B981]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditContent(item)}
                                title="Editar conteudo"
                                className="p-1.5 rounded-lg bg-[#151E2E] hover:bg-[#009DFF]/20 border border-[#253247] hover:border-[#009DFF]/50 text-[#94A3B8] hover:text-[#009DFF] transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteContent(item)}
                                title="Excluir conteudo"
                                className="p-1.5 rounded-lg bg-[#151E2E] hover:bg-[#EF4444]/20 border border-[#253247] hover:border-[#EF4444]/50 text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MODE 2: CLEAN CARDS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedItems.map((item) => {
                const typeMeta = getTypeMeta(item.type);
                return (
                  <div
                    key={item.id}
                    className="bg-[#151E2E] border border-[#253247] hover:border-[#009DFF]/45 rounded-2xl p-3.5 flex gap-3.5 transition-colors"
                  >
                    <div className="w-20 h-28 rounded-xl bg-[#0F1726] border border-[#253247] overflow-hidden shrink-0 relative">
                      <img
                        src={item.posterUrl || './assets/img/covers/default.webp'}
                        alt={item.title}
                        loading="lazy"
                        className={`w-full h-full ${
                          item.type === 'channel' ? 'object-contain p-1.5' : 'object-cover'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {item.rating > 0 && (
                        <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-[#F5B942]">
                          <Star className="w-2.5 h-2.5 fill-[#F5B942]" />
                          <span>{Number(item.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${typeMeta.cls}`}
                          >
                            {typeMeta.label}
                          </span>
                          <span className="text-[11px] font-mono text-[#94A3B8]">{item.year}</span>
                          {item.duration && (
                            <span className="text-[10px] font-mono text-[#94A3B8] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {item.duration}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#F8FAFC] line-clamp-1 mt-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#94A3B8] line-clamp-1 mt-0.5">
                          {item.type === 'channel'
                            ? item.channelCategory || 'TV ao Vivo'
                            : Array.isArray(item.genres)
                            ? item.genres.join(' · ')
                            : item.genres}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#253247] flex items-center justify-between gap-2 mt-2">
                        <span className="text-[10px] font-mono text-[#94A3B8] truncate">
                          {getSafeSourceHost(item.streamUrl)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditContent(item)}
                            className="p-1.5 rounded-lg bg-[#0F1726] hover:bg-[#009DFF]/20 border border-[#253247] text-[#94A3B8] hover:text-[#009DFF] transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteContent(item)}
                            className="p-1.5 rounded-lg bg-[#0F1726] hover:bg-[#EF4444]/20 border border-[#253247] text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-[#151E2E] border border-[#253247] text-xs">
              <span className="text-[#94A3B8]">
                Pagina <strong className="text-[#009DFF]">{safePage}</strong> de{' '}
                <strong className="text-[#F8FAFC]">{totalPages}</strong> (Exibindo {contentItemsPerPage} por pagina)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChangePage(Math.max(1, safePage - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={safePage === 1}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0F1726] hover:bg-[#192438] border border-[#253247] disabled:opacity-40 text-[#F8FAFC] font-semibold cursor-pointer transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangePage(Math.min(totalPages, safePage + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={safePage === totalPages}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0F1726] hover:bg-[#192438] border border-[#253247] disabled:opacity-40 text-[#F8FAFC] font-semibold cursor-pointer transition-colors"
                >
                  Proxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
