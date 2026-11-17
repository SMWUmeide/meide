import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { menuBoardSchema, type MenuBoard } from './menu-schema';
import type { MenuPhoto } from '../menu-camera/MenuPhotosProvider';

const maxBytes = 3_900_000;
export async function analyzePhotos(photos: MenuPhoto[], signal: AbortSignal): Promise<MenuBoard> {
  if (!photos.length || photos.length > 6) throw new Error('사진은 1~6장 선택해 주세요.');
  const images: { mediaType: 'image/jpeg'; data: string }[] = [];
  for (const photo of photos) {
    if (signal.aborted) throw new Error('취소했어요.');
    const context = ImageManipulator.manipulate(photo.uri);
    const scale = Math.min(1, 1800 / Math.max(photo.width, photo.height));
    if (scale < 1) context.resize({ width: Math.max(1, Math.round(photo.width * scale)), height: Math.max(1, Math.round(photo.height * scale)) });
    const rendered = await context.renderAsync();
    let data = '';
    for (const compress of [0.88, 0.75, 0.6, 0.45]) {
      const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
      data = image.base64 ?? '';
      if (data.length <= Math.floor((maxBytes - 2048) / photos.length)) break;
    }
    if (!data || data.length > Math.floor((maxBytes - 2048) / photos.length)) throw new Error('사진 수나 용량을 줄여 주세요.');
    images.push({ mediaType: 'image/jpeg', data });
  }
  const body = JSON.stringify({ images });
  if (body.length > maxBytes) throw new Error('사진 용량을 줄여 주세요.');
  const origin = process.env.EXPO_PUBLIC_MEIDE_API_URL || 'https://meide-meide1.vercel.app';
  const url = new URL('/api/analyze-menu', origin);
  if (url.protocol !== 'https:') throw new Error('안전한 분석 서버 주소가 필요해요.');
  const response = await fetch(url.toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof json?.message === 'string' ? json.message : '분석에 실패했어요.');
  const result = menuBoardSchema.safeParse(json?.board);
  if (!result.success) throw new Error('분석 결과를 확인하지 못했어요.');
  return result.data;
}
