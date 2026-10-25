# yj 전체 흐름 — 2차 개정 UI·실제 카메라·서비스 연결

기준: src 최신 DESIGN-yj.md·ROUTES-yj.md 전체. 맨 위 2차 개정 안내 및 11–13절을 우선했다. Figma는 Page 2의 지정 노드 45개를 각각 get_design_context와 스크린샷으로 확인했고, ⑧ 보관 레인은 구현하지 않았다.

## 추가 점검 — 휴대폰 HTTP와 공통 규격

휴대폰의 내부 IP HTTP 주소에서는 `crypto.randomUUID()`가 제공되지 않아 촬영 시 오류가 났다. `lib/yj/id.ts`의 `createLocalId()`가 HTTP에서도 지원되는 `crypto.getRandomValues()`로 UUID v4를 만들도록 수정하고, 촬영·앨범 사진·주문 기록·친구 등록의 네 호출 지점에 적용했다.

화면별 CSS에서 공통 크기를 덮어쓰던 선언 123개를 제거했다. 기본/작은 버튼은 공통 `size` 변형이며 임의의 화면별 축소를 하지 않는다. 버튼 모양의 카드도 `ActionCard`, 촬영·지도 위 버튼도 `GlassButton`을 사용한다. 스무딩은 공통 Squircle의 단일 상수 0.8이다. 원형 아이콘·아바타·마이크·셔터는 원을 유지한다.

| 종류 | 공통 글자 | 공통 패딩 (상하 / 좌우) | 크기·모양 |
| --- | --- | --- | --- |
| 기본 버튼 | 16px / 행간 24px | 16px / 22px | 최소 60px, 반경 22 |
| 작은 버튼 (명시적인 공통 size) | 14px / 행간 24px | 12px / 22px | 최소 48px, 반경 17.76 |
| 칩·태그 | 14px / 행간 18px | 12px / 22px | 최소 42px, 반경 높이 × 0.44 |
| 일반 카드·큰 정보 박스 | 본문·행 제목 15px / 행간 22px, 섹션 제목 18px, 부가 설명 13px | 24px / 24px | 반경 30 |
| 사진·목록을 포함한 flush 카드 | 일반 카드와 동일 | 외곽 0px, 내용·행에 공통 패딩 | 반경 30 |
| 목록 행 | 15px / 행간 22px | 16px / 24px | 카드 내부 행 |
| 시트 | 내부 역할별 공통 글자 | 24px / 24px (하단 safe area 추가 가능) | 반경 30 |

홈 찍기 카드는 문서에 명시된 32/24px 패딩·22px 제목을 유지한다. 사진·목록 카드의 패딩은 내부 내용/행에 적용한다. 가격·통역 본문·아바타 같은 의미가 다른 텍스트는 각 역할의 크기를 유지한다. 홈 여행지·지도 반경 칩도 공통 칩 규격에 포함하고, 대화 마이크는 세 상태 모두 80px로 통일했다. 넉넉한 공통 칩·태그 때문에 대화 답변은 가로 스크롤, 개인정보 태그는 다음 줄을 사용하고, 일부 카드 높이는 이전 캡처보다 커졌다. 아래 45개 비교 캡처를 모두 갱신했다.

브라우저 검증은 각 화면의 실제 computed style을 읽어 버튼·칩·태그·카드·큰 박스·시트·목록 행의 글자·패딩과 0.8 스무딩을 검사한다. 내부 IP의 HTTP origin에서 randomUUID가 없는 조건을 확인하고 촬영→주문·친구 등록·모바일 앨범 선택도 검증한다. 현재 서비스·카메라 수명·검증·캐시·횟수 제한을 포함한 17개 단위/서비스 테스트와 별도 브라우저 통합 검사를 사용한다.

## 실행과 저장 범위 (2026-10-26 갱신)

- 컴퓨터: http://localhost:5173 · 휴대폰 HTTPS: https://last-invite-ment-cradle.trycloudflare.com. 개발 서버와 임시 터널이 실행 중이어야 한다. 같은 와이파이 HTTP 주소는 실제 카메라용으로 사용하지 않는다.
- 실제 확인은 쿼리 없는 `/capture`에서 시작한다. `?fixture=`가 있는 주소는 Figma 비교용 예시이며 실제 카메라·외부 API를 사용하지 않는다. 화면의 일반 이동에는 fixture를 자동으로 붙이지 않는다.
- 저장과 서버 응답은 DATA-yj.md 3절의 `MenuBoard / CartSession / MealRecord / Rating / User / Friend / Trip` 구조다. 모든 목업은 `lib/yj/fixtures.ts` 한 곳에 있다. `view-model.ts`와 `presentation.ts`는 기존 UI용 표시값을 파생하며 표시 문구·합계·원화를 저장하지 않는다.
- 후면 카메라 미리보기, JPEG 촬영(긴 변 ≤1600px, 품질 0.8), 연속 촬영·교체·삭제·확대·앨범 선택을 연결했다. 스트림은 화면 이탈·백그라운드에서 종료한다. 실제 사진 바이트와 사진 키는 IndexedDB에 보관한다.
- 분석·번역·식당·사진·환율·여행지·계정·장바구니는 `lib/yj/services/` 어댑터를 통해 `/api/yj/*` 서버 함수로 연결한다. 위치·기기 음성·카메라는 브라우저에서 실행한다.
- `GEMINI_API_KEY`가 없으면 Osteria의 예시 분석 결과로 동작하며 예시임을 안내한다. 키 없는 번역은 예시 요청 네 개만 지원하고, 다른 문장은 실패/직접 입력 안내를 보인다.
- 정식 로그인과 기기간 초대/실시간 동기화, 한국인 평가 집계는 아직 시연용이다. 현재 계정은 HttpOnly 익명 쿠키 + 로컬 D1이며 같은 브라우저에서 저장된다. 다른 기기에서 같은 사람으로 로그인하는 기능은 없다.
- 상세 설정·검증 범위·실제 API와 예시의 구분은 [서비스 확인 안내](yj-services.md)를 따른다.

## 공통 구현

Squircle는 figma-squircle 경로, cornerSmoothing 0.8, preserveSmoothing, ResizeObserver를 사용한다. 배경 클립과 SVG 테두리를 같은 측정 크기에서 생성하고, 그림자는 바깥 filter에 둔다. Glass는 blur(20px) saturate(160%), 흰 틴트·테두리·하이라이트와 흰 90% fallback을 사용한다. 카메라·뒤로 가기·아바타·마이크는 원을 유지한다. 12-10의 공통 UI를 모든 흐름에서 조합한다. 홈의 오브를 제거하고 찍기 카드·조건부 바로가기 두 개를 사용한다.

Figma 자체에 남아 있는 예전 크기와 문서가 충돌하면 문서 규칙을 적용했다. 따라서 32px 홈 문구, 60px 기본 버튼, 넉넉한 공통 칩·카드 여백, 대화의 정확한 반반, 46 배경의 중복 제목 제거는 의도적인 차이다. Glass 굴절·분산은 CSS로 근사했다.

## 모든 화면 주소와 Figma 비교

왼쪽은 Figma Page 2, 오른쪽은 구현이다. 비교 캡처는 390×844, 홈은 402×874이며 긴 Figma 원본은 위쪽 뷰포트를 잘라 비교했다. 원본 PNG, 앱 PNG, 비교 PNG와 긴 화면의 아래쪽 캡처도 yj-screens에 있다. 네 홈은 같은 구조·위치이며 인사와 배경만 바뀐다.

| 번호 | 이름·주소 | Figma 노드 | 나란히 캡처 | 차이 |
| --- | --- | --- | --- | --- |
| 07 | [어디로 떠나시나요?](http://localhost:5173/trip) | [1:4583](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4583) | [비교](yj-screens/compare-07.png) | GeoNames 도시의 좌표·시간대와 Trip을 저장한다. 선택 카드·공통 버튼·ListRow의 여백이 원본과 소폭 다르다. 비교 캡처는 fixture다. |
| 38 | [여행지 검색 결과](http://localhost:5173/trip?q=로마&fixture=38) | [1:5889](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5889) | [비교](yj-screens/compare-38.png) | 비교용 fixture는 로마 예시 4곳이다(원본 3곳). 일반 검색은 GeoNames의 실제 결과이며 좌표와 IANA 시간대를 사용한다. |
| 43 | [여행지 결과 없음](http://localhost:5173/trip?q=로마나&fixture=43) | [1:6096](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6096) | [비교](yj-screens/compare-43.png) | 비교용 fixture는 로마나의 빈 결과다. 일반 검색의 빈 결과·연결 오류는 안내하며 검색창과 공통 컴포넌트 여백에 차이가 있다. |
| 08 | [메뉴판 촬영](http://localhost:5173/capture?fixture=08) | [1:4634](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4634) | [비교](yj-screens/compare-08.png) | 일반 주소는 실제 후면 카메라, fixture만 종이 예시를 표시한다. torch 기능이 있는 기기에서만 플래시를 보인다. 글래스 근사·종이 조판은 원본과 다르다. |
| 09 | [촬영 완료 · 사진 추가](http://localhost:5173/capture?fixture=09) | [1:4667](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4667) | [비교](yj-screens/compare-09.png) | 실제 JPEG 연속 촬영과 사진 묶음 개수를 사용한다. 카메라 프레임·기기별 비율 때문에 화면 내용은 Figma 정지 예시와 다르다. |
| 10 | [촬영 사진 펼쳐보기](http://localhost:5173/capture/photos?fixture=10) | [1:4705](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4705) | [비교](yj-screens/compare-10.png) | 실제 촬영 이미지의 펼쳐보기·삭제가 동작한다. 비교 fixture의 종이 조판·번호와 X 위치는 원본과 차이가 있다. |
| 11 | [촬영 사진 확대](http://localhost:5173/capture/photos/0?fixture=11) | [1:4739](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4739) | [비교](yj-screens/compare-11.png) | 실제 촬영 이미지를 확대·교체·삭제한다. 공통 액션 높이·글래스 근사와 사진 비율은 원본과 다르다. |
| 39 | [메뉴 인식 중](http://localhost:5173/analyze?fixture=39) | [1:5933](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5933) | [비교](yj-screens/compare-39.png) | 진행 이름을 실제 업로드→분석→결과 정리로 바꿨다. 고정 메뉴 수·가짜 타이머를 일반 흐름에서 제거했다. fixture는 첫 단계에서 정지한다. |
| 40 | [메뉴 인식 실패](http://localhost:5173/analyze?fixture=40) | [1:5961](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5961) | [비교](yj-screens/compare-40.png) | 실제 읽기 신뢰도와 오류(일일 한도/네트워크/결과 형식)를 표시하고 사진을 보관한다. 연결 오류는 사진 품질 탓으로 표시하지 않으며 재시도 안내를 추가했다. 비교 fixture는 읽음/흐림 두 장이다. |
| 41 | [카메라 권한 안내](http://localhost:5173/capture?fixture=41) | [1:6008](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6008) | [비교](yj-screens/compare-41.png) | 브라우저별 권한 설정 안내를 표시하고 설정에서 돌아오면 재요청한다. 웹에서 OS 설정을 직접 열지 않으며 앨범 선택을 대안으로 제공한다. 안내 문구가 Figma와 다르다. |
| 13 | [이 식당이 맞나요?](http://localhost:5173/restaurant/confirm) | [1:4763](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4763) | [비교](yj-screens/compare-13.png) | 일반 흐름은 메뉴판의 이름으로 OSM 검색한 식당을 사용한다. 지도 배경은 CSS 개략도이며 실제 지도 타일은 아니다. fixture는 Osteria 예시다. |
| 14 | [지금 계신 식당 고르기](http://localhost:5173/restaurant/select) | [1:4813](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4813) | [비교](yj-screens/compare-14.png) | 일반 흐름은 OSM 이름/주소 검색 결과를 사용하며 식당 없이도 계속할 수 있다. fixture는 기존 네 식당이다. 목록 여백은 공통 ListRow 기준이다. |
| 01 | [메뉴를 골라주세요](http://localhost:5173/menu?fixture=shared) | [1:1538](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1538) | [비교](yj-screens/compare-01.png) | MenuBoard의 실제 분류와 메뉴를 조합한다. 키가 없거나 fixture이면 기존 7개 예시다. 참고 사진의 출처·라이선스 표기가 추가되며 공통 칩 여백 때문에 노출 범위가 달라진다. |
| 06-2 | [메뉴 상세](http://localhost:5173/menu/zucca) | [1:4496](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4496) | [비교](yj-screens/compare-06-2.png) | confirmed와 ai를 분리해 표시하고 확인 질문·알레르기 가능성도 선택 메뉴 데이터에서 가져온다. 참고 이미지에는 저작자·라이선스를 표시한다. 긴 본문은 스크롤한다. |
| 18 | [직원에게 재료 확인하기](http://localhost:5173/menu/zucca/ask) | [1:4958](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4958) | [비교](yj-screens/compare-18.png) | 선택 메뉴의 ai.askStaff와 possibleAllergens를 사용한다. 유제품 고정 문구를 제거해 메뉴에 따라 문장·카드 높이가 달라진다. 직원 답변은 임시 UI 상태다. |
| 02 | [함께 담은 장바구니](http://localhost:5173/cart?fixture=shared) | [1:1622](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1622) | [비교](yj-screens/compare-02.png) | 최소 단위 정수와 ownerUserId를 사용해 소계·팁을 계산한다. fixture 동행자 소계는 EUR 30.80으로 원본의 22.00과 다르다. 실시간 기기간 동기화는 아직 시연용이다. |
| 22 | [장바구니 비어 있음](http://localhost:5173/cart?fixture=22) | [1:5139](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5139) | [비교](yj-screens/compare-22.png) | 오브 없는 텍스트 빈 상태다. 실제 장바구니가 0일 때도 같은 화면을 쓴다. 문구 블록의 세로 위치·행간이 원본과 소폭 다르다. |
| 03 | [이렇게 주문하세요](http://localhost:5173/order?fixture=shared) | [1:1706](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1706) | [비교](yj-screens/compare-03.png) | 요청 번역은 Gemini 어댑터를 거치고 실패한 요청은 원문을 유지한다. 주문 문장은 매번 계산하며 저장하지 않는다. 원본보다 문장 길이·카드 높이가 가변이다. |
| 17 | [주문 문장 크게 보여주기](http://localhost:5173/order/large?fixture=shared) | [1:4938](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4938) | [비교](yj-screens/compare-17.png) | 현재 또는 과거 주문의 실제 목업 문장을 크게 표시한다. 원본의 별도 축약 문장보다 길고 대문자가 많다. 18에서는 재료 질문, 15에서는 주문 문장을 표시하고 16으로 닫힌다. |
| 04 | [영수증 미리보기](http://localhost:5173/receipt?fixture=shared) | [1:1811](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1811) | [비교](yj-screens/compare-04.png) | MealRecord의 menuBoardId로 과거 메뉴판을 연결하고 Coperto·인원·팁·환율을 재계산한다. 일반 흐름에서 고정 물 가격을 제거했다. 긴 본문은 스크롤한다. |
| 15 | [대화 시작 안내](http://localhost:5173/talk/intro?fixture=shared) | [1:4865](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4865) | [비교](yj-screens/compare-15.png) | 03과 같은 전체 주문 문장을 사용해 예시 문장보다 카드가 길다. 공통 24px 카드 여백·60px 버튼을 적용했다. |
| 16 | [마주보기 대화](http://localhost:5173/talk) | [1:4896](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4896) | [비교](yj-screens/compare-16.png) | 정확히 상·하 422px, 상단 180도 회전을 유지한다(Figma와 경계 18px 차이). 기기 음성 입력과 Gemini 번역을 연결하며 미지원 시 직접 입력을 제공한다. |
| 45 | [음성 입력 중](http://localhost:5173/talk?fixture=45) | [31:1319](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=31-1319) | [비교](yj-screens/compare-45.png) | 일반 진입은 실제 브라우저 음성 인식을 사용한다. 미지원·권한 거부 시 직접 입력창이 추가된다. 반반 화면은 유지하며 파형은 입력 음량 분석이 없는 시각 효과다. |
| 44 | [번역 실패](http://localhost:5173/talk?fixture=44) | [31:1374](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=31-1374) | [비교](yj-screens/compare-44.png) | 원문을 유지하고 Gemini 번역 재시도·주문 문장 보기를 제공한다. 실패 원인에 따라 안내가 달라지고 줄바꿈·경계 위치는 원본과 다르다. |
| 19 | [주문 내역](http://localhost:5173/history) | [1:4999](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4999) | [비교](yj-screens/compare-19.png) | MenuBoard·Restaurant 참조를 가진 MealRecord를 D1에 저장한다. 초기 예시 두 건과 이후 실제 주문을 표시하며 날짜·금액·행 높이는 데이터에 따라 달라진다. |
| 21 | [주문 내역 비어 있음](http://localhost:5173/history?fixture=21) | [1:5100](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5100) | [비교](yj-screens/compare-21.png) | 원본처럼 오브 없이 글자와 촬영 버튼만 둔다. 공통 EmptyState의 행간·버튼 너비와 문구 위치에 차이가 있다. |
| 20 | [식사 평가](http://localhost:5173/history/rate) | [1:5062](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5062) | [비교](yj-screens/compare-20.png) | Rating의 again/once/notForMe·시각·기록 참조를 저장한다. 한국인 전체 집계는 준비 중이므로 안내를 내 맛 기록 저장으로 수정했다. |
| 31 | [둘러보기](http://localhost:5173/explore) | [1:5618](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5618) | [비교](yj-screens/compare-31.png) | 랭킹은 서버 어댑터의 시연 데이터이고 주변 식당은 OSM이다. 지도 배경은 개략도이며 공통 여백 때문에 원본보다 노출 범위가 작다. |
| 33 | [한국인 입맛 저격 랭킹](http://localhost:5173/explore/ranking) | [1:5835](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5835) | [비교](yj-screens/compare-33.png) | 서버 어댑터가 제공하는 한국인 랭킹 예시다. 실제 여러 사용자 집계는 아직 없다. 공통 카드·태그 여백과 이름 길이에 차이가 있다. |
| 05-2 | [근처 식당 · 지도](http://localhost:5173/explore/nearby) | [1:1888](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1888) | [비교](yj-screens/compare-05-2.png) | 실제 OSM 식당의 좌표로 마커를 배치한다. 도로 배경은 CSS 개략도이며 도보 시간은 직선거리 추정이다. © OpenStreetMap을 표시하고 미정 이동 두 개는 비활성으로 유지한다. |
| 05-3 | [근처 식당 · 목록](http://localhost:5173/explore/nearby?fixture=05-3) | [1:1978](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1978) | [비교](yj-screens/compare-05-3.png) | 일반 주소는 OSM 목록이며 알려지지 않은 평점·대표 메뉴·사진을 만들어 표시하지 않는다. 시트 위치·공통 ListRow 여백은 원본과 차이가 있다. |
| 42 | [근처 식당 결과 없음](http://localhost:5173/explore/nearby?fixture=42) | [1:6035](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6035) | [비교](yj-screens/compare-42.png) | 일반 흐름에서는 검색 결과 없음/연결 실패로 진입한다. fixture는 해산물 빈 결과다. 반경을 바꾸면 실제 검색을 다시 요청한다. |
| 32 | [식당 상세](http://localhost:5173/restaurants/rosa) | [1:5795](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5795) | [비교](yj-screens/compare-32.png) | 실제 OSM 식당에 사진·평가가 없으면 없음을 표시한다. fixture만 기존 추천 예시를 사용한다. 하단 이동은 추가하지 않았으며 배경 지도는 개략도다. |
| 23 | [함께 여행하는 사람](http://localhost:5173/companions) | [1:5165](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5165) | [비교](yj-screens/compare-23.png) | 실제 목업 친구의 태그를 모두 표시하므로 원본보다 태그가 많다. 비활성 친구는 각 Card로 표시해 원본의 한 카드 안 두 행과 다르다. 스위치·입맛 수정·초대·새 친구가 연결된다. |
| 25 | [친구 입맛 수정](http://localhost:5173/companions/miyoung/taste) | [1:5259](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5259) | [비교](yj-screens/compare-25.png) | Taste 알레르기는 EU 번호로 저장하고 칩 이름은 표시할 때만 바꾼다. 공통 칩 여백 때문에 줄바꿈·높이가 다르다. |
| 26 | [새 친구 등록](http://localhost:5173/companions/new) | [1:5338](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5338) | [비교](yj-screens/compare-26.png) | Friend.taste·travelingWith를 임시 계정 D1에 저장한다. 정식 로그인으로 오해하지 않도록 저장 안내를 수정했고 빈 이름은 등록하지 않는다. |
| 27 | [동행자 초대](http://localhost:5173/companions/youngsu/invite) | [1:5401](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5401) | [비교](yj-screens/compare-27.png) | 복사·QR·사용자가 누른 공유는 동작한다. 다른 폰의 같은 메뉴판/계정으로 실제 연결되지는 않으므로 시연 안내를 표시한다. 링크 길이로 줄바꿈이 다르다. |
| 28 | [MY](http://localhost:5173/my) | [1:5449](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5449) | [비교](yj-screens/compare-28.png) | 임시 계정의 기록·평가·동행 수를 계산한다. 카카오 로그인 중이라는 문구를 임시 계정 안내로 바꿨다. 데이터에 따라 카드 높이가 다르다. |
| 29 | [프로필 수정](http://localhost:5173/my/profile) | [1:5532](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5532) | [비교](yj-screens/compare-29.png) | 이름 편집·1~10자 검사와 저장을 연결했다. 아바타 이니셜은 이름에서 계산한다. 사진 변경 이동은 표에 없으므로 카메라 표시는 장식이다. 입력창은 초기 비포커스 상태다. |
| 30 | [개인정보와 저장](http://localhost:5173/my/privacy) | [1:5553](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5553) | [비교](yj-screens/compare-30.png) | Google Gemini 사진 전송·무료 등급 입력 사용 가능성·기기 사진 보관을 명시했다. 임시 계정과 브라우저 음성 인식 안내 때문에 원본보다 행이 길다. |
| 46 | [기록 삭제 확인](http://localhost:5173/my/privacy?fixture=46) | [1:6195](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6195) | [비교](yj-screens/compare-46.png) | 식사·평가·친구 기록과 장바구니를 지운다. 시트는 기존 402px 기준이며 임시 계정 문구로 바꿨다. 기기에 임시 보관한 촬영 사진은 이 목록의 삭제 대상에 포함하지 않는다. |
| 홈·아침 | [홈 아침](http://localhost:5173/?period=morning) | [42:1383](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1383) | [비교](yj-screens/compare-home-morning.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |
| 홈·오전 | [홈 오전](http://localhost:5173/?period=late-morning) | [42:1457](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1457) | [비교](yj-screens/compare-home-late-morning.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |
| 홈·점심 | [홈 점심](http://localhost:5173/?period=lunch) | [42:1531](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1531) | [비교](yj-screens/compare-home-lunch.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |
| 홈·저녁 | [홈 저녁](http://localhost:5173/?period=evening) | [42:1605](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1605) | [비교](yj-screens/compare-home-evening.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |

## 직접 눌러볼 순서

1. 휴대폰 HTTPS 주소를 열고 홈 → 메뉴판 찍기 → 카메라 허용 → 실제 메뉴판을 한 장씩 촬영한다.
2. 사진 묶음 → 확대/다시 찍기/삭제 → 해석하기. Gemini 키가 없으면 Osteria 예시 결과라는 안내가 나온다.
3. 식당 확인 또는 다른 식당/식당 없이 계속 → 메뉴 상세 → 직원에게 재료 확인 → 장바구니에 담기.
4. 장바구니 → 요청 입력 → 주문 문장 → 크게 보여주기 또는 대화 → 주문했어요 → 영수증.
5. 실제 서비스 대신 고정 화면을 비교하려면 위 주소에 `fixture=화면번호`를 붙인다. 21·22·42·43·44·45·46은 표의 fixture 주소로 직접 연다.

## 검증

> 아래는 2026-10-25 전체 디자인 검증 기록이다. **평소 작업에서는 다시 하지 않는다.** 검증 범위는 `AGENTS.md`의 '검증은 가볍게' 규칙을 따른다.

- `npm run build`, `npm run lint`, `npx tsc --noEmit --incremental false`를 실행한다. lint의 기존 비-yj unused 경고는 남아 있다.
- `node scripts/yj-flow.test.mjs`: 정수 계산·소유자 보호·표시값 왕복·경로·카메라 정지/늦은 권한 응답·결과 검증·한 번 재요청·해시 캐시·일일 제한·OSM 캐시/속도·환율 캐시 등 17건.
- `scripts/yj-camera.test.mjs`: 가상 장치를 실제 getUserMedia에 연결해 JPEG 촬영/교체/삭제, 백그라운드 정지·재시작, 화면 이탈 종료, IndexedDB 복원, 키 없는 서버 분석→메뉴→장바구니, 음성 직접 입력, 권한 거부를 검사한다. localhost와 위 HTTPS 주소 모두 확인했다.
- `scripts/yj-browser.test.mjs`: 45개 fixture 화면의 크기·자산·반반·회전·공통 스무딩·패딩·글자 크기를 검사하고 나란히 캡처한다. `yj-screens/verification.json`에 결과가 있다.
- `scripts/yj-interactions.test.mjs`: 고정 fixture에서 메뉴 주문·평가·둘러보기·친구·MY의 버튼 연결을 검사한다.
- 브라우저 검사 실행 예: `PLAYWRIGHT_MODULE=/절대경로/playwright/index.mjs CHROME_PATH=/브라우저/실행파일 node scripts/yj-camera.test.mjs`. HTTPS 검사는 `YJ_BASE_URL=https://…`를 함께 지정한다.
- 실제 응답 확인: Frankfurter EUR/KRW(기준일 2026-10-23), GeoNames 로마와 좌표/시간대, Wikimedia 저작자/CC BY 2.0, OSM 식당 ID `osm:node/1716415264`. Overpass 과부하 시 bounded Nominatim으로 전환했다. Gemini는 키가 없으므로 실제 생성 응답을 검증하지 않았다.

## 남은 사항

정식 로그인·기기간 초대/실시간 장바구니 동기화·한국인 전체 집계는 시연용이다. 지도 배경은 실제 지도 타일이 아닌 개략도이며 거리/도보 시간은 직선거리 추정이다. 물리적인 iPhone/Android 카메라·기기별 torch·내장 음성은 사용자 기기에서 마지막 확인이 필요하다. Gemini/Pexels는 키가 없어 실제 공급자 응답까지 확인하지 않았다. CSS 글래스의 광학 효과·줄바꿈·일부 행 높이에는 위 표의 차이가 있다.
