// MasterTV Admin and Reseller Dashboard Type Definitions
// Strictly ASCII comments only

export type ClientStatus = 'active' | 'trial' | 'expired' | 'blocked';

export type PlanDuration = '1h' | '2h' | '4h' | '24h' | '30d' | '90d' | '180d' | '365d';

export interface ClientLine {
  id: string;
  username: string;
  password: string;
  customerName: string;
  customerPhone?: string;
  planDuration: PlanDuration;
  createdAt: string;
  expiresAt: string;
  status: ClientStatus;
  maxScreens: number;
  activeScreens: number;
  createdBy: string; // 'admin' or reseller id
  resellerName?: string;
  notes?: string;
  lastConnectedAt?: string;
  lastIpAddress?: string;
}

export interface Reseller {
  id: string;
  name: string;
  username: string;
  password: string;
  phone: string;
  credits: number;
  pricePerCredit: number; // in BRL
  createdAt: string;
  status: 'active' | 'blocked';
  notes?: string;
}

export interface CreditTransaction {
  id: string;
  resellerId: string;
  resellerName: string;
  amount: number;
  type: 'credit_added' | 'credit_deducted' | 'client_created' | 'client_renewed';
  description: string;
  createdAt: string;
}

export interface AdminMetrics {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  expiredClients: number;
  totalResellers: number;
  totalCreditsInCirculation: number;
  monthlyRevenueEstimate: number;
  expiringIn7Days: number;
}

export interface AdminSettings {
  serverName: string;
  webPlayerUrl: string;
  apkDownloadUrl: string;
  supportPhone: string;
  customWhatsAppTemplate: string;
  trialDefaultHours: number;
}

export interface ClientSession {
  clientId: string;
  username: string;
  customerName: string;
  planDuration: PlanDuration;
  expiresAt: string;
  status: ClientStatus;
  maxScreens: number;
  loggedInAt: string;
}

export type ContentType = 'movie' | 'series' | 'channel' | 'anime' | 'dorama';

export interface ContentSourceItem {
  id: number;
  name: string;
  quality: 'HD' | 'FHD';
  streamUrl: string;
  backupStreamUrl?: string;
}

export interface CastMemberItem {
  id?: string;
  name: string;
  character?: string;
  photoUrl?: string;
}

export interface AdminContentItem {
  id: string;
  type: ContentType;
  title: string;
  tagline?: string;
  rating: number;
  duration?: string;
  year: number;
  contentRating?: string;
  genres: string[];
  posterUrl: string;
  backdropUrl?: string;
  streamUrl: string;
  backupStreamUrl?: string;
  sourcesList?: ContentSourceItem[];
  cast?: CastMemberItem[];
  description: string;
  director?: string;
  writers?: string;
  production?: string;
  channelNumber?: number;
  channelCategory?: string;
  currentProgram?: string;
  epgId?: string;
  seasons?: number;
  episodes?: number;
  episodesList?: {
    id: string;
    number: number;
    title: string;
    streamUrl: string;
    backupStreamUrl?: string;
    duration?: string;
  }[];
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}


