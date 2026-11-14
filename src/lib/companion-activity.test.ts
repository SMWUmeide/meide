import { expect,it } from 'vitest';
import { companionActivity } from './companion-activity';
import { demoBoard } from '@/data/mock-menu';
import type { SharedSnapshot } from './shared-order';
const previous:SharedSnapshot={id:'room',revision:1,board:demoBoard,cart:[{menuId:'porri',userId:'other',quantity:1}],members:[{id:'other',name:'미영',slot:1}]};
it('동반인이 추가한 수량만 알리고 최초 로딩·중복·본인·삭제는 건너뛰어요',()=>{
 const next={...previous,revision:2,cart:[{menuId:'porri',userId:'other',quantity:3}]};
 expect(companionActivity(previous,next,'me')?.message).toContain('2개 담았어요');
 expect(companionActivity(null,next,'me')).toBeNull();expect(companionActivity(next,next,'me')).toBeNull();expect(companionActivity(previous,next,'other')).toBeNull();expect(companionActivity(previous,{...next,cart:[]},'me')).toBeNull();
});
