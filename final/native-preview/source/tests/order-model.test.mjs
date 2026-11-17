import test from 'node:test';
import assert from 'node:assert/strict';
import { changeQuantity, orderText, totals } from '../src/features/order/order-model.ts';

const items = [{ id: 'a', name: '수프', originalName: 'ZUPPA', priceEur: 8.5 }, { id: 'b', name: '파스타', originalName: 'PASTA', priceEur: 12 }];
test('계산과 수량 변경은 사람별 메뉴를 유지해요', () => {
  const cart = [{ menuId: 'a', person: 'me', quantity: 2 }, { menuId: 'b', person: 'companion', quantity: 1 }];
  assert.deepEqual(totals(cart, items, true), { food: 29, tip: 2.9, total: 31.9, count: 3 });
  assert.deepEqual(changeQuantity(cart, 'a', -2), [cart[1]]);
  assert.deepEqual(changeQuantity(cart, 'a', 30)[0].quantity, 20);
});
test('주문 문장은 선택한 메뉴의 원어 이름과 수량을 사용해요', () => {
  assert.deepEqual(orderText(items, [{ menuId: 'a', person: 'me', quantity: 2 }]), { korean: '수프 2개 주세요.', italian: 'Vorremmo ordinare 2 porzioni di zuppa, per favore.' });
  assert.deepEqual(orderText(items, []), { korean: '', italian: '' });
});
