// Dedicated Electronic Program Guide (EPG) Page
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { PlayerView } from '../../components/PlayerView';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';
import { INITIAL_CATEGORIES } from '../../services/mockData';

export const EPGGuidePage: React.FC = () => {
  const {
    liveChannels,
    currentChannel,
    setCurrentChannel,
    toggleFavorite,
    setIsPlayerControlsVisible,
    isNavbarHovered,
  } = useApp();

  const { navigateTo } = useNavigation();

  const activeChannel = currentChannel || liveChannels[0] || null;

  return (
    <MainLayout>
      <div className="flex-1 h-[calc(100dvh-4rem)] overflow-hidden">
        <PlayerView
          channels={liveChannels}
          currentChannel={activeChannel}
          onSelectChannel={(ch) => setCurrentChannel(ch)}
          onToggleFavorite={toggleFavorite}
          onOpenEPG={() => {}}
          isEPGOpenProp={true}
          onCloseEPG={() => navigateTo('player')}
          categories={INITIAL_CATEGORIES}
          onControlsVisibilityChange={setIsPlayerControlsVisible}
          isNavbarHovered={isNavbarHovered}
        />
      </div>
    </MainLayout>
  );
};

