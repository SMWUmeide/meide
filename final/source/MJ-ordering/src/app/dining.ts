import type { Dining, MenuBoard } from '@/data/menu-schema';
import { totals, type CartLine } from './cart';
export const defaultDining: Dining = { partySize: null, region: 'UNKNOWN' };
export const regions = { UNKNOWN: '지역을 선택해 주세요', IT: '이탈리아', FR: '프랑스', ES: '스페인', PT: '포르투갈', DE: '독일', AT: '오스트리아', GR: '그리스', OTHER: '그 밖의 지역' } as const;
export function diningTotals(board: MenuBoard, cart: CartLine[], tip: boolean, tipRate: number) {
  const base = totals(cart, tip, board.items, tipRate);
  const charge = board.coverCharge;
  const party = board.dining?.partySize;
  const units = charge?.basis === 'per_table' ? 1 : charge?.basis === 'per_person' && party ? party : 0;
  const cover = base.count && charge?.evidence.trim() && charge.priceEur !== null && charge.priceEur > 0 ? Math.round(charge.priceEur * units * 100) / 100 : 0;
  const water = Math.round(cart.reduce((sum, line) => {
    const item = board.items.find(item => item.id === line.menuId);
    return sum + (item?.kind === 'water' && item.priceEvidence?.trim() ? item.priceEur * line.quantity : 0);
  }, 0) * 100) / 100;
  return { ...base, cover, coverUnits: units, water, total: Math.round((base.total + cover) * 100) / 100 };
}
export function diningNote(board: MenuBoard, cover: number, water: number): string | null {
  if (cover <= 0 && water <= 0) return null;
  const region = board.dining?.region ?? 'UNKNOWN';
  const parts: string[] = [];
  if (cover > 0) parts.push(region === 'IT'
    ? '이탈리아의 coperto는 자리 준비 요금으로, 선택 팁과 구분해요. 메뉴판에 적힌 요금만 반영했어요.'
    : '메뉴판에 적힌 자리 준비 요금을 표시된 부과 단위에 맞춰 반영했어요.');
  if (water > 0) parts.push(region === 'FR'
    ? '프랑스의 식사에 곁들이는 일반 식수와 별도 가격의 물 상품은 구분해요. 담은 유료 물의 수량만 반영했어요.'
    : region === 'IT' ? '이탈리아 메뉴판의 물 상품은 종류와 용량을 확인해 주세요. 담은 물의 수량만 반영했어요.'
    : '물값은 지역 관습으로 추가하지 않고, 메뉴판의 가격과 담은 수량만 반영했어요.');
  if (region === 'PT' && cover > 0) parts.push('포르투갈의 couvert는 빵·올리브 같은 전채를 뜻할 수 있어요. 주문한 전채와 자리 준비 요금은 구분해 확인해 주세요.');
  return parts.join(' ');
}
