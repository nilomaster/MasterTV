// Dedicated Home Page Component
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { HomeView } from '../../components/HomeView';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export const HomePage: React.FC = () => {
  const { liveChannels, setCurrentChannel, setSelectedMedia } = useApp();
  const { navigateTo } = useNavigation();

  return (
    <MainLayout>
      <HomeView
        channels={liveChannels}
        onSelectChannel={(ch) => {
          setCurrentChannel(ch);
          navigateTo('player');
        }}
        onOpenPlayer={() => navigateTo('player')}
        onSelectMedia={(item) => setSelectedMedia(item)}
        onOpenEPG={() => navigateTo('epg')}
        onOpenVODCategory={(cat) => navigateTo('vod', cat)}
      />
    </MainLayout>
  );
};

