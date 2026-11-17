import https from 'node:https';
import { Buffer } from 'node:buffer';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export function publicMenuUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
      url.href.length > 2048 || /(^|\.)(localhost|local|internal|home\.arpa)\.?$/i.test(url.hostname)) throw Error('Unsafe menu URL');
  url.hash = '';
  return url;
}
export function isPublicAddress(address) {
  try { return ipaddr.parse(address).range() === 'unicast'; } catch { return false; }
}

// A separate HTTPS client: no API keys/cookies, no browser execution, no proxy,
// and DNS is checked and pinned on EVERY request/redirect (including robots).
export async function fetchPublicMenu(value, { signal, maxBytes = 3_000_000, resolve = lookup, request = https.request } = {}) {
  const url = publicMenuUrl(value);
  const addresses = await Promise.race([
    resolve(url.hostname.replace(/^\[|\]$/g, ''), { all: true, verbatim: true }),
    new Promise((_, reject) => {
      if (signal?.aborted) reject(Error('Request expired'));
      else signal?.addEventListener('abort', () => reject(Error('Request expired')), { once: true });
    }),
  ]);
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw Error('Non-public address');
  signal?.throwIfAborted();
  const address = addresses[0];
  return new Promise((resolveResponse, reject) => {
    const req = request(url, {
      method: 'GET', agent: false, signal,
      headers: { 'User-Agent': 'MeideMenuBot/1.0', Accept: 'text/html,application/pdf,image/png,image/jpeg,text/plain', 'Accept-Encoding': 'identity' },
      lookup: (_host, options, callback) => options?.all ? callback(null, [address]) : callback(null, address.address, address.family),
    }, response => {
      const length = Number(response.headers['content-length'] ?? 0);
      if (length > maxBytes || (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')) {
        response.destroy(); reject(Error('Unsupported response size/encoding')); return;
      }
      const chunks = []; let bytes = 0;
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > maxBytes) { response.destroy(Error('Menu too large')); return; }
        chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => resolveResponse({ status: response.statusCode, headers: response.headers, bytes: Buffer.concat(chunks), url: url.href }));
    });
    req.on('error', reject);
    req.setTimeout(6000, () => req.destroy(Error('Menu timeout')));
    req.end();
  });
}
