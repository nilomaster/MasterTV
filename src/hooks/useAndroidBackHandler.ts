// Global Android Hardware & Gesture Back Button Bridge
// Connects Android MainActivity.handleAppBack() to React SPA state
// Strictly ASCII comments only

import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';

declare global {
  interface Window {
    __mastertv_handle_back?: () => boolean;
    __mastertv_player_handled_back?: boolean;
  }
}

export function useAndroidBackHandler(): void {
  const {
    selectedMedia,
    setSelectedMedia,
    selectedProgramItem,
    setSelectedProgramItem,
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
  } = useApp();

  const { currentView, goBack, navigateTo } = useNavigation();

  // Keep latest state in a ref so window.__mastertv_handle_back never reads stale closures
  const stateRef = useRef({
    currentView,
    selectedMedia,
    selectedProgramItem,
    isPlaylistModalOpen,
    isSettingsModalOpen,
    setSelectedMedia,
    setSelectedProgramItem,
    setIsPlaylistModalOpen,
    setIsSettingsModalOpen,
    goBack,
    navigateTo,
  });

  stateRef.current = {
    currentView,
    selectedMedia,
    selectedProgramItem,
    isPlaylistModalOpen,
    isSettingsModalOpen,
    setSelectedMedia,
    setSelectedProgramItem,
    setIsPlaylistModalOpen,
    setIsSettingsModalOpen,
    goBack,
    navigateTo,
  };

  useEffect(() => {
    window.__mastertv_handle_back = (): boolean => {
      const s = stateRef.current;

      // 1. Exit active HTML5 fullscreen first
      if (document.fullscreenElement) {
        try {
          document.exitFullscreen().catch(() => {});
        } catch {
          // Ignore fullscreen exit errors
        }
        return true;
      }

      // 2. Give Live TV / VOD player a chance to close fullscreen, drawers or EPG overlay
      if (s.currentView === 'player' || s.currentView === 'vod-player') {
        window.__mastertv_player_handled_back = false;
        window.dispatchEvent(new CustomEvent('mastertv_back_button'));
        if (window.__mastertv_player_handled_back) {
          window.__mastertv_player_handled_back = false;
          return true;
        }
      }

      // 3. Close any open global modal
      if (s.selectedMedia || s.selectedProgramItem) {
        s.setSelectedMedia(null);
        s.setSelectedProgramItem(null);
        return true;
      }
      if (s.isPlaylistModalOpen) {
        s.setIsPlaylistModalOpen(false);
        return true;
      }
      if (s.isSettingsModalOpen) {
        s.setIsSettingsModalOpen(false);
        return true;
      }

      // 4. Navigate back from internal views instead of minimizing the app
      if (s.currentView !== 'home') {
        if (s.currentView === 'vod-player') {
          s.goBack();
        } else {
          s.navigateTo('home');
        }
        return true;
      }

      // 5. Already on Home with nothing open -> let Android moveTaskToBack(true)
      return false;
    };

    return () => {
      delete window.__mastertv_handle_back;
    };
  }, []);
}
