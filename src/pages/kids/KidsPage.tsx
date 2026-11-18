// MasterTV Kids Page
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { KidsView } from '../../components/kids/KidsView';

export const KidsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-[1920px] mx-auto px-1 sm:px-4 lg:px-8 py-1 sm:py-2 flex-1 flex flex-col justify-start md:justify-center">
        <KidsView />
      </div>
    </MainLayout>
  );
};
