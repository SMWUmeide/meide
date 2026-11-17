import { Buffer } from 'node:buffer';
import { extractRestaurant } from './restaurant-name.mjs';
import { readWebsiteMenu } from './website-menu.mjs';
// Server only: keys never enter an Expo bundle or an API response.
const fail = message => Object.assign(new Error(message), { status: 502 });
const httpsUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
};
export function createGoogleMenuProviders({ env = process.env, fetchImpl = fetch, websiteReader = readWebsiteMenu } = {}) {
  const key = env.GOOGLE_MENU_API_KEY?.trim();
  if (!key) return {};
  async function request(url, body, extraHeaders = {}, timeout = 45000, signal) {
    const response = await fetchImpl(url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, ...extraHeaders },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout), redirect: 'error',
    });
    if (!response.ok) throw fail('Google 연결을 확인해 주세요.');
    return response.json();
  }
  async function photoFor(place) {
    const photo = place.photos?.[0];
    // Only resource names returned by Google, never a client-provided URL.
    if (!photo?.name || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(photo.name)) return null;
    try {
      const data = await request(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`, null, {}, 12000);
      const uri = httpsUrl(data.photoUri);
      if (!uri || !/(^|\.)googleusercontent\.com$/.test(new URL(uri).hostname)) return null;
      return { uri, authors: (photo.authorAttributions ?? []).map(author => ({ name: author.displayName ?? '', uri: httpsUrl(author.uri) })) };
    } catch { return null; }
  }
  async function mapFor(places) {
    const mapKey = env.GOOGLE_MAPS_API_KEY?.trim();
    if (!mapKey || !places.some(place => place.location)) return null;
    const params = new URLSearchParams({ size: '412x284', scale: '2', maptype: 'roadmap', language: 'ko', key: mapKey });
    places.forEach((place,index) => { if (place.location) params.append('markers', `color:0x17683E|label:${index+1}|${place.location.latitude},${place.location.longitude}`); });
    if (places.filter(place => place.location).length === 1) params.set('zoom','16');
    try {
      // Static Maps requires a query key; do not log this URL or return it.
      const response = await fetchImpl(`https://maps.googleapis.com/maps/api/staticmap?${params}`, { signal: AbortSignal.timeout(12000), redirect: 'error' });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) return null;
      const bytes = Buffer.from(await response.arrayBuffer());
      return bytes.length <= 2000000 ? `data:image/png;base64,${bytes.toString('base64')}` : null;
    } catch { return null; }
  }
  return {
    async ocr({ imageBase64 }) {
      const data = await request('https://vision.googleapis.com/v1/images:annotate', {
        requests: [{ image: { content: imageBase64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
      });
      const result = data.responses?.[0];
      if (!result || result.error) throw fail('사진의 글자를 읽지 못했어요.');
      const text = result.fullTextAnnotation?.text ?? '';
      if (typeof text !== 'string') throw fail('인식 결과를 확인하지 못했어요.');
      return { text, ...extractRestaurant(text) };
    },
    async translate({ text }) {
      const data = await request('https://translation.googleapis.com/language/translate/v2', { q: text, target: 'ko', format: 'text', model: 'nmt' });
      const translated = data.data?.translations?.[0];
      if (typeof translated?.translatedText !== 'string') throw fail('번역 결과를 확인하지 못했어요.');
      return { text: translated.translatedText, sourceLanguage: translated.detectedSourceLanguage ?? '' };
    },
    async search({ query, fields }) {
      const data = await request('https://places.googleapis.com/v1/places:searchText', {
        textQuery: query, includedType: 'restaurant', pageSize: 5, languageCode: 'ko',
      }, { 'X-Goog-FieldMask': fields.join(',') }, 30000);
      const raw = (Array.isArray(data.places) ? data.places : []).filter(place => /^[A-Za-z0-9_-]+$/.test(place.id) && place.displayName?.text).slice(0,5);
      const places = raw.map(place => ({
        id: place.id, name: place.displayName.text, address: place.formattedAddress ?? '',
        category: place.primaryTypeDisplayName?.text ?? '',
        googleMapsUri: httpsUrl(place.googleMapsUri),
        location: Number.isFinite(place.location?.latitude) && Number.isFinite(place.location?.longitude) ? place.location : null,
        openNow: typeof place.currentOpeningHours?.openNow === 'boolean' ? place.currentOpeningHours.openNow : null,
        attributions: (place.attributions ?? []).map(item => ({name:item.provider ?? '',uri:httpsUrl(item.providerUri)})),
      }));
      const [photos,mapImage] = await Promise.all([Promise.all(raw.map(photoFor)),mapFor(places)]);
      return { places: places.map((place,index) => ({ ...place, photo: photos[index] })), mapImage };
    },
    async details({ placeId, fields, preferWebsite = false }) {
      const data = await request(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, null, { 'X-Goog-FieldMask': fields.join(',') }, 10000);
      const websiteUri = httpsUrl(data.websiteUri);
      const result = { id: placeId, websiteUri };
      // Old installed clients keep their existing behavior. New clients opt in
      // only after the user confirms a server-returned restaurant candidate.
      if (preferWebsite) {
        try {
          result.webMenu = await websiteReader(websiteUri, { ocr: async (bytes, { signal, timeout }) => {
            const response = await request('https://vision.googleapis.com/v1/images:annotate', {
              requests: [{ image: { content: bytes.toString('base64') }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
            }, {}, timeout, signal);
            const item = response.responses?.[0];
            if (!item || item.error) throw fail('웹 메뉴를 읽지 못했어요.');
            return typeof item.fullTextAnnotation?.text === 'string' ? item.fullTextAnnotation.text : '';
          } });
        } catch { result.webMenu = { status: 'unavailable', source: 'photo' }; }
      }
      return result;
    },
  };
}
