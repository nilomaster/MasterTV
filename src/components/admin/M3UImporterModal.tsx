// MasterTV Admin M3U & IPTV Playlist Importer Modal
// Supports Saimon-TV, Xtream Codes, and Generic M3U / M3U8 Playlists
// Strictly ASCII comments only as per project guidelines

import React, { useState, useMemo } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  FileText,
  CheckSquare,
  Square,
  Search,
  Tv,
  Film,
  Clapperboard,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  parseAdvancedM3U,
  fetchAdvancedM3U,
  type AdvancedM3UResult,
} from '../../services/m3uParser';
import { AdminService } from '../../services/adminService';
import type { AdminContentItem } from '../../types/admin';

interface M3UImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

export const M3UImporterModal: React.FC<M3UImporterModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  // Input mode: 'url' | 'file' | 'text'
  const [inputMode, setInputMode] = useState<'url' | 'file' | 'text'>('url');
  const [urlInput, setUrlInput] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Processing state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<AdvancedM3UResult | null>(null);

  // Filter and selection state
  const [typeFilter, setTypeFilter] = useState<'all' | 'channel' | 'movie' | 'series'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Import execution state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Handler to parse from raw text content
  const handleProcessText = (content: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setImportSuccessMsg(null);

      const result = parseAdvancedM3U(content);
      if (result.totalCount === 0) {
        throw new Error('Nenhum item valido ou tag #EXTINF encontrada no conteudo fornecido.');
      }

      setParsedData(result);
      // Select all categories by default
      const allCats = new Set(result.categories.map((c) => c.name));
      setSelectedCategories(allCats);
      // Select all items by default
      const allIds = new Set(result.items.map((i) => i.id));
      setSelectedItemIds(allIds);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar lista M3U.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for URL input fetch
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('Por favor, informe a URL da lista M3U.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setImportSuccessMsg(null);

    try {
      const result = await fetchAdvancedM3U(urlInput.trim());
      if (result.totalCount === 0) {
        throw new Error('Nenhum canal ou video encontrado na lista informada.');
      }
      setParsedData(result);
      const allCats = new Set(result.categories.map((c) => c.name));
      setSelectedCategories(allCats);
      const allIds = new Set(result.items.map((i) => i.id));
      setSelectedItemIds(allIds);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Nao foi possivel baixar a lista via URL. Se o servidor de origem bloquear acesso direto (CORS), baixe o arquivo .m3u no computador e use a opcao "Arquivo .M3U"!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for file upload input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsLoading(true);
    setErrorMsg(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleProcessText(text);
      } else {
        setErrorMsg('Arquivo vazio ou ilegivel.');
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo selecionado.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Toggle category in filter
  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      const isCurrentlySelected = next.has(catName);

      if (isCurrentlySelected) {
        next.delete(catName);
        // Unselect items belonging to this category
        setSelectedItemIds((itemPrev) => {
          const itemNext = new Set(itemPrev);
          parsedData?.items
            .filter((i) => i.groupTitle === catName)
            .forEach((i) => itemNext.delete(i.id));
          return itemNext;
        });
      } else {
        next.add(catName);
        // Select items belonging to this category
        setSelectedItemIds((itemPrev) => {
          const itemNext = new Set(itemPrev);
          parsedData?.items
            .filter((i) => i.groupTitle === catName)
            .forEach((i) => itemNext.add(i.id));
          return itemNext;
        });
      }
      return next;
    });
  };

  const handleSelectAllCategories = () => {
    if (!parsedData) return;
    const all = new Set(parsedData.categories.map((c) => c.name));
    setSelectedCategories(all);
    setSelectedItemIds(new Set(parsedData.items.map((i) => i.id)));
  };

  const handleDeselectAllCategories = () => {
    setSelectedCategories(new Set());
    setSelectedItemIds(new Set());
  };

  // Toggle individual item
  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered items based on active type filter, selected categories, and search query
  const displayedItems = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.items.filter((item) => {
      // Type match
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      // Category match
      if (selectedCategories.size > 0 && !selectedCategories.has(item.groupTitle)) return false;
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCat = item.groupTitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }
      return true;
    });
  }, [parsedData, typeFilter, selectedCategories, searchQuery]);

  // Select / Deselect all visible
  const handleSelectAllVisible = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      displayedItems.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const handleDeselectAllVisible = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      displayedItems.forEach((i) => next.delete(i.id));
      return next;
    });
  };

  // Execute import of selected items into MasterTV catalog
  const handleExecuteImport = async () => {
    if (!parsedData || selectedItemIds.size === 0) return;

    const itemsToImport = parsedData.items.filter((i) => selectedItemIds.has(i.id));
    if (itemsToImport.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    const existingContents = AdminService.getContents();
    const newAdminItems: AdminContentItem[] = [];
    let importedCount = 0;

    for (let i = 0; i < itemsToImport.length; i++) {
      const item = itemsToImport[i];
      const sourceQuality: 'FHD' | 'HD' = item.quality === 'FHD' || item.quality === '4K' ? 'FHD' : 'HD';

      // Convert ParsedPlaylistItem to AdminContentItem
      const adminItem: AdminContentItem = {
        id: `${item.type}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        type: item.type,
        title: item.cleanTitle || item.title,
        tagline: item.type === 'channel' ? 'Transmissao Ao Vivo' : '',
        rating: item.type === 'channel' ? 9.0 : 8.0,
        duration: item.type === 'channel' ? 'Ao Vivo' : item.type === 'movie' ? '1h 50m' : '1 Temporada',
        year: item.year || 2026,
        contentRating: '14',
        genres: [item.groupTitle || 'Geral'],
        posterUrl: item.logo || '',
        backdropUrl: item.logo || '',
        streamUrl: item.streamUrl,
        backupStreamUrl: '',
        sourcesList: [
          {
            id: 1,
            name: `Fonte 1 (${sourceQuality})`,
            quality: sourceQuality,
            streamUrl: item.streamUrl,
            backupStreamUrl: '',
          },
        ],
        description:
          item.type === 'channel'
            ? `Transmissao ao vivo do canal ${item.cleanTitle || item.title}.`
            : `Assista ${item.cleanTitle || item.title} em alta definicao no MasterTV.`,
        director: '',
        writers: '',
        production: 'MasterTV',
        channelNumber: item.type === 'channel' ? existingContents.length + newAdminItems.length + 1 : undefined,
      };

      newAdminItems.push(adminItem);
      importedCount++;

      // Update progress every 50 items
      if (i % 50 === 0 || i === itemsToImport.length - 1) {
        setImportProgress(Math.round(((i + 1) / itemsToImport.length) * 100));
        // Small yield to keep UI responsive
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    // Merge and save to storage and dispatch event
    const mergedList = [...newAdminItems, ...existingContents];
    AdminService.saveContentsLocally(mergedList);

    setIsImporting(false);
    setImportSuccessMsg(`Sucesso! ${importedCount} conteudos foram importados para o catalogo do MasterTV.`);
    onImportSuccess(importedCount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0b0e14] border border-cyan-500/20 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-cyan-950/30 via-transparent to-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                <span>Importador de Listas M3U & IPTV</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Saimon-TV / Xtream
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Puxe canais ao vivo, filmes e series completos da sua lista e selecione o que deseja importar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* STEP 1: INPUT SOURCE SELECTION */}
          {!parsedData && (
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-fit">
                <button
                  onClick={() => setInputMode('url')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'url'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>URL da Lista M3U</span>
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'file'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Arquivo .M3U</span>
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Colar Texto M3U</span>
                </button>
              </div>

              {/* Mode: URL */}
              {inputMode === 'url' && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Link / URL Completa da Lista M3U (Saimon-TV ou Xtream Codes):
                    </label>
                    <input
                      type="url"
                      placeholder="Ex: http://servidor.tv:8080/get.php?username=XXX&password=YYY&type=m3u_plus"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-[#07090e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-slate-400">
                      💡 <strong>Dica:</strong> Se o seu provedor bloquear requisicao direta (CORS), voce pode baixar o arquivo .m3u e usar a aba <strong>Upload Arquivo .M3U</strong>!
                    </p>
                    <button
                      onClick={handleFetchUrl}
                      disabled={isLoading || !urlInput.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Baixando e Processando...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Carregar Lista M3U</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Mode: File Upload */}
              {inputMode === 'file' && (
                <div className="p-8 rounded-2xl bg-white/5 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 flex flex-col items-center justify-center text-center gap-3 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Carregue seu arquivo .M3U ou .M3U8</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedFileName ? `Arquivo selecionado: ${selectedFileName}` : 'Clique para selecionar o arquivo baixado do seu servidor IPTV.'}
                    </p>
                  </div>
                  <label className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all">
                    Selecionar Arquivo .M3U
                    <input
                      type="file"
                      accept=".m3u,.m3u8,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500">100% seguro e sem bloqueios de CORS</span>
                </div>
              )}

              {/* Mode: Paste Text */}
              {inputMode === 'text' && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <label className="block text-xs font-bold text-slate-300">
                    Cole as linhas da sua lista M3U abaixo:
                  </label>
                  <textarea
                    rows={8}
                    placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo=&quot;...&quot; group-title=&quot;CANAIS | ABERTOS&quot;,GLOBO SP&#10;http://...&#10;#EXTINF:-1 group-title=&quot;FILMES&quot;,Vingadores (2019)&#10;http://...mp4"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full bg-[#07090e] border border-white/10 rounded-xl p-3 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleProcessText(textInput)}
                      disabled={isLoading || !textInput.trim()}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      {isLoading ? 'Processando...' : 'Processar Conteudo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Ops! Nao foi possivel carregar a lista:</p>
                <p className="text-slate-300">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {importSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <p className="font-bold">{importSuccessMsg}</p>
            </div>
          )}

          {/* STEP 2: PARSED PLAYLIST DASHBOARD & SELECTOR */}
          {parsedData && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Summary Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Total Encontrado</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{parsedData.totalCount}</p>
                  </div>
                  <Sparkles className="w-6 h-6 text-cyan-400 opacity-60" />
                </div>

                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-red-300 uppercase">Canais Ao Vivo</p>
                    <p className="text-xl sm:text-2xl font-black text-red-400">{parsedData.channels.length}</p>
                  </div>
                  <Tv className="w-6 h-6 text-red-400 opacity-60" />
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-cyan-300 uppercase">Filmes (VOD)</p>
                    <p className="text-xl sm:text-2xl font-black text-cyan-400">{parsedData.movies.length}</p>
                  </div>
                  <Film className="w-6 h-6 text-cyan-400 opacity-60" />
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-purple-300 uppercase">Series (VOD)</p>
                    <p className="text-xl sm:text-2xl font-black text-purple-400">{parsedData.series.length}</p>
                  </div>
                  <Clapperboard className="w-6 h-6 text-purple-400 opacity-60" />
                </div>
              </div>

              {/* Action Buttons to Switch / Reload List */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filtrar por tipo:</span>
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos ({parsedData.totalCount})
                    </button>
                    <button
                      onClick={() => setTypeFilter('channel')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'channel' ? 'bg-red-500 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Canais ({parsedData.channels.length})
                    </button>
                    <button
                      onClick={() => setTypeFilter('movie')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'movie' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Filmes ({parsedData.movies.length})
                    </button>
                    <button
                      onClick={() => setTypeFilter('series')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'series' ? 'bg-purple-500 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Series ({parsedData.series.length})
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setParsedData(null);
                    setImportSuccessMsg(null);
                    setErrorMsg(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                >
                  🔄 Trocar de Lista M3U
                </button>
              </div>

              {/* Category Filter Pills Accordion / Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      Categorias da Lista ({selectedCategories.size} de {parsedData.categories.length} ativas):
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllCategories}
                      className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={handleDeselectAllCategories}
                      className="text-[11px] font-bold text-slate-400 hover:underline cursor-pointer"
                    >
                      Desmarcar Todas
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-1.5 scrollbar-thin">
                  {parsedData.categories.map((cat) => {
                    const isSelected = selectedCategories.has(cat.name);
                    return (
                      <button
                        key={cat.name}
                        onClick={() => toggleCategory(cat.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-white/5 text-slate-500 border border-white/5 hover:border-white/10'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-3 h-3 text-cyan-400" /> : <Square className="w-3 h-3" />}
                        <span className="max-w-[200px] truncate">{cat.name}</span>
                        <span className="text-[10px] opacity-60">({cat.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items Search and Mass Selection Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllVisible}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-all"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Marcar Visiveis</span>
                  </button>
                  <button
                    onClick={handleDeselectAllVisible}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-all"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Desmarcar Visiveis</span>
                  </button>

                  <span className="text-xs text-slate-400 ml-2">
                    Exibindo <strong>{displayedItems.length}</strong> de {parsedData.totalCount} itens
                  </span>
                </div>

                {/* Search in Playlist */}
                <div className="relative min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome de canal ou filme..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#07090e] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Preview Table of Items */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#07090e]">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#0d121a] border-b border-white/10 text-slate-400 font-bold z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">Sel</th>
                        <th className="py-2.5 px-3 w-14">Logo</th>
                        <th className="py-2.5 px-3">Titulo / Canal</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3">Qualidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {displayedItems.slice(0, 300).map((item) => {
                        const isSelected = selectedItemIds.has(item.id);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="py-2 px-3 text-center">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-cyan-400 mx-auto" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600 mx-auto" />
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {item.logo ? (
                                <img
                                  src={item.logo}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-contain bg-white/5 p-0.5 border border-white/10"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-[10px]">
                                  {item.type === 'channel' ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <p className="font-bold text-white truncate max-w-xs">{item.cleanTitle || item.title}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-sm">{item.streamUrl}</p>
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.type === 'channel'
                                    ? 'bg-red-500/20 text-red-300'
                                    : item.type === 'movie'
                                    ? 'bg-cyan-500/20 text-cyan-300'
                                    : 'bg-purple-500/20 text-purple-300'
                                }`}
                              >
                                {item.type === 'channel' ? 'CANAL' : item.type === 'movie' ? 'FILME' : 'SERIE'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                              {item.groupTitle}
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                                {item.quality}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {displayedItems.length > 300 && (
                  <div className="p-2 text-center text-[11px] text-slate-500 border-t border-white/10 bg-white/5">
                    Mostrando os primeiros 300 itens na previa. Todos os {selectedItemIds.size} itens selecionados serao importados!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-5 sm:p-6 border-t border-white/10 bg-[#07090e]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {parsedData ? (
                <>
                  Selecionados para importacao:{' '}
                  <strong className="text-cyan-400 font-black text-sm">{selectedItemIds.size} itens</strong>
                </>
              ) : (
                'Carregue uma lista para iniciar a selecao'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>

            {parsedData && (
              <button
                onClick={handleExecuteImport}
                disabled={isImporting || selectedItemIds.size === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Importando... ({importProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[3]" />
                    <span>Importar {selectedItemIds.size} Itens para o Catalogo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

