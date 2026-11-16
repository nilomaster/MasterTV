// Stream URL Resolver for MasterTV
// Routes IPTV streams through secure backend proxy on web to bypass Mixed Content and CORS
// Strictly ASCII comments only as per project guidelines

export function resolvePlayableStreamUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const clean = rawUrl.trim();

  // If already proxied, return as-is
  if (clean.includes('/api/stream') || clean.includes('/api/proxy') || clean.includes('/api/m3u_proxy')) {
    return clean;
  }

  // Native Android APK (Capacitor) can play direct URLs without browser mixed content or CORS limits
  if (typeof window !== 'undefined') {
    const isNative = Boolean((window as any).Capacitor?.isNativePlatform?.());
    if (isNative) {
      return clean;
    }
  }

  // Public HTTPS CDN streams without port or special IPTV auth can play directly
  const isHttp = clean.startsWith('http://');
  const isXtreamOrIpTv = clean.includes(':80') || clean.includes('/movie/') || clean.includes('/series/') || clean.includes('.m3u8');

  // If on web (HTTPS origin or local test), route HTTP or IPTV streams through MasterTV secure proxy
  if (isHttp || isXtreamOrIpTv) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const apiBase = isLocal ? 'https://mastertvhd.online/api' : './api';
    return `${apiBase}/stream.php?url=${encodeURIComponent(clean)}`;
  }

  return clean;
}
