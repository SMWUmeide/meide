import { Platform } from 'react-native';
import { isProfileId, parseInvite, type Companion } from './invite';
function baseUrl() {
  const configured = process.env.EXPO_PUBLIC_COMPANION_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS === 'web') return '';
  throw new Error('초대 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
}
async function request(path: string, body?: object) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, { method:body ? 'POST' : 'GET', headers:body ? {'Content-Type':'application/json'} : undefined, body:body ? JSON.stringify(body) : undefined, signal:controller.signal });
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : '초대 정보를 불러오지 못했어요.');
    return result;
  } catch(e) {
    if (e instanceof TypeError || (e instanceof Error && e.name === 'AbortError')) throw new Error('초대 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.');
    throw e;
  } finally { clearTimeout(timer); }
}
export async function issueInvite(id: string, token: string, name: string): Promise<string> {
  const result = await request('/api/invites', {id,token,name});
  if (result.id !== id) throw new Error('초대 정보를 확인할 수 없어요.');
  return parseInvite(result.code);
}
export async function resolveInvite(raw: string): Promise<Companion> {
  const code = parseInvite(raw);
  const result = await request(`/api/invites/${code}`);
  if (!isProfileId(result.id) || typeof result.name !== 'string' || !result.name.trim() || result.name.length > 20) throw new Error('동반인 정보를 확인할 수 없어요.');
  return {id:result.id,name:result.name};
}
export async function loadCompanions(id: string, token: string, action = 'list', extra = {}): Promise<Companion[]> {
  const result = await request(`/api/companions/${action}`, {id,token,...extra});
  if (!Array.isArray(result.companions) || !result.companions.every((p: Companion) => isProfileId(p.id) && typeof p.name === 'string' && p.name.length <= 20)) throw new Error('동반인 목록을 불러오지 못했어요.');
  return result.companions;
}
export function invitationUrl(code: string): string {
  const base = process.env.EXPO_PUBLIC_INVITE_WEB_URL ?? (Platform.OS === 'web' ? window.location.origin : undefined);
  if (!base || !/^https?:\/\//.test(base)) throw new Error('초대 링크를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.');
  return `${base.replace(/\/$/,'')}/invite/${parseInvite(code)}`;
}
