// Dedicated Home Page Component
// Connects the 5-card redesigned HomeView to all real MasterTV routes
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { HomeView } from '../../components/HomeView';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export const HomePage: React.FC = () => {
  const { liveChannels, setCurrentChannel, setSelectedMedia, searchQuery, setSearchQuery } = useApp();
  const { navigateTo } = useNavigation();

  return (
    <MainLayout>
      <HomeView
        channels={liveChannels}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
        onSelectChannel={(ch) => {
          setCurrentChannel(ch);
          navigateTo('player');
        }}
        onOpenPlayer={() => navigateTo('player')}
        onSelectMedia={(item) => setSelectedMedia(item)}
        onOpenEPG={() => navigateTo('epg')}
        onOpenVODCategory={(cat) => navigateTo('vod', cat)}
        onOpenKids={() => navigateTo('kids')}
        onOpenAnime={() => navigateTo('anime')}
      />
    </MainLayout>
  );
};
