import { state as displayState } from "@/lib/yj/view-model";
/* Figma Page 2 primitives — DESIGN-yj.md §12-10. */
/* eslint-disable @next/next/no-img-element */
import sourceAssets from "@/lib/yj/figma-assets.json";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Squircle, Glass } from "./squircle";
export { Squircle, Glass } from "./squircle";

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
      src={
        name.startsWith("/") || name.startsWith("https://")
          ? name
          : `/assets/yj/${name}`
      }
      alt={alt}
      draggable={false}
    />
  );
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "small";
};
export function PrimaryButton({
  className = "",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <Squircle
      as="button"
      radius={size === "small" ? 17.76 : 22}
      type="button"
      className={`button primary ${size === "small" ? "button--small" : ""} ${className}`}
      {...props}
    />
  );
}
export function SecondaryButton({
  className = "",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <Squircle
      as="button"
      radius={size === "small" ? 17.76 : 22}
      type="button"
      className={`button secondary ${size === "small" ? "button--small" : ""} ${className}`}
      {...props}
    />
  );
}
export function DangerButton({
  className = "",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <Squircle
      as="button"
      radius={size === "small" ? 17.76 : 22}
      type="button"
      className={`button danger ${size === "small" ? "button--small" : ""} ${className}`}
      {...props}
    />
  );
}
export function GlassButton({
  className = "",
  size = "small",
  ...props
}: ButtonProps) {
  return (
    <Glass
      as="button"
      type="button"
      radius={size === "small" ? 17.76 : 22}
      className={`button ${size === "small" ? "button--small" : ""} ${className}`}
      {...props}
    />
  );
}
export function ActionCard({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Squircle
      as="button"
      type="button"
      radius={30}
      className={`card ${className}`}
      {...props}
    />
  );
}
export function IconButton({
  asset,
  label,
  className = "",
  glass = false,
  size = "default",
  ...props
}: ButtonProps & { asset: string; label: string; glass?: boolean }) {
  const Tag = glass ? Glass : Squircle;
  return (
    <Tag
      as="button"
      round
      type="button"
      className={`icon-button ${size === "small" ? "icon-button--small" : ""} ${className}`}
      aria-label={label}
      {...props}
    >
      <Asset name={asset} />
    </Tag>
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
    <Glass as="nav" radius={30} className="tabbar" aria-label="하단 탭">
      {tabs.map(([name, asset], index) => (
        <Squircle
          as="button"
          radius={19}
          type="button"
          key={name}
          className={active === name ? "active" : ""}
          aria-current={active === name ? "page" : undefined}
          onClick={() => onSelect?.(name)}
        >
          <Asset
            name={
              active === "홈"
                ? asset
                : (
                    sourceAssets[
                      active === "주문 내역"
                        ? "19"
                        : active === "둘러보기"
                          ? "31"
                          : "28"
                    ] as Record<string, string>
                  )[
                    [
                      "imgIconHome",
                      "imgIconReceipt",
                      "imgIconCompass",
                      "imgIconUser",
                    ][index]
                  ]
            }
          />
          <span>{name}</span>
        </Squircle>
      ))}
    </Glass>
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
    <Squircle
      as="button"
      radius="chip"
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
    <Squircle
      as="button"
      radius="chip"
      className={`toggle ${checked ? "on" : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </Squircle>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Squircle as="section" radius={30} className={`card ${className}`}>
      {children}
    </Squircle>
  );
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
    <Squircle as="aside" radius={22} className="info-note">
      <Asset name="29cd8.svg" />
      <div>{children}</div>
    </Squircle>
  );
}
export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <Squircle as="aside" radius={22} className="warning-banner" role="status">
      {children}
    </Squircle>
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
    <span
      className={`avatar ${kind}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
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
  if (!count) return <span className="rating">아직 평가가 없어요</span>;
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
        <small>{displayState.board.currency} </small>
        <span className="price-number">{amount.toFixed(2)}</span>
      </span>
      {won && displayState.rate.base === displayState.board.currency && (
        <span className="won">
          약{" "}
          {Math.round(amount * displayState.rate.rate).toLocaleString("ko-KR")}
          원
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
  return (
    <Squircle as="section" radius={30} className={`bottom-sheet ${className}`}>
      {children}
    </Squircle>
  );
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
      <Squircle
        as="button"
        type="button"
        radius={17.76}
        className="button button--small talk-end"
        onClick={onEnd}
      >
        대화 마치기
      </Squircle>
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
          <IconButton glass asset="d69c2.svg" label="닫기" onClick={onClose} />
        )}
        <h1>{title}</h1>
        {closeRight ? (
          <IconButton glass asset="d69c2.svg" label="닫기" onClick={onClose} />
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
