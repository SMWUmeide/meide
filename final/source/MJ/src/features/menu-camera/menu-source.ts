import type { MenuTranslation, RestaurantDetails } from './menu-api';

// Keep the photographed text even when a website menu takes priority. One
// translation is performed only after this decision; failure never loses OCR.
export function restaurantMenuPatch(menu: MenuTranslation, details?: RestaurantDetails): Partial<MenuTranslation> {
  const photoOriginalText = menu.photoOriginalText ?? menu.originalText;
  const web = details?.webMenu;
  if (web?.status === 'found' && web.text.trim() && Array.from(web.text).length <= 5000) {
    return { websiteUri: details?.websiteUri, webMenu: web, photoOriginalText, originalText: web.text,
      menuSource: 'website', translatedText: undefined,
      restaurantNotice: web.partial ? '웹사이트 메뉴 중 일부를 가져왔어요.' : undefined };
  }
  return { websiteUri: details?.websiteUri, webMenu: web, photoOriginalText, originalText: photoOriginalText,
    menuSource: 'photo', translatedText: undefined,
    restaurantNotice: '웹 메뉴를 가져오지 못해 촬영한 메뉴판으로 진행해요.' };
}
