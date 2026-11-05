// IPTV and EPG Types definition
// Strictly ASCII comments as per project guidelines

export interface Channel {
  id: string;
  number: number;
  name: string;
  logo: string;
  category: string;
  streamUrl: string;
  backupStreamUrl?: string;
  epgId?: string;
  currentProgram?: string;
  currentProgramTime?: string;
  nextProgram?: string;
  nextProgramTime?: string;
  synopsis?: string;
  isFavorite?: boolean;
  quality?: string;
}

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  category: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  durationMinutes: number;
  description: string;
  rating?: string;
  isLive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  count?: number;
  icon?: string;
}

export interface EpisodeItem {
  id: string;
  number: number;
  title: string;
  streamUrl: string;
  backupStreamUrl?: string;
  duration?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  tagline?: string;
  type: 'movie' | 'series' | 'anime' | 'dorama' | 'live';
  year: number;
  rating: number;
  contentRating?: string;
  genres: string[];
  posterUrl: string;
  backdropUrl: string;
  description: string;
  streamUrl: string;
  backupStreamUrl?: string;
  director?: string;
  writers?: string;
  creator?: string;
  production?: string;
  seasons?: number;
  episodes?: number;
  episodeList?: EpisodeItem[];
}

export interface PlaylistSource {
  name: string;
  url: string;
  channelsCount: number;
  lastUpdated: string;
}

