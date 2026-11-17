import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import colors from '../../MJ/src/features/order/native-colors.json';
import { menuBoardSchema } from '../../MJ/src/features/order/menu-schema';

describe('Android 메뉴 분석 결과', () => {
  const board = {
    source: 'gemini', restaurantName: '식당', skipped: 0,
    categories: [{ id: 'food', name: '메뉴', original: 'Menu' }],
    items: [{ id: 'dish', category: 'food', originalName: 'Pasta', name: '파스타', priceEur: 12,
      photoUrl: null, analogy: '국수와 비슷해요', description: '파스타예요', ingredients: [],
      allergen: '메뉴판에서 확인되지 않았어요', estimated: [], method: '확인해 주세요', possibleAllergen: '직원에게 확인해 주세요' }],
  };
  it('메뉴 이름과 가격이 들어온 결과를 읽어요', () => {
    expect(menuBoardSchema.parse(board).items[0].priceEur).toBe(12);
  });
  it('가격이나 메뉴 분류가 잘못되면 표시하지 않아요', () => {
    expect(menuBoardSchema.safeParse({ ...board, items: [{ ...board.items[0], priceEur: -1 }] }).success).toBe(false);
    expect(menuBoardSchema.safeParse({ ...board, items: [{ ...board.items[0], category: 'missing' }] }).success).toBe(false);
  });
});

it('Android 색상은 공통 디자인 토큰과 일치해요', () => {
  const css = readFileSync('src/styles/tokens.css', 'utf8');
  for (const [name, value] of Object.entries(colors)) expect(css).toContain(`--color-${name}: ${value}`);
});
