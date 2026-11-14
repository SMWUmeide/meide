import{afterEach,expect,it,vi}from'vitest';
import{loadMenuPhotos}from'./menu-photos';
import{demoBoard}from'@/data/mock-menu';
import{withReviewedPhotos}from'@/data/menu-schema';
const photo={provider:'pixabay' as const,url:'https://test.supabase.co/storage/v1/object/public/menu-photos/pixabay-123.jpg',page:'https://pixabay.com/photos/soup-123/',photographer:'Author',reviewVersion:'dish-v5' as const,reviewedFor:demoBoard.items[0].originalName,cutoutUrl:`https://test.supabase.co/storage/v1/object/public/menu-cutouts/${'a'.repeat(64)}.png`};
afterEach(()=>vi.unstubAllGlobals());
it('기본 메뉴에는 해당 메뉴명으로 검토된 사진만 사용해요',()=>{
 expect(demoBoard.items.every(item=>!item.photo||item.photo.reviewVersion==='dish-v5'&&item.photo.reviewedFor===item.originalName&&item.photoUrl===item.photo.cutoutUrl&&!item.detailPhotoUrl)).toBe(true);
});
it('기존 저장본과 공유 방의 미검증 사진·상세 사진을 제거해요',()=>{
 const board={...demoBoard,items:[{...demoBoard.items[0],photo:{...photo,reviewVersion:undefined},photoUrl:photo.url,detailPhotoUrl:'/figma/old.png'}]};
 expect(withReviewedPhotos(board).items[0]).toMatchObject({photo:undefined,photoUrl:null,detailPhotoUrl:undefined});
 expect(withReviewedPhotos({...board,items:[{...board.items[0],photo:{...photo,reviewedFor:'OTHER MENU'}}]}).items[0].photoUrl).toBeNull();
});
it('검색어와 원어 메뉴명을 함께 보내고 상세까지 같은 검토 사진으로 바꿔요',async()=>{
 const fetch=vi.fn().mockResolvedValue(Response.json({photos:[{id:'x',photo,status:'ready'}]}));vi.stubGlobal('fetch',fetch);
 const board={...demoBoard,items:[{...demoBoard.items[0],id:'x',photoQuery:undefined,photo:undefined,photoUrl:null,detailPhotoUrl:'/figma/old.png'}]};
 const result=await loadMenuPhotos(board,new AbortController().signal);const query=JSON.parse(fetch.mock.calls[0][1].body).queries[0];
 expect(query.query).toBe(board.items[0].originalName);expect(query.menuName).toBe(board.items[0].originalName);expect(result.items[0].photoUrl).toBe(photo.cutoutUrl);expect(result.items[0].detailPhotoUrl).toBeUndefined();
});
it('검증 실패 시 예전의 틀린 사진을 남기지 않아요',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({photos:[{id:'x',photo:null,status:'unavailable'}]})));
 const board={...demoBoard,items:[{...demoBoard.items[0],id:'x',photo:{...photo,reviewVersion:undefined},photoUrl:photo.url}]};
 expect((await loadMenuPhotos(board,new AbortController().signal)).items[0].photoUrl).toBeNull();
});
