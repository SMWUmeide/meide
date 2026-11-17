export const exampleExchangeRate = 1499;
export function krw(eur: number) { return Math.round(eur * exampleExchangeRate).toLocaleString("ko-KR"); }
