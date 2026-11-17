import { Platform } from 'react-native';
import { issueInvite } from '../companions/api';
import type { Progress } from '../../state/model';
export type RestaurantPlace = {
  id: string; name: string; address: string; category: string; googleMapsUri: string | null;
  location: { latitude: number; longitude: number } | null; openNow: boolean | null;
  photo: { uri: string; authors: { name: string; uri: string | null }[] } | null;
  attributions: { name: string; uri: string | null }[];
};
export type RestaurantSearch = { places: RestaurantPlace[]; mapImage: string | null };
export type WebsiteMenu = { status: 'unavailable'; source: 'photo' } | {
  status: 'found'; source: 'website'; text: string; url: string; partial: boolean; checkedAt: string;
};
export type RestaurantDetails = { id: string; websiteUri: string | null; webMenu?: WebsiteMenu };
export type MenuTranslation = {
  originalText: string; translatedText?: string; restaurantName?: string | null; restaurantQuery?: string | null;
  searchAttempted?: boolean; restaurantSearch?: RestaurantSearch; restaurantNotice?: string;
  restaurantDecision?: 'confirmed' | 'skipped'; confirmedRestaurant?: RestaurantPlace;
  websiteUri?: string | null; detailsAttempted?: boolean;
  photoOriginalText?: string; menuSource?: 'website' | 'photo'; webMenu?: WebsiteMenu;
};
export type ReadMenuResult = { text: string; restaurantName: string | null; restaurantQuery: string | null };
export type MenuTestStatus = { ready: boolean; remaining?: number; message: string };
type MenuProfile = Pick<Progress, 'profileId' | 'profileToken' | 'name'>;
function baseUrl() {
  const base = process.env.EXPO_PUBLIC_COMPANION_API_URL?.replace(/\/$/, '') ?? (Platform.OS === 'web' ? '' : null);
  if (base === null) throw new Error('메뉴 번역 서버에 연결할 수 없어요.');
  return base;
}
async function request(path: string, profile: MenuProfile, body: object = {}) {
  if (!profile.profileId || !profile.profileToken) throw new Error('사용자 정보를 확인해 주세요.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ ...body, id: profile.profileId, token: profile.profileToken }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '요청을 완료하지 못했어요.');
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('응답 시간이 초과됐어요. 중복 요청은 하지 않았어요.');
    if (error instanceof TypeError) throw new Error('서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.');
    throw error;
  } finally { clearTimeout(timer); }
}
export async function getMenuTestStatus(profile: MenuProfile): Promise<MenuTestStatus> {
  if (!profile.profileId || !profile.profileToken) throw new Error('사용자 정보를 확인해 주세요.');
  await issueInvite(profile.profileId, profile.profileToken, profile.name);
  return request('/api/menu/status', profile);
}
export async function readMenu(imageBase64: string, requestId: string, profile: MenuProfile): Promise<ReadMenuResult> {
  if (imageBase64.length > 5600000) throw new Error('4MB 이하의 메뉴판 사진을 선택해 주세요.');
  const data = await request('/api/menu/process', profile, { requestId, operation: 'ocr', payload: { imageBase64, consent: true } });
  if (typeof data.result?.text !== 'string') throw new Error('인식 결과를 확인하지 못했어요.');
  return { text: data.result.text, restaurantName: data.result.restaurantName ?? null, restaurantQuery: data.result.restaurantQuery ?? null };
}
export async function translateMenu(text: string, requestId: string, profile: MenuProfile): Promise<string> {
  if (Array.from(text).length > 5000) throw new Error('5,000자를 넘는 메뉴판이에요. 아래 원문에서 번역할 부분을 줄여 주세요.');
  const data = await request('/api/menu/process', profile, { requestId, operation: 'translate', payload: { text } });
  if (typeof data.result?.text !== 'string') throw new Error('번역 결과를 확인하지 못했어요.');
  return data.result.text;
}

export async function searchRestaurants(query: string, requestId: string, profile: MenuProfile): Promise<RestaurantSearch> {
  const data = await request('/api/menu/process', profile, { requestId, operation: 'search', payload: { query } });
  if (!Array.isArray(data.result?.places)) throw new Error('식당 검색 결과를 확인하지 못했어요.');
  return data.result;
}
export async function confirmRestaurant(placeId: string, requestId: string, profile: MenuProfile): Promise<RestaurantDetails> {
  const data = await request('/api/menu/process', profile, { requestId, operation: 'details', payload: { placeId, confirmed: true, preferWebsite: true } });
  return data.result;
}
