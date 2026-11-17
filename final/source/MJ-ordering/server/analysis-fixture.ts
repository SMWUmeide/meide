import type { Analysis } from "../src/data/menu-schema.js";
export const analysisFixture: Analysis = {
  isMenu: true, restaurantName: "Trattoria Test", currency: "EUR",
  items: [{ categoryName: "파스타", categoryOriginal: "Primi", originalName: "PASTA AL POMODORO", photoQuery: "tomato pasta", name: "토마토 파스타", priceEur: 12.5, analogy: "토마토 소스를 넣은 면 요리에 가까워요", description: "토마토 맛이 나는 파스타예요", ingredients: [{ name: "토마토", original: "pomodoro" }], allergen: "메뉴판에서 확인되지 않았어요", estimated: ["올리브유"], method: "면을 삶아 소스에 버무리는 것이 일반적이에요", possibleAllergen: "밀이 들어갈 수 있으니 직원에게 확인해 주세요" }],
};
