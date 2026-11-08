// MasterTV Clean Data Definitions
// Strictly ASCII comments only as per project guidelines

import type { Channel, Category, EPGProgram, MediaItem } from '../types/iptv';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'todos', name: 'Todos' },
  { id: 'favoritos', name: 'Favoritos' },
  { id: 'aberta', name: 'TV Aberta' },
  { id: 'filmes', name: 'Filmes' },
  { id: 'series', name: 'Series' },
  { id: 'esportes', name: 'Esportes' },
  { id: 'noticias', name: 'Noticias' },
  { id: 'infantil', name: 'Infantil' },
  { id: 'documentarios', name: 'Documentarios' },
  { id: 'musica', name: 'Musica' },
  { id: 'radios', name: 'Radios' },
];

// Clean initial channels - now managed exclusively via MySQL database
export const INITIAL_CHANNELS: Channel[] = [];

// Helper to generate real-time EPG program schedules for channels
export const generateEPGSchedule = (channels: Channel[]): EPGProgram[] => {
  const programs: EPGProgram[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  channels.forEach((channel) => {
    // Generate simple time slots for current day
    const start1 = new Date(now);
    start1.setHours(currentHour, 0, 0, 0);
    const end1 = new Date(now);
    end1.setHours(currentHour + 1, 0, 0, 0);

    programs.push({
      id: `${channel.id}-prog-now`,
      channelId: channel.id,
      title: channel.currentProgram || 'Programacao Ao Vivo',
      description: channel.synopsis || `Transmissao ao vivo do canal ${channel.name}.`,
      startTime: `${start1.getHours().toString().padStart(2, '0')}:00`,
      endTime: `${end1.getHours().toString().padStart(2, '0')}:00`,
      durationMinutes: 60,
      category: channel.category,
      rating: 'Livre',
    });

    const start2 = new Date(now);
    start2.setHours(currentHour + 1, 0, 0, 0);
    const end2 = new Date(now);
    end2.setHours(currentHour + 2, 0, 0, 0);

    programs.push({
      id: `${channel.id}-prog-next`,
      channelId: channel.id,
      title: channel.nextProgram || 'A Seguir',
      description: `Proxima atracao na grade de ${channel.name}.`,
      startTime: `${start2.getHours().toString().padStart(2, '0')}:00`,
      endTime: `${end2.getHours().toString().padStart(2, '0')}:00`,
      durationMinutes: 60,
      category: channel.category,
      rating: 'Livre',
    });
  });

  return programs;
};

// Clean Media Items - now managed exclusively via MySQL database
export const HERO_FEATURED: MediaItem = {
  id: '',
  title: '',
  type: 'movie',
  year: 2026,
  rating: 0,
  genres: [],
  posterUrl: '',
  backdropUrl: '',
  description: '',
  streamUrl: '',
};

export const TRENDING_MOVIES: MediaItem[] = [];
export const TRENDING_SERIES: MediaItem[] = [];
export const ANIMES_LIST: MediaItem[] = [];
export const DORAMAS_LIST: MediaItem[] = [];
