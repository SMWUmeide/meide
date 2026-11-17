import { Platform } from 'react-native';
import { parseTravelDestination, type TravelDestination } from './catalog';

export type TravelResults = {places: TravelDestination[]; nextOffset: number | null};
export async function fetchTravelDestinations(query: string, offset: number, signal: AbortSignal): Promise<TravelResults> {
  const base = process.env.EXPO_PUBLIC_COMPANION_API_URL?.replace(/\/$/, '') ?? (Platform.OS === 'web' ? '' : null);
  if (base === null) throw new Error('여행지 검색에 연결할 수 없어요.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted) controller.abort();
  signal.addEventListener('abort', abort);
  const timer = setTimeout(abort, 12000);
  try {
    const response = await fetch(`${base}/api/travel/search?q=${encodeURIComponent(query)}&offset=${offset}`, {signal: controller.signal});
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '여행지를 불러오지 못했어요.');
    if (!Array.isArray(data.places) || data.places.length > 30 || !(data.nextOffset === null || (Number.isInteger(data.nextOffset) && data.nextOffset === offset + 30))) throw new Error('여행지 정보를 확인하지 못했어요.');
    const places = data.places.map(parseTravelDestination);
    if (places.some((place: TravelDestination | undefined) => !place)) throw new Error('여행지 정보를 확인하지 못했어요.');
    return {places: places as TravelDestination[], nextOffset: data.nextOffset};
  } catch (error) {
    if (signal.aborted) throw error;
    if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')) throw new Error('여행지를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
