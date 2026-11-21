// MasterTV Anime Page
// Connects redesigned neon-free AnimeView with global search inside MainLayout
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { AnimeView } from '../../components/anime/AnimeView';
import { useApp } from '../../context/AppContext';

export const AnimePage: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <MainLayout>
      <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
        <AnimeView
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
        />
      </div>
    </MainLayout>
  );
};
