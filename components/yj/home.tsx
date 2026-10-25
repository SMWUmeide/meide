"use client";
import { Asset, Avatar, Glass, TabBar } from "./ui";
import { pendingRatings, type Account, type Screen } from "@/lib/yj/view-model";
export function HomeCaptureCard({ onClick }: { onClick: () => void }) {
  return (
    <Glass
      as="button"
      type="button"
      radius={38}
      className="home-capture-card"
      onClick={onClick}
    >
      <Glass radius={32} className="home-camera">
        <Asset name="63e9b.svg" />
      </Glass>
      <strong>메뉴판 찍기</strong>
      <span>찍으면 한국 음식에 빗대어 풀어드려요</span>
    </Glass>
  );
}
export function HomeShortcut({
  title,
  subtitle,
  asset,
  dot,
  onClick,
}: {
  title: string;
  subtitle: string;
  asset: string;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <Glass
      as="button"
      type="button"
      radius={30}
      className="home-shortcut"
      onClick={onClick}
    >
      <Asset name={asset} />
      <strong>{title}</strong>
      <small>{subtitle}</small>
      {dot && <Asset name="114d8.svg" className="shortcut-dot" />}
    </Glass>
  );
}
export default function Home({
  account,
  period,
  onNavigate,
  onTab,
}: {
  account: Account;
  period: string;
  onNavigate: (screen: Screen) => void;
  onTab: (tab: string) => void;
}) {
  const pending = pendingRatings(account.records).length;
  const greetings: Record<string, string> = {
    morning: "오늘 아침,",
    "late-morning": "출출한 오전,",
    lunch: "오늘 점심,",
    evening: "오늘 저녁,",
  };
  return (
    <div className={`home rev2-home ${period}`}>
      <div className="home-gradient" />
      <div className="home-status" aria-hidden="true">
        <span>9:41</span>
        <svg
          width="78"
          height="14"
          viewBox="0 0 78 14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M0 10h3v4H0zm5-3h3v7H5zm5-3h3v10h-3zm5-3h3v13h-3z" />
          <path d="M25 5Q32-2 39 5l-2 2q-5-5-10 0zm4 4q3-3 6 0l-3 4z" />
          <rect
            x="48"
            y="1"
            width="25"
            height="12"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect x="50" y="3" width="21" height="8" rx="1.5" />
          <path d="M75 5h2v4h-2z" />
        </svg>
      </div>
      <div className="home-top">
        <Glass
          as="button"
          type="button"
          radius="chip"
          className="chip location-chip"
          onClick={() => onNavigate("07")}
        >
          <Asset name="7a6b9.svg" />
          {account.destination.country}
        </Glass>
        <button
          className="avatar-stack avatar-link"
          type="button"
          aria-label="함께 여행하는 사람"
          onClick={() => onNavigate("23")}
        >
          <Avatar />
          {account.friends
            .filter((f) => f.active)
            .slice(0, 2)
            .map((friend) => (
              <Avatar key={friend.id} name={friend.initial} kind="companion" />
            ))}
        </button>
      </div>
      <h1>
        {greetings[period] ?? greetings.lunch}
        <br />
        메뉴판만 찍으세요
      </h1>
      <div className="home-main">
        <HomeCaptureCard onClick={() => onNavigate("08")} />
        {(account.recentMenu || pending > 0) && (
          <div className="home-shortcuts">
            {account.recentMenu && (
              <HomeShortcut
                title="방금 본 메뉴판"
                subtitle="Osteria La Solita Zuppa"
                asset="4605e.svg"
                onClick={() => onNavigate("01")}
              />
            )}
            {pending > 0 && (
              <HomeShortcut
                title="평가 안 한 메뉴"
                subtitle={`${pending}개 남았어요`}
                asset="7c802.svg"
                dot
                onClick={() => onNavigate("20")}
              />
            )}
          </div>
        )}
      </div>
      <TabBar onSelect={onTab} />
    </div>
  );
}
