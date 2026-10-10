import { useState } from "react";
import { staffPhrase, type Dish, type Person } from "./data";

export type Flag = { kind: "allergy" | "dislike"; key: string; source: string; people: Person[] };

export function getFlags(dish: Dish, party: Person[]): Flag[] {
  const out: Flag[] = [];
  for (const kind of ["allergy", "dislike"] as const) {
    for (const ing of dish.ingredients) {
      if (!ing.key) continue;
      const people = party.filter((p) => (kind === "allergy" ? p.allergies : p.dislikes).includes(ing.key!));
      if (people.length) out.push({ kind, key: ing.key, source: ing.text, people });
    }
  }
  return out; // allergies first
}

const hasJong = (w: string) => {
  const c = w.charCodeAt(w.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};
const eul = (w: string) => w + (hasJong(w) ? "을" : "를");
const who = (f: Flag, party: Person[]) =>
  f.people.length === party.length && party.length > 1 ? "우리 일행 모두" : f.people.map((p) => (p.isMe ? "나" : `${p.name}님`)).join(", ");

export function sentence(f: Flag, party: Person[]) {
  const w = who(f, party);
  const subj = w === "나" ? "나는" : `${w}${w.endsWith("모두") ? "" : "은"}`;
  const first = f.kind === "allergy" ? `${subj} ${f.key} 알레르기가 있어요.` : `${subj} ${eul(f.key)} 못 먹어요.`;
  return `${first} 이 요리는 ${eul(f.source)} 사용해요.`;
}

function Badge({ text, allergy }: { text: string; allergy: boolean }) {
  return (
    <span className={`grid place-items-center h-6 min-w-6 px-1.5 rounded-full font-b text-[11px] leading-none ${allergy ? "bg-[#B3261E] text-white" : "bg-[#5E4A3A] text-white"}`}>{text}</span>
  );
}

export function Chip({ f, party, onClick }: { f: Flag; party: Person[]; onClick: () => void }) {
  const a = f.kind === "allergy";
  const all = f.people.length === party.length && party.length > 1;
  const badges = all ? ["모두"] : f.people.map((p) => (p.isMe ? "나" : p.name[0]));
  return (
    <button onClick={onClick} aria-label={`${a ? "알레르기" : "못 먹음"} ${f.key} ${who(f, party)}`} className="py-2 -my-2">
      <span className={`inline-flex items-center gap-1.5 h-8 pl-1.5 pr-3 rounded-full ${a ? "bg-[#FDECEA] text-[#B3261E] border border-[#F4C7C3]" : "bg-[#F4EEE6] text-[#5E4A3A]"}`}>
        {badges.map((b) => <Badge key={b} text={b} allergy={a} />)}
        <span className="font-r text-[13px]">{a ? "알레르기" : "못 먹음"}</span>
        <span className="font-b text-[15px]">{f.key}</span>
      </span>
    </button>
  );
}

export function DietChips({ flags, party, onPick }: { flags: Flag[]; party: Person[]; onPick: (f: Flag) => void }) {
  const [open, setOpen] = useState(false);
  if (!flags.length) return null;
  const shown = flags.length > 3 && !open ? flags.slice(0, 2) : flags;
  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap gap-2">
        {shown.map((f) => <Chip key={f.kind + f.key} f={f} party={party} onClick={() => onPick(f)} />)}
        {shown.length < flags.length && (
          <button onClick={() => setOpen(true)} className="py-2 -my-2" aria-label="나머지 주의 항목 펼치기">
            <span className="inline-flex items-center h-8 px-3 rounded-full bg-white border border-[#c9c2b7] font-b text-[15px] text-[#5f5a52]">+{flags.length - 2}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function FlagSheet({ f, party, onClose }: { f: Flag; party: Person[]; onClose: () => void }) {
  const [staff, setStaff] = useState(false);
  const a = f.kind === "allergy";
  const phrase = staffPhrase[f.key]?.[f.kind] ?? (a ? `Allergia: ${f.key}` : `Senza ${f.key}, per favore`);
  if (staff)
    return (
      <div className="absolute inset-0 z-40 flex flex-col bg-[#fffefa] text-[#292722]">
        <div className="h-[16px]" />
        <p className="px-5 font-b text-[17px] text-center py-4 border-b border-[#e5dfd5]">직원에게 보여주세요</p>
        <div className="flex-1 px-6 flex flex-col justify-center">
          <p className="font-xb text-[40px] leading-[52px]">{phrase}</p>
          <p className="mt-4 font-r text-[16px] text-[#5f5a52]">{a ? `${f.key} 알레르기가 있어요` : f.key === "내장" ? "내장은 안 먹어요" : `${eul(f.key)} 빼 주세요`}</p>
        </div>
        <div className="px-5 pt-3 pb-[34px] border-t border-[#e5dfd5]">
          <button onClick={onClose} className="w-full min-h-14 rounded-[15px] bg-[#52623a] font-xb text-[18px] text-white">닫기</button>
        </div>
      </div>
    );
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/45" onClick={onClose}>
      <div role="dialog" onClick={(e) => e.stopPropagation()} className="rounded-t-[24px] bg-white px-5 pt-3 pb-[34px] animate-[sheet_0.22s_ease-out]">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#d9d3c9]" />
        <div className="mt-4"><Chip f={f} party={party} onClick={() => {}} /></div>
        <p className="mt-4 font-r text-[18px] leading-[28px] text-[#292722]">{sentence(f, party)}</p>
        {a && <p className="mt-2 font-r text-[15px] text-[#5f5a52]">주문 전에 직원에게 꼭 확인해주세요.</p>}
        <div className="mt-5 grid grid-cols-[1fr_1.6fr] gap-2">
          <button onClick={onClose} className="min-h-14 rounded-[15px] border border-[#c9c2b7] font-b text-[17px] text-[#5f5a52]">닫기</button>
          <button onClick={() => setStaff(true)} className="min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[17px] text-white">직원에게 보여주기</button>
        </div>
      </div>
    </div>
  );
}
