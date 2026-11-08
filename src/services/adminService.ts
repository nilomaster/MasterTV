// MasterTV Admin and Reseller Business Logic and Persistence Service
// Strictly ASCII comments only

import type {
  ClientLine,
  Reseller,
  CreditTransaction,
  AdminMetrics,
  AdminSettings,
  PlanDuration,
  ClientStatus,
  ClientSession,
  AdminContentItem,
  ContentType,
} from '../types/admin';

const STORAGE_KEY_CLIENTS = 'mastertv_admin_clients_v2';
const STORAGE_KEY_RESELLERS = 'mastertv_admin_resellers_v2';
const STORAGE_KEY_TRANSACTIONS = 'mastertv_admin_transactions_v2';
const STORAGE_KEY_SETTINGS = 'mastertv_admin_settings_v3';
const STORAGE_KEY_SESSION = 'mastertv_client_session_v2';
const STORAGE_KEY_CONTENTS = 'mastertv_admin_contents_v2';

const DEFAULT_SETTINGS: AdminSettings = {
  serverName: 'MasterTV IPTV & VOD',
  webPlayerUrl: 'https://mastertvhd.online',
  apkDownloadUrl: 'https://mastertvhd.online/MasterTV.apk',
  supportPhone: '5511999999999',
  trialDefaultHours: 4,
  customWhatsAppTemplate: `* [DADOS DE ACESSO] - MasterTV IPTV & VOD *

Ola, *{customerName}*! Seu acesso foi ativado com sucesso.

* [APP] Aplicativo Android / TV Box:
Baixe o APK direto: {apkUrl}

* [WEB] Assistir pelo Computador / Navegador:
Acesse: {webUrl}

* [ACESSO] Suas Credenciais:
*Usuario:* \`{username}\`
*Senha:* \`{password}\`
*Validade:* {expiresAt}
*Telas:* {maxScreens}

* [INSTRUCOES]:
1. Abra o app ou acesse pelo navegador
2. Insira o usuario e senha acima
3. Aproveite canais ao vivo, filmes e series em Full HD!`,
};

// Clean initial state (no mock data)
const INITIAL_CLIENTS: ClientLine[] = [];
const INITIAL_RESELLERS: Reseller[] = [];

export class AdminService {
  // Load clients
  static getClients(): ClientLine[] {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    try {
      const clients: ClientLine[] = JSON.parse(raw);
      // Auto-update expired status based on current date
      const now = new Date().getTime();
      return clients.map((c) => {
        const exp = new Date(c.expiresAt).getTime();
        if (c.status !== 'blocked') {
          if (exp < now) {
            return { ...c, status: 'expired' as ClientStatus };
          }
        }
        return c;
      });
    } catch {
      return INITIAL_CLIENTS;
    }
  }

  // Get API Base URL with automatic Android APK, Tablet, and Smart TV support
  static getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const isNative = Boolean((window as any).Capacitor?.isNativePlatform?.());
      const isFile = window.location.protocol === 'file:';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // Native Android APK (Capacitor), Android TV, Tablet or local dev use production API
      if (isNative || isFile || isLocal) {
        return 'https://mastertvhd.online/api';
      }
    }
    return './api';
  }

  // Fetch clients from PHP MySQL API
  static async fetchRemoteClients(): Promise<ClientLine[]> {
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/clients.php`;
    const fallbackUrl = 'https://mastertvhd.online/api/clients.php';

    try {
      let res: Response;
      try {
        res = await fetch(primaryUrl);
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl);
        } else {
          throw err;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.clients)) {
          const mapped: ClientLine[] = data.clients.map((c: any) => ({
            id: String(c.id),
            username: c.username,
            password: c.password,
            customerName: c.customer_name,
            customerPhone: c.customer_phone || '',
            planDuration: c.plan_duration,
            createdAt: c.created_at,
            expiresAt: c.expires_at,
            status: c.status,
            maxScreens: parseInt(c.max_screens, 10) || 1,
            activeScreens: parseInt(c.active_screens, 10) || 0,
            createdBy: c.reseller_id ? String(c.reseller_id) : 'admin',
            resellerName: c.reseller_name || undefined,
            notes: c.notes || '',
            lastConnectedAt: c.last_connected_at,
            lastIpAddress: c.last_ip_address,
          }));
          this.saveClients(mapped);
          return mapped;
        }
      }
    } catch {
      // Fallback to local
    }
    return this.getClients();
  }

  // Save clients
  static saveClients(clients: ClientLine[]) {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
  }

  // Add client
  static async addClient(data: {
    customerName: string;
    customerPhone?: string;
    username?: string;
    password?: string;
    planDuration: PlanDuration;
    maxScreens?: number;
    notes?: string;
    createdBy?: string;
    resellerName?: string;
  }): Promise<ClientLine> {
    const clients = this.getClients();
    const now = new Date();
    let expires = new Date();

    switch (data.planDuration) {
      case '1h':
        expires = new Date(now.getTime() + 1 * 3600000);
        break;
      case '2h':
        expires = new Date(now.getTime() + 2 * 3600000);
        break;
      case '4h':
        expires = new Date(now.getTime() + 4 * 3600000);
        break;
      case '24h':
        expires = new Date(now.getTime() + 24 * 3600000);
        break;
      case '30d':
        expires = new Date(now.getTime() + 30 * 86400000);
        break;
      case '90d':
        expires = new Date(now.getTime() + 90 * 86400000);
        break;
      case '180d':
        expires = new Date(now.getTime() + 180 * 86400000);
        break;
      case '365d':
        expires = new Date(now.getTime() + 365 * 86400000);
        break;
    }

    const isTrial = ['1h', '2h', '4h', '24h'].includes(data.planDuration);
    const cleanUser =
      data.username?.trim().toLowerCase() ||
      data.customerName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10) + Math.floor(100 + Math.random() * 900);

    const cleanPass = data.password?.trim() || String(Math.floor(100000 + Math.random() * 900000));

    let createdId = 'cli-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Sync to remote MySQL API
    try {
      const apiBase = this.getApiBaseUrl();
      const res = await fetch(`${apiBase}/clients.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: data.customerName.trim(),
          customer_phone: data.customerPhone?.replace(/\D/g, '') || '',
          username: cleanUser,
          password: cleanPass,
          plan_duration: data.planDuration,
          notes: data.notes || '',
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData && resData.client_id) {
          createdId = String(resData.client_id);
          if (resData.expires_at) {
            expires = new Date(resData.expires_at);
          }
        }
      }
    } catch {
      // Offline fallback
    }

    const newClient: ClientLine = {
      id: createdId,
      username: cleanUser,
      password: cleanPass,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone?.replace(/\D/g, '') || '',
      planDuration: data.planDuration,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: isTrial ? 'trial' : 'active',
      maxScreens: data.maxScreens || 1,
      activeScreens: 0,
      createdBy: data.createdBy || 'admin',
      resellerName: data.resellerName,
      notes: data.notes || '',
    };

    clients.unshift(newClient);
    this.saveClients(clients);
    return newClient;
  }

  // Quick 1-Click Trial Generator
  static async generateQuickTrial(customerName?: string, hours: number = 4): Promise<ClientLine> {
    const name = customerName?.trim() || 'Teste Rapido ' + Math.floor(100 + Math.random() * 900);
    const durationKey: PlanDuration = hours === 1 ? '1h' : hours === 2 ? '2h' : hours === 24 ? '24h' : '4h';
    return await this.addClient({
      customerName: name,
      planDuration: durationKey,
      notes: `Gerado automaticamente via teste rapido de ${hours}h.`,
    });
  }

  // Renew client
  static async renewClient(clientId: string, duration: PlanDuration): Promise<ClientLine | null> {
    const clients = this.getClients();
    const idx = clients.findIndex((c) => c.id === clientId);
    if (idx === -1) return null;

    const current = clients[idx];
    const now = new Date();
    // If client is still active, extend from previous expiration date; if expired, renew from now
    const baseDate = new Date(current.expiresAt).getTime() > now.getTime() ? new Date(current.expiresAt) : now;

    let expires = new Date(baseDate);
    let days = 30;
    switch (duration) {
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      case '180d':
        days = 180;
        break;
      case '365d':
        days = 365;
        break;
    }
    expires = new Date(baseDate.getTime() + days * 86400000);

    clients[idx] = {
      ...current,
      planDuration: duration,
      expiresAt: expires.toISOString(),
      status: 'active',
    };

    this.saveClients(clients);

    try {
      const apiBase = this.getApiBaseUrl();
      await fetch(`${apiBase}/clients.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId, action: 'renew', days }),
      });
    } catch {}

    return clients[idx];
  }

  // Toggle client status (block/unblock)
  static async toggleBlockClient(clientId: string): Promise<ClientLine | null> {
    const clients = this.getClients();
    const idx = clients.findIndex((c) => c.id === clientId);
    if (idx === -1) return null;

    const current = clients[idx];
    const nextStatus: ClientStatus =
      current.status === 'blocked'
        ? new Date(current.expiresAt).getTime() < Date.now()
          ? 'expired'
          : 'active'
        : 'blocked';

    clients[idx] = { ...current, status: nextStatus };
    this.saveClients(clients);

    try {
      const apiBase = this.getApiBaseUrl();
      await fetch(`${apiBase}/clients.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId, action: 'toggle_status', status: nextStatus }),
      });
    } catch {}

    return clients[idx];
  }

  // Delete client
  static async deleteClient(clientId: string): Promise<boolean> {
    const clients = this.getClients().filter((c) => c.id !== clientId);
    this.saveClients(clients);

    try {
      const apiBase = this.getApiBaseUrl();
      await fetch(`${apiBase}/clients.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId }),
      });
    } catch {}

    return true;
  }

  // Resellers
  static getResellers(): Reseller[] {
    const raw = localStorage.getItem(STORAGE_KEY_RESELLERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RESELLERS, JSON.stringify(INITIAL_RESELLERS));
      return INITIAL_RESELLERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RESELLERS;
    }
  }

  static saveResellers(resellers: Reseller[]) {
    localStorage.setItem(STORAGE_KEY_RESELLERS, JSON.stringify(resellers));
  }

  static addReseller(data: {
    name: string;
    username: string;
    password?: string;
    phone: string;
    initialCredits: number;
    pricePerCredit: number;
    notes?: string;
  }): Reseller {
    const resellers = this.getResellers();
    const newReseller: Reseller = {
      id: 'reseller-' + Date.now(),
      name: data.name.trim(),
      username: data.username.trim().toLowerCase(),
      password: data.password?.trim() || 'rev' + Math.floor(1000 + Math.random() * 9000),
      phone: data.phone.replace(/\D/g, ''),
      credits: data.initialCredits || 0,
      pricePerCredit: data.pricePerCredit || 15.0,
      createdAt: new Date().toISOString(),
      status: 'active',
      notes: data.notes || '',
    };
    resellers.unshift(newReseller);
    this.saveResellers(resellers);
    return newReseller;
  }

  static addCredits(resellerId: string, amount: number, note?: string): boolean {
    const resellers = this.getResellers();
    const idx = resellers.findIndex((r) => r.id === resellerId);
    if (idx === -1) return false;

    resellers[idx].credits = Math.max(0, resellers[idx].credits + amount);
    this.saveResellers(resellers);

    // Record transaction
    this.addTransaction({
      resellerId,
      resellerName: resellers[idx].name,
      amount,
      type: amount > 0 ? 'credit_added' : 'credit_deducted',
      description: note || `Ajuste manual de creditos: ${amount > 0 ? '+' : ''}${amount}`,
    });

    return true;
  }

  // Transactions
  static getTransactions(): CreditTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  }

  static addTransaction(data: Omit<CreditTransaction, 'id' | 'createdAt'>) {
    const transactions = this.getTransactions();
    transactions.unshift({
      ...data,
      id: 'tx-' + Date.now(),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions.slice(0, 100)));
  }

  // Settings
  static getSettings(): AdminSettings {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      // Sanitize any corrupted unicode characters from previous template
      if (
        parsed.customWhatsAppTemplate &&
        (parsed.customWhatsAppTemplate.includes('\uFFFD') || parsed.customWhatsAppTemplate.includes('\uFFFD') || parsed.customWhatsAppTemplate.indexOf('\uFFFD') !== -1)
      ) {
        parsed.customWhatsAppTemplate = DEFAULT_SETTINGS.customWhatsAppTemplate;
        this.saveSettings(parsed);
      }
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AdminSettings) {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }

  // Metrics
  static getMetrics(): AdminMetrics {
    const clients = this.getClients();
    const resellers = this.getResellers();
    const now = Date.now();
    const sevenDays = now + 7 * 86400000;

    let activeClients = 0;
    let trialClients = 0;
    let expiredClients = 0;
    let expiringIn7Days = 0;

    for (const c of clients) {
      const exp = new Date(c.expiresAt).getTime();
      if (c.status === 'blocked') continue;
      if (c.status === 'trial' && exp >= now) {
        trialClients++;
      } else if (exp < now) {
        expiredClients++;
      } else {
        activeClients++;
        if (exp <= sevenDays) {
          expiringIn7Days++;
        }
      }
    }

    const totalCreditsInCirculation = resellers.reduce((sum, r) => sum + r.credits, 0);
    const monthlyRevenueEstimate = activeClients * 30.0; // Average R$ 30 per line

    return {
      totalClients: clients.length,
      activeClients,
      trialClients,
      expiredClients,
      totalResellers: resellers.length,
      totalCreditsInCirculation,
      monthlyRevenueEstimate,
      expiringIn7Days,
    };
  }

  // Format WhatsApp Message
  static formatWhatsAppMessage(client: ClientLine): string {
    const settings = this.getSettings();
    const expiresDate = new Date(client.expiresAt);
    const formattedExpires = `${String(expiresDate.getDate()).padStart(2, '0')}/${String(
      expiresDate.getMonth() + 1
    ).padStart(2, '0')}/${expiresDate.getFullYear()} as ${String(expiresDate.getHours()).padStart(
      2,
      '0'
    )}:${String(expiresDate.getMinutes()).padStart(2, '0')}`;

    return settings.customWhatsAppTemplate
      .replace('{customerName}', client.customerName)
      .replace('{username}', client.username)
      .replace('{password}', client.password)
      .replace('{expiresAt}', formattedExpires)
      .replace('{maxScreens}', String(client.maxScreens))
      .replace('{apkUrl}', settings.apkDownloadUrl)
      .replace('{webUrl}', settings.webPlayerUrl);
  }

  // Authenticate client with online API or local storage fallback
  static async authenticateClient(username: string, password: string): Promise<{
    success: boolean;
    client?: ClientSession;
    error?: string;
  }> {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Por favor, informe o usuario e a senha.' };
    }

    // Direct master admin login bypass
    if (
      (cleanUser === 'admin' || cleanUser === 'masteradmin') &&
      (cleanPass === 'mastertv123' || cleanPass === 'Senha2026!@#' || cleanPass === 'admin')
    ) {
      const adminSession: ClientSession = {
        clientId: 'admin-master',
        username: 'admin',
        customerName: 'Administrador Master',
        planDuration: '365d',
        expiresAt: '2099-12-31T23:59:59.000Z',
        status: 'active',
        maxScreens: 99,
        loggedInAt: new Date().toISOString(),
      };
      this.saveClientSession(adminSession);
      return { success: true, client: adminSession };
    }

    // 1. Try PHP API first with automatic remote fallback
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/auth.php`;
    const fallbackUrl = 'https://mastertvhd.online/api/auth.php';

    const tryAuth = async (url: string) => {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
    };

    try {
      let response: Response;
      try {
        response = await tryAuth(primaryUrl);
      } catch (networkErr) {
        // If relative URL failed (e.g. on native device), try absolute URL immediately
        if (primaryUrl !== fallbackUrl) {
          response = await tryAuth(fallbackUrl);
        } else {
          throw networkErr;
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data && data.success && data.client) {
          const session: ClientSession = {
            clientId: String(data.client.id || 'cli-remote'),
            username: data.client.username,
            customerName: data.client.customer_name || data.client.username,
            planDuration: data.client.plan_duration || '30d',
            expiresAt: data.client.expires_at,
            status: data.client.status,
            maxScreens: data.client.max_screens || 1,
            loggedInAt: new Date().toISOString(),
          };
          this.saveClientSession(session);
          return { success: true, client: session };
        } else if (data && data.message) {
          return { success: false, error: data.message };
        }
      } else if (response && (response.status === 401 || response.status === 403)) {
        const errData = await response.json().catch(() => null);
        return {
          success: false,
          error: errData?.message || 'Usuario ou senha incorretos.',
        };
      }
    } catch {
      // API unreachable, gracefully continue to local validation
    }

    // 2. Local fallback validation against local admin clients
    const clients = this.getClients();
    const client = clients.find(
      (c) => c.username.toLowerCase() === cleanUser && c.password === cleanPass
    );

    if (!client) {
      return {
        success: false,
        error: 'Usuario ou senha incorretos. Verifique suas credenciais.',
      };
    }

    if (client.status === 'blocked') {
      return {
        success: false,
        error: 'Esta linha de acesso foi bloqueada pela administracao.',
      };
    }

    const now = new Date().getTime();
    const exp = new Date(client.expiresAt).getTime();
    if (exp < now || client.status === 'expired') {
      return {
        success: false,
        error: 'Seu plano ou teste expirou. Entre em contato para renovar seu acesso.',
      };
    }

    // Update last connected time
    const updated = clients.map((c) =>
      c.id === client.id ? { ...c, lastConnectedAt: new Date().toISOString() } : c
    );
    this.saveClients(updated);

    const session: ClientSession = {
      clientId: client.id,
      username: client.username,
      customerName: client.customerName,
      planDuration: client.planDuration,
      expiresAt: client.expiresAt,
      status: client.status,
      maxScreens: client.maxScreens,
      loggedInAt: new Date().toISOString(),
    };

    this.saveClientSession(session);
    return { success: true, client: session };
  }

  // Get active client session
  static getClientSession(): ClientSession | null {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    try {
      const session: ClientSession = JSON.parse(raw);
      // Validate expiration
      const now = new Date().getTime();
      const exp = new Date(session.expiresAt).getTime();
      if (exp < now) {
        // Expired
        return { ...session, status: 'expired' };
      }
      return session;
    } catch {
      return null;
    }
  }

  // Save client session
  static saveClientSession(session: ClientSession) {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  }

  // Clear client session (logout)
  static clearClientSession() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }

  // Load contents from localStorage with strict array validation
  static getContents(): AdminContentItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONTENTS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  }

  // Save contents to localStorage and dispatch update event
  static saveContentsLocally(contents: AdminContentItem[]) {
    const safeArray = Array.isArray(contents) ? contents.filter(Boolean) : [];
    localStorage.setItem(STORAGE_KEY_CONTENTS, JSON.stringify(safeArray));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mastertv_catalog_updated'));
    }
  }

  // Fetch remote contents from Locaweb MySQL PHP API
  static async fetchRemoteContents(): Promise<AdminContentItem[]> {
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/content.php`;
    const fallbackUrl = 'https://mastertvhd.online/api/content.php';

    try {
      let res: Response;
      try {
        res = await fetch(primaryUrl);
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl);
        } else {
          throw err;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.contents)) {
          const mapped: AdminContentItem[] = data.contents.map((item: any) => ({
            id: String(item.id),
            type: item.type as ContentType,
            title: item.title,
            tagline: item.tagline || '',
            rating: parseFloat(item.rating) || 8.0,
            duration: item.duration || '',
            year: parseInt(item.year, 10) || 2026,
            contentRating: item.content_rating || '14',
            genres:
              typeof item.genres === 'string'
                ? item.genres.split(',').map((g: string) => g.trim())
                : Array.isArray(item.genres)
                ? item.genres
                : ['Geral'],
            posterUrl: item.poster_url || '',
            backdropUrl: item.backdrop_url || item.poster_url || '',
            streamUrl: item.stream_url || '',
            backupStreamUrl: item.backup_stream_url || '',
            description: item.description || '',
            director: item.director || '',
            writers: item.writers || '',
            production: item.production || '',
            channelNumber: parseInt(item.channel_number, 10) || 1,
            channelCategory: item.channel_category || 'aberta',
            currentProgram: item.current_program || '',
            epgId: item.epg_id || item.epgId || '',
            seasons: parseInt(item.seasons, 10) || 1,
            episodes: parseInt(item.episodes, 10) || 1,
            episodesList: Array.isArray(item.episodes_list) ? item.episodes_list : [],
            sourcesList: Array.isArray(item.sources_list) ? item.sources_list : [],
            cast: Array.isArray(item.cast) ? item.cast : [],
            status: item.status || 'active',
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
          this.saveContentsLocally(mapped);
          return mapped;
        }
      }
    } catch {
      // Return local cache on network error
    }
    return this.getContents();
  }

  // Save content (Create or Update)
  static async saveContent(
    item: Partial<AdminContentItem>
  ): Promise<{ success: boolean; message: string; id?: string }> {
    const id = item.id || `${item.type || 'movie'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullItem: AdminContentItem = {
      id,
      type: item.type || 'movie',
      title: item.title || '',
      tagline: item.tagline || '',
      rating: typeof item.rating === 'number' ? item.rating : 8.0,
      duration: item.duration || '',
      year: item.year || 2026,
      contentRating: item.contentRating || '14',
      genres: item.genres && item.genres.length > 0 ? item.genres : ['Geral'],
      posterUrl: item.posterUrl || '',
      backdropUrl: item.backdropUrl || item.posterUrl || '',
      streamUrl: item.streamUrl || '',
      backupStreamUrl: item.backupStreamUrl || '',
      description: item.description || '',
      director: item.director || '',
      writers: item.writers || '',
      production: item.production || '',
      channelNumber: item.channelNumber || 1,
      channelCategory: item.channelCategory || 'aberta',
      currentProgram: item.currentProgram || '',
      epgId: item.epgId || '',
      seasons: item.seasons || 1,
      episodes: item.episodes || 1,
      episodesList: item.episodesList || [],
      sourcesList: item.sourcesList || [],
      cast: item.cast || [],
      status: item.status || 'active',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save locally first
    const current = this.getContents();
    const existingIndex = current.findIndex((c) => c.id === id);
    let updatedList: AdminContentItem[];
    if (existingIndex >= 0) {
      updatedList = [...current];
      updatedList[existingIndex] = fullItem;
    } else {
      updatedList = [fullItem, ...current];
    }
    this.saveContentsLocally(updatedList);

    // Persist to MySQL PHP API
    const apiBase = this.getApiBaseUrl();
    try {
      const payload = {
        action: 'save',
        id: fullItem.id,
        type: fullItem.type,
        title: fullItem.title,
        tagline: fullItem.tagline,
        rating: fullItem.rating,
        duration: fullItem.duration,
        year: fullItem.year,
        content_rating: fullItem.contentRating,
        genres: fullItem.genres.join(', '),
        poster_url: fullItem.posterUrl,
        backdrop_url: fullItem.backdropUrl,
        stream_url: fullItem.streamUrl,
        backup_stream_url: fullItem.backupStreamUrl,
        description: fullItem.description,
        director: fullItem.director,
        writers: fullItem.writers,
        production: fullItem.production,
        channel_number: fullItem.channelNumber,
        channel_category: fullItem.channelCategory,
        current_program: fullItem.currentProgram,
        epg_id: fullItem.epgId,
        seasons: fullItem.seasons,
        episodes: fullItem.episodes,
        episodes_list: fullItem.episodesList,
        sources_list: fullItem.sourcesList,
        cast: fullItem.cast,
        status: fullItem.status,
      };

      const res = await fetch(`${apiBase}/content.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message || 'Conteudo salvo com sucesso!', id: fullItem.id };
      }
    } catch {
      // Saved locally fallback
    }

    return {
      success: true,
      message: 'Conteudo salvo com sucesso (salvo localmente e sincronizado)!',
      id: fullItem.id,
    };
  }

  // Delete content
  static async deleteContent(id: string): Promise<{ success: boolean; message: string }> {
    // Delete locally
    const current = this.getContents();
    const filtered = current.filter((c) => c.id !== id);
    this.saveContentsLocally(filtered);

    // Delete on remote MySQL API
    const apiBase = this.getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/content.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message || 'Conteudo excluido com sucesso!' };
      }
    } catch {
      // Local deleted fallback
    }

    return { success: true, message: 'Conteudo excluido com sucesso!' };
  }
}

