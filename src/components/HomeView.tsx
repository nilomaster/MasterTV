// Clean and modern HomeView featuring category cards and beta testing feedback banner
// All comments in this file strictly follow ASCII rules

import React from 'react';
import {
  Film,
  Tv2,
  Sparkles,
  ChevronRight,
  Play,
  Calendar,
  Radio,
  Zap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { Channel, MediaItem } from '../types/iptv';
import { AdminService } from '../services/adminService';

interface HomeViewProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onOpenPlayer: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onOpenEPG: () => void;
  onOpenVODCategory?: (category: 'all' | 'movies' | 'series' | 'animes' | 'doramas') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  channels,
  onOpenPlayer,
  onOpenEPG,
  onOpenVODCategory,
}) => {
  const liveCount = channels.length;
  const dbContents = AdminService.getContents();
  const movies = dbContents.filter((c) => c && c.type === 'movie');
  const series = dbContents.filter((c) => c && c.type === 'series');
  const animes = dbContents.filter((c) => c && c.type === 'anime');

  const livePosters = channels.slice(0, 4).map((c) => c.logo).filter(Boolean);
  const moviePosters = movies.slice(0, 1).map((c) => c.posterUrl).filter(Boolean);
  const seriesPosters = series.slice(0, 1).map((c) => c.posterUrl).filter(Boolean);
  const animePosters = animes.slice(0, 1).map((c) => c.posterUrl).filter(Boolean);

  // Dynamic category cards reflecting exclusively the synchronized database contents
  const cardData = [
    {
      id: 'live',
      title: 'Ao Vivo',
      count: liveCount === 1 ? '1 canal transmitindo' : `${liveCount} canais transmitindo`,
      accentColor: 'text-red-400',
      badgeBg: 'bg-red-500/15 border-red-500/30 text-red-400',
      glowShadow: 'group-hover:shadow-[0_8px_25px_rgba(239,68,68,0.2)]',
      borderHover: 'group-hover:border-red-500/50',
      icon: Radio,
      isLiveBadge: true,
      onClick: () => onOpenPlayer(),
      posters: livePosters,
      isLogoCollage: livePosters.length > 1,
    },
    {
      id: 'movies',
      title: 'Filmes',
      count: movies.length === 1 ? '1 título' : `${movies.length} títulos`,
      accentColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      glowShadow: 'group-hover:shadow-[0_8px_25px_rgba(37,99,235,0.2)]',
      borderHover: 'group-hover:border-blue-500/50',
      icon: Film,
      onClick: () => onOpenVODCategory?.('movies'),
      posters: moviePosters,
    },
    {
      id: 'series',
      title: 'Séries',
      count: series.length === 1 ? '1 título' : `${series.length} títulos`,
      accentColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
      glowShadow: 'group-hover:shadow-[0_8px_25px_rgba(99,102,241,0.2)]',
      borderHover: 'group-hover:border-indigo-500/50',
      icon: Tv2,
      onClick: () => onOpenVODCategory?.('series'),
      posters: seriesPosters,
    },
    {
      id: 'animes',
      title: 'Animes',
      count: animes.length === 1 ? '1 título' : `${animes.length} títulos`,
      accentColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      glowShadow: 'group-hover:shadow-[0_8px_25px_rgba(245,158,11,0.2)]',
      borderHover: 'group-hover:border-amber-500/50',
      icon: Sparkles,
      onClick: () => onOpenVODCategory?.('animes'),
      posters: animePosters,
    },
  ];

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10">
      {/* Page Header / Welcome */}
      <div className="flex flex-col gap-2 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
            Painel Principal
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          O que você deseja assistir hoje?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Selecione uma categoria abaixo para acessar a grade de transmissão ao vivo ou o catálogo sob demanda.
        </p>
      </div>

      {/* Main 4 Navigation Cards (AO VIVO, FILMES, SERIES, ANIMES) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.onClick}
              className={`group relative h-48 sm:h-56 rounded-2xl bg-[#0c1220] border border-white/10 ${card.borderHover} overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg ${card.glowShadow} flex flex-col justify-end p-5 select-none`}
            >
              {/* Card Background Collage */}
              {card.isLogoCollage ? (
                // Live channels logos collage background
                <div className="absolute inset-0 grid grid-cols-2 gap-2 p-3 opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500">
                  {card.posters.map((logo, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center p-2 overflow-hidden"
                    >
                      <img
                        src={logo}
                        alt="Canal"
                        className="max-h-10 max-w-[80px] object-contain drop-shadow"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // Poster strips collage background
                <div className="absolute inset-0 flex items-stretch gap-1 opacity-35 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500">
                  {card.posters.map((img, idx) => (
                    <div key={idx} className="flex-1 h-full overflow-hidden">
                      <img
                        src={img}
                        alt="Poster"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/80 to-transparent pointer-events-none" />

              {/* Live Badge for Ao Vivo */}
              {card.isLiveBadge && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-red-600/30 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  <span>Ao Vivo</span>
                </div>
              )}

              {/* Bottom Card Content: Icon Badge + Titles */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${card.badgeBg} backdrop-blur-md shadow-md group-hover:scale-105 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition-colors tracking-tight">
                      {card.title}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {card.count}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-all opacity-80 group-hover:opacity-100 group-hover:translate-x-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Beta Phase User Testing Card / Banner */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#0c1220] via-[#0f172a] to-[#090d16] border border-blue-500/20 p-6 sm:p-8 lg:p-10 shadow-xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Badge & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Fase Beta Pública • Ambiente de Testes
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-blue-300 bg-blue-950/50 px-3 py-1 rounded-lg border border-blue-500/25 w-fit">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Sistemas de Transmissão Ativos</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-w-4xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Seja bem-vindo aos testes da plataforma MasterTV
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Estamos em fase de homologação dos sinais e das transmissões ao vivo. Convidamos todos os usuários a navegar entre os canais, testar a alternância de fontes, conferir a estabilidade da reprodução e verificar a sincronia em tempo real do nosso Guia de Programação (EPG). Seu teste é fundamental para aprimorarmos continuamente a qualidade do serviço!
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Sinais 100% HD</span>
                <span className="text-[11px] text-slate-400">Qualidade de áudio e vídeo</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <Zap className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Baixa Latência</span>
                <span className="text-[11px] text-slate-400">Modo Zero Delay integrado</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Guia EPG Claro TV+</span>
                <span className="text-[11px] text-slate-400">Grade em tempo real</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Redundância de Fonte</span>
                <span className="text-[11px] text-slate-400">Fallback automático</span>
              </div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenPlayer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Assistir TV Ao Vivo</span>
            </button>

            <button
              onClick={onOpenEPG}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-white/10 hover:border-blue-400/40 transition-all backdrop-blur-md"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Ver Guia de Programação (EPG)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
