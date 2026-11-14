import type { ReactNode } from "react";
import { IconButton } from "@/components/IconButton";
import { krw } from "@/data/mock-menu";
import { useState } from "react";
export function Toolbar({ title, onBack, children }: { title: string; onBack?: () => void; children?: ReactNode }) {
  return <header className="toolbar">{onBack ? <IconButton icon="back" iconSrc="/figma/2fe4a.svg" label="뒤로 가기" onClick={onBack} /> : <span className="toolbar-spacer" />}<h1 className="t-title-md">{title}</h1>{children ?? <span className="toolbar-spacer" />}</header>;
}
export function Price({ eur, large = false }: { eur: number; large?: boolean }) {
  return <div className={`price ${large ? "price-large" : ""}`}><div><span className="t-body-sm muted">EUR</span> <span className={large ? "t-headline-lg" : "t-label-md"}>{eur.toFixed(2)}</span></div><span className="t-body-sm muted">약 {krw(eur)}원</span></div>;
}
export function Photo({ src, name, className = "" }: { src: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return src && failed !== src ? <img className={`dish-photo ${className}`} src={src} alt={`${name} 예시 사진`} onError={() => setFailed(src)} /> : <div className={`photo-placeholder t-body-sm ${className}`}>사진 준비 중</div>;
}
export function Divider({ wide = false, src }: { wide?: boolean; src?: string }) { return <span className="asset-divider" aria-hidden="true"><img src={src ?? (wide ? "/figma/3e16a.svg" : "/figma/146e2.svg")} alt="" /></span>; }
