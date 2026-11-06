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
  const liveCount = channels.length || 18;

  // Curated poster collages for each category card matching the reference design
  const cardData = [
    {
      id: 'live',
      title: 'Ao Vivo',
      count: `${liveCount} canais transmitindo`,
      accentColor: 'text-red-400',
      badgeBg: 'bg-red-500/20 border-red-500/40 text-red-400',
      glowShadow: 'group-hover:shadow-[0_10px_30px_rgba(239,68,68,0.25)]',
      borderHover: 'group-hover:border-red-500/60',
      icon: Radio,
      isLiveBadge: true,
      onClick: () => onOpenPlayer(),
      posters: [
        './logos/globosp.png',
        './logos/premiere.png',
        './logos/hbo.png',
        './logos/espn.png',
      ],
      isLogoCollage: true,
    },
    {
      id: 'movies',
      title: 'Filmes',
      count: '29.285 títulos',
      accentColor: 'text-cyan-300',
      badgeBg: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300',
      glowShadow: 'group-hover:shadow-[0_10px_30px_rgba(0,240,255,0.25)]',
      borderHover: 'group-hover:border-cyan-400/60',
      icon: Film,
      onClick: () => onOpenVODCategory?.('movies'),
      posters: [
        './covers/HomenAranhaUmNovoDia.webp',
      ],
    },
    {
      id: 'series',
      title: 'Séries',
      count: '10.201 títulos',
      accentColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
      glowShadow: 'group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.25)]',
      borderHover: 'group-hover:border-blue-400/60',
      icon: Tv2,
      onClick: () => onOpenVODCategory?.('series'),
      posters: [
        './covers/VisionQuest.webp',
      ],
    },
    {
      id: 'animes',
      title: 'Animes',
      count: '426 títulos',
      accentColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
      glowShadow: 'group-hover:shadow-[0_10px_30px_rgba(245,158,11,0.25)]',
      borderHover: 'group-hover:border-amber-400/60',
      icon: Sparkles,
      onClick: () => onOpenVODCategory?.('animes'),
      posters: [
        './covers/DeathNoteAnime.webp',
      ],
    },
  ];

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10">
      {/* Page Header / Welcome */}
      <div className="flex flex-col gap-2 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00F0FF]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
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
              className={`group relative h-48 sm:h-56 rounded-2xl bg-[#0c111c] border border-white/10 ${card.borderHover} overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${card.glowShadow} flex flex-col justify-end p-5 select-none`}
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/75 to-transparent pointer-events-none" />

              {/* Live Badge for Ao Vivo */}
              {card.isLiveBadge && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-red-600/40 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Ao Vivo</span>
                </div>
              )}

              {/* Bottom Card Content: Icon Badge + Titles */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${card.badgeBg} backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                      {card.title}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {card.count}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 transition-all opacity-80 group-hover:opacity-100 group-hover:translate-x-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Beta Phase User Testing Card / Banner */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#0f182a] to-[#0a0e17] border border-cyan-500/25 p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

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

            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-500/20 w-fit">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
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
              <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
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
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
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
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Assistir TV Ao Vivo</span>
            </button>

            <button
              onClick={onOpenEPG}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-white/10 hover:border-cyan-400/40 transition-all backdrop-blur-md"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Ver Guia de Programação (EPG)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
