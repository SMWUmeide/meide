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

- 서버 전용: `GEMINI_API_KEY`, 선택 `GEMINI_MODEL`, `PEXELS_API_KEY`.
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
