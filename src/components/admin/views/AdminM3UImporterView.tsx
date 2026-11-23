// MasterTV Dedicated Full-Page M3U Importer View (Etapa 11B.1)
// Integrated into existing AdminSidebar & AdminHeader layout (no modal container)
// Desktop two-column layout, responsive tablet/mobile single-column stack
// Strictly ASCII comments only

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Upload,
  Link as LinkIcon,
  FileText,
  CheckSquare,
  Square,
  Search,
  Tv,
  Film,
  Clapperboard,
  AlertCircle,
  CheckCircle2,
  Filter,
  Database,
  Check,
  Eye,
  EyeOff,
  ShieldAlert,
  RefreshCw,
  SlidersHorizontal,
  ScanSearch,
  Trash2,
  FolderTree,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  parseAdvancedM3U,
  fetchAdvancedM3U,
  isAdultCategoryName,
  type AdvancedM3UResult,
  type ParsedPlaylistItem,
  type M3UForcedContentType,
} from '../../../services/m3uParser';
import { AdminService } from '../../../services/adminService';
import type { AdminContentItem } from '../../../types/admin';

function getDeterministicContentId(type: string, title: string, streamUrl: string): string {
  let hash = 0;
  const str = `${type}_${title.toLowerCase().trim()}_${streamUrl.trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `${type}_${Math.abs(hash).toString(36)}`;
}

function getSafePreviewHost(url?: string): string {
  if (!url) return 'Fonte M3U';
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname || 'Fonte M3U';
  } catch {
    return 'Fonte M3U';
  }
}

interface ImportReport {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  durationSec: number;
}

// Module-level in-memory cache preserves 247k+ parsed items while navigating admin tabs
let cachedM3UData: AdvancedM3UResult | null = null;
let cachedM3UUrl: string = '';

interface AdminM3UImporterViewProps {
  existingContents: AdminContentItem[];
  onImportSuccess: () => Promise<void> | void;
  onGoToCatalog: () => void;
}

export const AdminM3UImporterView: React.FC<AdminM3UImporterViewProps> = ({
  existingContents: propExistingContents,
  onImportSuccess,
  onGoToCatalog,
}) => {
  const reportCardRef = useRef<HTMLDivElement | null>(null);

  // Source & pre-analysis content type
  const [inputMode, setInputMode] = useState<'url' | 'file' | 'text'>('url');
  const [forcedType, setForcedType] = useState<M3UForcedContentType>('auto');
  const [urlInput, setUrlInput] = useState<string>(() => cachedM3UUrl);
  const [textInput, setTextInput] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Parsing state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<AdvancedM3UResult | null>(() => cachedM3UData);

  // Filters & selections
  const [typeFilter, setTypeFilter] = useState<'all' | 'channel' | 'movie' | 'series'>('all');
  const [syncFilter, setSyncFilter] = useState<'all' | 'unimported' | 'imported'>('all');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showItemPreview, setShowItemPreview] = useState<boolean>(false);

  // Advanced options
  const [updateExistingContents, setUpdateExistingContents] = useState<boolean>(false);
  const [identifyAdultCategories, setIdentifyAdultCategories] = useState<boolean>(true);
  const [hideAdultCategories, setHideAdultCategories] = useState<boolean>(false);

  // Separate immediate two-step destructive catalog clear (never silently armed on Import)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [clearConfirmText, setClearConfirmText] = useState<string>('');
  const [isClearingNow, setIsClearingNow] = useState<boolean>(false);
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);

  // Local catalog snapshot synced with DB (derived cleanly without setState in effect)
  const [localOverrideContents, setLocalOverrideContents] = useState<AdminContentItem[] | null>(null);
  const existingContents = useMemo<AdminContentItem[]>(() => {
    if (localOverrideContents !== null) return localOverrideContents;
    return propExistingContents.length > 0 ? propExistingContents : AdminService.getContents();
  }, [localOverrideContents, propExistingContents]);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

  // Import progress & report
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importProgressText, setImportProgressText] = useState<string>('');
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isImportCompleted, setIsImportCompleted] = useState<boolean>(false);

  // Deduplication lookup maps
  const { savedByUrlMap, savedByTypeTitleMap } = useMemo(() => {
    const byUrl = new Map<string, AdminContentItem>();
    const byTypeTitle = new Map<string, AdminContentItem>();
    existingContents.forEach((c) => {
      if (!c) return;
      if (c.streamUrl) byUrl.set(c.streamUrl.trim(), c);
      if (c.title) byTypeTitle.set(`${c.type}::${c.title.toLowerCase().trim()}`, c);
    });
    return { savedByUrlMap: byUrl, savedByTypeTitleMap: byTypeTitle };
  }, [existingContents]);

  const findExistingMatch = useCallback(
    (item: ParsedPlaylistItem): AdminContentItem | undefined => {
      if (item.streamUrl && savedByUrlMap.has(item.streamUrl.trim())) {
        return savedByUrlMap.get(item.streamUrl.trim());
      }
      const cleanKey = `${item.type}::${(item.cleanTitle || item.title).toLowerCase().trim()}`;
      if (savedByTypeTitleMap.has(cleanKey)) return savedByTypeTitleMap.get(cleanKey);
      const rawKey = `${item.type}::${item.title.toLowerCase().trim()}`;
      if (savedByTypeTitleMap.has(rawKey)) return savedByTypeTitleMap.get(rawKey);
      return undefined;
    },
    [savedByUrlMap, savedByTypeTitleMap]
  );

  const isItemAlreadyInCatalog = useCallback(
    (item: ParsedPlaylistItem): boolean => Boolean(findExistingMatch(item)),
    [findExistingMatch]
  );

  // Category sync stats & 18+ detection
  const categorySyncStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; synced: number; unsynced: number; isAdult: boolean }>();
    if (!parsedData) return map;
    for (let i = 0; i < parsedData.items.length; i++) {
      const item = parsedData.items[i];
      const cat = item.groupTitle || 'Geral';
      const isSaved = isItemAlreadyInCatalog(item);
      let stat = map.get(cat);
      if (!stat) {
        stat = { total: 0, synced: 0, unsynced: 0, isAdult: isAdultCategoryName(cat) };
        map.set(cat, stat);
      }
      stat.total++;
      if (isSaved) stat.synced++;
      else stat.unsynced++;
    }
    return map;
  }, [parsedData, isItemAlreadyInCatalog]);

  const { totalSyncedInList, totalUnsyncedInList, adultCategoryCount } = useMemo(() => {
    if (!parsedData) return { totalSyncedInList: 0, totalUnsyncedInList: 0, adultCategoryCount: 0 };
    let synced = 0;
    for (let i = 0; i < parsedData.items.length; i++) {
      if (isItemAlreadyInCatalog(parsedData.items[i])) synced++;
    }
    let adultCats = 0;
    categorySyncStatsMap.forEach((v) => {
      if (v.isAdult) adultCats++;
    });
    return {
      totalSyncedInList: synced,
      totalUnsyncedInList: parsedData.items.length - synced,
      adultCategoryCount: adultCats,
    };
  }, [parsedData, isItemAlreadyInCatalog, categorySyncStatsMap]);

  // O(1) category -> item IDs map
  const categoryItemIdsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!parsedData) return map;
    for (let i = 0; i < parsedData.items.length; i++) {
      const item = parsedData.items[i];
      const cat = item.groupTitle || 'Geral';
      const arr = map.get(cat);
      if (arr) arr.push(item.id);
      else map.set(cat, [item.id]);
    }
    return map;
  }, [parsedData]);

  // Header KPIs (real parsed counts when loaded, otherwise real DB counts)
  const kpiStats = useMemo(() => {
    if (parsedData) {
      return {
        channels: parsedData.channels.length,
        movies: parsedData.movies.length,
        series: parsedData.series.length + parsedData.animes.length + parsedData.doramas.length,
        categories: parsedData.categories.length,
        sourceLabel: 'na lista analisada',
      };
    }
    const dbCategories = new Set<string>();
    let channels = 0;
    let movies = 0;
    let series = 0;
    existingContents.forEach((c) => {
      if (c.type === 'channel') {
        channels++;
        if (c.channelCategory) dbCategories.add(c.channelCategory);
      } else if (c.type === 'movie') {
        movies++;
        (c.genres || []).forEach((g) => dbCategories.add(String(g)));
      } else {
        series++;
        (c.genres || []).forEach((g) => dbCategories.add(String(g)));
      }
    });
    return {
      channels,
      movies,
      series,
      categories: dbCategories.size,
      sourceLabel: 'salvos no catalogo',
    };
  }, [parsedData, existingContents]);

  const displayedCategories = useMemo(() => {
    if (!parsedData) return [];
    const q = categorySearch.trim().toLowerCase();
    return parsedData.categories.filter((cat) => {
      const stat = categorySyncStatsMap.get(cat.name);
      if (hideAdultCategories && stat?.isAdult) return false;
      if (q && !cat.name.toLowerCase().includes(q)) return false;

      if (typeFilter !== 'all') {
        if (typeFilter === 'channel' && cat.type !== 'channel') return false;
        if (typeFilter === 'movie' && cat.type !== 'movie') return false;
        if (typeFilter === 'series' && cat.type !== 'series' && cat.type !== 'anime' && cat.type !== 'dorama') {
          return false;
        }
      }
      if (syncFilter === 'unimported' && stat && stat.unsynced === 0) return false;
      if (syncFilter === 'imported' && stat && stat.synced === 0) return false;
      return true;
    });
  }, [parsedData, typeFilter, syncFilter, hideAdultCategories, categorySearch, categorySyncStatsMap]);

  const selectedCounts = useMemo(() => {
    if (!parsedData) return { channels: 0, movies: 0, series: 0 };
    let channels = 0;
    let movies = 0;
    let series = 0;
    for (let i = 0; i < parsedData.items.length; i++) {
      const item = parsedData.items[i];
      if (!selectedItemIds.has(item.id)) continue;
      if (item.type === 'channel') channels++;
      else if (item.type === 'movie') movies++;
      else series++;
    }
    return { channels, movies, series };
  }, [parsedData, selectedItemIds]);

  const displayedItems = useMemo(() => {
    if (!parsedData) return [];
    const q = searchQuery.trim().toLowerCase();
    return parsedData.items.filter((item) => {
      if (hideAdultCategories && isAdultCategoryName(item.groupTitle)) return false;
      if (typeFilter !== 'all') {
        if (typeFilter === 'channel' && item.type !== 'channel') return false;
        if (typeFilter === 'movie' && item.type !== 'movie') return false;
        if (typeFilter === 'series' && item.type !== 'series' && item.type !== 'anime' && item.type !== 'dorama') {
          return false;
        }
      }
      if (selectedCategories.size > 0 && !selectedCategories.has(item.groupTitle || 'Geral')) {
        return false;
      }
      if (syncFilter !== 'all') {
        const saved = isItemAlreadyInCatalog(item);
        if (syncFilter === 'unimported' && saved) return false;
        if (syncFilter === 'imported' && !saved) return false;
      }
      if (q) {
        const matchesTitle =
          item.title.toLowerCase().includes(q) ||
          (item.cleanTitle && item.cleanTitle.toLowerCase().includes(q));
        const matchesCat = (item.groupTitle || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }
      return true;
    });
  }, [parsedData, typeFilter, syncFilter, selectedCategories, searchQuery, hideAdultCategories, isItemAlreadyInCatalog]);

  const handleProcessText = (content: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setImportReport(null);
      setIsImportCompleted(false);

      const result = parseAdvancedM3U(content, forcedType);
      if (result.totalCount === 0) {
        throw new Error('Nenhum item valido ou tag #EXTINF encontrada no conteudo fornecido.');
      }
      cachedM3UData = result;
      setParsedData(result);
      setSelectedCategories(new Set());
      setSelectedItemIds(new Set());
      setTypeFilter('all');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar lista M3U.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchUrl = async () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setErrorMsg('Por favor, informe a URL da lista M3U.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setImportReport(null);
    setIsImportCompleted(false);

    try {
      const result = await fetchAdvancedM3U(cleanUrl, forcedType);
      if (result.totalCount === 0) {
        throw new Error('Nenhum canal ou video encontrado na lista informada.');
      }
      cachedM3UData = result;
      cachedM3UUrl = cleanUrl;
      setParsedData(result);
      setSelectedCategories(new Set());
      setSelectedItemIds(new Set());
      setTypeFilter('all');
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Nao foi possivel baixar a lista via URL. Se o servidor bloquear acesso, use a aba Arquivo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setIsLoading(true);
    setErrorMsg(null);
    setImportReport(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) handleProcessText(text);
      else {
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

  const toggleCategory = (catName: string) => {
    const itemIds = categoryItemIdsMap.get(catName) || [];
    const nextCats = new Set(selectedCategories);
    const nextItems = new Set(selectedItemIds);

    if (nextCats.has(catName)) {
      nextCats.delete(catName);
      for (let i = 0; i < itemIds.length; i++) nextItems.delete(itemIds[i]);
    } else {
      nextCats.add(catName);
      for (let i = 0; i < itemIds.length; i++) nextItems.add(itemIds[i]);
    }
    setSelectedCategories(nextCats);
    setSelectedItemIds(nextItems);
  };

  const handleSelectAllCategories = () => {
    const nextCats = new Set(selectedCategories);
    const nextItems = new Set(selectedItemIds);
    displayedCategories.forEach((cat) => {
      nextCats.add(cat.name);
      const ids = categoryItemIdsMap.get(cat.name) || [];
      for (let i = 0; i < ids.length; i++) nextItems.add(ids[i]);
    });
    setSelectedCategories(nextCats);
    setSelectedItemIds(nextItems);
  };

  const handleSelectOnlyUnsyncedCategories = () => {
    const nextCats = new Set(selectedCategories);
    const nextItems = new Set(selectedItemIds);
    displayedCategories.forEach((cat) => {
      const stat = categorySyncStatsMap.get(cat.name);
      if (stat && stat.unsynced > 0) {
        nextCats.add(cat.name);
        const ids = categoryItemIdsMap.get(cat.name) || [];
        for (let i = 0; i < ids.length; i++) nextItems.add(ids[i]);
      }
    });
    setSelectedCategories(nextCats);
    setSelectedItemIds(nextItems);
  };

  const handleDeselectAllCategories = () => {
    setSelectedCategories(new Set());
    setSelectedItemIds(new Set());
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildAdminContentItem = (
    item: ParsedPlaylistItem,
    existingMatch: AdminContentItem | undefined,
    channelIndexFallback: number
  ): AdminContentItem => {
    const rawQ = (item.quality || 'HD').toUpperCase();
    const sourceQuality: '4K' | 'FHD' | 'HD' | 'SD' =
      rawQ === '4K' || rawQ === 'UHD'
        ? '4K'
        : rawQ === 'FHD' || rawQ === '1080P'
        ? 'FHD'
        : rawQ === 'SD' || rawQ === '480P'
        ? 'SD'
        : 'HD';
    const cleanQualityLabel =
      sourceQuality === '4K'
        ? '4K - UHD'
        : sourceQuality === 'FHD'
        ? '1080P - FHD'
        : sourceQuality === 'SD'
        ? '480P - SD'
        : '720P - HD';

    return {
      id: existingMatch?.id || getDeterministicContentId(item.type, item.cleanTitle || item.title, item.streamUrl),
      type: item.type,
      title: item.cleanTitle || item.title,
      tagline: existingMatch?.tagline || (item.type === 'channel' ? 'Transmissao Ao Vivo' : ''),
      rating: existingMatch?.rating || (item.type === 'channel' ? 9.0 : 8.0),
      duration:
        existingMatch?.duration ||
        (item.type === 'channel' ? 'Ao Vivo' : item.type === 'movie' ? '1h 50m' : '1 Temporada'),
      year: item.year || existingMatch?.year || 2026,
      contentRating: isAdultCategoryName(item.groupTitle) ? '18+' : existingMatch?.contentRating || '14',
      genres: [item.groupTitle || 'Geral'],
      posterUrl: item.logo || existingMatch?.posterUrl || '',
      backdropUrl: existingMatch?.backdropUrl || item.logo || '',
      streamUrl: item.streamUrl,
      backupStreamUrl: existingMatch?.backupStreamUrl || '',
      sourcesList: [
        {
          id: 1,
          name: cleanQualityLabel,
          quality: sourceQuality,
          streamUrl: item.streamUrl,
          backupStreamUrl: existingMatch?.backupStreamUrl || '',
        },
      ],
      description:
        existingMatch?.description ||
        (item.type === 'channel'
          ? `Transmissao ao vivo do canal ${item.cleanTitle || item.title}.`
          : `Assista ${item.cleanTitle || item.title} em alta definicao no MasterTV.`),
      director: existingMatch?.director || '',
      writers: existingMatch?.writers || '',
      production: existingMatch?.production || 'MasterTV',
      channelNumber:
        item.type === 'channel' ? existingMatch?.channelNumber || channelIndexFallback : undefined,
      channelCategory: item.type === 'channel' ? item.groupTitle || 'aberta' : undefined,
      epgId: item.epgId || existingMatch?.epgId || undefined,
    };
  };

  const handleQuickAddSingleItem = async (item: ParsedPlaylistItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setAddingItemId(item.id);
      const existingMatch = findExistingMatch(item);
      const adminItem = buildAdminContentItem(item, existingMatch, existingContents.length + 1);
      const updated = [...existingContents.filter((c) => c.id !== adminItem.id), adminItem];
      setLocalOverrideContents(updated);
      AdminService.saveContentsLocally(updated);
      await AdminService.saveBatchRemoteContents([adminItem]);
      await onImportSuccess();
    } catch (err: any) {
      setErrorMsg(`Erro ao adicionar item: ${err?.message || 'Falha de comunicacao com o banco.'}`);
    } finally {
      setAddingItemId(null);
    }
  };

  const handleClearCatalogNow = async () => {
    if (clearConfirmText.trim().toUpperCase() !== 'LIMPAR' || isClearingNow) return;
    try {
      setIsClearingNow(true);
      setErrorMsg(null);
      setClearFeedback(null);
      const res = await AdminService.clearRemoteContents();
      if (!res.success) {
        throw new Error(res.message || 'Falha ao limpar o catalogo no banco de dados.');
      }
      AdminService.saveContentsLocally([]);
      setLocalOverrideContents([]);
      setIsClearDialogOpen(false);
      setClearConfirmText('');
      setClearFeedback('Catalogo limpo com sucesso no MySQL. O banco esta pronto para receber novos conteudos.');
      await onImportSuccess();
    } catch (err: any) {
      setErrorMsg(`Erro ao limpar catalogo: ${err?.message || 'Falha de comunicacao.'}`);
    } finally {
      setIsClearingNow(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData || selectedItemIds.size === 0) return;
    const itemsToImport = parsedData.items.filter((i) => selectedItemIds.has(i.id));
    if (itemsToImport.length === 0) return;

    const startedAt = Date.now();
    setIsImporting(true);
    setImportProgress(0);
    setImportProgressText('Analisando duplicatas e preparando lote...');
    setErrorMsg(null);
    setClearFeedback(null);
    setImportReport(null);
    setIsImportCompleted(false);

    try {
      // Never wipe existing catalog during Import (incremental safe merge)
      const baseMap = new Map<string, AdminContentItem>();
      existingContents.forEach((c) => {
        if (c && c.id) baseMap.set(c.id, c);
      });
      try {
        const [remoteChannels, remoteContents] = await Promise.all([
          AdminService.fetchRemoteChannels(),
          AdminService.fetchRemoteContents(),
        ]);
        remoteChannels.forEach((c) => {
          if (c && c.id) baseMap.set(c.id, c);
        });
        remoteContents.forEach((c) => {
          if (c && c.id) baseMap.set(c.id, c);
        });
      } catch {
        // Keep current loaded snapshot if network refresh fails
      }
      const currentExisting = Array.from(baseMap.values());

      const freshUrlMap = new Map<string, AdminContentItem>();
      const freshTypeTitleMap = new Map<string, AdminContentItem>();
      currentExisting.forEach((c) => {
        if (c.streamUrl) freshUrlMap.set(c.streamUrl.trim(), c);
        if (c.title) freshTypeTitleMap.set(`${c.type}::${c.title.toLowerCase().trim()}`, c);
      });

      const batchPayload: AdminContentItem[] = [];
      let newCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < itemsToImport.length; i++) {
        const item = itemsToImport[i];
        const existingMatch =
          freshUrlMap.get(item.streamUrl.trim()) ||
          freshTypeTitleMap.get(`${item.type}::${(item.cleanTitle || item.title).toLowerCase().trim()}`) ||
          freshTypeTitleMap.get(`${item.type}::${item.title.toLowerCase().trim()}`) ||
          undefined;

        if (existingMatch && !updateExistingContents) {
          skippedCount++;
          continue;
        }

        const adminItem = buildAdminContentItem(
          item,
          existingMatch,
          currentExisting.length + batchPayload.length + 1
        );
        batchPayload.push(adminItem);
        if (existingMatch) updatedCount++;
        else newCount++;

        if (i % 250 === 0 || i === itemsToImport.length - 1) {
          const prepPct = Math.round(((i + 1) / itemsToImport.length) * 20);
          setImportProgress(prepPct);
          setImportProgressText(`Preparando itens (${i + 1}/${itemsToImport.length})...`);
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      if (batchPayload.length === 0) {
        setImportProgress(100);
        setImportReport({
          inserted: 0,
          updated: 0,
          skipped: skippedCount,
          failed: 0,
          durationSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        });
        setIsImportCompleted(true);
        return;
      }

      setImportProgressText('Gravando lotes no banco de dados MySQL...');
      const saveResult = await AdminService.saveBatchRemoteContents(
        batchPayload,
        (pct, currentBatch, totalBatches) => {
          const mappedPct = 20 + Math.round(pct * 0.8);
          setImportProgress(mappedPct);
          setImportProgressText(`Gravando no MySQL: lote ${currentBatch} de ${totalBatches} (${mappedPct}%)...`);
        }
      );

      if (!saveResult.success) {
        throw new Error(saveResult.message || 'Falha ao salvar no banco de dados MySQL.');
      }

      const contentMap = new Map<string, AdminContentItem>();
      currentExisting.forEach((c) => {
        if (c && c.id) contentMap.set(c.id, c);
      });
      batchPayload.forEach((c) => {
        if (c && c.id) contentMap.set(c.id, c);
      });
      const mergedList = Array.from(contentMap.values());
      AdminService.saveContentsLocally(mergedList);
      setLocalOverrideContents(mergedList);

      setImportProgress(100);
      setImportReport({
        inserted: newCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: Math.max(0, batchPayload.length - saveResult.totalSaved),
        durationSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      });
      setIsImportCompleted(true);
      await onImportSuccess();
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar no banco de dados: ${err?.message || 'Falha de conexao.'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const scrollToReport = () => {
    reportCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Page Header & 4 Real KPI Cards */}
      <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#009DFF]/15 border border-[#009DFF]/30 text-[#009DFF] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-tight">
                Importador M3U
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Importe e organize canais ao vivo, filmes e series diretamente para o catalogo MySQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1726] border border-[#253247] text-xs font-semibold text-[#94A3B8]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16B981]" />
              <span>
                <strong className="text-[#F8FAFC]">{existingContents.length.toLocaleString('pt-BR')}</strong> itens no MySQL
              </span>
            </span>
          </div>
        </div>

        {/* 4 KPI Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#94A3B8]">Canais ao Vivo</span>
              <Tv className="w-4 h-4 text-[#16B981]" />
            </div>
            <p className="text-2xl font-extrabold text-[#F8FAFC] mt-2">
              {kpiStats.channels.toLocaleString('pt-BR')}
            </p>
            <span className="text-[11px] text-[#94A3B8]">{kpiStats.sourceLabel}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#94A3B8]">Filmes / VOD</span>
              <Film className="w-4 h-4 text-[#009DFF]" />
            </div>
            <p className="text-2xl font-extrabold text-[#F8FAFC] mt-2">
              {kpiStats.movies.toLocaleString('pt-BR')}
            </p>
            <span className="text-[11px] text-[#94A3B8]">{kpiStats.sourceLabel}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#94A3B8]">Series / Animes</span>
              <Clapperboard className="w-4 h-4 text-[#F5B942]" />
            </div>
            <p className="text-2xl font-extrabold text-[#F8FAFC] mt-2">
              {kpiStats.series.toLocaleString('pt-BR')}
            </p>
            <span className="text-[11px] text-[#94A3B8]">{kpiStats.sourceLabel}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#94A3B8]">Categorias</span>
              <FolderTree className="w-4 h-4 text-[#009DFF]" />
            </div>
            <p className="text-2xl font-extrabold text-[#F8FAFC] mt-2">
              {kpiStats.categories.toLocaleString('pt-BR')}
            </p>
            <span className="text-[11px] text-[#94A3B8]">{kpiStats.sourceLabel}</span>
          </div>
        </div>
      </div>

      {/* Global Error / Clear Feedback */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/35 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#F8FAFC]">Nao foi possivel concluir a operacao</p>
            <p className="text-[#94A3B8] mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {clearFeedback && (
        <div className="p-4 rounded-2xl bg-[#16B981]/10 border border-[#16B981]/35 flex items-start gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#16B981] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#F8FAFC]">Catalogo limpo</p>
            <p className="text-[#94A3B8] mt-0.5">{clearFeedback}</p>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN DESKTOP WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Source + Advanced Options */}
        <div className="xl:col-span-5 flex flex-col gap-5 min-w-0">
          {/* Card 1: Origem do M3U */}
          <section className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#F8FAFC]">Origem do M3U</h3>
              {parsedData && (
                <button
                  type="button"
                  onClick={() => {
                    cachedM3UData = null;
                    setParsedData(null);
                    setImportReport(null);
                    setIsImportCompleted(false);
                    setSelectedCategories(new Set());
                    setSelectedItemIds(new Set());
                  }}
                  className="text-[11px] font-semibold text-[#009DFF] hover:underline cursor-pointer"
                >
                  Limpar analise
                </button>
              )}
            </div>

            {/* URL / Arquivo / Texto */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#101827] border border-[#253247]">
              {(
                [
                  { id: 'url', label: 'URL', icon: LinkIcon },
                  { id: 'file', label: 'Arquivo', icon: Upload },
                  { id: 'text', label: 'Texto', icon: FileText },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = inputMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInputMode(tab.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#009DFF] text-[#070B16] font-bold'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Control */}
            {inputMode === 'url' && (
              <input
                type="url"
                placeholder="https://servidor.com/lista.m3u"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  cachedM3UUrl = e.target.value;
                }}
                className="w-full bg-[#101827] border border-[#253247] rounded-xl px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#009DFF] transition-colors"
              />
            )}

            {inputMode === 'file' && (
              <div className="p-5 rounded-xl bg-[#101827] border-2 border-dashed border-[#253247] hover:border-[#009DFF]/50 flex flex-col items-center justify-center text-center gap-2 transition-colors">
                <Upload className="w-5 h-5 text-[#009DFF]" />
                <p className="text-xs font-semibold text-[#F8FAFC]">
                  {selectedFileName ? selectedFileName : 'Selecione um arquivo .M3U ou .M3U8'}
                </p>
                <label className="px-4 py-2 rounded-xl bg-[#009DFF] hover:bg-[#0077D9] text-[#070B16] font-bold text-xs cursor-pointer transition-colors">
                  Escolher Arquivo
                  <input
                    type="file"
                    accept=".m3u,.m3u8,text/plain"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {inputMode === 'text' && (
              <textarea
                rows={5}
                placeholder="#EXTM3U&#10;#EXTINF:-1 group-title=&quot;CANAIS&quot;,GLOBO HD&#10;http://..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-[#101827] border border-[#253247] rounded-xl p-3 text-xs font-mono text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#009DFF]"
              />
            )}

            {/* Tipo de Conteudo */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-[#F8FAFC]">Tipo de conteudo</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { id: 'auto', label: 'Automatico' },
                    { id: 'channel', label: 'Canais ao vivo' },
                    { id: 'movie', label: 'Filmes / VOD' },
                    { id: 'series', label: 'Series' },
                  ] as const
                ).map((opt) => {
                  const active = forcedType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForcedType(opt.id)}
                      className={`px-3 py-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#009DFF]/15 border-[#009DFF]/60 text-[#F8FAFC]'
                          : 'bg-[#101827] border-[#253247] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          active ? 'border-[#009DFF] bg-[#009DFF]' : 'border-[#94A3B8]/50'
                        }`}
                      >
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-[#070B16]" />}
                      </span>
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Analyze Button */}
            {inputMode !== 'file' && (
              <button
                type="button"
                onClick={() => (inputMode === 'url' ? handleFetchUrl() : handleProcessText(textInput))}
                disabled={isLoading || (inputMode === 'url' ? !urlInput.trim() : !textInput.trim())}
                className="w-full py-2.5 rounded-xl bg-[#009DFF] hover:bg-[#0077D9] disabled:opacity-50 text-[#070B16] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analisando lista...</span>
                  </>
                ) : (
                  <>
                    <ScanSearch className="w-4 h-4" />
                    <span>Analisar lista</span>
                  </>
                )}
              </button>
            )}
          </section>

          {/* Card 2: Opcoes Avancadas */}
          <section className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#009DFF]" />
              <span>Opcoes avancadas</span>
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#101827] border border-[#253247] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateExistingContents}
                  onChange={(e) => setUpdateExistingContents(e.target.checked)}
                  className="mt-0.5 rounded accent-[#009DFF] cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-[#F8FAFC] block">Atualizar conteudos existentes</span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {updateExistingContents
                      ? 'Atualiza URLs e metadados de itens ja presentes sem duplicar.'
                      : 'Ignora automaticamente itens ja salvos no catalogo.'}
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#101827] border border-[#253247] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={identifyAdultCategories}
                  onChange={(e) => setIdentifyAdultCategories(e.target.checked)}
                  className="mt-0.5 rounded accent-[#009DFF] cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-[#F8FAFC] block">Identificar categorias 18+</span>
                  <span className="text-[11px] text-[#94A3B8]">
                    Destaca grupos adultos com badge 18+ e classificacao indicativa.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#101827] border border-[#253247] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideAdultCategories}
                  onChange={(e) => setHideAdultCategories(e.target.checked)}
                  className="mt-0.5 rounded accent-[#009DFF] cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-[#F8FAFC] block">Ocultar categorias 18+</span>
                  <span className="text-[11px] text-[#94A3B8]">
                    Exclui grupos adultos da selecao e da previa desta importacao.
                  </span>
                </div>
              </label>
            </div>

            {/* Separate Immediate Destructive Catalog Clear */}
            <div className="pt-3 border-t border-[#253247] space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-[#F5B942]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  A importacao acima e sempre incremental (nao apaga itens ja salvos). Para zerar o banco, use o botao separado abaixo.
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setClearConfirmText('');
                  setIsClearDialogOpen(true);
                }}
                className="w-full py-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar catalogo no MySQL...</span>
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Analysis + Categories + Progress & Report */}
        <div className="xl:col-span-7 flex flex-col gap-5 min-w-0">
          {/* Card 3: Analise da Lista & Categorias Encontradas */}
          <section className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#009DFF]" />
                  <span>
                    Analise da Lista {parsedData ? `(${displayedCategories.length} categorias)` : ''}
                  </span>
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {parsedData
                    ? `${parsedData.totalCount.toLocaleString('pt-BR')} itens detectados • ${totalUnsyncedInList.toLocaleString('pt-BR')} novos • ${totalSyncedInList.toLocaleString('pt-BR')} ja salvos`
                    : 'Carregue uma lista M3U na coluna ao lado para visualizar categorias e contagens.'}
                </p>
              </div>

              {parsedData && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Todos' },
                      { id: 'channel', label: 'Canais' },
                      { id: 'movie', label: 'Filmes' },
                      { id: 'series', label: 'Series' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilter(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
                        typeFilter === t.id
                          ? 'bg-[#009DFF] text-[#070B16] border-[#009DFF] font-bold'
                          : 'bg-[#101827] text-[#94A3B8] border-[#253247] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!parsedData ? (
              <div className="py-12 px-6 rounded-xl bg-[#101827] border border-dashed border-[#253247] text-center space-y-2">
                <ScanSearch className="w-8 h-8 text-[#009DFF]/70 mx-auto" />
                <p className="text-sm font-semibold text-[#F8FAFC]">Nenhuma lista analisada ainda</p>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                  Informe uma URL M3U, envie um arquivo .m3u ou cole o texto na coluna esquerda e clique em <strong>Analisar lista</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* Search + Status Filters + Quick Selection */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar categoria..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full bg-[#101827] border border-[#253247] rounded-xl pl-8 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#009DFF]"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 rounded-xl bg-[#101827] border border-[#253247] self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setSyncFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                        syncFilter === 'all' ? 'bg-[#1e2c44] text-[#F8FAFC]' : 'text-[#94A3B8]'
                      }`}
                    >
                      <Eye className="w-3 h-3" /> Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSyncFilter('unimported')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                        syncFilter === 'unimported' ? 'bg-[#16B981]/20 text-[#16B981]' : 'text-[#94A3B8]'
                      }`}
                    >
                      <EyeOff className="w-3 h-3" /> Novos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSyncFilter('imported')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                        syncFilter === 'imported' ? 'bg-[#009DFF]/20 text-[#009DFF]' : 'text-[#94A3B8]'
                      }`}
                    >
                      <Check className="w-3 h-3" /> Salvos
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectOnlyUnsyncedCategories}
                      className="text-[#16B981] hover:underline cursor-pointer"
                    >
                      + Marcar categorias com novos
                    </button>
                    <span className="text-[#253247]">|</span>
                    <button
                      type="button"
                      onClick={handleSelectAllCategories}
                      className="text-[#009DFF] hover:underline cursor-pointer"
                    >
                      Marcar todas
                    </button>
                    <span className="text-[#253247]">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllCategories}
                      className="text-[#94A3B8] hover:text-[#F8FAFC] hover:underline cursor-pointer"
                    >
                      Limpar selecao
                    </button>
                  </div>
                  {adultCategoryCount > 0 && identifyAdultCategories && (
                    <span className="text-[#F5B942]">{adultCategoryCount} categoria(s) 18+</span>
                  )}
                </div>

                {/* Categories List */}
                <div className="max-h-72 overflow-y-auto pr-1 divide-y divide-[#253247]/60 rounded-xl bg-[#101827] border border-[#253247]">
                  {displayedCategories.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#94A3B8]">
                      Nenhuma categoria encontrada para os filtros aplicados.
                    </div>
                  ) : (
                    displayedCategories.map((cat) => {
                      const isSelected = selectedCategories.has(cat.name);
                      const stat = categorySyncStatsMap.get(cat.name);
                      const isFullySaved = stat && stat.synced === stat.total && stat.total > 0;
                      const isAdult = identifyAdultCategories && Boolean(stat?.isAdult);

                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => toggleCategory(cat.name)}
                          className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#009DFF]/12 text-[#F8FAFC]' : 'hover:bg-[#151E2E] text-[#94A3B8]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#009DFF] shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-[#94A3B8]/50 shrink-0" />
                            )}
                            <span className="text-xs font-medium text-[#F8FAFC] truncate">{cat.name}</span>
                            {isAdult && (
                              <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[9px] font-bold shrink-0">
                                18+
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-mono shrink-0 ${
                              isFullySaved ? 'text-[#16B981] font-bold' : 'text-[#94A3B8]'
                            }`}
                          >
                            {stat && stat.synced > 0 ? `${stat.synced}/${cat.count}` : cat.count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Selection Summary + Toggle Fine Item Preview */}
                <div className="pt-2 border-t border-[#253247] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-[#009DFF] font-semibold">
                    {selectedCategories.size} categorias selecionadas • {selectedItemIds.size.toLocaleString('pt-BR')} itens
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowItemPreview((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-[#94A3B8] hover:text-[#F8FAFC] font-semibold cursor-pointer self-start sm:self-auto"
                  >
                    <span>
                      {showItemPreview
                        ? 'Ocultar previa de itens'
                        : `Ver previa de itens (${displayedItems.length.toLocaleString('pt-BR')})`}
                    </span>
                    {showItemPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expandable Fine Item Preview Table */}
                {showItemPreview && (
                  <div className="space-y-3 pt-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar canal, filme ou serie na previa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#101827] border border-[#253247] rounded-xl pl-8 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#009DFF]"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto rounded-xl border border-[#253247] bg-[#101827]">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#151E2E] border-b border-[#253247] text-[#94A3B8]">
                          <tr>
                            <th className="py-2 px-3 w-8 text-center">Sel</th>
                            <th className="py-2 px-3">Titulo</th>
                            <th className="py-2 px-3 hidden sm:table-cell">Categoria</th>
                            <th className="py-2 px-3 text-right">Acao</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#253247]/50">
                          {displayedItems.slice(0, 200).map((item) => {
                            const isSelected = selectedItemIds.has(item.id);
                            const isAlreadySaved = isItemAlreadyInCatalog(item);
                            const isAdding = addingItemId === item.id;
                            return (
                              <tr
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? 'bg-[#009DFF]/10' : 'hover:bg-[#151E2E]'
                                }`}
                              >
                                <td className="py-2 px-3 text-center">
                                  {isSelected ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-[#009DFF] mx-auto" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-[#94A3B8]/50 mx-auto" />
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-[#F8FAFC] truncate max-w-[220px]">
                                    {item.cleanTitle || item.title}
                                  </div>
                                  <div className="text-[10px] text-[#94A3B8]/70">{getSafePreviewHost(item.streamUrl)}</div>
                                </td>
                                <td className="py-2 px-3 text-[#94A3B8] truncate max-w-[140px] hidden sm:table-cell">
                                  {item.groupTitle}
                                </td>
                                <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  {isAlreadySaved ? (
                                    <span className="text-[10px] font-bold text-[#16B981]">Salvo</span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isAdding}
                                      onClick={(e) => handleQuickAddSingleItem(item, e)}
                                      className="px-2 py-1 rounded-lg bg-[#009DFF]/15 hover:bg-[#009DFF] text-[#009DFF] hover:text-[#070B16] text-[10px] font-bold cursor-pointer transition-colors"
                                    >
                                      {isAdding ? '...' : '+ Adicionar'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Card 4: Progresso da Importacao & Relatorio */}
          <section
            ref={reportCardRef}
            className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#009DFF]" />
                <span>Progresso da Importacao</span>
              </h3>
              <span className="text-xs font-mono font-bold text-[#009DFF]">
                {isImporting ? `${importProgress}%` : importReport ? '100%' : '0%'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full h-2.5 rounded-full bg-[#101827] border border-[#253247] overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    importReport ? 'bg-[#16B981]' : 'bg-[#009DFF]'
                  }`}
                  style={{ width: `${isImporting ? importProgress : importReport ? 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-[#94A3B8]">
                {isImporting
                  ? importProgressText || 'Gravando conteudos no MySQL...'
                  : importReport
                  ? `Importacao finalizada em ${importReport.durationSec}s.`
                  : 'Selecione categorias ou itens e clique em Importar M3U para iniciar.'}
              </p>
            </div>

            {/* 4 Real Report Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-[#101827] border border-[#253247]">
                <span className="text-[11px] text-[#94A3B8]">Inseridos</span>
                <p className="text-lg font-extrabold text-[#16B981] mt-0.5">
                  {importReport ? importReport.inserted : 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#101827] border border-[#253247]">
                <span className="text-[11px] text-[#94A3B8]">Atualizados</span>
                <p className="text-lg font-extrabold text-[#009DFF] mt-0.5">
                  {importReport ? importReport.updated : 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#101827] border border-[#253247]">
                <span className="text-[11px] text-[#94A3B8]">Ignorados</span>
                <p className="text-lg font-extrabold text-[#F5B942] mt-0.5">
                  {importReport ? importReport.skipped : 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#101827] border border-[#253247]">
                <span className="text-[11px] text-[#94A3B8]">Erros</span>
                <p className="text-lg font-extrabold text-[#EF4444] mt-0.5">
                  {importReport ? importReport.failed : 0}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Page Action Footer Bar */}
      <footer className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#94A3B8]">
          {parsedData ? (
            <>
              Prontos para importar:{' '}
              <strong className="text-[#F8FAFC]">{selectedItemIds.size.toLocaleString('pt-BR')} itens</strong>
              {(selectedCounts.channels > 0 || selectedCounts.movies > 0 || selectedCounts.series > 0) && (
                <span className="ml-1.5">
                  ({selectedCounts.channels} canais, {selectedCounts.movies} filmes, {selectedCounts.series} series)
                </span>
              )}
            </>
          ) : (
            'Analise uma lista M3U para liberar a importacao em lote.'
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {importReport && (
            <button
              type="button"
              onClick={scrollToReport}
              className="px-4 py-2.5 rounded-xl bg-[#101827] hover:bg-[#1a263b] border border-[#253247] text-xs font-semibold text-[#F8FAFC] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-[#009DFF]" />
              <span>Ver relatorio</span>
            </button>
          )}

          {isImportCompleted && (
            <button
              type="button"
              onClick={onGoToCatalog}
              className="px-4 py-2.5 rounded-xl bg-[#16B981] hover:bg-[#129b6c] text-[#070B16] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Ver no Catalogo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isImporting || !parsedData || selectedItemIds.size === 0}
            className="px-5 py-2.5 rounded-xl bg-[#009DFF] hover:bg-[#0077D9] text-[#070B16] font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importando ({importProgress}%)...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Importar M3U</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Two-Step Destructive Clear Confirmation Dialog */}
      {isClearDialogOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsClearDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#101827] border border-[#EF4444]/40 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F8FAFC]">Confirmacao de limpeza destrutiva</h4>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Todos os <strong>{existingContents.length}</strong> conteudos atuais do MySQL serao apagados antes de importar os novos itens.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#F8FAFC]">
                Digite <span className="font-mono text-[#EF4444]">LIMPAR</span> para habilitar:
              </label>
              <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                placeholder="LIMPAR"
                className="w-full bg-[#0F1726] border border-[#253247] rounded-xl px-3.5 py-2 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearDialogOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#151E2E] border border-[#253247] text-xs font-semibold text-[#94A3B8] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearingNow || clearConfirmText.trim().toUpperCase() !== 'LIMPAR'}
                onClick={handleClearCatalogNow}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#dc2626] disabled:opacity-40 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                {isClearingNow ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Limpando MySQL...</span>
                  </>
                ) : (
                  <span>Limpar catalogo agora</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
