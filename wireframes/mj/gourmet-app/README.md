# 한입 유럽 · 로컬 실행 버전

2026-10-17 공개 사이트 버전 25와 같은 화면을 제공하는 Node.js 프로토타입입니다. 박성호와 김미영 두 시점에서 같은 메뉴판을 보며 각각 음식을 담고, 합산 장바구니와 주문 문장을 확인합니다.

## 실행

Node.js **22.13 이상, 권장 24 이상**이 필요합니다. 별도 패키지 설치나 API 키 없이 실행합니다.

```sh
cd wireframes/mj/gourmet-app
npm start
```

홈은 <http://localhost:3000/>입니다. 첫 실행 시 포함된 압축 도시 데이터가 자동 복원됩니다. 포트를 바꾸려면 `.env.example`을 `.env`로 복사해 `PORT`를 변경합니다. 기본 실행에 `.env`는 필요하지 않습니다.

## 두 사람 시점

- [박성호](http://localhost:3000/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=seongho)
- [김미영](http://localhost:3000/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=miyeong)

같은 `prototype` UUID에 서로 다른 `person` 값으로 접속합니다. 각자 선택은 독립적이고 상대 수량·완료 상태·합계는 같은 서버를 통해 동기화됩니다. 새 테스트는 `node -e "console.log(crypto.randomUUID())"`로 UUID를 만들고 양쪽 주소를 함께 변경하세요. 기존 UUID로 다시 접속하면 선택 내역이 유지됩니다.

다른 기기에서 사용하려면 `.env`에서 `HOST=0.0.0.0`으로 설정하고 같은 네트워크에서 컴퓨터의 IP와 포트로 접속합니다. 두 링크의 서버 주소도 동일하게 변경하세요. 음성 입력과 카메라는 브라우저가 허용하는 보안 컨텍스트(HTTPS 또는 같은 기기의 localhost)가 필요하므로, 다른 기기에서의 시연은 [공개 사이트](https://hanip-europe-menu.alswn2963.chatgpt.site/)를 권장합니다.

## 동작 범위

- 사진 촬영 흐름은 사용성 테스트용입니다. 기본 모드에서는 사진과 관계없이 Osteria La Solita Zuppa의 수프 4개·메인 12개·로제 와인 14개를 표시합니다. 실제 OCR 결과로 오해하지 마세요.
- 기본 주문 문장은 실제 메뉴명·수량을 사용해 키 없이 생성합니다. 요청사항 및 실시간 대화 번역은 **MyMemory**에 입력한 텍스트를 보내므로 인터넷 연결과 해당 서비스의 이용 가능 한도가 필요합니다.
- 음성 입력은 브라우저의 SpeechRecognition 지원과 마이크 권한이 필요합니다. 지원하지 않는 브라우저에서는 직접 입력할 수 있습니다. 음성 읽기는 기기의 음성 엔진을 사용합니다.
- Pretendard 웹폰트와 환율 등 외부 연결은 인터넷이 필요합니다. 사진·메뉴 데이터·도시 검색 자료는 저장소에 포함되어 있습니다.
- 주문은 직원에게 보여줄 문장을 만드는 기능이며 식당에 주문을 전송하지 않습니다.
- 추가 AI·지도 기능을 개발할 때만 `.env.example`의 선택 항목을 설정합니다. 과거 연동 기록은 [docs/LEGACY-NOTES.md](docs/LEGACY-NOTES.md)에 보존했습니다.

## 수정할 파일

| 항목 | 파일 |
| --- | --- |
| 화면·버튼 동작·두 시점 처리 | `public/app.js` |
| 색·폰트·글래스·확대 아이콘 위치 | `public/style.css` |
| 쉬운 한국어 메뉴명·목록 한 줄 요약 | `public/korean-dining.js` |
| 고정 메뉴와 음식 평가 예시 | `public/test-menu.js`, `public/community-ratings.js` |
| 공식 메뉴 한국어 검토 | `data/restaurants/solita-zuppa-review.json` |
| 주문·대화 번역 | `public/live-translation.js` |
| HTTP API·정적 파일 제공 | `server.mjs` |
| SQLite 공유 장바구니·두 시점 방 생성 | `shared-cart.mjs` |

공유 화면의 기준은 옆의 `../hanip-europe-site/`입니다. 그쪽에서 수정한 뒤 MJ 폴더에서 `node scripts/sync-prototypes.mjs`를 실행하세요. 로컬 서버와 클라우드 서버의 구현 차이는 유지됩니다.

## 검증

```sh
npm test
node ../scripts/sync-prototypes.mjs --check
```

API, 두 사람의 독립 수량·재접속, 한글 메뉴 해석, 요청사항 번역, 정적 모듈 제공, 도시 검색 등을 검사합니다. 결과는 [TEST-RESULTS.md](TEST-RESULTS.md)를 참고하세요.

디자인 확인 주소: `/?design=menu`, `/?design=cart`, `/?design=order`, `/?design=staff`. 예시 화면은 실제 연결된 방을 검증하는 용도가 아니므로, 두 사람 동작은 위 `prototype` 링크로 확인하세요.

개인 데이터는 브라우저 저장소와 `data/shared-carts.sqlite`에 저장되고 Git에서 제외됩니다. 배포·실행 자격 증명이나 개인 기록은 포함하지 않습니다. GeoNames 도시 데이터의 출처·이용 조건은 `data/`의 README와 정보 파일에 있습니다.
