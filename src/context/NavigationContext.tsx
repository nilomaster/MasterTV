// Navigation Context for routing and view management
// Strictly ASCII comments only

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewType = 'home' | 'player' | 'epg' | 'vod' | 'favorites' | 'radios' | 'vod-player' | 'admin' | 'settings';
export type VODFilterType = 'all' | 'movies' | 'series' | 'animes' | 'doramas';

interface NavigationContextType {
  currentView: ViewType;
  vodFilter: VODFilterType;
  navigateTo: (view: ViewType, filter?: VODFilterType) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const VIEW_HASH_MAP: Record<ViewType, string> = {
  home: '#/inicio',
  player: '#/ao-vivo',
  epg: '#/guia',
  vod: '#/on-demand',
  favorites: '#/favoritos',
  radios: '#/radios',
  'vod-player': '#/assistir',
  admin: '#/admin',
  settings: '#/configuracoes',
};

function parseViewFromHash(): ViewType {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('config') || hash.includes('settings')) return 'settings';
  if (hash.includes('admin') || hash.includes('painel') || hash.includes('revenda')) return 'admin';
  if (hash.includes('assistir') || hash.includes('vod-player')) return 'vod-player';
  if (hash.includes('ao-vivo') || hash.includes('player')) return 'player';
  if (hash.includes('guia') || hash.includes('epg')) return 'epg';
  if (
    hash.includes('filmes') ||
    hash.includes('series') ||
    hash.includes('animes') ||
    hash.includes('on-demand') ||
    hash.includes('vod')
  ) {
    return 'vod';
  }
  if (hash.includes('favoritos')) return 'favorites';
  if (hash.includes('radios')) return 'radios';
  if (hash.includes('inicio') || hash === '#/' || hash === '#') return 'home';

  const saved = localStorage.getItem('mastertv_current_view') as ViewType | null;
  if (saved && ['home', 'player', 'epg', 'vod', 'favorites', 'radios', 'vod-player', 'admin', 'settings'].includes(saved)) {
    return saved;
  }
  return 'home';
}

function parseVodFilterFromHash(): VODFilterType {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('filmes')) return 'movies';
  if (hash.includes('series')) return 'series';
  if (hash.includes('animes')) return 'animes';
  if (hash.includes('doramas')) return 'doramas';
  return 'all';
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>(() => parseViewFromHash());
  const [vodFilter, setVodFilter] = useState<VODFilterType>(() => parseVodFilterFromHash());
  const [historyStack, setHistoryStack] = useState<ViewType[]>(['home']);

  const navigateTo = (view: ViewType, filter?: VODFilterType) => {
    setCurrentView(view);
    if (filter) {
      setVodFilter(filter);
    }
    setHistoryStack((prev) => [...prev, view]);

    try {
      localStorage.setItem('mastertv_current_view', view);
    } catch {
      // Ignore storage errors
    }

    if (view === 'vod' && filter && filter !== 'all') {
      window.location.hash = `#/${filter}`;
    } else {
      window.location.hash = VIEW_HASH_MAP[view] || '#/inicio';
    }
  };

  const goBack = () => {
    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop();
      const prev = newStack[newStack.length - 1];
      setHistoryStack(newStack);
      setCurrentView(prev);
      window.location.hash = VIEW_HASH_MAP[prev] || '#/inicio';
    } else {
      navigateTo('home');
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const v = parseViewFromHash();
      setCurrentView(v);
      setVodFilter(parseVodFilterFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentView, vodFilter, navigateTo, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
