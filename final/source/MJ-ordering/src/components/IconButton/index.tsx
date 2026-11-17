import { ActionContent, type ActionProps } from "../_shared/action";
import { Icon, type IconName } from "../_shared/Icon";
export type IconButtonProps = Omit<ActionProps, "children" | "aria-label"> & { icon: Exclude<IconName, "cart" | "info" | "ai">; tone?: "surface" | "neutral" | "glass" | "brand"; label: string; iconSrc?: string };
export function IconButton({ icon, iconSrc, tone = "surface", label, state = "default", disabled, className = "", type = "button", ...props }: IconButtonProps) {
  if (!label.trim()) throw new Error("IconButton의 label을 입력해 주세요.");
  return <button {...props} type={type} aria-label={label} className={`icon-button ${className}`} data-icon={icon} data-tone={tone} data-state={state} disabled={disabled || state === "disabled" || state === "loading"} aria-busy={state === "loading" || undefined}>
    <ActionContent loading={state === "loading"}>{iconSrc ? <img src={iconSrc} alt="" /> : <Icon name={icon} />}</ActionContent>
  </button>;
}
