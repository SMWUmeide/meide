import { useState } from "react";
import { Avatar } from "../Avatar";
import { IconButton } from "../IconButton";
import { personNames, type Person } from "../_shared/action";
export type MenuCardProps = { originalName: string; name: string; priceEur: number; priceKrw: number; photoUrl?: string | null; addedBy?: Person | null; onToggle: () => void; onOpen: () => void; addedByName?: string; disabled?: boolean; loading?: boolean; presentation?: "default" | "figma"; allergenLabel?: string; companionLabel?: string; toggleDisabled?: boolean; cutout?: boolean };
export function MenuCard({ originalName, name, priceEur, priceKrw, photoUrl = null, addedBy = null, onToggle, onOpen, addedByName, disabled = false, loading = false, presentation = "default", allergenLabel, companionLabel, toggleDisabled = false, cutout = false }: MenuCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const personName = addedByName || (addedBy ? personNames[addedBy] : "");
  return <article className="menu-card" data-presentation={presentation} data-cutout={cutout} aria-label={name}>
    <div className="menu-photo">
      <button type="button" className="menu-photo-open" onClick={onOpen} disabled={disabled} aria-label={`${name} 상세 보기`}>
        {photoUrl && failedUrl !== photoUrl ? <img src={photoUrl} alt={name} onError={() => setFailedUrl(photoUrl)} /> : <span className="t-body-sm">사진 준비 중</span>}
        {addedBy && presentation === "default" && <span className="menu-overlay" data-person={addedBy} />}
      </button>
      {addedBy && presentation === "default" && <span className="menu-person t-body-sm"><Avatar person={addedBy} initial={personName} />{addedBy === "me" && !addedByName ? "내가 담았어요" : `${personName}님이 담았어요`}</span>}
      {companionLabel && <span className="menu-person t-body-sm">{companionLabel}</span>}
      {allergenLabel && <span className="menu-allergen tiny">{allergenLabel}</span>}
      <IconButton className="menu-toggle" icon={addedBy ? "added" : "add"} iconSrc={presentation === "figma" ? (addedBy ? "/figma/3c370.svg" : "/figma/0ca51.svg") : (addedBy ? "/figma/d7b72.svg" : "/figma/e1322.svg")} tone={addedBy ? "brand" : "surface"} label={`${name} ${addedBy ? "담기 취소" : "담기"}`} disabled={disabled || toggleDisabled} state={loading ? "loading" : "default"} onClick={event => { event.stopPropagation(); onToggle(); }} />
    </div>
    <button type="button" className="menu-details" onClick={onOpen} disabled={disabled}>
      <span className="menu-original t-body-sm">{originalName}</span><span className="menu-name t-body-md">{name}</span>
      <span className="menu-price"><span className="t-body-sm">EUR</span><span className="t-label-md">{priceEur.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
      <span className="menu-conversion t-body-sm">약 {Math.round(priceKrw).toLocaleString("ko-KR")}원</span>
    </button>
  </article>;
}
