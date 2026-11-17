/** Menu and cart calculations shared by the native ordering flow. */
export type OrderItem = { id: string; name: string; originalName: string; priceEur: number };
export type OrderLine = { menuId: string; person: string; quantity: number };

export function changeQuantity(cart: OrderLine[], menuId: string, delta: number, person = 'me'): OrderLine[] {
  return cart.map(line => line.menuId === menuId && line.person === person
    ? { ...line, quantity: Math.min(20, Math.max(0, line.quantity + delta)) }
    : line).filter(line => line.quantity > 0);
}

export function totals(cart: OrderLine[], items: OrderItem[], includeTip = false, tipRate = 10) {
  const food = Math.round(cart.reduce((sum, line) => sum + (items.find(item => item.id === line.menuId)?.priceEur ?? 0) * line.quantity, 0) * 100) / 100;
  const tip = includeTip ? Math.round(food * tipRate) / 100 : 0;
  return { food, tip, total: Math.round((food + tip) * 100) / 100, count: cart.reduce((sum, line) => sum + line.quantity, 0) };
}

export function orderText(items: OrderItem[], cart: OrderLine[]) {
  const lines = cart.flatMap(line => {
    const item = items.find(candidate => candidate.id === line.menuId);
    return item ? [{ ...line, item }] : [];
  });
  if (!lines.length) return { korean: '', italian: '' };
  return {
    korean: `${lines.map(({ item, quantity }) => `${item.name} ${quantity}개`).join(', ')} 주세요.`,
    italian: `Vorremmo ordinare ${lines.map(({ item, quantity }) => `${quantity === 1 ? 'una porzione' : `${quantity} porzioni`} di ${item.originalName.toLocaleLowerCase('it')}`).join(' e ')}, per favore.`,
  };
}
