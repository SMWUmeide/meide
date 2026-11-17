import { Children, cloneElement, isValidElement, type ReactElement } from "react";
import { personNames, type Person } from "../_shared/action";
export type AvatarProps = { person: Person; initial: string; size?: 34 | 40 };
export function Avatar({ person, initial, size = 34 }: AvatarProps) {
  return <span className="avatar" data-person={person} data-size={size} role="img" aria-label={`${personNames[person]}: ${initial}`}>{Array.from(initial)[0]}</span>;
}
export function AvatarGroup({ size = 34, children }: { size?: 34 | 40; children: ReactElement<AvatarProps> | ReactElement<AvatarProps>[] }) {
  return <div className="avatar-group" role="group" aria-label="함께 고르는 사람들이에요">{Children.map(children, child => isValidElement<AvatarProps>(child) ? cloneElement(child, { size }) : child)}</div>;
}
