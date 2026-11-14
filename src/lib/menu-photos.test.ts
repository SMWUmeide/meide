import {afterEach,expect,it,vi} from 'vitest';
import{loadMenuPhotos}from'./menu-photos';
import{demoBoard}from'@/data/mock-menu';
afterEach(()=>vi.unstubAllGlobals());
it('기본 메뉴와 상세에도 Pixabay 사진을 사용해요',()=>{
 expect(demoBoard.items.every(item=>item.photoQuery&&item.photo?.provider==='pixabay'&&item.photoUrl===(item.photo.cutoutUrl??item.photo.url)&&!item.detailPhotoUrl)).toBe(true);
});
it('검색어가 없으면 원어명을 사용하고 상세의 예전 사진도 교체해요',async()=>{
 const photo=demoBoard.items[0].photo!;
 const fetch=vi.fn().mockResolvedValue(Response.json({photos:[{id:'x',photo}]}));vi.stubGlobal('fetch',fetch);
 const board={...demoBoard,items:[{...demoBoard.items[0],id:'x',photoQuery:undefined,photo:undefined,photoUrl:null,detailPhotoUrl:'/figma/old.png'}]};
 const result=await loadMenuPhotos(board,new AbortController().signal);
 expect(JSON.parse(fetch.mock.calls[0][1].body).queries[0].query).toBe(board.items[0].originalName);
 expect(result.items[0].photoUrl).toBe(photo.cutoutUrl);expect(result.items[0].detailPhotoUrl).toBeUndefined();
});
