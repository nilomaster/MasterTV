// Dedicated Radios Page Component
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Radio } from 'lucide-react';

export const RadiosPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6 flex-1">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          <span>Radios Online</span>
        </h1>
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-white/5 text-sm">
          Modulo de Web Radios integrado ao reprodutor MasterTV.
        </div>
      </div>
    </MainLayout>
  );
};

