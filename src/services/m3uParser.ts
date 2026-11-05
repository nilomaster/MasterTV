// M3U and M3U8 Playlist Parser Service
// Strictly ASCII comments only

import type { Channel } from '../types/iptv';

export interface M3UParseResult {
  channels: Channel[];
  categories: string[];
}

export function parseM3U(content: string): M3UParseResult {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  const categoriesSet = new Set<string>();

  let currentChannel: Partial<Channel> | null = null;
  let channelIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF metadata
      currentChannel = {};
      
      // Parse tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch) {
        currentChannel.logo = logoMatch[1];
      }

      // Parse tvg-name or fallback to comma separated name
      const nameMatch = line.match(/tvg-name="([^"]+)"/i);
      const commaIndex = line.lastIndexOf(',');
      let channelName = 'Canal Desconhecido';
      
      if (commaIndex !== -1 && commaIndex < line.length - 1) {
        channelName = line.substring(commaIndex + 1).trim();
      } else if (nameMatch) {
        channelName = nameMatch[1];
      }
      currentChannel.name = channelName;

      // Parse group-title (Category)
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const category = groupMatch ? groupMatch[1].trim() : 'Geral';
      currentChannel.category = category.toLowerCase();
      categoriesSet.add(category);

      // Parse tvg-id for EPG mapping
      const idMatch = line.match(/tvg-id="([^"]+)"/i);
      currentChannel.epgId = idMatch ? idMatch[1] : `ch-${channelIndex}`;
      currentChannel.id = `m3u-ch-${channelIndex}`;
      currentChannel.number = channelIndex;
      currentChannel.quality = '1080p';
      currentChannel.currentProgram = 'Programação Normal';
      currentChannel.currentProgramTime = 'Ao Vivo';
      currentChannel.nextProgram = 'Próxima atração';
      currentChannel.nextProgramTime = 'A Seguir';
      currentChannel.synopsis = `Transmissão ao vivo do canal ${channelName}.`;
      currentChannel.isFavorite = false;
    } else if (!line.startsWith('#') && currentChannel) {
      // Stream URL line
      currentChannel.streamUrl = line;
      if (currentChannel.name && currentChannel.streamUrl) {
        if (!currentChannel.logo) {
          currentChannel.logo = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
        }
        channels.push(currentChannel as Channel);
        channelIndex++;
      }
      currentChannel = null;
    }
  }

  return {
    channels,
    categories: Array.from(categoriesSet),
  };
}

export async function fetchAndParseM3U(url: string): Promise<M3UParseResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar playlist M3U: status ${response.status}`);
  }
  const text = await response.text();
  return parseM3U(text);
}
