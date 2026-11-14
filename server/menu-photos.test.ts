import { afterEach, describe, expect, it, vi } from 'vitest';
import { menuPhotos } from './menu-photos';
const request=(query:string)=>new Request('https://meide.test/api/menu-photos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({queries:[{id:'one',query}]})});
afterEach(()=>vi.unstubAllGlobals());
describe('음식 대표 사진 검색',()=>{
  it('서버 키로 검색하고 검증된 사진·출처만 반환해요',async()=>{
    const fetch=vi.fn().mockResolvedValue(Response.json({photos:[{src:{large:'https://images.pexels.com/photos/1/food.jpg'},url:'https://www.pexels.com/photo/1/',photographer:'Test'}]}));vi.stubGlobal('fetch',fetch);
    const result=await menuPhotos(request('tomato pasta test'),{PEXELS_API_KEY:'private-photo-key'});
    expect(result.status).toBe(200);const text=await result.text();expect(text).toContain('photographer');expect(text).not.toContain('private-photo-key');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('private-photo-key');
    await menuPhotos(request('tomato pasta test'),{PEXELS_API_KEY:'private-photo-key'});expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('검색 결과가 없으면 엉뚱한 대체 사진을 넣지 않아요',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({photos:[]})));expect(await(await menuPhotos(request('unknown dish test'),{PEXELS_API_KEY:'key'})).json()).toEqual({photos:[{id:'one',photo:null}]});});
  it('신뢰하지 않는 이미지 주소를 전달하지 않아요',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({photos:[{src:{large:'https://evil.test/track'},url:'https://www.pexels.com/photo/1/',photographer:'Test'}]})));expect((await menuPhotos(request('unsafe test'),{PEXELS_API_KEY:'key'})).status).toBe(502);});
  it('미설정·과도한 요청은 공급자를 호출하지 않아요',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);expect((await menuPhotos(request('soup'),{})).status).toBe(503);expect((await menuPhotos(request('a'.repeat(5000)),{PEXELS_API_KEY:'key'})).status).toBe(413);expect(fetch).not.toHaveBeenCalled();});
});
