# yj 전체 흐름 — 2차 개정 구현·검증·화면별 차이

기준: src 최신 DESIGN-yj.md·ROUTES-yj.md 전체. 맨 위 2차 개정 안내 및 11–13절을 우선했다. Figma는 Page 2의 지정 노드 45개를 각각 get_design_context와 스크린샷으로 확인했고, ⑧ 보관 레인은 구현하지 않았다.

## 실행과 저장 범위

- 실행: `npm run dev -- --host`. vinext의 옵션 이름에 맞게 실행 래퍼에서 --host를 --hostname 0.0.0.0으로 전달한다.
- 컴퓨터: http://localhost:5173 · 같은 와이파이 휴대폰: http://192.168.104.104:5173 (현재 en0 주소).
- 기존 lib/yj/model.ts의 메뉴·가격·주문 계산 목업을 유지하고, 나머지 흐름용 계정·여행지·식당·평가 목업을 같은 모듈에 더했다. API 호출은 없다.
- 촬영은 종이 목업, 앨범은 실제 파일 선택이다. 사진·분석 상태만 IndexedDB에 임시 보관한다. 프로필·친구·도시·주문 기록·평가는 현재 실행 메모리에 있어 새로 열면 샘플로 돌아간다.
- 일반 촬영은 첫 사진 성공, 둘째 이후 사진 일부 실패. 교체 촬영은 읽을 수 있는 사진으로 바뀐다. `?analysis=success` / `?analysis=partial`로 시작하면 결과를 고정할 수 있다.
- `fixture=39`는 인식 중, `fixture=45`는 입력 중을 캡처 가능하게 정지한다. 일반 대화 마이크는 3초 후 성공하고 `/talk?talk=failure`는 44로 실패한다.
- 주문 요청 목업 번역: 치즈 빼고 주세요 / 우유 빼고 주세요 / 맵지 않게 해주세요 / 물 주세요. 그 밖에는 원문과 안내를 표시한다. TTS는 기기의 로컬 음성만 쓰고, 지원 음성이 없으면 안내한다.
- 초대 복사·QR·사용자가 누르는 공유는 동작하지만 실제 계정 로그인·기기간 메뉴판/장바구니 동기화·분석·번역·실시간 음성·지도 서비스는 연결하지 않았다. 디자인의 카카오/서버 저장 안내는 목업이다.

## 공통 구현

Squircle는 figma-squircle 경로, cornerSmoothing 0.8, preserveSmoothing, ResizeObserver를 사용한다. 배경 클립과 SVG 테두리를 같은 측정 크기에서 생성하고, 그림자는 바깥 filter에 둔다. Glass는 blur(20px) saturate(160%), 흰 틴트·테두리·하이라이트와 흰 90% fallback을 사용한다. 카메라·뒤로 가기·아바타·마이크는 원을 유지한다. 12-10의 공통 UI를 모든 흐름에서 조합한다. 홈의 오브를 제거하고 찍기 카드·조건부 바로가기 두 개를 사용한다.

Figma 자체에 남아 있는 예전 크기와 문서가 충돌하면 문서 규칙을 적용했다. 따라서 32px 홈 문구, 60px 기본 버튼, 넉넉한 공통 칩·카드 여백, 대화의 정확한 반반, 46 배경의 중복 제목 제거는 의도적인 차이다. Glass 굴절·분산은 CSS로 근사했다.

## 모든 화면 주소와 Figma 비교

왼쪽은 Figma Page 2, 오른쪽은 구현이다. 비교 캡처는 390×844, 홈은 402×874이며 긴 Figma 원본은 위쪽 뷰포트를 잘라 비교했다. 원본 PNG, 앱 PNG, 비교 PNG와 긴 화면의 아래쪽 캡처도 yj-screens에 있다. 네 홈은 같은 구조·위치이며 인사와 배경만 바뀐다.

| 번호 | 이름·주소 | Figma 노드 | 나란히 캡처 | 차이 |
| --- | --- | --- | --- | --- |
| 07 | [어디로 떠나시나요?](http://localhost:5173/trip) | [1:4583](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4583) | [비교](yj-screens/compare-07.png) | 흰 선택 카드·60px 버튼·30px 스쿼클을 적용했다. 목록의 여백과 행 높이는 공통 컴포넌트 기준이어서 원본과 소폭 다르다. 여행지 선택은 계정 목업의 도시와 현지 시간대를 바꾼다. |
| 38 | [여행지 검색 결과](http://localhost:5173/trip?q=로마&fixture=38) | [1:5889](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5889) | [비교](yj-screens/compare-38.png) | 고정 검색 예시의 결과가 제공하는 목업 도시 목록에 따라 4곳이다(원본 3곳). 첫 결과 로마를 선택한 상태로 직접 열며, 실제 입력 시에는 선택한 행을 반영한다. |
| 43 | [여행지 결과 없음](http://localhost:5173/trip?q=로마나&fixture=43) | [1:6096](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6096) | [비교](yj-screens/compare-43.png) | 원본처럼 로마나 검색의 빈 상태와 추천 2곳을 표시한다. 검색어·추천 선택은 로컬 목록만 사용하며 검색창 테두리·안내 간격이 다르다. |
| 08 | [메뉴판 촬영](http://localhost:5173/capture?fixture=08) | [1:4634](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4634) | [비교](yj-screens/compare-08.png) | 촬영 화면은 메뉴판 종이 목업이다. 실제 라이브 카메라·권한 요청은 없다. 촬영 버튼의 글래스가 원본보다 밝고 메뉴판 글자 크기·행간이 다르다. |
| 09 | [촬영 완료 · 사진 추가](http://localhost:5173/capture?fixture=09) | [1:4667](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4667) | [비교](yj-screens/compare-09.png) | 연속 셔터로 목업 사진 수가 늘어난다. 사진 묶음·카메라 버튼의 글래스 근사와 종이 조판이 원본과 다르다. |
| 10 | [촬영 사진 펼쳐보기](http://localhost:5173/capture/photos?fixture=10) | [1:4705](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4705) | [비교](yj-screens/compare-10.png) | 실제 촬영 목록 수를 표시한다. 종이 썸네일 내부 글자와 X·번호의 상대 위치가 원본과 다르며, 더 찍기 타일은 기존 점선 모양이다. |
| 11 | [촬영 사진 확대](http://localhost:5173/capture/photos/0?fixture=11) | [1:4739](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4739) | [비교](yj-screens/compare-11.png) | 로컬 선택 사진을 확대하고 교체·삭제한다. 60px 공통 액션과 글래스 근사 때문에 원본의 작은 액션보다 높이가 크다. 종이 조판도 다르다. |
| 39 | [메뉴 인식 중](http://localhost:5173/analyze?fixture=39) | [1:5933](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5933) | [비교](yj-screens/compare-39.png) | 오브 없이 단계 카드만 둔다. 직접 fixture는 첫 단계를 진행 중으로 고정한다(원본은 첫 단계 완료). 메뉴 수는 기존 목업의 7개이며 원본의 예시 14개와 다르다. 안내·취소는 하단에 고정했다. |
| 40 | [메뉴 인식 실패](http://localhost:5173/analyze?fixture=40) | [1:5961](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5961) | [비교](yj-screens/compare-40.png) | 읽음/흐림 목업 사진 두 장을 사용한다. 실패 이유 카드와 사진 내부 조판·여백에 차이가 있다. 읽은 메뉴만 보기는 수프 4개를 남긴다. |
| 41 | [카메라 권한 안내](http://localhost:5173/capture?fixture=41) | [1:6008](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6008) | [비교](yj-screens/compare-41.png) | 허용 버튼은 목업 권한을 바꿔 08로 돌아간다. OS 설정을 열지 않는다. 앨범 선택은 실제 브라우저 파일 선택을 사용한다. 카드의 안쪽 여백은 공통 24px 기준이다. |
| 13 | [이 식당이 맞나요?](http://localhost:5173/restaurant/confirm) | [1:4763](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4763) | [비교](yj-screens/compare-13.png) | 목업 지도와 원본 식당명·주소를 사용한다. 위치 도형·도로는 CSS로 그려 원본과 완전히 같지 않다. 정보 박스와 버튼은 공통 스쿼클이다. |
| 14 | [지금 계신 식당 고르기](http://localhost:5173/restaurant/select) | [1:4813](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4813) | [비교](yj-screens/compare-14.png) | 기존 식당 목업의 이름·주소 검색을 사용한다. 목록 여백·행간은 공통 ListRow 기준이고 선택 결과를 01에 반영한다. |
| 01 | [메뉴를 골라주세요](http://localhost:5173/menu?fixture=shared) | [1:1538](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1538) | [비교](yj-screens/compare-01.png) | 기존 7개 메뉴·가격·사진을 그대로 사용한다. 80% 스쿼클과 넉넉한 칩 여백을 적용해 일부 줄바꿈·노출 범위가 달라진다. 기본 장바구니는 비어 있고 shared fixture는 원본처럼 3개다. |
| 06-2 | [메뉴 상세](http://localhost:5173/menu/zucca) | [1:4496](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4496) | [비교](yj-screens/compare-06-2.png) | 사진 위 뒤로 가기는 Glass, AI 카드는 AI 그라디언트와 같은 경로 테두리를 쓴다. 실제 목업 메뉴 데이터 때문에 줄바꿈·카드 높이가 원본과 다르다. 긴 본문은 844px 안에서 스크롤한다. |
| 18 | [직원에게 재료 확인하기](http://localhost:5173/menu/zucca/ask) | [1:4958](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4958) | [비교](yj-screens/compare-18.png) | 실시간 대화가 연결되었다. 넉넉한 공통 칩 여백 때문에 답변 3개가 두 줄이 될 수 있다. 선택한 답은 메뉴 상세에 남는다. |
| 02 | [함께 담은 장바구니](http://localhost:5173/cart?fixture=shared) | [1:1622](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1622) | [비교](yj-screens/compare-02.png) | 모든 금액은 기존 목업 데이터로 계산한다. 동행자 소계는 EUR 30.80으로 원본의 EUR 22.00과 다르다. 60px 버튼과 가변 시트 높이를 사용한다. |
| 22 | [장바구니 비어 있음](http://localhost:5173/cart?fixture=22) | [1:5139](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5139) | [비교](yj-screens/compare-22.png) | 오브 없는 텍스트 빈 상태다. 실제 장바구니가 0일 때도 같은 화면을 쓴다. 문구 블록의 세로 위치·행간이 원본과 소폭 다르다. |
| 03 | [이렇게 주문하세요](http://localhost:5173/order?fixture=shared) | [1:1706](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1706) | [비교](yj-screens/compare-03.png) | 장바구니와 요청을 그대로 반영한 전체 주문 문장을 사용한다. 원본의 축약된 문장·소문자 예시와 달라 카드 높이가 가변이다. 직원 재질문은 15로 연결된다. |
| 17 | [주문 문장 크게 보여주기](http://localhost:5173/order/large?fixture=shared) | [1:4938](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4938) | [비교](yj-screens/compare-17.png) | 현재 또는 과거 주문의 실제 목업 문장을 크게 표시한다. 원본의 별도 축약 문장보다 길고 대문자가 많다. 18에서는 재료 질문, 15에서는 주문 문장을 표시하고 16으로 닫힌다. |
| 04 | [영수증 미리보기](http://localhost:5173/receipt?fixture=shared) | [1:1811](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1811) | [비교](yj-screens/compare-04.png) | 현재 또는 선택한 과거 기록의 수량·팁·식당·날짜를 반영한다. 원화 반올림으로 원본과 1원 차이가 날 수 있다. 원본 1185px 영수증을 844px 본문 스크롤로 읽는다. |
| 15 | [대화 시작 안내](http://localhost:5173/talk/intro?fixture=shared) | [1:4865](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4865) | [비교](yj-screens/compare-15.png) | 03과 같은 전체 주문 문장을 사용해 예시 문장보다 카드가 길다. 공통 24px 카드 여백·60px 버튼을 적용했다. |
| 16 | [마주보기 대화](http://localhost:5173/talk) | [1:4896](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4896) | [비교](yj-screens/compare-16.png) | 12-6에 따라 정확히 상·하 422px이며 상단 전체를 180도 회전했다. Figma의 상단 404px/하단 440px과 18px 차이난다. 직원 입력과 빠른 답변은 목업이다. |
| 45 | [음성 입력 중](http://localhost:5173/talk?fixture=45) | [31:1319](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=31-1319) | [비교](yj-screens/compare-45.png) | 16과 같은 정확한 반반 레이아웃이다. 파형은 정적 목업, 원본 pulse SVG를 사용한다. 일반 진입은 3초 뒤 성공/실패로 바뀌고 fixture 주소는 입력 중에 멈춘다. |
| 44 | [번역 실패](http://localhost:5173/talk?fixture=44) | [31:1374](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=31-1374) | [비교](yj-screens/compare-44.png) | 16과 같은 반반 레이아웃이다. 경고·재시도·오프라인 주문 문장·30% 마이크를 표시한다. 실패 조건은 URL로 유지한다. 버튼·문장 줄바꿈과 경계 위치가 원본과 다르다. |
| 19 | [주문 내역](http://localhost:5173/history) | [1:4999](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-4999) | [비교](yj-screens/compare-19.png) | 기존 메뉴로 만든 주문 목업 기록과 실제 평가 대기 수를 표시한다. 사진은 56px 겹친 원으로 맞췄다. 기록의 식당·날짜·금액·행 높이는 데이터에 따라 달라진다. |
| 21 | [주문 내역 비어 있음](http://localhost:5173/history?fixture=21) | [1:5100](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5100) | [비교](yj-screens/compare-21.png) | 원본처럼 오브 없이 글자와 촬영 버튼만 둔다. 공통 EmptyState의 행간·버튼 너비와 문구 위치에 차이가 있다. |
| 20 | [식사 평가](http://localhost:5173/history/rate) | [1:5062](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5062) | [비교](yj-screens/compare-20.png) | 대기 중인 메뉴를 실제 순서대로 평가한다. 진행 바는 남은 개수 기준이고 카드·줄바꿈·여백이 다르다. 마지막 평가 후 19로 돌아간다. |
| 31 | [둘러보기](http://localhost:5173/explore) | [1:5618](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5618) | [비교](yj-screens/compare-31.png) | 기존 메뉴 이름을 유지해서 랭킹 카드의 긴 이름이 생략된다. 공통 태그 여백 때문에 아시안 목록 행이 원본보다 커져 아래 지도 노출 범위가 작다. 지도는 로컬 도형 목업이다. |
| 33 | [한국인 입맛 저격 랭킹](http://localhost:5173/explore/ranking) | [1:5835](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5835) | [비교](yj-screens/compare-33.png) | 기존 메뉴 이름·비유를 그대로 사용한다. 넉넉한 태그와 카드 여백 때문에 원본보다 내용 높이가 크다. 수프 외 카테고리는 평가 목업이 없어 빈 안내를 표시한다. |
| 05-2 | [근처 식당 · 지도](http://localhost:5173/explore/nearby) | [1:1888](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1888) | [비교](yj-screens/compare-05-2.png) | 도로·반경·마커를 로컬 도형/원본 자산으로 조합했다. 원본과 위치·테두리·색이 일부 다르다. 시트의 두 미정 버튼은 비활성이고 이유를 title에 표시한다. |
| 05-3 | [근처 식당 · 목록](http://localhost:5173/explore/nearby?fixture=05-3) | [1:1978](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-1978) | [비교](yj-screens/compare-05-3.png) | 목록 시트의 시작 높이를 원본 314px에 맞췄다. 카드·썸네일·대표 메뉴의 여백은 공통 규격으로 커질 수 있다. 지도 보기와 식당 행만 표대로 연결한다. |
| 42 | [근처 식당 결과 없음](http://localhost:5173/explore/nearby?fixture=42) | [1:6035](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6035) | [비교](yj-screens/compare-42.png) | 해산물 빈 결과 fixture다. 공통 칩·60px 버튼·30px 시트 때문에 높이가 수 px 달라질 수 있다. 반경 선택/확장은 로컬 결과 상태를 바꾼다. |
| 32 | [식당 상세](http://localhost:5173/restaurants/rosa) | [1:5795](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5795) | [비교](yj-screens/compare-32.png) | 하단 버튼 없이 사진·평점·추천·주소 복사만 있다. 사진은 지정 식당의 목업이며 실제 거리뷰가 아니다. 주소·추천 행의 여백과 글자 크기가 원본과 일부 다르다. |
| 23 | [함께 여행하는 사람](http://localhost:5173/companions) | [1:5165](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5165) | [비교](yj-screens/compare-23.png) | 실제 목업 친구의 태그를 모두 표시하므로 원본보다 태그가 많다. 비활성 친구는 각 Card로 표시해 원본의 한 카드 안 두 행과 다르다. 스위치·입맛 수정·초대·새 친구가 연결된다. |
| 25 | [친구 입맛 수정](http://localhost:5173/companions/miyoung/taste) | [1:5259](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5259) | [비교](yj-screens/compare-25.png) | 기존 목업의 선택 상태와 넉넉한 12-11 칩 여백을 적용했다. 원본보다 줄바꿈·전체 높이가 달라진다. 내 입맛 진입도 이 틀을 쓰고 표대로 저장 후 23으로 간다. |
| 26 | [새 친구 등록](http://localhost:5173/companions/new) | [1:5338](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5338) | [비교](yj-screens/compare-26.png) | 공통 칩과 입력창 여백 때문에 원본과 배치가 일부 다르다. 이름이 비면 등록 버튼을 비활성으로 둔다. 계정 저장 안내는 디자인 문구이며 실제 저장은 현재 실행의 메모리다. |
| 27 | [동행자 초대](http://localhost:5173/companions/youngsu/invite) | [1:5401](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5401) | [비교](yj-screens/compare-27.png) | 링크는 실행 중인 앱의 동행자 목업 주소다. 복사·사용자가 누른 Web Share·실제 QR 생성은 동작한다. 원본의 짧은 예시 URL과 달라 링크 줄바꿈·높이가 다르다. 기기간 동기화는 없다. |
| 28 | [MY](http://localhost:5173/my) | [1:5449](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5449) | [비교](yj-screens/compare-28.png) | 현재 목업 기록 2개·평가 1개·동행 1명을 계산해 원본 예시 12/18과 다르다. 카드 높이와 태그 수가 데이터에 따라 달라진다. |
| 29 | [프로필 수정](http://localhost:5173/my/profile) | [1:5532](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5532) | [비교](yj-screens/compare-29.png) | 이름 편집·1~10자 검사와 저장을 연결했다. 아바타 이니셜은 이름에서 계산한다. 사진 변경 이동은 표에 없으므로 카메라 표시는 장식이다. 입력창은 초기 비포커스 상태다. |
| 30 | [개인정보와 저장](http://localhost:5173/my/privacy) | [1:5553](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-5553) | [비교](yj-screens/compare-30.png) | 12-1에 따라 제목·보조 설명을 반복하지 않는다. 카드 행은 공통 여백 때문에 원본과 높이가 다르다. 로그인·서버 저장 안내는 목업 디자인 문구다. |
| 46 | [기록 삭제 확인](http://localhost:5173/my/privacy?fixture=46) | [1:6195](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=1-6195) | [비교](yj-screens/compare-46.png) | 12-1에 따라 배경의 중복 제목을 뺐다(원본 46에는 남아 있음). 개수는 현재 목업의 2/1/3이다. 삭제는 현재 실행의 계정 목업과 장바구니만 지운다. 시트는 최소 402px로 맞췄다. |
| 홈·아침 | [홈 아침](http://localhost:5173/?period=morning) | [42:1383](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1383) | [비교](yj-screens/compare-home-morning.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |
| 홈·오전 | [홈 오전](http://localhost:5173/?period=late-morning) | [42:1457](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1457) | [비교](yj-screens/compare-home-late-morning.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |
| 홈·점심 | [홈 점심](http://localhost:5173/?period=lunch) | [42:1531](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1531) | [비교](yj-screens/compare-home-lunch.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |
| 홈·저녁 | [홈 저녁](http://localhost:5173/?period=evening) | [42:1605](https://www.figma.com/design/8AarnXQcxyr4OM0yQNAtWH/?node-id=42-1605) | [비교](yj-screens/compare-home-evening.png) | 문서 우선으로 문구는 32px(원본 30px), 카메라·카드·탭바는 공통 글래스 근사다. 상태 바는 웹에서 그린 도형이다. 식당명·평가 수는 목업 데이터이며 글자 폭·그림자에 소폭 차이가 있다. |

## 직접 눌러볼 순서

1. 홈 → 메뉴판 찍기 → 셔터 두 번 → 사진 묶음 → 사진 한 장 → 닫기 → 해석하기 → 일부 실패 → 읽은 메뉴만 먼저 보기 → 다른 식당이에요 → 이 식당으로 할게요.
2. 함께 담은 장바구니 → 빈 상태 → 메뉴 보러 가기 → 호박 수프 상세 → 직원에게 확인하는 문장 → 대답 칩 → 실시간 대화 → 대화 마치기 → 메뉴 상세 복귀 → 장바구니에 담기.
3. 함께 담은 장바구니 → 주문 문장 만들기 → 요청 입력 → 크게 보여주기 → 닫기 → 직원이 되물었어요 → 주문 문장 먼저 보여주기 → 닫기 → 대화 마이크 → 대화 마치기 → 주문했어요 → 영수증.
4. 홈 → 평가 바로가기 또는 주문 내역 → 평가하기 → 마지막 평가 후 주문 내역. 둘러보기 → 지도 → 마커 → 시트 펼치기 → 식당, MY → 프로필/동행자/개인정보 → 삭제 확인도 확인할 수 있다.

## 검증

- npm run build 성공.
- npm run lint 성공(기존 비-yj 파일의 unused 경고 12개, 오류 0개). 전체 tsc --noEmit 성공. 검증을 막던 기존 cloud-api/cloud-cities의 any·콜백 타입만 보완했으며 이 UI에서 호출하지 않는다.
- node --test scripts/yj-flow.test.mjs 성공: 기존 계산·문장·수량·현지 시각 5건 + 전체 화면/fixture 대응·평가 대기·여행지·스쿼클 경로 검증.
- scripts/yj-browser.test.mjs: 45개 직접 URL, 크기, 이미지 누락, 런타임 오류, 반반 높이·회전, 오브 제거, 탭바 위치, 외부 요청을 검사하고 비교 이미지를 생성한다. 결과는 yj-screens/verification.json.
- scripts/yj-interactions.test.mjs: 핵심 촬영→영수증→평가, 둘러보기/지도/목록/빈 결과, 여행지 검색, 친구 스위치·초대 QR·등록, MY 편집·삭제, 번역 실패 fallback을 실제 클릭으로 확인한다. API 요청 0개.
- 브라우저 검증 실행 예: PLAYWRIGHT_MODULE=/절대경로/playwright/index.mjs CHROME_PATH=/브라우저/실행파일 node scripts/yj-browser.test.mjs (상호작용 스크립트도 같은 환경 변수). 브라우저 설치 경로는 실행 환경에 맞춘다.

## 남은 사항

화면·표에 지정한 이동·fixture·캡처는 모두 구현했다. 05-2의 길찾기/메뉴판 보기 목적지는 이동표가 미정으로 남겼으므로 연결하지 않았다. 실제 API/로그인/음성 인식/카메라 설정/기기간 동기화는 요청 범위대로 목업이다. CSS 글래스의 광학 효과, 텍스트 줄바꿈, 일부 행 높이·아이콘·썸네일 조판에는 위 표의 차이가 남아 있다.
