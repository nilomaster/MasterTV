// Netflix-Style Series & Episode Auto-Grouping Utility
// Groups loose M3U/Xtream episode rows (e.g. "Apenas um Show S06E03") into a single Series folder
// with organized Seasons and ordered Episode-by-Episode lists
// Strictly ASCII comments only as per project guidelines

import type { MediaItem, EpisodeItem } from '../types/iptv';

interface ParsedEpisodeMeta {
  seriesKey: string;
  seriesTitle: string;
  season: number;
  episode: number;
  episodeSubtitle?: string;
}

// Parse common IPTV / M3U episode naming formats:
// - "Apenas um Show S06E03"
// - "Naruto Shippuden S02 E14 - Title"
// - "Dragon Ball 1x05"
// - "Serie Nome Temporada 2 Episodio 3"
// - "Desenho Nome T01E02"
// - "Desenho Nome Ep 04" / "Ep. 12"
export function parseEpisodeFromTitle(rawTitle: string): ParsedEpisodeMeta | null {
  const title = (rawTitle || '').trim();
  if (!title) return null;

  const patterns: { regex: RegExp; hasSeason: boolean }[] = [
    // S01E02, S1 E2, T01E02, S01-E02
    { regex: /^(.*?)\s*[\(\[\-\|]?\s*[ST](\d{1,2})\s*[-_.\s]*E(\d{1,3})\b[\)\]]?\s*(?:[-–:|]\s*(.*))?$/i, hasSeason: true },
    // 1x02, 02x14
    { regex: /^(.*?)\s*[\(\[\-\|]?\s*(\d{1,2})x(\d{1,3})\b[\)\]]?\s*(?:[-–:|]\s*(.*))?$/i, hasSeason: true },
    // Temporada 1 Episodio 2 / Temp 1 Ep 2
    { regex: /^(.*?)\s*[-–|]?\s*temp(?:orada)?\.?\s*(\d{1,2})\s*[-–|,]?\s*ep(?:is[oó]dio)?\.?\s*(\d{1,3})\b\s*(?:[-–:|]\s*(.*))?$/i, hasSeason: true },
    // Standalone Ep 04 / Episodio 12 (defaults to Season 1)
    { regex: /^(.*?)\s*[-–|]?\s*ep(?:is[oó]dio)?\.?\s*(\d{1,3})\b\s*(?:[-–:|]\s*(.*))?$/i, hasSeason: false },
  ];

  for (const { regex, hasSeason } of patterns) {
    const match = title.match(regex);
    if (match) {
      const baseRaw = (match[1] || '').replace(/[\-\|\(\[\s]+$/g, '').trim();
      if (!baseRaw || baseRaw.length < 2) continue;

      const season = hasSeason ? Math.max(1, parseInt(match[2], 10) || 1) : 1;
      const episode = hasSeason ? Math.max(1, parseInt(match[3], 10) || 1) : Math.max(1, parseInt(match[2], 10) || 1);
      const sub = (hasSeason ? match[4] : match[3])?.trim() || undefined;

      // Normalize key ignoring accents, case and extra punctuation
      const seriesKey = baseRaw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

      if (!seriesKey) continue;

      return {
        seriesKey,
        seriesTitle: baseRaw,
        season,
        episode,
        episodeSubtitle: sub,
      };
    }
  }

  return null;
}

// Group flat episode MediaItems into unified Series folders with sorted seasons & episodes
export function groupSeriesEpisodes(items: MediaItem[]): MediaItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const result: MediaItem[] = [];
  const groups = new Map<
    string,
    {
      baseItem: MediaItem;
      seriesTitle: string;
      episodes: EpisodeItem[];
      genresSet: Set<string>;
      seasonsSet: Set<number>;
      bestYear: number;
      bestRating: number;
      bestPoster: string;
      bestBackdrop: string;
    }
  >();

  // Preserve insertion order of first appearance
  const orderedSlots: ({ kind: 'standalone'; item: MediaItem } | { kind: 'group'; key: string })[] = [];

  for (const item of items) {
    // If item already has multiple structured episodes, keep it as-is
    if (item.episodeList && item.episodeList.length > 1) {
      orderedSlots.push({ kind: 'standalone', item });
      continue;
    }

    const parsed = parseEpisodeFromTitle(item.title);
    if (!parsed) {
      orderedSlots.push({ kind: 'standalone', item });
      continue;
    }

    const epTitle = parsed.episodeSubtitle
      ? `Episodio ${String(parsed.episode).padStart(2, '0')} - ${parsed.episodeSubtitle}`
      : `Episodio ${String(parsed.episode).padStart(2, '0')}`;

    const episodeEntry: EpisodeItem = {
      id: item.id,
      season: parsed.season,
      number: parsed.episode,
      title: epTitle,
      streamUrl: item.streamUrl,
      backupStreamUrl: item.backupStreamUrl,
      duration: item.duration,
      thumbnailUrl: item.posterUrl || item.backdropUrl || undefined,
    };

    const existing = groups.get(parsed.seriesKey);
    if (!existing) {
      const genresSet = new Set<string>(item.genres || []);
      const seasonsSet = new Set<number>([parsed.season]);
      groups.set(parsed.seriesKey, {
        baseItem: item,
        seriesTitle: parsed.seriesTitle,
        episodes: [episodeEntry],
        genresSet,
        seasonsSet,
        bestYear: item.year || 0,
        bestRating: item.rating || 0,
        bestPoster: item.posterUrl || '',
        bestBackdrop: item.backdropUrl || item.posterUrl || '',
      });
      orderedSlots.push({ kind: 'group', key: parsed.seriesKey });
    } else {
      // Avoid exact duplicate season+episode entries
      const dup = existing.episodes.some(
        (e) => (e.season || 1) === parsed.season && e.number === parsed.episode && e.streamUrl === item.streamUrl
      );
      if (!dup) {
        existing.episodes.push(episodeEntry);
      }
      existing.seasonsSet.add(parsed.season);
      (item.genres || []).forEach((g) => existing.genresSet.add(g));
      if (item.year && item.year > existing.bestYear) existing.bestYear = item.year;
      if (item.rating && item.rating > existing.bestRating) existing.bestRating = item.rating;
      if (!existing.bestPoster && item.posterUrl) existing.bestPoster = item.posterUrl;
      if (!existing.bestBackdrop && (item.backdropUrl || item.posterUrl)) {
        existing.bestBackdrop = item.backdropUrl || item.posterUrl;
      }
    }
  }

  for (const slot of orderedSlots) {
    if (slot.kind === 'standalone') {
      result.push(slot.item);
    } else {
      const g = groups.get(slot.key);
      if (!g) continue;

      // Sort episodes cleanly by season ASC, then episode number ASC
      const sortedEpisodes = [...g.episodes].sort((a, b) => {
        const sA = a.season || 1;
        const sB = b.season || 1;
        if (sA !== sB) return sA - sB;
        return a.number - b.number;
      });

      const firstEp = sortedEpisodes[0];
      const totalSeasons = g.seasonsSet.size;

      result.push({
        ...g.baseItem,
        id: `series-group-${slot.key}`,
        title: g.seriesTitle,
        type: g.baseItem.type === 'anime' ? 'anime' : 'series',
        year: g.bestYear || g.baseItem.year,
        rating: g.bestRating || g.baseItem.rating,
        genres: Array.from(g.genresSet),
        posterUrl: g.bestPoster || firstEp?.thumbnailUrl || g.baseItem.posterUrl,
        backdropUrl: g.bestBackdrop || g.bestPoster || g.baseItem.backdropUrl,
        streamUrl: firstEp?.streamUrl || g.baseItem.streamUrl,
        seasons: totalSeasons,
        episodes: sortedEpisodes.length,
        episodeList: sortedEpisodes,
      });
    }
  }

  return result;
}
