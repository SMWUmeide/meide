import type { ReactNode } from "react";
import { Icon } from "../_shared/Icon";
export type AICardProps = { kind: "korean-analogy" | "estimated"; title?: string; source: string; children: ReactNode; onConfirm?: () => void; disabled?: boolean; loading?: boolean; iconSrc?: string };
export function AICard({ kind, title, source, children, iconSrc, onConfirm, disabled, loading }: AICardProps) {
  if (!source.trim()) throw new Error("AI 정보의 출처 문구를 입력해 주세요.");
  return <section className="ai-card" data-kind={kind}>
    <header className="ai-heading"><span className="ai-icon" role="img" aria-label="AI">{iconSrc ? <img src={iconSrc} alt="" /> : <Icon name="ai" />}</span><div><h2 className="t-title-md">{title ?? (kind === "korean-analogy" ? "한국 음식으로 치면" : "AI가 추정한 정보")}</h2><p className="ai-source t-body-sm">{source}</p></div></header>
    <div className="ai-content t-body-md">{children}</div>
    {onConfirm && <ConfirmButton onConfirm={onConfirm} disabled={disabled} loading={loading} />}
  </section>;
}
import { ActionContent } from "../_shared/action";
function ConfirmButton({ onConfirm, disabled, loading }: { onConfirm: () => void; disabled?: boolean; loading?: boolean }) {
  return <button type="button" className="ai-confirm t-label-md" onClick={onConfirm} disabled={disabled || loading} aria-busy={loading || undefined}><ActionContent loading={!!loading}>직원에게 확인하는 문장 보기</ActionContent></button>;
}
