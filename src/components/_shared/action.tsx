import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ActionState = "default" | "pressed" | "focus" | "disabled" | "loading";
export type ActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> & { state?: ActionState };
export function ActionContent({ loading, children }: { loading: boolean; children: ReactNode }) {
  return <><span className={loading ? "action-label is-loading" : "action-label"}>{children}</span>{loading && <span className="loading-dots" aria-hidden="true">•••</span>}</>;
}
export const personNames = { me: "나", "companion-1": "동반인 1", "companion-2": "동반인 2", "companion-3": "동반인 3" };
export type Person = keyof typeof personNames;
