// Stream quality detector and resolution resolver
// Strictly ASCII comments only

export interface QualityInfo {
  short: string;
  full: string;
  badgeBg: string;
  borderBg: string;
}

/**
 * Resolves quality from actual video pixel dimensions (videoWidth, videoHeight).
 * This has absolute priority during video playback.
 */
export function detectQualityFromDimensions(height: number, width?: number): QualityInfo {
  if (height >= 2160 || (width && width >= 3840)) {
    return {
      short: '4K',
      full: '4K Ultra HD',
      badgeBg: 'bg-amber-500/20 text-amber-300',
      borderBg: 'border-amber-400/30',
    };
  }
  if (height >= 1440 || (width && width >= 2560)) {
    return {
      short: '2K',
      full: '2K Quad HD',
      badgeBg: 'bg-purple-500/20 text-purple-300',
      borderBg: 'border-purple-400/30',
    };
  }
  if (height >= 1080 || (width && width >= 1920)) {
    return {
      short: '1080P',
      full: '1080p Full HD',
      badgeBg: 'bg-blue-500/20 text-blue-300',
      borderBg: 'border-blue-400/30',
    };
  }
  if (height >= 720 || (width && width >= 1280)) {
    return {
      short: '720P',
      full: '720p HD',
      badgeBg: 'bg-cyan-500/20 text-cyan-300',
      borderBg: 'border-cyan-400/30',
    };
  }
  if (height >= 480) {
    return {
      short: '480P',
      full: '480p SD',
      badgeBg: 'bg-slate-500/20 text-slate-300',
      borderBg: 'border-slate-400/30',
    };
  }
  if (height > 0) {
    return {
      short: `${height}P`,
      full: `${height}p`,
      badgeBg: 'bg-slate-500/20 text-slate-300',
      borderBg: 'border-slate-400/30',
    };
  }
  return {
    short: 'HD',
    full: 'HD 1080p',
    badgeBg: 'bg-blue-500/20 text-blue-300',
    borderBg: 'border-blue-400/30',
  };
}

/**
 * Resolves quality hint from stream URL, source name, or explicit quality string
 */
export function detectQualityFromUrl(
  url?: string,
  name?: string,
  explicitQuality?: string
): QualityInfo {
  // 1. Check explicit quality tag if provided (e.g. from sources_json)
  const eq = (explicitQuality || '').trim().toUpperCase();
  if (eq) {
    if (eq === '4K' || eq === '2160P' || eq === 'UHD') {
      return {
        short: '4K',
        full: '4K Ultra HD',
        badgeBg: 'bg-amber-500/20 text-amber-300',
        borderBg: 'border-amber-400/30',
      };
    }
    if (eq === '2K' || eq === '1440P' || eq === 'QHD') {
      return {
        short: '2K',
        full: '2K Quad HD',
        badgeBg: 'bg-purple-500/20 text-purple-300',
        borderBg: 'border-purple-400/30',
      };
    }
    if (eq === 'FHD' || eq === '1080P' || eq === 'FULL HD' || eq === 'FULLHD') {
      return {
        short: '1080P',
        full: '1080p Full HD',
        badgeBg: 'bg-blue-500/20 text-blue-300',
        borderBg: 'border-blue-400/30',
      };
    }
    if (eq === 'HD' || eq === '720P') {
      return {
        short: '720P',
        full: '720p HD',
        badgeBg: 'bg-cyan-500/20 text-cyan-300',
        borderBg: 'border-cyan-400/30',
      };
    }
    if (eq === 'SD' || eq === '480P') {
      return {
        short: '480P',
        full: '480p SD',
        badgeBg: 'bg-slate-500/20 text-slate-300',
        borderBg: 'border-slate-400/30',
      };
    }
  }

  // 2. Check source name or URL heuristics
  const combined = `${name || ''} ${url || ''}`.toLowerCase();

  if (combined.includes('4k') || combined.includes('2160') || combined.includes('uhd')) {
    return {
      short: '4K',
      full: '4K Ultra HD',
      badgeBg: 'bg-amber-500/20 text-amber-300',
      borderBg: 'border-amber-400/30',
    };
  }
  if (combined.includes('1440') || combined.includes('2k') || combined.includes('qhd')) {
    return {
      short: '2K',
      full: '2K Quad HD',
      badgeBg: 'bg-purple-500/20 text-purple-300',
      borderBg: 'border-purple-400/30',
    };
  }
  if (
    combined.includes('1080') ||
    combined.includes('fhd') ||
    combined.includes('fullhd') ||
    combined.includes('full-hd')
  ) {
    return {
      short: '1080P',
      full: '1080p Full HD',
      badgeBg: 'bg-blue-500/20 text-blue-300',
      borderBg: 'border-blue-400/30',
    };
  }
  if (
    combined.includes('720') ||
    /\bhd\b/.test(combined) ||
    combined.includes(' hd') ||
    combined.includes('-hd')
  ) {
    return {
      short: '720P',
      full: '720p HD',
      badgeBg: 'bg-cyan-500/20 text-cyan-300',
      borderBg: 'border-cyan-400/30',
    };
  }
  if (combined.includes('480') || /\bsd\b/.test(combined)) {
    return {
      short: '480P',
      full: '480p SD',
      badgeBg: 'bg-slate-500/20 text-slate-300',
      borderBg: 'border-slate-400/30',
    };
  }

  // Default fallback when quality is unspecified
  return {
    short: 'HD',
    full: '720p HD',
    badgeBg: 'bg-cyan-500/20 text-cyan-300',
    borderBg: 'border-cyan-400/30',
  };
}

/**
 * Unified stream quality resolver combining real dimensions, manual override and url heuristics
 */
export function getStreamQuality(
  url?: string,
  name?: string,
  dimensions?: { height: number; width?: number },
  explicitQuality?: string
): QualityInfo {
  if (dimensions && dimensions.height > 0) {
    return detectQualityFromDimensions(dimensions.height, dimensions.width);
  }
  return detectQualityFromUrl(url, name, explicitQuality);
}

