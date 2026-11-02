# AGENTS.md — meide (한입)

Codex가 이 저장소에서 작업하기 전에 가장 먼저 읽는 파일.

## 반드시 지킬 것

- **UI를 만들거나 고치기 전에 `DESIGN.md`와 `src/components/index.md`를 읽고, 필요한 컴포넌트의 `CONTRACT.md`만 추가로 읽는다.**
- 색·글자·여백·모서리·그림자는 `src/styles/tokens.css`의 변수만 쓴다. 새 값을 만들지 않는다.
- 이미 있는 컴포넌트(`src/components/`)를 import해서 쓴다. 같은 기능의 버튼·카드를 새로 만들지 않는다.
- 문구는 존댓말 '~요' 체, 시간은 24시간제.
- 작업이 끝나면 `DESIGN.md`의 Do's and Don'ts 검사 항목(HEX 직접 사용, 여백 값, primary 버튼 개수)을 스스로 확인하고 결과를 보고한다.

## 이전 작업 폴더 (yj/)

- `yj/` 폴더는 이전 버전 코드다. **새 코드에서 import하거나 스타일·색·여백을 가져오지 않는다.**
- API 연결(Gemini 메뉴판 분석, OSM, Google Places 사진 등) 로직만 필요할 때 참고로 읽고, 새 구조에 맞게 다시 쓴다.
- 새 화면은 `src/` 아래에 `DESIGN.md` 기준으로 새로 만든다.

## 이번 단계 범위 (1차 출시)

메뉴 주문 흐름까지만 구현한다.

1. 홈 → 2. 메뉴판 촬영 → 3. 메뉴 고르기(메뉴판) → 4. 메뉴 상세 → 5. 함께 담은 장바구니 → 6. 주문 문장(직원에게 보여주기)

식당 찾기, 실시간 마주보기 대화, 영수증, 동반인 관리, 마이페이지는 이번 범위가 아니다. 하단 탭에는 자리만 두고 "준비 중"으로 연결한다.

## 화면 기준

- Figma 파일: 사용자 경험 디자인 II (기준 화면은 `사경디 디자인 디벨롭` 페이지의 `new 10` 섹션)
- Figma 링크를 받으면 Figma MCP로 디자인을 읽되, 값은 Figma의 숫자가 아니라 `DESIGN.md` 토큰으로 맞춘다. 둘이 다르면 `DESIGN.md`가 우선이고, 다른 점을 보고한다.

## 파일 위치

```
AGENTS.md            # 이 파일
DESIGN.md            # 디자인 값과 규칙 (HOW)
PRD.md               # 무엇을 만들지 (WHAT) — 팀 기능명세서
src/styles/tokens.css
src/components/index.md
src/components/<이름>/CONTRACT.md
```

컴포넌트 import 경로는 `src/components/index.md`에 적힌 것을 쓴다. 실제 레포 구조와 다르면 index.md를 먼저 고친다.

## 개발 환경

- Node.js 22.13 이상을 사용한다. 새 앱 루트는 저장소 최상위이며 React + TypeScript + Vite를 쓴다. `npm ci`, `npm run dev`로 실행한다. 기본 주소는 `http://127.0.0.1:5173`이다.
- 새 코드는 `src/`에 둔다. `@/`는 `src/`를 가리킨다. `src/main.tsx`에서 Pretendard와 `src/styles/tokens.css`를 불러온다. 1단계의 홈·촬영·메뉴 고르기·메뉴 상세·장바구니는 가짜 데이터로 연결했다. Gemini 분석은 `api/analyze-menu.ts`와 `server/analyze-menu.ts`에서 처리한다. Places 사진 연결은 아직 미구현이다.
- 검증: 저장소 최상위에서 `npm run build`, `npm run lint`, `npm test`, `npm run check:design`. 화면 비교·여러 폭 캡처·Figma 재조회는 요청 또는 출시 전 최종 점검 때만 한다.
- 이전 앱은 `cd yj` 후 `npm ci`, `npm run dev`로 실행한다. 이전 앱 검증은 그 폴더에서 `npm run build`, 변경 파일 ESLint, `node scripts/yj-flow.test.mjs`를 쓴다. 새 앱 작업으로 `yj/`를 수정하거나 import하지 않는다.
- 이전 API 환경변수 이름은 `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_DAILY_LIMIT`, `PEXELS_API_KEY`, `OSM_USER_AGENT`다(`yj/.env.example` 참고). 과거 AGENTS.md에는 API 키 설정이 없었다. 예시 화면은 키 없이 실행되며 실제 분석에는 서버의 `GEMINI_API_KEY`가 필요하다. `GEMINI_MODEL`은 선택이며 기본값은 `gemini-3.5-flash-lite`다. Vercel Preview·Production 환경에 각각 등록한다. 로컬은 gitignore된 `.env.local`을 쓴다. API 구현 시 서버 환경에만 키를 두고 `VITE_` 접두사로 노출하지 않는다. 실제 키와 `.env.local`은 커밋하지 않는다.
- 실제 앱 작업은 `src` 브랜치에 직접 커밋·푸시한다. 별도 작업 브랜치·PR은 만들지 않는다. 프로토타입은 `wireframes`, 작업 기록은 `members`, 별도 디자인 산출물은 `design` 브랜치를 쓴다. 커밋 전 브랜치를 확인한다.
