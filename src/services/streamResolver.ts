// Stream URL Resolver for MasterTV
// Routes IPTV streams through secure backend proxy on Web and Android APK
// Avoids Mixed Content, CORS, HTTP redirects and IPTV User-Agent blocks in Android WebView
// Strictly ASCII comments only as per project guidelines

const PRODUCTION_API_BASE = 'https://mastertvhd.online/api';

export function resolvePlayableStreamUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const clean = rawUrl.trim();

  // If already proxied, ensure absolute URL when running inside Capacitor Android APK or localhost
  if (clean.includes('/api/stream') || clean.includes('/api/proxy') || clean.includes('/api/m3u_proxy')) {
    if (clean.startsWith('./api/') || clean.startsWith('/api/')) {
      const isNativeOrLocal =
        typeof window !== 'undefined' &&
        (Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');
      if (isNativeOrLocal) {
        const suffix = clean.replace(/^\.?\/api/, '');
        return `${PRODUCTION_API_BASE}${suffix}`;
      }
    }
    return clean;
  }

  const isHttp = clean.startsWith('http://');
  const isXtreamOrIpTv =
    clean.includes(':80') ||
    clean.includes('/movie/') ||
    clean.includes('/series/') ||
    clean.includes('/live/') ||
    clean.includes('.m3u8') ||
    clean.includes('.mp4') ||
    clean.includes('.mkv') ||
    clean.includes('.ts');

  // Route HTTP or IPTV/VOD streams through MasterTV secure HTTPS proxy (works identically on Web & Android APK)
  if (isHttp || isXtreamOrIpTv) {
    const isNative =
      typeof window !== 'undefined' &&
      Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const apiBase = isNative || isLocal ? PRODUCTION_API_BASE : './api';
    return `${apiBase}/stream.php?url=${encodeURIComponent(clean)}`;
  }

  return clean;
}
