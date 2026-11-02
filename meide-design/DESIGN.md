---
name: meide (한입)
version: 1.0.0
updated: 2026-11-02
source: Figma 사용자 경험 디자인 II → Variables "9주차 · meide / …" (기준 화면: 사경디 디자인 디벨롭 › new 10 섹션)
colors:
  neutral: "#F2F4F6"          # 화면 배경
  surface: "#FFFFFF"          # 카드·시트·상단 패널
  on-surface: "#212121"       # 제목·본문 글자, 아이콘
  secondary: "#626773"        # 보조 글자·캡션 (neutral 대비 5.1:1)
  border: "#ECEEF1"           # 구분선·칩 테두리
  primary: "#212121"          # 주요 버튼·선택된 탭/칩·블랙 바
  primary-pressed: "#000000"  # 눌린 주요 버튼
  disabled: "#B4B8BE"         # 비활성 글자·아이콘·버튼
  error: "#CC3D3D"            # 오류·삭제·알림 점
typography:
  font-family: Pretendard
  headline-lg: { fontSize: 30px, lineHeight: 39px, fontWeight: 500, letterSpacing: -0.03em }
  headline-md: { fontSize: 22px, lineHeight: 29px, fontWeight: 500, letterSpacing: -0.02em }
  body-md: { fontSize: 16px, lineHeight: 23px, fontWeight: 500, letterSpacing: -0.01em }
  label-md: { fontSize: 14px, lineHeight: 20px, fontWeight: 500, letterSpacing: -0.01em }
  body-sm: { fontSize: 13px, lineHeight: 19px, fontWeight: 400, letterSpacing: -0.01em }
spacing: { xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px }
rounded: { sm: 14px, md: 20px, lg: 24px }
shadow:
  shadow-sm: "0 3px 12px rgba(0,0,0,0.12)"
  shadow-md: "0 8px 20px -4px rgba(0,0,0,0.18)"
extensions:   # 스타터 25개 밖, 우리 앱에만 있는 토큰
  colors:
    on-primary: "#FFFFFF"       # primary 위 글자
    brand: "#28A745"            # 브랜드·핵심 행동
    brand-pressed: "#1C7D33"
    brand-light: "#7DD88E"      # 구슬 그라디언트 밝은 쪽
    rating: "#FFD33D"           # 별점
    info-bg: "#EAF7EE"          # 영수증 안내 박스
    info-text: "#3D4A41"
    ai-text: "#5A5FD8"          # AI 라벨·AI 버튼
    ai-gradient: ["#61CCD1", "#5285F2", "#9E7AF2"]
    person-1: "#FDC7AA"         # 나
    person-2: "#A5E4FF"         # 동반인 1
    person-3: "#FFF1CA"         # 동반인 2
    person-4: "#ECFFF2"         # 동반인 3
  typography:
    title-md: { fontSize: 17px, lineHeight: 24px, fontWeight: 700, letterSpacing: -0.01em }
  rounded:
    full: 999px
---

# meide DESIGN.md

> 값은 위 YAML에 한 번만 적었다. 아래 본문은 **언제·왜 쓰는지와 하지 말아야 할 것**만 적는다.
> 정확한 Props는 `src/components/<이름>/CONTRACT.md`를 읽는다. 목차는 `src/components/index.md`.
> 근거 표시: **[확정]** 토큰·계약에 적힌 것 / **[관찰]** 화면에서 반복 확인한 것 / **[확인 필요]** 팀 결정이 남은 것

## Overview

- 유럽 자유여행 중인 **50대 한국인 부부**가 식당에서 외국어 메뉴판을 찍고, 한국인의 감각으로 메뉴를 이해해 **주문까지** 끝내는 앱.
- 인상: **익숙함 · 명료함 · 생동감**. 화면은 차분하게(회색 배경 + 흰 카드 + 블랙), 생동감은 그린 브랜드 색과 사진으로만 낸다.
- 중장년 기준: 글자는 크게, 대비는 높게, 터치 영역은 44×44 이상. 한 화면에서 할 일은 하나만 크게 보인다.
- 기준 디바이스 412×917, 상태바 54.

## Colors

- **[확정] 역할로만 쓴다.** 9개 기본 역할(neutral·surface·on-surface·secondary·border·primary·primary-pressed·disabled·error) + 확장(brand·rating·person·ai·info).
- **primary는 블랙이다.** 주요 버튼, 선택된 탭·칩, 장바구니 바, 확인 체크 아이콘에 쓴다. 브랜드 그린이 아니다.
- **brand(그린)는 '핵심 행동'에만** 쓴다: 찍기 구슬, 담김 체크, 장바구니 '○개 보기' 알약, 랭킹 순위 숫자, 영업 중 표시, 지도 반경.
- **rating(노랑)은 별 아이콘에만** 쓴다. 면이나 글자에 쓰지 않는다.
- **person-1~4는 '누가 담았는지'에만** 쓴다: 아바타 배경, 담은 사람 태그, 메뉴 사진 위 55% 오버레이. 나 = person-1, 동반인은 등록 순서대로 person-2~4.
- **ai-gradient와 ai-text는 AI가 만든 정보에만** 쓴다: AI 카드 테두리, AI 아이콘, AI 섹션 라벨, '직원에게 확인하는 문장 보기' 버튼. 메뉴판에서 확인된 정보에는 쓰지 않는다.
- **[확정] 글자 대비 4.5:1 이상.** secondary(#626773)는 neutral 위 5.1:1, surface 위 5.7:1. 예전 3단계 회색(#91949E, 3.0:1)은 쓰지 않는다.
- **[확인 필요]** brand(#28A745) 위 흰 글자는 3.1:1로 기준 미달. 현재 '3개 보기', '장바구니에 담기' 알약이 해당된다. 팀 결정 전까지는 알약 글자를 **title-md(17 Bold)** 로 키워 큰 글자 기준(3:1)을 맞춘다.
- Dark 모드 값은 Figma Variables `Color` 컬렉션 Dark 모드에 있다. 1차 출시는 Light만 구현한다.

## Typography

- **[확정] Pretendard, 5단계 + 확장 1단계.** 이 밖의 크기·굵기는 만들지 않는다.
- headline-lg (30): 홈 헤드라인, 영수증·장바구니 **총액 숫자**.
- headline-md (22): 화면 헤드라인("미영님과 함께 고르는 중"), 섹션 제목("한국인 입맛 랭킹"), 상세 메뉴 이름.
- title-md (17 Bold, 확장): 상단바 제목, 카드 제목, **버튼 글자**, 합계 라벨.
- body-md (16): 메뉴명, 목록 항목, 설명 본문.
- label-md (14): 가격 숫자, 탭·칩 글자.
- body-sm (13): 캡션, 원화 환산(약 ○○원), 원어 메뉴명, EUR 단위, 하단 탭 라벨, 고지 문구.
- 큰 제목은 Bold 대신 **Medium(500)**. 굵기로 위계를 만들지 말고 크기 차이로 만든다.
- 가격 표기: `EUR`(body-sm·secondary) + 숫자(label-md 또는 title-md·on-surface) + `약 ○○원`(body-sm·secondary).

## Layout

- **[확정] 4pt 그리드, 6개 값만**: xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32. 이 밖의 여백은 쓰지 않는다.
- 화면 좌우 여백 = xl(24).
- 카드 안쪽 = xl(24). 카드와 카드 사이 = lg(16). 메뉴 2열 그리드 사이 = md(12).
- 목록 줄 간격 = lg(16). 아이콘–글자 = sm(8). 썸네일–글자 = md(12).
- 섹션과 섹션 사이 = 2xl(32). 상단바 → 헤드라인 = xl(24).
- 화면 아래 떠 있는 바·버튼의 아래 여백 = 2xl(32).
- 상단바: 높이 56 = 뒤로 버튼 44 + 위아래 6(예외, 버튼 크기에서 나온 값).
- 스크롤 화면은 마지막 콘텐츠 아래에 떠 있는 바 높이 + 2xl 만큼 여백을 둔다.

## Elevation & Depth

- **[확정] 카드는 그림자 없이** neutral 배경과 surface 카드의 명도 차이로만 구분한다.
- shadow-sm: 지도 위 알약·버튼, 지도 핀.
- shadow-md: 화면 위에 떠 있는 블랙 바(장바구니 바), 바텀시트.
- **[관찰] 리퀴드 글래스는 홈 하단 내비 하나에만** 쓴다(반투명 블랙 55% + 배경 블러 24 + 흰 테두리 18%). 나머지 떠 있는 바·버튼은 primary 단색.
- 카드 안에 카드를 넣지 않는다. 한 단계 안쪽 박스가 필요하면 neutral 또는 info-bg 면을 쓴다.

## Shapes

- **[확정] rounded 3개 + full**: sm 14 · md 20 · lg 24 · full 999.
- sm(14): 썸네일, 안내 박스, 장바구니 메뉴 사진.
- md(20): 버튼, 식당·메뉴 상세 사진.
- lg(24): 카드, 바텀시트 위쪽 모서리.
- full: 칩, 탭, 알약 버튼, 아바타, 원형 버튼(뒤로·담기·카메라).
- 카드·버튼·사진은 코너 스무딩 60%(스쿼클). 코드에서 지원이 안 되면 일반 radius로 둔다.

## Components

컴포넌트 목록과 계약서 위치는 `src/components/index.md`. 공통 규칙만 여기에 적는다.

- **Button**: variant `primary | secondary | brand`. 높이 56, rounded-md, 글자 title-md. **한 화면에 primary는 하나만** 둔다(영수증: '홈으로 가기' primary + '추가 주문하기' secondary).
- **IconButton**: 44 원형. 뒤로 버튼은 항상 화면 왼쪽 위, 꺾쇠 아이콘 20.
- **Chip**: 카테고리 탭·필터. 선택 = primary 배경 + on-primary 글자, 기본 = surface 배경 + on-surface 글자.
- **Card**: surface, rounded-lg, 안쪽 xl. 그림자 없음.
- **MenuCard**: 사진 + 원어명 + 한국어 이름 + 가격. 사진 오른쪽 아래 44 담기 버튼. 담긴 메뉴는 담은 사람 색 오버레이 + 태그.
- **Avatar**: person 색 배경 + 이름 첫 글자. 34 / 40. 여러 명이면 -8 겹침, 테두리 2px neutral.
- **CartBar**: 화면 아래 떠 있는 primary 바(높이 64, full). 왼쪽 문구, 오른쪽 brand 알약.
- **AICard**: AI가 만든 정보 전용. surface + ai-gradient 테두리 1.5 + AI 아이콘 + 출처 문구 필수.
- **InfoNote**: info-bg 박스, ⓘ 아이콘 + body-sm. 코페르토·물값 같은 현지 관습 설명.
- **BottomSheet**: surface, 위 모서리 lg, 손잡이 40×5, shadow-md.

모든 인터랙티브 요소는 **default · pressed · focus · disabled · loading** 상태를 가진다. pressed = primary-pressed / brand-pressed, disabled = disabled 색, loading = 글자 대신 점 3개.

## Do's and Don'ts

**Do**
1. 색은 YAML에 있는 토큰 이름(`var(--color-…)`)으로만 쓴다.
2. 버튼·아이콘 버튼·담기 버튼의 터치 영역은 44×44 이상으로 만든다.
3. AI가 만든 정보에는 AI 아이콘과 출처 문구("AI가 … 설명했어요", "… 다를 수 있어요")를 함께 넣는다.
4. 가격은 항상 EUR과 원화 환산을 같이 보여준다.
5. 시간은 24시간제(22:30), 문구는 존댓말 '~요' 체로 쓴다.

**Don't**
1. 컴포넌트·화면 파일에 HEX 색(`#xxxxxx`)이나 rgb 값을 직접 쓰지 않는다. (검사: `src/` 안 `.tsx`·`.ts`·`.css` 파일 중 `tokens.css`를 뺀 곳에서 `#[0-9A-Fa-f]{6}` 검색 결과 0건)
2. spacing 6개(4·8·12·16·24·32) 밖의 여백 값을 쓰지 않는다. (검사: `margin|padding|gap`에 다른 px 값 0건)
3. 한 화면에 primary 버튼을 두 개 이상 두지 않는다.
4. brand(그린)를 주요 버튼 배경이나 본문 글자색으로 쓰지 않는다. 핵심 행동 알약·아이콘에만 쓴다.
5. ai-gradient·ai-text를 AI가 만들지 않은 정보(메뉴판 원문에서 확인된 정보)에 쓰지 않는다.
6. 화면 배경에 그라디언트를 깔지 않는다. 예외: 홈 상단, 영수증 상단 (**[확인 필요]** 팀 결정 전까지 1차 구현에서는 단색).
7. 13px 미만 글자를 쓰지 않는다.
8. 메뉴 사진을 AI로 생성하지 않는다. 사진이 없으면 neutral 면 + "사진 준비 중".
