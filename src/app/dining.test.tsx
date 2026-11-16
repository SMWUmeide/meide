import { describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { diningNote, diningTotals } from './dining';
import { menuBoardSchema } from '@/data/menu-schema';
import { Receipt } from './screens/Receipt';
import recorded from '../../server/fixtures/real-fees.json';
import noFees from '../../server/fixtures/real-no-fees.json';
// Captured real Gemini output from the linked restaurant menus; no provider mocks.
const base = menuBoardSchema.parse(recorded.board);
const board = {...base,dining:{partySize:3,region:'IT' as const}};
const food = board.items[0], water = board.items.find(item=>item.kind==='water')!;
const cart = [{menuId:food.id,person:'me' as const,quantity:1},{menuId:water.id,person:'me' as const,quantity:2}];
describe('실제 분석 결과의 자릿세·물값',()=>{
 it('한 사람이 모두 담아도 선택한 식사 인원으로 계산하고 물값을 중복 가산하지 않아요',()=>{
  expect(diningTotals(board,cart,false,10)).toMatchObject({food:17,cover:4.5,water:3,total:21.5});
  expect(diningTotals({...board,dining:{partySize:2,region:'IT'}},cart,false,10).total).toBe(20);
 });
 it('인원 미선택·빈 장바구니·지역 변경으로 자릿세를 지어내지 않아요',()=>{
  expect(diningTotals({...board,dining:{partySize:null,region:'IT'}},cart,false,10).cover).toBe(0);
  expect(diningTotals(board,[],false,10).cover).toBe(0);
  expect(diningTotals({...board,dining:{partySize:3,region:'FR'}},cart,false,10).total).toBe(21.5);
 });
 it('팁은 메뉴 금액 기준으로 유지하고 자리 준비 요금에 중복 적용하지 않아요',()=>{
  expect(diningTotals(board,cart,true,10)).toMatchObject({tip:1.7,total:23.2});
 });
 it('물 제거 시 물 안내도 사라지고 실제 적용된 요금만 설명해요',()=>{
  const total = diningTotals(board,cart.slice(0,1),false,10);
  expect(total.total).toBe(18.5);
  expect(diningNote(board,total.cover,total.water)).not.toContain('물');
  expect(diningNote(board,0,0)).toBeNull();
 });
 it('영수증에 원문과 3명분 요금을 표시하고 무요금 메뉴에는 안내를 표시하지 않아요',()=>{
  render(<Receipt board={board} cart={cart} tip={false} tipRate={10} go={()=>{}} />);
  expect(screen.getByText('Coperto € 1,50 a persona')).toBeInTheDocument();
  expect(screen.getByRole('complementary')).toHaveTextContent('coperto');
  expect(screen.getByRole('complementary')).toHaveTextContent('물의 수량');
  cleanup();
  const absent = menuBoardSchema.parse(noFees.board);
  render(<Receipt board={{...absent,dining:{partySize:3,region:'IT'}}} cart={[{menuId:absent.items[0].id,person:'me',quantity:1}]} tip={false} tipRate={10} go={()=>{}} />);
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
 });
});
