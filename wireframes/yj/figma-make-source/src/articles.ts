export type Article = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  tint: string;
  img?: string;
  body: string[];
};

export const articles: Article[] = [
  {
    id: "zuppa",
    title: "토스카나 수프는 혼자 주문할 수 없어요",
    summary: "이 식당은 수프를 다른 요리와 함께 시켜야 해요. 점심엔 맛보기 세트도 있어요",
    minutes: 1,
    tint: "linear-gradient(135deg,#f6d9a8,#e9a86a)",
    body: [
      "Osteria La Solita Zuppa는 이름처럼 수프가 대표 메뉴예요. 다만 이 식당에서는 수프만 따로 주문할 수 없고, 다른 요리와 함께 주문해야 해요. 디저트 하나만 곁들이는 것도 안 돼요.",
      "수프는 빵과 채소를 다시 끓인 리볼리타, 병아리콩 포르치니 수프, 장작불 양파 수프처럼 한 그릇이 꽤 든든해요. 전채나 파스타 하나와 나눠 드시면 알맞아요.",
      "여러 가지를 맛보고 싶다면 점심 세트를 찾아보세요. 수프 3가지를 반 그릇씩 맛보는 세트가 26유로이고, 자릿세·물·커피가 포함돼 있어요.",
    ],
  },
  {
    id: "coperto",
    title: "계산서에 붙는 '코페르토'는 뭘까요?",
    summary: "이 식당은 1인 2.50유로, 바가지가 아니에요",
    minutes: 1,
    tint: "linear-gradient(135deg,#efe3d2,#cdb79a)",
    body: [
      "이탈리아 식당 계산서에 'Coperto'라는 항목이 있다면 놀라지 마세요. 빵과 식기, 자리 준비에 대한 비용으로 1인당 1~3유로 정도예요.",
      "이 식당은 1인 2.50유로(빵 포함)예요. 메뉴판 아래쪽에 작게 적혀 있어요. 정상적인 요금이니 따로 따지지 않으셔도 돼요.",
      "코페르토가 있다면 팁은 꼭 주지 않아도 괜찮아요. 서비스가 만족스러웠다면 잔돈 정도를 남기는 것으로 충분해요.",
    ],
  },
  {
    id: "offal",
    title: "람프레도토, 트리파… 이름만 봐선 모르는 내장 요리",
    summary: "피렌체·토스카나의 내장 요리 이름을 알아두면 실수가 없어요",
    minutes: 2,
    tint: "linear-gradient(135deg,#fbe1e4,#f2b8a6)",
    body: [
      "피렌체와 토스카나에는 내장 요리가 많아요. 그런데 메뉴판 이름만 봐서는 내장인지 알기 어려워요.",
      "람프레도토(Lampredotto)는 소의 네 번째 위, 막창이에요. 트리파(Trippa)는 소의 양(벌집양)으로, 토마토소스에 졸여 내요. 크로스티노 토스카노(Crostino Toscano)는 닭간을 곱게 갈아 빵에 바른 전채예요.",
      "내장은 알레르기 표시 대상이 아니라서 메뉴판 번호만 봐서는 알 수 없어요. 이름을 기억해 두거나 재료를 확인하세요.",
      "못 드신다면 직원에게 이렇게 보여주세요. 'Non mangiamo frattaglie, grazie'(논 만자모 프라탈리에, 그라치에) — 내장은 안 먹어요.",
    ],
  },
];

// Articles shown for each ordered dish, before the food arrives.
export const dishArticles: Record<string, Article> = {
  baccala: {
    id: "d-baccala",
    title: "바칼라를 더 맛있게: 남은 토마토소스는 빵으로 닦아 드세요",
    summary: "'스카르페타'는 이탈리아식 칭찬이에요",
    minutes: 1,
    tint: "linear-gradient(135deg,#f3c6a5,#d9693a)",
    img: "/assets/70c3c.png",
    body: [
      "바칼라는 소금에 절인 대구를 며칠 동안 물에 불려 짠맛을 뺀 뒤 요리해요. 살이 결대로 부드럽게 갈라지는 게 특징이에요.",
      "접시에 남은 토마토소스를 빵으로 닦아 먹는 것을 '스카르페타(scarpetta)'라고 해요. 이탈리아에서는 음식이 맛있었다는 칭찬으로 여겨요.",
      "빵은 보통 코페르토에 포함되어 함께 나와요. 부족하면 'Ancora pane, per favore'(앙코라 파네, 페르 파보레)라고 말해 보세요.",
    ],
  },
  maiale: {
    id: "d-maiale",
    title: "사과 소스 돼지고기와 어울리는 토스카나 와인 한 잔",
    summary: "가볍고 과일 향이 나는 레드 와인을 추천해요",
    minutes: 1,
    tint: "linear-gradient(135deg,#e8d3b0,#a8763e)",
    img: "/assets/a7be7.png",
    body: [
      "달콤한 사과 소스와 구운 돼지고기에는 너무 무겁지 않은 레드 와인이 잘 어울려요.",
      "이 식당 하우스 와인은 몬탈치노 레드예요. 잔(4.50유로)이나 1리터 카라페(12유로)로 주문할 수 있어요.",
      "술을 드시지 않는다면 탄산수 'Acqua frizzante'(아쿠아 프리찬테)를 곁들여도 좋아요.",
    ],
  },
  cinghiale: {
    id: "d-cinghiale",
    title: "멧돼지 조림은 폴렌타와 함께 드셔 보세요",
    summary: "진한 소스를 옥수수죽이 부드럽게 잡아줘요",
    minutes: 1,
    tint: "linear-gradient(135deg,#d9c0a3,#7a4a2c)",
    img: "/assets/6828e.png",
    body: [
      "친기알레 인 살미는 멧돼지 고기를 와인과 향신료에 오래 재워 끓인 토스카나 지방 요리예요.",
      "소스가 진하고 묵직해서, 옥수숫가루 죽인 '폴렌타'를 곁들이면 맛이 한결 부드러워져요.",
      "고기가 질기게 느껴지면 조금씩 소스에 적셔 드시면 좋아요.",
    ],
  },
  guancia: {
    id: "d-guancia",
    title: "돼지 볼살 찜, 숟가락으로도 잘라져요",
    summary: "오래 익혀 아주 부드러운 부위예요",
    minutes: 1,
    tint: "linear-gradient(135deg,#e7d0bb,#9a5c3a)",
    img: "/assets/a7693.png",
    body: [
      "돼지 볼살은 운동량이 많은 부위라 오래 익히면 아주 부드러워져요.",
      "포크와 숟가락만으로도 쉽게 잘라 드실 수 있어요.",
      "향신료 향이 강하다면 함께 나오는 빵이나 감자와 번갈아 드셔 보세요.",
    ],
  },
};
