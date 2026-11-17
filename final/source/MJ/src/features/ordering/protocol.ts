export const ORDER_CHANNEL = 'meide-orders-v1';
export function isOrderNavigation(url:string) {
  if(url==='about:blank')return true;
  try {const target=new URL(url);return target.origin==='https://localhost'&&target.pathname==='/'&&!target.search&&!target.username&&!target.password;}
  catch{return false;}
}
export type OrderRequest = { channel: typeof ORDER_CHANNEL; id: string; action: string; payload?: unknown };
export const orderStorageKeys = ['meide.order.v1', 'meide.shared-room.v1', 'sb-xtxyobkbxpfyeuiuhbaf-auth-token'] as const;
export function parseOrderMessage(raw: string): OrderRequest | null {
  if (raw.length > 2_000_000) return null;
  try { const value = JSON.parse(raw); return value?.channel === ORDER_CHANNEL && typeof value.id === 'string' && /^\d{1,12}$/.test(value.id) && typeof value.action === 'string' ? value : null; } catch { return null; }
}
export function parseOrderStorage(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('저장할 메뉴를 확인하지 못했어요.');
  const result: Record<string,string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!orderStorageKeys.includes(key as typeof orderStorageKeys[number]) || typeof item !== 'string' || item.length > 1_500_000) throw new Error('저장할 메뉴를 확인하지 못했어요.');
    result[key] = item;
  }
  return result;
}
export type OrderFrameHandle = { send: (message: string) => void };
export type OrderFrameProps = { html: string; onMessage: (message: string) => void };
