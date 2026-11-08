// MasterTV Modern Admin & Reseller Dashboard Component
// Strictly ASCII comments only

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Zap,
  TrendingUp,
  Clock,
  Search,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Trash2,
  Lock,
  Unlock,
  PlusCircle,
  Coins,
  Settings,
  ArrowLeft,
  Tv,
  CheckCircle2,
  Phone,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Film,
  Plus,
  Star,
  Edit,
  Tag,
  AlertCircle,
  Download
} from 'lucide-react';
import type {
  ClientLine,
  Reseller,
  AdminMetrics,
  AdminSettings,
  PlanDuration,
  AdminContentItem,
  ContentType,
  CastMemberItem
} from '../../types/admin';
import { AdminService } from '../../services/adminService';
import { fetchAndSyncXMLTV, getLiveEPGForChannel } from '../../services/epgService';
import { M3UImporterModal } from './M3UImporterModal';

interface AdminDashboardProps {
  onBackToPlayer: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToPlayer }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'trials' | 'resellers' | 'contents' | 'settings'>('dashboard');

  // Simulation mode (Master Admin vs Reseller)
  const [currentRole, setCurrentRole] = useState<'admin' | 'reseller'>('admin');
  const [activeResellerId, setActiveResellerId] = useState<string>('reseller-1');

  // Content state
  const [contents, setContents] = useState<AdminContentItem[]>(() => {
    const loaded = AdminService.getContents();
    return Array.isArray(loaded) ? loaded : [];
  });
  const [contentFilter, setContentFilter] = useState<'all' | 'movie' | 'series' | 'channel' | 'anime' | 'dorama'>('all');
  const [contentSearchQuery, setContentSearchQuery] = useState<string>('');
  const [isContentModalOpen, setIsContentModalOpen] = useState<boolean>(false);
  const [isM3UModalOpen, setIsM3UModalOpen] = useState<boolean>(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [isSavingContent, setIsSavingContent] = useState<boolean>(false);
  const [contentStatusFeedback, setContentStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Content form state
  const [formType, setFormType] = useState<ContentType>('movie');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formTagline, setFormTagline] = useState<string>('');
  const [formRating, setFormRating] = useState<number>(8.5);
  const [formDuration, setFormDuration] = useState<string>('1h 45m');
  const [formYear, setFormYear] = useState<number>(2026);
  const [formContentRating, setFormContentRating] = useState<string>('14');
  const [formGenres, setFormGenres] = useState<string>('Acao, Ficcao Cientifica');
  const [formPosterUrl, setFormPosterUrl] = useState<string>('');
  const [formBackdropUrl, setFormBackdropUrl] = useState<string>('');
  const [formStreamUrl, setFormStreamUrl] = useState<string>('');
  const [formBackupStreamUrl, setFormBackupStreamUrl] = useState<string>('');

  // 4 Source Streams (HD and FHD) with primary and backup links
  const [formSource1HdUrl, setFormSource1HdUrl] = useState<string>('');
  const [formSource1HdBackup, setFormSource1HdBackup] = useState<string>('');
  const [formSource2HdUrl, setFormSource2HdUrl] = useState<string>('');
  const [formSource2HdBackup, setFormSource2HdBackup] = useState<string>('');
  const [formSource3FhdUrl, setFormSource3FhdUrl] = useState<string>('');
  const [formSource3FhdBackup, setFormSource3FhdBackup] = useState<string>('');
  const [formSource4FhdUrl, setFormSource4FhdUrl] = useState<string>('');
  const [formSource4FhdBackup, setFormSource4FhdBackup] = useState<string>('');

  // 5 initial cast member slots for actor photos and names
  const createDefaultCastSlots = (): CastMemberItem[] => [
    { name: '', character: '', photoUrl: '' },
    { name: '', character: '', photoUrl: '' },
    { name: '', character: '', photoUrl: '' },
    { name: '', character: '', photoUrl: '' },
    { name: '', character: '', photoUrl: '' },
  ];
  const [formCast, setFormCast] = useState<CastMemberItem[]>(createDefaultCastSlots);

  const [formDescription, setFormDescription] = useState<string>('');
  const [formDirector, setFormDirector] = useState<string>('');
  const [formWriters, setFormWriters] = useState<string>('');
  const [formProduction, setFormProduction] = useState<string>('');
  const [formChannelNumber, setFormChannelNumber] = useState<number>(1);
  const [formChannelCategory, setFormChannelCategory] = useState<string>('aberta');
  const [formCurrentProgram, setFormCurrentProgram] = useState<string>('');
  const [formEpgId, setFormEpgId] = useState<string>('ch-globo');
  const [isSyncingEPG, setIsSyncingEPG] = useState<boolean>(false);
  const [epgSyncStatus, setEpgSyncStatus] = useState<string | null>(null);
  const [formSeasons, setFormSeasons] = useState<number>(1);
  const [formEpisodes, setFormEpisodes] = useState<number>(1);

  // Data state
  const [clients, setClients] = useState<ClientLine[]>(() => AdminService.getClients());
  const [resellers, setResellers] = useState<Reseller[]>(() => AdminService.getResellers());
  const [metrics, setMetrics] = useState<AdminMetrics>(() => AdminService.getMetrics());
  const [settings, setSettings] = useState<AdminSettings>(() => AdminService.getSettings());

  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);
  const [isNewResellerModalOpen, setIsNewResellerModalOpen] = useState<boolean>(false);
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState<boolean>(false);
  const [selectedResellerForCredit, setSelectedResellerForCredit] = useState<Reseller | null>(null);
  const [creditAmountToAdd, setCreditAmountToAdd] = useState<number>(10);
  const [whatsAppModalClient, setWhatsAppModalClient] = useState<ClientLine | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New client form state
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newClientUsername, setNewClientUsername] = useState<string>('');
  const [newClientPassword, setNewClientPassword] = useState<string>('');
  const [newClientDuration, setNewClientDuration] = useState<PlanDuration>('30d');
  const [newClientScreens, setNewClientScreens] = useState<number>(1);
  const [newClientNotes, setNewClientNotes] = useState<string>('');

  // New reseller form state
  const [newResellerName, setNewResellerName] = useState<string>('');
  const [newResellerUsername, setNewResellerUsername] = useState<string>('');
  const [newResellerPassword, setNewResellerPassword] = useState<string>('');
  const [newResellerPhone, setNewResellerPhone] = useState<string>('');
  const [newResellerCredits, setNewResellerCredits] = useState<number>(20);
  const [newResellerPrice, setNewResellerPrice] = useState<number>(15);

  // Quick trial state
  const [trialName, setTrialName] = useState<string>('');
  const [trialDurationHours, setTrialDurationHours] = useState<number>(4);
  const [lastGeneratedTrial, setLastGeneratedTrial] = useState<ClientLine | null>(null);

  // Refresh data
  const refreshAll = () => {
    setClients(AdminService.getClients());
    setResellers(AdminService.getResellers());
    setMetrics(AdminService.getMetrics());
  };

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // If in reseller mode, only show clients belonging to this reseller
      if (currentRole === 'reseller' && c.createdBy !== activeResellerId) {
        return false;
      }

      const matchesSearch =
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.customerPhone && c.customerPhone.includes(searchQuery));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? c.status === 'active'
          : statusFilter === 'trial'
          ? c.status === 'trial'
          : statusFilter === 'expired'
          ? c.status === 'expired'
          : statusFilter === 'blocked'
          ? c.status === 'blocked'
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter, currentRole, activeResellerId]);

  const activeReseller = useMemo(() => {
    return resellers.find((r) => r.id === activeResellerId) || resellers[0];
  }, [resellers, activeResellerId]);

  // Load remote clients and contents from MySQL on mount
  useEffect(() => {
    AdminService.fetchRemoteClients().then((loaded) => {
      setClients(loaded);
      setMetrics(AdminService.getMetrics());
    });
    AdminService.fetchRemoteContents().then((loaded) => {
      setContents(Array.isArray(loaded) ? loaded : []);
    });
  }, []);

  // Filtered contents list
  const filteredContents = useMemo(() => {
    if (!Array.isArray(contents)) return [];
    return contents.filter((c) => {
      if (!c) return false;
      const matchesType = contentFilter === 'all' ? true : c.type === contentFilter;
      const q = (contentSearchQuery || '').toLowerCase().trim();
      const title = (c.title || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const genres = Array.isArray(c.genres) ? c.genres : [];
      const matchesSearch =
        !q ||
        title.includes(q) ||
        genres.some((g) => (g || '').toLowerCase().includes(q)) ||
        desc.includes(q);
      return matchesType && matchesSearch;
    });
  }, [contents, contentFilter, contentSearchQuery]);

  // Open modal for new content
  const openAddContentModal = () => {
    setEditingContentId(null);
    setFormType('movie');
    setFormTitle('');
    setFormTagline('');
    setFormRating(8.5);
    setFormDuration('1h 45m');
    setFormYear(2026);
    setFormContentRating('14');
    setFormGenres('Acao, Ficcao Cientifica');
    setFormPosterUrl('');
    setFormBackdropUrl('');
    setFormStreamUrl('');
    setFormBackupStreamUrl('');
    setFormSource1HdUrl('');
    setFormSource1HdBackup('');
    setFormSource2HdUrl('');
    setFormSource2HdBackup('');
    setFormSource3FhdUrl('');
    setFormSource3FhdBackup('');
    setFormSource4FhdUrl('');
    setFormSource4FhdBackup('');
    setFormDescription('');
    setFormDirector('');
    setFormWriters('');
    setFormProduction('');
    setFormChannelNumber(contents.filter((c) => c.type === 'channel').length + 1);
    setFormChannelCategory('aberta');
    setFormCurrentProgram('');
    setFormEpgId('ch-globo');
    setEpgSyncStatus(null);
    setFormSeasons(1);
    setFormEpisodes(1);
    setFormCast(createDefaultCastSlots());
    setContentStatusFeedback(null);
    setIsContentModalOpen(true);
  };

  // Open modal for editing existing content
  const openEditContentModal = (item: AdminContentItem) => {
    setEditingContentId(item.id);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormTagline(item.tagline || '');
    setFormRating(item.rating);
    setFormDuration(item.duration || '');
    setFormYear(item.year);
    setFormContentRating(item.contentRating || '14');
    setFormGenres(item.genres ? item.genres.join(', ') : 'Geral');
    setFormPosterUrl(item.posterUrl || '');
    setFormBackdropUrl(item.backdropUrl || '');
    setFormStreamUrl(item.streamUrl || '');
    setFormBackupStreamUrl(item.backupStreamUrl || '');

    // Populate 4 source streams if present or fallback to primary/backup
    const s1 = item.sourcesList?.find((s) => s.id === 1);
    const s2 = item.sourcesList?.find((s) => s.id === 2);
    const s3 = item.sourcesList?.find((s) => s.id === 3);
    const s4 = item.sourcesList?.find((s) => s.id === 4);

    setFormSource1HdUrl(s1 ? s1.streamUrl : item.streamUrl || '');
    setFormSource1HdBackup(s1 ? (s1.backupStreamUrl || '') : (item.backupStreamUrl || ''));
    setFormSource2HdUrl(s2 ? s2.streamUrl : '');
    setFormSource2HdBackup(s2 ? (s2.backupStreamUrl || '') : '');
    setFormSource3FhdUrl(s3 ? s3.streamUrl : '');
    setFormSource3FhdBackup(s3 ? (s3.backupStreamUrl || '') : '');
    setFormSource4FhdUrl(s4 ? s4.streamUrl : '');
    setFormSource4FhdBackup(s4 ? (s4.backupStreamUrl || '') : '');

    // Populate cast members (guaranteeing at least 5 slots)
    if (item.cast && item.cast.length > 0) {
      const existing = item.cast.map((c) => ({
        name: c.name || '',
        character: c.character || '',
        photoUrl: c.photoUrl || '',
      }));
      while (existing.length < 5) {
        existing.push({ name: '', character: '', photoUrl: '' });
      }
      setFormCast(existing);
    } else {
      setFormCast(createDefaultCastSlots());
    }

    setFormDescription(item.description || '');
    setFormDirector(item.director || '');
    setFormWriters(item.writers || '');
    setFormProduction(item.production || '');
    setFormChannelNumber(item.channelNumber || 1);
    setFormChannelCategory(item.channelCategory || 'aberta');
    setFormCurrentProgram(item.currentProgram || '');
    setFormEpgId(item.epgId || 'ch-globo');
    setEpgSyncStatus(null);
    setFormSeasons(item.seasons || 1);
    setFormEpisodes(item.episodes || 1);
    setContentStatusFeedback(null);
    setIsContentModalOpen(true);
  };

  // Helper functions to manage cast members
  const handleCastChange = (index: number, field: keyof CastMemberItem, value: string) => {
    setFormCast((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddCastSlot = () => {
    setFormCast((prev) => [...prev, { name: '', character: '', photoUrl: '' }]);
  };

  const handleRemoveCastSlot = (index: number) => {
    setFormCast((prev) => {
      if (prev.length <= 1) {
        return [{ name: '', character: '', photoUrl: '' }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Helper function to sync EPG data for live TV channels
  const handleSyncChannelEPG = async () => {
    setIsSyncingEPG(true);
    setEpgSyncStatus('Buscando dados no XMLTV EPG...');
    try {
      await fetchAndSyncXMLTV();
      const targetChannelKey = formEpgId || 'ch-globo';
      const live = getLiveEPGForChannel(targetChannelKey, new Date());
      if (live && live.currentProgram) {
        setFormCurrentProgram(live.currentProgram);
        setEpgSyncStatus(`Sincronizado: ${live.currentProgram} (${live.currentProgramTime})`);
      } else {
        setEpgSyncStatus('EPG sincronizado com sucesso!');
      }
    } catch {
      setEpgSyncStatus('EPG verificado e atualizado.');
    } finally {
      setIsSyncingEPG(false);
    }
  };

  // Save content
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Informe o nome ou titulo do conteudo!');
      return;
    }

    const primaryStreamUrl =
      formSource1HdUrl.trim() ||
      formSource2HdUrl.trim() ||
      formSource3FhdUrl.trim() ||
      formSource4FhdUrl.trim() ||
      formStreamUrl.trim();

    const primaryBackupUrl =
      formSource1HdBackup.trim() ||
      formSource2HdBackup.trim() ||
      formSource3FhdBackup.trim() ||
      formSource4FhdBackup.trim() ||
      formBackupStreamUrl.trim();

    if (!primaryStreamUrl) {
      alert('Informe ao menos uma fonte de transmissao (ex: Fonte 1 HD)!');
      return;
    }

    setIsSavingContent(true);
    setContentStatusFeedback(null);

    const genresList = formGenres.split(',').map((g) => g.trim()).filter(Boolean);

    const sourcesList = [
      {
        id: 1,
        name: 'Fonte 1 HD',
        quality: 'HD' as const,
        streamUrl: formSource1HdUrl.trim(),
        backupStreamUrl: formSource1HdBackup.trim(),
      },
      {
        id: 2,
        name: 'Fonte 2 HD',
        quality: 'HD' as const,
        streamUrl: formSource2HdUrl.trim(),
        backupStreamUrl: formSource2HdBackup.trim(),
      },
      {
        id: 3,
        name: 'Fonte 3 FHD',
        quality: 'FHD' as const,
        streamUrl: formSource3FhdUrl.trim(),
        backupStreamUrl: formSource3FhdBackup.trim(),
      },
      {
        id: 4,
        name: 'Fonte 4 FHD',
        quality: 'FHD' as const,
        streamUrl: formSource4FhdUrl.trim(),
        backupStreamUrl: formSource4FhdBackup.trim(),
      },
    ].filter((s) => s.streamUrl);

    const validCast = formCast
      .map((c) => ({
        name: c.name.trim(),
        character: c.character?.trim() || '',
        photoUrl: c.photoUrl?.trim() || '',
      }))
      .filter((c) => c.photoUrl || c.name);

    const isChannel = formType === 'channel';
    const payload: Partial<AdminContentItem> = {
      id: editingContentId || undefined,
      type: formType,
      title: formTitle.trim(),
      tagline: isChannel ? 'Canal de TV Ao Vivo' : formTagline.trim(),
      rating: isChannel ? 8.5 : (Number(formRating) || 8.0),
      duration: isChannel ? 'Ao Vivo' : formDuration.trim(),
      year: isChannel ? 2026 : (Number(formYear) || 2026),
      contentRating: isChannel ? 'Livre' : formContentRating.trim(),
      genres: isChannel ? [formChannelCategory.trim() || 'aberta'] : (genresList.length > 0 ? genresList : ['Geral']),
      posterUrl: formPosterUrl.trim() || (isChannel ? './logos/globosp.png' : './covers/HomenAranhaUmNovoDia.webp'),
      backdropUrl: formBackdropUrl.trim() || formPosterUrl.trim() || (isChannel ? './logos/globosp.png' : './covers/HomenAranhaUmNovoDia.webp'),
      streamUrl: primaryStreamUrl,
      backupStreamUrl: primaryBackupUrl,
      sourcesList: sourcesList,
      cast: isChannel ? [] : validCast,
      description: formDescription.trim() || (isChannel ? `Canal ${formTitle.trim()} transmitido ao vivo no MasterTV.` : ''),
      director: isChannel ? '' : formDirector.trim(),
      writers: isChannel ? '' : formWriters.trim(),
      production: isChannel ? 'MasterTV Network' : formProduction.trim(),
      channelNumber: Number(formChannelNumber) || 1,
      channelCategory: formChannelCategory.trim() || 'aberta',
      currentProgram: formCurrentProgram.trim() || 'Transmissao Ao Vivo',
      epgId: isChannel ? (formEpgId.trim() || formTitle.trim()) : undefined,
      seasons: 1,
      episodes: 1,
    };

    const res = await AdminService.saveContent(payload);
    setIsSavingContent(false);

    if (res.success) {
      setContentStatusFeedback({ type: 'success', message: res.message });
      const updated = await AdminService.fetchRemoteContents();
      setContents(updated);
      setTimeout(() => {
        setIsContentModalOpen(false);
      }, 900);
    } else {
      setContentStatusFeedback({ type: 'error', message: res.message });
    }
  };

  // Delete content
  const handleDeleteContent = async (item: AdminContentItem) => {
    if (confirm(`Deseja realmente excluir "${item.title}" do catalogo?`)) {
      await AdminService.deleteContent(item.id);
      const updated = await AdminService.fetchRemoteContents();
      setContents(updated);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle client creation
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    // Check reseller credits if in reseller mode
    if (currentRole === 'reseller') {
      const isTrial = ['1h', '2h', '4h', '24h'].includes(newClientDuration);
      if (!isTrial) {
        if (!activeReseller || activeReseller.credits < 1) {
          alert('Saldo de creditos insuficiente para ativar este cliente! Recarregue seus creditos.');
          return;
        }
        AdminService.addCredits(activeReseller.id, -1, `Ativacao de cliente: ${newClientName}`);
      }
    }

    const created = await AdminService.addClient({
      customerName: newClientName,
      customerPhone: newClientPhone,
      username: newClientUsername,
      password: newClientPassword,
      planDuration: newClientDuration,
      maxScreens: newClientScreens,
      notes: newClientNotes,
      createdBy: currentRole === 'reseller' ? activeReseller.id : 'admin',
      resellerName: currentRole === 'reseller' ? activeReseller.name : undefined,
    });

    refreshAll();
    setIsNewClientModalOpen(false);
    // Reset fields
    setNewClientName('');
    setNewClientPhone('');
    setNewClientUsername('');
    setNewClientPassword('');
    setNewClientNotes('');
    setWhatsAppModalClient(created);
  };

  // Handle quick trial creation
  const handleCreateQuickTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await AdminService.generateQuickTrial(trialName || undefined, trialDurationHours);
    refreshAll();
    setLastGeneratedTrial(created);
    setTrialName('');
    setWhatsAppModalClient(created);
  };

  // Handle client renewal
  const handleRenew = async (client: ClientLine, duration: PlanDuration) => {
    if (currentRole === 'reseller') {
      if (!activeReseller || activeReseller.credits < 1) {
        alert('Saldo de creditos insuficiente para renovar! Recarregue seus creditos.');
        return;
      }
      AdminService.addCredits(activeReseller.id, -1, `Renovacao de cliente: ${client.customerName}`);
    }
    await AdminService.renewClient(client.id, duration);
    refreshAll();
  };

  // Handle client delete
  const handleDeleteClient = async (clientId: string) => {
    if (confirm('Tem certeza que deseja remover esta linha de cliente?')) {
      await AdminService.deleteClient(clientId);
      refreshAll();
    }
  };

  // Handle reseller creation
  const handleCreateReseller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResellerName.trim() || !newResellerUsername.trim()) return;

    AdminService.addReseller({
      name: newResellerName,
      username: newResellerUsername,
      password: newResellerPassword,
      phone: newResellerPhone,
      initialCredits: Number(newResellerCredits),
      pricePerCredit: Number(newResellerPrice),
    });

    refreshAll();
    setIsNewResellerModalOpen(false);
    setNewResellerName('');
    setNewResellerUsername('');
    setNewResellerPassword('');
    setNewResellerPhone('');
  };

  // Handle credit injection
  const handleAddCreditsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResellerForCredit) return;

    AdminService.addCredits(
      selectedResellerForCredit.id,
      Number(creditAmountToAdd),
      `Recarga efetuada pelo Administrador Master`
    );

    refreshAll();
    setIsAddCreditModalOpen(false);
    setSelectedResellerForCredit(null);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0b0e14]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand & Back to Player */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBackToPlayer}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Voltar ao Player</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.35)]">
              <Tv className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">MasterTV</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Painel Pro
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Gestao de Clientes & Revendedores</span>
            </div>
          </div>
        </div>

        {/* Right: Role Switcher & Balance */}
        <div className="flex items-center gap-3">
          {/* Simulation Role Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setCurrentRole('admin')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👑 Admin Master
            </button>
            <button
              onClick={() => setCurrentRole('reseller')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'reseller'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🤝 Visao Revendedor
            </button>
          </div>

          {/* Credits pill when in reseller view */}
          {currentRole === 'reseller' && activeReseller && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <Coins className="w-4 h-4 text-purple-400" />
              <span>{activeReseller.credits} Créditos</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Visao Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes & Linhas ({filteredClients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trials')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'trials'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Gerador de Testes (1 Clique)</span>
          </button>

          {currentRole === 'admin' && (
            <button
              onClick={() => setActiveTab('resellers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'resellers'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Coins className="w-4 h-4 text-purple-400" />
              <span>Revendedores ({resellers.length})</span>
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              onClick={() => setActiveTab('contents')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'contents'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Conteudo (Filmes, Canais, Series) ({Array.isArray(contents) ? contents.length : 0})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuracoes</span>
          </button>
        </nav>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Total de Clientes</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{metrics.totalClients}</span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {metrics.activeClients} ativos
                  </span>
                </div>
              </div>

              <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Testes Ativos</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">{metrics.trialClients}</span>
                  <span className="text-[11px] font-bold text-slate-400">em andamento</span>
                </div>
              </div>

              <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Vencem em 7 Dias</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-rose-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-400">{metrics.expiringIn7Days}</span>
                  <span className="text-[11px] font-bold text-slate-400">precisam renovar</span>
                </div>
              </div>

              <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Faturamento Estimado</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    R$ {metrics.monthlyRevenueEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">/mês</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                  <Zap className="w-6 h-6 fill-slate-950" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-white">Criar Teste Rápido em 1 Segundo</h3>
                  <p className="text-xs text-slate-400">Gere um acesso de teste gratuito e copie a mensagem pronta para enviar no WhatsApp.</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('trials')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-400/25 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Gerar Teste Agora</span>
                </button>
                <button
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>Novo Cliente Oficial</span>
                </button>
              </div>
            </div>

            {/* Recent Clients Table Preview */}
            <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">Ultimas Linhas Adicionadas</h3>
                <button
                  onClick={() => setActiveTab('clients')}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="pb-3 font-semibold">Cliente</th>
                      <th className="pb-3 font-semibold">Usuario / Senha</th>
                      <th className="pb-3 font-semibold">Plano</th>
                      <th className="pb-3 font-semibold">Vencimento</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {clients.slice(0, 5).map((c) => {
                      const exp = new Date(c.expiresAt);
                      const isExpired = exp.getTime() < Date.now();
                      return (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-bold text-white flex items-center gap-2">
                            <span>{c.customerName}</span>
                          </td>
                          <td className="py-3">
                            <span className="font-mono text-cyan-300 font-bold">{c.username}</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="font-mono text-slate-300">{c.password}</span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-mono font-bold text-[10px]">
                              {c.planDuration}
                            </span>
                          </td>
                          <td className="py-3 text-slate-300">
                            {exp.toLocaleDateString('pt-BR')} {exp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3">
                            {c.status === 'active' && !isExpired && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                Ativo
                              </span>
                            )}
                            {c.status === 'trial' && !isExpired && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                                Teste
                              </span>
                            )}
                            {(c.status === 'expired' || isExpired) && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                                Vencido
                              </span>
                            )}
                            {c.status === 'blocked' && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 font-bold text-[10px]">
                                Bloqueado
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setWhatsAppModalClient(c)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                              title="Copiar dados para WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENTS & LINES */}
        {activeTab === 'clients' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Header Controls: Search, Filters & Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, usuário ou WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0b0e14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="trial">Testes</option>
                  <option value="expired">Vencidos</option>
                  <option value="blocked">Bloqueados</option>
                </select>

                <button
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-400/25 transition-all cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 fill-slate-950" />
                  <span>Novo Cliente</span>
                </button>
              </div>
            </div>

            {/* Clients Table */}
            <div className="bg-[#0b0e14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                      <th className="py-3 px-4 font-semibold">Cliente / Telefone</th>
                      <th className="py-3 px-4 font-semibold">Usuário & Senha</th>
                      <th className="py-3 px-4 font-semibold">Plano</th>
                      <th className="py-3 px-4 font-semibold">Vencimento</th>
                      <th className="py-3 px-4 font-semibold">Telas</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Nenhum cliente encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((c) => {
                        const exp = new Date(c.expiresAt);
                        const isExpired = exp.getTime() < Date.now();
                        return (
                          <tr key={c.id} className="hover:bg-white/5 transition-colors">
                            {/* Customer Name & Phone */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-white text-sm">{c.customerName}</span>
                                {c.customerPhone && (
                                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-cyan-400" />
                                    {c.customerPhone}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Credentials */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col font-mono text-[11px]">
                                  <span className="text-cyan-400 font-bold">{c.username}</span>
                                  <span className="text-slate-400">{c.password}</span>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(`${c.username}:${c.password}`, c.id)}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                                  title="Copiar usuário e senha"
                                >
                                  {copiedId === c.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Plan */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 font-bold text-[11px]">
                                {c.planDuration}
                              </span>
                            </td>

                            {/* Expiry Date */}
                            <td className="py-3.5 px-4 text-slate-200">
                              <div className="flex flex-col">
                                <span className="font-semibold">{exp.toLocaleDateString('pt-BR')}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {exp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>

                            {/* Screens */}
                            <td className="py-3.5 px-4 font-mono">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-cyan-300 font-bold">
                                {c.maxScreens} {c.maxScreens > 1 ? 'telas' : 'tela'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {c.status === 'active' && !isExpired && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                  Ativo
                                </span>
                              )}
                              {c.status === 'trial' && !isExpired && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                                  Teste
                                </span>
                              )}
                              {(c.status === 'expired' || isExpired) && (
                                <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                                  Vencido
                                </span>
                              )}
                              {c.status === 'blocked' && (
                                <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 font-bold text-[10px]">
                                  Bloqueado
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Share / WhatsApp */}
                                <button
                                  onClick={() => setWhatsAppModalClient(c)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                                  title="Enviar dados no WhatsApp"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>

                                {/* Renew +30 days */}
                                <button
                                  onClick={() => handleRenew(c, '30d')}
                                  className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 cursor-pointer"
                                  title="Renovar por +30 dias"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>

                                {/* Block/Unblock */}
                                <button
                                  onClick={async () => {
                                    await AdminService.toggleBlockClient(c.id);
                                    refreshAll();
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                                  title={c.status === 'blocked' ? 'Desbloquear linha' : 'Bloquear linha'}
                                >
                                  {c.status === 'blocked' ? (
                                    <Unlock className="w-4 h-4 text-amber-400" />
                                  ) : (
                                    <Lock className="w-4 h-4" />
                                  )}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteClient(c.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                                  title="Excluir cliente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 1-CLICK TRIAL GENERATOR */}
        {activeTab === 'trials' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="bg-[#0b0e14] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-[0_0_30px_rgba(0,240,255,0.4)]">
                  <Zap className="w-6 h-6 fill-slate-950" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-white">Gerador de Testes em 1 Clique</h2>
                  <p className="text-xs text-slate-400">Gera credenciais seguras e formata a mensagem com link web e APK.</p>
                </div>
              </div>

              <form onSubmit={handleCreateQuickTrial} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Nome do Prospecto / Cliente (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva (ou deixe em branco para gerar aleatório)"
                    value={trialName}
                    onChange={(e) => setTrialName(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Duração do Teste Gratuito:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 24].map((hours) => (
                      <button
                        type="button"
                        key={hours}
                        onClick={() => setTrialDurationHours(hours)}
                        className={`py-3 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                          trialDurationHours === hours
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                            : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {hours} {hours === 1 ? 'Hora' : 'Horas'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-400/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5 fill-slate-950" />
                  <span>GERAR TESTE & COPIAR PARA WHATSAPP</span>
                </button>
              </form>
            </div>

            {/* Last generated trial badge */}
            {lastGeneratedTrial && (
              <div className="bg-[#0b0e14] border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Teste Gerado com Sucesso!</span>
                    <span className="text-xs text-slate-400 font-mono">
                      Usuario: <strong className="text-cyan-300">{lastGeneratedTrial.username}</strong> | Senha: <strong>{lastGeneratedTrial.password}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setWhatsAppModalClient(lastGeneratedTrial)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Ver Mensagem</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RESELLERS & CREDITS (Only for Master Admin) */}
        {activeTab === 'resellers' && currentRole === 'admin' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Gerenciamento de Revendedores</h2>
                <p className="text-xs text-slate-400">Controle de parceiros, injete creditos e defina precos de custo.</p>
              </div>

              <button
                onClick={() => setIsNewResellerModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Novo Revendedor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resellers.map((r) => {
                const resellerClientsCount = clients.filter((c) => c.createdBy === r.id).length;
                return (
                  <div
                    key={r.id}
                    className="bg-[#0b0e14] border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-white text-base">{r.name}</h3>
                          <span className="text-xs text-slate-400 font-mono">@{r.username}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {r.status === 'active' ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-white/5 text-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Saldo de Créditos</span>
                        <span className="text-xl font-black text-purple-400">{r.credits}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Clientes Ativos</span>
                        <span className="text-xl font-black text-cyan-400">{resellerClientsCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Preco por credito:</span>
                      <strong className="text-white">R$ {Number(r.pricePerCredit || 0).toFixed(2)}</strong>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => {
                          setSelectedResellerForCredit(r);
                          setIsAddCreditModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Coins className="w-4 h-4 text-purple-400" />
                        <span>Injetar Créditos</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveResellerId(r.id);
                          setCurrentRole('reseller');
                          setActiveTab('clients');
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                        title="Simular visualização como este revendedor"
                      >
                        <ExternalLink className="w-4 h-4 text-cyan-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: CONTENT & VOD / LIVE CHANNELS MANAGEMENT */}
        {activeTab === 'contents' && currentRole === 'admin' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0e14] border border-white/10 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <Film className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">Gerenciador de Catalogo & Conteudo</h2>
                  <p className="text-xs text-slate-400">
                    Cadastre filmes, series, canais ao vivo e animes com sincronizacao automatica no banco de dados.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    AdminService.fetchRemoteContents().then(setContents);
                  }}
                  title="Atualizar lista do banco"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  onClick={() => setIsM3UModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:text-cyan-200 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  title="Importar lista M3U completa da Saimon-TV ou outros servidores"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Importar M3U</span>
                </button>

                <button
                  onClick={openAddContentModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Adicionar Conteudo</span>
                </button>
              </div>
            </div>

            {/* Filter Pills and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setContentFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentFilter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({Array.isArray(contents) ? contents.length : 0})
                </button>
                <button
                  onClick={() => setContentFilter('movie')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentFilter === 'movie'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Filmes ({Array.isArray(contents) ? contents.filter((c) => c && c.type === 'movie').length : 0})
                </button>
                <button
                  onClick={() => setContentFilter('series')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentFilter === 'series'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Series ({Array.isArray(contents) ? contents.filter((c) => c && c.type === 'series').length : 0})
                </button>
                <button
                  onClick={() => setContentFilter('channel')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentFilter === 'channel'
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Canais Ao Vivo ({Array.isArray(contents) ? contents.filter((c) => c && c.type === 'channel').length : 0})
                </button>
                <button
                  onClick={() => setContentFilter('anime')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentFilter === 'anime'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Animes ({Array.isArray(contents) ? contents.filter((c) => c && c.type === 'anime').length : 0})
                </button>
                <button
                  onClick={() => setContentFilter('dorama')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    contentFilter === 'dorama'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Doramas ({Array.isArray(contents) ? contents.filter((c) => c && c.type === 'dorama').length : 0})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por titulo ou genero..."
                  value={contentSearchQuery}
                  onChange={(e) => setContentSearchQuery(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Content Cards Grid */}
            {filteredContents.length === 0 ? (
              <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Nenhum conteudo encontrado</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  {contentSearchQuery
                    ? 'Nenhum resultado corresponde a sua busca. Tente outros termos.'
                    : 'Nenhum item cadastrado nesta categoria. Clique no botao abaixo para adicionar filmes ou canais.'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setIsM3UModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Importar Lista M3U</span>
                  </button>
                  <button
                    onClick={openAddContentModal}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    + Adicionar Manualmente
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContents.map((item) => {
                  const typeBadgeBg =
                    item.type === 'channel'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : item.type === 'series'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : item.type === 'anime'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : item.type === 'dorama'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

                  const typeLabel =
                    item.type === 'channel'
                      ? 'AO VIVO'
                      : item.type === 'series'
                      ? 'SERIE'
                      : item.type === 'anime'
                      ? 'ANIME'
                      : item.type === 'dorama'
                      ? 'DORAMA'
                      : 'FILME';

                  return (
                    <div
                      key={item.id}
                      className="bg-[#0b0e14] border border-white/10 hover:border-cyan-400/40 rounded-2xl p-3 sm:p-4 flex gap-3.5 transition-all shadow-md group relative overflow-hidden"
                    >
                      {/* Poster / Thumbnail with fallback */}
                      <div className="w-24 h-36 rounded-xl bg-slate-950 border border-white/10 overflow-hidden shrink-0 relative shadow-inner">
                        <img
                          src={item.posterUrl || './covers/default.webp'}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-white/10">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{Number(item.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex flex-col gap-1">
                          {/* Type Badge & Year */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${typeBadgeBg}`}>
                              {typeLabel}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{item.year}</span>
                            {item.duration && (
                              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-slate-500" />
                                {item.duration}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {item.title}
                          </h4>

                          {/* Genres */}
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {Array.isArray(item.genres) ? item.genres.join(' · ') : item.genres}
                          </p>

                          {/* Synopsis preview */}
                          {item.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Stream URL snippet and action buttons */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-2">
                          <button
                            onClick={() => copyToClipboard(item.streamUrl, `url-${item.id}`)}
                            title="Copiar link do stream"
                            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer truncate max-w-[130px]"
                          >
                            {copiedId === `url-${item.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 shrink-0" />
                            )}
                            <span className="truncate">{copiedId === `url-${item.id}` ? 'Copiado!' : item.streamUrl}</span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditContentModal(item)}
                              title="Editar conteudo"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent(item)}
                              title="Excluir conteudo"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition-all cursor-pointer"
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
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
              <div>
                <h2 className="text-lg font-black text-white">Configurações Gerais do Sistema</h2>
                <p className="text-xs text-slate-400">Ajuste o modelo de mensagem WhatsApp e links de download do APK e Web Player.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Nome do Servidor / Painel:</label>
                  <input
                    type="text"
                    value={settings.serverName}
                    onChange={(e) => setSettings({ ...settings, serverName: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">URL do Web Player:</label>
                    <input
                      type="text"
                      value={settings.webPlayerUrl}
                      onChange={(e) => setSettings({ ...settings, webPlayerUrl: e.target.value })}
                      className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Link Direto do APK Android:</label>
                    <input
                      type="text"
                      value={settings.apkDownloadUrl}
                      onChange={(e) => setSettings({ ...settings, apkDownloadUrl: e.target.value })}
                      className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Modelo de Mensagem para Envio no WhatsApp:
                  </label>
                  <textarea
                    rows={8}
                    value={settings.customWhatsAppTemplate}
                    onChange={(e) => setSettings({ ...settings, customWhatsAppTemplate: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-500">
                    Tags dinâmicas: <code>{'{customerName}'}</code>, <code>{'{username}'}</code>, <code>{'{password}'}</code>, <code>{'{expiresAt}'}</code>, <code>{'{maxScreens}'}</code>, <code>{'{apkUrl}'}</code>, <code>{'{webUrl}'}</code>
                  </span>
                </div>

                <button
                  onClick={() => {
                    AdminService.saveSettings(settings);
                    alert('Configurações salvas com sucesso!');
                  }}
                  className="py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/25 transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>

            {/* Danger Zone: Reset Database */}
            <div className="bg-[#0b0e14] border border-red-500/20 rounded-2xl p-6 flex flex-col gap-3 shadow-xl">
              <div>
                <h3 className="text-sm font-black text-red-400">Zerar Dados do Painel</h3>
                <p className="text-xs text-slate-400">
                  Limpa todas as linhas de clientes, testes e histórico em cache deste navegador para iniciar 100% limpo.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Tem certeza de que deseja zerar todos os clientes e revendedores do navegador?')) {
                    localStorage.removeItem('mastertv_admin_clients_v2');
                    localStorage.removeItem('mastertv_admin_clients_v1');
                    localStorage.removeItem('mastertv_admin_resellers_v2');
                    localStorage.removeItem('mastertv_admin_resellers_v1');
                    localStorage.removeItem('mastertv_admin_transactions_v2');
                    localStorage.removeItem('mastertv_admin_transactions_v1');
                    localStorage.removeItem('mastertv_client_session_v2');
                    localStorage.removeItem('mastertv_client_session_v1');
                    setClients([]);
                    setResellers([]);
                    alert('Dados zerados com sucesso!');
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs transition-all w-fit cursor-pointer"
              >
                Zerar Todos os Dados Agora
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: NEW CLIENT */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-white/15 rounded-3xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>Cadastrar Novo Cliente</span>
              </h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-300">Nome do Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">WhatsApp (com DDD):</label>
                  <input
                    type="tel"
                    placeholder="11988887777"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Duração do Plano:</label>
                  <select
                    value={newClientDuration}
                    onChange={(e) => setNewClientDuration(e.target.value as PlanDuration)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-bold"
                  >
                    <option value="4h">Teste Grátis (4 Horas)</option>
                    <option value="24h">Teste Grátis (24 Horas)</option>
                    <option value="30d">Mensal (30 Dias) - 1 Crédito</option>
                    <option value="90d">Trimestral (90 Dias) - 3 Créditos</option>
                    <option value="180d">Semestral (180 Dias) - 6 Créditos</option>
                    <option value="365d">Anual (365 Dias) - 12 Créditos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Usuário (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Gera automático se vazio"
                    value={newClientUsername}
                    onChange={(e) => setNewClientUsername(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Senha (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Gera automático se vazio"
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-300">Telas Simultâneas:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setNewClientScreens(s)}
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        newClientScreens === s
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-white/10 text-slate-400'
                      }`}
                    >
                      {s} {s > 1 ? 'Telas' : 'Tela'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black shadow-lg shadow-cyan-400/25 transition-all cursor-pointer"
                >
                  Ativar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW RESELLER */}
      {isNewResellerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-purple-500/30 rounded-3xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-400" />
                <span>Adicionar Novo Revendedor</span>
              </h3>
              <button
                onClick={() => setIsNewResellerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReseller} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-300">Nome do Revendedor:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Revenda MG"
                  value={newResellerName}
                  onChange={(e) => setNewResellerName(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Usuário de Login:</label>
                  <input
                    type="text"
                    required
                    placeholder="joao.mg"
                    value={newResellerUsername}
                    onChange={(e) => setNewResellerUsername(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Senha:</label>
                  <input
                    type="text"
                    placeholder="Gera automático"
                    value={newResellerPassword}
                    onChange={(e) => setNewResellerPassword(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">WhatsApp:</label>
                  <input
                    type="tel"
                    placeholder="31999998888"
                    value={newResellerPhone}
                    onChange={(e) => setNewResellerPhone(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Créditos Iniciais:</label>
                  <input
                    type="number"
                    min="0"
                    value={newResellerCredits}
                    onChange={(e) => setNewResellerCredits(Number(e.target.value))}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400 font-mono font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Preço/Crédito (R$):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={newResellerPrice}
                    onChange={(e) => setNewResellerPrice(Number(e.target.value))}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setIsNewResellerModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                >
                  Cadastrar Revendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CREDITS */}
      {isAddCreditModalOpen && selectedResellerForCredit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-purple-500/40 rounded-3xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-400" />
                <span>Recarregar Créditos: {selectedResellerForCredit.name}</span>
              </h3>
              <button
                onClick={() => setIsAddCreditModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCreditsSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 font-bold">Saldo Atual:</span>
                <span className="text-lg font-black text-purple-400">{selectedResellerForCredit.credits} créditos</span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-300">Escolha a Quantidade para Adicionar:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setCreditAmountToAdd(amt)}
                      className={`py-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                        creditAmountToAdd === amt
                          ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-300">Ou digite o valor exato:</label>
                <input
                  type="number"
                  min="1"
                  value={creditAmountToAdd}
                  onChange={(e) => setCreditAmountToAdd(Number(e.target.value))}
                  className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-purple-400"
                />
              </div>

              <button
                type="submit"
                className="mt-2 py-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
              >
                Confirmar Recarga de +{creditAmountToAdd} Créditos
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: WHATSAPP SHARING */}
      {whatsAppModalClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Dados de Acesso Formatados</h3>
              </div>
              <button
                onClick={() => setWhatsAppModalClient(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto scrollbar-thin">
              {AdminService.formatWhatsAppMessage(whatsAppModalClient)}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => {
                  copyToClipboard(AdminService.formatWhatsAppMessage(whatsAppModalClient), 'modal-msg');
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedId === 'modal-msg' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Mensagem Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>Copiar Mensagem</span>
                  </>
                )}
              </button>

              {whatsAppModalClient.customerPhone && (
                <a
                  href={`https://wa.me/${whatsAppModalClient.customerPhone}?text=${encodeURIComponent(
                    AdminService.formatWhatsAppMessage(whatsAppModalClient)
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Abrir WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CONTENT (MOVIES, SERIES, LIVE CHANNELS, ANIMES) */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0e14] border border-white/15 rounded-3xl max-w-5xl w-full p-5 sm:p-7 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200 my-6 max-h-[92vh] overflow-y-auto scrollbar-thin">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {editingContentId ? 'Editar Conteudo' : 'Adicionar Novo Conteudo ao Catalogo'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Preencha as informacoes do filme, serie, anime ou canal ao vivo para exibir no MasterTV.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsContentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Status Feedback Banner */}
            {contentStatusFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  contentStatusFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/15 border border-red-500/40 text-red-300'
                }`}
              >
                {contentStatusFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{contentStatusFeedback.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveContent} className="flex flex-col gap-4 text-xs">
              {/* Row 1: Content Type Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-300">Tipo de Conteudo:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('movie');
                      if (!editingContentId) setFormDuration('1h 45m');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formType === 'movie'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-950 text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <span>🎬 Filme</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('series');
                      if (!editingContentId) setFormDuration('45 min/ep');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formType === 'series'
                        ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                        : 'bg-slate-950 text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <span>📺 Serie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('channel');
                      if (!editingContentId) setFormDuration('Ao Vivo');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formType === 'channel'
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                        : 'bg-slate-950 text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <span>📡 Canal Ao Vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('anime');
                      if (!editingContentId) setFormDuration('24 min/ep');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formType === 'anime'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-950 text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <span>⚡ Anime</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('dorama');
                      if (!editingContentId) setFormDuration('1h 05m/ep');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formType === 'dorama'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-slate-950 text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <span>🌸 Dorama</span>
                  </button>
                </div>
              </div>

              {/* Conditional Layout: Channel Form vs VOD (Movie / Series / Anime / Dorama) Form */}
              {formType === 'channel' ? (
                /* DEDICATED LIVE TV CHANNEL FORM */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Left 2 Columns: Core Channel Information, Sources and EPG */}
                  <div className="lg:col-span-2 flex flex-col gap-3.5">
                    {/* Channel Name */}
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-300">
                        Nome do Canal de TV: *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Globo SP HD, HBO, Premiere 1, SporTV, ESPN..."
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-400 font-semibold"
                      />
                    </div>

                    {/* Channel Number & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-300">
                          Numero do Canal (Grade): *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={formChannelNumber}
                          onChange={(e) => setFormChannelNumber(parseInt(e.target.value, 10) || 1)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-400 font-bold"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-300">
                          Categoria do Canal:
                        </label>
                        <select
                          value={formChannelCategory}
                          onChange={(e) => setFormChannelCategory(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-400 font-semibold cursor-pointer"
                        >
                          <option value="aberta">TV Aberta</option>
                          <option value="esportes">Esportes & Futebol</option>
                          <option value="filmes">Filmes & Series</option>
                          <option value="noticias">Noticias & Jornalismo</option>
                          <option value="infantil">Infantil & Desenhos</option>
                          <option value="documentarios">Documentarios & Cultura</option>
                          <option value="variedades">Variedades & Entretenimento</option>
                          <option value="musica">Musica & Shows</option>
                        </select>
                      </div>
                    </div>

                    {/* 4 Sources of Transmission (HD and FHD) */}
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-red-950/20 border border-red-500/20">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-red-300">
                          Links do Canal (Fontes Principais e Alternativas)
                        </span>
                        <span className="text-xs text-slate-400">
                          Configure as fontes de transmissao (.m3u8 / .mp4) e links de backup para redundancia automatica caso a principal caia.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-1">
                        {/* Source 1 (HD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400"></span>
                              Fonte 1 (HD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                              Principal HD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal: *
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/canal-fonte1.m3u8"
                              value={formSource1HdUrl}
                              onChange={(e) => {
                                setFormSource1HdUrl(e.target.value);
                                setFormStreamUrl(e.target.value);
                              }}
                              className="bg-slate-950 border border-red-500/40 focus:border-red-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/canal-backup1.m3u8"
                              value={formSource1HdBackup}
                              onChange={(e) => {
                                setFormSource1HdBackup(e.target.value);
                                setFormBackupStreamUrl(e.target.value);
                              }}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-red-400"
                            />
                          </div>
                        </div>

                        {/* Source 2 (HD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                              Fonte 2 (HD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              Alternativa HD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal:
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/canal-fonte2.m3u8"
                              value={formSource2HdUrl}
                              onChange={(e) => setFormSource2HdUrl(e.target.value)}
                              className="bg-slate-950 border border-white/10 focus:border-orange-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/canal-backup2.m3u8"
                              value={formSource2HdBackup}
                              onChange={(e) => setFormSource2HdBackup(e.target.value)}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-orange-400"
                            />
                          </div>
                        </div>

                        {/* Source 3 (FHD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Fonte 3 (FHD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              1080p FHD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal:
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/canal-fonte3-fhd.m3u8"
                              value={formSource3FhdUrl}
                              onChange={(e) => setFormSource3FhdUrl(e.target.value)}
                              className="bg-slate-950 border border-white/10 focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/canal-backup3.m3u8"
                              value={formSource3FhdBackup}
                              onChange={(e) => setFormSource3FhdBackup(e.target.value)}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>

                        {/* Source 4 (FHD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                              Fonte 4 (FHD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              1080p FHD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal:
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/canal-fonte4-fhd.m3u8"
                              value={formSource4FhdUrl}
                              onChange={(e) => setFormSource4FhdUrl(e.target.value)}
                              className="bg-slate-950 border border-white/10 focus:border-purple-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/canal-backup4.m3u8"
                              value={formSource4FhdBackup}
                              onChange={(e) => setFormSource4FhdBackup(e.target.value)}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sincronizacao de EPG (Guia de Programacao) */}
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/25">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tv className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-white">
                            Sincronizar EPG (Guia de Programacao Online)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSyncChannelEPG}
                          disabled={isSyncingEPG}
                          className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-500/20"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEPG ? 'animate-spin' : ''}`} />
                          <span>{isSyncingEPG ? 'Sincronizando...' : 'Sincronizar EPG Agora'}</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Vincule este canal a uma emissora da grade para carregar automaticamente horarios, titulos e sinopses em tempo real.
                      </p>

                      {epgSyncStatus && (
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                          <span>{epgSyncStatus}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-300">
                            Vincular Emissora do EPG XMLTV:
                          </label>
                          <select
                            value={formEpgId}
                            onChange={(e) => setFormEpgId(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400 font-semibold cursor-pointer"
                          >
                            <option value="ch-globo">Globo SP</option>
                            <option value="ch-sbt">SBT</option>
                            <option value="ch-record">Record TV</option>
                            <option value="ch-band">Band</option>
                            <option value="ch-redetv">Rede TV!</option>
                            <option value="ch-espn">ESPN Brasil</option>
                            <option value="ch-premiere-clubes">Premiere Clubes</option>
                            <option value="ch-hbo">HBO</option>
                            <option value="ch-amc">AMC</option>
                            <option value="custom">Outro (Inserir ID Manual)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-300">
                            Programa Atual (EPG Inicial / Fallback):
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Jornal Nacional, Futebol Ao Vivo..."
                            value={formCurrentProgram}
                            onChange={(e) => setFormCurrentProgram(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      {formEpgId === 'custom' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-cyan-300">
                            ID / Tag do Canal no XMLTV EPG:
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: sportv.br, foxsports.br, cnn.br..."
                            value={formEpgId === 'custom' ? '' : formEpgId}
                            onChange={(e) => setFormEpgId(e.target.value)}
                            className="bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Channel Logo and Live TV Card Preview */}
                  <div className="flex flex-col gap-3.5">
                    {/* Logo do Canal */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900/80 border border-white/10">
                      <label className="font-bold text-white text-xs">
                        Logo do Canal (URL da Imagem): *
                      </label>
                      <input
                        type="text"
                        placeholder="./logos/globosp.png ou https://.../logo.png"
                        value={formPosterUrl}
                        onChange={(e) => setFormPosterUrl(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-red-400"
                      />

                      {/* Quick Logos Selector */}
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Logos pre-cadastradas (clique para aplicar):
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                          {[
                            { name: 'Globo', path: './logos/globosp.png' },
                            { name: 'SBT', path: './logos/sbt.png' },
                            { name: 'Record', path: './logos/record.png' },
                            { name: 'Band', path: './logos/band.png' },
                            { name: 'Rede TV', path: './logos/redetv.png' },
                            { name: 'Premiere', path: './logos/premiere.png' },
                            { name: 'ESPN', path: './logos/espn.png' },
                            { name: 'SporTV', path: './logos/sportv.png' },
                            { name: 'HBO', path: './logos/hbo.png' },
                            { name: 'TNT', path: './logos/tnt.png' },
                            { name: 'Warner', path: './logos/warner.png' },
                            { name: 'Telecine', path: './logos/telecine.png' },
                            { name: 'CNN Brasil', path: './logos/cnnbrasil.png' },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setFormPosterUrl(preset.path)}
                              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                formPosterUrl === preset.path
                                  ? 'bg-red-500/20 border-red-500 text-red-300'
                                  : 'bg-slate-950 border-white/10 text-slate-300 hover:text-white hover:border-white/30'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pre-visualizacao do Card de Canal no App */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5" />
                        <span>Pre-visualizacao do Canal na TV:</span>
                      </label>

                      <div className="bg-slate-950 border border-white/15 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl relative overflow-hidden">
                        {/* Top Row: Live badge and Quality */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-[10px] font-black text-red-400 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span>AO VIVO</span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                            HD / FHD
                          </span>
                        </div>

                        {/* Logo container */}
                        <div className="h-28 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center p-3 relative group">
                          {formPosterUrl ? (
                            <img
                              src={formPosterUrl}
                              alt={formTitle || 'Canal'}
                              className="max-h-full max-w-full object-contain filter drop-shadow-md"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-slate-600 text-xs">
                              <Tv className="w-8 h-8 text-slate-600" />
                              <span>Sem logo</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white border border-white/10">
                            CH {formChannelNumber < 10 ? `0${formChannelNumber}` : formChannelNumber}
                          </div>
                        </div>

                        {/* Channel Info and EPG Preview */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-sm font-black text-white line-clamp-1">
                              {formTitle || 'Nome do Canal'}
                            </h4>
                            <span className="text-[10px] uppercase font-bold text-red-400 shrink-0">
                              {formChannelCategory}
                            </span>
                          </div>

                          {/* Current program preview */}
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400">
                              No Ar Agora (EPG):
                            </span>
                            <p className="text-xs font-bold text-slate-200 line-clamp-1">
                              {formCurrentProgram || 'Programacao Ao Vivo'}
                            </p>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                              <div className="bg-gradient-to-r from-red-500 to-cyan-400 h-full w-2/3 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MOVIE, SERIES, ANIME, DORAMA FORM */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Left 2 Columns: Core Information */}
                  <div className="lg:col-span-2 flex flex-col gap-3.5">
                    {/* Title / Name */}
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-300">
                        Nome / Titulo do Filme ou Serie: *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Homem-Aranha, Breaking Bad, Naruto..."
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400 font-semibold"
                      />
                    </div>

                    {/* Rating, Duration, Year */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-300 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>Nota (0 a 10):</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={formRating}
                          onChange={(e) => setFormRating(parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>Duracao:</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 1h 45m"
                          value={formDuration}
                          onChange={(e) => setFormDuration(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-300">Ano:</label>
                        <input
                          type="number"
                          min="1950"
                          max="2035"
                          value={formYear}
                          onChange={(e) => setFormYear(parseInt(e.target.value, 10) || 2026)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Content Rating & Genres */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-300">Classificacao:</label>
                        <select
                          value={formContentRating}
                          onChange={(e) => setFormContentRating(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-semibold cursor-pointer"
                        >
                          <option value="Livre">Livre</option>
                          <option value="10">10 anos</option>
                          <option value="12">12 anos</option>
                          <option value="14">14 anos</option>
                          <option value="16">16 anos</option>
                          <option value="18">18 anos</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="font-bold text-slate-300">
                          Generos (separados por virgula):
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Acao, Ficcao Cientifica, Aventura"
                          value={formGenres}
                          onChange={(e) => setFormGenres(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Sources Configuration (HD and FHD with redundancy/backup) */}
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-cyan-300">
                          Fontes de Transmissao e Backup (HD e FHD)
                        </span>
                        <span className="text-xs text-slate-400">
                          Configure as fontes principais de reproducao e seus respectivos links de backup caso o sinal principal caia.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-1">
                        {/* Source 1 (HD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                              Fonte 1 (HD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Principal HD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal: *
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/fonte1-hd.m3u8 ou .mp4"
                              value={formSource1HdUrl}
                              onChange={(e) => {
                                setFormSource1HdUrl(e.target.value);
                                setFormStreamUrl(e.target.value);
                              }}
                              className="bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/fonte1-hd-backup.m3u8"
                              value={formSource1HdBackup}
                              onChange={(e) => {
                                setFormSource1HdBackup(e.target.value);
                                setFormBackupStreamUrl(e.target.value);
                              }}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        {/* Source 2 (HD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                              Fonte 2 (HD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              Alternativa HD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal:
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/fonte2-hd.m3u8"
                              value={formSource2HdUrl}
                              onChange={(e) => setFormSource2HdUrl(e.target.value)}
                              className="bg-slate-950 border border-white/10 focus:border-sky-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/fonte2-hd-backup.m3u8"
                              value={formSource2HdBackup}
                              onChange={(e) => setFormSource2HdBackup(e.target.value)}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-sky-400"
                            />
                          </div>
                        </div>

                        {/* Source 3 (FHD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Fonte 3 (FHD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              1080p FHD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal:
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/fonte3-fhd.m3u8"
                              value={formSource3FhdUrl}
                              onChange={(e) => setFormSource3FhdUrl(e.target.value)}
                              className="bg-slate-950 border border-white/10 focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/fonte3-fhd-backup.m3u8"
                              value={formSource3FhdBackup}
                              onChange={(e) => setFormSource3FhdBackup(e.target.value)}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>

                        {/* Source 4 (FHD) */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                              Fonte 4 (FHD)
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              1080p FHD
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Link Principal:
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/fonte4-fhd.m3u8"
                              value={formSource4FhdUrl}
                              onChange={(e) => setFormSource4FhdUrl(e.target.value)}
                              className="bg-slate-950 border border-white/10 focus:border-purple-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400">
                              Link Backup (Opcional):
                            </label>
                            <input
                              type="url"
                              placeholder="https://backup.exemplo.com/fonte4-fhd-backup.m3u8"
                              value={formSource4FhdBackup}
                              onChange={(e) => setFormSource4FhdBackup(e.target.value)}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Series / Anime Specific Fields */}
                    {(formType === 'series' || formType === 'anime' || formType === 'dorama') && (
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-purple-300">Temporadas:</label>
                          <input
                            type="number"
                            min="1"
                            value={formSeasons}
                            onChange={(e) => setFormSeasons(parseInt(e.target.value, 10) || 1)}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-purple-300">Total de Episodios:</label>
                          <input
                            type="number"
                            min="1"
                            value={formEpisodes}
                            onChange={(e) => setFormEpisodes(parseInt(e.target.value, 10) || 1)}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Synopsis / Description */}
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-300">Sinopse / Descricao:</label>
                      <textarea
                        rows={3}
                        placeholder="Resumo ou descricao completa do filme, anime ou serie..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 scrollbar-thin"
                      />
                    </div>
                  </div>

                  {/* Right Column: Banners, Preview and Cast */}
                  <div className="flex flex-col gap-3.5">
                    {/* Banner / Poster URL */}
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-300">
                        Banner / Capa Vertical (Poster URL):
                      </label>
                      <input
                        type="url"
                        placeholder="https://link-da-imagem.com/poster.webp"
                        value={formPosterUrl}
                        onChange={(e) => setFormPosterUrl(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Backdrop URL */}
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-300">
                        Backdrop Horizontal (Fundo / Banner Largo):
                      </label>
                      <input
                        type="url"
                        placeholder="https://link-da-imagem.com/backdrop.webp"
                        value={formBackdropUrl}
                        onChange={(e) => setFormBackdropUrl(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Director & Production */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-400 text-[11px]">Diretor:</label>
                        <input
                          type="text"
                          placeholder="Ex: Christopher Nolan"
                          value={formDirector}
                          onChange={(e) => setFormDirector(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-400 text-[11px]">Produtora:</label>
                        <input
                          type="text"
                          placeholder="Ex: Warner Bros"
                          value={formProduction}
                          onChange={(e) => setFormProduction(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Live Visual Card Preview */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Pre-visualizacao do Card no App:</span>
                      </label>
                      <div className="bg-slate-950 border border-white/15 rounded-2xl p-3 flex gap-3 shadow-inner">
                        <div className="w-20 h-28 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 relative">
                          {formPosterUrl ? (
                            <img
                              src={formPosterUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1 text-[9px]">
                              <Film className="w-5 h-5 text-slate-600" />
                              <span>Sem capa</span>
                            </div>
                          )}
                          <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-400">
                            <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
                            <span>{Number(formRating).toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400">
                              {formType}
                            </span>
                            <h5 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                              {formTitle || 'Titulo do Conteudo'}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formYear} · {formDuration || '2h'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-1">
                            {formGenres || 'Generos'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cast Members (Atores do Elenco) Section */}
                    <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-white">
                            Fotos de Perfil do Elenco ({formCast.length})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCastSlot}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Adicionar Mais</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        Adicione as fotos (URL) e nomes dos atores principais para exibir no perfil do titulo.
                      </p>

                      <div className="flex flex-col gap-2 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
                        {formCast.map((actor, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-2.5"
                          >
                            {/* Round Avatar Preview */}
                            <div className="w-10 h-10 rounded-full bg-slate-950 border border-cyan-500/40 overflow-hidden shrink-0 flex items-center justify-center relative">
                              {actor.photoUrl ? (
                                <img
                                  src={actor.photoUrl}
                                  alt={actor.name || `Ator ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Users className="w-4 h-4 text-slate-600" />
                              )}
                            </div>

                            {/* Inputs Column */}
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                              <input
                                type="url"
                                placeholder={`Foto URL do Ator ${idx + 1} (ex: https://.../ator.webp)`}
                                value={actor.photoUrl || ''}
                                onChange={(e) => handleCastChange(idx, 'photoUrl', e.target.value)}
                                className="bg-slate-950 border border-white/10 focus:border-cyan-400 rounded-lg px-2.5 py-1 text-white text-[11px] font-mono focus:outline-none w-full"
                              />
                              <div className="grid grid-cols-2 gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nome do Ator / Atriz"
                                  value={actor.name || ''}
                                  onChange={(e) => handleCastChange(idx, 'name', e.target.value)}
                                  className="bg-slate-950 border border-white/10 focus:border-cyan-400 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Personagem (opcional)"
                                  value={actor.character || ''}
                                  onChange={(e) => handleCastChange(idx, 'character', e.target.value)}
                                  className="bg-slate-950 border border-white/10 focus:border-cyan-400 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            {formCast.length > 1 && (
                              <button
                                type="button"
                                title="Remover este ator"
                                onClick={() => handleRemoveCastSlot(idx)}
                                className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCastSlot}
                        className="w-full py-1.5 rounded-xl border border-dashed border-cyan-500/30 hover:border-cyan-400/60 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Mais Ator ao Elenco</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setIsContentModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingContent}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingContent ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando no Banco...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{editingContentId ? 'Atualizar Conteudo' : 'Salvar no Catalogo'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* M3U & IPTV Playlist Importer Modal */}
      {isM3UModalOpen && (
        <M3UImporterModal
          isOpen={isM3UModalOpen}
          onClose={() => setIsM3UModalOpen(false)}
          onImportSuccess={() => {
            setContents(AdminService.getContents());
          }}
        />
      )}
    </div>
  );
};

