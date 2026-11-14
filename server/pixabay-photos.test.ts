import { afterEach, describe, expect, it, vi } from 'vitest';
import { pixabayPhoto } from './pixabay-photos';
import { reserveApiCalls } from './api-budget';
vi.mock('./cutout-photo',()=>({cutoutPhoto:vi.fn().mockResolvedValue(null)}));
vi.mock('./api-budget',()=>({reserveApiCalls:vi.fn().mockResolvedValue(undefined)}));
const env={PIXABAY_API_KEY:'secret-pixabay',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'secret-server'};
const photo={provider:'pixabay',url:'https://test.supabase.co/storage/v1/object/public/menu-photos/pixabay-123.jpg',page:'https://pixabay.com/photos/soup-123/',photographer:'Author'};
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
describe('Pixabay 저장과 캐시',()=>{
  it('저장한 24시간 캐시가 있으면 외부 검색과 한도를 사용하지 않아요',async()=>{
    const fetch=vi.fn().mockResolvedValue(Response.json({photo,expires:Date.now()+10000}));vi.stubGlobal('fetch',fetch);
    expect(await pixabayPhoto('soup',env,new AbortController().signal)).toEqual(photo);expect(fetch).toHaveBeenCalledTimes(1);expect(reserveApiCalls).not.toHaveBeenCalled();
  });
  it('사진을 저장한 뒤 자체 URL과 출처를 반환하고 캐시해요',async()=>{
    const fetch=vi.fn().mockResolvedValueOnce(new Response(null,{status:404})).mockResolvedValueOnce(Response.json({hits:[{id:123,pageURL:photo.page,webformatURL:'https://cdn.pixabay.com/photo/soup.jpg',user:'Author'}]})).mockResolvedValueOnce(new Response(new Uint8Array([255,216,255]),{headers:{'Content-Type':'image/jpeg'}})).mockResolvedValueOnce(Response.json({})).mockResolvedValueOnce(Response.json({}));vi.stubGlobal('fetch',fetch);
    expect(await pixabayPhoto('soup',env,new AbortController().signal)).toEqual(photo);expect(reserveApiCalls).toHaveBeenCalledWith('pixabay',env);expect(fetch.mock.calls[2][1].redirect).toBe('error');expect(fetch.mock.calls[4][1].body).not.toContain('secret-');
  });
  it('공급자가 외부 주소를 반환하면 다운로드하지 않아요',async()=>{
    const fetch=vi.fn().mockResolvedValueOnce(new Response(null,{status:404})).mockResolvedValueOnce(Response.json({hits:[{id:123,pageURL:photo.page,webformatURL:'http://127.0.0.1/private',user:'Author'}]}));vi.stubGlobal('fetch',fetch);
    await expect(pixabayPhoto('soup',env,new AbortController().signal)).rejects.toThrow('PHOTO_URL');expect(fetch).toHaveBeenCalledTimes(2);
  });
});
