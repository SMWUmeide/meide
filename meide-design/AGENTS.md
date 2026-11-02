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
