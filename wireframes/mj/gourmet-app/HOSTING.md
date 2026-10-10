# 고정 주소 무료 배포

Render Blueprint로 이 저장소의 `wireframes` 브랜치와 루트 `render.yaml`을 선택하세요. 무료 Docker 서버가 준비됩니다. 배포가 성공하면 Render가 실제 고정 HTTPS 주소를 표시합니다.

- 컴퓨터와 임시 터널을 켜 둘 필요가 없습니다.
- 15분 미사용 시 잠들며 첫 접속은 약 1분이 걸릴 수 있습니다.
- 무료 서버의 재시작/재배포 시 동반인 장바구니와 월별 API 사용량 기록이 초기화됩니다. 앱 사용량 제한은 이 환경에서 지속적인 비용 상한이 아닙니다. API 제공업체의 할당량도 설정하세요.
- 처음에는 API 키 없이 무료/데모 모드입니다. 사진 AI 인식과 주문 번역을 쓰려면 Render의 Environment에 `GEMINI_API_KEY`를 설정하세요.
- 식당 검색은 `GOOGLE_PLACES_API_KEY`와 `ENABLE_GOOGLE_PLACES=true`가 필요합니다. Google API 요금은 호스팅 무료 요금제와 별도입니다.
- 키는 공개 코드나 파일에 넣지 말고 Render의 비밀 환경변수에만 저장하세요.

실제 배포와 주소 발급은 Render 계정 연결 이후 완료됩니다.
