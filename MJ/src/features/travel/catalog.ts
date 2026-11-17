import countries from '../../../data/travel/countries.json' with { type: 'json' };

export type TravelDestination = {
  id: string;
  country: string;
  city: string;
  localName: string;
  flag: string;
  aliases: string[];
  kind?: 'country' | 'region' | 'city';
  code?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  nameSource?: 'geonames' | 'curated' | 'phonetic';
};

// Approved recommendations remain available offline; the full gazetteer is searched on the server.
export const initialDestination: TravelDestination = {
  id: 'it-chiusi', country: '이탈리아', city: '키우시', localName: 'Chiusi', flag: '🇮🇹', aliases: ['Italy'],
};
export const recommendedDestinations: TravelDestination[] = [
  { id: 'it-roma', country: '이탈리아', city: '로마', localName: 'Roma', flag: '🇮🇹', aliases: ['Italy', 'Rome'] },
  { id: 'fr-paris', country: '프랑스', city: '파리', localName: 'Paris', flag: '🇫🇷', aliases: ['France'] },
  { id: 'es-barcelona', country: '스페인', city: '바르셀로나', localName: 'Barcelona', flag: '🇪🇸', aliases: ['Spain', 'España'] },
  { id: 'gb-london', country: '영국', city: '런던', localName: 'London', flag: '🇬🇧', aliases: ['UK', 'United Kingdom', 'England'] },
  { id: 'cz-praha', country: '체코', city: '프라하', localName: 'Praha', flag: '🇨🇿', aliases: ['Czechia', 'Prague', 'Czech Republic'] },
  { id: 'pt-lisboa', country: '포르투갈', city: '리스본', localName: 'Lisboa', flag: '🇵🇹', aliases: ['Portugal', 'Lisbon'] },
];
const destinations = [initialDestination, ...recommendedDestinations];
export function findDestination(id: unknown) {
  return typeof id === 'string' ? destinations.find(place => place.id === id) : undefined;
}
export function destinationLabel(place: TravelDestination) {
  return place.city ? `${place.country} · ${place.city}` : place.country;
}
function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').normalize('NFC').toLowerCase().replace(/[\s·,.-]/g, '');
}
export function searchDestinations(query: string) {
  const normalized = normalize(query);
  if (!normalized) return recommendedDestinations;
  return destinations.filter(place => [destinationLabel(place), place.city, place.localName, ...place.aliases].some(name => normalize(name).includes(normalized)));
}

// Save destination metadata with the selection so reopening the app never depends on a network lookup.
export function parseTravelDestination(raw: unknown): TravelDestination | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Record<string, unknown>;
  const known = findDestination(value.id);
  if (known) return known;
  const country = countries.find(c => c.code === value.code);
  if (!country || typeof value.id !== 'string' || !['country', 'region', 'city'].includes(String(value.kind))) return undefined;
  const kind = value.kind as 'country' | 'region' | 'city';
  if (!(kind === 'country' ? value.id === `country-${country.code}` : kind === 'region' ? new RegExp(`^region-${country.code}-[a-f0-9]{16}$`).test(value.id) : /^geonames-\d{1,12}$/.test(value.id))) return undefined;
  if (typeof value.city !== 'string' || value.city.length > 200 || (kind !== 'country' && !value.city.trim()) || typeof value.localName !== 'string' || !value.localName.trim() || value.localName.length > 200) return undefined;
  const latitude = value.latitude, longitude = value.longitude;
  const hasCoordinates = latitude !== undefined || longitude !== undefined;
  if (hasCoordinates && !(typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180)) return undefined;
  return {id: value.id, kind, code: country.code, country: country.name, flag: country.flag, city: kind === 'country' ? '' : value.city.trim(), localName: value.localName.trim(), aliases: [], region: typeof value.region === 'string' ? value.region.slice(0, 200) : '', ...(value.nameSource === 'geonames' || value.nameSource === 'curated' || value.nameSource === 'phonetic' ? {nameSource: value.nameSource} : {}), ...(hasCoordinates ? {latitude: latitude as number, longitude: longitude as number} : {})};
}

export function currentTravelDestination(progress: {travelDestination?: TravelDestination; travelDestinationId?: string}) {
  const saved = parseTravelDestination(progress.travelDestination);
  return (saved?.id === progress.travelDestinationId ? saved : undefined) ?? findDestination(progress.travelDestinationId) ?? initialDestination;
}
