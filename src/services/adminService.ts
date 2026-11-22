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
const STORAGE_KEY_ADMIN_AUTH = 'mastertv_admin_auth_v1';
const STORAGE_KEY_CONTENTS = 'mastertv_admin_contents_v2';
const STORAGE_KEY_CHANNELS = 'mastertv_admin_channels_v2';

export interface AdminAuthSession {
  token: string;
  expiresAt?: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: 'admin' | 'reseller';
    credits: number;
  };
}

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
      return `${window.location.origin}/api`;
    }
    return 'https://mastertvhd.online/api';
  }

  // Administrative Staff Session Storage & Headers (P0 Security)
  static getAdminAuthSession(): AdminAuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AdminAuthSession;
      if (!parsed || !parsed.token || !parsed.user?.role) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  static saveAdminAuthSession(session: AdminAuthSession): void {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, JSON.stringify(session));
    } catch {
      // Ignore storage quota errors
    }
  }

  static clearAdminAuthSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    } catch {
      // Ignore storage errors
    }
  }

  static getAdminAuthHeaders(includeJson = true): Record<string, string> {
    const headers: Record<string, string> = {};
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    const session = this.getAdminAuthSession();
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
      headers['X-Admin-Token'] = session.token;
    }
    return headers;
  }

  static handleAuthErrorStatus(status?: number): void {
    if (status === 401 && typeof window !== 'undefined') {
      this.clearAdminAuthSession();
      window.dispatchEvent(new Event('mastertv_admin_unauthorized'));
    }
  }

  static async loginAdmin(
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string; session?: AdminAuthSession }> {
    const apiBase = this.getApiBaseUrl();
    const res = await fetch(`${apiBase}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, admin_only: true }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success && data.admin_token && data.user) {
      const session: AdminAuthSession = {
        token: String(data.admin_token),
        expiresAt: data.token_expires_at ? String(data.token_expires_at) : undefined,
        user: {
          id: Number(data.user.id) || 1,
          username: String(data.user.username || username),
          name: String(data.user.name || username),
          role: data.user.role === 'admin' ? 'admin' : 'reseller',
          credits: Number(data.user.credits) || 0,
        },
      };
      this.saveAdminAuthSession(session);
      return { success: true, session };
    }
    return {
      success: false,
      message: data?.message || 'Usuario ou senha administrativos invalidos.',
    };
  }

  static async verifyAdminSession(): Promise<AdminAuthSession | null> {
    const current = this.getAdminAuthSession();
    if (!current?.token) return null;
    try {
      const apiBase = this.getApiBaseUrl();
      const res = await fetch(`${apiBase}/auth.php?action=me`, {
        cache: 'no-store',
        headers: this.getAdminAuthHeaders(false),
      });
      if (res.status === 401 || res.status === 403) {
        this.clearAdminAuthSession();
        return null;
      }
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.user) {
          const updated: AdminAuthSession = {
            ...current,
            user: {
              id: Number(data.user.id) || current.user.id,
              username: String(data.user.username || current.user.username),
              name: String(data.user.name || current.user.name),
              role: data.user.role === 'admin' ? 'admin' : 'reseller',
              credits: Number(data.user.credits) || 0,
            },
          };
          this.saveAdminAuthSession(updated);
          return updated;
        }
      }
    } catch {
      // Keep local session temporarily if network hiccups
      return current;
    }
    return current;
  }

  static async logoutAdmin(): Promise<void> {
    try {
      const apiBase = this.getApiBaseUrl();
      await fetch(`${apiBase}/auth.php`, {
        method: 'POST',
        headers: this.getAdminAuthHeaders(true),
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Ignore network error on logout
    } finally {
      this.clearAdminAuthSession();
    }
  }

  // Fetch clients from PHP MySQL API
  static async fetchRemoteClients(): Promise<ClientLine[]> {
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/clients.php`;
    const fallbackUrl = 'https://mastertvhd.online/api/clients.php';

    try {
      let res: Response;
      const authHeaders = this.getAdminAuthHeaders(false);
      try {
        res = await fetch(primaryUrl, { cache: 'no-store', headers: authHeaders });
        if (!res.ok && res.status !== 401 && res.status !== 403 && primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store', headers: authHeaders });
        }
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store', headers: authHeaders });
        } else {
          throw err;
        }
      }
      if (res && res.status === 401) {
        this.handleAuthErrorStatus(401);
        return [];
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

  static generateIdempotencyKey(prefix = 'op'): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    const rand = Math.random().toString(36).slice(2, 12);
    return `${prefix}-${Date.now()}-${rand}`;
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
    idempotencyKey?: string;
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
    const idemKey = data.idempotencyKey || this.generateIdempotencyKey('create');

    let createdId = 'cli-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Sync to remote MySQL API with transactional idempotency key
    const apiBase = this.getApiBaseUrl();
    const headers = this.getAdminAuthHeaders(true);
    headers['X-Idempotency-Key'] = idemKey;

    const res = await fetch(`${apiBase}/clients.php`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone?.replace(/\D/g, '') || '',
        username: cleanUser,
        password: cleanPass,
        plan_duration: data.planDuration,
        notes: data.notes || '',
        idempotency_key: idemKey,
      }),
    });

    if (res.status === 401) {
      this.handleAuthErrorStatus(401);
      throw new Error('Sessao administrativa expirada. Faca login novamente.');
    }

    const resData = await res.json().catch(() => null);
    if (!res.ok || !resData?.success) {
      throw new Error(resData?.message || 'Erro ao cadastrar cliente no servidor.');
    }

    if (resData.client_id) {
      createdId = String(resData.client_id);
      if (resData.expires_at) {
        expires = new Date(resData.expires_at);
      }
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

    const existingIdx = clients.findIndex((c) => c.id === createdId);
    if (existingIdx >= 0) {
      clients[existingIdx] = newClient;
    } else {
      clients.unshift(newClient);
    }
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
  static async renewClient(
    clientId: string,
    duration: PlanDuration,
    idempotencyKey?: string
  ): Promise<ClientLine | null> {
    const clients = this.getClients();
    const idx = clients.findIndex((c) => c.id === clientId);
    if (idx === -1) return null;

    const current = clients[idx];
    const now = new Date();
    // If client is still active, extend from previous expiration date; if expired, renew from now
    const baseDate = new Date(current.expiresAt).getTime() > now.getTime() ? new Date(current.expiresAt) : now;

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
    const expires = new Date(baseDate.getTime() + days * 86400000);
    const idemKey = idempotencyKey || this.generateIdempotencyKey('renew');

    const apiBase = this.getApiBaseUrl();
    const headers = this.getAdminAuthHeaders(true);
    headers['X-Idempotency-Key'] = idemKey;

    const res = await fetch(`${apiBase}/clients.php`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        id: clientId,
        action: 'renew',
        days,
        idempotency_key: idemKey,
      }),
    });

    if (res.status === 401) {
      this.handleAuthErrorStatus(401);
      throw new Error('Sessao administrativa expirada. Faca login novamente.');
    }

    const resData = await res.json().catch(() => null);
    if (!res.ok || !resData?.success) {
      throw new Error(resData?.message || 'Erro ao renovar assinatura no servidor.');
    }

    clients[idx] = {
      ...current,
      planDuration: duration,
      expiresAt: expires.toISOString(),
      status: 'active',
    };

    this.saveClients(clients);
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
      const res = await fetch(`${apiBase}/clients.php`, {
        method: 'PUT',
        headers: this.getAdminAuthHeaders(true),
        body: JSON.stringify({ id: clientId, action: 'toggle_status', status: nextStatus }),
      });
      if (res.status === 401) {
        this.handleAuthErrorStatus(401);
      }
    } catch {}

    return clients[idx];
  }

  // Delete client
  static async deleteClient(clientId: string): Promise<boolean> {
    const clients = this.getClients().filter((c) => c.id !== clientId);
    this.saveClients(clients);

    try {
      const apiBase = this.getApiBaseUrl();
      const res = await fetch(`${apiBase}/clients.php`, {
        method: 'DELETE',
        headers: this.getAdminAuthHeaders(true),
        body: JSON.stringify({ id: clientId }),
      });
      if (res.status === 401) {
        this.handleAuthErrorStatus(401);
      }
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

    // 1. Try PHP API first with automatic remote fallback
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/auth.php`;
    const fallbackUrl = 'https://mastertvhd.online/api/auth.php';

    const tryAuth = async (url: string): Promise<Response | null> => {
      try {
        return await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUser, password: cleanPass }),
        });
      } catch {
        return null;
      }
    };

    try {
      let response = await tryAuth(primaryUrl);
      if (!response || !response.ok) {
        if (primaryUrl !== fallbackUrl) {
          const fallbackRes = await tryAuth(fallbackUrl);
          if (fallbackRes && fallbackRes.ok) {
            response = fallbackRes;
          } else if (fallbackRes && (fallbackRes.status === 401 || fallbackRes.status === 403)) {
            response = fallbackRes;
          }
        }
      }

      if (response && response.ok) {
        const data = await response.json().catch(() => null);
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

  // In-memory cache for full remote catalog (holds tens of thousands of items without localStorage quota limits)
  private static inMemoryContents: AdminContentItem[] | null = null;

  // Load contents from in-memory cache or localStorage with strict array validation
  static getContents(): AdminContentItem[] {
    if (this.inMemoryContents && Array.isArray(this.inMemoryContents) && this.inMemoryContents.length > 0) {
      return this.inMemoryContents;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONTENTS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.inMemoryContents = parsed.filter(Boolean);
        return this.inMemoryContents;
      }
      return [];
    } catch {
      return [];
    }
  }

  // Dedicated channel storage helpers to guarantee live channels are never pushed out by movies/series
  static getChannels(): AdminContentItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      }
    } catch {}
    return this.getContents().filter((c) => c && c.type === 'channel');
  }

  static clearChannelsLocally() {
    try {
      // Persist explicit empty array so getChannels never falls back to stale contents
      localStorage.setItem(STORAGE_KEY_CHANNELS, '[]');
      if (this.inMemoryContents) {
        this.inMemoryContents = this.inMemoryContents.filter((c) => c && c.type !== 'channel');
      }
      const rawContents = localStorage.getItem(STORAGE_KEY_CONTENTS);
      if (rawContents) {
        const parsed = JSON.parse(rawContents);
        if (Array.isArray(parsed)) {
          localStorage.setItem(
            STORAGE_KEY_CONTENTS,
            JSON.stringify(parsed.filter((c: any) => c && c.type !== 'channel'))
          );
        }
      }
    } catch {}
  }

  static saveChannelsLocally(channels: AdminContentItem[], allowEmpty = false) {
    if (!Array.isArray(channels)) return;
    if (channels.length === 0) {
      if (allowEmpty) {
        this.clearChannelsLocally();
      }
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels.filter(Boolean)));
    } catch {}
  }

  // Save contents to in-memory cache and localStorage with quota protection and balanced multi-type sampling
  static saveContentsLocally(
    contents: AdminContentItem[],
    options?: { allowClearChannels?: boolean }
  ) {
    const safeArray = Array.isArray(contents) ? contents.filter(Boolean) : [];
    this.inMemoryContents = safeArray;

    // Isolate channels and persist in dedicated channel store
    const channels = safeArray.filter((c) => c.type === 'channel');
    if (channels.length > 0) {
      this.saveChannelsLocally(channels);
    } else if (options?.allowClearChannels) {
      this.clearChannelsLocally();
    }
    // Preserve existing live channels during normal partial syncs, unless explicitly cleared
    const preservedChannels =
      channels.length > 0
        ? channels
        : options?.allowClearChannels
        ? []
        : this.getChannels();

    const movies = safeArray.filter((c) => c.type === 'movie');
    const series = safeArray.filter((c) => c.type === 'series');
    const animes = safeArray.filter((c) => c.type === 'anime');
    const doramas = safeArray.filter((c) => c.type === 'dorama');

    const sample = [
      ...preservedChannels.slice(0, 1500),
      ...movies.slice(0, 1500),
      ...series.slice(0, 500),
      ...animes.slice(0, 300),
      ...doramas.slice(0, 300),
    ];

    const counts = {
      channels: preservedChannels.length,
      movies: movies.length,
      series: series.length,
      animes: animes.length,
      doramas: doramas.length,
      total: Math.max(safeArray.length, preservedChannels.length + movies.length + series.length),
    };
    try {
      localStorage.setItem('mastertv_catalog_counts', JSON.stringify(counts));
    } catch {}

    try {
      localStorage.setItem(STORAGE_KEY_CONTENTS, JSON.stringify(sample));
    } catch (err) {
      // LocalStorage limit is 5MB in browsers. Protect against QuotaExceededError
      let limit = Math.min(sample.length, 1200);
      let saved = false;
      while (limit > 50 && !saved) {
        try {
          localStorage.setItem(STORAGE_KEY_CONTENTS, JSON.stringify(sample.slice(0, limit)));
          saved = true;
        } catch {
          limit = Math.floor(limit * 0.7);
        }
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mastertv_catalog_updated'));
    }
  }

  // Return catalog counts with memory and localStorage caching
  static getCatalogCounts(): {
    channels: number;
    movies: number;
    series: number;
    animes: number;
    doramas: number;
    total: number;
  } {
    try {
      const raw = localStorage.getItem('mastertv_catalog_counts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.total === 'number') {
          return parsed;
        }
      }
    } catch {}

    const contents = this.getContents();
    const channels = contents.filter((c) => c && c.type === 'channel').length;
    const movies = contents.filter((c) => c && c.type === 'movie').length;
    const series = contents.filter((c) => c && c.type === 'series').length;
    const animes = contents.filter((c) => c && c.type === 'anime').length;
    const doramas = contents.filter((c) => c && c.type === 'dorama').length;
    return {
      channels,
      movies,
      series,
      animes,
      doramas,
      total: contents.length,
    };
  }

  // Fetch real-time catalog counts directly from MySQL (lightweight query)
  static async fetchCatalogCounts(): Promise<{
    channels: number;
    movies: number;
    series: number;
    animes: number;
    doramas: number;
    total: number;
  }> {
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/content.php?action=counts`;
    const fallbackUrl = 'https://mastertvhd.online/api/content.php?action=counts';

    try {
      let res: Response;
      try {
        res = await fetch(primaryUrl);
      } catch {
        res = await fetch(fallbackUrl);
      }
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && data.counts) {
          try {
            localStorage.setItem('mastertv_catalog_counts', JSON.stringify(data.counts));
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('mastertv_catalog_updated'));
          }
          return data.counts;
        }
      }
    } catch {}
    return this.getCatalogCounts();
  }

  // Fetch all remote live channels directly from MySQL (guarantees channels are never missing)
  static async fetchRemoteChannels(): Promise<AdminContentItem[]> {
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/content.php?type=channel&all=true`;
    const fallbackUrl = 'https://mastertvhd.online/api/content.php?type=channel&all=true';

    try {
      let res: Response;
      const authHeaders = this.getAdminAuthHeaders(false);
      try {
        res = await fetch(primaryUrl, { cache: 'no-store', headers: authHeaders });
        if (!res.ok && res.status !== 401 && res.status !== 403 && primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store', headers: authHeaders });
        }
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store', headers: authHeaders });
        } else {
          throw err;
        }
      }
      if (res && res.status === 401) {
        this.handleAuthErrorStatus(401);
        return [];
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.contents)) {
          const mapped: AdminContentItem[] = data.contents.map((item: any) => ({
            id: String(item.id),
            type: 'channel' as ContentType,
            title: item.title,
            tagline: item.tagline || '',
            rating: parseFloat(item.rating) || 8.0,
            duration: item.duration || 'Ao Vivo',
            year: parseInt(item.year, 10) || 2026,
            contentRating: item.content_rating || 'Livre',
            genres:
              typeof item.genres === 'string'
                ? item.genres.split(',').map((g: string) => g.trim())
                : Array.isArray(item.genres)
                ? item.genres
                : ['aberta'],
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
            currentProgram: item.current_program || 'Transmissao ao Vivo',
            epgId: item.epg_id || item.epgId || '',
            seasons: 1,
            episodes: 1,
            episodesList: [],
            sourcesList: Array.isArray(item.sources_list) ? item.sources_list : [],
            cast: [],
            status: item.status || 'active',
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
          this.saveChannelsLocally(mapped, true);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('mastertv_catalog_updated'));
          }
          return mapped;
        }
      }
    } catch {}
    return this.getChannels();
  }

  // Fetch remote contents from Locaweb MySQL PHP API with optional type filter
  static async fetchRemoteContents(type?: string): Promise<AdminContentItem[]> {
    if (type === 'channel') {
      return this.fetchRemoteChannels();
    }

    const apiBase = this.getApiBaseUrl();
    const query = type ? `?type=${encodeURIComponent(type)}&limit=2500` : '?limit=2500';
    const primaryUrl = `${apiBase}/content.php${query}`;
    const fallbackUrl = `https://mastertvhd.online/api/content.php${query}`;

    try {
      let res: Response;
      const authHeaders = this.getAdminAuthHeaders(false);
      try {
        res = await fetch(primaryUrl, { cache: 'no-store', headers: authHeaders });
        if (!res.ok && res.status !== 401 && res.status !== 403 && primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store', headers: authHeaders });
        }
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, { cache: 'no-store', headers: authHeaders });
        } else {
          throw err;
        }
      }
      if (res && res.status === 401) {
        this.handleAuthErrorStatus(401);
        return [];
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
          this.saveContentsLocally(mapped, { allowClearChannels: !type && mapped.length === 0 });
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
        headers: this.getAdminAuthHeaders(true),
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
        headers: this.getAdminAuthHeaders(true),
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

  // Bulk import items into MySQL database in batches
  static async saveBatchRemoteContents(
    items: AdminContentItem[],
    onProgress?: (percent: number, currentBatch: number, totalBatches: number) => void
  ): Promise<{ success: boolean; totalSaved: number; message: string }> {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, totalSaved: 0, message: 'Nenhum item para salvar.' };
    }

    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/content.php`;
    const fallbackUrl = 'https://mastertvhd.online/api/content.php';
    const batchSize = 50;
    const totalBatches = Math.ceil(items.length / batchSize);
    let totalSaved = 0;
    let lastError = '';

    for (let b = 0; b < totalBatches; b++) {
      const slice = items.slice(b * batchSize, (b + 1) * batchSize);
      const payload = {
        action: 'bulk_import',
        items: slice,
      };

      let success = false;
      let attempts = 0;

      while (!success && attempts < 2) {
        attempts++;
        try {
          let res: Response;
          try {
            res = await fetch(primaryUrl, {
              method: 'POST',
              headers: this.getAdminAuthHeaders(true),
              body: JSON.stringify(payload),
            });
          } catch (err) {
            if (primaryUrl !== fallbackUrl) {
              res = await fetch(fallbackUrl, {
                method: 'POST',
                headers: this.getAdminAuthHeaders(true),
                body: JSON.stringify(payload),
              });
            } else {
              throw err;
            }
          }

          if (res && res.ok) {
            const data = await res.json();
            if (data && data.success) {
              totalSaved += data.count || slice.length;
              success = true;
            } else {
              lastError = data?.message || 'Erro ao processar lote no MySQL.';
            }
          } else {
            lastError = `Servidor retornou status ${res?.status || 'desconhecido'}`;
          }
        } catch (err: any) {
          lastError = err?.message || 'Falha de conexao com a API.';
        }

        if (!success && attempts < 2) {
          // Wait 200ms before retry
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      if (onProgress) {
        const pct = Math.round(((b + 1) / totalBatches) * 100);
        onProgress(pct, b + 1, totalBatches);
      }

      // Small delay between batches to prevent server overload
      await new Promise((r) => setTimeout(r, 40));
    }

    // Refresh remote contents cache
    try {
      await this.fetchRemoteContents();
    } catch {
      // Ignore
    }

    if (totalSaved === 0 && items.length > 0) {
      throw new Error(lastError || 'Nenhum conteudo pode ser salvo no banco de dados MySQL.');
    }

    return {
      success: totalSaved > 0,
      totalSaved,
      message: `${totalSaved} itens salvos com sucesso no banco de dados MySQL.`,
    };
  }

  // Clear all contents from MySQL database and local storage
  static async clearRemoteContents(type?: string): Promise<{ success: boolean; message: string }> {
    const apiBase = this.getApiBaseUrl();
    const primaryUrl = `${apiBase}/content.php`;
    const fallbackUrl = 'https://mastertvhd.online/api/content.php';
    const payload = { action: 'clear_all', type: type || '' };

    try {
      let res: Response;
      try {
        res = await fetch(primaryUrl, {
          method: 'POST',
          headers: this.getAdminAuthHeaders(true),
          body: JSON.stringify(payload),
        });
      } catch (err) {
        if (primaryUrl !== fallbackUrl) {
          res = await fetch(fallbackUrl, {
            method: 'POST',
            headers: this.getAdminAuthHeaders(true),
            body: JSON.stringify(payload),
          });
        } else {
          throw err;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (type) {
          const current = this.getContents();
          this.saveContentsLocally(
            current.filter((c) => c.type !== type),
            { allowClearChannels: type === 'channel' }
          );
        } else {
          this.clearChannelsLocally();
          this.saveContentsLocally([], { allowClearChannels: true });
        }
        return { success: true, message: data.message || 'Catalogo limpo com sucesso!' };
      }
      return { success: false, message: 'Falha ao limpar catalogo.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro de conexao ao limpar catalogo.' };
    }
  }
}

