// Dedicated Movies, Series and Animes Page
// Renders redesigned MoviesCatalogView exclusively for Movies while preserving VODView for Series/Animes/Doramas
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { VODView } from '../../components/VODView';
import { MoviesCatalogView } from '../../components/movies/MoviesCatalogView';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export const MoviesPage: React.FC = () => {
  const { setSelectedMedia, searchQuery, setSearchQuery } = useApp();
  const { vodFilter } = useNavigation();

  const isMoviesMode = vodFilter === 'movies' || vodFilter === 'all' || !vodFilter;

  if (isMoviesMode) {
    return (
      <MainLayout>
        <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
          <MoviesCatalogView
            onSelectMedia={(item) => setSelectedMedia(item)}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3 flex-1 flex flex-col justify-center">
        <VODView
          onSelectMedia={(item) => setSelectedMedia(item)}
          searchQuery={searchQuery}
          initialFilter={vodFilter}
        />
      </div>
    </MainLayout>
  );
};
