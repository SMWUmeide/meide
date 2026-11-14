import { afterEach, expect, it, vi } from 'vitest';
import { cutoutPhoto } from './cutout-photo';
import { reserveApiCalls } from './api-budget';
vi.mock('./remove-background',()=>({removeBackground:vi.fn().mockResolvedValue(Buffer.from([137,80,78,71,13,10,26,10]))}));
vi.mock('./api-budget',()=>({reserveApiCalls:vi.fn().mockResolvedValue(undefined)}));
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
const source='https://images.pexels.com/photos/1/dish.jpg';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'storage-secret',PHOTOROOM_API_KEY:'photo-secret',PHOTOROOM_LIFETIME_LIMIT:'10'};
it('기본 설정에서는 과금되는 배경 제거를 호출하지 않아요',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);expect(await cutoutPhoto(source,{},new AbortController().signal)).toBeNull();expect(fetch).not.toHaveBeenCalled();});
it('저장된 누끼 사진은 다시 가공하지 않아요',async()=>{const fetch=vi.fn().mockResolvedValue(new Response(null,{status:200}));vi.stubGlobal('fetch',fetch);expect(await cutoutPhoto(source,env,new AbortController().signal)).toContain('/menu-cutouts/');expect(fetch).toHaveBeenCalledTimes(1);expect(reserveApiCalls).not.toHaveBeenCalled();});
it('허용된 원본만 흰 배경 PNG로 가공하고 키를 URL에 노출하지 않아요',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(new Response(null,{status:404})).mockResolvedValueOnce(new Response(new Uint8Array([255,216,255]),{headers:{'Content-Type':'image/jpeg'}})).mockResolvedValueOnce(new Response(null,{status:200}));vi.stubGlobal('fetch',fetch);
 const result=await cutoutPhoto(source,env,new AbortController().signal);
 expect(result).toMatch(/^https:\/\/example.supabase.co\/storage\/v1\/object\/public\/menu-cutouts\/[a-f0-9]{64}\.png$/);
 expect(fetch.mock.calls[2][1].headers['Content-Type']).toBe('image/png');expect(reserveApiCalls).toHaveBeenCalledWith('cutout',env);expect(fetch.mock.calls.every(([url])=>!String(url).includes('photoroom'))).toBe(true);
 await expect(cutoutPhoto('https://other.test/photo',env,new AbortController().signal)).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(3);
});
