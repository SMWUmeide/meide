# MEIDE — 데이터 모양 (yj)

작성: 2026-10-25 · 기준 브랜치: `src` · 함께 볼 문서: [`DESIGN-yj.md`](./DESIGN-yj.md), [`ROUTES-yj.md`](./ROUTES-yj.md)

화면이 주고받는 정보를 **어떤 칸으로 나눠 담을지** 정한 문서다. 목업 데이터와 실제 API 결과는 모두 이 모양을 따른다. 그래야 API를 붙일 때 목업 자리만 바꿔 끼우고 화면은 고치지 않는다.

## 1. 원칙

1. **화면은 이 모양만 안다.** 외부 API의 응답을 화면에 바로 넘기지 않고, 서버에서 이 모양으로 바꾼 뒤 넘긴다.
2. **누가 채우는지 구분한다.** 칸마다 `메뉴판`(사진에서 읽음) · `AI`(추정·비유) · `외부`(OSM·Wikimedia·환율) · `사용자` · `계산`(다른 칸으로 매번 계산) · `집계`(여러 사용자 기록을 모음) 중 하나다. 확인된 정보와 AI 추정을 **절대 같은 칸에 섞지 않는다** (DESIGN-yj.md 3절).
3. **계산값은 저장하지 않는다.** 합계·팁·원화·주문 문장은 저장된 칸으로 그때그때 계산한다.
4. **표시 문구는 데이터가 아니다.** "영업 중 · 22:30까지", "도보 3분"처럼 화면 문장은 원본 값(영업시간, 거리)으로 화면에서 만든다.
5. **ID는 문자열**, 시각은 ISO 8601 문자열(시간대 포함), 금액은 **최소 단위 정수**(EUR 10.00 → `1000`)와 통화 코드를 함께 둔다.

## 2. 전체 그림

```
User(계정) ─┬─ Friend(친구·동행자, 입맛)
            ├─ Trip(지금 여행지)
            └─ MealRecord(식사 기록) ── Rating(메뉴별 평가)
                     │
MenuBoard(메뉴판 한 번 해석한 결과) ─┬─ MenuPhoto(찍은 사진)
            │                       ├─ MenuItem(메뉴 한 줄) ── MenuImage(대표 사진)
            │                       └─ Restaurant(식당)
            └─ CartSession(함께 담기) ── CartLine(누가 무엇을 몇 개)
                     │
          계산: OrderSentence(주문 문장) · Receipt(영수증) · Totals(합계)
집계: KoreanRanking(한국인 랭킹·평점) ← Rating 모음
외부: ExchangeRate(환율)
```

## 3. 칸 정의

타입 표기: `string`, `number`, `boolean`, `?`는 없을 수 있음, `[]`는 목록, `"a" | "b"`는 정해진 값 중 하나.

### MenuBoard — 메뉴판 한 번 해석한 결과

화면: 39 인식 중 → 40 실패 → 13 → 01. 홈 '방금 본 메뉴판'도 이것을 연다.

| 칸 | 타입 | 채움 | 설명 |
| --- | --- | --- | --- |
| id | string | 계산 | |
| createdAt | string | 계산 | 해석 시작 시각 |
| status | `"analyzing" \| "done" \| "partial" \| "failed"` | 계산 | 39·40 화면 분기 |
| photos | MenuPhoto[] | 사용자 | 찍은 순서대로 |
| restaurantNameOnMenu | string? | 메뉴판 | 메뉴판에 적힌 식당명 (13 확인용) |
| restaurantId | string? | 사용자 | 13·14에서 확정한 식당. 건너뛰면 없음 |
| language | string | AI | 메뉴판 언어 (`"it"`) |
| currency | string | 메뉴판 | 통화 코드 (`"EUR"`) |
| coperto | Money? | 메뉴판 | 1인 자리값. 없으면 없음 (04 영수증) |
| sections | MenuSection[] | 메뉴판 | 메뉴판의 분류 (zuppe, secondi …) |
| items | MenuItem[] | 메뉴판+AI | 메뉴 목록 |

**MenuPhoto**: `id` · `localKey`(기기 임시 저장 키) · `readable: "ok" | "blurry" | "glare"`(40 실패 이유) · `itemIds: string[]`(이 사진에서 읽은 메뉴).

**MenuSection**: `id` · `original`(`"ZUPPE"`) · `korean`(`"수프"`, AI) · `order`(번호).

### MenuItem — 메뉴 한 줄

화면: 01 카드, 06-2 상세, 02 장바구니, 03 주문 문장, 04 영수증, 20 평가, 33 랭킹.

| 칸 | 타입 | 채움 | 화면에서 |
| --- | --- | --- | --- |
| id | string | 계산 | |
| sectionId | string | 메뉴판 | 01 분류 칩 |
| original | string | 메뉴판 | 원문 메뉴명 (작은 회색 글자) |
| korean | string | AI | 한국어 이름 (큰 글자) |
| price | Money | 메뉴판 | 가격 |
| confirmed.ingredients | `{ korean, original, note? }[]` | 메뉴판 | 06-2 "메뉴판에 적힌 정보" — 메뉴판에 실제로 적힌 재료만 |
| confirmed.allergens | AllergenCode[] | 메뉴판 | 메뉴판에 표기된 알레르기 번호만 |
| ai.analogy | string | AI | "한국 음식으로 치면" 핵심 한 줄 |
| ai.taste | string | AI | 비유 아래 맛 설명 |
| ai.possibleIngredients | string[] | AI | "들어갔을 수 있는 재료" 칩 |
| ai.cooking | string | AI | 일반적인 조리법 |
| ai.possibleAllergens | `{ code: AllergenCode, reason: string }[]` | AI | "알레르기 가능성" + 18 확인 질문 |
| ai.askStaff | `{ korean, local }`? | AI | 18 직원에게 확인하는 문장 |
| image | MenuImage? | 외부 | 대표 사진. 없으면 사진 없는 칸 표시 |
| sourcePhotoId | string | 메뉴판 | 어느 사진에서 읽었는지 |
| readConfidence | `"high" \| "low"` | AI | 낮으면 40에서 다시 찍기 권유 |

**Money**: `{ amount: number(최소 단위 정수), currency: string }` — 예: `{ amount: 1000, currency: "EUR" }`.

**MenuImage**: `url` · `source: "wikimedia" | "unsplash" | "pexels"` · `credit`(저작자) · `license` · `pageUrl` · `isReference: true`(항상 "참고 사진 · 실제와 다를 수 있어요" 표시).

**AllergenCode**: EU 표기 번호 `1`–`14`. 화면 이름은 아래 표로 바꿔서 쓴다.

| 번호 | 화면 이름 | 번호 | 화면 이름 |
| --- | --- | --- | --- |
| 1 | 글루텐 | 8 | 견과류 |
| 2 | 갑각류 | 9 | 셀러리 |
| 3 | 달걀 | 10 | 겨자 |
| 4 | 생선 | 11 | 참깨 |
| 5 | 땅콩 | 12 | 아황산염 |
| 6 | 대두 | 13 | 루핀 |
| 7 | 유제품 | 14 | 조개류 |

### Restaurant — 식당

화면: 13, 14, 05-2, 05-3, 31, 32, 19.

| 칸 | 타입 | 채움 | 설명 |
| --- | --- | --- | --- |
| id | string | 외부 | `osm:node/123` 형식 (OSM 원본 ID) |
| name | string | 외부 | |
| location | `{ lat, lng }` | 외부 | 거리·도보 시간은 화면에서 계산 |
| address | string? | 외부 | |
| cuisine | string[] | 외부 | OSM `cuisine` 값 (`italian`, `korean` …) |
| kind | `"local" \| "korean" \| "asian" \| "market"` | 계산 | 31 '입맛이 그리울 때' 분류 |
| category | KoreanCategory[] | AI | 05-2 칩 (국물 요리, 밥·죽, 면 요리, 고기 구이, 해산물, 빵·피자) |
| openingHours | string? | 외부 | OSM `opening_hours` 원문. "영업 중 · 22:30까지"는 화면에서 계산 |
| photo | MenuImage? | 외부 | Mapillary 거리 사진 또는 없음 |
| signatureItem | `{ korean, original, analogy }`? | 집계+AI | 대표 메뉴. 한국인 기록이 있을 때만 |
| koreanRating | KoreanRating? | 집계 | 평점. 기록이 없으면 표시 안 함 |

### CartSession · CartLine — 함께 담기

화면: 01, 02, 22, 03, 04.

| 칸 | 타입 | 채움 | 설명 |
| --- | --- | --- | --- |
| CartSession.id | string | 계산 | 초대 링크에 들어가는 값 |
| CartSession.menuBoardId | string | 계산 | 같은 메뉴판을 함께 봄 |
| CartSession.members | `{ userId, role: "me" \| "companion", name, initial }[]` | 사용자 | |
| CartSession.tipPercent | number? | 사용자 | 선택 팁. 끄면 없음 (기본 10) |
| CartSession.request | string | 사용자 | 03 요청사항 원문 |
| CartSession.version | number | 계산 | 두 폰이 동시에 고칠 때 충돌 확인 |
| CartLine.itemId | string | 사용자 | |
| CartLine.ownerUserId | string | 사용자 | 누가 담았는지. **수량은 담은 사람만 바꿀 수 있다** |
| CartLine.quantity | number | 사용자 | 0이 되면 줄을 지운다 |

### 계산값 — 저장하지 않음

| 이름 | 만드는 재료 | 화면 |
| --- | --- | --- |
| Totals | CartLine × MenuItem.price, tipPercent | 02 사람별 합계·전체 합계 |
| OrderSentence | CartLine, MenuItem.original/korean, request(번역) | 03, 17 |
| Receipt | Totals + MenuBoard.coperto × 인원 + 물 안내 | 04 |
| 원화 표시 | Money × ExchangeRate | 모든 가격 옆 "약 ○원" |
| 거리·도보 시간 | 내 위치 ↔ Restaurant.location | 05, 14, 31 |
| 홈 시간대 | 현지 시각 (Trip.timezone) | 홈 4종 |

**OrderSentence** 모양: `{ korean: string, local: string, language: "it", requestTranslated: boolean }`. 요청사항 번역이 실패하면 `requestTranslated: false`로 두고 원문을 따로 표시한다.

**ExchangeRate**: `{ base: "EUR", quote: "KRW", rate: number, date: string }`. 화면 하단 "○월 ○일 환율 기준"에 `date`를 쓴다.

### User · Friend · Trip — 계정

화면: 23–30, 홈 상단.

| 칸 | 타입 | 채움 | 설명 |
| --- | --- | --- | --- |
| User.id | string | 외부(로그인) | |
| User.name | string | 사용자 | 29에서 수정 |
| User.taste | Taste | 사용자 | 28 내 입맛 |
| Trip.country / city | string | 사용자 | 07 |
| Trip.timezone | string | 외부 | `Europe/Rome` (홈 시간대 계산) |
| Trip.location | `{ lat, lng }` | 외부 | 도시 중심 좌표 (GeoNames) |
| Friend.id | string | 계산 | |
| Friend.name | string | 사용자 | |
| Friend.taste | Taste | 사용자 | 25, 26 |
| Friend.linkedUserId | string? | 계산 | 초대 링크로 앱에 연결됐으면 있음 (27) |
| Friend.travelingWith | boolean | 사용자 | 23 스위치 |

**Taste**: `{ allergens: AllergenCode[], dislikes: string[], likes: string[] }`. 화면 색(보라·청록·주황)은 데이터가 아니라 화면이 순서대로 정한다.

### MealRecord · Rating — 식사 기록

화면: 19, 20, 21, 홈 '평가 안 한 메뉴'.

| 칸 | 타입 | 채움 | 설명 |
| --- | --- | --- | --- |
| MealRecord.id | string | 계산 | |
| MealRecord.orderedAt | string | 계산 | 03 '주문했어요' 누른 시각 |
| MealRecord.menuBoardId | string | 계산 | 다시 보기 · 영수증용 |
| MealRecord.restaurantId | string? | 계산 | |
| MealRecord.lines | CartLine[] | 계산 | 주문 당시 그대로 복사 |
| MealRecord.tipPercent / request | | 계산 | 영수증 다시 계산용 |
| Rating.itemId | string | 사용자 | |
| Rating.value | `"again" \| "once" \| "notForMe"` | 사용자 | 또 먹고 싶어요 / 한 번이면 충분해요 / 입맛에 안 맞았어요 |
| Rating.at | string | 계산 | |

### KoreanRanking · KoreanRating — 한국인 집계

화면: 31, 33, 32, 05.

- **KoreanRating**: `{ average: number(1–5), count: number }` — 화면 "★ 4.6 · 한국인 38명".
- **KoreanRanking 항목**: `{ itemKey, korean, original, region, againPercent, count, analogyShort, image? }`.
- `againPercent` = `again` 평가 수 ÷ 전체 평가 수. 평가가 일정 수(예: 10) 미만이면 랭킹에 올리지 않는다.
- 다른 식당의 같은 메뉴를 묶기 위해 `itemKey`(원문 메뉴명을 소문자·공백 정리한 값 + 지역)를 쓴다.

## 4. 메뉴판 분석 AI 출력 약속

AI에게는 **사진을 주고 아래 JSON만 돌려받는다.** 서버가 받은 뒤 모양을 검사하고(빠진 칸·잘못된 값이면 다시 요청하거나 `partial`), `MenuBoard`로 바꿔 저장한다.

```json
{
  "language": "it",
  "currency": "EUR",
  "restaurantNameOnMenu": "Osteria La Solita Zuppa",
  "coperto": { "amount": 250, "currency": "EUR" },
  "photos": [{ "index": 0, "readable": "ok" }, { "index": 1, "readable": "blurry" }],
  "sections": [{ "id": "s1", "original": "ZUPPE", "korean": "수프" }],
  "items": [
    {
      "sectionId": "s1",
      "photoIndex": 0,
      "readConfidence": "high",
      "original": "ZUPPA DI ZUCCA E FARRO",
      "korean": "호박과 고대 밀 수프",
      "price": { "amount": 1000, "currency": "EUR" },
      "confirmed": {
        "ingredients": [
          { "korean": "단호박", "original": "zucca" },
          { "korean": "파로", "original": "farro", "note": "보리처럼 톡톡 씹히는 고대 밀" }
        ],
        "allergens": [1]
      },
      "ai": {
        "analogy": "보리를 넣은 걸쭉한 호박죽에 가까워요",
        "taste": "호박죽보다 덜 달고, 치즈와 올리브유 덕에 고소한 맛이 나요.",
        "possibleIngredients": ["양파", "올리브유", "채소 육수", "파르미지아노 치즈"],
        "cooking": "호박을 푹 끓여 곱게 간 뒤, 따로 삶은 파로를 넣어 죽처럼 걸쭉하게 만드는 게 일반적이에요.",
        "possibleAllergens": [{ "code": 7, "reason": "치즈가 들어갔을 수 있어요" }],
        "askStaff": { "korean": "이 음식에 우유나 치즈가 들어가나요?", "local": "Questo piatto contiene latte o formaggio?" }
      }
    }
  ]
}
```

AI에게 함께 주는 규칙:

- `confirmed`에는 **사진에 실제로 적힌 것만** 넣는다. 짐작은 모두 `ai`에 넣는다.
- `analogy`는 중장년 한국인이 아는 한식 하나에 빗댄 한 문장, "~에 가까워요" 말투.
- 가격·메뉴명이 흐려 확실하지 않으면 지어내지 말고 `readConfidence: "low"`로 둔다.
- 사용자와 동행자의 `Taste`(알레르기·못 먹는 것)를 함께 보내, 해당 재료가 의심되면 `possibleAllergens`에 꼭 넣게 한다.

## 5. API 연결 자리 (어댑터)

화면 코드는 아래 함수만 부른다. 지금은 각 함수가 목업(Stub·Fake)을 돌려주고, API를 붙일 때 **함수 안만** 바꾼다. 모두 서버 쪽에서 실행하고 API 키는 화면 코드에 두지 않는다.

| 함수 | 입력 → 출력 | 붙일 서비스 (2026-10-25 결정) |
| --- | --- | --- |
| `analyzeMenu(photos, taste[])` | 사진들 → MenuBoard | **Google Gemini API 무료 등급** (결제 수단 연결 안 함, Flash-Lite 계열) |
| `findRestaurantOnMenu(name, location)` | → Restaurant[] | OSM Nominatim / Overpass |
| `nearbyRestaurants(location, radius, category?)` | → Restaurant[] | OSM Overpass |
| `menuImage(original, korean)` | → MenuImage? | Wikidata / Wikimedia Commons → (없으면) Unsplash·Pexels |
| `translateRequest(korean, language)` | → `{ local, ok }` | **Gemini** (분석과 같은 키) |
| `translateTalk(text, from, to)` | → `{ text, ok }` | **Gemini** |
| `speak(text, language)` | 소리 재생 | 기기 내장 음성(Web Speech) 우선 |
| `listen(language)` | → 말한 문장 | 브라우저 음성 인식(Web Speech) 우선. 지원 안 되는 기기는 직접 입력. 유료 STT(Azure 등)는 나중에 검토 |
| `exchangeRate(base, quote)` | → ExchangeRate | **Frankfurter API** (ECB 기준, 무료) |
| `searchDestinations(query)` | → Trip 후보[] | GeoNames |
| `currentUser()` · 저장 함수들 | → User 등 | D1 데이터베이스 + 로그인 (방식 미정. 템플릿에 남은 ChatGPT 로그인은 쓰지 않는다) |
| `cartSession(id)` · `updateCart(...)` | → CartSession | D1 + 실시간 동기화 (마지막 단계) |
| `koreanRanking(region)` · `koreanRating(restaurantId)` | → 집계 | D1에 쌓인 Rating 집계 |

**쓰지 않는 것** — Google Places API(유료, 교수님 피드백), 식당 공식 메뉴 연동(데이터 출처 없음, 36 화면 삭제), Brave Image Search(이미지 라이선스 불명확).

**카메라·위치**: 브라우저 카메라(`getUserMedia`, 후면 카메라)와 사진 선택(`<input type="file" accept="image/*">`), 브라우저 위치(`navigator.geolocation`). 둘 다 **HTTPS에서만** 동작한다(localhost 제외).

**Gemini 무료 등급 주의**
- 결제 수단을 연결하지 않아 요금이 나가지 않게 한다. 하루 호출 한도가 작으므로 같은 사진은 해시로 결과를 저장해 다시 쓰고, 사용자당 하루 분석 횟수를 제한한다. 한도 초과(429)는 40 화면에 "오늘 분석 가능 횟수를 다 썼어요"로 안내한다.
- 무료 등급 입력은 Google 서비스 개선에 쓰일 수 있다. 사진 외 개인정보(이름·계정)는 보내지 않고, 알레르기는 EU 번호만 보낸다. 30 개인정보 화면에 "메뉴판 사진은 분석을 위해 Google Gemini로 보내요"를 표시한다.
- 무료 등급은 EEA(유럽) 사용자 대상 서비스에 제한이 있다는 안내가 있다. 수업 시연용으로만 쓰고, 정식 출시 전 유료 등급 전환 여부를 다시 정한다.
- API 키(`GEMINI_API_KEY`)는 서버 환경 변수에만 둔다.

**같이 지킬 것**

- 같은 사진(해시)·같은 문장은 결과를 저장해 다시 쓴다. 다시 부르지 않는다.
- 사용자당 분석 호출 수를 하루 단위로 제한한다(예: 20회). 넘으면 안내한다.
- 외부 서비스가 실패하면 화면 상태(40, 42, 44)로 보낸다. 앱이 멈추지 않게 한다.
- OSM·Nominatim은 사용 정책(초당 1회, 앱 이름이 담긴 User-Agent, 결과 캐시, 출처 표기 "© OpenStreetMap")을 지킨다.

## 6. 지금 코드(`lib/yj/model.ts`)와 다른 점 — 고칠 것

| 지금 | 바꿀 모양 | 이유 |
| --- | --- | --- |
| `Menu.price: number` (11) | `price: Money` (`{ amount: 1100, currency: "EUR" }`) | 통화가 나라마다 다르고 소수 계산 오차 방지 |
| `Menu.allergy: string` 문장 | `confirmed.allergens: AllergenCode[]` | 동행자 알레르기와 맞춰보려면 번호여야 함 |
| `Menu.ingredients: [string, string][]` | `confirmed.ingredients: { korean, original, note? }[]` | 설명(note) 칸 필요 |
| `analogy`·`taste`·`possible`·`cooking`이 확인 정보와 같은 높이 | `ai.*` 묶음으로 분리 | 확인 정보와 AI 추정 분리 원칙 |
| `Menu.photo: "fb60b.png"` (로컬 파일) | `image: MenuImage?` (주소·출처·라이선스) | 실제 사진은 외부에서 오고 출처 표기 필요 |
| `Menu.category: "수프"` | `sectionId` + `MenuSection` | 원문 분류(zuppe)와 한국어를 함께 표시 |
| `CartLine.owner: "me" \| "companion"` | `ownerUserId` | 동행자가 여러 명일 수 있음 |
| `Draft`에 사진·장바구니·주문 상태가 한데 섞임 | `MenuBoard` / `CartSession` / `MealRecord`로 분리 | 저장 위치와 수명이 다름 |
| `MealRecord.restaurant: string` 이름 | `restaurantId`, `menuBoardId` | 영수증·메뉴판 다시 보기 |
| `MealRecord.ratings: Record<string, string>` ("또 먹고 싶어요") | `Rating.value: "again" \| "once" \| "notForMe"` | 화면 문구가 바뀌어도 집계 유지 |
| `mockRestaurants`의 `distance`·`walk`·`hours` 문장 | `location`, `openingHours`로 저장하고 화면에서 계산 | 내 위치·현재 시각에 따라 달라짐 |
| `rating`·`count`가 식당 칸에 바로 | `koreanRating` (집계) | 출처가 다른 값 |
| `Friend.kind: "teal" \| "orange"` | 빼고 화면이 정함 | 색은 데이터가 아님 |
| 환율 1,499 고정 | `ExchangeRate` (날짜 포함) | 화면에 기준일 표시 |
| `orderSentences`가 요청 4개만 아는 사전 번역 | `translateRequest` 어댑터 | 실제 번역으로 교체 |
