import { describe, expect, it } from 'vitest';
import { parseSnapshot, sharedView } from './shared-order';
import { demoBoard } from '@/data/mock-menu';
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
describe('공동 장바구니 화면 데이터',()=>{
  it('같은 메뉴를 각자 담아도 사용자별 수량을 유지해요',()=>{
    const state=parseSnapshot({id:a,revision:3,board:demoBoard,members:[{id:a,name:'영',slot:0},{id:b,name:'민',slot:1}],cart:[{menuId:'porri',userId:a,quantity:2},{menuId:'porri',userId:b,quantity:1}]});
    expect(sharedView(state,a).cart).toEqual([{menuId:'porri',person:'me',quantity:2},{menuId:'porri',person:'companion-1',quantity:1}]);
    expect(sharedView(state,b).cart).toEqual([{menuId:'porri',person:'companion-1',quantity:2},{menuId:'porri',person:'me',quantity:1}]);
  });
  it('외부에서 조작한 수량은 화면에 넣지 않아요',()=>{expect(()=>parseSnapshot({id:a,revision:1,board:demoBoard,members:[{id:a,name:'영',slot:0}],cart:[{menuId:'porri',userId:a,quantity:900}]})).toThrow();});
});
