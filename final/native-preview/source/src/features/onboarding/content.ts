// Figma's leftmost onboarding screens, updated 2026-11-16.
// Illustration-only exports; text, navigation, and buttons remain native UI.
export const onboardingContent = [
  {
    id: 'menu-scan',
    title: '유럽의 메뉴를\n한국인의 시선으로',
    description: '낯선 메뉴를 쉽게 이해하고,\n나에게 맞는 메뉴를 찾아보세요.',
    image: require('../../../assets/onboarding/menu-scan.png'),
    figmaNodeId: '1014:1520',
    artwork: { nodeId: '1014:1538', width: 412, height: 400, top: 0 },
  },
  {
    id: 'shared-menu',
    title: '여행 동행인과\n함께 고르는 한 끼',
    description: '같은 메뉴판을 함께 보며,\n취향에 맞는 메뉴를 골라보세요.',
    image: require('../../../assets/onboarding/shared-menu.png'),
    figmaNodeId: '1014:1609',
    // Figma exports the arms beyond the 400pt illustration frame. Keep the
    // export's original origin so the circle and menu match the other slides.
    artwork: { nodeId: '1014:1655', width: 412, height: 538, top: -60.36880493164062 },
  },
  {
    id: 'nearby-restaurants',
    title: '낯선 여행지에서도\n맛있는 한 끼를',
    description: '가까운 식당부터 한식당까지,\n낯선 도시에서도 든든하게.',
    image: require('../../../assets/onboarding/nearby-restaurants.png'),
    figmaNodeId: '1014:1760',
    artwork: { nodeId: '1014:1801', width: 412, height: 400, top: 0 },
  },
] as const;
