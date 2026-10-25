import { fixtureTrips } from "./fixtures";
import type { CartLine, MenuPhoto } from "./model";
type RouteSnapshot = { photos: MenuPhoto[]; lines: CartLine[] };
export type Screen =
  | "home"
  | "08"
  | "09"
  | "10"
  | "11"
  | "39"
  | "40"
  | "41"
  | "13"
  | "14"
  | "01"
  | "06-2"
  | "18"
  | "02"
  | "22"
  | "03"
  | "17"
  | "04"
  | "07"
  | "38"
  | "43"
  | "15"
  | "16"
  | "45"
  | "44"
  | "19"
  | "21"
  | "20"
  | "31"
  | "33"
  | "05-2"
  | "05-3"
  | "42"
  | "32"
  | "23"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "46";
export const screenPaths: Record<Screen, string> = {
  home: "/",
  "08": "/capture",
  "09": "/capture",
  "10": "/capture/photos",
  "11": "/capture/photos/0",
  "39": "/analyze",
  "40": "/analyze",
  "41": "/capture",
  "13": "/restaurant/confirm",
  "14": "/restaurant/select",
  "01": "/menu",
  "06-2": "/menu/zucca",
  "18": "/menu/zucca/ask",
  "02": "/cart",
  "22": "/cart",
  "03": "/order",
  "17": "/order/large",
  "04": "/receipt",
  "07": "/trip",
  "38": "/trip",
  "43": "/trip",
  "15": "/talk/intro",
  "16": "/talk",
  "45": "/talk",
  "44": "/talk",
  "19": "/history",
  "21": "/history",
  "20": "/history/rate",
  "31": "/explore",
  "33": "/explore/ranking",
  "05-2": "/explore/nearby",
  "05-3": "/explore/nearby",
  "42": "/explore/nearby",
  "32": "/restaurants/rosa",
  "23": "/companions",
  "25": "/companions/miyoung/taste",
  "26": "/companions/new",
  "27": "/companions/youngsu/invite",
  "28": "/my",
  "29": "/my/profile",
  "30": "/my/privacy",
  "46": "/my/privacy",
};
export function screenForPath(path: string, draft: RouteSnapshot): Screen {
  if (path === "/") return "home";
  if (/^\/companions\/[^/]+\/taste$/.test(path)) return "25";
  if (/^\/companions\/[^/]+\/invite$/.test(path)) return "27";
  if (/^\/restaurants\/[^/]+$/.test(path)) return "32";
  if (path === "/capture") return draft.photos.length ? "09" : "08";
  if (path === "/cart") return draft.lines.length ? "02" : "22";
  if (/^\/capture\/photos\/\d+$/.test(path)) return "11";
  if (/^\/menu\/[^/]+\/ask$/.test(path)) return "18";
  if (/^\/menu\/[^/]+$/.test(path)) return "06-2";
  return (
    (Object.entries(screenPaths).find(
      ([screen, value]) =>
        value === path &&
        ![
          "09",
          "40",
          "41",
          "22",
          "38",
          "43",
          "21",
          "45",
          "44",
          "05-3",
          "42",
          "46",
        ].includes(screen),
    )?.[0] as Screen) ?? "home"
  );
}

export const screenCatalog = [
  ["home", "홈", "/", "42:1531"],
  ["07", "어디로 떠나시나요?", "/trip", "1:4583"],
  ["38", "여행지 검색 결과", "/trip?q=로마&fixture=38", "1:5889"],
  ["43", "여행지 결과 없음", "/trip?q=로마나&fixture=43", "1:6096"],
  ["08", "메뉴판 촬영", "/capture?fixture=08", "1:4634"],
  ["09", "촬영 완료 · 사진 추가", "/capture?fixture=09", "1:4667"],
  ["10", "촬영 사진 펼쳐보기", "/capture/photos?fixture=10", "1:4705"],
  ["11", "촬영 사진 확대", "/capture/photos/0?fixture=11", "1:4739"],
  ["39", "메뉴 인식 중", "/analyze?fixture=39", "1:5933"],
  ["40", "메뉴 인식 실패", "/analyze?fixture=40", "1:5961"],
  ["41", "카메라 권한 안내", "/capture?fixture=41", "1:6008"],
  ["13", "이 식당이 맞나요?", "/restaurant/confirm", "1:4763"],
  ["14", "지금 계신 식당 고르기", "/restaurant/select", "1:4813"],
  ["01", "메뉴를 골라주세요", "/menu?fixture=shared", "1:1538"],
  ["06-2", "메뉴 상세", "/menu/zucca", "1:4496"],
  ["18", "직원에게 재료 확인하기", "/menu/zucca/ask", "1:4958"],
  ["02", "함께 담은 장바구니", "/cart?fixture=shared", "1:1622"],
  ["22", "장바구니 비어 있음", "/cart?fixture=22", "1:5139"],
  ["03", "이렇게 주문하세요", "/order?fixture=shared", "1:1706"],
  ["17", "주문 문장 크게 보여주기", "/order/large?fixture=shared", "1:4938"],
  ["04", "영수증 미리보기", "/receipt?fixture=shared", "1:1811"],
  ["15", "대화 시작 안내", "/talk/intro?fixture=shared", "1:4865"],
  ["16", "마주보기 대화", "/talk", "1:4896"],
  ["45", "음성 입력 중", "/talk?fixture=45", "31:1319"],
  ["44", "번역 실패", "/talk?fixture=44", "31:1374"],
  ["19", "주문 내역", "/history", "1:4999"],
  ["21", "주문 내역 비어 있음", "/history?fixture=21", "1:5100"],
  ["20", "식사 평가", "/history/rate", "1:5062"],
  ["31", "둘러보기", "/explore", "1:5618"],
  ["33", "한국인 입맛 저격 랭킹", "/explore/ranking", "1:5835"],
  ["05-2", "근처 식당 · 지도", "/explore/nearby", "1:1888"],
  ["05-3", "근처 식당 · 목록", "/explore/nearby?fixture=05-3", "1:1978"],
  ["42", "근처 식당 결과 없음", "/explore/nearby?fixture=42", "1:6035"],
  ["32", "식당 상세", "/restaurants/rosa", "1:5795"],
  ["23", "함께 여행하는 사람", "/companions", "1:5165"],
  ["25", "친구 입맛 수정", "/companions/miyoung/taste", "1:5259"],
  ["26", "새 친구 등록", "/companions/new", "1:5338"],
  ["27", "동행자 초대", "/companions/youngsu/invite", "1:5401"],
  ["28", "MY", "/my", "1:5449"],
  ["29", "프로필 수정", "/my/profile", "1:5532"],
  ["30", "개인정보와 저장", "/my/privacy", "1:5553"],
  ["46", "기록 삭제 확인", "/my/privacy?fixture=46", "1:6195"],
] as const;
export function fixtureScreen(
  path: string,
  params: URLSearchParams,
  draft: RouteSnapshot,
): Screen {
  const fixture = params.get("fixture");
  const allowed = screenCatalog.find(
    ([number, , url]) => number === fixture && url.split("?")[0] === path,
  );
  if (allowed) return allowed[0] as Screen;
  if (path === "/trip" && params.get("q"))
    return fixtureTrips.filter((d) =>
      `${d.country} ${d.city} ${d.detail}`.includes(params.get("q")!),
    ).length
      ? "38"
      : "43";
  return screenForPath(path, draft);
}
export function isFlowPath(path: string) {
  return (
    screenCatalog.some(([, , url]) => url.split("?")[0] === path) ||
    /^\/menu\/[^/]+(\/ask)?$/.test(path) ||
    /^\/capture\/photos\/\d+$/.test(path) ||
    /^\/companions\/[^/]+\/(taste|invite)$/.test(path) ||
    /^\/restaurants\/[^/]+$/.test(path)
  );
}
export type AppView = {
  screen: Screen;
  menuId: string;
  photoIndex: number;
  largeFrom: Screen;
  subjectId?: string;
  recordId?: string;
  returnTo?: Screen;
  talkFrom?: "03" | "18";
};
