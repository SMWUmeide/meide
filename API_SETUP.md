# 실제 기능 연결

현재 흐름은 메뉴판 → 상세 → 장바구니 → 주문 → 영수증이에요. 환율·영수증 인식 API는 연결하지 않아요. 환율은 예시이며 실제 주문 전송·결제 기능은 없어요.

## 구현한 연결

| 기능 | 연결 | 현재 동작 |
|---|---|---|
| 메뉴판 및 AI 상세 | Gemini | 상단 카메라 버튼 → 메뉴판 사진 선택 → 분석. 메뉴명·가격·원문 재료와 AI 추정 정보를 구분해 상세에 표시해요. 현재 EUR 메뉴판만 지원해요. |
| 음식 대표 사진 | Pexels | AI가 만든 영어 음식 검색어로 실제 사진을 검색해요. 실제 식당 사진은 아니며, 원본 링크와 작가 이름을 표시해요. 검색 실패 시 메뉴는 유지하고 사진만 다시 불러올 수 있어요. |
| 동반인 공유 | Supabase Auth + Postgres + Realtime | 초대 링크로 최대 4명이 24시간 동안 참여해요. 메뉴판은 함께 보고 각자의 메뉴 담기·삭제·수량 변경이 실시간으로 반영돼요. |
| 주문 요청 번역 | Gemini | 주문 화면의 입력 문구를 번역해요. 일부 기본 문구는 로컬 번역을 사용해요. |

공동 장바구니는 새 빈 장바구니로 시작해요. 기존 개인 장바구니는 기기에 보관하고, ‘내 메뉴판으로 돌아가기’로 다시 볼 수 있어요. 공동 장바구니의 팁 설정·요청 문구는 각 기기에 따로 적용돼요. 사진 분석 중인 메뉴판으로 공유를 시작하지 않으며, 공유한 메뉴판은 방이 유지되는 동안 고정돼요.

## 1. 서버 키와 공개 설정

`.env.example`을 참고해 git에 포함되지 않는 `.env.local`에 필요한 항목을 넣어요. 기존 파일을 덮어쓰지 않아요.

- 서버 전용: `GEMINI_API_KEY`, 선택 `GEMINI_MODEL`, `PEXELS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. 아래 추가 마이그레이션으로 호출 제한을 먼저 연결해요.
- 서버 허용 origin: `NATIVE_APP_ORIGINS=https://localhost` (Android 기본 주소).
- 공개 설정: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Android API 주소: `VITE_API_BASE_URL`에 배포 서버 HTTPS origin을 넣어요. 로컬 웹에서는 비워 둬요.
- Android 초대 링크: `VITE_APP_URL`에 동반인이 브라우저에서 열 수 있는 배포된 웹 앱 HTTPS 주소를 넣어요. 앱 설치 없이 웹으로 참여할 수 있어요. 앱으로 직접 여는 App Link 연결은 아직 없어요.

`VITE_` 변수는 앱에 공개돼요. Supabase **publishable key**만 사용하고 secret·service_role 키는 절대 넣지 않아요. Gemini·Pexels 키도 서버에만 넣어요.

## 2. Supabase 프로젝트 설정

1. Supabase 프로젝트를 만들고 **Anonymous Sign-Ins**를 활성화해요. 이 앱은 가입 화면 없이 기기별 사용자 ID를 발급받아요.
2. SQL Editor에서 `supabase/migrations/202611140001_shared_order.sql`을 한 번 실행해요. 이미 적용했다면 다시 실행하지 않아요.
3. 이 파일은 방·멤버·초대 테이블, 참여자만 읽는 RLS 정책, 서버에서 수량을 변경하는 RPC, `order_rooms`의 Realtime 발행을 만들어요.
4. 프로젝트 URL과 publishable key를 공개 설정에 넣어요.
5. 웹을 다시 실행하거나 Android를 다시 빌드해요. 상단 카메라 버튼 → 이름 입력 → 동반인 초대 링크 만들기를 눌러요. 링크는 작성자 브라우저의 현재 세션에 보관돼요.
6. **다른 브라우저 프로필 또는 다른 폰**에서 초대 링크를 열고 이름을 입력해요. 같은 프로필의 탭 두 개는 같은 사람으로 취급돼요.

초대 토큰은 DB에서 해시로만 저장해요. 방은 24시간 후 접근할 수 없어요. 데이터 자체는 자동 삭제되지 않으므로 운영 전 만료된 `order_rooms`를 삭제하는 보관 정책·예약 작업을 설정해야 해요(관련 멤버·초대는 함께 삭제돼요). 새로 만든 익명 사용자로 다른 기기의 기존 신원을 복구하는 기능은 아직 없어요.

## 3. 점검

설정 후 개발 서버를 재시작하고 `npm run check:api -- --probe`를 실행해요. 키 값은 출력하지 않고 설정 유무와 Android 사전 요청만 검사해요. 유료 AI 호출이나 실제 키 유효성 검사는 하지 않아요.

- 실제 메뉴판 사진 분석 → 메뉴·가격·AI 상세 확인.
- Pexels 사진과 출처 확인 → 사진 검색 실패 시 재시도.
- 두 기기에서 같은 메뉴 담기·각자 수량 변경 → 양쪽 합계 일치.
- 동반인 메뉴의 수량 버튼은 읽기 전용인지 확인.
- 네트워크 끊기 → 저장되지 않은 변경을 성공으로 표시하지 않는지 확인 → 재접속 시 최신 장바구니 복구.
- 새로고침 후 방 복구, 초대 만료·방 정원 초과·다른 방 접근 차단 확인.

`npm test`는 공급자 응답을 대체한 테스트, 로컬 PostgreSQL 엔진의 실제 SQL/RLS 검사, 실시간 이벤트·재접속 처리를 검사해요. `npm run test:e2e`는 브라우저에서 분석 응답을 대신 넣어 상세 화면까지 확인해요. **실제 Supabase 프로젝트와 두 기기의 WebSocket 동기화, 실제 Gemini/Pexels 응답은 설정 후 확인해야 해요.**

## 공개 출시 전 남은 작업

서버가 공개되기 전에 Gemini/Pexels 엔드포인트의 사용자 인증·사용량 제한과 Supabase 익명 가입의 악용 방지(CAPTCHA 등)를 운영 환경에 맞게 적용해야 해요. origin 제한은 사용자 인증을 대신하지 않아요. 실제 앱 ID·HTTPS 서버 주소·서명·개인정보 처리 안내도 아직 필요해요. 현재 구현은 연결 준비와 기능 코드이며 Play 제출 완료 상태가 아니에요.

참고: [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous), [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Pexels API](https://www.pexels.com/api/documentation/).

## 요금과 호출 상한 · 2026-11-14 공식 문서 확인

| 서비스 | 무료 범위 | 유료 조건 | 이 앱의 기본 제한 |
|---|---|---|---|
| Gemini 3.5 Flash-Lite | Free tier 입력·출력 무료. 실제 RPM/TPM/RPD는 프로젝트·모델별 AI Studio에서 확인해야 해요. | Paid tier 표준 입력 $0.30 / 출력 $2.50 (각 100만 토큰 기준). 같은 호출 횟수라도 사진·출력 길이에 따라 금액이 달라져요. | 메뉴 분석+번역 합산 분당 5회·UTC 하루 50회 |
| Pexels | 기본 시간당 200회·월 20,000회. API 자체는 무료예요. | 사용 목적·출처 표기 심사 후 한도 확대를 신청할 수 있어요. | 시간당 100회·UTC 월 1,000회 |
| Supabase Free | DB 500MB/프로젝트, Storage 1GB, egress 5GB, MAU 50,000, Realtime 월 200만 메시지·최대 동시 연결 200 | 유료 플랜은 기본 요금 및 사용량 초과 요금이 있어요. Free 플랜으로 시작해요. | 공유 방 생성·변경 합산 하루 1,000회, 사용자별 200회. 읽기·인증·접속·전송량 전체에 대한 과금 상한은 아니에요. |
| Photoroom 배경 제거 | 계정 생성 시 워터마크 없는 production 10회 체험. 매월 갱신되는 무료 10회가 아니에요. | Basic 배경 제거 $0.02/장. Image Editing sandbox 월 1,000회는 워터마크가 있어 앱용 무료 결과로 사용하지 않아요. | 기본 누적 0회(비활성). 무료 체험 잔여량을 확인한 후 수동으로 10 이하 등 설정해요. |

공식 출처: [Gemini 가격](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite), [Gemini 프로젝트별 제한](https://aistudio.google.com/docs/rate-limits), [Pexels 무료 범위](https://help.pexels.com/hc/en-us/articles/47677890260761-Is-the-Pexels-API-free-to-use), [Supabase 무료 사용량](https://supabase.com/docs/guides/platform/billing-on-supabase), [Photoroom 가격·무료 체험](https://www.photoroom.com/api/pricing).

이 표는 API 서비스 기준이에요. 웹 호스팅 요금, Play 개발자 등록 비용 등은 포함하지 않아요. Gemini 무료 tier의 입력 데이터 사용 조건도 출시 전 확인해야 해요.

### 반드시 적용할 추가 DB 설정

기존 001 마이그레이션 다음에 아래 파일을 순서대로 한 번씩 실행해요.

1. `supabase/migrations/202611140002_api_budgets.sql`: 서버 공통 호출 카운터와 공유 쓰기 제한.
2. `supabase/migrations/202611140003_cutout_storage.sql`: 처리된 음식 대표 사진만 저장하는 공개 버킷. 사용자가 촬영한 메뉴판 원본은 저장하지 않아요.

서버에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 설정해요. **service_role은 서버 전용이며 VITE_ 변수에 넣으면 안 돼요.** 카운터 연결이 없거나 실패하면 외부 공급자 요청을 차단해요. 메모리 카운터로 우회하지 않아서 서버 재시작·여러 서버에서도 상한이 유지돼요.

`GEMINI_MINUTE_LIMIT`, `GEMINI_DAILY_LIMIT`, `PEXELS_HOURLY_LIMIT`, `PEXELS_MONTHLY_LIMIT`을 `.env.local` 또는 배포 서버 환경변수로 조정해요. 분석과 번역은 Gemini 예산을 공유해요. Pexels는 실제 검색 한 건마다 세고 캐시 응답은 추가로 세지 않아요. 실패·시간초과도 보수적으로 예약한 횟수에 포함하며 자동 재시도는 하지 않아요. 한도 초과는 429, 카운터 연결 실패는 503이에요.

공유 쓰기 제한은 002 SQL의 `limit_order_writes()` 안 `day` 값으로 조정해요. Supabase Realtime 메시지·읽기·인증·전송량은 공급자 대시보드에서 별도로 관리해야 해요. 이 앱 밖에서 같은 키/프로젝트를 사용한 호출은 앱 카운터에 포함되지 않아요. **앱 호출 상한은 전체 계정 청구액의 절대 상한을 보장하지 않아요.** Free tier 유지 및 공급자 사용량·결제 설정도 함께 확인해요.

카운터 `api_usage_counts`를 삭제하면 제한이 초기화돼요. 특히 Photoroom `lifetime` 행은 무료 체험 한도를 유지하려면 삭제하지 않아요. 과거 minute/hour/day/month 버킷만 보관 정책에 따라 정리할 수 있어요.

### 접시 누끼와 흰 배경

`PHOTOROOM_API_KEY`와 `PHOTOROOM_LIFETIME_LIMIT`을 설정하면 Pexels 대표 사진 → 배경 제거 → 흰 배경 PNG → Supabase Storage 저장 순서로 처리해요. 같은 원본의 저장된 결과는 재사용해요. 전경을 분리하는 방식이므로 접시·음식은 유지하지만 식기·손 등이 함께 남거나 접시 일부가 잘릴 수 있어 실제 사진 품질 확인이 필요해요. 원본에 없는 접시를 만들어 내지는 않아요.

설정 전·한도 초과·처리 실패 시 원본 사진을 유지해요. 현재 번들된 Figma 예시 사진을 일괄 누끼 처리한 것은 아니에요. 이 기능은 새 API 사진과 ‘음식 사진 다시 불러오기’에 적용돼요. 키를 받기 전 실제 배경 제거 결과는 검증하지 않았어요.

remove.bg는 공식 문서에서 2026-12-01 Leonardo.Ai 이전을 안내해 신규 연결 대상으로 선택하지 않았어요. [공식 이전 안내](https://www.remove.bg/api).
