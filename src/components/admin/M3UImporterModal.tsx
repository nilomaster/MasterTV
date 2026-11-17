// MasterTV Admin M3U & IPTV Playlist Importer Modal
// Supports Saimon-TV, Xtream Codes, and Generic M3U / M3U8 Playlists
// In-memory caching ensures 247k items load once and persist across modal sessions
// Incremental import preserves already saved channels and movies
// Strictly ASCII comments only as per project guidelines

import React, { useState, useMemo, useEffect } from 'react';
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
  Database,
  Check,
  Plus,
} from 'lucide-react';
import {
  parseAdvancedM3U,
  fetchAdvancedM3U,
  type AdvancedM3UResult,
  type ParsedPlaylistItem,
} from '../../services/m3uParser';
import { AdminService } from '../../services/adminService';
import type { AdminContentItem } from '../../types/admin';

// Helper to generate deterministic content ID from type, title, and stream URL
function getDeterministicContentId(type: string, title: string, streamUrl: string): string {
  let hash = 0;
  const str = `${type}_${title.toLowerCase().trim()}_${streamUrl.trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `${type}_${Math.abs(hash).toString(36)}`;
}

// Module-level in-memory cache so reopening the modal preserves the loaded 247k playlist
let cachedM3UData: AdvancedM3UResult | null = null;
let cachedM3UUrl: string = '';

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
  const [urlInput, setUrlInput] = useState<string>(() => cachedM3UUrl);
  const [textInput, setTextInput] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Processing state initialized with in-memory cache
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<AdvancedM3UResult | null>(() => cachedM3UData);

  // Filter and selection state (starts with 0 selected so user can cherry-pick)
  const [typeFilter, setTypeFilter] = useState<'all' | 'channel' | 'movie' | 'series'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  // Default to FALSE so incremental imports do not wipe previously imported content
  const [shouldClearBeforeImport, setShouldClearBeforeImport] = useState<boolean>(false);

  // Existing database content tracking for visual status and protection
  const [existingContents, setExistingContents] = useState<AdminContentItem[]>(() => {
    return AdminService.getContents();
  });
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

  // Import execution state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importProgressText, setImportProgressText] = useState<string>('');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [isImportCompleted, setIsImportCompleted] = useState<boolean>(false);

  // Sync existing contents when modal opens to ensure up-to-date catalog check
  useEffect(() => {
    if (isOpen) {
      AdminService.fetchRemoteContents()
        .then((remote) => {
          if (remote && Array.isArray(remote) && remote.length > 0) {
            setExistingContents(remote);
          }
        })
        .catch(() => {
          setExistingContents(AdminService.getContents());
        });
    }
  }, [isOpen]);

  // Lookup map of already saved items by stream URL and lowercased title
  const savedUrlMap = useMemo(() => {
    const map = new Map<string, AdminContentItem>();
    existingContents.forEach((c) => {
      if (c && c.streamUrl) map.set(c.streamUrl.trim(), c);
      if (c && c.title) map.set(c.title.toLowerCase().trim(), c);
    });
    return map;
  }, [existingContents]);

  // Check if an item is already saved in catalog
  const isItemAlreadyInCatalog = (item: ParsedPlaylistItem): boolean => {
    if (item.streamUrl && savedUrlMap.has(item.streamUrl.trim())) return true;
    if (item.title && savedUrlMap.has(item.title.toLowerCase().trim())) return true;
    if (item.cleanTitle && savedUrlMap.has(item.cleanTitle.toLowerCase().trim())) return true;
    return false;
  };

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

      cachedM3UData = result;
      setParsedData(result);
      // Start with 0 selected so the user can choose freely without mass overwriting
      setSelectedCategories(new Set());
      setSelectedItemIds(new Set());
      setTypeFilter('all');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar lista M3U.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for URL input fetch
  const handleFetchUrl = async () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setErrorMsg('Por favor, informe a URL da lista M3U.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setImportSuccessMsg(null);

    try {
      const result = await fetchAdvancedM3U(cleanUrl);
      if (result.totalCount === 0) {
        throw new Error('Nenhum canal ou video encontrado na lista informada.');
      }
      cachedM3UData = result;
      cachedM3UUrl = cleanUrl;
      setParsedData(result);
      // Start with 0 selected so the user can cherry-pick content
      setSelectedCategories(new Set());
      setSelectedItemIds(new Set());
      setTypeFilter('all');
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Nao foi possivel baixar a lista via URL. Se o servidor de origem bloquear acesso direto (CORS), baixe o arquivo .m3u no computador e use a opcao "Upload Arquivo .M3U"!'
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

  // Quick 1-click addition of a single channel or movie into database
  const handleQuickAddSingleItem = async (item: ParsedPlaylistItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setAddingItemId(item.id);
      const sourceQuality: 'FHD' | 'HD' = item.quality === 'FHD' || item.quality === '4K' ? 'FHD' : 'HD';
      const cleanQualityLabel = sourceQuality === 'FHD' ? '1080P - FHD' : '720P - HD';

      const adminItem: AdminContentItem = {
        id: getDeterministicContentId(item.type, item.cleanTitle || item.title, item.streamUrl),
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
            name: cleanQualityLabel,
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
        channelNumber: item.type === 'channel' ? existingContents.length + 1 : undefined,
      };

      // Add to local catalog state immediately
      const updated = [...existingContents.filter((c) => c.id !== adminItem.id), adminItem];
      setExistingContents(updated);
      AdminService.saveContentsLocally(updated);

      // Persist to MySQL remote database
      await AdminService.saveBatchRemoteContents([adminItem]);
      onImportSuccess(1);
    } catch (err: any) {
      setErrorMsg(`Erro ao adicionar item: ${err?.message || 'Falha de comunicacao com o banco.'}`);
    } finally {
      setAddingItemId(null);
    }
  };

  // Map of category name to item IDs for instant O(1) toggling without scanning 250k items
  const categoryItemIdsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!parsedData) return map;
    for (let i = 0; i < parsedData.items.length; i++) {
      const item = parsedData.items[i];
      const cat = item.groupTitle || 'Geral';
      const arr = map.get(cat);
      if (arr) {
        arr.push(item.id);
      } else {
        map.set(cat, [item.id]);
      }
    }
    return map;
  }, [parsedData]);

  // Categories filtered by the currently active typeFilter
  const displayedCategories = useMemo(() => {
    if (!parsedData) return [];
    if (typeFilter === 'all') return parsedData.categories;
    return parsedData.categories.filter((cat) => cat.type === typeFilter);
  }, [parsedData, typeFilter]);

  // Toggle category in filter
  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      const isCurrentlySelected = next.has(catName);
      const ids = categoryItemIdsMap.get(catName) || [];

      if (isCurrentlySelected) {
        next.delete(catName);
        setSelectedItemIds((itemPrev) => {
          const itemNext = new Set(itemPrev);
          for (let i = 0; i < ids.length; i++) itemNext.delete(ids[i]);
          return itemNext;
        });
      } else {
        next.add(catName);
        setSelectedItemIds((itemPrev) => {
          const itemNext = new Set(itemPrev);
          for (let i = 0; i < ids.length; i++) itemNext.add(ids[i]);
          return itemNext;
        });
      }
      return next;
    });
  };

  // Select all categories and items of the current active type (or all if typeFilter is 'all')
  const handleSelectAllCategories = () => {
    if (!parsedData) return;
    if (typeFilter === 'all') {
      const all = new Set(parsedData.categories.map((c) => c.name));
      setSelectedCategories(all);
      setSelectedItemIds(new Set(parsedData.items.map((i) => i.id)));
      return;
    }
    const catsForType = displayedCategories.map((c) => c.name);
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      catsForType.forEach((c) => next.add(c));
      return next;
    });
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < catsForType.length; i++) {
        const ids = categoryItemIdsMap.get(catsForType[i]) || [];
        for (let j = 0; j < ids.length; j++) next.add(ids[j]);
      }
      return next;
    });
  };

  // Deselect all categories and items of the current active type
  const handleDeselectAllCategories = () => {
    if (!parsedData) return;
    if (typeFilter === 'all') {
      setSelectedCategories(new Set());
      setSelectedItemIds(new Set());
      return;
    }
    const catsForType = displayedCategories.map((c) => c.name);
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      catsForType.forEach((c) => next.delete(c));
      return next;
    });
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < catsForType.length; i++) {
        const ids = categoryItemIdsMap.get(catsForType[i]) || [];
        for (let j = 0; j < ids.length; j++) next.delete(ids[j]);
      }
      return next;
    });
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

  // Count selected items by type
  const selectedCounts = useMemo(() => {
    let channels = 0;
    let movies = 0;
    let series = 0;
    if (!parsedData) return { channels, movies, series };
    for (let i = 0; i < parsedData.items.length; i++) {
      const it = parsedData.items[i];
      if (selectedItemIds.has(it.id)) {
        if (it.type === 'channel') channels++;
        else if (it.type === 'movie') movies++;
        else if (it.type === 'series') series++;
      }
    }
    return { channels, movies, series };
  }, [parsedData, selectedItemIds]);

  // Mass toggle entire category type (channels, movies, or series)
  const toggleTypeSelection = (type: 'channel' | 'movie' | 'series') => {
    if (!parsedData) return;
    const items = parsedData[type === 'channel' ? 'channels' : type === 'movie' ? 'movies' : 'series'];
    const cats = parsedData.categories.filter((c) => c.type === type).map((c) => c.name);
    const count = type === 'channel' ? selectedCounts.channels : type === 'movie' ? selectedCounts.movies : selectedCounts.series;
    const isSelected = count > 0;

    if (isSelected) {
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        cats.forEach((c) => next.delete(c));
        return next;
      });
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        items.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        cats.forEach((c) => next.add(c));
        return next;
      });
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        items.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  // Filtered items based on active type filter, selected categories, and search query
  const displayedItems = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.items.filter((item) => {
      // Type match
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      // Category match: only filter by category if user explicitly selected one or more categories
      if (selectedCategories.size > 0 && !selectedCategories.has(item.groupTitle)) return false;
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q) || (item.cleanTitle && item.cleanTitle.toLowerCase().includes(q));
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
    setImportProgressText(shouldClearBeforeImport ? 'Limpando catalogo antigo no banco de dados...' : 'Preparando itens para o catalogo...');
    setErrorMsg(null);
    setImportSuccessMsg(null);
    setIsImportCompleted(false);

    try {
      let currentExisting: AdminContentItem[] = [];
      if (shouldClearBeforeImport) {
        await AdminService.clearRemoteContents();
        AdminService.saveContentsLocally([]);
      } else {
        try {
          currentExisting = await AdminService.fetchRemoteContents();
        } catch {
          currentExisting = AdminService.getContents();
        }
      }

      const newAdminItems: AdminContentItem[] = [];
      let importedCount = 0;

      for (let i = 0; i < itemsToImport.length; i++) {
        const item = itemsToImport[i];
        const sourceQuality: 'FHD' | 'HD' = item.quality === 'FHD' || item.quality === '4K' ? 'FHD' : 'HD';
        const cleanQualityLabel = sourceQuality === 'FHD' ? '1080P - FHD' : '720P - HD';

        // Convert ParsedPlaylistItem to AdminContentItem with deterministic ID
        const adminItem: AdminContentItem = {
          id: getDeterministicContentId(item.type, item.cleanTitle || item.title, item.streamUrl),
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
              name: cleanQualityLabel,
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
          channelNumber: item.type === 'channel' ? currentExisting.length + newAdminItems.length + 1 : undefined,
        };

        newAdminItems.push(adminItem);
        importedCount++;

        // Update progress every 200 items for faster processing
        if (i % 200 === 0 || i === itemsToImport.length - 1) {
          const prepPct = Math.round(((i + 1) / itemsToImport.length) * 100);
          setImportProgress(prepPct);
          setImportProgressText(`Preparando catalogo (${i + 1}/${itemsToImport.length})...`);
          // Small yield to keep UI responsive
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      // Merge with deduplication preserving existing contents and appending new items
      const contentMap = new Map<string, AdminContentItem>();
      currentExisting.forEach((c) => {
        if (c && c.id) contentMap.set(c.id, c);
      });
      newAdminItems.forEach((c) => {
        if (c && c.id) contentMap.set(c.id, c);
      });
      const mergedList = Array.from(contentMap.values());
      AdminService.saveContentsLocally(mergedList);
      setExistingContents(mergedList);

      // Persist to remote MySQL database in safe batches of 50
      setImportProgressText('Iniciando gravacao no banco de dados MySQL...');
      const saveResult = await AdminService.saveBatchRemoteContents(newAdminItems, (pct, currentBatch, totalBatches) => {
        setImportProgress(pct);
        setImportProgressText(`Gravando no MySQL: lote ${currentBatch} de ${totalBatches} (${pct}%)...`);
      });

      if (!saveResult.success || saveResult.totalSaved === 0) {
        throw new Error(saveResult.message || 'Falha ao salvar no banco de dados MySQL.');
      }

      setIsImportCompleted(true);
      setImportSuccessMsg(`Sucesso! ${saveResult.totalSaved} conteudos foram salvos permanentemente no banco de dados MySQL.`);
      onImportSuccess(saveResult.totalSaved);
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar no banco de dados: ${err?.message || 'Falha de conexao com a hospedagem.'}`);
    } finally {
      setIsImporting(false);
    }
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
                Puxe canais ao vivo, filmes e series completos da sua lista e selecione o que deseja importar com seguranca.
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
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        cachedM3UUrl = e.target.value;
                      }}
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
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-300 text-xs animate-in fade-in shadow-lg shadow-emerald-950/40">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <p className="font-bold">{importSuccessMsg}</p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20"
              >
                Concluir e Ver no Catalogo
              </button>
            </div>
          )}

          {/* STEP 2: PARSED PLAYLIST DASHBOARD & SELECTOR */}
          {parsedData && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Protected Catalog Awareness Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      Catálogo Protegido: {existingContents.length} {existingContents.length === 1 ? 'conteúdo já salvo' : 'conteúdos já salvos'} no Banco MySQL
                    </p>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Esta lista com <strong>{parsedData.totalCount.toLocaleString('pt-BR')} itens</strong> está carregada na memória. Você pode ir escolhendo e adicionando os conteúdos aos poucos — seus canais já cadastrados (ex: Band, Record) <strong>NUNCA</strong> serão apagados!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                    ✓ Modo Seguro Ativo
                  </span>
                </div>
              </div>

              {/* Summary Metric Badges with One-Click Quick Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Total na Lista</p>
                      <p className="text-xl sm:text-2xl font-black text-white">{parsedData.totalCount.toLocaleString('pt-BR')}</p>
                    </div>
                    <Sparkles className="w-6 h-6 text-cyan-400 opacity-60" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 font-medium">
                    {selectedItemIds.size} selecionados no total
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedCounts.channels > 0 ? 'bg-red-500/15 border-red-500/40 shadow-lg shadow-red-950/30' : 'bg-red-500/5 border-red-500/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-red-300 uppercase">Canais Ao Vivo</p>
                      <p className="text-xl sm:text-2xl font-black text-red-400">{parsedData.channels.length.toLocaleString('pt-BR')}</p>
                    </div>
                    <Tv className="w-6 h-6 text-red-400 opacity-60" />
                  </div>
                  <button
                    onClick={() => toggleTypeSelection('channel')}
                    className={`mt-2.5 py-1 px-2.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      selectedCounts.channels > 0
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-red-300 border border-red-500/20'
                    }`}
                  >
                    {selectedCounts.channels > 0 ? `✓ ${selectedCounts.channels} Marcados (Desmarcar)` : '+ Marcar Todos os Canais'}
                  </button>
                </div>

                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedCounts.movies > 0 ? 'bg-cyan-500/15 border-cyan-500/40 shadow-lg shadow-cyan-950/30' : 'bg-cyan-500/5 border-cyan-500/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-cyan-300 uppercase">Filmes (VOD)</p>
                      <p className="text-xl sm:text-2xl font-black text-cyan-400">{parsedData.movies.length.toLocaleString('pt-BR')}</p>
                    </div>
                    <Film className="w-6 h-6 text-cyan-400 opacity-60" />
                  </div>
                  <button
                    onClick={() => toggleTypeSelection('movie')}
                    className={`mt-2.5 py-1 px-2.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      selectedCounts.movies > 0
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/20'
                    }`}
                  >
                    {selectedCounts.movies > 0 ? `✓ ${selectedCounts.movies} Marcados (Desmarcar)` : '+ Marcar Todos os Filmes'}
                  </button>
                </div>

                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedCounts.series > 0 ? 'bg-purple-500/15 border-purple-500/40 shadow-lg shadow-purple-950/30' : 'bg-purple-500/5 border-purple-500/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-purple-300 uppercase">Series (VOD)</p>
                      <p className="text-xl sm:text-2xl font-black text-purple-400">{parsedData.series.length.toLocaleString('pt-BR')}</p>
                    </div>
                    <Clapperboard className="w-6 h-6 text-purple-400 opacity-60" />
                  </div>
                  <button
                    onClick={() => toggleTypeSelection('series')}
                    className={`mt-2.5 py-1 px-2.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      selectedCounts.series > 0
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20'
                    }`}
                  >
                    {selectedCounts.series > 0 ? `✓ ${selectedCounts.series} Marcados (Desmarcar)` : '+ Marcar Todas as Series'}
                  </button>
                </div>
              </div>

              {/* Option to Replace / Clear Database Before Import */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shouldClearBeforeImport}
                  onChange={(e) => setShouldClearBeforeImport(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-[#07090e] border-white/20 cursor-pointer"
                />
                <div>
                  <span className="font-bold">Substituir catálogo existente (Limpar banco MySQL antes de salvar)</span>
                  <p className="text-[11px] text-amber-300/80">
                    {shouldClearBeforeImport
                      ? `ATENÇÃO: Todo o catálogo atual (${existingContents.length} conteúdos) será apagado antes de salvar os itens selecionados.`
                      : `Desmarcado (Recomendado): Os itens selecionados serão somados mantendo os ${existingContents.length} já salvos sem apagar nada.`}
                  </p>
                </div>
              </label>

              {/* Action Buttons to Switch / Reload List */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filtrar por tipo:</span>
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos ({parsedData.totalCount.toLocaleString('pt-BR')})
                    </button>
                    <button
                      onClick={() => setTypeFilter('channel')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'channel' ? 'bg-red-500 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Canais ({parsedData.channels.length.toLocaleString('pt-BR')})
                    </button>
                    <button
                      onClick={() => setTypeFilter('movie')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'movie' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Filmes ({parsedData.movies.length.toLocaleString('pt-BR')})
                    </button>
                    <button
                      onClick={() => setTypeFilter('series')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === 'series' ? 'bg-purple-500 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Series ({parsedData.series.length.toLocaleString('pt-BR')})
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    cachedM3UData = null;
                    setParsedData(null);
                    setImportSuccessMsg(null);
                    setErrorMsg(null);
                    setSelectedItemIds(new Set());
                    setSelectedCategories(new Set());
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer self-start sm:self-auto"
                >
                  🔄 Trocar de Lista M3U / Carregar Nova
                </button>
              </div>

              {/* Category Filter Pills Accordion / Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      {typeFilter === 'movie'
                        ? 'Categorias de Filmes'
                        : typeFilter === 'series'
                        ? 'Categorias de Series'
                        : typeFilter === 'channel'
                        ? 'Categorias de Canais Ao Vivo'
                        : 'Todas as Categorias'}{' '}
                      ({selectedCategories.size === 0 ? 'Todas ativas' : `${displayedCategories.filter((c) => selectedCategories.has(c.name)).length} de ${displayedCategories.length} selecionadas`}):
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllCategories}
                      className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
                    >
                      Marcar Todas ({typeFilter === 'movie' ? 'Filmes' : typeFilter === 'series' ? 'Series' : typeFilter === 'channel' ? 'Canais' : 'Tudo'})
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={handleDeselectAllCategories}
                      className="text-[11px] font-bold text-slate-400 hover:underline cursor-pointer"
                    >
                      Desmarcar Filtro
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-1.5 scrollbar-thin">
                  {displayedCategories.map((cat) => {
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
                    Exibindo <strong>{displayedItems.length}</strong> de {parsedData.totalCount.toLocaleString('pt-BR')} itens
                  </span>
                </div>

                {/* Search in Playlist */}
                <div className="relative min-w-[280px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar canal ou filme (ex: BAND, RECORD, GLOBO)..."
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
                        <th className="py-2.5 px-3 text-right">Ação Direta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {displayedItems.slice(0, 300).map((item) => {
                        const isSelected = selectedItemIds.has(item.id);
                        const isAlreadySaved = isItemAlreadyInCatalog(item);
                        const isCurrentlyAdding = addingItemId === item.id;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`cursor-pointer transition-colors ${
                              isAlreadySaved
                                ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                                : isSelected
                                ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                                : 'hover:bg-white/5'
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
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white truncate max-w-xs">{item.cleanTitle || item.title}</p>
                                {isAlreadySaved && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                                    Salvo
                                  </span>
                                )}
                              </div>
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
                            <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              {isAlreadySaved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] whitespace-nowrap shadow-sm">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>No Catálogo</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickAddSingleItem(item, e)}
                                  disabled={isCurrentlyAdding}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                                >
                                  {isCurrentlyAdding ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                      <span>Salvando...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>+ Adicionar</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {displayedItems.length > 300 && (
                  <div className="p-2.5 text-center text-[11px] text-slate-400 border-t border-white/10 bg-white/5 flex items-center justify-center gap-2">
                    <span>Exibindo os primeiros 300 itens na prévia para máxima velocidade. Use a busca acima para encontrar qualquer canal ou filme específico!</span>
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
                  Selecionados para salvar em lote:{' '}
                  <strong className="text-cyan-400 font-black text-sm">{selectedItemIds.size} itens</strong>
                  {(selectedCounts.channels > 0 || selectedCounts.movies > 0 || selectedCounts.series > 0) && (
                    <span className="text-slate-400 ml-1.5 font-medium">
                      ({selectedCounts.channels > 0 && <span className="text-red-400 font-bold">{selectedCounts.channels} canais</span>}
                      {selectedCounts.channels > 0 && (selectedCounts.movies > 0 || selectedCounts.series > 0) && ', '}
                      {selectedCounts.movies > 0 && <span className="text-cyan-400 font-bold">{selectedCounts.movies} filmes</span>}
                      {selectedCounts.movies > 0 && selectedCounts.series > 0 && ', '}
                      {selectedCounts.series > 0 && <span className="text-purple-400 font-bold">{selectedCounts.series} series</span>})
                    </span>
                  )}
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
                onClick={isImportCompleted ? onClose : handleExecuteImport}
                disabled={isImporting || (!isImportCompleted && selectedItemIds.size === 0)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl transition-all cursor-pointer disabled:opacity-50 ${
                  isImportCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
                }`}
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{importProgressText || `Salvando no Banco MySQL... (${importProgress}%)`}</span>
                  </>
                ) : isImportCompleted ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Concluir e Ir para o Catalogo</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {selectedItemIds.size > 0
                        ? `+ Adicionar ${selectedItemIds.size} Itens ao Catálogo (Mantendo os ${existingContents.length} já salvos)`
                        : 'Selecione itens ou use "+ Adicionar"'}
                    </span>
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
