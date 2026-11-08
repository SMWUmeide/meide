# MEIDE v2 디자인 명세

> 작성 기준: 2026-11-09 · Figma 현재값과 이 대화에서 확정한 디자인 규칙
> 원본: [연주 · 10주차](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=65-705)
> 범위: 홈 6종, 메뉴판, 메뉴 상세, 장바구니, 영수증 및 meide v2 디자인 토큰
> 개정: 글래스 배경 70%, 메뉴 상세 하단 플로팅 CTA, 마드리드 음식 예시, 장바구니 스크롤·시트 사이 빈 공간 제거를 원본 Figma에 반영했다. 저장소 푸시·배포는 하지 않았다.

## 1. 문서의 기준과 적용 범위

- **확정 규칙**은 사용자가 정한 디자인·동작 기준이다.
- **현재 구현 상태**는 이번 작성 시점에 Figma에서 직접 읽은 값이다.
- 둘이 다르면 마지막의 **미해결 항목**을 확인한다. 현재 화면이 모든 확정 동작을 구현했다고 간주하지 않는다.
- 화면의 메뉴·이름·가격·지역·날짜·평점은 예시 콘텐츠다. 실제 API 데이터나 실시간 환율로 해석하지 않는다.
- 온보딩, 지도 상세, 메뉴 촬영·인식, 주문 문장 생성 결과, 평가 작성, 동반인 관리, 마이페이지는 이번에 확인한 10개 화면 범위에 포함되지 않는다. 이 문서만으로 해당 화면이 완성되었다고 판단하지 않는다.
- 기존 `MEIDE / 화면 확장` 변수는 이전 파란색 테마 자산으로 보존한다. 신규 화면은 `meide v2`를 기준으로 한다.

## 2. 화면 목록

| 화면 | Figma | 현재 프레임 크기 |
|---|---|---|
| 1 - 식당 안, 메뉴판 데이터 X | [66:1027](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=66-1027) | 412 × 917px |
| 1 - 식당 안, 메뉴판 데이터 O | [66:1079](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=66-1079) | 412 × 917px |
| 1-2 주문 후 | [66:1134](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=66-1134) | 412 × 917px |
| 2 - 여행 지역 내 | [66:1191](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=66-1191) | 412 × 917px |
| 3 여행 지역 외 - 여행지 미선택 | [66:1251](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=66-1251) | 412 × 917px |
| 3 여행 지역 외 - 여행지 선택 | [66:1311](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=66-1311) | 412 × 917px |
| 메뉴판 · 메뉴를 골라주세요 | [67:1524](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=67-1524) | 412 × 917px |
| 메뉴 상세 · 호박과 고대 밀 수프 | [78:2158](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=78-2158) | 412 × 917px, 스크롤 콘텐츠 1479px |
| 장바구니 · 함께 담은 장바구니 | [78:2362](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=78-2362) | 412 × 917px |
| 영수증 · 영수증 미리보기 | [78:2472](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=78-2472) | 412 × 1081px |

412px은 시안의 기준 너비다. 917px은 주요 화면의 기준 프레임 높이이며, 메뉴 상세는 917px 뷰포트 안에서 1479px 콘텐츠를 스크롤한다. 영수증의 더 긴 프레임은 콘텐츠 길이를 나타낸다. 앱의 실제 화면 높이를 917px로 고정하지 않는다.

## 3. 공통 레이아웃과 그리드

| 항목 | 기준 |
|---|---|
| 화면 좌우 여백 | 24px |
| 기본 콘텐츠 너비 | 364px = 412 − 24 × 2 |
| 가로 그리드 | 4열, 열 너비 79px, 거터 16px |
| 메뉴판 카드 배치 | 2열, 카드 하나가 그리드 2열 점유 |
| 메뉴판 카드 너비 | 174px = 79 × 2 + 16 |
| 메뉴 카드 가로·세로 간격 | 16px |
| 일반 콘텐츠 카드 | 라운딩 32px, 내부 여백 24px |
| 일반 카드 사이 | 24px |
| 타이틀 ↔ 설명 | 4px |
| 텍스트 묶음 ↔ 버튼 | 16px |
| 메뉴 카드 내부 여백 | 16px |
| 메뉴명 묶음 ↔ 가격 묶음 | 16px |
| 원어 ↔ 한글 메뉴명 | 4px |
| 외화 가격 ↔ 원화 환산 | 4px |
| 재료 칩 사이 | 가로·세로 모두 4px |

### 레이아웃 적용 원칙

- 글자 잉크의 외곽 대신 **텍스트 레이어의 행 높이와 컨테이너 경계**를 기준으로 간격을 맞춘다.
- 한글 글리프가 행 박스에 꽉 차지 않는 것은 자연스럽다. 글자를 맞추려고 카드별로 다른 음수 여백을 넣지 않는다.
- 같은 역할의 요소는 같은 토큰을 사용한다. 4px은 짧은 설명 연결, 16px은 묶음 구분, 24px은 카드 수준 여백에 사용한다.
- 카드 내부의 모든 간격을 24px로 강제하지 않는다. 실제 카드의 8·16·18px 등 하위 묶음 간격은 별도 구조다.
- 콘텐츠는 Auto Layout에 대응하는 흐름 배치로 구현한다. Figma의 전체 y좌표를 그대로 고정하는 방식은 피한다.
- 좁은 기기·큰 글자 설정에서는 내용이 잘리지 않도록 반응형 검증이 필요하다. 현재 412px 시안만으로 다른 너비에서의 통과를 보장하지 않는다.

## 4. 타이포그래피

폰트는 **Pretendard**를 사용하며, 기존 `meide v2` 텍스트 스타일을 재사용한다.

| 스타일 | 크기 | 굵기 | 행간 | 자간 |
|---|---:|---|---:|---:|
| Display 30 M | 30px | Medium | 125% | -3% |
| Heading 22 M | 22px | Medium | 130% | -2% |
| Title 17 B | 17px | Bold | 140% | -1% |
| Body 16 M | 16px | Medium | 145% | -1% |
| Label 14 M | 14px | Medium | 140% | -1% |
| Caption 13 R | 13px | Regular | 145% | -1% |
| Tiny 11 M | 11px | Medium | 130% | 0% |

- Regular = 400, Medium = 500, Bold = 700.
- 기존 스타일 7종의 `fontSize`는 Typography 변수에 연결되어 있다.
- 원본 스타일의 행간·자간은 **% 단위 그대로** 유지되어 있다. Typography 변수의 line-height·letter-spacing은 같은 시각적 크기를 나타내는 **px 환산값**이다.
- 현재 행간·자간 변수가 원본 텍스트 스타일에 모두 바인딩되어 있는 것은 아니다. 원본 스타일을 바꿀 때 두 표현의 동기화를 확인한다.
- font/family 및 weight/style 변수도 제공하지만 모든 텍스트의 가족·굵기가 변수에 연결되었다고 가정하지 않는다.
- 상태 표시줄의 시스템 텍스트·심벌은 콘텐츠 타이포와 별도로 다룬다.

### 텍스트 길이와 말줄임

| 대상 | 규칙 |
|---|---|
| 메뉴판 원어 메뉴명 | 1줄, 초과 시 끝 말줄임 |
| 메뉴판 한글 메뉴명 | 최대 2줄, 초과 시 끝 말줄임 |
| 한글 메뉴명 영역 | 내용이 짧아도 2줄 높이 유지: 현재 48px |
| 원어 메뉴명 영역 | 현재 15px 높이 |
| 메뉴 카드 텍스트 가용 너비 | 142px = 174 − 16 × 2 |
| 메뉴 상세 제목 | 전체 메뉴명을 확인할 수 있도록 줄바꿈 허용 |

말줄임은 **글자 수가 아니라 실제 너비와 줄 수**로 결정한다. 같은 글자 수도 원어·한글·폰트 굵기에 따라 차지하는 폭이 다르다. 접근성 이름과 상세 화면에는 전체 이름을 제공한다.

현재 메뉴 카드의 15px·48px 텍스트 영역은 컴포넌트 고유 치수다. 전체 타이포 스타일을 기계적으로 대입해 해당 높이를 바꾸지 않는다.

## 5. 컬러와 표면

| 역할 | 토큰 | 값 |
|---|---|---|
| 기본 배경 | background/page | #F2F4F6 |
| 카드 | background/card | #FFFFFF |
| 내부 구분 배경 | background/inset | #ECEEF1 |
| 주요 초록 버튼 | action/primary | #176B38 |
| 단색 CTA | action/solid | #212121 |
| 글래스 바탕색 | background/glass-base | #202322 / alpha 70% |
| 주요 글자 | text/primary | #212121 |
| 보조 글자 | text/secondary | #626773 |
| 약한 보조 글자 | text/muted | #91949E |
| 반전 글자 | text/inverse | #FFFFFF |
| 개인 알레르기 경고 | status/allergy | #DB2626 |
| AI 강조 | ai/accent | #5A5FD8 |
| 재료 칩 테두리 | border/ingredient | #DCDDF7 |

### 추가 팔레트

| 토큰 | 값 |
|---|---|
| pastel/peach | #FFBE9B |
| pastel/sky | #A5E4FF |
| pastel/yellow | #FFE291 |
| pastel/mint | #ACF5C3 |

추가 팔레트의 특정 사용자·동반인 매핑은 아직 확정되지 않았다. 색만으로 사람을 구별하지 않고 이름 또는 이니셜을 병기한다.

### 표면별 사용

- **홈 주요 버튼:** 진한 초록.
- **메뉴판·메뉴 상세의 떠 있는 캡슐:** 차콜 글래스 표면과 초록 실행 버튼.
- **장바구니 하단 시트:** 흰색 단색 시트, 차콜 단색 CTA.
- **영수증:** 흰색 카드, 차콜 단색 주요 CTA, 흰색 보조 버튼.
- 같은 색의 반복보다 **같은 역할에 같은 표면을 쓰는 것**을 일관성 기준으로 한다.
- 대비 검사는 실제 사진 위 합성 결과와 기본·선택·비활성 상태를 기준으로 별도 실시한다. 이 문서는 접근성 대비 인증 결과가 아니다.

## 6. 라운딩·크기·효과

| 요소 | 크기 또는 높이 | 라운딩 |
|---|---|---|
| 일반 카드 | 기본 너비 364px | 32px |
| 메뉴 카드 | 174 × 306px | 24px |
| 메뉴 카드 사진 | 174 × 148px | 카드 상단 모양을 따름 |
| 홈 주요 버튼 | 높이 56px | 28px |
| 플로팅·하단 주요 CTA | 높이 64px | 32px |
| 아이콘 버튼 | 44 × 44px | 22px |
| 수량 칩 | 99 × 36px | 18px |
| 재료 칩 | 높이 35px | 999px, 완전한 캡슐 |
| 메뉴 행 썸네일 | 72 × 72px | 실제 컴포넌트 참조 |
| 아바타 | 32 또는 40px | 원형 |
| 홈 인디케이터 | 134 × 5px | 3px, 화면 하단에서 12px |

홈 인디케이터는 Figma 시안용 요소다. 실제 앱에서는 운영체제의 안전 영역과 시스템 표시를 존중하고 중복으로 그리지 않는다.

### 글래스·그림자

재사용 효과 스타일:
- `meide v2/Glass/Charcoal floating`
- `meide v2/Shadow/Bottom sheet`

| 속성 | 글래스 / 플로팅 |
|---|---:|
| 배경색 | #202322 |
| 적용한 배경 불투명도 | 70%, 텍스트·실행 버튼은 100% |
| Glass radius | 12 |
| Refraction | 0.18 |
| Depth | 12 |
| Light angle | −45° |
| Light intensity | 0.65 |
| Dispersion | 0.08 |
| 그림자 | x 0, y 6, blur 20, spread −4 |
| 그림자 색 | RGBA(20.4, 35.7, 25.5, 0.16) |

하단 시트 그림자는 x 0, y −6, blur 24, spread 0, 검정 8%다.

현재 Primitives의 `color/glass-charcoal` alpha와 이를 참조하는 `background/glass-base`가 0.7이다. 메뉴판·상세의 실제 배경 paint opacity도 0.7이며 node opacity는 1이다. 구현할 때 RGBA alpha와 추가 opacity를 중복 적용하여 49%로 만들지 않는다. Effects의 `glass/opacity=0.7`은 같은 기준을 문서화한 수치이며 색상 alpha와 자동 동기화되는 연결은 아니다.

Figma GLASS 효과는 단일 CSS blur와 일대일 대응하지 않는다. 구현 플랫폼에 맞게 시각 비교하며 조정한다. 글래스의 70%는 **배경 표면**의 투명도이며, 버튼·텍스트를 포함한 전체 컨테이너를 70%로 낮추라는 의미가 아니다.

## 7. 홈 화면 6종

### 7.1 식당 안 · 메뉴판 데이터 없음

- 지역·식당 인지 제목, 식당명, 메뉴판 촬영 CTA, 식당 정정 경로를 제공한다.
- 하단에 해당 식당의 한국인 메뉴 랭킹을 보여준다.
- 메뉴판 확보가 핵심 행동이며 주요 CTA는 진한 초록이다.

### 7.2 식당 안 · 메뉴판 데이터 있음

- 기본 구조는 데이터 없는 화면과 동일하다.
- 기존 메뉴판 선택을 우선 행동으로, 새 메뉴판 촬영을 보조 행동으로 제공한다.
- X/O 화면의 동일 역할 카드 높이·여백·버튼 스타일은 함께 관리한다.

### 7.3 주문 후

- 상단에 식사 인사, **방금 본 메뉴판**과 **메뉴 평가하기** 카드.
- 아래에는 **방금 주문한 내역** 요약: 메뉴·금액·메뉴 금액 합계.
- 요약 탭 시 주문내역 탭의 해당 영수증 화면으로 이동하는 흐름이 합의되었다.
- 내비게이션의 주문내역은 전체 기록 접근이고, 홈 요약은 방금 주문한 건의 문맥 제공이다.
- 예시 합계 €38.00은 메뉴 금액이며, 팁·부대요금 포함 합계와 구분한다.

### 7.4 여행 지역 내

현재 시안은 **내 주변 식당 찾기**, **아시안·한식당 추천** 두 행과 지역 랭킹을 보여준다.

지도 진입 후 아시안·한식당을 필터로 제공하는 통합 아이디어가 논의되었으나, 현재 시안에는 두 진입점이 남아 있다. 구현에서는 하나의 지도에 서로 다른 초기 필터를 주는 방법을 검토할 수 있으나, 최종 정보 구조 확정으로 간주하지 않는다.

### 7.5 여행 지역 외 · 여행지 미선택

- 여행지 선택 카드와 주요 CTA.
- 아래에 한국인이 많이 평가한 음식 랭킹.
- 여행지 선택 전후 상태를 분리한다.

### 7.6 여행 지역 외 · 여행지 선택

- 선택한 여행지에 맞는 제목과 지역명.
- 식당 탐색 카드와 지도 진입 CTA.
- 여행지 음식 랭킹.
- 마드리드 예시로 음식명과 썸네일을 교체했다: 오징어튀김 샌드위치 / 코시도 · 병아리콩 고기 스튜 / 추로스와 핫초콜릿 / 칼로스 · 소 내장 스튜.
- 순위 1–4와 별점 4.8·4.8·4.7·4.7은 레이아웃 확인용 예시이며, 실제 한국인 평가 순위가 아니다.
- 음식 선정과 사진 출처: [마드리드 공식 관광 사이트 · Recetas de Madrid](https://www.esmadrid.com/recetas-madrid). 사진별 출처는 부록 C에 기록했다.

### 공통 하단 내비게이션

홈 / 주문내역 / 동반인 / 마이페이지. 밝은 표면을 유지한다. 각 화면의 선택 상태를 분명히 구별하고, 플로팅 장바구니와 동일한 기능으로 취급하지 않는다.

## 8. 메뉴판

### 구성

식당 제목 → 동반인 상태 → 카테고리 탭 → 카테고리 제목·메뉴 수 → 2열 카드 → 플로팅 장바구니.

### 메뉴 카드

- 사진 148px + 정보 영역 158px = 총 높이 306px.
- 정보 영역은 좌우·상하 16px.
- 원어 1줄 + 한글 2줄 고정 묶음, 가격 + 원화 환산 묶음.
- 사진이 없으면 사진 준비 중 플레이스홀더를 사용한다.
- 사진 우측 하단에 추가 버튼. 기준 사진 경계에서 오른쪽·아래 12px.
- 카드 본문 선택은 메뉴 상세 진입, 추가 버튼은 장바구니 담기다. 탭 영역의 동작을 구분한다.

### 카드 추가 상태

| 상태 | 표시 | 동작·의미 |
|---|---|---|
| 기본 | 흰 원형 + | 해당 메뉴 추가 |
| 추가 피드백 | 왼쪽으로 확장하는 캡슐, “○○님이 담았어요” | 누가 추가했는지 안내 |
| 완료 | 체크 원형 | 담김 상태 유지 |

캡슐은 우측 기준점을 유지하며 왼쪽으로 확장한다. 이름이 길 때의 말줄임과 사진 영역 밖 넘침을 검증한다. 현재 메뉴판은 일부 항목에 차콜 체크 상태가 보인다. 체크를 다시 눌렀을 때 삭제·수량 변경 여부와 피드백 표시 시간은 확정되지 않았다.

### 맞춤형 알레르기 배지

- 사진 **왼쪽 상단**에 배치한다.
- 현재 여행자의 등록 알레르기와 관련된 경고다. 일반 재료 설명용 배지로 사용하지 않는다.
- “버섯 포함”처럼 텍스트로 이유를 표시한다. 색만으로 경고를 전달하지 않는다.
- 확인된 원문 정보와 AI의 가능성 판단은 상세에서 구분한다.
- 배지가 없다는 사실만으로 안전이 검증되었다는 표시를 만들지 않는다.
- 현재 수프 예시의 메뉴명·배지 재료 대응은 실제 데이터 적용 전에 재검증한다.

## 9. 플로팅 장바구니·메뉴 상세 CTA 상태

### 사용자가 확정한 전환 규칙

| 이벤트 | 결과 |
|---|---|
| 아래로 스크롤 | 캡슐 → 원형 축소 |
| 위로 스크롤 | 원형 → 캡슐 확장 |
| 원형 탭 | 캡슐 확장 |
| 본문 끝 도달 | 캡슐 유지 |
| 메뉴판 캡슐 오른쪽 “3개 보기” 탭 | 장바구니 이동 |

원형 탭은 장바구니로 즉시 이동하는 동작이 아니다. 원형 탭으로 확장한 다음 오른쪽 실행 버튼을 누른다. 본문 끝 유지 규칙은 아래 스크롤 축소 규칙보다 우선한다.

### 화면별 캡슐 내용

| 화면 | 왼쪽 | 오른쪽 |
|---|---|---|
| 메뉴판 | 장바구니 아이콘 + 함께 담은 장바구니 | N개 보기 |
| 메뉴 상세, 담기 전 | 장바구니에 담기 | 담기 |

현재 메뉴 상세 시안에는 왼쪽 “장바구니에 담기”, 오른쪽 “담기”가 그대로 존재한다. 두 문구가 중복된다는 이유로 임의 삭제하거나 가격으로 교체하지 않는다.

담은 후 메뉴 상세 CTA가 “함께 담은 장바구니”로 전환되는지, 반복 담기·수량 변경을 제공하는지는 후속 확정이 필요하다. 스크롤 감지 임계값·탭 후 확장 유지 시간은 미정이다.

### Figma에 반영한 상태와 프로토타입 범위

- 컴포넌트: [meide v2 / Detail floating CTA](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=111-229).
- 상태: `State=Expanded`, `State=Collapsed`, `State=End`.
- [상태 비교 보드](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=111-237)는 위에서부터 확장 / 축소 / 본문 끝 순서다. 메뉴 상세 원본 아래 빈 공간에 배치했다.
- 기본은 Expanded. Collapsed는 우측 64 × 64px 원형, End는 Expanded와 같은 외형이다.
- 상태를 바꿀 때 우측 위치가 흔들리지 않도록 각 variant 외곽 크기는 364 × 64px로 유지한다. 원형은 이 외곽 오른쪽 끝에 배치한다.
- 원형 표면에 `On click → Change to Expanded`를 연결했다. 미리보기 전환값은 Smart Animate 200ms / Ease out이다. 이는 이번 시안의 조정 가능한 기본값이다.
- **현재 도구의 프로토타입 Trigger에는 스크롤 방향·본문 끝 감지 이벤트가 없다.** 따라서 자동 축소·확장·본문 끝 유지의 시각 상태와 규칙은 준비했지만 실제 스크롤 기반 자동 전환은 앱 구현 단계에서 연결해야 한다.
- `담기` 실행 후 장바구니 데이터 변경은 디자인 프로토타입에 구현하지 않았다. UI 상태와 실제 서비스 로직을 구분한다.

## 10. 메뉴 상세

현재 시안의 콘텐츠 순서:
1. 대표 이미지와 실제 음식과 다를 수 있다는 안내.
2. 원어·한글 메뉴명, 외화 가격·원화 환산.
3. “한국 음식으로 치면” 설명 카드.
4. “메뉴판에 적힌 정보” 카드.
5. “AI가 추정한 정보” 카드.
6. 콘텐츠와 분리된 하단 고정 “장바구니에 담기” 캡슐.

### 카드와 재료 칩

- 카드 너비 364px, 라운딩 32px, 패딩 24px, 카드 사이 24px.
- 제목과 바로 이어지는 설명은 4px.
- 확인된 재료와 AI 추정 재료를 **동일한 칩 모양**으로 표시한다.
- 칩 높이 35px, 좌우 패딩 14px, 상하 패딩 7px, 라운딩 999px.
- 칩 텍스트는 Pretendard 13 Regular 기준, 칩 간 가로·세로 간격 4px.
- 보충 설명은 칩 내부에 넣지 않고 칩 묶음 아래에 별도 텍스트로 배치한다.
- 출처는 카드 제목과 설명으로 구분한다. 동일한 칩 디자인이 동일한 확실성을 뜻하지 않는다.

현재 확인된 정보 카드의 내부 주 간격은 8px, AI 카드의 주 간격은 16px이다. 이는 카드 사이 24px 규칙과 다른 수준의 간격이다.

### 하단 플로팅 배치 — 반영 완료

| 요소 | 현재 값 |
|---|---|
| 화면 프레임 | 412 × 917px |
| 본문 스크롤 뷰포트 | x 0, y 0, 412 × 917px, 세로 스크롤 |
| 스크롤 콘텐츠 | 412 × 1479px |
| CTA 인스턴스 | x 24, y 817, 364 × 64px |
| CTA 하단 ↔ 화면 하단 | 36px |
| 홈 인디케이터 | x 139, y 900, 134 × 5px |
| 본문 시트 하단 패딩 | 124px |

CTA와 홈 인디케이터는 스크롤 뷰포트 바깥의 화면 직속 자식이다. 따라서 본문 스크롤 중에도 하단에 남는다. 마지막 카드의 끝은 최대 스크롤 시 y=793px로, CTA 시작 y=817px까지 24px 여유가 있다. 124px 하단 패딩은 CTA 64px + 하단 여유 36px + 본문 여유 24px을 합친 컴포넌트 값이다. 다른 기기에서는 안전 영역에 맞게 계산한다.

## 11. 장바구니

- 참여자별로 메뉴를 묶는다: 내 메뉴 / 미영님 메뉴.
- 내 메뉴와 동반인 메뉴 행의 텍스트·이미지·수량 영역은 같은 기준으로 정렬한다.
- 내 메뉴에는 수량 조절 컨트롤, 동반인에는 동일한 99 × 36px 수량 표시 칩.
- 메뉴 썸네일 72px, 카드 패딩 24px·라운딩 32px.
- 칩이 하단에서 잘리지 않도록 콘텐츠 높이와 최소 하단 여백을 확보한다.
- 메뉴 목록만 세로 스크롤되고 하단 결제 시트는 별도 영역이다.
- 하단 시트는 단색 흰색, CTA “주문 문장 만들기”는 차콜 단색.
- 시트 높이를 숫자로 고정하기보다 내용과 안전 영역에 맞춘다.

### 현재 프레임 치수

| 요소 | 값 |
|---|---|
| 메뉴 스크롤 영역 | x 0, y 110, 412 × 539px, 남은 높이 채우기 |
| 하단 결제 시트 | x 0, y 649, 412 × 268px |
| 내 메뉴 카드 | 364 × 294px |
| 미영님 메뉴 카드 | 364 × 423px |
| 카드 내부 주 간격 | 18px |

스크롤 영역 하단과 하단 시트 시작을 **649px에서 맞춰 외부 빈 공간을 0px로 정리했다.** 기존 35px 공간은 메뉴 스크롤 영역으로 편입했다.

- 화면은 고정 높이의 세로 Auto Layout, 하단 시트는 일반 흐름의 콘텐츠 높이(Hug), 메뉴 뷰포트는 남은 높이 채우기(Fill)로 구성한다.
- 하단 시트는 메뉴 스크롤 영역 밖에 있어 목록을 스크롤해도 움직이지 않는다. 시트 내용 높이가 바뀌면 메뉴 뷰포트가 남은 높이를 자동으로 차지한다.
- 현재 목록 콘텐츠 높이는 781px, 뷰포트 높이는 539px이므로 최대 스크롤 거리는 242px이다.
- 마지막 메뉴 카드 뒤의 **내부 하단 여백 24px은 유지**한다. 최대로 스크롤하면 마지막 카드 하단은 화면 y=625px, 시트 시작은 y=649px이므로 마지막 카드 전체를 24px 여유와 함께 볼 수 있다.
- 위쪽 목록과 시트 사이에 별도 35px 스페이서를 추가하지 않는다. 시트의 둥근 상단 모서리와 그림자는 유지한다.

### 금액 예시와 계산 기준

| 항목 | 계산 | 합계 |
|---|---|---:|
| 내 메뉴 | €10.00 × 1 + 10% 팁 | €11.00 |
| 미영님 메뉴 | (€10.00 + €18.00) + 10% 팁 | €30.80 |
| 함께 담은 메뉴 | €38.00 + €3.80 팁 | €41.80 |

- 미영님 원화 예시는 약 46,169원, 총액 원화 예시는 약 62,659원이다.
- 숫자 문자열을 이어 붙이거나 사람별 표시 금액을 재사용해 계산하지 않는다. 수량·단가·팁률을 기준으로 계산한다.
- 예시 환산율은 €1 = 1,499원에 해당한다. 실제 환율, 기준 시각, 반올림 방식은 별도 데이터 정책으로 정한다.
- 인별 환산액을 각각 반올림하면 전체 환산액과 1원 차이가 날 수 있다. 원화 표시값 합산 대신 원 통화 총액 기준으로 환산한다.

## 12. 영수증 미리보기

- 식당명·날짜·인원, 메뉴별 금액, 부대요금, 팁, 예상 합계를 표시한다.
- 일반 카드 기준인 라운딩 32px·패딩 24px 적용.
- 제목·설명 간격 4px, 주요 구간 사이 24px.
- “홈으로 가기”는 차콜 단색 CTA.
- “추가 주문하기”는 흰색 보조 버튼.
- 실제 식당 발행 영수증이 아니라 예상 비용 안내라는 문구를 유지한다.

### 금액 예시

| 항목 | 금액 |
|---|---:|
| 음식 | €38.00 |
| 코페르토 · 2명 | €5.00 |
| 선택 팁 10%, 음식 금액 기준 | €3.80 |
| 예상 합계, 물 제외 | **€46.80** |
| 물, 주문한 경우 추가 | +€3.00 |
| 물 포함 산술 예시 | €49.80 |

장바구니 €41.80과 영수증 €46.80의 차이는 코페르토 €5.00이다. 두 화면이 같은 비용 범위를 표현하는 것처럼 표시하지 않는다.

현재 원화 표시 약 70,154원은 예시 환산 결과다. 코페르토·물 요금 및 설명은 해당 예시 식당의 데이터로 검증해야 하며, 모든 식당에 동일하게 적용되는 고정 규칙이 아니다.

## 13. 디자인 토큰 운용

### 컬렉션 구조

| 컬렉션 | 개수 | 역할 |
|---|---:|---|
| meide v2 / Primitives | 91 | 원시 색·숫자·폰트 값 |
| meide v2 / Color | 29 | 용도별 컬러 alias |
| meide v2 / Layout | 75 | 여백·라운딩·크기·테두리 alias |
| meide v2 / Typography | 36 | 기존 7종 텍스트 스타일 기반 값 |
| meide v2 / Effects | 11 | 투명도·글래스·그림자 수치 |

총 **242개**. 추가 파스텔 4색은 Primitives 4개와 Color alias 4개로 포함된다.

- semantic 변수는 Primitives를 alias로 참조한다.
- 색상은 Light 단일 모드다. 다크 테마는 정의되지 않았다.
- 숫자 변수는 명시한 예외 외에 px 기준이다. opacity·refraction 등은 비율이며, 그리드 열 개수는 단위 없는 수다.
- 기존 화면의 많은 여백·라운딩은 `space/24`, `radius/32` 같은 수치 변수에 직접 연결되어 있다. 모든 레이어가 `spacing/card/padding` 등 역할 변수에 연결된 상태는 아니다.
- 역할 변수를 수정했는데 화면이 바뀌지 않으면 해당 레이어의 실제 연결을 확인한다.
- Figma 코드 구문은 CSS 변수 이름을 제공하는 매핑이다. 저장소에 CSS 파일이나 토큰 빌드 파이프라인이 생성되었다는 뜻은 아니다.
- 원시 `number/24`를 바꾸면 여백·라운딩·아이콘 등 서로 다른 역할이 함께 바뀔 수 있다. 특정 역할만 바꿀 때는 해당 semantic alias의 참조를 조정한다.
- 효과 전체는 Effect Style로 관리한다. Effects 숫자 변수만 바꿔도 모든 GLASS 파라미터가 자동 변경된다고 가정하지 않는다.

## 14. 미해결 항목과 구현 전 확인

| 항목 | 현재 상태 | 처리 기준 |
|---|---|---|
| 스크롤 CTA 자동 전환 | 고정 CTA·3개 상태·원형 탭 전환 반영 | 실제 스크롤 방향 및 본문 끝 감지는 앱 구현 필요 |
| 지역 내 식당 찾기 | 두 진입 행 유지 | 하나의 지도·필터로 통합할지 결정 |
| 상세 담기 완료 상태 | 미확정 | 담기 후 전환·수량·중복 탭 동작 결정 |
| 체크 버튼 재탭 | 미확정 | 삭제 또는 수량 수정 동작 결정 |
| 장바구니 0개 상태 | 확인한 화면에 없음 | 빈 상태·CTA 노출 규칙 추가 |
| 예시 콘텐츠 | 마드리드 음식명·사진 교체 완료, 평점·알레르기·가격은 예시 | 실제 사용자 평가 및 메뉴 데이터로 연결 |
| 폰트 확대·다른 기기 너비 | 412px 시안 기준 | 줄바꿈·카드 높이·칩 잘림 검사 |
| 온보딩·후속 화면 | 이번 확인 범위 밖 | 별도 설계 및 문서 확장 |

이번 개정에서 글래스 배경과 상세 플로팅 구조, 마드리드 음식 예시, 장바구니 목록·하단 시트 사이의 35px 빈 공간 제거를 원본 Figma에 반영했다. 위 목록에는 남아 있는 구현·확인 항목만 기재했다.

## 15. 구현 검수 체크리스트

- [ ] 좌우 24px, 메뉴 카드 2열·거터 16px이 기준 너비에서 일치한다.
- [ ] 카드 유형별 라운딩 32px / 메뉴 카드 24px이 구분된다.
- [ ] 제목·설명 4px, 텍스트 묶음·버튼 16px을 유지한다.
- [ ] 한글 메뉴명 2줄 공간이 고정되고 긴 원어·한글에 말줄임이 동작한다.
- [ ] 재료 칩이 4px 간격으로 줄바꿈되며 보충 설명은 아래에 있다.
- [ ] 원문 확인 정보와 AI 추정 정보를 혼동하지 않는다.
- [ ] 개인 알레르기 배지가 이름·색·출처와 함께 올바르게 노출된다.
- [ ] 카드 클릭과 담기 버튼 클릭이 중복 실행되지 않는다.
- [ ] 스크롤 방향·원형 탭·본문 끝의 CTA 상태가 확정 규칙을 따른다.
- [ ] 장바구니 목록이 시트 뒤에서 잘리지 않고 마지막 항목까지 접근된다.
- [ ] 내 메뉴·동반인 메뉴 수량 칩의 높이와 하단 여백이 일치한다.
- [ ] 팁·코페르토·물 포함 범위를 명확히 표시하고 합계를 재계산한다.
- [ ] 안전 영역과 홈 인디케이터가 겹치지 않는다.
- [ ] 실제 사진 위 글래스·텍스트 대비와 확대 글자 상태를 검증한다.
- [ ] 감소된 동작 설정에서는 확장·축소 애니메이션을 단순화한다.
- [ ] 기존 meide v2 스타일과 컬러 변수를 재사용한다.

## 부록 A. 전체 디자인 변수

다음 표는 작성 시점의 Figma 변수 전체 값이다. alias 열은 실제 참조하는 원시 변수 이름을 나타낸다. COLOR는 HEX로, FLOAT는 읽기 쉬운 정밀도로 표기했다. Figma 내부 부동소수점 오차는 반올림했다.

### meide v2 / Primitives

| 변수 | 타입 | 해석된 값 | 참조 |
|---|---|---|---|
| `color/white` | COLOR | `#FFFFFF` | — |
| `color/black` | COLOR | `#000000` | — |
| `color/charcoal` | COLOR | `#212121` | — |
| `color/glass-charcoal` | COLOR | `#202322 / 70%` | — |
| `color/green` | COLOR | `#176B38` | — |
| `color/green-tint` | COLOR | `#EAF7EE` | — |
| `color/green-soft` | COLOR | `#D7EBDD` | — |
| `color/green-text` | COLOR | `#3D4A41` | — |
| `color/success` | COLOR | `#28A745` | — |
| `color/page` | COLOR | `#F2F4F6` | — |
| `color/inset` | COLOR | `#ECEEF1` | — |
| `color/border` | COLOR | `#E3E6E9` | — |
| `color/divider` | COLOR | `#E7EAED` | — |
| `color/secondary` | COLOR | `#626773` | — |
| `color/muted` | COLOR | `#91949E` | — |
| `color/red` | COLOR | `#DB2626` | — |
| `color/red-tint` | COLOR | `#FFF0F0` | — |
| `color/violet` | COLOR | `#5A5FD8` | — |
| `color/violet-border` | COLOR | `#DCDDF7` | — |
| `color/violet-muted` | COLOR | `#E1DEEA` | — |
| `number/0` | FLOAT | `0` | — |
| `number/2` | FLOAT | `2` | — |
| `number/4` | FLOAT | `4` | — |
| `number/6` | FLOAT | `6` | — |
| `number/7` | FLOAT | `7` | — |
| `number/8` | FLOAT | `8` | — |
| `number/10` | FLOAT | `10` | — |
| `number/12` | FLOAT | `12` | — |
| `number/14` | FLOAT | `14` | — |
| `number/16` | FLOAT | `16` | — |
| `number/18` | FLOAT | `18` | — |
| `number/20` | FLOAT | `20` | — |
| `number/24` | FLOAT | `24` | — |
| `number/28` | FLOAT | `28` | — |
| `number/32` | FLOAT | `32` | — |
| `number/40` | FLOAT | `40` | — |
| `number/48` | FLOAT | `48` | — |
| `number/64` | FLOAT | `64` | — |
| `number/3` | FLOAT | `3` | — |
| `number/22` | FLOAT | `22` | — |
| `number/999` | FLOAT | `999` | — |
| `number/30` | FLOAT | `30` | — |
| `number/44` | FLOAT | `44` | — |
| `number/56` | FLOAT | `56` | — |
| `number/35` | FLOAT | `35` | — |
| `number/36` | FLOAT | `36` | — |
| `number/99` | FLOAT | `99` | — |
| `number/72` | FLOAT | `72` | — |
| `number/412` | FLOAT | `412` | — |
| `number/364` | FLOAT | `364` | — |
| `number/79` | FLOAT | `79` | — |
| `number/174` | FLOAT | `174` | — |
| `number/306` | FLOAT | `306` | — |
| `number/148` | FLOAT | `148` | — |
| `number/15` | FLOAT | `15` | — |
| `number/134` | FLOAT | `134` | — |
| `number/5` | FLOAT | `5` | — |
| `number/1` | FLOAT | `1` | — |
| `font/family` | STRING | `Pretendard` | — |
| `font/style/medium` | STRING | `Medium` | — |
| `number/500` | FLOAT | `500` | — |
| `number/37-5` | FLOAT | `37.5` | — |
| `number/-0-9` | FLOAT | `-0.9` | — |
| `number/28-6` | FLOAT | `28.6` | — |
| `number/-0-44` | FLOAT | `-0.44` | — |
| `number/17` | FLOAT | `17` | — |
| `font/style/bold` | STRING | `Bold` | — |
| `number/700` | FLOAT | `700` | — |
| `number/23-8` | FLOAT | `23.8` | — |
| `number/-0-17` | FLOAT | `-0.17` | — |
| `number/23-2` | FLOAT | `23.2` | — |
| `number/-0-16` | FLOAT | `-0.16` | — |
| `number/19-6` | FLOAT | `19.6` | — |
| `number/-0-14` | FLOAT | `-0.14` | — |
| `number/13` | FLOAT | `13` | — |
| `font/style/regular` | STRING | `Regular` | — |
| `number/400` | FLOAT | `400` | — |
| `number/18-85` | FLOAT | `18.85` | — |
| `number/-0-13` | FLOAT | `-0.13` | — |
| `number/11` | FLOAT | `11` | — |
| `number/14-3` | FLOAT | `14.3` | — |
| `number/0-7` | FLOAT | `0.7` | — |
| `number/0-18` | FLOAT | `0.18` | — |
| `number/0-65` | FLOAT | `0.65` | — |
| `number/0-08` | FLOAT | `0.08` | — |
| `number/-4` | FLOAT | `-4` | — |
| `number/-6` | FLOAT | `-6` | — |
| `color/pastel/peach` | COLOR | `#FFBE9B` | — |
| `color/pastel/sky` | COLOR | `#A5E4FF` | — |
| `color/pastel/yellow` | COLOR | `#FFE291` | — |
| `color/pastel/mint` | COLOR | `#ACF5C3` | — |

### meide v2 / Color

| 변수 | 타입 | 해석된 값 | 참조 |
|---|---|---|---|
| `background/page` | COLOR | `#F2F4F6` | `color/page` |
| `background/card` | COLOR | `#FFFFFF` | `color/white` |
| `background/inset` | COLOR | `#ECEEF1` | `color/inset` |
| `background/glass-base` | COLOR | `#202322 / 70%` | `color/glass-charcoal` |
| `action/primary` | COLOR | `#176B38` | `color/green` |
| `action/solid` | COLOR | `#212121` | `color/charcoal` |
| `action/secondary` | COLOR | `#FFFFFF` | `color/white` |
| `text/primary` | COLOR | `#212121` | `color/charcoal` |
| `text/secondary` | COLOR | `#626773` | `color/secondary` |
| `text/muted` | COLOR | `#91949E` | `color/muted` |
| `text/inverse` | COLOR | `#FFFFFF` | `color/white` |
| `text/brand` | COLOR | `#176B38` | `color/green` |
| `icon/primary` | COLOR | `#212121` | `color/charcoal` |
| `icon/inverse` | COLOR | `#FFFFFF` | `color/white` |
| `border/default` | COLOR | `#E3E6E9` | `color/border` |
| `border/divider` | COLOR | `#E7EAED` | `color/divider` |
| `border/ingredient` | COLOR | `#DCDDF7` | `color/violet-border` |
| `status/allergy` | COLOR | `#DB2626` | `color/red` |
| `status/allergy-surface` | COLOR | `#FFF0F0` | `color/red-tint` |
| `status/success` | COLOR | `#28A745` | `color/success` |
| `ai/accent` | COLOR | `#5A5FD8` | `color/violet` |
| `ai/border` | COLOR | `#E1DEEA` | `color/violet-muted` |
| `notice/background` | COLOR | `#EAF7EE` | `color/green-tint` |
| `notice/text` | COLOR | `#3D4A41` | `color/green-text` |
| `action/soft` | COLOR | `#D7EBDD` | `color/green-soft` |
| `pastel/peach` | COLOR | `#FFBE9B` | `color/pastel/peach` |
| `pastel/sky` | COLOR | `#A5E4FF` | `color/pastel/sky` |
| `pastel/yellow` | COLOR | `#FFE291` | `color/pastel/yellow` |
| `pastel/mint` | COLOR | `#ACF5C3` | `color/pastel/mint` |

### meide v2 / Layout

| 변수 | 타입 | 해석된 값 | 참조 |
|---|---|---|---|
| `space/0` | FLOAT | `0` | `number/0` |
| `space/2` | FLOAT | `2` | `number/2` |
| `space/4` | FLOAT | `4` | `number/4` |
| `space/6` | FLOAT | `6` | `number/6` |
| `space/7` | FLOAT | `7` | `number/7` |
| `space/8` | FLOAT | `8` | `number/8` |
| `space/10` | FLOAT | `10` | `number/10` |
| `space/12` | FLOAT | `12` | `number/12` |
| `space/14` | FLOAT | `14` | `number/14` |
| `space/16` | FLOAT | `16` | `number/16` |
| `space/18` | FLOAT | `18` | `number/18` |
| `space/20` | FLOAT | `20` | `number/20` |
| `space/24` | FLOAT | `24` | `number/24` |
| `space/28` | FLOAT | `28` | `number/28` |
| `space/32` | FLOAT | `32` | `number/32` |
| `space/40` | FLOAT | `40` | `number/40` |
| `space/48` | FLOAT | `48` | `number/48` |
| `space/64` | FLOAT | `64` | `number/64` |
| `spacing/screen/inset` | FLOAT | `24` | `number/24` |
| `spacing/card/padding` | FLOAT | `24` | `number/24` |
| `spacing/card/gap` | FLOAT | `24` | `number/24` |
| `spacing/menu-card/padding` | FLOAT | `16` | `number/16` |
| `spacing/menu-grid/gap` | FLOAT | `16` | `number/16` |
| `spacing/text/title-description` | FLOAT | `4` | `number/4` |
| `spacing/text-group/action` | FLOAT | `16` | `number/16` |
| `spacing/ingredient-chip/gap` | FLOAT | `4` | `number/4` |
| `spacing/ingredient-chip/padding-x` | FLOAT | `14` | `number/14` |
| `spacing/ingredient-chip/padding-y` | FLOAT | `7` | `number/7` |
| `spacing/image-action/inset` | FLOAT | `12` | `number/12` |
| `radius/0` | FLOAT | `0` | `number/0` |
| `radius/3` | FLOAT | `3` | `number/3` |
| `radius/12` | FLOAT | `12` | `number/12` |
| `radius/14` | FLOAT | `14` | `number/14` |
| `radius/16` | FLOAT | `16` | `number/16` |
| `radius/18` | FLOAT | `18` | `number/18` |
| `radius/20` | FLOAT | `20` | `number/20` |
| `radius/22` | FLOAT | `22` | `number/22` |
| `radius/24` | FLOAT | `24` | `number/24` |
| `radius/28` | FLOAT | `28` | `number/28` |
| `radius/32` | FLOAT | `32` | `number/32` |
| `radius/999` | FLOAT | `999` | `number/999` |
| `radius/role/card` | FLOAT | `32` | `number/32` |
| `radius/role/menu-card` | FLOAT | `24` | `number/24` |
| `radius/role/primary-button` | FLOAT | `28` | `number/28` |
| `radius/role/floating-cta` | FLOAT | `32` | `number/32` |
| `radius/role/icon-button` | FLOAT | `22` | `number/22` |
| `radius/role/quantity-chip` | FLOAT | `18` | `number/18` |
| `radius/role/ingredient-chip` | FLOAT | `999` | `number/999` |
| `radius/role/sheet` | FLOAT | `32` | `number/32` |
| `size/icon/small` | FLOAT | `16` | `number/16` |
| `size/icon/medium` | FLOAT | `20` | `number/20` |
| `size/icon/default` | FLOAT | `24` | `number/24` |
| `size/icon/large` | FLOAT | `30` | `number/30` |
| `size/button/icon` | FLOAT | `44` | `number/44` |
| `size/button/primary-height` | FLOAT | `56` | `number/56` |
| `size/button/cta-height` | FLOAT | `64` | `number/64` |
| `size/chip/ingredient-height` | FLOAT | `35` | `number/35` |
| `size/chip/quantity-height` | FLOAT | `36` | `number/36` |
| `size/chip/quantity-width` | FLOAT | `99` | `number/99` |
| `size/image/thumbnail` | FLOAT | `72` | `number/72` |
| `size/avatar/small` | FLOAT | `32` | `number/32` |
| `size/avatar/default` | FLOAT | `40` | `number/40` |
| `size/grid/reference-width` | FLOAT | `412` | `number/412` |
| `size/grid/content-width` | FLOAT | `364` | `number/364` |
| `size/grid/column-width` | FLOAT | `79` | `number/79` |
| `size/grid/columns` | FLOAT | `4` | `number/4` |
| `size/menu-card/width` | FLOAT | `174` | `number/174` |
| `size/menu-card/height` | FLOAT | `306` | `number/306` |
| `size/menu-card/image-height` | FLOAT | `148` | `number/148` |
| `size/menu-card/korean-name-height` | FLOAT | `48` | `number/48` |
| `size/menu-card/original-name-height` | FLOAT | `15` | `number/15` |
| `size/home-indicator/width` | FLOAT | `134` | `number/134` |
| `size/home-indicator/height` | FLOAT | `5` | `number/5` |
| `border/default` | FLOAT | `1` | `number/1` |
| `border/none` | FLOAT | `0` | `number/0` |

### meide v2 / Typography

| 변수 | 타입 | 해석된 값 | 참조 |
|---|---|---|---|
| `font/family` | STRING | `Pretendard` | `font/family` |
| `display-30-m/size` | FLOAT | `30` | `number/30` |
| `display-30-m/style` | STRING | `Medium` | `font/style/medium` |
| `display-30-m/weight` | FLOAT | `500` | `number/500` |
| `display-30-m/line-height` | FLOAT | `37.5` | `number/37-5` |
| `display-30-m/letter-spacing` | FLOAT | `-0.9` | `number/-0-9` |
| `heading-22-m/size` | FLOAT | `22` | `number/22` |
| `heading-22-m/style` | STRING | `Medium` | `font/style/medium` |
| `heading-22-m/weight` | FLOAT | `500` | `number/500` |
| `heading-22-m/line-height` | FLOAT | `28.6` | `number/28-6` |
| `heading-22-m/letter-spacing` | FLOAT | `-0.44` | `number/-0-44` |
| `title-17-b/size` | FLOAT | `17` | `number/17` |
| `title-17-b/style` | STRING | `Bold` | `font/style/bold` |
| `title-17-b/weight` | FLOAT | `700` | `number/700` |
| `title-17-b/line-height` | FLOAT | `23.8` | `number/23-8` |
| `title-17-b/letter-spacing` | FLOAT | `-0.17` | `number/-0-17` |
| `body-16-m/size` | FLOAT | `16` | `number/16` |
| `body-16-m/style` | STRING | `Medium` | `font/style/medium` |
| `body-16-m/weight` | FLOAT | `500` | `number/500` |
| `body-16-m/line-height` | FLOAT | `23.2` | `number/23-2` |
| `body-16-m/letter-spacing` | FLOAT | `-0.16` | `number/-0-16` |
| `label-14-m/size` | FLOAT | `14` | `number/14` |
| `label-14-m/style` | STRING | `Medium` | `font/style/medium` |
| `label-14-m/weight` | FLOAT | `500` | `number/500` |
| `label-14-m/line-height` | FLOAT | `19.6` | `number/19-6` |
| `label-14-m/letter-spacing` | FLOAT | `-0.14` | `number/-0-14` |
| `caption-13-r/size` | FLOAT | `13` | `number/13` |
| `caption-13-r/style` | STRING | `Regular` | `font/style/regular` |
| `caption-13-r/weight` | FLOAT | `400` | `number/400` |
| `caption-13-r/line-height` | FLOAT | `18.85` | `number/18-85` |
| `caption-13-r/letter-spacing` | FLOAT | `-0.13` | `number/-0-13` |
| `tiny-11-m/size` | FLOAT | `11` | `number/11` |
| `tiny-11-m/style` | STRING | `Medium` | `font/style/medium` |
| `tiny-11-m/weight` | FLOAT | `500` | `number/500` |
| `tiny-11-m/line-height` | FLOAT | `14.3` | `number/14-3` |
| `tiny-11-m/letter-spacing` | FLOAT | `0` | `number/0` |

### meide v2 / Effects

| 변수 | 타입 | 해석된 값 | 참조 |
|---|---|---|---|
| `glass/opacity` | FLOAT | `0.7` | `number/0-7` |
| `glass/blur` | FLOAT | `12` | `number/12` |
| `glass/depth` | FLOAT | `12` | `number/12` |
| `glass/refraction` | FLOAT | `0.18` | `number/0-18` |
| `glass/light-intensity` | FLOAT | `0.65` | `number/0-65` |
| `glass/dispersion` | FLOAT | `0.08` | `number/0-08` |
| `shadow/floating-blur` | FLOAT | `20` | `number/20` |
| `shadow/floating-y` | FLOAT | `6` | `number/6` |
| `shadow/floating-spread` | FLOAT | `-4` | `number/-4` |
| `shadow/sheet-blur` | FLOAT | `24` | `number/24` |
| `shadow/sheet-y` | FLOAT | `-6` | `number/-6` |

## 부록 B. 참조 화면의 현재 텍스트

아래 내용은 예시 콘텐츠 대조용이다. 줄바꿈·표시 순서는 화면의 시각적 순서와 일부 다를 수 있다. 기능 명세는 본문을 우선한다.

### 1 - 식당 안, 메뉴판 데이터 X

이탈리아 · 키우시  ·  오스테리아 라 솔리타 주파에
계시네요  ·  지금 이 식당 한국인 랭킹  ·  전체 보기 >  ·  1  ·  서양 대파·감자 수프  ·  ★ 4.8  ·  2  ·  호박·밀알 수프  ·  ★ 4.8  ·  3  ·  토마토 소스 대구 튀김  ·  ★ 4.7  ·  4  ·  병아리콩·포르치니 버섯 수프  ·  ★ 4.7  ·  메뉴판 카메라로 촬영하기  ·  이 식당이 아니에요  ·  Osteria La Solita Zuppa  ·  9:41  ·  􀎟  ·  홈  ·  􀩳  ·  주문내역  ·  􀉫  ·  동반인  ·  􀉭  ·  마이페이지

### 1 - 식당 안, 메뉴판 데이터 O

9:41  ·  이탈리아 · 키우시  ·  오스테리아 라 솔리타 주파에
계시네요  ·  지금 이 식당 한국인 랭킹  ·  전체 보기 >  ·  1  ·  서양 대파·감자 수프  ·  ★ 4.8  ·  2  ·  호박·밀알 수프  ·  ★ 4.8  ·  3  ·  토마토 소스 대구 튀김  ·  ★ 4.7  ·  4  ·  병아리콩·포르치니 버섯 수프  ·  ★ 4.7  ·  이 식당이 아니에요  ·  Osteria La Solita Zuppa  ·  기존 메뉴판 선택  ·  새 메뉴판 촬영  ·  􀎟  ·  홈  ·  􀩳  ·  주문내역  ·  􀉫  ·  동반인  ·  􀉭  ·  마이페이지

### 1-2 주문 후

9:41  ·  이탈리아 · 키우시  ·  식사
맛있게 하세요!  ·  방금 본 메뉴판  ·  Osteria La Solita Zu...  ·  메뉴 평가하기  ·  3개  ·  방금 주문한 내역  ·  서양 대파·감자 수프  ·  €10.00  ·  호박·고대 밀 수프  ·  €10.00  ·  소고기 요리·으깬 감자  ·  €18.00  ·  메뉴 금액  ·  €38.00  ·  􀎟  ·  홈  ·  􀩳  ·  주문내역  ·  􀉫  ·  동반인  ·  􀉭  ·  마이페이지

### 2 - 여행 지역 내

9:41  ·  이탈리아 · 키우시  ·  키우시에서
뭘 먹을까요?  ·  키우시 한국인 랭킹  ·  전체 보기 >  ·  1  ·  서양 대파·감자 수프  ·  ★ 4.8  ·  2  ·  호박·밀알 수프  ·  ★ 4.8  ·  3  ·  토마토 소스 대구 튀김  ·  ★ 4.7  ·  4  ·  병아리콩·포르치니 버섯 수프  ·  ★ 4.7  ·  내 주변 식당 찾기  ·  아시안·한식당 추천  ·  􀎟  ·  홈  ·  􀩳  ·  주문내역  ·  􀉫  ·  동반인  ·  􀉭  ·  마이페이지

### 3 여행 지역 외 - 여행지 미선택

9:41  ·  이탈리아 · 키우시  ·  다음 여행에서
무엇을 먹어볼까요?  ·  여행지 선택  ·  어디로 떠나세요?  ·  여행지를 고르면 현지 음식을 추천해요  ·  여행지 선택하기  ·  􀎟  ·  홈  ·  􀩳  ·  주문내역  ·  􀉫  ·  동반인  ·  􀉭  ·  마이페이지  ·  한국인이 많이 평가한 음식  ·  전체 보기 >  ·  1  ·  서양 대파·감자 수프  ·  ★ 4.8  ·  2  ·  호박·밀알 수프  ·  ★ 4.8  ·  3  ·  토마토 소스 대구 튀김  ·  ★ 4.7  ·  4  ·  병아리콩·포르치니 버섯 수프  ·  ★ 4.7

### 3 여행 지역 외 - 여행지 선택

9:41  ·  마드리드에서 먹을 음식
미리 골라볼까요?  ·  스페인 · 마드리드  ·  마드리드 식당 둘러보기  ·  음식 종류와 지역으로 식당을 찾아보세요  ·  지도에서 식당 찾기  ·  􀎟  ·  홈  ·  􀩳  ·  주문내역  ·  􀉫  ·  동반인  ·  􀉭  ·  마이페이지  ·  마드리드 음식 랭킹  ·  전체 보기 >  ·  1  ·  오징어튀김 샌드위치  ·  ★ 4.8  ·  2  ·  코시도 · 병아리콩 고기 스튜  ·  ★ 4.8  ·  3  ·  추로스와 핫초콜릿  ·  ★ 4.7  ·  4  ·  칼로스 · 소 내장 스튜  ·  ★ 4.7

### 메뉴판 · 메뉴를 골라주세요

9:41  ·  Osteria La Solita Zuppa  ·  나  ·  김  ·  미영님과 함께 고르는 중  ·  수프 4  ·  메인 요리 3  ·  주류 6  ·  수프  ·  zuppe  ·  4개 메뉴  ·  ZUPPA DI CECI E PORCINI  ·  병아리콩과 포르치니 버섯 수프  ·  EUR  ·  11.00  ·  약 16,489원  ·  ZUPPA DI PORRI E PATATE  ·  서양 대파와 감자 크림 수프  ·  EUR  ·  10.00  ·  약 14,990원  ·  버섯 포함  ·  ZUPPA DI ZUCCA E FARRO  ·  호박과 고대 밀 수프  ·  EUR  ·  10.00  ·  약 14,990원  ·  사진 준비 중  ·  ZUPPA DI MELANZANE FUME'  ·  훈제 가지 수프  ·  EUR  ·  11.00  ·  약 16,489원  ·  함께 담은 장바구니  ·  3개 보기

### 메뉴 상세 · 호박과 고대 밀 수프

9:41  ·  대표 이미지 · 실제 음식과 다를 수 있어요  ·  ZUPPA DI ZUCCA E FARRO  ·  호박과 고대 밀 수프  ·  EUR  ·  10.00  ·  약 14,990원  ·  한국 음식으로 치면  ·  보리를 넣은 걸쭉한 호박죽에 가까워요  ·  호박죽보다 덜 달고, 치즈와 올리브유 덕에 고소한 맛이 나요.  ·  메뉴판에 적힌 정보  ·  메뉴판 원문에서 확인했어요  ·  재료  ·  단호박  ·  zucca  ·  파로  ·  farro  ·  보리처럼 톡톡 씹히는 고대 밀  ·  알레르기  ·  글루텐 (EU 1)  ·  파로(밀)가 메뉴판에 적혀 있어요  ·  AI가 추정한 정보  ·  들어갔을 수 있는 재료  ·  양파  ·  올리브유  ·  채소 육수  ·  파르미지아노 치즈  ·  조리법  ·  호박을 푹 끓여 곱게 간 뒤, 따로 삶은 파로를 넣어 죽처럼 걸쭉하게 만드는 게 일반적이에요.  ·  알레르기 가능성  ·  유제품 (EU 7)  ·  치즈가 들어갔을 수 있어요  ·  장바구니에 담기  ·  담기

### 장바구니 · 함께 담은 장바구니

9:41  ·  함께 담은 장바구니  ·  나  ·  내 메뉴 · 1개  ·  ZUPPA DI PORRI E PATATE  ·  서양 대파와 감자 크림 수프  ·  EUR  ·  10.00  ·  약 14,990원  ·  1  ·  내 합계 (팁 포함)  ·  EUR  ·  11.00  ·  약 16,489원  ·  김  ·  미영님 메뉴 · 2개  ·  ZUPPA DI ZUCCA E FARRO  ·  호박과 고대 밀 수프  ·  EUR  ·  10.00  ·  약 14,990원  ·  수량 1개  ·  OSSOBUCO DI CHIANINA E PURE' DI PATATE  ·  뼈가 붙은 소고기 요리와 으깬 감자  ·  EUR  ·  18.00  ·  약 26,982원  ·  수량 1개  ·  미영님 합계 (팁 포함)  ·  EUR  ·  30.80  ·  약 46,169원  ·  선택 팁 포함  ·  10%  ·  예상 총액  ·  음식+팁 · 총 3개  ·  EUR  ·  41.80  ·  약 62,659원  ·  주문 문장 만들기

### 영수증 · 영수증 미리보기

9:41  ·  영수증 미리보기  ·  계산서에 붙을 금액을
미리 정리했어요  ·  Osteria La Solita Zuppa  ·  2026.10.19 14:51 · 2명  ·  서양 대파와 감자 크림 수프  ·  EUR  ·  10.00  ·  호박과 고대 밀 수프  ·  EUR  ·  10.00  ·  뼈가 붙은 소고기 요리와 으깬 감자  ·  EUR  ·  18.00  ·  코페르토 · 2명  ·  EUR  ·  5.00  ·  빵·식기·자리 준비 비용이에요. 1인당 받는 정상 요금이라 바가지가 아니에요.  ·  물 (시켰다면)  ·  +EUR  ·  3.00  ·  이탈리아 식당은 물이 유료예요. 병 물을 시켰다면 1병에 약 3유로가 붙어요.  ·  선택 팁 10%  ·  EUR  ·  3.80  ·  예상 합계  ·  물 제외  ·  EUR  ·  46.80  ·  약 70,154원  ·  식당이 발행한 영수증이 아니에요. 실제 계산서와 다를 수 있어요.  ·  홈으로 가기  ·  추가 주문하기



## 부록 C. 마드리드 음식 썸네일 출처

이번 교체는 시안용 예시 콘텐츠이며 실제 식당 메뉴 사진이나 한국인 평가 결과가 아니다. 배포용 이미지 자산은 서비스의 사용 권한 정책에 맞게 별도로 확보한다.

| 예시 음식 | 원문 사진 설명·크레딧 | 이미지 |
|---|---|---|
| 오징어튀김 샌드위치 | Bocadillo de calamares. Jesualdo Bermejo, del restaurante Tablafina, en el Hotel NH Madrid Nacional | [원본 이미지](https://estaticos.esmadrid.com/cdn/farfuture/HP0G5_8X-q9PBBd33W20jHqr3Gbspj2Gr3Zoz3jmo28/mtime:1587465357/sites/default/files/styles/teaser_gadget/public/editorial/bocata_calamares_tablafina_jesualdo_bermejo.jpg?itok=lXlaNS2N) |
| 코시도 · 병아리콩 고기 스튜 | Cocido madrileño de La Clave | [원본 이미지](https://estaticos.esmadrid.com/cdn/farfuture/zz_Mp1d7DaV_4duW_UDpm2eCGT8ePLYrpbHPT5c_NdI/mtime:1606221364/sites/default/files/styles/teaser_gadget/public/editorial/cocido_madrileno_laclave_0.jpg?itok=N5oYCqzf) |
| 추로스와 핫초콜릿 | El desayuno más castizo: churros con chocolate de la Chocolatería San Ginés (©Álvaro López del Cerro). | [원본 이미지](https://estaticos.esmadrid.com/cdn/farfuture/KAGSmaEBTtmtJ_wAyhPOiPi_RCWxvq16SPrdJdh7y9o/mtime:1594114862/sites/default/files/styles/teaser_gadget/public/editorial/churros_con_chocolate_san_gines.jpg?itok=m9onLLyy) |
| 칼로스 · 소 내장 스튜 | Callos a la madrileña de Prístino | [원본 이미지](https://estaticos.esmadrid.com/cdn/farfuture/1na9tmWl_LWeO1NOYGGClXrmGGp-ZgZsgOVtQ91LTmA/mtime:1591110932/sites/default/files/styles/teaser_gadget/public/editorial/callos_madrilena_pristino.jpg?itok=FNp8n9k7) |

출처 페이지: [Madrid Destino · Recetas de Madrid](https://www.esmadrid.com/recetas-madrid).
