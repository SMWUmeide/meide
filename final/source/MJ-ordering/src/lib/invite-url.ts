import { Capacitor } from '@capacitor/core';

export function inviteUrl(invite: string) {
  if (!/^[a-f0-9]{64}$/.test(invite)) throw new Error('초대 링크를 확인해 주세요');
  const configured = import.meta.env.VITE_APP_URL?.trim() || import.meta.env.VITE_API_BASE_URL?.trim();
  const url = new URL(configured || window.location.origin);
  if (url.username || url.password || (configured && url.protocol !== 'https:') || (Capacitor.isNativePlatform() && (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('동반인 초대용 서버 주소를 연결해 주세요');
  return `${url.origin}/join/${invite}`;
}


/** Accept only our exact HTTPS origins and a complete opaque invitation token. */
export function inviteToken(value: string): string | null {
  try {
    const url = new URL(value);
    const origins = new Set(['https://meide-meide1.vercel.app', 'https://meide.vercel.app', window.location.origin]);
    for (const configured of [import.meta.env.VITE_APP_URL, import.meta.env.VITE_API_BASE_URL]) {
      if (configured?.trim()) origins.add(new URL(configured.trim()).origin);
    }
    if (!origins.has(url.origin) || url.username || url.password || url.search) return null;
    if (url.protocol !== 'https:' && url.origin !== window.location.origin) return null;
    const pathToken = !url.hash && /^\/join\/([a-f0-9]{64})\/?$/.exec(url.pathname)?.[1];
    const hashToken = url.pathname === '/' && /^#\/join\/([a-f0-9]{64})$/.exec(url.hash)?.[1];
    return pathToken || hashToken || null;
  } catch { return null; }
}
