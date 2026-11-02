---
version: "alpha"
name: "Hanip"
description: "메뉴판 번역과 함께 주문하기를 위한 모바일 디자인 규칙 · 9주차"
colors:
  primary: "#000000"
  secondary: "#55545E"
  tertiary: "#D94878"
  neutral: "#F5F5F7"
  surface: "#FFFFFF"
  primary-pressed: "#262626"
  disabled: "#E8E8ED"
  gradient-start: "#FFDED5"
  gradient-end: "#F7BDCA"
typography:
  h1:
    fontFamily: "Noto Sans KR"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.5
  h2:
    fontFamily: "Noto Sans KR"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.5
  h3:
    fontFamily: "Noto Sans KR"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
  body-md:
    fontFamily: "Noto Sans KR"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label-sm:
    fontFamily: "Noto Sans KR"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
rounded:
  sm: "12px"
  md: "16px"
  lg: "24px"
x-hanip-shadows:
  card: "0 8px 28px rgba(71,51,41,0.09)"
  floating: "0 12px 32px rgba(0,0,0,0.10)"
---
# Hanip DESIGN.md

## Overview

한입은 해외 메뉴를 읽고, 한국 음식에 빗대어 이해하고, 동반자와 주문할 메뉴를 정리하는 모바일 서비스다. 밝은 피치·핑크 그라데이션은 홈과 안내 흐름의 정체성으로 유지한다. 메뉴·상세·장바구니·주문내역은 흰 바탕에서 정보가 먼저 읽히게 한다. 블루를 소유자 구분 색으로 사용하지 않는다.

이 문서가 UI 변경의 기준이다. 기준 화면은 390×844 CSS px이며 360~440px에서 검수한다. 원본 사용자 작업과 API 로직을 보존한다. 핵심 적용 화면은 홈·메뉴판·장바구니 3개다.

과제 범위는 의미 토큰 25개(9+5+6+3+2)이며, Primitive 지원 값과 컴포넌트 고유 색/크기는 별도로 센다. 위 YAML은 Light 기준이다. 양 모드의 모든 값은 `design/mj/week09/tokens.json`에 있다. Dark는 토큰 대비 검증용이며 앱의 Dark 출시를 뜻하지 않는다.

Google 공식 DESIGN.md alpha 명세의 8개 섹션 순서를 따른다. 명세에 그림자 그룹이 없으므로 `x-hanip-shadows`는 명시적인 프로젝트 확장이다. 이를 공식 표준 키라고 주장하지 않는다.

참고: https://github.com/google-labs-code/design.md/blob/main/docs/spec.md

## Colors

| 역할 | Light | Dark | 적용 |
|---|---|---|---|
| primary | #000000 | #FFFFFF | 본문·제목·검은 CTA |
| secondary | #55545E | #C5C5CE | 보조 문장·원문·가격 환산 |
| tertiary | #D94878 | #F080A3 | 핑크 위치 아이콘·강조 |
| neutral | #F5F5F7 | #17171A | 화면 바탕 |
| surface | #FFFFFF | #202024 | 정보 카드·반전 글자 |
| primary-pressed | #262626 | #DCDCE2 | 주 버튼 누르는 상태 |
| disabled | #E8E8ED | #3B3B43 | 비활성 면·구분선 |
| gradient-start | #FFDED5 | #38232A | 그라데이션 시작 |
| gradient-end | #F7BDCA | #432535 | 그라데이션 끝 |

홈 배경은 gradient-start에서 gradient-end로 100deg 방향을 만들고 아래로 surface에 자연스럽게 연결한다. body-md/label-sm 보조 글자는 secondary를 사용하고 실제 바탕 대비를 WCAG 상대 휘도로 계산해 4.5:1 이상인지 확인한다. HSL 명도 차이 45와 대비비 4.5:1은 다른 지표다.

컴포넌트 예외: 별은 #FFC400(장식+숫자 병기), 못 먹는 재료 배지는 #FF7800이다. 주황색 배지의 작은 흰 글자는 대비가 낮아 검정 글자로 교정한다. 이 두 고유 색을 25개 기초 토큰 수에 몰래 포함하지 않는다. 지도/음식/프로필 이미지의 색은 콘텐츠다. 원본 구글맵의 로고·저작권·필수 사진 출처를 제거하지 않는다.

## Typography

| 토큰 | 크기/굵기 | 행간 | 용도 |
|---|---|---|---|
| h1 | 26px / 700 | 39px | 홈 핵심 문장 |
| h2 | 18px / 700 | 27px | 화면·섹션 제목 |
| h3 | 16px / 700 | 24px | 메뉴명·주요 기능 |
| body-md | 14px / 400 | 21px | 설명·가격·목록 |
| label-sm | 12px / 400 | 18px | 원문·환산·보조 정보 |

Noto Sans KR를 우선하고 sans-serif를 대체로 사용한다. 텍스트의 크기는 다섯 단계만 쓴다. 10/11px 캡션은 12px로 통일한다. CSS px는 Figma px와 맞추되 실제 기기 확대 설정을 막지 않는다. 폰트·굵기·행간은 Text Style 한 묶음이고 크기 FLOAT Variable 5개와 연결한다.

## Layout & Spacing

4px 격자를 사용한다. xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24px. 화면 좌우 여백은 20px, 카드 안쪽은 16px, 두 열 간격은 12px이다. 섹션 사이 32px는 lg×2 계산값으로 7번째 토큰이 아니다. 제목과 첫 행은 8px, 사진과 텍스트는 12px 간격을 기본으로 한다.

360~440px 안에서 고정 넓이 때문에 가로 스크롤이 생기지 않게 한다. 두 열은 minmax(0,1fr), 긴 원문은 줄바꿈한다. 주요 터치 영역은 최소 44×44px다. 작은 아이콘의 시각 크기와 실제 버튼 영역은 별도로 관리한다.

상·하단은 env(safe-area-inset-*)를 포함한다. 고정 하단 버튼·내비게이션 높이만큼 콘텐츠 공간을 확보한다. 장바구니는 소유자 제목/소계와 하단 총액을 유지하며 음식 목록만 각각 스크롤한다. 내부 목록은 키보드 포커스와 소유자 이름을 제공한다.

## Elevation & Depth

card: 0 8px 28px rgba(71,51,41,.09), floating: 0 12px 32px rgba(0,0,0,.10). Dark는 각각 .30/.45 검정 그림자다. 일반 카드와 고정 액션의 역할을 구별한다. 홈 순위 전체에 흰 박스나 그림자를 추가하지 않는다.

Figma는 그림자 전용 Variable 타입이 없으므로 두 STRING Variable을 Primitive에 alias하고 동일 값의 Effect Style을 별도로 등록한다. STRING이 effect 속성에 직접 바인딩됐다고 주장하지 않는다. 카메라의 리퀴드 글래스는 투명 면·흐림·안쪽 빛의 컴포넌트 레시피이며 일반 카드에 퍼뜨리지 않는다.

## Shapes

sm=12, md=16, lg=24px. 음식 사진은 sm, 작은 입력/버튼은 md, 큰 정보 카드는 lg를 쓴다. 동그란 프로필은 50%, 캡슐은 높이/2의 기하 규칙이며 네 번째 기초 반경 토큰이 아니다. 사용자 Figma에서 확정한 홈 카메라 177×120px/반경51px는 유일한 브랜드 컴포넌트 예외로 유지한다.

## Components

- 화면 템플릿: 상단 제목/뒤로가기, 유연한 콘텐츠, 안전 영역을 포함한 하단 액션. 홈만 브랜드 그라데이션을 쓴다.
- QuickCard: 흰 카드, card 그림자, 16px 제목과 12px 보조문장. 기존 이벤트 속성을 보존한다.
- FoodCard: 정사각 사진 → 원문 → 한국어 메뉴명 → 설명 → EUR와 원화의 한 줄 가격. 못 먹는 재료는 사진 안 주황 배지로 표시한다. 추정 정보는 확정 사실과 구별한다.
- RankRow: 사진·순위·메뉴명/식당 원문·노란 별/검정 숫자. 홈은 최대 5개, 오른쪽 전체 보기로 전체 목록 이동.
- OwnerGroup: 이름·아바타·수량의 고정 제목, 독립 스크롤 음식 목록, 소계. 나/동반자를 색만으로 구별하지 않는다.
- PrimaryButton: 검정 면/흰 글자, pressed는 primary-pressed. disabled 면에는 secondary 글자와 실제 disabled 상태를 준다. 44px 이상 높이.
- 로딩은 진행 문구·비활성 중복 제출로, 빈 상태는 다음 행동 버튼으로, 오류는 이유·다시 시도로 설명한다. 시연 데이터와 실제 API 데이터의 구분을 유지한다. 실제 메뉴판 인식은 서버/할당량에 영향을 받으며 이번 스타일 검증이 API 성공을 보증하지 않는다.

## Do's and Don'ts

1. D01: UI를 만들거나 고치기 전에 DESIGN.md를 읽는다. 새로운 기초 값은 문서와 tokens.json을 먼저 고친다.
2. D02: 핵심 3개 화면의 본문·원문·캡션은 5개 타입 중 하나여야 한다. 12px 미만 글씨를 추가하지 않는다.
3. D03: secondary는 실제 surface/neutral/gradient 바탕에서 4.5:1 이상이어야 한다. 흐린 회색이나 opacity로 글씨 대비를 낮추지 않는다.
4. D04: 좌우 20px, 카드 16px, 두 열 12px를 사용한다. 19px/13.5px처럼 우연히 생긴 간격을 재사용하지 않는다.
5. D05: 클릭 가능한 요소의 실제 영역은 44×44px 이상이다. +/- 기호만 커졌다고 충족으로 판정하지 않는다.
6. D06: 360/390/440px에서 가로 넘침 0px, 하단 내비게이션/액션에 가려지는 마지막 콘텐츠 0개를 확인한다.
7. D07: 주 버튼은 기본·누름·비활성·로딩을 정의한다. 포커스 테두리는 보이고 reduced-motion에서 장식 전환을 끈다.
8. D08: 장바구니 소유자 제목과 소계는 움직이지 않고 각 음식 목록만 스크롤한다. 이름 없이 색으로만 소유자를 표시하지 않는다.
9. D09: 배지의 못 먹는 재료 정보와 API 원문을 없애지 않는다. 일반 레시피 추정은 메뉴판에 적힌 사실로 표시하지 않는다.
10. D10: API 주소·호출·data-* 이벤트·계산식은 스타일 변경으로 바꾸지 않는다. 음식 수량과 팁 5/10/15/직접 입력 및 총액을 재검증한다.
11. D11: 그라데이션은 홈의 피치/핑크를 유지하고 메뉴·장바구니는 흰색으로 한다. 블루 소유자 표시나 모든 카드의 글래스 효과를 추가하지 않는다.
12. D12: Figma Semantic은 25개, 모두 Primitive alias, Light/Dark 누락 0개, scopes와 WEB 코드 구문을 확인한다. 지원 Primitive와 예외 색을 더한 총 변수 수를 25개라고 오기하지 않는다.

검증 이력·규칙 추가 목록·실행 증거는 `design/mj/week09/README.md`에서 연결한다. COMPASS Design System 1.0.15는 현재 정적 앱/Android 의존성과 로컬 Figma 라이브러리에서 설치를 확인하지 못했다. 설치되었다고 주장하거나 임의 버전을 추가하지 않는다.

### 독립 검토 후 추가한 규칙

13. D13: 아바타·수량 기호도 폰트 크기와 행간은 타입 토큰을 따르고, 가운데 정렬은 flex로 해결한다. 네이티브 option의 최종 렌더링은 OS별 차이를 기록한다.
14. D14: 검수 기준은 360/390/440×844 CSS px, 기본 글자 배율이다. 검수 기록에는 화면 폭과 글자 배율을 함께 적는다.
15. D15: 포커스와 필수 비텍스트 아이콘은 인접 면 대비 3:1을 목표로 하고 모든 아이콘 버튼은 접근 가능한 이름을 갖는다. 키보드 Tab으로 포커스 표시를 확인한다.
16. D16: 로딩은 진행 문구와 중복 제출 차단, 빈 화면은 메뉴 둘러보기, 오류는 다시 시도를 포함한다. 상태 예시 캡처와 실제 서버 장애 재현 여부를 분리해 적는다.
17. D17: 그라데이션 위 보조 글자는 시작·끝 색 모두 대비 4.5:1 이상을 만족시킨다. 이미지 위 텍스트는 별도 불투명 면을 두거나 실제 합성 배경을 측정한다. 이번 Light secondary는 독립 검토 결과 #62626C에서 #55545E로 교정했다.
