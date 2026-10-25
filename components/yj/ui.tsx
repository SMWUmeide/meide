/* Figma Page 2 primitives — DESIGN-yj.md §12-10. */
/* eslint-disable @next/next/no-img-element */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Asset({
  name,
  alt = "",
  className = "",
}: {
  name: string;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      className={`asset ${className}`}
      src={`/assets/yj/${name}`}
      alt={alt}
      draggable={false}
    />
  );
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
export function PrimaryButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`button primary ${className}`}
      {...props}
    />
  );
}
export function SecondaryButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`button secondary ${className}`}
      {...props}
    />
  );
}
export function DangerButton({ className = "", ...props }: ButtonProps) {
  return (
    <button type="button" className={`button danger ${className}`} {...props} />
  );
}
export function IconButton({
  asset,
  label,
  className = "",
  ...props
}: ButtonProps & { asset: string; label: string }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      {...props}
    >
      <Asset name={asset} />
    </button>
  );
}
export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="topbar">
      {onBack ? (
        <IconButton asset="5097c.svg" label="뒤로 가기" onClick={onBack} />
      ) : (
        <span className="bar-spacer" />
      )}
      <h1>{title}</h1>
      {right ?? <span className="bar-spacer" />}
    </header>
  );
}
const tabs = [
  ["홈", "be265.svg"],
  ["주문 내역", "1e042.svg"],
  ["둘러보기", "f84ba.svg"],
  ["MY", "826a1.svg"],
];
export function TabBar({
  active = "홈",
  onSelect,
}: {
  active?: string;
  onSelect?: (tab: string) => void;
}) {
  return (
    <nav className="tabbar" aria-label="하단 탭">
      {tabs.map(([name, asset]) => (
        <button
          type="button"
          key={name}
          className={active === name ? "active" : ""}
          aria-current={active === name ? "page" : undefined}
          disabled={name !== "홈"}
          title={
            name !== "홈"
              ? "이번 구현 범위에 포함되지 않은 화면이에요"
              : undefined
          }
          onClick={() => onSelect?.(name)}
        >
          <Asset name={asset} />
          <span>{name}</span>
        </button>
      ))}
    </nav>
  );
}
export function Chip({
  selected,
  variant = "default",
  className = "",
  ...props
}: ButtonProps & {
  selected?: boolean;
  variant?: "default" | "allergy" | "custom";
}) {
  return (
    <button
      type="button"
      className={`chip ${variant} ${selected ? "selected" : ""} ${className}`}
      aria-pressed={selected}
      {...props}
    />
  );
}
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      className={`toggle ${checked ? "on" : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function ListRow({
  children,
  leading,
  trailing,
  onClick,
  selected,
  className = "",
}: {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) {
  const content = (
    <>
      {leading}
      <span className="row-content">{children}</span>
      {trailing}
    </>
  );
  return onClick ? (
    <button
      type="button"
      className={`list-row ${selected ? "selected" : ""} ${className}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {content}
    </button>
  ) : (
    <div className={`list-row ${className}`}>{content}</div>
  );
}
export function AIBox({
  title,
  subtitle,
  children,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className={`ai-box ${compact ? "compact" : ""}`}>
      <div className="box-heading">
        <span className="ai-badge">
          <Asset name="3f4f3.svg" />
        </span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}
export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <aside className="info-note">
      <Asset name="29cd8.svg" />
      <div>{children}</div>
    </aside>
  );
}
export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <aside className="warning-banner" role="status">
      {children}
    </aside>
  );
}
export function Avatar({
  name = "나",
  kind = "me",
  size = 30,
}: {
  name?: string;
  kind?: "me" | "companion" | "teal" | "orange";
  size?: number;
}) {
  return (
    <span className={`avatar ${kind}`} style={{ width: size, height: size }}>
      {name.slice(0, 1)}
    </span>
  );
}
export function Companion() {
  return (
    <div className="companion-line">
      <span className="avatar-stack">
        <Avatar />
        <Avatar name="김" kind="companion" />
      </span>
      <p>
        <strong>김미영님</strong>과 함께 고르는 중
      </p>
    </div>
  );
}
export function RatingKorean({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  return (
    <span className="rating">
      <span>★</span> {rating.toFixed(1)} · 한국인 {count}명
    </span>
  );
}
export function Price({
  amount,
  size = "normal",
  inline = false,
  won = true,
}: {
  amount: number;
  size?: "normal" | "small" | "large";
  inline?: boolean;
  won?: boolean;
}) {
  return (
    <span className={`price ${size} ${inline ? "inline" : ""}`}>
      <span>
        <small>EUR </small>
        <span className="price-number">{amount.toFixed(2)}</span>
      </span>
      {won && (
        <span className="won">
          약 {Math.round(amount * 1499).toLocaleString("ko-KR")}원
        </span>
      )}
    </span>
  );
}
export function BottomSheet({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`bottom-sheet ${className}`}>{children}</section>;
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function SplitTalkLayout({
  staff,
  customer,
  onEnd,
}: {
  staff: ReactNode;
  customer: ReactNode;
  onEnd: () => void;
}) {
  return (
    <div className="split-talk">
      <section className="staff-half">{staff}</section>
      <button type="button" className="talk-end" onClick={onEnd}>
        대화 마치기
      </button>
      <section className="customer-half">{customer}</section>
    </div>
  );
}
export function CameraShell({
  title,
  onClose,
  right,
  children,
  dim = false,
  closeRight = false,
}: {
  title: string;
  onClose: () => void;
  right?: ReactNode;
  children: ReactNode;
  dim?: boolean;
  closeRight?: boolean;
}) {
  return (
    <div className={`camera-shell ${dim ? "dim" : ""}`}>
      <header className="camera-header">
        {closeRight ? (
          <span className="bar-spacer" />
        ) : (
          <IconButton asset="d69c2.svg" label="닫기" onClick={onClose} />
        )}
        <h1>{title}</h1>
        {closeRight ? (
          <IconButton asset="d69c2.svg" label="닫기" onClick={onClose} />
        ) : (
          (right ?? <span className="bar-spacer" />)
        )}
      </header>
      {children}
    </div>
  );
}
export function BottomActions({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <footer className={`bottom-actions ${className}`}>{children}</footer>;
}
