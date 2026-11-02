import { ActionContent, type ActionProps } from "../_shared/action";

type Appearance = { variant?: "primary" | "secondary"; size?: "lg" | "pill" } | { variant: "brand"; size: "pill" };
export type ButtonProps = ActionProps & Appearance & { fullWidth?: boolean };
export function Button({ variant = "primary", size = "lg", state = "default", fullWidth = size === "lg", children, className = "", disabled, type = "button", ...props }: ButtonProps) {
  if (variant === "brand" && size !== "pill") throw new Error("brand 버튼은 pill 크기로만 사용해 주세요.");
  return <button {...props} type={type} className={`button t-title-md ${className}`} data-variant={variant} data-size={size} data-full-width={fullWidth} data-state={state} disabled={disabled || state === "disabled" || state === "loading"} aria-busy={state === "loading" || undefined}>
    <ActionContent loading={state === "loading"}>{children}</ActionContent>
  </button>;
}
