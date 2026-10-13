# MJ 프로토타입 모음

2026-10-13 기준 유럽 미식 가이드의 로컬 프로토타입, 최신 공개 사이트 코드와 기획 페이지입니다.

- [한입 유럽 앱](gourmet-app/): 촬영, 메뉴 해석, 식당 확인, 음식 추천, 동반인, 장바구니와 주문 화면. 코드, 이미지, 화면 미리보기, 테스트, Figma 제작 스크립트를 포함합니다.
- [최신 공개 사이트 코드](hanip-europe-site/): 2026-10-11 공개한 사용성 테스트용 프로토타입의 전체 소스, 메뉴 사진, 여행지 데이터와 클라우드 서버 코드입니다. 임의 사진 → Osteria La Solita Zuppa 확인 → 수프·메인 요리·로제 와인 30개 표시 흐름과 촬영 후 이동 수정본을 포함합니다.
- [기획 페이지](gourmet-prd/index.html) / [기능명세서](gourmet-prd/spec.html): 브라우저로 열 수 있는 HTML입니다.

공개 사이트: [한입 유럽](https://hanip-europe-menu.alswn2963.chatgpt.site/). 공개 사이트 소스의 실행 안내는 [PROTOTYPE.md](hanip-europe-site/PROTOTYPE.md)를 참고하세요.

## 앱 실행

Node.js 22.13 이상을 설치하고 아래를 실행하세요. 별도의 패키지 설치는 필요 없습니다.

```sh
cd wireframes/mj/gourmet-app
cp .env.example .env
npm start
```

http://localhost:3000 에서 확인하세요. API 키가 없으면 데모/무료 모드로 사용하며 실제 AI 연동은 각자 `.env`에 키를 설정해야 합니다. 키와 개인 사용 기록은 공유하지 않습니다.

전체 도시 데이터는 GitHub 파일 용량 제한 때문에 압축해 포함했습니다. `npm start`와 `npm test`가 첫 실행 시 자동 복원하며 SHA-256을 확인합니다. 이 컴퓨터에는 원본 데이터도 복사해 두었습니다.

디자인 예시: `/?design=menu`, `/?design=cart`, `/?design=order`, `/?design=staff`. 모든 실행 안내와 기존 검증 기록은 앱의 README 및 TEST-RESULTS.md를 참고하세요.

GitHub에서 코드를 공유하는 구성입니다. 실제 서버가 필요한 AI 연동 앱은 GitHub 파일 화면에서 바로 실행되지는 않습니다.
