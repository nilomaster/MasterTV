// TV and Live Channels Configuration
// Strictly ASCII comments only

export interface TVPlaybackSettings {
  zeroDelay: boolean;
  upscale4K: boolean;
  bufferSizeSeconds: number;
  autoReconnect: boolean;
}

export const DEFAULT_TV_SETTINGS: TVPlaybackSettings = {
  zeroDelay: true,
  upscale4K: false,
  bufferSizeSeconds: 15,
  autoReconnect: true,
};

export const CHANNEL_CATEGORIES = [
  { id: 'todos', name: 'Todos os Canais' },
  { id: 'aberta', name: 'TV Aberta' },
  { id: 'filmes', name: 'Filmes & Series' },
  { id: 'esportes', name: 'Esportes' },
  { id: 'noticias', name: 'Noticias' },
  { id: 'infantil', name: 'Infantil' },
  { id: 'documentarios', name: 'Documentarios' },
  { id: 'variedades', name: 'Variedades' },
];

