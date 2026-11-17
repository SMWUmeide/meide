import type { ReactNode } from "react";
import { Icon } from "../_shared/Icon";
export function InfoNote({ children, iconSrc }: { children: ReactNode; iconSrc?: string }) {
  return <aside className="info-note t-body-sm">{iconSrc ? <img src={iconSrc} alt="" /> : <Icon name="info" />}<div>{children}</div></aside>;
}
