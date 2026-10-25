# yj 카메라·데이터·서비스 확인 안내

2026-10-26 · src · DATA-yj.md 3–6절 / DESIGN-yj.md 2차 개정 / ROUTES-yj.md 기준.

## 실행 주소

- 휴대폰: https://last-invite-ment-cradle.trycloudflare.com
- 컴퓨터: http://localhost:5173
- 일반 촬영: `/capture`. Figma 고정 화면: `/capture?fixture=08` (이 주소는 실제 카메라를 열지 않는다).
- 개발 서버와 터널을 켜 둔다. Mac이 잠들거나 두 프로세스가 종료되면 HTTPS 주소도 닫힌다. 터널을 다시 만들면 주소가 바뀐다.

## Gemini 키 넣기

저장소 루트에서 `.env.example`을 `.dev.vars`로 복사한다. 이미 `.dev.vars`가 있으면 덮어쓰지 말고 필요한 이름만 추가한다. `.dev.vars`는 Git에서 제외된다. 화면에 전달되는 `NEXT_PUBLIC_*` 이름은 사용하지 않는다.

```sh
cp .env.example .dev.vars
```

`.dev.vars`에서 `GEMINI_API_KEY=` 뒤에 발급받은 키를 넣는다. 값을 저장한 다음 개발 서버 터미널에서 Ctrl+C 후 다시 실행한다.

```sh
npm run dev -- --host
```

- 기본 모델: `gemini-3.5-flash-lite`. `GEMINI_MODEL`이 비어 있으면 기본값을 쓴다.
- 메뉴 참고 사진은 메뉴 전체를 순차 조회한다. Wikidata와 별개로 Commons에 원문→부재료를 제외한 짧은 이름→영어 번역 이름 순으로 검색한다. 영어 번역은 서버 Gemini와 문장 캐시를 쓰며 키가 없어도 원문/짧은 이름 검색은 동작한다. 출처·저작자·라이선스가 있는 사진만 사용하고 실제 식당 사진으로 단정하지 않는다. 성공 사진만 7일 캐시하며 기존 검색 실패 캐시는 무시한다. 화면 이탈 후의 결과는 적용하지 않는다.
- 생성용 응답 스키마는 구조·필수 필드·enum을 지정한다. 복잡한 중첩 개수/범위 제약은 서버 Zod에서 엄격히 검사한다. 일시적인 5xx/408 응답은 1초·2초에 지터를 더해 두 번 재시도하고 키·권한·모델·요청 형식 오류는 구분해 안내한다.
- 분석 기본 제한: 익명 사용자 쿠키별 UTC 하루 10회. `GEMINI_DAILY_LIMIT`으로 바꾼다. 캐시 적중은 차감하지 않는다.
- 선택: `PEXELS_API_KEY` (Wikimedia에 사진이 없을 때만 사용), `OSM_USER_AGENT` (앱 이름·연락 가능한 프로젝트 주소).
- 키 없이도 촬영·저장·화면을 볼 수 있다. 메뉴 분석은 Osteria 예시이며 키 없는 요청 번역은 네 가지 예시만 지원한다. 임의 대화 번역은 실패 안내를 보인다.
- `.dev.vars` 수정은 개발 서버를 다시 켜야 적용된다. 같은 5173 포트로 재시작하면 현재 터널을 유지할 수 있다.

현재 임시 터널 실행 파일은 `/tmp/meide-tunnel-bin/cloudflared`다. 종료 후 다시 열려면 아래를 실행한다.

```sh
/tmp/meide-tunnel-bin/cloudflared tunnel --url http://localhost:5173 --protocol http2 --no-autoupdate
```

## 휴대폰 확인 순서

1. HTTPS 주소 → 홈 → 메뉴판 찍기. 후면 카메라 권한을 허용한다. 여러 장을 순서대로 촬영한다.
2. 사진 묶음의 개수 → 사진 펼치기 → 한 장 확대 → 다시 찍기/삭제를 확인한다. 새로고침해도 사진이 남는다.
3. 해석하기 → 실제 업로드/분석/결과 정리 단계 → 식당 확인. 키가 없으면 예시임을 안내한다.
4. 식당을 고르거나 식당 없이 계속 → 메뉴 카드/상세 → 장바구니에 담기. 가격은 최소 단위 정수로 계산하고 환율 기준일을 표시한다.
5. 장바구니 → 요청 입력 → 주문 문장/크게 보여주기 → 주문했어요 → 영수증. 대화의 양쪽 마이크를 시험하고 미지원이면 직접 입력한다.
6. 카메라를 연 채 다른 앱으로 전환했다가 돌아온다. 나가면 스트림을 끄고 돌아오면 다시 요청한다. 권한을 거부하면 41에서 브라우저별 안내와 앨범 선택을 제공한다.

## 실제 연결과 시연 데이터

| 기능 | 현재 동작 | 확인 범위 |
| --- | --- | --- |
| 카메라·앨범 | 브라우저 실제 장치, canvas JPEG ≤1600px/0.8, IndexedDB | Chrome 가상 장치로 localhost·HTTPS 전체 흐름 통과. 물리 기기/torch는 기기별 확인 필요 |
| 메뉴 분석 | 서버 Gemini REST 구조화 출력 + Zod + 한 번 재요청 | 실제 키로 합성 메뉴판 이미지 분석 완료. 오류·캐시·제한은 모의 공급자로 검증 |
| 요청/대화 번역 | 같은 Gemini 서버 어댑터, 문장 캐시 | 이번 실제 공급자 검증은 메뉴 분석에 한정. 번역 실패 시 원문 유지 |
| 식당 | OSM Overpass + Nominatim, 전역 1.1초 간격/D1 예약, 캐시 | 실제 식당 응답 확인. Overpass 과부하 시 사용자별 한정 범위 Nominatim 검색으로 대체 |
| 메뉴 참고 사진 | Wikidata P18 → Commons 검색 → 선택 Pexels | Commons 실제 응답/저작자/라이선스 확인. Pexels 키 없음 |
| 환율 | Frankfurter ECB, UTC 날짜별 캐시, 기준일 | 실제 EUR/KRW와 기준일 확인 |
| 여행지 | 저장소의 GeoNames 데이터 + tz-lookup | 실제 로마 검색/좌표/Europe/Rome 확인 |
| 위치 | navigator.geolocation, 거부/미지원이면 Trip 도시 중심 | 브라우저 어댑터 구현. 사용자의 실제 위치는 수집하지 않고 거부·기본 좌표 경로 확인 |
| 읽기/말하기 | Web Speech API. 내장 로컬 TTS, 브라우저 음성 인식/직접 입력 | 직접 입력/미지원 경로 확인. 음성 인식 서비스의 성공·음질은 기기 확인 필요 |
| 계정·기록·친구·장바구니 | HttpOnly 익명 쿠키 + 로컬 D1, 버전/소유자 검사 | 정식 로그인/다른 폰 계정 연동은 준비 중 |
| 초대·랭킹·평점 | 서버 어댑터의 예시, QR·복사·공유 UI | 실제 기기간 초대/실시간 장바구니/여러 사용자 집계는 시연용 |
| 지도 | 실제 식당 좌표의 마커 + CSS 개략도 | 지도 타일/실제 도보 경로는 연결하지 않음. 이동표의 미정 버튼은 비활성 |

## 데이터와 저장

`lib/yj/model.ts`는 DATA 3절의 원본 타입만 정의한다. `fixtures.ts` 목업도 같은 구조다. `services/server.ts`는 Worker 전용이며 클라이언트에서 import하지 않는다. 화면은 `services/client.ts`의 동일 출처 RPC를 사용하고, `services/display.ts`는 기존 UI용 표시값과 원본 데이터 사이를 변환한다. `view-model.ts / presentation.ts`의 가격 문자열·거리·영업 문구·색·합계는 표시용이며 서버에 저장하지 않는다.

DATA 6절 표는 실제로 15행이다. 아래 항목을 모두 반영했다.

| 변경 | 적용 |
| --- | --- |
| 소수 가격 | Money의 정수 amount와 currency |
| 알레르기 문장 | confirmed.allergens EU 1–14 |
| 재료 쌍 | confirmed.ingredients의 korean/original/note |
| 확인/추정 혼합 | confirmed / ai 분리 |
| 로컬 사진명 | MenuImage 주소·제공자·저작자·라이선스·참고 사진 표시. 출처를 확인할 수 없는 Figma fixture 이미지는 별도 표시용 자산 목록 |
| 분류 문자열 | MenuSection + sectionId |
| me/companion 저장 | 실제 ownerUserId. 표시에서만 나/동행으로 구분 |
| 통합 Draft 저장 | MenuBoard / CartSession / MealRecord 분리. 옛 Draft는 기기 사진을 새 구조로 읽는 마이그레이션만 지원 |
| 식당명 기록 | restaurantId / menuBoardId 참조 |
| 평가 문구 | Rating.value enum + at + mealRecordId |
| 거리/도보/영업 문구 저장 | location/openingHours 원본, 표시 때 계산 |
| 식당 평점 | koreanRating 묶음 (집계는 현재 예시) |
| 친구 색 저장 | 데이터에서 제거, 순서/동행 여부로 표시 |
| 고정 환율 | ExchangeRate + date |
| 요청 사전 번역 | translateRequest 서버 어댑터. 키 없는 시연에만 네 가지 예시 |

사진 바이트는 IndexedDB photos 저장소, MenuBoard의 localKey로 연결한다. 서버에는 분석 요청 동안 사진을 보내며 사진 바이트를 D1에 저장하지 않는다. D1에는 결과 JSON·해시·만료 시각·하루 사용 횟수를 저장한다. 실제 D1이 없는 테스트에서는 메모리 캐시를 사용한다. 익명 쿠키 삭제/새 터널 주소는 새로운 사용자로 취급되므로 정식 계정 단위 과금/남용 방지 기능으로 볼 수 없다.

분석에 보내는 값은 이미지와 EU 알레르기 번호뿐이다. 이름·사용자 ID·친구 이름·현재 위치·좋아하는/못 먹는 음식은 Gemini 분석 요청에 넣지 않는다. 무료 등급 입력이 서비스 개선에 쓰일 수 있다는 안내를 30에 추가했다.

## 검증 명령과 외부 참고

```sh
npm run build
npm run lint
npx tsc --noEmit --incremental false
node scripts/yj-flow.test.mjs
# 아래는 Playwright 모듈과 Chrome 경로를 환경 변수로 지정한다.
node scripts/yj-browser.test.mjs
node scripts/yj-interactions.test.mjs
node scripts/yj-camera.test.mjs
```

26개 서비스/단위 테스트: 정수 금액·복수 동행 ID·평가 enum·모든 fixture 경로·스쿼클·카메라 수명·지연 권한 정리·크기 축소·분석 참조/신뢰도 검증·한 번 재요청·개인정보 제외·해시 캐시·UTC 제한·429/네트워크·OSM 속도/캐시/대체 검색·환율 캐시·Gemini 혼잡 재시도/상한·설정 오류 분류·취소·간소화한 생성 스키마와 엄격한 후속 검사. 단위 테스트에는 실제 기기 조작과 공급자 호출을 포함하지 않는다. 별도로 실제 키와 합성 메뉴판 이미지로 앱 API를 호출하여 메뉴명·가격·재료·알레르기 번호와 done 결과를 확인했다.

- [Gemini 모델](https://ai.google.dev/gemini-api/docs/models), [구조화 출력](https://ai.google.dev/gemini-api/docs/structured-output), [가격·무료 등급](https://ai.google.dev/gemini-api/docs/pricing)
- [Nominatim 사용 정책](https://operations.osmfoundation.org/policies/nominatim/), [Overpass와 공개 서버](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Frankfurter](https://frankfurter.dev/), [Commons 이미지 메타데이터](https://www.mediawiki.org/wiki/API:Imageinfo)
- [Cloudflare 임시 터널](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)
