// Dedicated Client Favorites Page
// Strictly ASCII comments only

import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';
import { Heart, Play } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { channels, favoritesCount, setCurrentChannel } = useApp();
  const { navigateTo } = useNavigation();

  const favoriteChannels = channels.filter((c) => c.isFavorite);

  return (
    <MainLayout>
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6 flex-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <span>Seus Canais Favoritos ({favoritesCount})</span>
          </h1>
          {favoritesCount > 0 && (
            <button
              onClick={() => {
                if (favoriteChannels.length > 0) {
                  setCurrentChannel(favoriteChannels[0]);
                  navigateTo('player');
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Assistir Primeiro</span>
            </button>
          )}
        </div>

        {favoritesCount === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
            <Heart className="w-10 h-10 text-slate-700 stroke-[1.5]" />
            <p>Voce ainda nao favoritou nenhum canal.</p>
            <p className="text-xs text-slate-600">
              Clique no icone de coracao nos canais ou no guia EPG para adiciona-los aos seus favoritos!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {favoriteChannels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  setCurrentChannel(ch);
                  navigateTo('player');
                }}
                className="bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-cyan-400 p-3 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="w-14 h-14 mx-auto my-2 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/5 group-hover:scale-105 transition-transform">
                  <img
                    src={ch.logo || './assets/img/icons/favicon.svg'}
                    alt={ch.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="text-center mt-2">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                    {ch.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {ch.currentProgram || 'Transmissao ao Vivo'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

