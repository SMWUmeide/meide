import { loadBuffer } from 'cheerio';
import { Buffer } from 'node:buffer';
import robotsParser from 'robots-parser';
import { Worker } from 'node:worker_threads';
import { fetchPublicMenu, publicMenuUrl } from './public-menu-fetch.mjs';

export const WEB_MENU_LIMITS = Object.freeze({ documents: 4, requests: 12, origins: 3, bytes: 3_000_000, ocrImages: 2, milliseconds: 24000, characters: 5000 });
const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const menuWord = /(?<![\p{L}])(menu|menù|menú|menus|carte|carta|speisekarte|speisen|food|dinner|lunch|abendessen|mittagessen)(?![\p{L}])/iu;
const nonMenu = /\b(privacy|cookies?|policy|terms|impressum|datenschutz|newsletter|careers)\b/i;
const foodWord = /pasta|pizza|risotto|salad|salade|salat|soup|soupe|zuppa|burger|steak|dessert|antipast|plat|primi|secondi|tapas|pollo|chicken|fish|pesce|tofu|rice|riso|sushi|noodle|ramen|starter|entrée|hauptgericht/i;

export function usableMenu(text, labeled = false) {
  if (text.length < 25 || !/[\p{L}]{3}/u.test(text)) return false;
  const prices = text.match(/(?:[€£$]\s*\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s*(?:€|£|EUR|GBP|CHF)|\b\d{1,3}[.,]\d{2}\b)/g) ?? [];
  const bare = text.split('\n').filter(line => /(?:^|\s)\d{1,3}(?:[.,]\d{1,2})?\s*$/.test(line));
  return (prices.length >= 2 || (labeled && bare.length >= 2)) && (labeled || foodWord.test(text));
}

export function parseMenuHtml(bytes, url) {
  const $ = loadBuffer(bytes, { encoding: { defaultEncoding: 'utf-8' } }); const structured = []; const links = []; let visited = 0; let ambiguous = false;
  const addLink = (href, label = '', priority = 1) => {
    try {
      const target = publicMenuUrl(new URL(href, url).href);
      if (target.href !== url && !nonMenu.test(target.pathname + ' ' + label)) links.push({ url: target.href, priority });
    } catch { /* Never follow unsafe links. */ }
  };
  function walk(node, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 12 || ++visited > 1500) return;
    if (Array.isArray(node)) { node.slice(0,150).forEach(x => walk(x, depth + 1)); return; }
    const types = [node['@type']].flat();
    if (types.includes('MenuItem') && typeof node.name === 'string') {
      const offer = [node.offers].flat().find(x => x && x.price !== undefined);
      structured.push(clean([node.name, typeof node.description === 'string' ? node.description : '', offer ? `${offer.price} ${offer.priceCurrency ?? ''}` : ''].join(' — ')));
    }
    if (node.hasMenu) {
      if (Array.isArray(node.hasMenu) && node.hasMenu.filter(x => typeof x === 'string').length > 1) ambiguous = true;
      for (const value of [node.hasMenu].flat()) if (typeof value === 'string') addLink(value, 'menu', 5);
    }
    for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value, depth + 1);
  }
  $('script[type="application/ld+json"]').each((_, el) => { try { walk(JSON.parse($(el).text())); } catch { /* Invalid publisher data. */ } });
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href'); const label = clean($(el).text());
    if (menuWord.test(label + ' ' + href) && !nonMenu.test(label)) addLink(href, label, /\b(menu|menù|menú|carte|speisekarte)\b/i.test(label) ? 4 : 2);
  });
  const pageLabeled = menuWord.test(new URL(url).pathname + ' ' + $('title,h1').text());
  $('script,style,noscript,nav,header,footer,form,button,svg,[hidden],[aria-hidden="true"]').remove();
  const sections = $('[id*="menu" i],[class*="menu" i],main,article');
  const textOf = el => {
    const copy = $(el).clone();
    copy.find('br').replaceWith('\n');
    copy.find('p,li,h1,h2,h3,h4,tr,div,section').append('\n');
    return clean(copy.text());
  };
  let text = structured.length >= 2 ? structured.join('\n') : '';
  if (!text) {
    for (const el of sections.toArray()) {
      if (!pageLabeled && !menuWord.test([$(el).attr('id'), $(el).attr('class')].join(' '))) continue;
      const candidate = textOf(el);
      if (usableMenu(candidate, pageLabeled || menuWord.test($(el).attr('id') ?? ''))) { text = candidate; break; }
    }
    if (!text && pageLabeled) { const candidate = textOf($('body')); if (usableMenu(candidate, true)) text = candidate; }
  }
  // Only images explicitly identified as menus; never send arbitrary site photos to OCR.
  $('img').each((_, el) => {
    const label = [$(el).attr('alt'), $(el).attr('src')].join(' ');
    if (menuWord.test(label)) addLink($(el).attr('src'), label, 1);
  });
  return { text: !ambiguous && usableMenu(text, structured.length >= 2 || pageLabeled) ? text : '', ambiguous,
    links: [...new Map(links.sort((a,b) => b.priority - a.priority).map(link => [link.url,link])).values()] };
}

let activePdf = false;
export function readMenuPdf(bytes, { signal } = {}) {
  if (activePdf) return Promise.reject(Error('PDF processor busy'));
  activePdf = true;
  return new Promise((resolve, reject) => {
    let finished = false;
    let worker;
    try { worker = new Worker(new URL('./menu-pdf-worker.mjs', import.meta.url), { workerData: bytes, execArgv: [], resourceLimits: { maxOldGenerationSizeMb: 128 }, stdout: true, stderr: true }); }
    catch (error) { activePdf = false; reject(error); return; }
    worker.stdout.resume(); worker.stderr.resume();
    const finish = (error, value) => { if (finished) return; finished = true; activePdf = false; clearTimeout(timer); signal?.removeEventListener('abort', abort); void worker.terminate(); if (error) reject(error); else resolve(value); };
    const abort = () => finish(Error('PDF expired'));
    const timer = setTimeout(abort, 5000);
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    worker.once('error', error => finish(error));
    worker.once('message', result => finish(result.error ? Error(result.error) : null, result));
    worker.once('exit', code => { if (code) finish(Error('PDF worker exited')); });
  });
}

export async function readWebsiteMenu(websiteUri, { fetchPage = fetchPublicMenu, readPdf = readMenuPdf, ocr, now = Date.now } = {}) {
  const expires = now() + WEB_MENU_LIMITS.milliseconds;
  const signal = AbortSignal.timeout(WEB_MENU_LIMITS.milliseconds);
  let requests = 0, imageCount = 0;
  const robots = new Map(); const seen = new Set();
  async function get(url, maxBytes = WEB_MENU_LIMITS.bytes) {
    if (++requests > WEB_MENU_LIMITS.requests || now() >= expires) throw Error('Request limit');
    return fetchPage(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(Math.min(6000, expires - now()))]), maxBytes });
  }
  async function allowed(url) {
    const origin = new URL(url).origin;
    if (!robots.has(origin)) {
      if (robots.size >= WEB_MENU_LIMITS.origins) throw Error('Origin limit');
      robots.set(origin, null);
      let response = await get(origin + '/robots.txt', 128000);
      for (let i = 0; i < 2 && [301,302,307,308].includes(response.status); i++) {
        const next = publicMenuUrl(new URL(response.headers.location, origin).href);
        if (next.hostname.replace(/^www\./,'') !== new URL(origin).hostname.replace(/^www\./,'') || next.pathname !== '/robots.txt') break;
        response = await get(next.href, 128000);
      }
      if (response.status === 404 || response.status === 410) robots.set(origin, robotsParser(origin + '/robots.txt', ''));
      else if (response.status === 200 && !/text\/html/i.test(response.headers['content-type'] ?? '') && !/<html/i.test(response.bytes.toString().slice(0,200))) robots.set(origin, robotsParser(origin + '/robots.txt', response.bytes.toString()));
    }
    const rules = robots.get(origin);
    return !!rules && rules.isAllowed(url, 'MeideMenuBot') !== false && !(rules.getCrawlDelay('MeideMenuBot') > 0);
  }
  async function document(value) {
    let url = publicMenuUrl(value).href;
    for (let redirect = 0; redirect <= 2; redirect++) {
      if (!await allowed(url)) throw Error('Site disallows access');
      const result = await get(url);
      if ([301,302,303,307,308].includes(result.status)) { url = publicMenuUrl(new URL(result.headers.location, url).href).href; continue; }
      if (result.status !== 200) throw Error('Page unavailable');
      return { ...result, url };
    }
    throw Error('Too many redirects');
  }
  async function imageText(bytes) {
    if (!ocr || imageCount >= WEB_MENU_LIMITS.ocrImages || signal.aborted || expires - now() < 2000) return '';
    imageCount++;
    return ocr(bytes, { signal, timeout: Math.min(8000, expires - now()) });
  }
  const fallback = { status: 'unavailable', source: 'photo' };
  try {
    if (!websiteUri) return fallback;
    const queue = [publicMenuUrl(websiteUri).href]; let count = 0;
    while (queue.length && count < WEB_MENU_LIMITS.documents && !signal.aborted) {
      const target = queue.shift(); if (seen.has(target)) continue; seen.add(target); count++;
      try {
        const page = await document(target); const type = page.headers['content-type'] ?? ''; let text = '', partial = false;
        if (page.bytes.subarray(0,5).toString() === '%PDF-') {
          const pdf = await readPdf(page.bytes, { signal }); partial = pdf.partial;
          const chunks = [];
          for (const part of pdf.pages.slice(0,2)) chunks.push(part.text ?? await imageText(Buffer.from(part.image)));
          text = clean(chunks.join('\n'));
        } else if (page.bytes.subarray(0,3).equals(Buffer.from([255,216,255])) || page.bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
          text = clean(await imageText(page.bytes));
        } else if (/text\/html|application\/xhtml/i.test(type)) {
          const parsed = parseMenuHtml(page.bytes, page.url);
          if (parsed.ambiguous) continue;
          text = parsed.text;
          queue.push(...parsed.links.map(link => link.url));
        }
        if (!usableMenu(text, true)) continue;
        const points = Array.from(text); partial ||= points.length > WEB_MENU_LIMITS.characters;
        return { status: 'found', source: 'website', text: points.slice(0,WEB_MENU_LIMITS.characters).join(''), url: page.url, partial, checkedAt: new Date(now()).toISOString() };
      } catch { /* An unavailable candidate must not block the photographed menu. */ }
    }
  } catch { /* Includes invalid/non-public official URLs. */ }
  return fallback;
}
