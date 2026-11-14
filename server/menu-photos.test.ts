import{afterEach,describe,expect,it,vi}from'vitest';
import{menuPhotos}from'./menu-photos';
import{pixabayPhoto}from'./pixabay-photos';
import{ApiBudgetError}from'./api-budget';
vi.mock('./pixabay-photos',()=>({pixabayPhoto:vi.fn()}));
const env={PIXABAY_API_KEY:'secret',GEMINI_API_KEY:'secret'};
const request=(queries:unknown)=>new Request('https://meide.test/api/menu-photos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({queries})});
afterEach(()=>vi.resetAllMocks());
describe('검증된 메뉴 사진',()=>{
 it('검색어와 실제 메뉴명을 함께 검증기에 전달해요',async()=>{vi.mocked(pixabayPhoto).mockResolvedValue(null);const r=await menuPhotos(request([{id:'1',query:'white wine',menuName:'BIANCO DELLA CASA'}]),env);expect(r.status).toBe(200);expect(pixabayPhoto).toHaveBeenCalledWith('white wine',env,expect.any(AbortSignal),'BIANCO DELLA CASA');});
 it('불일치 사진을 빈 성공 결과와 구분하고 부분 실패도 보존해요',async()=>{vi.mocked(pixabayPhoto).mockResolvedValueOnce(null).mockRejectedValueOnce(new ApiBudgetError(429));const r=await menuPhotos(request([{id:'1',query:'eggplant soup'},{id:'2',query:'wine'}]),env);expect(await r.json()).toEqual({photos:[{id:'1',photo:null,status:'unavailable'},{id:'2',photo:null,status:'limited'}]});});
 it('사진 검증 키가 없으면 미검증 공급자로 우회하지 않아요',async()=>{expect((await menuPhotos(request([{id:'1',query:'soup'}]),{PEXELS_API_KEY:'legacy'})).status).toBe(503);expect(pixabayPhoto).not.toHaveBeenCalled();});
 it('과도한 요청은 공급자를 호출하지 않아요',async()=>{expect((await menuPhotos(request([{id:'1',query:'a'.repeat(9000)}]),env)).status).toBe(413);expect(pixabayPhoto).not.toHaveBeenCalled();});
});
