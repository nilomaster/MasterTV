// MasterTV Admin Categories Overview Component
// Displays real imported categories grouped by content type (TV, Movies, Series, Kids, Anime)
// Strictly ASCII comments only

import React, { useMemo, useState } from 'react';
import { FolderTree, Tv, Film, Clapperboard, Sparkles, Flame, Search, ArrowRight } from 'lucide-react';
import type { AdminContentItem } from '../../../types/admin';

interface AdminCategoriesViewProps {
  contents: AdminContentItem[];
  onOpenCategoryInCatalog: (
    typeFilter: 'all' | 'channel' | 'movie' | 'series' | 'anime' | 'dorama',
    categoryName: string
  ) => void;
}

type CategoryGroupType = 'all' | 'channel' | 'movie' | 'series' | 'kids' | 'anime';

interface CategoryEntry {
  name: string;
  group: Exclude<CategoryGroupType, 'all'>;
  count: number;
}

const KIDS_KEYWORDS = ['kids', 'infantil', 'desenho', 'desenhos', 'animacao', 'animação', 'cartoon', 'disney', 'pixar', 'nick', 'gloob'];
const ANIME_KEYWORDS = ['anime', 'animes', 'shonen', 'seinen', 'isekai', 'crunchyroll'];

export const AdminCategoriesView: React.FC<AdminCategoriesViewProps> = ({
  contents,
  onOpenCategoryInCatalog,
}) => {
  const [activeGroup, setActiveGroup] = useState<CategoryGroupType>('all');
  const [search, setSearch] = useState<string>('');

  const categories = useMemo<CategoryEntry[]>(() => {
    const map = new Map<string, CategoryEntry>();

    const addEntry = (name: string, group: Exclude<CategoryGroupType, 'all'>) => {
      const clean = name.trim();
      if (!clean) return;
      const key = `${group}::${clean.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { name: clean, group, count: 1 });
      }
    };

    contents.forEach((item) => {
      if (!item) return;
      if (item.type === 'channel') {
        addEntry(item.channelCategory || 'TV ao Vivo', 'channel');
        return;
      }

      const genres = Array.isArray(item.genres) ? item.genres : [];
      const joined = `${item.title || ''} ${genres.join(' ')}`.toLowerCase();

      let group: Exclude<CategoryGroupType, 'all'> = item.type === 'series' ? 'series' : 'movie';
      if (item.type === 'anime' || ANIME_KEYWORDS.some((k) => joined.includes(k))) {
        group = 'anime';
      } else if (KIDS_KEYWORDS.some((k) => joined.includes(k))) {
        group = 'kids';
      }

      if (genres.length > 0) {
        genres.forEach((g) => addEntry(String(g), group));
      } else {
        addEntry('Geral', group);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [contents]);

  const groupCounts = useMemo(() => {
    return {
      all: categories.length,
      channel: categories.filter((c) => c.group === 'channel').length,
      movie: categories.filter((c) => c.group === 'movie').length,
      series: categories.filter((c) => c.group === 'series').length,
      kids: categories.filter((c) => c.group === 'kids').length,
      anime: categories.filter((c) => c.group === 'anime').length,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      const matchesGroup = activeGroup === 'all' || c.group === activeGroup;
      const matchesQuery = !q || c.name.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [categories, activeGroup, search]);

  const getGroupBadge = (group: CategoryEntry['group']) => {
    switch (group) {
      case 'channel':
        return { label: 'TV ao Vivo', icon: Tv, cls: 'bg-[#16B981]/15 text-[#16B981] border-[#16B981]/30' };
      case 'movie':
        return { label: 'Filmes', icon: Film, cls: 'bg-[#009DFF]/15 text-[#25C4E8] border-[#009DFF]/30' };
      case 'series':
        return { label: 'Series', icon: Clapperboard, cls: 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/30' };
      case 'kids':
        return { label: 'Kids', icon: Sparkles, cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
      case 'anime':
        return { label: 'Anime', icon: Flame, cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Header Panel */}
      <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#009DFF]/15 border border-[#009DFF]/30 text-[#009DFF] flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">Organizacao de Categorias</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Categorias reais extraidas do catalogo sincronizado (TV ao Vivo, Filmes, Series, Kids e Anime).
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-[#0F1726] border border-[#253247] text-xs font-semibold text-[#94A3B8]">
          Total mapeado: <strong className="text-[#F8FAFC]">{categories.length}</strong> categorias
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(
            [
              { id: 'all', label: 'Todas', count: groupCounts.all },
              { id: 'channel', label: 'TV ao Vivo', count: groupCounts.channel },
              { id: 'movie', label: 'Filmes', count: groupCounts.movie },
              { id: 'series', label: 'Series', count: groupCounts.series },
              { id: 'kids', label: 'Kids', count: groupCounts.kids },
              { id: 'anime', label: 'Anime', count: groupCounts.anime },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveGroup(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                activeGroup === tab.id
                  ? 'bg-[#009DFF]/15 text-[#F8FAFC] border-[#009DFF]/50'
                  : 'bg-[#0F1726] text-[#94A3B8] border-[#253247] hover:text-[#F8FAFC]'
              }`}
            >
              {tab.label} <span className="font-mono opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[230px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1726] border border-[#253247] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#009DFF]"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-[#151E2E] border border-[#253247] rounded-2xl p-10 text-center text-xs text-[#94A3B8]">
          Nenhuma categoria encontrada para este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCategories.map((cat) => {
            const meta = getGroupBadge(cat.group);
            const Icon = meta.icon;
            const targetFilter =
              cat.group === 'channel'
                ? 'channel'
                : cat.group === 'series'
                ? 'series'
                : cat.group === 'anime'
                ? 'anime'
                : cat.group === 'movie'
                ? 'movie'
                : 'all';

            return (
              <button
                key={`${cat.group}-${cat.name}`}
                type="button"
                onClick={() => onOpenCategoryInCatalog(targetFilter, cat.name)}
                className="group bg-[#151E2E] hover:bg-[#192438] border border-[#253247] hover:border-[#009DFF]/45 rounded-2xl p-4 text-left flex flex-col justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${meta.cls}`}
                  >
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#F8FAFC] bg-[#0F1726] border border-[#253247] px-2 py-0.5 rounded-md">
                    {cat.count}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#F8FAFC] truncate group-hover:text-[#009DFF] transition-colors">
                    {cat.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#009DFF] shrink-0 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
