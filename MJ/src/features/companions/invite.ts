export type Companion = { id: string; name: string };
export const isProfileId = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export function parseInvite(raw: string): string {
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(code)) throw new Error('영문과 숫자로 된 8자리 코드를 입력해 주세요.');
  return code;
}
export function addCompanion(current: Companion[], ownId: string, candidate: Companion): Companion[] {
  if (!isProfileId(candidate.id) || typeof candidate.name !== 'string' || !candidate.name.trim() || candidate.name.length > 20) throw new Error('동반인 정보를 확인할 수 없어요.');
  if (candidate.id.toLowerCase() === ownId.toLowerCase()) throw new Error('내 QR 코드예요. 동반인의 QR을 스캔해 주세요.');
  if (current.some(person => person.id === candidate.id.toLowerCase())) throw new Error('이미 추가한 동반인이에요.');
  return [...current, {id:candidate.id.toLowerCase(), name:candidate.name}];
}
