import type { ComponentPropsWithoutRef } from "react";
import { ActionContent, type ActionProps } from "../_shared/action";
type Common = { padding?: "xl" | "none" };
export type CardProps = Common & (({ as?: "section" } & Omit<ComponentPropsWithoutRef<"section">, "style">) | ({ as: "button" } & ActionProps));
export function Card(props: CardProps) {
  if (props.as === "button") {
    const { as: _as, padding = "xl", state = "default", disabled, children, className = "", type = "button", ...rest } = props;
    void _as;
    return <button {...rest} type={type} className={`card card-button ${className}`} data-padding={padding} data-state={state} disabled={disabled || state === "disabled" || state === "loading"} aria-busy={state === "loading" || undefined}><ActionContent loading={state === "loading"}>{children}</ActionContent></button>;
  }
  const { as: _as, padding = "xl", className = "", ...rest } = props;
  void _as;
  return <section {...rest} className={`card ${className}`} data-padding={padding} />;
}
