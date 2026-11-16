import { z } from 'zod';
import { apiUrl } from './api';
import { menuPhotoSchema } from '@/data/menu-photo';
import { withReviewedPhotos, type MenuBoard } from '@/data/menu-schema';
const resultSchema = z.object({ photos: z.array(z.object({ id: z.string(), photo: menuPhotoSchema.nullable(), status: z.enum(['ready', 'unavailable', 'limited', 'failed']) })).max(4) });
export class MenuPhotoError extends Error {
  constructor(message: string, public board: MenuBoard) { super(message); }
}
export async function loadMenuPhotos(board: MenuBoard, signal: AbortSignal, onProgress?: (board: MenuBoard) => void): Promise<MenuBoard> {
  let current = withReviewedPhotos(board);
  const missing = current.items.filter(item => !item.photoUrl);
  let failed = 0;
  // One dish at a time avoids four simultaneous model/cutout jobs and preserves
  // completed photos when a later request reaches the shared provider limit.
  for (const item of missing) {
    try {
      const response = await fetch(apiUrl('/api/menu-photos'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queries: [{ id: item.id, query: item.photoQuery?.trim() || item.originalName, menuName: item.originalName, menuDescription: item.ingredients.map(ingredient => ingredient.original).join(", ").slice(0, 2000) }] }), signal });
      if (!response.ok) throw new Error('음식 사진 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요');
      const { photos } = resultSchema.parse(await response.json());
      const result = photos.find(photo => photo.id === item.id);
      if (!result) throw new Error('음식 사진 응답을 확인하지 못했어요');
      if (result.status === 'limited') throw new Error('사진 검증 호출 한도에 도달했어요. 잠시 후 사진을 다시 불러와 주세요');
      if (result.status === 'failed') { failed++; continue; }
      const photo = result.photo;
      if (result.status === 'ready' && (!photo?.cutoutUrl || photo.reviewVersion !== 'dish-v5' || photo.reviewedFor !== item.originalName)) throw new Error('메뉴와 일치하는 사진인지 확인하지 못했어요');
      current = { ...current, items: current.items.map(existing => existing.id === item.id ? { ...existing, photo: photo ?? undefined, photoUrl: photo?.cutoutUrl ?? null, detailPhotoUrl: undefined } : existing) };
      onProgress?.(current);
    } catch (error) {
      throw new MenuPhotoError(error instanceof Error ? error.message : '음식 사진을 불러오지 못했어요', current);
    }
  }
  if (failed) throw new MenuPhotoError(`음식 사진 ${failed}개의 검색 또는 검증에 실패했어요. 사진을 다시 불러와 주세요`, current);
  return current;
}
