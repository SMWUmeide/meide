import { ActionContent, type ActionProps } from "../_shared/action";
export type ChipProps = Omit<ActionProps, "onClick"> & { selected?: boolean; count?: number; onSelect?: () => void };
export function Chip({ selected = false, count, onSelect, state = "default", disabled, children, className = "", type = "button", ...props }: ChipProps) {
  return <button {...props} type={type} className={`chip t-label-md ${className}`} aria-pressed={selected} data-state={state} disabled={disabled || state === "disabled" || state === "loading"} aria-busy={state === "loading" || undefined} onClick={onSelect}>
    <ActionContent loading={state === "loading"}>{children}{count !== undefined && <> {count}</>}</ActionContent>
  </button>;
}
