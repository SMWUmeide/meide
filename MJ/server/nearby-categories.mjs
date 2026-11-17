// App taxonomy over Google's official Place Types (New), checked 2026-11-15.
// Asian includes Korean, East Asian, Southeast Asian and South Asian cuisines.
export const KOREAN_TYPES = ['korean_restaurant', 'korean_barbecue_restaurant'];
export const ASIAN_TYPES = [
  ...KOREAN_TYPES, 'asian_restaurant', 'asian_fusion_restaurant',
  'chinese_restaurant', 'chinese_noodle_restaurant', 'cantonese_restaurant', 'dim_sum_restaurant', 'dumpling_restaurant', 'hot_pot_restaurant',
  'japanese_restaurant', 'japanese_curry_restaurant', 'japanese_izakaya_restaurant', 'sushi_restaurant', 'ramen_restaurant', 'tonkatsu_restaurant', 'yakiniku_restaurant', 'yakitori_restaurant',
  'thai_restaurant', 'vietnamese_restaurant', 'indonesian_restaurant', 'malaysian_restaurant', 'filipino_restaurant', 'burmese_restaurant', 'cambodian_restaurant', 'taiwanese_restaurant',
  'indian_restaurant', 'north_indian_restaurant', 'south_indian_restaurant', 'pakistani_restaurant', 'bangladeshi_restaurant', 'sri_lankan_restaurant', 'tibetan_restaurant', 'mongolian_barbecue_restaurant',
];
// Curated corrections can be added by verified place ID; never infer cuisine
// from an owner's ethnicity or from the neighborhood.
export const CATEGORY_OVERRIDES = Object.freeze({});
export function classifyRestaurant(place, overrides = CATEGORY_OVERRIDES) {
  const override = overrides[place.id];
  if (override) return { korean:override === 'korean', asian:override === 'korean' || override === 'asian', source:'curated' };
  const types = new Set([...(place.types ?? []),place.primaryType].filter(Boolean));
  if (KOREAN_TYPES.some(type => types.has(type))) return {korean:true,asian:true,source:'google'};
  if (ASIAN_TYPES.filter(type => !['asian_restaurant','asian_fusion_restaurant'].includes(type)).some(type => types.has(type))) return {korean:false,asian:true,source:'google'};
  const name = (place.displayName?.text ?? '').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().normalize('NFC');
  const korean = /한식|한국\s*(?:식당|음식)|(?<!\p{L})(?:korean|coreano|coreana|coreen|coreenne|koreanisch|koreanisches|koreanische|kimchi|bibimbap|bulgogi)(?!\p{L})/u.test(name);
  const asian = korean || types.has('asian_restaurant') || types.has('asian_fusion_restaurant') || /아시안|중식|일식|태국\s*(?:식당|음식)|베트남\s*(?:식당|음식)|(?<!\p{L})(?:asian|asiatique|asiatico|asiatische|sushi|ramen|chinese|japanese|thai|vietnamese|indian|indonesian|malaysian|filipino)(?!\p{L})/u.test(name);
  return {korean,asian,source:korean?'name':types.has('asian_restaurant')||types.has('asian_fusion_restaurant')?'google':asian?'name':'unknown'};
}
export function distanceMeters(a,b) {
  const rad = value => value * Math.PI / 180;
  const dLat=rad(b.latitude-a.latitude), dLon=rad(b.longitude-a.longitude);
  const h=Math.sin(dLat/2)**2 + Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
}
