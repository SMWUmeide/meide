"use client";
/* eslint-disable @next/next/no-img-element */
import { createLocalId } from "@/lib/yj/id";
import { loadMenuImages } from "@/lib/yj/image-search";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  AIBox,
  Asset,
  GlassButton,
  Squircle,
  Avatar,
  BottomActions,
  BottomSheet,
  CameraShell,
  Card,
  Chip,
  Companion,
  EmptyState,
  IconButton,
  InfoNote,
  ListRow,
  Price,
  PrimaryButton,
  SecondaryButton,
  TopBar,
  WarningBanner,
} from "./ui";
import {
  homePeriod,
  initialDraft,
  menuById,
  menus,
  orderSentences,
  fixtureScreen,
  makeAccount,
  type AppView,
  type Account,
  screenPaths,
  sharedLines,
  totals,
  updateQuantity,
  type Draft,
  type Menu,
  type Photo,
  type Screen,
} from "@/lib/yj/view-model";
import Home from "./home";
import ExtraScreens from "./extra-screens";
import {
  restoreDisplay,
  storeDraft,
  storeAccount,
  applyBoard,
  api,
} from "@/lib/yj/services/display";
import { state, refreshViews, canonicalTaste } from "@/lib/yj/view-model";
import { saveBoard, savePhoto } from "@/lib/yj/storage";
import { captureVideo, compressPhoto } from "@/lib/yj/camera";
import {
  cameraGuidance,
  currentLocation,
  speak as speakLocal,
  stopSpeaking,
} from "@/lib/yj/services/browser";
import { allergenNames } from "@/lib/yj/model";
import { restaurantView } from "@/lib/yj/presentation";
import { useCamera } from "./use-camera";

type View = AppView;
const defaultView: View = {
  screen: "home",
  menuId: "zucca",
  photoIndex: 0,
  largeFrom: "03",
};

function MenuPaper() {
  return (
    <div className="menu-paper">
      <p className="paper-eyebrow">Osteria</p>
      <strong>La Solita Zuppa</strong>
      <p className="paper-category">— ZUPPE —</p>
      {menus.slice(0, 4).map((menu) => (
        <div key={menu.id} className="paper-row">
          <span>
            {menu.original
              .toLowerCase()
              .replace("zuppa", "Zuppa")
              .replace("fume'", "fumé")}
          </span>
          <span>{menu.price}</span>
        </div>
      ))}
      <p className="paper-category">— SECONDI —</p>
      <div className="paper-row">
        <span>Ossobuco di Chianina e purè</span>
        <span>18</span>
      </div>
      <div className="paper-row">
        <span>Peposo all’imprunetana</span>
        <span>17</span>
      </div>
      <p className="paper-coperto">Coperto € 2,50</p>
    </div>
  );
}
function PhotoPreview({
  photo,
  className = "",
}: {
  photo?: Photo;
  className?: string;
}) {
  return (
    <div className={`photo-preview ${className}`}>
      {photo?.src ? (
        <img src={photo.src} alt="촬영한 메뉴판" />
      ) : api.fixtureMode() ? (
        <div className="paper-fit">
          <MenuPaper />
        </div>
      ) : (
        <p>저장된 사진을 불러오는 중이에요</p>
      )}
    </div>
  );
}
function DishPhoto({
  menu,
  className = "",
}: {
  menu: Menu;
  className?: string;
}) {
  const image = state.board.items.find((i) => i.id === menu.id)?.image;
  return menu.photo ? (
    <>
      <Asset
        name={menu.photo}
        alt={menu.korean}
        className={`dish-photo ${className}`}
      />
      {image && (
        <a
          className="image-credit"
          href={image.pageUrl}
          target="_blank"
          rel="noreferrer"
        >
          참고 사진 · 실제와 다를 수 있어요 · {image.credit} · {image.license}
        </a>
      )}
    </>
  ) : (
    <div className={`photo-placeholder ${className}`}>
      <Asset name="a47a6.svg" />
    </div>
  );
}
function Stepper({
  quantity,
  onChange,
  name,
}: {
  quantity: number;
  onChange: (change: number) => void;
  name: string;
}) {
  return (
    <Squircle as="span" radius="chip" className="stepper">
      <button
        type="button"
        aria-label={`${name} 수량 줄이기`}
        onClick={() => onChange(-1)}
      >
        −
      </button>
      <span>{quantity}</span>
      <button
        type="button"
        aria-label={`${name} 수량 늘리기`}
        onClick={() => onChange(1)}
      >
        +
      </button>
    </Squircle>
  );
}

export default function OrderFlow() {
  const [account, setAccount] = useState<Account>(makeAccount);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [view, setView] = useState<View>(defaultView);
  const [ready, setReady] = useState(false);
  const [period, setPeriod] = useState<
    "morning" | "late-morning" | "lunch" | "evening"
  >("lunch");
  const [category, setCategory] = useState("수프");
  const [query, setQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const history = useRef<View[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const analysisMode = useRef("auto");
  const cameraDenied = useRef(false);
  const fixtureRef = useRef(false),
    videoRef = useRef<HTMLVideoElement>(null),
    captureInput = useRef<HTMLInputElement>(null);
  const [settingsGuideShown, setSettingsGuideShown] = useState(false);
  const [flash, setFlash] = useState(false),
    [analysisError, setAnalysisError] = useState("");
  const [, setTranslationVersion] = useState(0);
  const currency = state.board.currency;
  const camera = useCamera(
    ready && !fixtureRef.current && ["08", "09"].includes(view.screen),
    videoRef,
    (message) => {
      go("41");
      setNotice(message);
    },
  );
  useEffect(() => {
    if (view.screen !== "41" || fixtureRef.current) return;
    const retry = () => {
      if (document.visibilityState === "visible") {
        cameraDenied.current = false;
        go("08");
      }
    };
    document.addEventListener("visibilitychange", retry);
    return () => document.removeEventListener("visibilitychange", retry);
    // The listener is reinstalled when the permission screen changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.screen]);

  const [talkFailureMode, setTalkFailureMode] = useState(false);
  const selectedMenu = menuById(view.menuId);
  const selectedData = state.board.items.find((i) => i.id === selectedMenu.id);
  const question = selectedData?.ai.askStaff
    ? {
        korean: selectedData.ai.askStaff.korean,
        italian: selectedData.ai.askStaff.local,
      }
    : {
        korean: "이 음식의 재료와 알레르기 표기를 확인해 주세요.",
        italian:
          "Potrebbe confermare gli ingredienti e gli allergeni di questo piatto?",
      };
  const matchedRestaurant = state.account.restaurants.find(
    (r) => r.name === selectedRestaurant,
  );
  const [, setRestaurantsVersion] = useState(0);
  useEffect(() => {
    if (!ready || !["13", "14"].includes(view.screen) || api.fixtureMode())
      return;
    let active = true;
    const timer = setTimeout(() => {
      void currentLocation(state.account.trip.location)
        .then(({ location }) =>
          api.findRestaurantOnMenu(
            view.screen === "14"
              ? query
              : (state.board.restaurantNameOnMenu ?? ""),
            location,
          ),
        )
        .then((rows) => {
          if (!active) return;
          state.account.restaurants = [
            ...rows,
            ...state.account.restaurants.filter(
              (r) => !rows.some((x) => x.id === r.id),
            ),
          ];
          refreshViews();
          if (rows[0]) setSelectedRestaurant(rows[0].name);
          setRestaurantsVersion((v) => v + 1);
        })
        .catch((e) => {
          if (active)
            setNotice(
              e instanceof Error
                ? e.message
                : "식당을 찾지 못했어요. 식당 없이도 계속할 수 있어요.",
            );
        });
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [view.screen, query, ready]);
  useEffect(() => {
    if (!ready || !["01", "06-2"].includes(view.screen) || api.fixtureMode())
      return;
    let active = true;
    const boardId = state.board.id;
    const items = [...state.board.items].sort(
      (a, b) => Number(b.id === view.menuId) - Number(a.id === view.menuId),
    );
    void loadMenuImages(
      items,
      (item) => api.menuImage(item.original, item.korean),
      (item, image) => {
        state.board = {
          ...state.board,
          items: state.board.items.map((i) =>
            i.id === item.id ? { ...i, image } : i,
          ),
        };
        refreshViews();
        void saveBoard(state.board);
        setTranslationVersion((v) => v + 1);
      },
      () => active && state.board.id === boardId,
    );
    return () => {
      active = false;
    };
  }, [view.screen, view.menuId, ready]);

  const historical = account.records.find((r) => r.id === view.recordId);
  const receiptDraft =
    view.recordId && historical
      ? {
          ...draft,
          lines: historical.lines,
          tip: historical.tip,
          restaurant: historical.restaurant,
          orderedAt: historical.at,
          request: historical.request,
        }
      : draft;
  const amount = totals(receiptDraft.lines, receiptDraft.tip);
  const sentence = orderSentences(receiptDraft.lines, receiptDraft.request);
  const largeSentence = view.largeFrom === "18" ? question : sentence;
  const visibleMenus = menus.filter(
    (menu) =>
      (!draft.partial ||
        state.board.items.find((i) => i.id === menu.id)?.readConfidence ===
          "high") &&
      menu.category === category,
  );

  useEffect(() => {
    let mounted = true;
    async function restore() {
      const params = new URLSearchParams(window.location.search);
      let restored: Draft | undefined;
      try {
        const boot = await restoreDisplay();
        if (!mounted) return;
        restored = boot.draft;
        setAccount(boot.account);
        if (boot.capabilities.analysis === "mock")
          setNotice("Gemini 키가 없어 예시 메뉴로 분석해요.");
      } catch (e) {
        setNotice(
          e instanceof Error ? e.message : "저장된 내용을 불러오지 못했어요.",
        );
      }
      if (!mounted) return;
      const next = { ...initialDraft, ...restored };
      const fixture = params.get("fixture");
      fixtureRef.current = !!fixture;
      if (fixture) setSelectedRestaurant("Osteria La Solita Zuppa");
      if (["09", "10", "11", "39", "40"].includes(fixture ?? ""))
        next.photos = [
          { id: "sample-1", readable: true },
          { id: "sample-2", readable: false },
        ];
      if (fixture === "22") next.lines = [];
      if (fixture === "21") setAccount((a) => ({ ...a, records: [] }));
      if (params.get("fixture") === "shared")
        next.lines = sharedLines.map((line) => ({ ...line }));
      if (params.get("fixture") === "photos")
        next.photos = [
          { id: "sample-1", readable: true },
          { id: "sample-2", readable: false },
        ];
      if (params.get("fixture") === "empty") next.lines = [];
      if (window.location.pathname.startsWith("/talk") && !next.lines.length)
        next.lines = sharedLines.map((l) => ({ ...l }));
      analysisMode.current = params.get("analysis") ?? "auto";
      cameraDenied.current = params.get("camera") === "denied";
      setTalkFailureMode(params.get("talk") === "failure");
      const screen = fixtureScreen(window.location.pathname, params, next);
      const saved = window.history.state?.yjView as View | undefined;
      const nextView: View = {
        ...defaultView,
        ...saved,
        screen:
          cameraDenied.current && (screen === "08" || screen === "09")
            ? "41"
            : fixture === "interactive"
              ? (saved?.screen ?? screen)
              : params.has("fixture")
                ? screen
                : (saved?.screen ?? screen),
        menuId: window.location.pathname.startsWith("/menu/")
          ? decodeURIComponent(window.location.pathname.split("/")[2])
          : "zucca",
        photoIndex: Number(window.location.pathname.split("/")[3]) || 0,
        subjectId: /^\/(companions|restaurants)\//.test(
          window.location.pathname,
        )
          ? decodeURIComponent(window.location.pathname.split("/")[2])
          : undefined,
      };
      setDraft(next);
      setView(nextView);
      const requested = params.get("period");
      setPeriod(
        ["morning", "late-morning", "lunch", "evening"].includes(
          requested ?? "",
        )
          ? (requested as typeof period)
          : homePeriod(new Date()),
      );
      setReady(true);
      window.history.replaceState(
        { ...window.history.state, yjView: nextView },
        "",
        window.location.href,
      );
    }
    void restore();
    const pop = (event: PopStateEvent) => {
      setView(
        event.state?.yjView ?? {
          ...defaultView,
          screen: fixtureScreen(
            window.location.pathname,
            new URLSearchParams(window.location.search),
            initialDraft,
          ),
        },
      );
      history.current.pop();
    };
    window.addEventListener("popstate", pop);
    return () => {
      mounted = false;
      window.removeEventListener("popstate", pop);
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void storeDraft(draft).catch((e) =>
        setNotice(
          e instanceof Error ? e.message : "임시 저장 공간을 사용할 수 없어요.",
        ),
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [draft, ready]);
  useEffect(() => {
    content.current?.scrollTo(0, 0);
  }, [view.screen, view.menuId]);
  useEffect(() => {
    if (
      view.screen !== "39" ||
      new URLSearchParams(window.location.search).get("fixture") === "39"
    )
      return;
    const abort = new AbortController();
    async function run() {
      try {
        if (api.fixtureMode()) {
          await new Promise((r) => setTimeout(r, 300));
          go("40", {}, true);
          return;
        }
        // Flush photograph bytes before sending only images and EU allergen numbers.
        const photos = await Promise.all(
          draft.photos.map(async (p) => {
            if (p.src) await savePhoto(p.id, p.src);
            return {
              id: p.id,
              localKey: p.id,
              readable: "ok" as const,
              itemIds: [],
            };
          }),
        );
        const result = await api.analyzeMenu(
          photos,
          [
            canonicalTaste(account.profile.taste),
            ...account.friends.filter((f) => f.active).map(canonicalTaste),
          ],
          (phase) =>
            setAnalysisStep(
              phase === "uploading" ? 0 : phase === "analyzing" ? 1 : 2,
            ),
          abort.signal,
        );
        if (abort.signal.aborted) return;
        applyBoard(result.board);
        await saveBoard(result.board);
        setCategory(result.board.sections[0]?.korean ?? "");
        setDraft((d) => ({
          ...d,
          analyzed: true,
          photos: d.photos.map((p) => ({
            ...p,
            readable:
              result.board.photos.find((photo) => photo.id === p.id)
                ?.readable === "ok",
          })),
          partial: result.board.status !== "done",
          lines: [],
        }));
        go(result.board.status === "done" ? "13" : "40", {}, true);
        if (result.mode === "mock")
          setNotice("Gemini 키가 없어 Osteria 예시 결과를 보여드려요.");
      } catch (e) {
        if (!abort.signal.aborted) {
          state.board = { ...state.board, status: "failed" };
          void saveBoard(state.board).catch(() => {});
          void api.saveMenuBoard(state.board).catch(() => {});
          go("40", {}, true);
          setAnalysisError(
            e instanceof Error
              ? e.message
              : "분석을 마치지 못했어요. 사진은 보관했어요.",
          );
          setNotice(e instanceof Error ? e.message : "분석을 마치지 못했어요.");
        }
      }
    }
    void run();
    return () => abort.abort();
    // A run belongs to this screen visit, not to incidental state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.screen]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void storeAccount(account).catch((e) =>
        setNotice(e instanceof Error ? e.message : "저장하지 못했어요."),
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [account, ready]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      void api
        .translateRequest(draft.request, state.board.language)
        .then((t) => {
          if (active) {
            state.translation = t;
            setTranslationVersion((v) => v + 1);
          }
        })
        .catch(() => {
          if (active) {
            state.translation = { local: "", ok: false };
            setTranslationVersion((v) => v + 1);
          }
        });
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draft.request, ready]);
  useEffect(() => {
    if (!ready || api.fixtureMode()) return;
    let active = true;
    void api
      .exchangeRate(state.board.currency, "KRW")
      .then((r) => {
        if (active) {
          state.rate = r;
          setTranslationVersion((v) => v + 1);
        }
      })
      .catch(() =>
        setNotice("환율을 불러오지 못해 이전 기준 환율을 표시해요."),
      );
    return () => {
      active = false;
    };
  }, [ready, currency]);

  function go(screen: Screen, options: Partial<View> = {}, replace = false) {
    const next = {
      ...view,
      ...options,
      screen:
        screen === "08" && cameraDenied.current ? ("41" as const) : screen,
    };
    if (next.recordId && next.recordId !== view.recordId) {
      const record = state.account.records.find((r) => r.id === next.recordId);
      const board = state.account.boards.find(
        (b) => b.id === record?.menuBoardId,
      );
      if (board) {
        state.board = board;
        refreshViews();
      }
    }
    if (!replace) history.current.push(view);
    let path = screenPaths[next.screen];
    if (next.screen === "06-2" || next.screen === "18")
      path = `/menu/${encodeURIComponent(next.menuId)}${next.screen === "18" ? "/ask" : ""}`;
    if (next.screen === "32")
      path = `/restaurants/${encodeURIComponent(next.subjectId ?? "rosa")}`;
    if (next.screen === "25" || next.screen === "27")
      path = `/companions/${next.subjectId ?? "miyoung"}/${next.screen === "25" ? "taste" : "invite"}`;
    if (next.screen === "11") path = `/capture/photos/${next.photoIndex}`;
    if (fixtureRef.current) path += "?fixture=interactive";
    if (["16", "45", "44"].includes(next.screen) && talkFailureMode)
      path += (path.includes("?") ? "&" : "?") + "talk=failure";
    window.history[replace ? "replaceState" : "pushState"](
      { ...window.history.state, yjView: next },
      "",
      path,
    );
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setNotice("");
    setView(next);
  }
  function back() {
    window.history.back();
  }
  function changeQuantity(id: string, change: number) {
    setDraft((current) => ({
      ...current,
      lines: updateQuantity(current.lines, id, change),
    }));
  }
  async function capture() {
    if (!fixtureRef.current && camera.fallback) {
      captureInput.current?.click();
      return;
    }
    try {
      const src = fixtureRef.current
        ? undefined
        : captureVideo(videoRef.current!);
      setFlash(true);
      setTimeout(() => setFlash(false), 160);
      await addPhotos([src]);
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "카메라가 준비되면 다시 눌러주세요.",
      );
    }
  }
  async function addPhotos(sources: (string | undefined)[]) {
    if (!fixtureRef.current && state.board.status !== "analyzing") {
      state.board = {
        ...state.board,
        id: createLocalId(),
        createdAt: new Date().toISOString(),
        status: "analyzing",
        items: [],
        sections: [],
        restaurantId: undefined,
        restaurantNameOnMenu: undefined,
      };
      refreshViews();
    }
    const photos = await Promise.all(
      sources.map(async (src) => {
        const id = createLocalId();
        if (src) await savePhoto(id, src);
        return { id, src, readable: true };
      }),
    );
    setDraft((d) => {
      const next = [...d.photos];
      if (replaceIndex !== null) {
        next.splice(replaceIndex, 1, ...photos);
      } else next.push(...photos);
      return { ...d, photos: next, analyzed: false, partial: false };
    });
    setReplaceIndex(null);
    go("09");
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    try {
      if (files.length)
        await addPhotos(await Promise.all(files.map(compressPhoto)));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "사진을 열지 못했어요.");
    }
    event.target.value = "";
  }
  function analyze() {
    setAnalysisError("");
    setAnalysisStep(0);
    go("39");
  }
  function retake(index: number) {
    setReplaceIndex(index);
    go("08");
  }
  function removePhoto(index: number) {
    if (!fixtureRef.current && state.board.status !== "analyzing") {
      state.board = {
        ...state.board,
        id: createLocalId(),
        createdAt: new Date().toISOString(),
        status: "analyzing",
        items: [],
        sections: [],
        restaurantId: undefined,
      };
      refreshViews();
    }
    setDraft((current) => ({
      ...current,
      photos: current.photos.filter((_, i) => i !== index),
      analyzed: false,
      partial: false,
    }));
  }
  function speak(text: string, language = "it-IT") {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    void speakLocal(text, language)
      .catch((e) =>
        setNotice(e instanceof Error ? e.message : "소리를 재생하지 못했어요."),
      )
      .finally(() => setSpeaking(false));
  }
  function sentenceCard(korean: string, italian: string, source: "03" | "18") {
    return (
      <Card className="sentence-card">
        <div>
          <p className="sentence-korean">{korean}</p>
          <p className="sentence-italian" lang="it">
            {italian}
          </p>
        </div>
        <div className="sentence-actions">
          <IconButton
            asset={source === "03" ? "121d2.svg" : "c6eaf.svg"}
            label={speaking ? "재생 멈추기" : "들려주기"}
            className="tint"
            aria-pressed={speaking}
            onClick={() => speak(italian)}
          />
          <IconButton
            asset={source === "03" ? "2a8c4.svg" : "beef5.svg"}
            label="크게 보여주기"
            className="tint"
            onClick={() => go("17", { largeFrom: source })}
          />
        </div>
      </Card>
    );
  }
  function shell(
    title: string,
    body: ReactNode,
    footer?: ReactNode,
    className = "",
  ) {
    return (
      <div className={`screen ${className}`}>
        <TopBar title={title} onBack={back} />
        <div ref={content} className="screen-content">
          {body}
        </div>
        {footer && <BottomActions>{footer}</BottomActions>}
      </div>
    );
  }

  function onTab(tab: string) {
    go(
      tab === "홈"
        ? "home"
        : tab === "주문 내역"
          ? account.records.length
            ? "19"
            : "21"
          : tab === "둘러보기"
            ? "31"
            : "28",
      { recordId: undefined, subjectId: undefined, returnTo: undefined },
    );
  }
  let screen: ReactNode;
  switch (view.screen) {
    case "home":
      screen = (
        <Home
          account={account}
          period={
            typeof window !== "undefined" &&
            !new URLSearchParams(window.location.search).has("period")
              ? homePeriod(new Date(), account.destination.timezone)
              : period
          }
          onNavigate={(n) =>
            go(n, {
              recordId: undefined,
              subjectId: undefined,
              returnTo: "home",
            })
          }
          onTab={onTab}
        />
      );
      break;
    case "08":
    case "09": {
      const hasPhotos = view.screen === "09" && draft.photos.length > 0;
      screen = (
        <CameraShell
          title={hasPhotos ? "다음 장도 찍어주세요" : "메뉴판을 찍어주세요"}
          className={fixtureRef.current ? "" : "camera-live"}
          onClose={() => go("home")}
          right={
            camera.torchAvailable ? (
              <IconButton
                glass
                asset="b1f78.svg"
                label="플래시"
                aria-pressed={camera.torch}
                onClick={() => void camera.toggleTorch()}
              />
            ) : undefined
          }
        >
          <div
            className={`capture-preview ${fixtureRef.current ? "" : "live"} ${hasPhotos ? "captured" : ""}`}
          >
            {fixtureRef.current ? (
              <MenuPaper />
            ) : (
              <video
                ref={videoRef}
                className="camera-video"
                autoPlay
                muted
                playsInline
              />
            )}
            {flash && <div className="shutter-flash" />}
          </div>
          <div className={`viewfinder ${hasPhotos ? "captured" : ""}`}>
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className={`camera-controls ${hasPhotos ? "with-photos" : ""}`}>
            <p className="camera-hint">
              {hasPhotos
                ? `${draft.photos.length}장 찍었어요 · 더 있으면 계속 찍어주세요`
                : "메뉴판이 네모 칸에 꽉 차게 맞춰주세요"}
            </p>
            {!hasPhotos && (
              <p className="camera-help">
                여러 장이면 한 장씩 차례로 찍어주세요
              </p>
            )}
            <div className="camera-tools">
              <div>
                <IconButton
                  glass
                  asset="56047.svg"
                  label="앨범에서 사진 고르기"
                  onClick={() => fileInput.current?.click()}
                />
                {!hasPhotos && <small>앨범</small>}
              </div>
              <button
                className="shutter"
                disabled={
                  !fixtureRef.current && !camera.fallback && !camera.ready
                }
                type="button"
                aria-label={replaceIndex !== null ? "교체 사진 촬영" : "셔터"}
                onClick={() => void capture()}
              >
                <Asset name="b81fa.svg" />
                <Asset name="3bf72.svg" />
              </button>
              {hasPhotos ? (
                <button
                  className="photo-stack"
                  type="button"
                  aria-label={`사진 ${draft.photos.length}장 펼쳐보기`}
                  onClick={() => go("10")}
                >
                  <PhotoPreview photo={draft.photos[draft.photos.length - 1]} />
                  <span>{draft.photos.length}</span>
                </button>
              ) : (
                <span className="tool-spacer" />
              )}
            </div>
          </div>
          {hasPhotos && (
            <BottomActions className="camera-footer">
              <PrimaryButton onClick={analyze}>
                메뉴판 {draft.photos.length}장 해석하기
              </PrimaryButton>
            </BottomActions>
          )}
        </CameraShell>
      );
      break;
    }
    case "10":
      screen = (
        <CameraShell
          title={`찍은 사진 ${draft.photos.length}장`}
          closeRight
          dim
          onClose={() => go("09")}
        >
          <div className="photo-grid">
            {draft.photos.map((photo, index) => (
              <div className="photo-tile" key={photo.id}>
                <button
                  type="button"
                  className="photo-open"
                  aria-label={`${index + 1}번째 사진 확대`}
                  onClick={() => go("11", { photoIndex: index })}
                >
                  <PhotoPreview photo={photo} />
                  <span className="photo-number">{index + 1}</span>
                </button>
                <IconButton
                  className="photo-delete"
                  asset="d69c2.svg"
                  label={`${index + 1}번째 사진 삭제`}
                  onClick={() => removePhoto(index)}
                />
              </div>
            ))}
            <Squircle
              as="button"
              radius={30}
              type="button"
              className="add-photo"
              onClick={() => go("09")}
            >
              <Asset name="3d1ce.svg" />더 찍기
            </Squircle>
          </div>
          <BottomActions className="camera-footer">
            <p>사진을 누르면 크게 볼 수 있어요</p>
            <PrimaryButton disabled={!draft.photos.length} onClick={analyze}>
              메뉴판 {draft.photos.length}장 해석하기
            </PrimaryButton>
          </BottomActions>
        </CameraShell>
      );
      break;
    case "11":
      screen = (
        <CameraShell
          title={`${Math.min(view.photoIndex + 1, draft.photos.length)} / ${draft.photos.length}`}
          dim
          closeRight
          onClose={() => go("10")}
        >
          <PhotoPreview
            photo={draft.photos[view.photoIndex]}
            className="enlarged-photo"
          />
          <BottomActions className="camera-footer">
            <div className="photo-dots" aria-hidden="true">
              {draft.photos.map((photo, index) => (
                <span
                  key={photo.id}
                  className={index === view.photoIndex ? "active" : ""}
                />
              ))}
            </div>
            <div className="camera-pair">
              <GlassButton
                type="button"
                onClick={() => retake(view.photoIndex)}
              >
                <Asset name="6af20.svg" />
                다시 찍기
              </GlassButton>
              <GlassButton
                type="button"
                onClick={() => {
                  removePhoto(view.photoIndex);
                  go("10");
                }}
              >
                <Asset name="bb436.svg" />
                삭제
              </GlassButton>
            </div>
          </BottomActions>
        </CameraShell>
      );
      break;
    case "41":
      screen = shell(
        "메뉴판 촬영",
        <div className="permission">
          <span className="permission-icon">
            <Asset name="54776.svg" />
          </span>
          <h2>
            메뉴판을 찍으려면
            <br />
            카메라 허용이 필요해요
          </h2>
          <Card>
            <h3>이렇게 켜주세요</h3>
            <div className="settings-row">
              <Asset name="eb8b3.svg" />
              <span>카메라</span>
              <Asset name="b2856.svg" />
            </div>
            <p>
              {typeof navigator !== "undefined"
                ? cameraGuidance(navigator.userAgent)
                : "브라우저의 카메라 권한을 허용해 주세요."}
            </p>
          </Card>
        </div>,
        <>
          <PrimaryButton
            onClick={() => {
              if (settingsGuideShown) {
                cameraDenied.current = false;
                go("08");
              } else {
                setSettingsGuideShown(true);
                setNotice(cameraGuidance(navigator.userAgent));
              }
            }}
          >
            {settingsGuideShown
              ? "허용한 뒤 다시 시도하기"
              : "설정에서 허용하기"}
          </PrimaryButton>
          <SecondaryButton onClick={() => fileInput.current?.click()}>
            앨범에서 사진 고르기
          </SecondaryButton>
        </>,
      );
      break;
    case "39":
      screen = (
        <div className="screen analyzing">
          <div className="analysis-gradient" />
          <div className="analysis-copy">
            메뉴판을
            <br />
            한국인 입맛으로
            <br />
            풀어드리는 중이에요
          </div>
          <div className="analysis-space" aria-hidden="true" />
          <Card className="analysis-steps">
            {["사진 업로드", "메뉴판 분석", "결과 정리"].map((label, index) => (
              <div
                key={label}
                className={`analysis-step ${analysisStep > index ? "done" : analysisStep === index ? "current" : "pending"}`}
              >
                <span className="step-circle">
                  {analysisStep > index && <Asset name="8dde5.svg" />}
                </span>
                <div>
                  <strong>{label}</strong>
                  {analysisStep >= index && (
                    <p>
                      {index === 0
                        ? `${draft.photos.length}장 업로드하고 있어요`
                        : index === 1
                          ? "사진에 적힌 이름·가격·재료를 확인하고 있어요"
                          : "익숙한 맛으로 설명하고 있어요"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Card>
          <p className="analysis-note">
            사진은 이 휴대폰에 임시 저장돼 있어서 연결이 끊겨도 다시 시도할 수
            있어요.
          </p>
          <SecondaryButton
            size="small"
            className="stop-analysis"
            onClick={() => go("09")}
          >
            그만하기
          </SecondaryButton>
        </div>
      );
      break;
    case "40": {
      const failedIndex = Math.max(
        0,
        draft.photos.findIndex((photo) => !photo.readable),
      );
      screen = shell(
        "메뉴판 확인",
        <div className="stack failure">
          <h2 className="light-heading">
            {analysisError
              ? "메뉴판 분석을 마치지 못했어요"
              : "메뉴판 일부를 읽지 못했어요"}
          </h2>
          {analysisError && (
            <WarningBanner>
              {analysisError}
              <SecondaryButton size="small" onClick={analyze}>
                같은 사진으로 다시 시도하기
              </SecondaryButton>
            </WarningBanner>
          )}
          <Card className="failed-photos">
            {draft.photos.map((photo, index) => (
              <div
                key={photo.id}
                className={index === failedIndex ? "failed" : ""}
              >
                <PhotoPreview photo={photo} />
                <span
                  className={`photo-result ${index === failedIndex ? "bad" : ""}`}
                >
                  <Asset
                    name={index === failedIndex ? "d7819.svg" : "91e62.svg"}
                  />
                  {analysisError
                    ? "사진 보관됨"
                    : index === failedIndex
                      ? "흐려서 못 읽음"
                      : "읽기 완료"}
                </span>
              </div>
            ))}
          </Card>
          {!analysisError && (
            <Card className="flush">
              <ListRow
                leading={
                  <span className="reason-icon">
                    <Asset name="ca49f.svg" />
                  </span>
                }
              >
                <strong>빛이 반사됐어요</strong>
                <small>조명을 피해 살짝 비스듬히 찍어보세요</small>
              </ListRow>
              <ListRow
                leading={
                  <span className="reason-icon">
                    <Asset name="97736.svg" />
                  </span>
                }
              >
                <strong>글자가 흐려요</strong>
                <small>메뉴판에 조금 더 가까이 대주세요</small>
              </ListRow>
            </Card>
          )}
        </div>,
        <>
          <PrimaryButton onClick={() => retake(failedIndex)}>
            {failedIndex + 1}번째 사진 다시 찍기
          </PrimaryButton>
          <SecondaryButton
            disabled={!state.board.items.length}
            onClick={() => {
              setDraft((current) => ({ ...current, partial: true }));
              setCategory(state.board.sections[0]?.korean ?? "");
              go("13");
            }}
          >
            읽은 메뉴만 먼저 보기
          </SecondaryButton>
        </>,
      );
      break;
    }
    case "13":
      screen = shell(
        "이 식당이 맞나요?",
        <Card className="restaurant-match flush">
          <div className="mock-map" aria-label="목업 식당 위치 지도">
            <div className="map-road diagonal" />
            <div className="map-marker">
              <span>
                <Asset name="80923.svg" />
              </span>
              <strong>
                {selectedRestaurant ||
                  state.board.restaurantNameOnMenu ||
                  "식당을 찾고 있어요"}
              </strong>
            </div>
            <Asset name="7bd45.svg" className="my-location" />
          </div>
          <div className="restaurant-info">
            <h2>
              {selectedRestaurant ||
                state.board.restaurantNameOnMenu ||
                "식당 정보 없음"}
            </h2>
            <p>{matchedRestaurant?.address ?? "주소 정보 없음"}</p>
            <div className="match-tags">
              <span>
                <Asset name="cd341.svg" />
                메뉴판 이름과 같아요
              </span>
              <span>
                {api.fixtureMode() ? "여기서 120m" : "© OpenStreetMap"}
              </span>
            </div>
          </div>
        </Card>,
        <>
          <PrimaryButton
            onClick={() => {
              setDraft((current) => ({
                ...current,
                restaurant: selectedRestaurant || null,
              }));
              state.board = {
                ...state.board,
                restaurantId: matchedRestaurant?.id,
              };
              go("01");
            }}
          >
            네, 이 식당이에요
          </PrimaryButton>
          <SecondaryButton onClick={() => go("14")}>
            다른 식당이에요
          </SecondaryButton>
        </>,
      );
      break;
    case "14": {
      const restaurants = (
        api.fixtureMode()
          ? [
              [
                "Osteria La Solita Zuppa",
                "수프 전문 · 도보 2분 · 120m",
                "60d97.png",
              ],
              [
                "Trattoria Da Rosa",
                "토스카나 가정식 · 도보 3분 · 220m",
                "fb60b.png",
              ],
              ["Osteria del Ponte", "수프·스튜 · 도보 5분 · 380m", "6415e.png"],
              ["Zuppe della Nonna", "수프 전문 · 도보 6분 · 460m", "dfb35.png"],
            ]
          : state.account.restaurants
              .filter((r) => r.id.startsWith("osm:"))
              .map((r) => {
                const v = restaurantView(
                  r,
                  state.account.trip.location,
                  state.account.trip,
                );
                return [
                  r.name,
                  `${v.type} · 약 ${v.walk}분 · ${v.distance}m`,
                  v.photoUrl || "60d97.png",
                ];
              })
      ).filter(([name]) =>
        `${name} Chiusi ${name === "Osteria La Solita Zuppa" ? "Via Porsenna, 21" : ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      );
      screen = shell(
        "지금 계신 식당 고르기",
        <div className="stack">
          <label className="search-field">
            <Asset name="66acb.svg" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="식당 이름이나 주소로 찾기"
              aria-label="식당 이름이나 주소로 찾기"
            />
          </label>
          <Card className="flush">
            {restaurants.map(([name, description, photo]) => (
              <ListRow
                key={name}
                selected={selectedRestaurant === name}
                onClick={() => setSelectedRestaurant(name)}
                leading={
                  <Asset name={photo} alt={name} className="restaurant-thumb" />
                }
                trailing={
                  <span
                    className={`radio ${selectedRestaurant === name ? "on" : ""}`}
                  >
                    {selectedRestaurant === name && <Asset name="295b9.svg" />}
                  </span>
                }
              >
                <strong>{name}</strong>
                <small>{description}</small>
              </ListRow>
            ))}
            {!restaurants.length && (
              <p className="search-empty">
                찾는 식당이 없어요. 이름을 다시 입력해 주세요.
              </p>
            )}
          </Card>
        </div>,
        <>
          <PrimaryButton
            onClick={() => {
              setDraft((current) => ({
                ...current,
                restaurant: selectedRestaurant,
              }));
              go("01");
            }}
          >
            이 식당으로 할게요
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              setDraft((current) => ({ ...current, restaurant: null }));
              go("01");
            }}
          >
            식당 없이 계속하기
          </SecondaryButton>
        </>,
      );
      break;
    }
    case "01":
      screen = shell(
        "메뉴를 골라주세요",
        <>
          <Companion />
          <div className="category-chips">
            {state.board.sections
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => s.korean)
              .map((name) => (
                <Chip
                  key={name}
                  selected={name === category}
                  onClick={() => setCategory(name)}
                >
                  {name}
                </Chip>
              ))}
          </div>
          <div className="section-heading">
            <small>
              {category === "수프"
                ? "zuppe"
                : category === "메인 요리"
                  ? "secondi"
                  : "rosato"}
            </small>
            <h2>{category}</h2>
            <small>{visibleMenus.length}개 메뉴</small>
          </div>
          <div className="menu-grid">
            {visibleMenus.map((menu) => {
              const mine =
                draft.lines.find(
                  (line) => line.owner === "me" && line.menuId === menu.id,
                )?.quantity ?? 0;
              const peer = draft.lines.some(
                (line) => line.owner === "companion" && line.menuId === menu.id,
              );
              return (
                <Card key={menu.id} className="menu-card flush">
                  <div className={`menu-photo ${peer ? "peer-selected" : ""}`}>
                    <button
                      type="button"
                      aria-label={`${menu.korean} 상세 보기`}
                      onClick={() => go("06-2", { menuId: menu.id })}
                    >
                      <DishPhoto menu={menu} />
                    </button>
                    {peer && (
                      <span className="companion-tag">
                        <Avatar name="김" kind="companion" size={24} />
                        미영님이 담은 메뉴에요
                      </span>
                    )}
                    <div className="menu-add">
                      {mine ? (
                        <Stepper
                          quantity={mine}
                          name={menu.korean}
                          onChange={(change) => changeQuantity(menu.id, change)}
                        />
                      ) : (
                        <IconButton
                          asset="e2967.svg"
                          label={`${menu.korean} 담기`}
                          onClick={() => changeQuantity(menu.id, 1)}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="menu-card-body"
                    onClick={() => go("06-2", { menuId: menu.id })}
                  >
                    <small>{menu.original}</small>
                    <h3>{menu.korean}</h3>
                    <Price amount={menu.price} />
                  </button>
                </Card>
              );
            })}
          </div>
        </>,
        <>
          <p className="menu-footnote">
            재료와 조리법은 식당마다 다를 수 있어요. · 환율 기준{" "}
            {state.rate.date}
          </p>
          <PrimaryButton
            className="cart-button"
            onClick={() => go(draft.lines.length ? "02" : "22")}
          >
            <Asset name="50e96.svg" />
            <span className="count-badge">{amount.count}개</span>
            <span>함께 담은 장바구니</span>
          </PrimaryButton>
        </>,
        "menu-screen",
      );
      break;
    case "06-2":
      screen = (
        <div className="screen detail-screen">
          <div ref={content} className="detail-scroll">
            <div className="detail-hero">
              <DishPhoto menu={selectedMenu} />
              <IconButton
                glass
                asset="5097c.svg"
                label="뒤로 가기"
                onClick={back}
              />
              <span>대표 이미지 · 실제 음식과 다를 수 있어요</span>
            </div>
            <div className="detail-body stack">
              <div className="detail-title">
                <p>{selectedMenu.original}</p>
                <h1>{selectedMenu.korean}</h1>
                <Price amount={selectedMenu.price} inline />
              </div>
              <AIBox
                title="한국 음식으로 치면"
                subtitle="AI가 한국 음식에 빗대어 설명했어요"
              >
                <h3>{selectedMenu.analogy}</h3>
                <p>{selectedMenu.taste}</p>
              </AIBox>
              <Card className="facts">
                <div className="box-heading">
                  <span className="fact-badge">
                    <Asset name="92852.svg" />
                  </span>
                  <div>
                    <h2>메뉴판에 적힌 정보</h2>
                    <p>메뉴판 원문에서 확인했어요</p>
                  </div>
                </div>
                <hr />
                <h3>재료</h3>
                {selectedMenu.ingredients.map(([name, original]) => (
                  <div key={name}>
                    <strong>{name}</strong> <small>{original}</small>
                    {selectedData?.confirmed.ingredients.find(
                      (i) => i.original === original,
                    )?.note && (
                      <p>
                        {
                          selectedData.confirmed.ingredients.find(
                            (i) => i.original === original,
                          )?.note
                        }
                      </p>
                    )}
                  </div>
                ))}
                <hr />
                <h3>알레르기</h3>
                <strong>{selectedMenu.allergy}</strong>
                {selectedMenu.id === "zucca" && (
                  <p>파로(밀)가 메뉴판에 적혀 있어요</p>
                )}
              </Card>
              <AIBox
                title="AI가 추정한 정보"
                subtitle="일반적인 토스카나 레시피 기준이라 다를 수 있어요"
              >
                <hr />
                <h4>들어갔을 수 있는 재료</h4>
                <div className="ingredient-chips">
                  {selectedMenu.possible.map((name) => (
                    <Chip key={name}>{name}</Chip>
                  ))}
                </div>
                <hr />
                <h4>조리법</h4>
                <p className="dark-text">{selectedMenu.cooking}</p>
                <hr />
                <h4>알레르기 가능성</h4>
                <div>
                  {selectedData?.ai.possibleAllergens.map((a) => (
                    <div key={a.code}>
                      <strong>
                        {allergenNames[a.code]} (EU {a.code})
                      </strong>
                      <p>{a.reason}</p>
                    </div>
                  ))}
                  {!selectedData?.ai.possibleAllergens.length && (
                    <p>
                      AI가 특정한 알레르기 가능성은 없어요. 필요한 경우 직원에게
                      확인해 주세요.
                    </p>
                  )}
                  {draft.answers[selectedMenu.id] && (
                    <p className="answer-record">
                      직원 답변: {draft.answers[selectedMenu.id]}
                    </p>
                  )}
                </div>
                <SecondaryButton size="small" onClick={() => go("18")}>
                  직원에게 확인하는 문장 보기
                </SecondaryButton>
              </AIBox>
              <p className="detail-note">
                재료와 조리법은 식당마다 다를 수 있어요.
              </p>
              <PrimaryButton
                onClick={() => {
                  changeQuantity(selectedMenu.id, 1);
                  go("01");
                }}
              >
                장바구니에 담기
              </PrimaryButton>
            </div>
          </div>
        </div>
      );
      break;
    case "18":
      screen = shell(
        "직원에게 확인하기",
        <div className="stack">
          <AIBox
            compact
            title={
              selectedData?.ai.possibleAllergens
                .map((a) => `${allergenNames[a.code]} (EU ${a.code})`)
                .join(" · ") + " 확인"
            }
            subtitle={`${selectedMenu.korean} · ${selectedData?.ai.possibleAllergens.map((a) => a.reason).join(" · ") ?? "직원에게 재료를 확인해 주세요"}`}
          />
          {sentenceCard(question.korean, question.italian, "18")}
          <h2 className="answer-heading">직원의 대답은요?</h2>
          <div className="answer-chips">
            {["들어가요", "안 들어가요", "빼 줄 수 있대요"].map((answer) => (
              <Chip
                key={answer}
                selected={draft.answers[selectedMenu.id] === answer}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    answers: { ...current.answers, [selectedMenu.id]: answer },
                  }))
                }
              >
                {answer}
              </Chip>
            ))}
          </div>
        </div>,
        <>
          <PrimaryButton
            onClick={() => go("16", { talkFrom: "18", recordId: undefined })}
          >
            실시간 대화로 묻기
          </PrimaryButton>
          <SecondaryButton onClick={() => go("06-2")}>
            메뉴 상세로 돌아가기
          </SecondaryButton>
        </>,
      );
      break;
    case "02":
    case "22": {
      if (!draft.lines.length) {
        screen = shell(
          "함께 담은 장바구니",
          <>
            <Companion />
            <EmptyState title="아직 담은 메뉴가 없어요">
              메뉴 카드의 + 버튼을 누르면
              <br />
              각자 고른 메뉴가 여기에 모여요.
            </EmptyState>
          </>,
          <PrimaryButton onClick={() => go("01")}>
            메뉴 보러 가기
          </PrimaryButton>,
        );
        break;
      }
      screen = (
        <div className="screen cart-screen">
          <TopBar title="함께 담은 장바구니" onBack={back} />
          <div ref={content} className="screen-content stack">
            {(["me", "companion"] as const).map((owner) => {
              const lines = draft.lines.filter((line) => line.owner === owner);
              if (!lines.length) return null;
              const subtotal = totals(lines, draft.tip);
              return (
                <Card key={owner} className="person-card">
                  <h2>
                    <Avatar
                      name={owner === "me" ? "나" : "김"}
                      kind={owner}
                      size={32}
                    />
                    {owner === "me" ? "내 메뉴" : "김미영님 메뉴"} ·{" "}
                    {subtotal.count}개
                  </h2>
                  {lines.map((line) => {
                    const menu = menuById(line.menuId);
                    return (
                      <div className="cart-item" key={line.menuId}>
                        <DishPhoto menu={menu} />
                        <div>
                          <small className="original">{menu.original}</small>
                          <h3>{menu.korean}</h3>
                          <Price
                            amount={menu.price * line.quantity}
                            size="small"
                          />
                          {owner === "me" ? (
                            <Stepper
                              name={menu.korean}
                              quantity={line.quantity}
                              onChange={(change) =>
                                changeQuantity(menu.id, change)
                              }
                            />
                          ) : (
                            <p className="peer-quantity">
                              수량 {line.quantity}개
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="person-subtotal">
                    <span>
                      {owner === "me" ? "내" : "김미영님"} 합계
                      {draft.tip ? " (팁 포함)" : ""}
                    </span>
                    <Price amount={subtotal.cart} />
                  </div>
                </Card>
              );
            })}
          </div>
          <BottomSheet>
            <label className="tip-check">
              <input
                type="checkbox"
                checked={draft.tip}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    tip: event.target.checked,
                  }))
                }
              />
              <span>선택 팁 10% 포함</span>
            </label>
            <div className="breakdown">
              <span>음식 EUR {amount.food.toFixed(2)}</span>
              <span>
                예상 팁 {draft.tip ? "10%" : "0%"} · EUR {amount.tip.toFixed(2)}
              </span>
            </div>
            <div className="cart-total">
              <div>
                <strong>예상 총액(음식+팁)</strong>
                <small>총 {amount.count}개</small>
              </div>
              <Price amount={amount.cart} size="large" />
            </div>
            <PrimaryButton onClick={() => go("03")}>
              주문 문장 만들기
            </PrimaryButton>
          </BottomSheet>
        </div>
      );
      break;
    }
    case "03":
      screen = shell(
        "이렇게 주문하세요",
        <div className="stack order-body">
          {sentenceCard(sentence.korean, sentence.italian, "03")}
          <label className="request-field">
            <span>요청사항</span>
            <textarea
              value={draft.request}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  request: event.target.value,
                }))
              }
              placeholder={
                "입력하면 주문 문장에 자동으로 반영돼요.\n예: 치즈 빼고 주세요"
              }
            />
          </label>
          {sentence.untranslated && (
            <WarningBanner>
              목업에서는 정해진 요청만 번역해요. 입력한 요청은 한국어 원문으로
              표시했어요.
            </WarningBanner>
          )}
        </div>,
        <>
          <PrimaryButton
            disabled={!draft.lines.length}
            onClick={() => {
              setDraft((current) => ({
                ...current,
                ordered: true,
                orderedAt: new Date().toISOString(),
              }));
              const recordId = createLocalId();
              setAccount((a) => ({
                ...a,
                recentMenu: true,
                records: [
                  {
                    id: recordId,
                    restaurant: draft.restaurant ?? "식당 정보 없음",
                    at: new Date().toISOString(),
                    lines: draft.lines.map((l) => ({ ...l })),
                    tip: draft.tip,
                    request: draft.request,
                    ratings: {},
                  },
                  ...a.records,
                ],
              }));
              go("04", { recordId });
            }}
          >
            주문했어요
          </PrimaryButton>
          <SecondaryButton
            onClick={() => go("15", { talkFrom: "03", recordId: undefined })}
          >
            직원이 되물었어요
          </SecondaryButton>
        </>,
      );
      break;
    case "17":
      screen = (
        <div className="screen large-screen">
          <header className="large-header">
            <IconButton
              asset="91bfe.svg"
              label="닫기"
              onClick={() => go(view.largeFrom)}
            />
            <IconButton
              className="tint"
              asset="c6eaf.svg"
              label={speaking ? "재생 멈추기" : "들려주기"}
              onClick={() => speak(largeSentence.italian)}
            />
          </header>
          <div ref={content} className="screen-content large-content">
            <span className="language-badge">ITALIANO</span>
            <p lang="it" className="large-italian">
              {largeSentence.italian}
            </p>
            <hr />
            <p className="large-korean">{largeSentence.korean}</p>
          </div>
          <BottomActions>
            <p>화면을 직원에게 보여주세요</p>
            <PrimaryButton onClick={() => go(view.largeFrom)}>
              닫기
            </PrimaryButton>
          </BottomActions>
        </div>
      );
      break;
    case "04":
      screen = (
        <div className="screen receipt-screen">
          <div className="receipt-gradient" />
          <TopBar title="영수증 미리보기" onBack={back} />
          <div ref={content} className="screen-content receipt-content">
            <h2 className="light-heading">
              계산서에 붙을 금액을
              <br />
              미리 정리했어요
            </h2>
            <Card className="receipt-card">
              <div className="receipt-restaurant">
                <h2>
                  {receiptDraft.restaurant ?? "식당 정보 없이 주문했어요"}
                </h2>
                <p>
                  {receiptDraft.orderedAt
                    ? new Intl.DateTimeFormat("ko-KR", {
                        timeZone: "Europe/Rome",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hourCycle: "h23",
                      }).format(new Date(receiptDraft.orderedAt))
                    : "2026.10.25"}{" "}
                  · 2명
                </p>
              </div>
              <Asset name="41ac6.svg" className="receipt-line" />
              {receiptDraft.lines.map((line, index) => {
                const menu = menuById(line.menuId);
                return (
                  <div className="receipt-row" key={`${line.owner}-${index}`}>
                    <div>
                      <strong>
                        {menu.korean}
                        {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                      </strong>
                      <small>{menu.original}</small>
                    </div>
                    <Price
                      amount={menu.price * line.quantity}
                      won={false}
                      size="small"
                    />
                  </div>
                );
              })}
              <Asset name="41ac6.svg" className="receipt-line" />
              <div className="receipt-row">
                <div>
                  <strong>코페르토 · {state.cart.members.length}명</strong>
                  <small>
                    Coperto · 1인{" "}
                    {state.board.coperto?.currency ?? state.board.currency}{" "}
                    {((state.board.coperto?.amount ?? 0) / 100).toFixed(2)}
                    {!state.board.coperto && " (메뉴판 표기 없음)"}
                  </small>
                </div>
                <Price
                  amount={
                    ((state.board.coperto?.amount ?? 0) / 100) *
                    state.cart.members.length
                  }
                  won={false}
                  size="small"
                />
              </div>
              <InfoNote>
                빵·식기·자리 준비 비용이에요.
                <br />
                1인당 받는 정상 요금이라
                <br />
                바가지가 아니에요.
              </InfoNote>
              <div className="receipt-row">
                <div>
                  <strong>물 (시켰다면)</strong>
                  <small>Acqua in bottiglia · 합계에 포함 안 됨</small>
                </div>
                <span className="water-price">
                  {api.fixtureMode() ? "+EUR 3.00" : "가격 별도 확인"}
                </span>
              </div>
              <InfoNote>
                이탈리아 식당은 물이 유료예요.
                <br />병 물을 시켰다면
                <br />
                {api.fixtureMode()
                  ? "1병에 약 3유로가 붙어요."
                  : "메뉴판에 적힌 물 가격을 확인해 주세요."}
              </InfoNote>
              <div className="receipt-row">
                <div>
                  <strong>선택 팁 {receiptDraft.tip ? "10%" : "미포함"}</strong>
                  <small>
                    장바구니에서 {receiptDraft.tip ? "포함한" : "제외한"} 팁
                  </small>
                </div>
                <Price amount={amount.tip} won={false} size="small" />
              </div>
              <Asset name="41ac6.svg" className="receipt-line" />
              <div className="receipt-row">
                <div>
                  <strong>예상 합계</strong>
                  <small>물 제외</small>
                </div>
                <Price amount={amount.receipt} size="large" />
              </div>
            </Card>
            <p className="receipt-disclaimer">
              식당이 발행한 영수증이 아니에요. 실제 계산서와 다를 수 있어요.
            </p>
            <BottomActions>
              <PrimaryButton onClick={() => go("home")}>
                홈으로 가기
              </PrimaryButton>
              <SecondaryButton
                onClick={() => go("01", { recordId: undefined })}
              >
                추가 주문하기
              </SecondaryButton>
            </BottomActions>
          </div>
        </div>
      );
      break;
    default: {
      const group = ["07", "38", "43"].includes(view.screen)
        ? "trip"
        : ["16", "45", "44"].includes(view.screen)
          ? "talk"
          : ["05-2", "05-3", "42"].includes(view.screen)
            ? "nearby"
            : view.screen + ":" + (view.subjectId ?? "");
      screen = (
        <ExtraScreens
          key={group}
          view={view}
          account={account}
          setAccount={setAccount}
          draft={draft}
          setDraft={setDraft}
          go={go}
          back={back}
          onTab={onTab}
          speak={speak}
          notify={setNotice}
          freeze={
            typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("fixture") === "45"
          }
          talkFailure={talkFailureMode}
        />
      );
    }
  }
  return (
    <main
      className={`yj-app ${view.screen === "home" ? "home-frame" : ""}`}
      data-screen={
        view.screen === "02" || view.screen === "22"
          ? draft.lines.length
            ? "02"
            : "22"
          : view.screen === "19" || view.screen === "21"
            ? account.records.length
              ? "19"
              : "21"
            : view.screen
      }
      aria-busy={!ready}
    >
      {ready ? (
        screen
      ) : (
        <div className="loading-shell" aria-label="화면 준비 중" />
      )}
      <input
        className="visually-hidden"
        ref={captureInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={upload}
        aria-label="기기 카메라로 메뉴판 촬영"
      />
      <input
        className="visually-hidden"
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        onChange={upload}
        tabIndex={-1}
        aria-label="메뉴판 사진 선택"
      />
      {notice && (
        <div className="notice-toast" role="status">
          {notice}
          <button
            type="button"
            aria-label="안내 닫기"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
