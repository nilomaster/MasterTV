// MasterTV Kids Page
// Connects the redesigned KidsView with global search inside MainLayout
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { KidsView } from '../../components/kids/KidsView';
import { useApp } from '../../context/AppContext';

export const KidsPage: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <MainLayout>
      <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
        <KidsView
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
        />
      </div>
    </MainLayout>
  );
};
