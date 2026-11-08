// Dedicated Movies, Series and Animes Page
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { VODView } from '../../components/VODView';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export const MoviesPage: React.FC = () => {
  const { setSelectedMedia, searchQuery } = useApp();
  const { vodFilter } = useNavigation();

  return (
    <MainLayout>
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-4 flex-1">
        <VODView
          onSelectMedia={(item) => setSelectedMedia(item)}
          searchQuery={searchQuery}
          initialFilter={vodFilter}
        />
      </div>
    </MainLayout>
  );
};

