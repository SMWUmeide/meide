import { Capacitor } from '@capacitor/core';

export function inviteUrl(invite: string) {
  if (!/^[a-f0-9]{64}$/.test(invite)) throw new Error('초대 링크를 확인해 주세요');
  const configured = import.meta.env.VITE_APP_URL?.trim() || import.meta.env.VITE_API_BASE_URL?.trim();
  const url = new URL(configured || window.location.origin);
  if (url.username || url.password || (configured && url.protocol !== 'https:') || (Capacitor.isNativePlatform() && (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('동반인 초대용 서버 주소를 연결해 주세요');
  return `${url.origin}/#/join/${invite}`;
}
