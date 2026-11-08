// Dedicated Admin Layout for reseller and administrative panel
// Strictly ASCII comments only

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { navigateTo } = useNavigation();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      {/* Top Admin Bar */}
      <header className="h-14 border-b border-white/10 bg-[#090d16]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('player')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>Voltar ao Player</span>
          </button>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2.5">
            <img
              src="./assets/img/icons/logo.png"
              alt="MasterTV Logo"
              className="w-6 h-6 object-contain"
            />
            <span className="text-xs font-black tracking-wider uppercase text-white">
              Painel de Administracao &amp; Revenda
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono text-emerald-400">MySQL Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
};

