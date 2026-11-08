// MasterTV Senior Application Entry & Page Router
// Strictly ASCII comments only

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Clean Domain Pages
import {
  HomePage,
  LiveTVPage,
  EPGGuidePage,
  MoviesPage,
  WatchPage,
  FavoritesPage,
  SettingsPage,
  AdminPage,
  LoginPage,
  RadiosPage,
} from './pages';

const AppRouter: React.FC = () => {
  const { clientSession } = useApp();
  const { currentView } = useNavigation();

  // Authentication Guard: require login before accessing player and catalog
  if (!clientSession && currentView !== 'admin') {
    return (
      <ErrorBoundary fallbackTitle="Autenticacao MasterTV">
        <LoginPage />
      </ErrorBoundary>
    );
  }

  // Page Routing Switch
  switch (currentView) {
    case 'home':
      return (
        <ErrorBoundary fallbackTitle="Inicio MasterTV">
          <HomePage />
        </ErrorBoundary>
      );

    case 'player':
      return (
        <ErrorBoundary fallbackTitle="Canais Ao Vivo">
          <LiveTVPage />
        </ErrorBoundary>
      );

    case 'vod':
      return (
        <ErrorBoundary fallbackTitle="Catalogo On Demand">
          <MoviesPage />
        </ErrorBoundary>
      );

    case 'vod-player':
      return (
        <ErrorBoundary fallbackTitle="Reproducao de Video">
          <WatchPage />
        </ErrorBoundary>
      );

    case 'epg':
      return (
        <ErrorBoundary fallbackTitle="Guia de Programacao EPG">
          <EPGGuidePage />
        </ErrorBoundary>
      );

    case 'favorites':
      return (
        <ErrorBoundary fallbackTitle="Canais Favoritos">
          <FavoritesPage />
        </ErrorBoundary>
      );

    case 'settings':
      return (
        <ErrorBoundary fallbackTitle="Configuracoes do MasterTV">
          <SettingsPage />
        </ErrorBoundary>
      );

    case 'radios':
      return (
        <ErrorBoundary fallbackTitle="Radios Online">
          <RadiosPage />
        </ErrorBoundary>
      );

    case 'admin':
      return (
        <ErrorBoundary fallbackTitle="Painel de Administracao">
          <AdminPage />
        </ErrorBoundary>
      );

    default:
      return (
        <ErrorBoundary fallbackTitle="Inicio MasterTV">
          <HomePage />
        </ErrorBoundary>
      );
  }
};

export const App: React.FC = () => {
  return (
    <NavigationProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </NavigationProvider>
  );
};

export default App;
