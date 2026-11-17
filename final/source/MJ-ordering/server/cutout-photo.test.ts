import{afterEach,expect,it,vi}from'vitest';
import{cutoutPhoto}from'./cutout-photo';
import{reserveApiCalls}from'./api-budget';
vi.mock('./photo-review',async original=>({...await original<typeof import('./photo-review')>(),reviewCutout:vi.fn().mockResolvedValue(true)}));
vi.mock('./remove-background',()=>({removeBackground:vi.fn().mockResolvedValue(Buffer.from([137,80,78,71,13,10,26,10]))}));
vi.mock('./api-budget',()=>({reserveApiCalls:vi.fn().mockResolvedValue(undefined)}));
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
const source='https://test.supabase.co/storage/v1/object/public/menu-photos/pixabay-1.jpg';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'storage-secret'};
const review={bytes:Buffer.from('source'),box:{left:100,top:100,right:900,bottom:900}};
it('검토된 외곽이 없으면 가공하지 않아요',async()=>{await expect(cutoutPhoto(source,env,new AbortController().signal,{...review,box:{...review.box,right:1000}})).rejects.toThrow();});
it('저장된 누끼는 재가공하지 않아요',async()=>{const fetch=vi.fn().mockResolvedValue(new Response(null,{status:200}));vi.stubGlobal('fetch',fetch);expect(await cutoutPhoto(source,env,new AbortController().signal,review)).toContain('/menu-cutouts/');expect(fetch).toHaveBeenCalledTimes(1);expect(reserveApiCalls).not.toHaveBeenCalled();});
it('접시 외곽을 반영한 PNG만 저장하고 키를 URL에 노출하지 않아요',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(new Response(null,{status:404})).mockResolvedValueOnce(new Response(null,{status:200}));vi.stubGlobal('fetch',fetch);
 const result=await cutoutPhoto(source,env,new AbortController().signal,review);expect(result).not.toContain('storage-secret');expect(fetch.mock.calls[1][1].headers['Content-Type']).toBe('image/png');expect(reserveApiCalls).toHaveBeenCalledWith('cutout',env);
 await expect(cutoutPhoto('https://other.test/photo',env,new AbortController().signal,review)).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(2);
});
it('같은 원본의 검증 완료 누끼는 경계 상자가 조금 달라도 재사용해요',async()=>{
 const fetch=vi.fn().mockResolvedValue(new Response(null,{status:200}));vi.stubGlobal('fetch',fetch);
 const first=await cutoutPhoto(source,env,new AbortController().signal,review);
 const second=await cutoutPhoto(source,env,new AbortController().signal,{...review,box:{left:102,top:103,right:897,bottom:900}});
 expect(first).toBe(second);expect(reserveApiCalls).not.toHaveBeenCalled();
});
