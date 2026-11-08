// Dedicated Watch Page for Fullscreen VOD Playback (Movies and Series)
// Strictly ASCII comments only

import React from 'react';
import { PlayerLayout } from '../../layouts/PlayerLayout';
import { VODPlayerView } from '../../components/VODPlayerView';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export const WatchPage: React.FC = () => {
  const { activeVOD, setActiveVOD } = useApp();
  const { navigateTo } = useNavigation();

  const handleBack = () => {
    const category =
      activeVOD.mediaItem.type === 'movie'
        ? 'movies'
        : activeVOD.mediaItem.type === 'series'
        ? 'series'
        : activeVOD.mediaItem.type === 'anime'
        ? 'animes'
        : 'all';
    navigateTo('vod', category);
  };

  return (
    <PlayerLayout onBack={handleBack}>
      <VODPlayerView
        mediaItem={activeVOD.mediaItem}
        currentEpisode={activeVOD.currentEpisode}
        streamUrl={activeVOD.streamUrl}
        title={activeVOD.title}
        onBack={handleBack}
        onSelectEpisode={(ep) => {
          const updated = {
            ...activeVOD,
            currentEpisode: ep,
            streamUrl: ep.streamUrl,
            title: `${activeVOD.mediaItem.title} - ${ep.title}`,
          };
          setActiveVOD(updated);
          try {
            localStorage.setItem('mastertv_active_vod', JSON.stringify(updated));
          } catch {
            // Storage quota
          }
        }}
      />
    </PlayerLayout>
  );
};

