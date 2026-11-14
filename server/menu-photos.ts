import { pixabayPhoto } from './pixabay-photos';
import { cutoutPhoto } from "./cutout-photo";
import { reserveApiCalls, ApiBudgetError } from "./api-budget";
import { z } from 'zod';
import { apiAccess, readSmallJson, type ApiEnv } from './http';
import { menuPhotoSchema, type MenuPhoto } from '../src/data/menu-photo';
const input = z.object({ queries: z.array(z.object({ id: z.string().min(1).max(100), query: z.string().trim().min(2).max(120) }).strict()).min(1).max(4) }).strict();
// Bounded, best-effort cache. Missing results are cached too; failures are not.
const cache = new Map<string, { photo: MenuPhoto | null; expires: number }>();
export async function menuPhotos(request: Request, env: ApiEnv = process.env): Promise<Response> {
  const { reply, response } = apiAccess(request,env);
  if (response) return response;
  if (request.method !== 'POST') return reply({ message:'사진 검색을 다시 시도해 주세요' },405);
  if (!env.PIXABAY_API_KEY?.trim() && !env.PEXELS_API_KEY?.trim()) return reply({ error:'CONFIG', message:'음식 사진 서버를 아직 연결하지 않았어요' },503);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error:'CONTENT_TYPE' },415);
  let parsed: z.infer<typeof input>;
  try { parsed = input.parse(await readSmallJson(request,4096)); }
  catch (error) { return reply({ error:'INVALID_INPUT' },error instanceof RangeError ? 413 : 400); }
  try {
    const photos = await Promise.all(parsed.queries.map(async ({id,query}) => {
      if(env.PIXABAY_API_KEY?.trim())return {id,photo:await pixabayPhoto(query,env,request.signal)};
      const key = `${env.PHOTOROOM_API_KEY && Number(env.PHOTOROOM_LIFETIME_LIMIT)>0 ? 'cutout' : 'original'}:${query.toLowerCase()}`; const stored = cache.get(key);
      if (stored && stored.expires>Date.now()) return {id,photo:stored.photo};
      const url = new URL('https://api.pexels.com/v1/search');
      url.searchParams.set('query',query); url.searchParams.set('per_page','1'); url.searchParams.set('orientation','landscape');
      await reserveApiCalls('pexels',env);
      const result = await fetch(url,{headers:{Authorization:env.PEXELS_API_KEY!},signal:AbortSignal.any([request.signal,AbortSignal.timeout(8000)])});
      if (!result.ok) throw new Error('PHOTO_PROVIDER');
      const value = await result.json(); const first = value.photos?.[0];
      const photo = first ? menuPhotoSchema.parse({url:first.src?.large, page:first.url, photographer:first.photographer}) : null;
      if(photo) {
        try { const cutout=await cutoutPhoto(photo.url,env,request.signal);if(cutout)photo.cutoutUrl=cutout; } catch { /* Keep the original with attribution if segmentation is unavailable. */ }
      }
      if (cache.size>=500) cache.delete(cache.keys().next().value!);
      if(!photo || !env.PHOTOROOM_API_KEY || Number(env.PHOTOROOM_LIFETIME_LIMIT || 0)<=0 || photo.cutoutUrl) cache.set(key,{photo,expires:Date.now()+24*60*60*1000});
      return {id,photo};
    }));
    return reply({photos},200);
  } catch (error) { if(error instanceof ApiBudgetError) return reply({error:'CALL_LIMIT',message:error.message},error.status); return reply({error:'PHOTOS_UNAVAILABLE',message:'음식 사진을 불러오지 못했어요. 메뉴는 계속 볼 수 있어요'},502); }
}
