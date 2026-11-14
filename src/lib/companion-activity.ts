import type { SharedSnapshot } from './shared-order';
export function companionActivity(previous: SharedSnapshot | null, next: SharedSnapshot, userId: string) {
  if(!previous || previous.id!==next.id || next.revision<=previous.revision)return null;
  const additions=next.cart.filter(line=>line.userId!==userId).map(line=>({line,delta:line.quantity-(previous.cart.find(old=>old.userId===line.userId && old.menuId===line.menuId)?.quantity??0)})).filter(change=>change.delta>0);
  if(!additions.length)return null;
  const {line,delta}=additions[0];const member=next.members.find(person=>person.id===line.userId);const item=next.board.items.find(item=>item.id===line.menuId);
  if(!member || !item)return null;
  return {id:`${next.id}:${next.revision}`,message:`${member.name}님이 ‘${item.name}’을 ${delta}개 담았어요${additions.length>1?` 외 ${additions.length-1}건`:''}`};
}
