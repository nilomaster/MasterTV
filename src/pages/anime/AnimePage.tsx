// MasterTV Anime Page
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { AnimeView } from '../../components/anime/AnimeView';

export const AnimePage: React.FC = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8 py-2 flex-1 flex flex-col justify-center">
        <AnimeView />
      </div>
    </MainLayout>
  );
};
