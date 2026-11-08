// Configuration and defaults for On-Demand Movies, Series and Animes
// Strictly ASCII comments only

export interface VODCategoryOption {
  id: 'all' | 'movies' | 'series' | 'animes' | 'doramas';
  label: string;
  iconName: string;
  description: string;
}

export const VOD_CATEGORIES: VODCategoryOption[] = [
  { id: 'all', label: 'Todos', iconName: 'Grid', description: 'Catalogo completo' },
  { id: 'movies', label: 'Filmes', iconName: 'Film', description: 'Longa-metragens em alta definicao' },
  { id: 'series', label: 'Series', iconName: 'Tv2', description: 'Temporadas e episodios completos' },
  { id: 'animes', label: 'Animes', iconName: 'Sparkles', description: 'Animacoes japonesas dubladas e legendadas' },
  { id: 'doramas', label: 'Doramas', iconName: 'Heart', description: 'Series asiaticas' },
];

export const VOD_GENRES = [
  'Todos',
  'Acao',
  'Comedia',
  'Drama',
  'Ficcao Cientifica',
  'Terror',
  'Animacao',
  'Suspense',
  'Aventura',
  'Romance',
  'Documentario',
];

