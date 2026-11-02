import type { ReactNode } from "react";
import { Icon } from "../_shared/Icon";
export function InfoNote({ children }: { children: ReactNode }) {
  return <aside className="info-note t-body-sm"><Icon name="info" /><div>{children}</div></aside>;
}
