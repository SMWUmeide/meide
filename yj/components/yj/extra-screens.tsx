"use client";
/* eslint-disable @next/next/no-img-element */
import { api } from "@/lib/yj/services/display";
import { state, refreshViews, setDestinations } from "@/lib/yj/view-model";
import { listen, currentLocation } from "@/lib/yj/services/browser";
import type { KoreanCategory } from "@/lib/yj/model";
import { createLocalId } from "@/lib/yj/id";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Asset,
  ActionCard,
  GlassButton,
  Avatar,
  BottomActions,
  BottomSheet,
  Card,
  Chip,
  DangerButton,
  EmptyState,
  Glass,
  IconButton,
  InfoNote,
  ListRow,
  Price,
  PrimaryButton,
  RatingKorean,
  SecondaryButton,
  SplitTalkLayout,
  Squircle,
  TabBar,
  Toggle,
  TopBar,
  WarningBanner,
} from "./ui";
import { DesignAsset } from "./design-asset";
import {
  destinations,
  makeAccount,
  menuById,
  mockRestaurants,
  nearbyRestaurants,
  orderSentences,
  pendingRatings,
  ranking,
  searchDestinations,
  sharedLines,
  tasteOptions,
  totals,
  type Account,
  type AppView,
  type Draft,
  type Friend,
  type Screen,
  type Taste,
} from "@/lib/yj/view-model";

type Go = (
  screen: Screen,
  options?: Partial<AppView>,
  replace?: boolean,
) => void;
type Props = {
  view: AppView;
  account: Account;
  setAccount: Dispatch<SetStateAction<Account>>;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  go: Go;
  back: () => void;
  onTab: (tab: string) => void;
  speak: (text: string, language?: string) => void;
  notify: (text: string) => void;
  freeze?: boolean;
  talkFailure?: boolean;
};
const chevron = <Asset name="0e164.svg" className="chevron" />;
function Picture({
  name,
  alt = "",
  className = "",
}: {
  name: string;
  alt?: string;
  className?: string;
}) {
  return (
    <Squircle radius={20} className={`small-picture ${className}`}>
      <Asset name={name} alt={alt} />
    </Squircle>
  );
}
function Radio({ on }: { on: boolean }) {
  return (
    <span className={`radio ${on ? "on" : ""}`}>
      {on && <Asset name="295b9.svg" />}
    </span>
  );
}
function InlineTag({
  children,
  kind = "plain",
}: {
  children: ReactNode;
  kind?: "plain" | "blue" | "red";
}) {
  return (
    <Squircle as="span" radius="chip" className={`inline-tag ${kind}`}>
      {children}
    </Squircle>
  );
}
function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-field">
      <Asset name="66acb.svg" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => onChange("")}
        >
          ×
        </button>
      )}
    </label>
  );
}
export function MockMap({
  onMarker,
  selected = "rosa",
  mini = false,
  empty = false,
  visibleIds,
}: {
  onMarker?: (id: string) => void;
  selected?: string;
  mini?: boolean;
  empty?: boolean;
  visibleIds?: string[];
}) {
  return (
    <div
      className={`map-canvas ${mini ? "mini" : ""}`}
      aria-label="주변 식당 위치 개략도"
    >
      <small className="osm-credit">
        © OpenStreetMap · 도보 시간은 직선거리 추정
      </small>
      <div className="map-river" />
      {[280, 430, 520].map((y) => (
        <i key={"h" + y} className="road horizontal" style={{ top: y }} />
      ))}
      {[70, 205, 320].map((x) => (
        <i key={"v" + x} className="road vertical" style={{ left: x }} />
      ))}
      <i className="road diagonal" />
      {[
        [95, 300, 90, 40],
        [230, 300, 70, 50],
        [95, 450, 90, 50],
        [230, 455, 75, 40],
        [10, 300, 45, 110],
        [340, 300, 45, 90],
        [340, 445, 45, 60],
      ].map(([x, y, w, h], i) => (
        <span
          className="map-building"
          style={{ left: x, top: y, width: w, height: h }}
          key={i}
        />
      ))}
      <DesignAsset screen="05-2" name="img500M" className="map-radius" />
      <DesignAsset screen="05-2" name="img" className="map-position" />
      {!empty &&
        (api.fixtureMode()
          ? [
              ["rosa", 163.5, 330],
              ["ponte", 67, 301],
              ["nonna", 92, 481],
            ]
          : mockRestaurants
              .filter((r) => r.id.startsWith("osm:"))
              .map((r) => {
                const origin = state.origin ?? state.account.trip.location;
                return [
                  r.id,
                  Math.max(
                    30,
                    Math.min(
                      330,
                      195 +
                        (r.location.lng - origin.lng) *
                          111000 *
                          Math.cos((origin.lat * Math.PI) / 180) *
                          0.2,
                    ),
                  ),
                  Math.max(
                    200,
                    Math.min(
                      550,
                      380 - (r.location.lat - origin.lat) * 111000 * 0.2,
                    ),
                  ),
                ];
              })
        )
          .filter(([id]) => !visibleIds || visibleIds.includes(String(id)))
          .map(([id, x, y]) => {
            const r = mockRestaurants.find((r) => r.id === id)!;
            return (
              <button
                type="button"
                className={`map-pin ${selected === id ? "selected" : ""}`}
                disabled={mini}
                tabIndex={mini ? -1 : 0}
                key={id}
                style={{ left: Number(x), top: Number(y) }}
                onClick={() => onMarker?.(String(id))}
                aria-label={`${r.name} 마커`}
              >
                <span>
                  <DesignAsset
                    screen="05-2"
                    name={selected === id ? "imgIconBowl" : "imgIconBowl1"}
                  />
                </span>
                <strong>{r.name}</strong>
              </button>
            );
          })}
      <small className="map-attribution">© OpenStreetMap · 개략도</small>
    </div>
  );
}
function RestaurantInfo({
  restaurant,
  signature = true,
}: {
  restaurant: (typeof mockRestaurants)[number];
  signature?: boolean;
}) {
  return (
    <div className="restaurant-item">
      <div className="restaurant-head">
        {restaurant.photo ? (
          <Picture name={restaurant.photo} alt={restaurant.name} />
        ) : (
          <span className="restaurant-photo-placeholder">사진 없음</span>
        )}
        <div>
          <h3>{restaurant.name}</h3>
          <p>
            {restaurant.type} · 도보 {restaurant.walk}분 · {restaurant.distance}
            m
          </p>
          <small
            className={restaurant.hours.startsWith("곧") ? "closing" : "open"}
          >
            ● {restaurant.hours}
          </small>
        </div>
      </div>
      {signature && !!restaurant.signature && (
        <Squircle radius={30} className="surface signature">
          <small>대표 메뉴</small>
          <strong>{restaurant.signature}</strong>
          <p>{restaurant.analogy}</p>
        </Squircle>
      )}
    </div>
  );
}

export default function ExtraScreens(props: Props) {
  const {
    view,
    account,
    setAccount,
    draft,
    setDraft,
    go,
    back,
    onTab,
    speak,
    notify,
    freeze,
    talkFailure,
  } = props;
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("q") ?? ""),
  );
  const [selectedTrip, setSelectedTrip] = useState(
    view.screen === "38"
      ? (searchDestinations(query)[0]?.id ?? account.destination.id)
      : account.destination.id,
  );
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    view.subjectId ?? "rosa",
  );
  const [filter, setFilter] = useState(
    view.screen === "42"
      ? "해산물"
      : view.subjectId === "asian"
        ? "한식·아시안"
        : "국물 요리",
  );
  const [radius, setRadius] = useState("1km");
  const [appliedRadius, setAppliedRadius] = useState("500m");
  const [name, setName] = useState(
    view.screen === "29" ? account.profile.name : "",
  );
  const friend =
    account.friends.find((f) => f.id === view.subjectId) ?? account.friends[0];
  const [taste, setTaste] = useState<Taste>(() =>
    view.screen === "26"
      ? { allergies: [], dislikes: [], likes: [] }
      : view.subjectId === "me"
        ? structuredClone(account.profile.taste)
        : structuredClone(
            friend
              ? {
                  allergies: friend.allergies,
                  dislikes: friend.dislikes,
                  likes: friend.likes,
                }
              : account.profile.taste,
          ),
  );
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qr, setQR] = useState("");
  const [spoken, setSpoken] = useState("탄산수 한 병이랑 빵 조금 더…");
  const [staffText, setStaffText] = useState(
    "Una bottiglia di acqua frizzante, per favore.",
  );
  const [staffKorean, setStaffKorean] = useState("탄산수 한 병 주세요.");
  const [customerText, setCustomerText] = useState(
    "일반 물과 탄산수 중 어떤 걸 드릴까요?",
  );
  const [customerItalian, setCustomerItalian] = useState(
    "Preferisce acqua naturale o frizzante?",
  );
  const dragStart = useRef<number | null>(null);
  const firstRating = useRef<HTMLButtonElement>(null);
  const pending = pendingRatings(account.records);
  const ratingItem = pending[0];
  const ratingMenu = menuById(ratingItem?.menuId ?? "porri");
  const record =
    account.records.find((r) => r.id === view.recordId) ?? account.records[0];
  const sentence = orderSentences(
    view.recordId && record
      ? record.lines
      : draft.lines.length
        ? draft.lines
        : sharedLines,
    view.recordId && record ? record.request : draft.request,
  );
  const restaurant =
    mockRestaurants.find(
      (r) => r.id === (view.subjectId ?? selectedRestaurant),
    ) ?? mockRestaurants[0];
  const inviteUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/companions/${friend?.id ?? "youngsu"}/invite?joined=1`;
  const [manual, setManual] = useState(false),
    [manualText, setManualText] = useState("");
  const [talkDirection, setTalkDirection] = useState<"ko" | "it">("ko");
  const talkDirectionRef = useRef<"ko" | "it">("ko");
  const recognition = useRef<ReturnType<typeof listen>>(undefined);
  const talkRef = useRef({ go, notify });
  useEffect(() => {
    talkRef.current = { go, notify };
  }, [go, notify]);
  const [, redraw] = useState(0);
  const [loadingResults, setLoadingResults] = useState(false);
  async function translate(
    text: string,
    from: "ko" | "it" = talkDirectionRef.current,
  ) {
    setSpoken(text);
    try {
      const r = await api.translateTalk(
        text,
        from,
        from === "ko" ? "it" : "ko",
      );
      if (!r.ok)
        throw Error("번역하지 못했어요. Gemini 키와 연결을 확인해 주세요.");
      if (from === "ko") {
        setStaffText(r.text);
        setStaffKorean(text);
      } else {
        setCustomerText(r.text);
        setCustomerItalian(text);
      }
      talkRef.current.go("16", {}, true);
      setManual(false);
    } catch (e) {
      talkRef.current.notify(
        e instanceof Error ? e.message : "번역하지 못했어요.",
      );
      talkRef.current.go("44", {}, true);
    }
  }
  useEffect(() => {
    if (view.screen !== "45" || freeze) return;
    if (api.fixtureMode()) {
      const timer = setTimeout(() => {
        setStaffKorean("탄산수 한 병이랑 빵 조금 더 주세요.");
        talkRef.current.go(talkFailure ? "44" : "16", {}, true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    const input = listen(
      talkDirectionRef.current === "ko" ? "ko-KR" : "it-IT",
      (text) => void translate(text),
      (message) => {
        setManual(true);
        talkRef.current.notify(message);
      },
    );
    recognition.current = input;
    if (!input) setManual(true);
    return () => {
      input?.abort();
      recognition.current = undefined;
    };
    // Recognition lives for one screen visit; callbacks use refs.
  }, [view.screen, freeze, talkFailure]);
  useEffect(() => {
    if (
      !["07", "38", "43"].includes(view.screen) ||
      !query.trim() ||
      api.fixtureMode()
    )
      return;
    let active = true;
    const timer = setTimeout(() => {
      setLoadingResults(true);
      void api
        .searchDestinations(query)
        .then((rows) => {
          if (active) {
            setDestinations(rows);
            redraw((v) => v + 1);
          }
        })
        .catch((e) => {
          if (active)
            talkRef.current.notify(
              e instanceof Error ? e.message : "도시를 찾지 못했어요.",
            );
        })
        .finally(() => {
          if (active) setLoadingResults(false);
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, view.screen]);
  useEffect(() => {
    if (
      !["31", "05-2", "05-3", "42", "32"].includes(view.screen) ||
      api.fixtureMode()
    )
      return;
    let active = true;
    queueMicrotask(() => {
      if (active) setLoadingResults(true);
    });
    void currentLocation(state.account.trip.location)
      .then(({ location }) => {
        state.origin = location;
        return api.nearbyRestaurants(
          location,
          appliedRadius === "500m"
            ? 500
            : appliedRadius === "1km"
              ? 1000
              : 3000,
          ([
            "국물 요리",
            "밥·죽",
            "면 요리",
            "고기 구이",
            "해산물",
            "빵·피자",
          ].includes(filter)
            ? filter
            : undefined) as KoreanCategory | undefined,
        );
      })
      .then((rows) => {
        if (!active) return;
        state.account.restaurants = [
          ...rows,
          ...state.account.restaurants.filter(
            (r) => !rows.some((x) => x.id === r.id),
          ),
        ];
        refreshViews();
        redraw((v) => v + 1);
      })
      .catch((e) => {
        if (active) {
          talkRef.current.notify(
            e instanceof Error ? e.message : "근처 식당을 불러오지 못했어요.",
          );
          if (["05-2", "05-3"].includes(view.screen))
            talkRef.current.go("42", {}, true);
        }
      })
      .finally(() => {
        if (active) setLoadingResults(false);
      });
    return () => {
      active = false;
    };
  }, [view.screen, filter, appliedRadius]);
  useEffect(() => {
    if (!["31", "33"].includes(view.screen) || api.fixtureMode()) return;
    let active = true;
    void api
      .koreanRanking(state.account.trip.city)
      .then((rows) => {
        if (active) {
          state.rankings = rows;
          refreshViews();
          redraw((v) => v + 1);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [view.screen]);
  useEffect(() => {
    if (!showQR) return;
    let active = true;
    void import("qrcode")
      .then((q) => q.toDataURL(inviteUrl, { width: 220, margin: 2 }))
      .then((url) => {
        if (active) setQR(url);
      })
      .catch(() => notify("QR 코드를 만들지 못했어요. 링크를 복사해 주세요."));
    return () => {
      active = false;
    };
  }, [showQR, inviteUrl, notify]);
  useEffect(() => {
    if (view.screen !== "33" || view.menuId === "zucca") return;
    const frame = requestAnimationFrame(() => {
      document
        .querySelector(`.rank-entry-${view.menuId}`)
        ?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [view.screen, view.menuId]);
  function shell(
    title: string,
    body: ReactNode,
    footer?: ReactNode,
    tab?: string,
    extra = "",
  ) {
    return (
      <div
        className={`screen extra-screen ${tab ? "tab-screen" : ""} ${extra}`}
      >
        <TopBar title={title} onBack={tab ? undefined : back} />
        <div className="screen-content">{body}</div>
        {footer && <BottomActions>{footer}</BottomActions>}
        {tab && <TabBar active={tab} onSelect={onTab} />}
      </div>
    );
  }
  async function copy(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement("textarea");
        field.value = text;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        if (!document.execCommand("copy")) throw new Error();
        field.remove();
      }
      notify("복사했어요.");
    } catch {
      notify(`복사하지 못했어요. ${text}`);
    }
  }
  function setTrip(id: string) {
    const trip = destinations.find((d) => d.id === id);
    if (trip) setAccount((a) => ({ ...a, destination: trip }));
    go("home");
  }
  function chooseRating(value: string) {
    if (!ratingItem) {
      go("19");
      return;
    }
    const remaining = pending.length - 1;
    setAccount((a) => ({
      ...a,
      records: a.records.map((r) =>
        r.id === ratingItem.recordId
          ? { ...r, ratings: { ...r.ratings, [ratingItem.menuId]: value } }
          : r,
      ),
    }));
    if (!remaining) go("19");
    else firstRating.current?.focus();
  }
  function toggleTaste(group: keyof Taste, value: string) {
    setTaste((t) => ({
      ...t,
      [group]: t[group].includes(value)
        ? t[group].filter((x) => x !== value)
        : [...t[group], value],
    }));
  }
  function tasteFields() {
    return (
      <>
        {(["allergies", "dislikes", "likes"] as const).map((group) => (
          <div className="taste-group" key={group}>
            <h2>
              {group === "allergies"
                ? "알레르기 · EU 표기 기준"
                : group === "dislikes"
                  ? "못 먹거나 싫어해요"
                  : "좋아하는 맛"}
            </h2>
            <div className="taste-chips">
              {[...new Set([...tasteOptions[group], ...taste[group]])].map(
                (value) => (
                  <Chip
                    key={value}
                    variant={group === "allergies" ? "allergy" : "default"}
                    selected={taste[group].includes(value)}
                    onClick={() => toggleTaste(group, value)}
                  >
                    {taste[group].includes(value) && (
                      <DesignAsset
                        screen="25"
                        name={group === "allergies" ? "imgFrame" : "imgFrame1"}
                        className="chip-check"
                      />
                    )}
                    {value}
                  </Chip>
                ),
              )}
              {group === "dislikes" && (
                <Chip variant="custom" onClick={() => setShowCustom((v) => !v)}>
                  + 직접 입력
                </Chip>
              )}
            </div>
            {group === "dislikes" && showCustom && (
              <form
                className="custom-taste"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (custom.trim()) {
                    toggleTaste("dislikes", custom.trim());
                    setCustom("");
                    setShowCustom(false);
                  }
                }}
              >
                <input
                  aria-label="직접 입력할 음식"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  maxLength={20}
                />
                <SecondaryButton
                  size="small"
                  type="submit"
                  disabled={!custom.trim()}
                >
                  추가
                </SecondaryButton>
              </form>
            )}
          </div>
        ))}
      </>
    );
  }
  function friendTags(f: Taste) {
    return (
      <div className="tag-list">
        {f.allergies.map((a) => (
          <InlineTag key={a} kind="red">
            {a} 알레르기
          </InlineTag>
        ))}
        {f.dislikes.map((d) => (
          <InlineTag key={d}>{d} 못 먹어요</InlineTag>
        ))}
        {f.likes.map((l) => (
          <InlineTag key={l} kind="blue">
            {l}
          </InlineTag>
        ))}
      </div>
    );
  }

  switch (view.screen) {
    case "07":
    case "38":
    case "43": {
      const results = searchDestinations(query);
      const state = query ? (results.length ? "38" : "43") : "07";
      const selected =
        destinations.find((d) => d.id === selectedTrip) ?? account.destination;
      const field = (
        <SearchField
          value={query}
          onChange={(v) => {
            setQuery(v);
            const target = v
              ? searchDestinations(v).length
                ? "38"
                : "43"
              : "07";
            go(target, {}, true);
            const url = new URL(window.location.href);
            if (v) url.searchParams.set("q", v);
            else url.searchParams.delete("q");
            window.history.replaceState(window.history.state, "", url);
          }}
          placeholder="나라나 도시 이름으로 찾기"
        />
      );
      return shell(
        state === "07" ? "어디로 떠나시나요?" : "여행지 선택",
        <div className="stack trip-content">
          {field}
          {loadingResults && <p role="status">불러오는 중이에요…</p>}
          {state === "07" ? (
            <>
              <h2 className="eyebrow">지금 여행 중</h2>
              <ActionCard
                className="current-trip"
                onClick={() => setSelectedTrip(account.destination.id)}
              >
                <span className="pin-badge">
                  <DesignAsset screen="07" name="imgFrame1" />
                </span>
                <span>
                  <small>{account.destination.country}</small>
                  <strong>{account.destination.city}</strong>
                </span>
                <Radio on={selectedTrip === account.destination.id} />
              </ActionCard>
              <h2 className="eyebrow">많이 찾는 여행지</h2>
              <Card className="flush">
                {destinations.slice(1, 5).map((d) => (
                  <ListRow
                    key={d.id}
                    onClick={() => setSelectedTrip(d.id)}
                    trailing={<Radio on={selectedTrip === d.id} />}
                  >
                    <small>{d.country}</small>
                    <strong>{d.city}</strong>
                  </ListRow>
                ))}
              </Card>
            </>
          ) : state === "38" ? (
            <>
              <p className="eyebrow">
                ‘{query}’ 검색 결과 {results.length}곳
              </p>
              <Card className="flush">
                {results.map((d) => (
                  <ListRow
                    key={d.id}
                    selected={selectedTrip === d.id}
                    onClick={() => setSelectedTrip(d.id)}
                    trailing={<Radio on={selectedTrip === d.id} />}
                  >
                    <small>{d.country}</small>
                    <strong>{d.city}</strong>
                    <small>{d.detail}</small>
                  </ListRow>
                ))}
              </Card>
              <p className="source-note">도시 정보 · GeoNames (목업)</p>
            </>
          ) : (
            <>
              <div className="trip-empty">
                <DesignAsset screen="43" name="imgFrame2" />
                <h2>‘{query}’와 딱 맞는 곳이 없어요</h2>
                <p>도시 이름을 짧게 쓰거나 나라 이름으로 찾아보세요</p>
              </div>
              <h2 className="eyebrow">혹시 이곳인가요?</h2>
              <Card className="flush">
                {[destinations[7], destinations[2]].map((d) => (
                  <ListRow
                    key={d.id}
                    onClick={() => setTrip(d.id)}
                    trailing={chevron}
                  >
                    <small>{d.country}</small>
                    <strong>{d.city}</strong>
                  </ListRow>
                ))}
              </Card>
            </>
          )}
        </div>,
        state !== "43" ? (
          <PrimaryButton onClick={() => setTrip(selected.id)}>
            {state === "07"
              ? `${selected.city}로 설정하기`
              : `${selected.country} · ${selected.city}로 설정`}
          </PrimaryButton>
        ) : undefined,
      );
    }
    case "15":
      return shell(
        "실시간 대화",
        <div className="stack">
          <Card className="talk-intro-sentence">
            <h2>아까 만든 주문 문장</h2>
            <p>{sentence.korean}</p>
            <p lang="it">{sentence.italian}</p>
          </Card>
          <Card className="talk-how">
            {[
              "주문 문장을 먼저 보여주고",
              "휴대폰을 테이블 위에 놓으면",
              "직원과 마주 보고 대화할 수 있어요",
            ].map((text, i) => (
              <div key={text}>
                <span>{i + 1}</span>
                <p>{text}</p>
              </div>
            ))}
          </Card>
        </div>,
        <>
          <PrimaryButton
            onClick={() =>
              go("17", { largeFrom: "16", talkFrom: view.talkFrom ?? "03" })
            }
          >
            주문 문장 먼저 보여주기
          </PrimaryButton>
          <SecondaryButton onClick={() => go("16")}>
            바로 대화하기
          </SecondaryButton>
        </>,
      );
    case "16":
    case "45":
    case "44": {
      const listening = view.screen === "45",
        failed = view.screen === "44";
      const topItalian = listening
        ? "Il cliente sta parlando…"
        : failed
          ? "Un momento, per favore."
          : staffText;
      return (
        <SplitTalkLayout
          onEnd={() => go(view.talkFrom ?? "03")}
          staff={
            <div className="talk-half-content">
              <div className="talk-language">
                <span>CAMERIERE · ITALIANO</span>
                <IconButton
                  asset="c6eaf.svg"
                  label="직원 문장 들려주기"
                  className="tint"
                  onClick={() => speak(topItalian)}
                />
              </div>
              <p className="staff-italian" lang="it">
                {topItalian}
              </p>
              <p className="talk-subtitle">
                {listening
                  ? "손님이 말하는 중이에요"
                  : failed
                    ? "잠시만 기다려 주세요 · 번역 연결 중"
                    : staffKorean}
              </p>
              {!listening && !failed && (
                <SecondaryButton
                  size="small"
                  type="button"
                  className="staff-mic"
                  onClick={() => {
                    talkDirectionRef.current = "it";
                    setTalkDirection("it");
                    setManualText("");
                    go("45");
                  }}
                >
                  <DesignAsset screen="16" name="imgFrame1" />
                  Tocca per parlare
                </SecondaryButton>
              )}
            </div>
          }
          customer={
            <div className="talk-half-content customer-content">
              {failed && (
                <WarningBanner>
                  <DesignAsset screen="44" name="imgFrame1" />
                  연결이 약해 아직 번역하지 못했어요
                </WarningBanner>
              )}
              <div className="talk-language">
                <span>
                  {listening
                    ? "듣고 있어요"
                    : failed
                      ? "내가 한 말"
                      : "직원이 말했어요"}
                </span>
                {!listening && !failed && (
                  <IconButton
                    asset="c6eaf.svg"
                    label="직원 말 한국어로 들려주기"
                    className="tint"
                    onClick={() => speak(customerText, "ko-KR")}
                  />
                )}
              </div>
              <p className="customer-korean">
                {listening ? spoken : failed ? spoken : customerText}
              </p>
              <p className="talk-subtitle">
                {listening
                  ? "말이 끝나면 이탈리아어로 바꿔 직원 쪽에 보여드려요"
                  : failed
                    ? "입력한 말은 그대로 있어요"
                    : customerItalian}
              </p>
              {failed ? (
                <div className="talk-failure-actions">
                  <PrimaryButton
                    size="small"
                    onClick={() => {
                      void translate(spoken);
                    }}
                  >
                    다시 번역하기
                  </PrimaryButton>
                  <SecondaryButton
                    size="small"
                    onClick={() => go("17", { largeFrom: "16" })}
                  >
                    주문 문장 보여주기
                  </SecondaryButton>
                </div>
              ) : (
                !listening && (
                  <div className="quick-replies">
                    {[
                      [
                        "탄산수요",
                        "Una bottiglia di acqua frizzante, per favore.",
                      ],
                      ["그냥 물이요", "Acqua naturale, per favore."],
                      ["물은 괜찮아요", "Niente acqua, grazie."],
                    ].map(([ko, it]) => (
                      <Chip
                        key={ko}
                        onClick={() => {
                          if (api.fixtureMode()) {
                            setStaffText(it);
                            setStaffKorean(ko);
                          } else void translate(ko, "ko");
                        }}
                      >
                        {ko}
                      </Chip>
                    ))}
                  </div>
                )
              )}
              {listening && manual && (
                <label className="manual-talk">
                  {talkDirection === "ko" ? "직접 입력" : "Scrivi qui"}
                  <textarea
                    aria-label="대화 직접 입력"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  />
                  <SecondaryButton
                    size="small"
                    disabled={!manualText.trim()}
                    onClick={() => void translate(manualText)}
                  >
                    번역하기
                  </SecondaryButton>
                </label>
              )}
              {listening && (
                <div className="talk-wave" aria-hidden="true">
                  {[8, 18, 28, 14, 32, 22, 12, 26, 16, 8].map((h, i) => (
                    <i style={{ height: h }} key={i} />
                  ))}
                </div>
              )}
              <div
                className={`my-mic-wrap ${listening ? "listening" : ""} ${failed ? "failed" : ""}`}
              >
                {listening && (
                  <>
                    <DesignAsset
                      screen="45"
                      name="imgPulse"
                      className="pulse-outer"
                    />
                    <DesignAsset
                      screen="45"
                      name="imgPulse1"
                      className="pulse-inner"
                    />
                  </>
                )}
                <button
                  type="button"
                  className="my-mic"
                  aria-label={listening ? "말하기 마치기" : "한국어로 말하기"}
                  disabled={failed}
                  onClick={() => {
                    if (listening) {
                      if (manual) void translate(manualText || spoken);
                      else recognition.current?.stop();
                    } else {
                      talkDirectionRef.current = "ko";
                      setTalkDirection("ko");
                      setManual(false);
                      setManualText("");
                      setSpoken("말씀해 주세요…");
                      go("45");
                    }
                  }}
                >
                  <DesignAsset screen="16" name="imgFrame2" />
                </button>
                <p>
                  {listening
                    ? "다 말했으면 한 번 더 눌러주세요"
                    : failed
                      ? "연결되면 다시 말할 수 있어요"
                      : "눌러서 한국어로 말하기"}
                </p>
              </div>
            </div>
          }
        />
      );
    }
    case "19":
    case "21": {
      if (!account.records.length)
        return shell(
          "주문 내역",
          <div className="history-empty">
            <EmptyState title="아직 기록이 없어요">
              메뉴판을 찍고 주문 문장을 만들면
              <br />
              여기에 여행의 맛이 차곡차곡 쌓여요.
            </EmptyState>
            <PrimaryButton onClick={() => go("08")}>
              메뉴판 찍으러 가기
            </PrimaryButton>
          </div>,
          undefined,
          "주문 내역",
        );
      const first = account.records[0];
      const rest = account.records.slice(1);
      const total = totals(first.lines, first.tip);
      return shell(
        "주문 내역",
        <div className="stack history-content">
          {pending.length > 0 && (
            <Card className="pending-card">
              <div>
                <h2>오늘의 한 끼는 어땠나요?</h2>
                <p>평가가 남은 메뉴 {pending.length}개</p>
              </div>
              <Chip
                className="tinted-chip"
                onClick={() => go("20", { returnTo: "19" })}
              >
                평가하기
              </Chip>
            </Card>
          )}
          <h2 className="eyebrow">2026.10.25 일요일</h2>
          <Card className="meal-record">
            <div className="meal-photos">
              {first.lines.slice(0, 2).map((line, i) => (
                <Asset
                  key={i}
                  name={menuById(line.menuId).photo ?? "6415e.png"}
                />
              ))}
              <span>+{Math.max(0, first.lines.length - 2)}</span>
            </div>
            <h2>{first.restaurant}</h2>
            <p>키우시 · 김미영님과 2명 · 수프 2, 메인 1</p>
            <div className="record-total">
              <span>예상 합계</span>
              <Price amount={total.receipt} won={false} />
            </div>
            <div className="button-pair">
              <SecondaryButton
                onClick={() =>
                  go("17", { recordId: first.id, largeFrom: "19" })
                }
              >
                주문 문장
              </SecondaryButton>
              <SecondaryButton onClick={() => go("04", { recordId: first.id })}>
                영수증
              </SecondaryButton>
            </div>
          </Card>
          {rest.map((r) => (
            <div className="stack" key={r.id}>
              <h2 className="eyebrow">2026.10.24 토요일</h2>
              <Card className="flush">
                <ListRow
                  leading={<Picture name="fb60b.png" />}
                  onClick={() => go("04", { recordId: r.id })}
                  trailing={chevron}
                >
                  <strong>{r.restaurant}</strong>
                  <small>
                    피렌체 · 2명 · EUR{" "}
                    {totals(r.lines, r.tip).receipt.toFixed(2)}
                  </small>
                </ListRow>
              </Card>
            </div>
          ))}
        </div>,
        undefined,
        "주문 내역",
      );
    }
    case "20":
      return shell(
        "오늘의 맛 기록",
        ratingItem ? (
          <div className="stack rate-content">
            <div className="rating-progress">
              {Array.from({ length: Math.max(3, pending.length) }, (_, i) => (
                <span className={i === 0 ? "active" : ""} key={i} />
              ))}
            </div>
            <h2 className="light-heading">
              {ratingMenu.korean}, 입맛에 맞으셨어요?
            </h2>
            <Squircle radius={30} className="rating-photo">
              <Asset name={ratingMenu.photo ?? "6415e.png"} />
            </Squircle>
            {["또 먹고 싶어요", "한 번이면 충분해요", "입맛에 안 맞았어요"].map(
              (label, i) => (
                <ActionCard
                  className={`rating-option ${i === 0 ? "recommended" : ""}`}
                  key={label}
                  onClick={() => chooseRating(label)}
                >
                  <DesignAsset
                    screen="20"
                    name={
                      i === 0 ? "imgFrame" : i === 1 ? "imgFrame1" : "imgFrame2"
                    }
                  />
                  <span>
                    <strong>{label}</strong>
                    {i === 0 && <small>내 맛 기록에 저장돼요</small>}
                  </span>
                </ActionCard>
              ),
            )}
          </div>
        ) : (
          <EmptyState title="평가를 모두 남겼어요">
            여행의 맛을 기록해 주셔서 고마워요.
          </EmptyState>
        ),
        <SecondaryButton onClick={() => go(view.returnTo ?? "19")}>
          나중에 할게요
        </SecondaryButton>,
      );
    case "31":
      return shell(
        "둘러보기",
        <div className="stack explore-content">
          <div className="section-title">
            <h2>한국인 입맛 저격 랭킹</h2>
            <button type="button" onClick={() => go("33")}>
              전체 보기
            </button>
          </div>
          <div className="ranking-strip">
            {ranking.slice(0, 3).map((r, i) => {
              const m = menuById(r.menuId);
              return (
                <ActionCard
                  className="rank-mini flush"
                  key={r.menuId}
                  onClick={() => go("33", { menuId: r.menuId })}
                >
                  <div className="rank-photo">
                    <Asset name={m.photo!} />
                    <span>{i + 1}</span>
                  </div>
                  <div>
                    <h3>{m.korean}</h3>
                    <p>{r.short}</p>
                    <small>{r.percent}% 또 먹고 싶어요</small>
                  </div>
                </ActionCard>
              );
            })}
          </div>
          <div className="section-title">
            <h2>입맛이 그리울 때</h2>
            <button
              type="button"
              onClick={() => go("05-3", { subjectId: "asian" })}
            >
              전체 보기
            </button>
          </div>
          <p className="muted">가까운 한식당 · 아시안 식당 · 아시안 마켓</p>
          <Card className="flush">
            {mockRestaurants
              .filter((r) => ["asian", "korean", "market"].includes(r.kind))
              .map((r, i) => (
                <ListRow
                  key={r.id}
                  leading={
                    <span className="asian-icon">
                      <DesignAsset
                        screen="31"
                        name={
                          i === 0
                            ? "imgFrame"
                            : i === 1
                              ? "imgFrame3"
                              : "imgFrame4"
                        }
                      />
                    </span>
                  }
                  onClick={() => go("32", { subjectId: r.id })}
                  trailing={chevron}
                >
                  <span className="restaurant-label">
                    <InlineTag>{r.type}</InlineTag>
                    <strong>{r.name}</strong>
                  </span>
                  <small>
                    {r.signature} · {i === 0 ? "차로 45분" : `도보 ${r.walk}분`}
                  </small>
                  {r.rating > 0 && (
                    <RatingKorean rating={r.rating} count={r.count} />
                  )}
                </ListRow>
              ))}
          </Card>
          <div className="section-title">
            <h2>지금 근처 식당</h2>
          </div>
          <Card className="flush">
            <div className="map-preview">
              <MockMap mini />
              <GlassButton
                type="button"
                className="map-enlarge"
                onClick={() => go("05-2")}
              >
                <DesignAsset screen="31" name="imgFrame5" />
                지도로 크게 보기
              </GlassButton>
            </div>
            {mockRestaurants.slice(0, 2).map((r) => (
              <ListRow
                key={r.id}
                leading={<Picture name={r.photo} />}
                trailing={chevron}
                onClick={() => go("32", { subjectId: r.id })}
              >
                <strong>{r.name}</strong>
                <small>
                  {r.type} · 도보 {r.walk}분
                </small>
                <RatingKorean rating={r.rating} count={r.count} />
              </ListRow>
            ))}
          </Card>
        </div>,
        undefined,
        "둘러보기",
      );
    case "33": {
      const entries = ranking.filter(
        (r) =>
          filter === "수프" ||
          filter === "전체" ||
          filter === "국물 요리" ||
          menuById(r.menuId).category === filter,
      );
      const top = entries[0];
      const m = menuById(top?.menuId ?? "zucca");
      return shell(
        "한국인 입맛 저격 랭킹",
        <div className="stack">
          <p className="muted">
            토스카나에서 한국인이 또 먹고 싶다고 한 메뉴예요
          </p>
          <div className="scroll-chips">
            {["전체", "수프", "메인", "디저트"].map((c) => (
              <Chip
                key={c}
                selected={
                  filter === c || (filter === "국물 요리" && c === "전체")
                }
                onClick={() => setFilter(c)}
              >
                {c}
              </Chip>
            ))}
          </div>
          {top ? (
            <>
              <Card className="flush rank-top">
                <div className="rank-photo">
                  <Asset name={m.photo!} />
                  <span>1위</span>
                </div>
                <div className="rank-body">
                  <small>{m.original}</small>
                  <h2>{m.korean}</h2>
                  <div className="rank-ai">
                    <DesignAsset screen="33" name="imgFrame" />
                    {m.analogy}
                  </div>
                  <div className="tag-list">
                    <InlineTag kind="blue">
                      {top.percent}% 또 먹고 싶어요
                    </InlineTag>
                    <InlineTag>한국인 {top.count}명 평가</InlineTag>
                  </div>
                </div>
              </Card>
              <Card className="flush">
                {entries.slice(1).map((r, i) => (
                  <ListRow
                    className={`rank-entry-${r.menuId}`}
                    key={r.menuId}
                    leading={
                      <>
                        <strong className="rank-number">{i + 2}</strong>
                        <Picture name={menuById(r.menuId).photo!} />
                      </>
                    }
                  >
                    <strong>{menuById(r.menuId).korean}</strong>
                    <small className="ai-text">{r.short}</small>
                    <small>{r.percent}% 또 먹고 싶어요</small>
                  </ListRow>
                ))}
              </Card>
            </>
          ) : (
            <EmptyState title="아직 평가가 모이지 않았어요">
              다른 종류의 메뉴를 살펴보세요.
            </EmptyState>
          )}
        </div>,
      );
    }
    case "05-2":
    case "05-3":
    case "42": {
      const list = nearbyRestaurants(filter, query);
      const empty = view.screen === "42" || !list.length;
      // API results replace nearby fixtures in normal browsing.
      const expanded = view.screen === "05-3";
      const selected =
        list.find((r) => r.id === selectedRestaurant) ??
        list[0] ??
        mockRestaurants[0];
      return (
        <div className={`screen nearby-screen ${expanded ? "expanded" : ""}`}>
          <MockMap
            selected={selectedRestaurant}
            onMarker={setSelectedRestaurant}
            empty={empty}
            visibleIds={list.map((r) => r.id)}
          />
          <div className="map-top-panel">
            <TopBar title="근처 식당 찾기" onBack={back} />
            <h2>어떤 음식이 당기세요?</h2>
            <div className="scroll-chips">
              {[
                "검색",
                ...(empty
                  ? ["해산물", "국물 요리", "밥·죽", "면 요리"]
                  : [
                      "국물 요리",
                      "밥·죽",
                      "면 요리",
                      "고기 구이",
                      "해산물",
                      "빵·피자",
                    ]),
              ].map((c) => (
                <Chip
                  key={c}
                  selected={c === filter}
                  onClick={() => {
                    if (c === "검색") {
                      setFilter("검색");
                      return;
                    }
                    setFilter(c);
                    setQuery("");
                    if (c === "해산물") go("42", {}, true);
                    else if (view.screen === "42") go("05-2", {}, true);
                  }}
                >
                  {c === "검색" && <Asset name="66acb.svg" />}
                  {c}
                </Chip>
              ))}
            </div>
            {filter === "검색" && (
              <SearchField
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  const next = nearbyRestaurants("검색", value).length
                    ? "05-2"
                    : "42";
                  if (view.screen !== next) go(next, {}, true);
                }}
                placeholder="식당 이름으로 찾기"
              />
            )}
          </div>
          {!expanded && !empty && (
            <Glass radius="chip" className="chip radius-chip">
              반경 {appliedRadius} · <b>{list.length}곳</b> ▾
            </Glass>
          )}
          {!expanded && !empty && (
            <Glass
              as="button"
              type="button"
              round
              className="current-location"
              aria-label="현재 위치"
              onClick={() => setSelectedRestaurant("rosa")}
            >
              <DesignAsset screen="05-2" name="img1" />
            </Glass>
          )}
          <BottomSheet
            className={`restaurant-sheet ${empty ? "empty-result" : ""}`}
          >
            <button
              type="button"
              className="sheet-handle"
              aria-label="식당 목록 펼치기"
              onClick={() => {
                if (!empty) go("05-3");
              }}
              onPointerDown={(e) => {
                dragStart.current = e.clientY;
              }}
              onPointerUp={(e) => {
                if (
                  dragStart.current !== null &&
                  dragStart.current - e.clientY > 20 &&
                  !empty
                )
                  go("05-3");
                dragStart.current = null;
              }}
            />
            {empty ? (
              <>
                <span className="no-results-icon">
                  <DesignAsset screen="42" name="imgFrame" />
                </span>
                <h2>
                  반경 500m 안에{" "}
                  {filter === "검색"
                    ? `‘${query}’`
                    : filter === "해산물"
                      ? "해산물"
                      : filter}{" "}
                  식당이 없어요
                </h2>
                <p>조금 더 넓혀서 찾아볼까요?</p>
                <div className="radius-options">
                  {["500m", "1km", "2km"].map((r) => (
                    <Chip
                      key={r}
                      selected={radius === r}
                      onClick={() => {
                        setRadius(r);
                        setAppliedRadius(r);
                        setFilter("국물 요리");
                        setQuery("");
                        go("05-2", {}, true);
                      }}
                    >
                      {r}
                    </Chip>
                  ))}
                </div>
                <PrimaryButton
                  onClick={() => {
                    setFilter("국물 요리");
                    setAppliedRadius(radius);
                    setQuery("");
                    go("05-2", {}, true);
                  }}
                >
                  {radius}로 넓혀서 찾기
                </PrimaryButton>
              </>
            ) : expanded ? (
              <>
                <div className="nearby-list-title">
                  <h2>
                    반경 {appliedRadius} {filter} <b>{list.length}곳</b>
                  </h2>
                  <span>가까운 순⌄</span>
                </div>
                <div className="nearby-list">
                  {list
                    .filter((r) =>
                      r.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((r) => (
                      <button
                        type="button"
                        className="restaurant-open"
                        key={r.id}
                        onClick={() => go("32", { subjectId: r.id })}
                      >
                        <RestaurantInfo restaurant={r} />
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="restaurant-open"
                  onClick={() => go("32", { subjectId: selected.id })}
                >
                  <RestaurantInfo restaurant={selected} />
                </button>
                <div className="button-pair">
                  <SecondaryButton
                    size="small"
                    disabled
                    title="이 이동은 ROUTES-yj.md에서 아직 미정이에요"
                  >
                    길찾기
                  </SecondaryButton>
                  <PrimaryButton
                    size="small"
                    disabled
                    title="이 이동은 ROUTES-yj.md에서 아직 미정이에요"
                  >
                    메뉴판 보기
                  </PrimaryButton>
                </div>
              </>
            )}
          </BottomSheet>
          {expanded && (
            <Squircle
              as="button"
              type="button"
              radius={17.76}
              className="button button--small map-toggle"
              onClick={() => go("05-2")}
            >
              <DesignAsset screen="05-3" name="imgIconMap" />
              지도 보기
            </Squircle>
          )}
        </div>
      );
    }
    case "32":
      return (
        <div className="screen restaurant-detail">
          <div className="detail-scroll">
            <div className="restaurant-hero">
              {restaurant.photo ? (
                <Asset name={restaurant.photo} alt={restaurant.name} />
              ) : (
                <div className="restaurant-photo-placeholder">
                  사진 정보가 없어요
                </div>
              )}
              <IconButton
                asset="5097c.svg"
                label="뒤로 가기"
                glass
                onClick={back}
              />
            </div>
            <div className="restaurant-detail-body stack">
              <h1>{restaurant.name}</h1>
              <p className="muted">
                {restaurant.type} · 도보 {restaurant.walk}분 ·{" "}
                {restaurant.distance}m
              </p>
              <div className="restaurant-rating">
                <RatingKorean
                  rating={restaurant.rating}
                  count={restaurant.count}
                />
                <small className="open">● {restaurant.hours}</small>
              </div>
              {!restaurant.id.startsWith("osm:") ? (
                <Card className="korean-picks flush">
                  <h2>한국인이 많이 고른 메뉴</h2>
                  {[
                    [
                      "리볼리타",
                      "채소를 푹 끓인 우거지국처럼 구수해요",
                      "6415e.png",
                      94,
                    ],
                    [
                      "피치 알 라구",
                      "굵은 칼국수에 고기 소스를 얹은 맛",
                      "fb60b.png",
                      89,
                    ],
                    [
                      "파파 알 포모도로",
                      "빵을 넣고 끓인 토마토 죽 같아요",
                      "60d97.png",
                      81,
                    ],
                  ].map(([label, desc, img, percent]) => (
                    <ListRow
                      key={label}
                      leading={<Picture name={String(img)} />}
                      trailing={<b className="ai-text">{percent}%</b>}
                    >
                      <strong>{label}</strong>
                      <small className="ai-text">{desc}</small>
                    </ListRow>
                  ))}
                </Card>
              ) : (
                <Card>
                  <p>아직 한국인 평가가 모이지 않았어요.</p>
                </Card>
              )}
              <Card>
                <div className="address-row">
                  <DesignAsset screen="32" name="imgFrame3" />
                  <span>{restaurant.address}</span>
                  <button
                    type="button"
                    onClick={() => void copy(restaurant.address ?? "")}
                  >
                    복사
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      );
    case "23":
      return shell(
        "함께 여행하는 사람",
        <div className="stack">
          <p className="muted companion-intro">
            스위치를 켜면 메뉴를 고를 때 그 사람의 입맛도 함께 보여드려요.
          </p>
          {account.friends.map((f) => (
            <Card
              className={f.active ? "friend-card active" : "friend-card"}
              key={f.id}
            >
              <div className="friend-heading">
                <Avatar
                  name={f.initial}
                  kind={f.active ? "companion" : f.kind}
                  size={44}
                />
                <div>
                  <h2>{f.name}님</h2>
                  <small>
                    {f.active
                      ? "함께 여행 중 · 장바구니 연결됨"
                      : f.allergies
                          .map((x) => `${x} 알레르기`)
                          .concat(f.likes.map((x) => `${x} 좋아해요`))
                          .join(" · ")}
                  </small>
                </div>
                <Toggle
                  checked={f.active}
                  label={`${f.name}님과 함께 여행`}
                  onChange={(value) => {
                    if (value && !f.connected) go("27", { subjectId: f.id });
                    else
                      setAccount((a) => ({
                        ...a,
                        friends: a.friends.map((x) =>
                          x.id === f.id ? { ...x, active: value } : x,
                        ),
                      }));
                  }}
                />
              </div>
              {f.active && (
                <>
                  {friendTags(f)}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => go("25", { subjectId: f.id })}
                  >
                    입맛 수정 <DesignAsset screen="23" name="imgFrame" />
                  </button>
                </>
              )}
            </Card>
          ))}
          <SecondaryButton
            type="button"
            className="add-friend"
            onClick={() => go("26")}
          >
            <DesignAsset screen="23" name="imgFrame1" />새 친구 추가
          </SecondaryButton>
        </div>,
      );
    case "25":
    case "26": {
      const isNew = view.screen === "26";
      return shell(
        isNew ? "새 친구 등록" : "입맛 수정",
        <div className="stack taste-content">
          {isNew ? (
            <label className="field-label">
              이름
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="어떻게 불러드릴까요? 예: 박정숙"
                maxLength={10}
              />
            </label>
          ) : (
            <div className="taste-person">
              <Avatar
                name={
                  view.subjectId === "me"
                    ? account.profile.name.slice(1, 2)
                    : friend?.initial
                }
                kind={view.subjectId === "me" ? "me" : "companion"}
                size={48}
              />
              <h2>
                {view.subjectId === "me" ? account.profile.name : friend?.name}
                님의 입맛
              </h2>
            </div>
          )}
          {tasteFields()}
          {!isNew && (
            <InfoNote>알레르기는 주문할 때 식당에도 꼭 확인해 주세요.</InfoNote>
          )}
        </div>,
        <>
          {isNew && (
            <p>이 브라우저의 임시 계정에 저장해요. 다른 폰 연결은 준비 중이에요</p>
          )}
          <PrimaryButton
            disabled={isNew && !name.trim()}
            onClick={() => {
              if (isNew) {
                const f: Friend = {
                  id: createLocalId(),
                  name: name.trim(),
                  initial: name.trim().slice(0, 1),
                  kind: "teal",
                  active: false,
                  connected: false,
                  ...taste,
                };
                setAccount((a) => ({ ...a, friends: [...a.friends, f] }));
                go("23");
              } else {
                if (view.subjectId === "me")
                  setAccount((a) => ({
                    ...a,
                    profile: { ...a.profile, taste },
                  }));
                else
                  setAccount((a) => ({
                    ...a,
                    friends: a.friends.map((f) =>
                      f.id === friend?.id ? { ...f, ...taste } : f,
                    ),
                  }));
                go("23");
              }
            }}
          >
            {isNew ? "친구 등록하기" : "저장하기"}
          </PrimaryButton>
        </>,
      );
    }
    case "27":
      return shell(
        "동행자 초대",
        <div className="stack">
          <Card className="invite-card">
            <div className="invite-avatars">
              <Avatar size={56} />
              <span>
                <DesignAsset screen="27" name="imgFrame" />
              </span>
            </div>
            <h2>초대 링크와 QR을 미리 확인해요</h2>
            <Squircle className="surface invite-link" radius={30}>
              <span>{inviteUrl.replace(/^https?:\/\//, "")}</span>
              <IconButton
                asset="59934.svg"
                label="초대 링크 복사"
                className="tint"
                onClick={() => void copy(inviteUrl)}
              />
            </Squircle>
          </Card>
          <Card className="flush">
            <ListRow
              leading={
                <span className="asian-icon">
                  <DesignAsset screen="27" name="imgFrame2" />
                </span>
              }
              trailing={chevron}
              onClick={() => {
                if (navigator.share)
                  void navigator
                    .share({ title: "한입 유럽 동행자 초대", url: inviteUrl })
                    .catch(() => {});
                else void copy(inviteUrl);
              }}
            >
              <strong>메시지로 보내기</strong>
              <small>카카오톡·문자로 링크를 보내요</small>
            </ListRow>
            <ListRow
              leading={
                <span className="asian-icon">
                  <DesignAsset screen="27" name="imgFrame4" />
                </span>
              }
              trailing={chevron}
              onClick={() => setShowQR(true)}
            >
              <strong>QR 코드 보여주기</strong>
              <small>옆에 있는 동행자 폰으로 찍게 해요</small>
            </ListRow>
          </Card>
          {showQR && (
            <div
              className="qr-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="초대 QR 코드"
            >
              <Card>
                <h2>동행자에게 보여주세요</h2>
                {qr && <img src={qr} alt="동행자 초대 링크 QR 코드" />}
                <SecondaryButton onClick={() => setShowQR(false)}>
                  닫기
                </SecondaryButton>
              </Card>
            </div>
          )}
        </div>,
        <PrimaryButton onClick={() => void copy(inviteUrl)}>
          초대 링크 복사
        </PrimaryButton>,
      );
    case "28":
      return shell(
        "MY",
        <div className="stack">
          <Card className="profile-card">
            <div className="profile-heading">
              <Avatar
                name={account.profile.name.slice(1, 2) || account.profile.name}
                size={56}
              />
              <div>
                <h2>{account.profile.name}님</h2>
                <p>
                  {account.destination.country} · {account.destination.city}{" "}
                  여행 중
                </p>
                <small>브라우저 임시 계정으로 사용 중</small>
              </div>
              <IconButton
                asset="33ada.svg"
                label="프로필 수정"
                onClick={() => go("29")}
              />
            </div>
            <Squircle radius={30} className="surface profile-stats">
              {[
                [account.records.length, "주문 기록"],
                [
                  account.records.reduce(
                    (n, r) => n + Object.keys(r.ratings).length,
                    0,
                  ),
                  "평가한 메뉴",
                ],
                [
                  `${account.friends.filter((f) => f.active).length}명`,
                  "동행자",
                ],
              ].map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </Squircle>
          </Card>
          <Card>
            <div className="section-title">
              <h2>내 입맛</h2>
              <button
                type="button"
                onClick={() => go("25", { subjectId: "me" })}
              >
                수정
              </button>
            </div>
            {account.profile.taste.allergies.length === 0 && (
              <InlineTag>알레르기 없음</InlineTag>
            )}
            {friendTags(account.profile.taste)}
          </Card>
          <Card className="flush">
            <ListRow
              leading={
                <DesignAsset
                  screen="28"
                  name="imgFrame1"
                  className="row-icon"
                />
              }
              trailing={chevron}
              onClick={() => go("23")}
            >
              함께 여행하는 사람
            </ListRow>
            <ListRow
              leading={
                <DesignAsset
                  screen="28"
                  name="imgFrame3"
                  className="row-icon"
                />
              }
              trailing={chevron}
              onClick={() => go("30")}
            >
              개인정보와 저장
            </ListRow>
          </Card>
        </div>,
        undefined,
        "MY",
      );
    case "29":
      return shell(
        "프로필 수정",
        <div className="stack profile-edit">
          <div className="profile-avatar">
            <Avatar
              name={account.profile.name.slice(1, 2) || account.profile.name}
              size={96}
            />
            <DesignAsset screen="29" name="imgFrame" />
            <p>함께 고를 때 동행자에게 보이는 이름이에요</p>
          </div>
          <label className="field-label">
            이름
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
            />
          </label>
          <p className="muted">1~10자까지 쓸 수 있어요</p>
        </div>,
        <PrimaryButton
          disabled={!name.trim() || name.trim().length > 10}
          onClick={() => {
            setAccount((a) => ({
              ...a,
              profile: { ...a.profile, name: name.trim() },
            }));
            go("28");
          }}
        >
          저장하기
        </PrimaryButton>,
      );
    case "30":
    case "46": {
      const body = (
        <div className="stack">
          <Card className="flush privacy-list">
            {[
              [
                "imgFrame",
                "주문 기록 · 입맛 메모",
                "이 브라우저의 임시 계정에 저장해요. 정식 로그인은 준비 중이에요",
                "내 계정",
              ],
              [
                "imgFrame1",
                "메뉴판 사진",
                "메뉴판 사진은 분석을 위해 Google Gemini로 보내요. 무료 등급에서는 서비스 개선에 쓰일 수 있어요. 사진은 기기에 임시 보관해요",
                "외부 전송",
              ],
              [
                "imgFrame2",
                "현재 위치",
                "근처 식당을 찾을 때만 써요",
                "필요할 때만",
              ],
              [
                "imgFrame3",
                "대화 음성",
                "브라우저 음성 인식 후 대화 글을 Google Gemini로 번역해요",
                "외부 전송",
              ],
            ].map(([icon, title, desc, tag], i) => (
              <ListRow
                key={title}
                leading={
                  <span className="privacy-icon">
                    <DesignAsset screen="30" name={icon} />
                  </span>
                }
                trailing={
                  <InlineTag kind={i === 3 ? "red" : i ? "blue" : "plain"}>
                    {tag}
                  </InlineTag>
                }
              >
                <strong>{title}</strong>
                <small>{desc}</small>
              </ListRow>
            ))}
          </Card>
          <Card className="flush">
            <ListRow
              leading={
                <DesignAsset
                  screen="30"
                  name="imgFrame4"
                  className="row-icon"
                />
              }
              trailing={chevron}
              onClick={() => go("46")}
            >
              <strong className="danger-text">저장된 기록 지우기</strong>
              <small>지운 기록은 되돌릴 수 없어요</small>
            </ListRow>
          </Card>
        </div>
      );
      return (
        <>
          {shell(
            "개인정보와 저장",
            body,
            <PrimaryButton onClick={() => go("28")}>확인했어요</PrimaryButton>,
          )}
          {view.screen === "46" && (
            <div
              className="delete-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="저장 데이터 삭제 확인"
            >
              <BottomSheet className="delete-sheet">
                <span className="delete-handle" />
                <span className="delete-icon">
                  <DesignAsset screen="46" name="imgFrame6" />
                </span>
                <h2>저장된 기록을 모두 지울까요?</h2>
                <p>이 임시 계정의 기록을 지워요. 되돌릴 수 없어요.</p>
                <Squircle radius={30} className="surface deleted-counts">
                  {[
                    ["주문 기록 · 주문 문장", `${account.records.length}개`],
                    [
                      "메뉴 평가",
                      `${account.records.reduce((n, r) => n + Object.keys(r.ratings).length, 0)}개`,
                    ],
                    ["동행자·친구 입맛 메모", `${account.friends.length}명`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </Squircle>
                <div className="button-pair">
                  <SecondaryButton
                    className="gray-button"
                    onClick={() => go("30", {}, true)}
                  >
                    그대로 두기
                  </SecondaryButton>
                  <DangerButton
                    onClick={() => {
                      setAccount((a) => ({
                        ...makeAccount(),
                        profile: {
                          ...a.profile,
                          taste: { allergies: [], dislikes: [], likes: [] },
                        },
                        records: [],
                        friends: [],
                        recentMenu: false,
                      }));
                      setDraft((d) => ({
                        ...d,
                        lines: [],
                        request: "",
                        answers: {},
                        ordered: false,
                      }));
                      go("30", {}, true);
                      notify("기록을 지웠어요.");
                      void api
                        .eraseData()
                        .catch(() =>
                          notify(
                            "서버 기록을 지우지 못했어요. 다시 시도해 주세요.",
                          ),
                        );
                    }}
                  >
                    기록 지우기
                  </DangerButton>
                </div>
              </BottomSheet>
            </div>
          )}
        </>
      );
    }
    default:
      return null;
  }
}
