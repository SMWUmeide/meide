"use client";
/* eslint-disable @next/next/no-img-element */
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
  TabBar,
  TopBar,
  WarningBanner,
} from "./ui";
import {
  homePeriod,
  initialDraft,
  menuById,
  menus,
  orderSentences,
  screenForPath,
  screenPaths,
  sharedLines,
  totals,
  updateQuantity,
  type Draft,
  type Menu,
  type Photo,
  type Screen,
} from "@/lib/yj/model";
import { readDraft, saveDraft } from "@/lib/yj/storage";

type View = {
  screen: Screen;
  menuId: string;
  photoIndex: number;
  largeFrom: "03" | "18";
};
const defaultView: View = {
  screen: "home",
  menuId: "zucca",
  photoIndex: 0,
  largeFrom: "03",
};
const homeCopy = {
  morning: "일찍 일어나는 새가\n갓 구운 크루아상을\n먹어요",
  "late-morning": "출출한 오전,\n주먹밥 같은\n아란치니 어떠세요?",
  lunch: "오늘 점심,\n한국인 입맛으로\n풀어드릴게요",
  evening: "저녁 메뉴판\n찍기만 하세요!",
};
const homeAssets = {
  morning: "a2d65.svg",
  "late-morning": "0f168.svg",
  lunch: "71f7c.svg",
  evening: "98ea3.svg",
};
const question = {
  korean: "이 음식에 우유나 치즈가 들어가나요?",
  italian: "Questo piatto contiene latte o formaggio?",
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
      ) : (
        <div className="paper-fit">
          <MenuPaper />
        </div>
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
  return menu.photo ? (
    <Asset
      name={menu.photo}
      alt={menu.korean}
      className={`dish-photo ${className}`}
    />
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
    <span className="stepper">
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
    </span>
  );
}

export default function OrderFlow() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [view, setView] = useState<View>(defaultView);
  const [ready, setReady] = useState(false);
  const [period, setPeriod] = useState<keyof typeof homeCopy>("lunch");
  const [category, setCategory] = useState("수프");
  const [query, setQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    "Osteria La Solita Zuppa",
  );
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const history = useRef<View[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const analysisMode = useRef("auto");
  const cameraDenied = useRef(false);
  const selectedMenu = menuById(view.menuId);
  const amount = totals(draft.lines, draft.tip);
  const sentence = orderSentences(draft.lines, draft.request);
  const largeSentence = view.largeFrom === "18" ? question : sentence;
  const visibleMenus = menus.filter(
    (menu) =>
      (!draft.partial || menu.category === "수프") &&
      menu.category === category,
  );

  useEffect(() => {
    let mounted = true;
    async function restore() {
      const params = new URLSearchParams(window.location.search);
      const restored = await readDraft().catch(() => undefined);
      if (!mounted) return;
      const next = { ...initialDraft, ...restored };
      if (params.get("fixture") === "shared")
        next.lines = sharedLines.map((line) => ({ ...line }));
      if (params.get("fixture") === "photos")
        next.photos = [
          { id: "sample-1", readable: true },
          { id: "sample-2", readable: false },
        ];
      if (params.get("fixture") === "empty") next.lines = [];
      analysisMode.current = params.get("analysis") ?? "auto";
      cameraDenied.current = params.get("camera") === "denied";
      const screen = screenForPath(window.location.pathname, next);
      const saved = window.history.state?.yjView as View | undefined;
      const nextView: View = {
        ...defaultView,
        ...saved,
        screen:
          cameraDenied.current && (screen === "08" || screen === "09")
            ? "41"
            : (saved?.screen ?? screen),
        menuId: window.location.pathname.split("/")[2] || "zucca",
        photoIndex: Number(window.location.pathname.split("/")[3]) || 0,
      };
      setDraft(next);
      setView(nextView);
      setPeriod(homePeriod(new Date()));
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
          screen: screenForPath(window.location.pathname, initialDraft),
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
    if (ready)
      void saveDraft(draft).catch(() =>
        setNotice(
          "임시 저장 공간을 사용할 수 없어요. 이 화면을 닫기 전에 다시 시도해 주세요.",
        ),
      );
  }, [draft, ready]);
  useEffect(() => {
    content.current?.scrollTo(0, 0);
  }, [view.screen, view.menuId]);
  useEffect(() => {
    if (view.screen !== "39") return;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setAnalysisStep(step);
      if (step < 3) return;
      window.clearInterval(timer);
      const failed =
        analysisMode.current === "partial" ||
        (analysisMode.current !== "success" &&
          draft.photos.some((photo) => !photo.readable));
      const nextView = { ...view, screen: (failed ? "40" : "13") as Screen };
      window.history.replaceState(
        { ...window.history.state, yjView: nextView },
        "",
        screenPaths[nextView.screen],
      );
      setDraft((current) => ({ ...current, analyzed: true }));
      setView(nextView);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [draft.photos, view]);

  function go(screen: Screen, options: Partial<View> = {}, replace = false) {
    const next = {
      ...view,
      ...options,
      screen:
        screen === "08" && cameraDenied.current ? ("41" as const) : screen,
    };
    if (!replace) history.current.push(view);
    let path = screenPaths[next.screen];
    if (next.screen === "06-2" || next.screen === "18")
      path = `/menu/${next.menuId}${next.screen === "18" ? "/ask" : ""}`;
    if (next.screen === "11") path = `/capture/photos/${next.photoIndex}`;
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
  function capture(src?: string) {
    const photos = [...draft.photos];
    const photo: Photo = {
      id: crypto.randomUUID(),
      src,
      readable: replaceIndex !== null || photos.length === 0,
    };
    if (replaceIndex !== null) photos[replaceIndex] = photo;
    else photos.push(photo);
    setDraft((current) => ({
      ...current,
      photos,
      analyzed: false,
      partial: false,
    }));
    setReplaceIndex(null);
    go("09");
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;
    try {
      const sources = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              if (
                !file.type.startsWith("image/") ||
                file.size > 12 * 1024 * 1024
              ) {
                reject(new Error("12MB 이하의 사진을 골라주세요."));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error("사진을 열지 못했어요."));
              reader.readAsDataURL(file);
            }),
        ),
      );
      setDraft((current) => ({
        ...current,
        photos: [
          ...current.photos,
          ...sources.map((src) => ({
            id: crypto.randomUUID(),
            src,
            readable: true,
          })),
        ],
        analyzed: false,
      }));
      go("09");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "사진을 열지 못했어요.",
      );
    }
    event.target.value = "";
  }
  function analyze() {
    setAnalysisStep(0);
    go("39");
  }
  function retake(index: number) {
    setReplaceIndex(index);
    go("08");
  }
  function removePhoto(index: number) {
    setDraft((current) => ({
      ...current,
      photos: current.photos.filter((_, i) => i !== index),
    }));
  }
  function speak(text: string) {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    if (!("speechSynthesis" in window)) {
      setNotice(
        "이 브라우저는 음성 재생을 지원하지 않아요. 크게 보여주기를 이용해 주세요.",
      );
      return;
    }
    const voice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.localService && voice.lang.startsWith("it"));
    if (!voice) {
      setNotice(
        "기기에 이탈리아어 음성이 없어요. 크게 보여주기를 이용해 주세요.",
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.voice = voice;
    utterance.onend = utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
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

  let screen: ReactNode;
  switch (view.screen) {
    case "home":
      screen = (
        <div className={`home ${period}`}>
          <div className="home-gradient" />
          <div className="home-status" aria-hidden="true">
            <span>9:41</span>
            <span>▮▮▮ ◉ ▰</span>
          </div>
          <div className="home-top">
            <button
              type="button"
              className="location-chip"
              disabled
              title="이번 구현 범위에 포함되지 않은 화면이에요"
            >
              <Asset name="e5d3e.svg" />
              이탈리아
            </button>
            <span className="avatar-stack">
              <Avatar />
              <Avatar name="김" kind="companion" />
            </span>
          </div>
          <h1>{homeCopy[period]}</h1>
          <button
            className="home-orb"
            type="button"
            aria-label="메뉴판 찍기"
            onClick={() => go("08")}
          >
            <Asset name={homeAssets[period]} />
          </button>
          <button
            type="button"
            className="home-notice"
            disabled={draft.ordered}
            onClick={() => go("08")}
          >
            {draft.ordered ? (
              <>
                <Asset name="9ee0f.svg" />
                아직 평가 안 한 메뉴가 있어요
              </>
            ) : (
              "메뉴판을 촬영해 주세요"
            )}
          </button>
          <TabBar />
        </div>
      );
      break;
    case "08":
    case "09": {
      const hasPhotos = view.screen === "09" && draft.photos.length > 0;
      screen = (
        <CameraShell
          title={hasPhotos ? "다음 장도 찍어주세요" : "메뉴판을 찍어주세요"}
          onClose={() => go("home")}
          right={
            <IconButton asset="b1f78.svg" label="플래시 (목업)" disabled />
          }
        >
          <div className={`capture-preview ${hasPhotos ? "captured" : ""}`}>
            <MenuPaper />
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
                  asset="56047.svg"
                  label="앨범에서 사진 고르기"
                  onClick={() => fileInput.current?.click()}
                />
                {!hasPhotos && <small>앨범</small>}
              </div>
              <button
                className="shutter"
                type="button"
                aria-label={replaceIndex !== null ? "교체 사진 촬영" : "셔터"}
                onClick={() => capture()}
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
            <button
              type="button"
              className="add-photo"
              onClick={() => go("09")}
            >
              <Asset name="3d1ce.svg" />더 찍기
            </button>
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
              <button type="button" onClick={() => retake(view.photoIndex)}>
                <Asset name="6af20.svg" />
                다시 찍기
              </button>
              <button
                type="button"
                onClick={() => {
                  removePhoto(view.photoIndex);
                  go("10");
                }}
              >
                <Asset name="bb436.svg" />
                삭제
              </button>
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
            <p>설정 → MEIDE → 카메라</p>
          </Card>
        </div>,
        <>
          <PrimaryButton
            onClick={() => {
              cameraDenied.current = false;
              go("08");
            }}
          >
            설정에서 허용하기
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
            {[
              "메뉴 이름 읽기",
              "가격과 재료 확인하기",
              "한국 음식에 빗대어 설명하기",
            ].map((label, index) => (
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
                        ? `${draft.partial ? 4 : 7}개 메뉴를 찾았어요`
                        : index === 1
                          ? `${draft.photos.length}장 중 1장째`
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
          <SecondaryButton className="stop-analysis" onClick={() => go("09")}>
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
          <h2 className="light-heading">메뉴판 일부를 읽지 못했어요</h2>
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
                  {index === failedIndex ? "흐려서 못 읽음" : "읽기 완료"}
                </span>
              </div>
            ))}
          </Card>
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
        </div>,
        <>
          <PrimaryButton onClick={() => retake(failedIndex)}>
            {failedIndex + 1}번째 사진 다시 찍기
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              setDraft((current) => ({ ...current, partial: true }));
              setCategory("수프");
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
              <strong>Osteria La Solita Zuppa</strong>
            </div>
            <Asset name="7bd45.svg" className="my-location" />
          </div>
          <div className="restaurant-info">
            <h2>Osteria La Solita Zuppa</h2>
            <p>Via Porsenna, 21 · Chiusi</p>
            <div className="match-tags">
              <span>
                <Asset name="cd341.svg" />
                메뉴판 이름과 같아요
              </span>
              <span>여기서 120m</span>
            </div>
          </div>
        </Card>,
        <>
          <PrimaryButton
            onClick={() => {
              setDraft((current) => ({
                ...current,
                restaurant: "Osteria La Solita Zuppa",
              }));
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
      const restaurants = [
        ["Osteria La Solita Zuppa", "수프 전문 · 도보 2분 · 120m", "60d97.png"],
        ["Trattoria Da Rosa", "토스카나 가정식 · 도보 3분 · 220m", "fb60b.png"],
        ["Osteria del Ponte", "수프·스튜 · 도보 5분 · 380m", "6415e.png"],
        ["Zuppe della Nonna", "수프 전문 · 도보 6분 · 460m", "dfb35.png"],
      ].filter(([name]) =>
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
            {["수프", "메인 요리", "로제 와인"].map((name) => (
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
            재료와 조리법은 식당마다 다를 수 있어요. · 2026-10-16 목업 환율
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
              <IconButton asset="5097c.svg" label="뒤로 가기" onClick={back} />
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
                    {original === "farro" && (
                      <p>보리처럼 톡톡 씹히는 고대 밀</p>
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
                  <strong>유제품 (EU 7)</strong>
                  <p>치즈가 들어갔을 수 있어요</p>
                  {draft.answers[selectedMenu.id] && (
                    <p className="answer-record">
                      직원 답변: {draft.answers[selectedMenu.id]}
                    </p>
                  )}
                </div>
                <SecondaryButton onClick={() => go("18")}>
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
            title="유제품 (EU 7) 가능성"
            subtitle={`${selectedMenu.korean} · 치즈가 들어갔을 수 있어요`}
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
            disabled
            title="실시간 대화는 이번 구현 범위에 포함되지 않았어요"
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
              go("04");
            }}
          >
            주문했어요
          </PrimaryButton>
          <SecondaryButton
            disabled
            title="대화 시작 안내는 이번 구현 범위에 포함되지 않았어요"
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
                <h2>{draft.restaurant ?? "식당 정보 없이 주문했어요"}</h2>
                <p>
                  {draft.orderedAt
                    ? new Intl.DateTimeFormat("ko-KR", {
                        timeZone: "Europe/Rome",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hourCycle: "h23",
                      }).format(new Date(draft.orderedAt))
                    : "2026.10.25"}{" "}
                  · 2명
                </p>
              </div>
              <Asset name="41ac6.svg" className="receipt-line" />
              {draft.lines.map((line, index) => {
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
                  <strong>코페르토 · 2명</strong>
                  <small>Coperto · 1인 EUR 2.50</small>
                </div>
                <Price amount={5} won={false} size="small" />
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
                <span className="water-price">+EUR 3.00</span>
              </div>
              <InfoNote>
                이탈리아 식당은 물이 유료예요.
                <br />병 물을 시켰다면
                <br />
                1병에 약 3유로가 붙어요.
              </InfoNote>
              <div className="receipt-row">
                <div>
                  <strong>선택 팁 {draft.tip ? "10%" : "미포함"}</strong>
                  <small>
                    장바구니에서 {draft.tip ? "포함한" : "제외한"} 팁
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
              <SecondaryButton onClick={() => go("01")}>
                추가 주문하기
              </SecondaryButton>
            </BottomActions>
          </div>
        </div>
      );
      break;
  }
  return (
    <main
      className={`yj-app ${view.screen === "home" ? "home-frame" : ""}`}
      data-screen={
        view.screen === "02" || view.screen === "22"
          ? draft.lines.length
            ? "02"
            : "22"
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
