// Base Main Layout for standard pages (Home, VOD, EPG, Favorites, Radios)
// Strictly ASCII comments only

import React from 'react';
import { Navbar } from '../components/Navbar';
import { PlaylistModal } from '../components/PlaylistModal';
import { SettingsModal } from '../components/SettingsModal';
import { MediaModal } from '../components/MediaModal';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const {
    favoritesCount,
    searchQuery,
    setSearchQuery,
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isPlayerControlsVisible,
    setIsPlayerControlsVisible,
    setIsNavbarHovered,
    clientSession,
    handleLogout,
    handleClearCache,
    selectedMedia,
    setSelectedMedia,
    selectedProgramItem,
    setSelectedProgramItem,
    playMediaStream,
    setChannels,
  } = useApp();

  const { currentView, vodFilter, navigateTo } = useNavigation();

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 flex flex-col relative overflow-x-hidden font-sans">
      {/* Ambient brand background lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-blue-800/5 blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-40">
        <Navbar
          currentView={currentView}
          vodFilter={vodFilter}
          setCurrentView={(v) => navigateTo(v)}
          onNavigateCategory={(v, cat) => navigateTo(v, cat)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSettingsModal={() => navigateTo('settings')}
          favoritesCount={favoritesCount}
          isPlayerControlsVisible={isPlayerControlsVisible}
          onNavbarMouseEnter={() => {
            setIsNavbarHovered(true);
            setIsPlayerControlsVisible(true);
          }}
          onNavbarMouseLeave={() => setIsNavbarHovered(false)}
          clientSession={clientSession}
          onLogout={handleLogout}
        />
      </header>

      {/* Main Page Content */}
      <main className="flex-1 relative z-10 flex flex-col pb-16 sm:pb-8">
        {children}
      </main>

      {/* Professional Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#05070a]/80 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-400">MasterTV Player v2.0 (Build Senior)</span>
            <span className="text-slate-600">|</span>
            <span>Ultra HD 4K Streaming</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Sistemas de Transmissao HLS &amp; EPG Sincronizados com Banco de Dados.
          </p>
        </div>
      </footer>

      {/* Global Modals */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onApplyChannels={(imported) => {
          setChannels(imported);
          setIsPlaylistModalOpen(false);
        }}
        onResetDefaults={() => {
          handleClearCache();
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onClearCache={handleClearCache}
        onOpenAdmin={() => navigateTo('admin')}
        clientSession={clientSession}
        onLogout={handleLogout}
      />

      <MediaModal
        isOpen={!!selectedMedia || !!selectedProgramItem}
        mediaItem={selectedMedia}
        programItem={selectedProgramItem}
        onClose={() => {
          setSelectedMedia(null);
          setSelectedProgramItem(null);
        }}
        onPlayMedia={(url, title, media, ep) => {
          playMediaStream(url, title, media, ep);
          if (media) {
            navigateTo('vod-player');
          } else {
            navigateTo('player');
          }
        }}
      />
    </div>
  );
};
