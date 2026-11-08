// M3U and M3U8 Playlist Parser Service
// Strictly ASCII comments only as per project guidelines

import type { Channel } from '../types/iptv';

export interface M3UParseResult {
  channels: Channel[];
  categories: string[];
}

export interface ParsedPlaylistItem {
  id: string;
  type: 'channel' | 'movie' | 'series' | 'anime' | 'dorama';
  title: string;
  cleanTitle: string;
  logo: string;
  groupTitle: string;
  category: string;
  epgId: string;
  channelNumber?: number;
  quality: string;
  streamUrl: string;
  year?: number;
}

export interface CategoryStat {
  name: string;
  count: number;
  type: 'channel' | 'movie' | 'series' | 'anime' | 'dorama' | 'all';
}

export interface AdvancedM3UResult {
  items: ParsedPlaylistItem[];
  channels: ParsedPlaylistItem[];
  movies: ParsedPlaylistItem[];
  series: ParsedPlaylistItem[];
  animes: ParsedPlaylistItem[];
  doramas: ParsedPlaylistItem[];
  categories: CategoryStat[];
  totalCount: number;
}

// Clean channel/content title removing technical resolution tags
export function cleanItemTitle(name: string): string {
  return name
    .replace(/\s*[\(\[\{]?(FHD|HD|SD|4K|UHD|H\.?265|HEVC)[\)\]\}]?\s*/gi, ' ')
    .replace(/\s*\|\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract detected resolution
export function detectQuality(name: string): string {
  const n = name.toUpperCase();
  if (n.includes('4K') || n.includes('UHD')) return '4K';
  if (n.includes('FHD') || n.includes('1080')) return 'FHD';
  if (n.includes('HD') || n.includes('720')) return 'HD';
  if (n.includes('SD')) return 'SD';
  return 'HD';
}

// Extract release year from title if present (e.g. "Avatar (2022)")
export function extractYear(name: string): number {
  const match = name.match(/\b(19\d\d|20\d\d)\b/);
  if (match) {
    const y = parseInt(match[1], 10);
    if (y >= 1930 && y <= 2030) return y;
  }
  return new Date().getFullYear();
}

// Detect item type based on group title, name, and URL extension
export function detectContentType(
  group: string,
  name: string,
  url: string
): 'channel' | 'movie' | 'series' | 'anime' | 'dorama' {
  const g = group.toUpperCase();
  const n = name.toUpperCase();
  const u = url.toLowerCase();

  if (g.includes('ANIME')) return 'anime';
  if (g.includes('DORAMA')) return 'dorama';

  if (
    g.includes('SERIE') ||
    g.includes('SÉRIE') ||
    u.includes('/series/') ||
    /\bS\d{1,2}\s*E\d{1,2}\b/i.test(n) ||
    /\bEP\s*\d{1,3}\b/i.test(n) ||
    /TEMPORADA/i.test(n)
  ) {
    return 'series';
  }

  if (
    g.includes('FILME') ||
    g.includes('MOVIE') ||
    g.includes('VOD') ||
    g.includes('CINEMA') ||
    u.includes('/movie/') ||
    u.endsWith('.mp4') ||
    u.endsWith('.mkv') ||
    u.endsWith('.avi')
  ) {
    return 'movie';
  }

  return 'channel';
}

// Legacy basic parser for backward compatibility
export function parseM3U(content: string): M3UParseResult {
  const advanced = parseAdvancedM3U(content);
  const channels: Channel[] = advanced.channels.map((ch, idx) => ({
    id: ch.id,
    number: ch.channelNumber || idx + 1,
    name: ch.title,
    logo: ch.logo,
    category: ch.category,
    quality: ch.quality,
    streamUrl: ch.streamUrl,
    currentProgram: 'Programacao Normal',
    currentProgramTime: 'Ao Vivo',
    nextProgram: 'Proxima atracao',
    nextProgramTime: 'A Seguir',
    synopsis: `Transmissao ao vivo do canal ${ch.title}.`,
    epgId: ch.epgId,
    isFavorite: false,
  }));

  const categories = Array.from(new Set(advanced.channels.map((c) => c.groupTitle)));
  return { channels, categories };
}

// Advanced parser supporting Saimon-TV and Xtream IPTV Playlists with full VOD, Series, and Live TV classification
export function parseAdvancedM3U(content: string): AdvancedM3UResult {
  const lines = content.split(/\r?\n/);
  const items: ParsedPlaylistItem[] = [];

  let currentMeta: {
    name?: string;
    logo?: string;
    groupTitle?: string;
    epgId?: string;
  } | null = null;

  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentMeta = {};

      // Parse tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch) {
        currentMeta.logo = logoMatch[1].trim();
      }

      // Parse group-title (Category)
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      currentMeta.groupTitle = groupMatch ? groupMatch[1].trim() : 'Geral';

      // Parse tvg-id
      const idMatch = line.match(/tvg-id="([^"]+)"/i);
      currentMeta.epgId = idMatch ? idMatch[1].trim() : `item-${counter}`;

      // Parse tvg-name or comma separated title
      const nameMatch = line.match(/tvg-name="([^"]+)"/i);
      const commaIndex = line.lastIndexOf(',');
      let rawName = 'Item Sem Titulo';
      if (commaIndex !== -1 && commaIndex < line.length - 1) {
        rawName = line.substring(commaIndex + 1).trim();
      } else if (nameMatch) {
        rawName = nameMatch[1].trim();
      }
      currentMeta.name = rawName;
    } else if (!line.startsWith('#') && currentMeta && currentMeta.name) {
      const streamUrl = line;
      const rawName = currentMeta.name;
      const groupTitle = currentMeta.groupTitle || 'Geral';
      const type = detectContentType(groupTitle, rawName, streamUrl);
      const quality = detectQuality(rawName);
      const cleanTitle = cleanItemTitle(rawName);
      const year = extractYear(rawName);

      items.push({
        id: `m3u-${type}-${counter}-${Date.now().toString(36)}`,
        type,
        title: rawName,
        cleanTitle: cleanTitle || rawName,
        logo: currentMeta.logo || '',
        groupTitle,
        category: groupTitle.toLowerCase(),
        epgId: currentMeta.epgId || `epg-${counter}`,
        channelNumber: type === 'channel' ? counter : undefined,
        quality,
        streamUrl,
        year,
      });

      counter++;
      currentMeta = null;
    }
  }

  const channels = items.filter((x) => x.type === 'channel');
  const movies = items.filter((x) => x.type === 'movie');
  const series = items.filter((x) => x.type === 'series');
  const animes = items.filter((x) => x.type === 'anime');
  const doramas = items.filter((x) => x.type === 'dorama');

  // Compute category statistics
  const catMap = new Map<string, { count: number; type: ParsedPlaylistItem['type'] }>();
  for (const item of items) {
    const existing = catMap.get(item.groupTitle);
    if (existing) {
      existing.count++;
    } else {
      catMap.set(item.groupTitle, { count: 1, type: item.type });
    }
  }

  const categories: CategoryStat[] = Array.from(catMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      type: data.type,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    items,
    channels,
    movies,
    series,
    animes,
    doramas,
    categories,
    totalCount: items.length,
  };
}

// Fetch M3U from remote URL with proxy fallback to handle CORS
export async function fetchAndParseM3U(url: string): Promise<M3UParseResult> {
  const advanced = await fetchAdvancedM3U(url);
  const legacy = parseM3U('');
  legacy.channels = advanced.channels.map((ch, idx) => ({
    id: ch.id,
    number: ch.channelNumber || idx + 1,
    name: ch.title,
    logo: ch.logo,
    category: ch.category,
    quality: ch.quality,
    streamUrl: ch.streamUrl,
    currentProgram: 'Programacao Normal',
    currentProgramTime: 'Ao Vivo',
    nextProgram: 'Proxima atracao',
    nextProgramTime: 'A Seguir',
    synopsis: `Transmissao ao vivo do canal ${ch.title}.`,
    epgId: ch.epgId,
    isFavorite: false,
  }));
  legacy.categories = Array.from(new Set(advanced.channels.map((c) => c.groupTitle)));
  return legacy;
}

export async function fetchAdvancedM3U(url: string): Promise<AdvancedM3UResult> {
  let content = '';

  // 1. Try direct fetch
  try {
    const response = await fetch(url);
    if (response.ok) {
      content = await response.text();
    }
  } catch {
    // Continue to proxy fallback
  }

  // 2. If direct fetch fails (likely CORS restriction), try public CORS proxies
  if (!content) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        content = await proxyRes.text();
      }
    } catch {
      // Continue to next fallback
    }
  }

  if (!content) {
    try {
      const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
      const ctRes = await fetch(codetabsUrl);
      if (ctRes.ok) {
        content = await ctRes.text();
      }
    } catch {
      // Failed all
    }
  }

  if (!content) {
    throw new Error('Nao foi possivel baixar a lista M3U diretamente devido a bloqueio de CORS do servidor de origem. Por favor, baixe o arquivo .m3u no seu computador e use o botao "Carregar Arquivo .M3U" no importador!');
  }

  return parseAdvancedM3U(content);
}
