import { parentPort, workerData, threadId } from 'node:worker_threads';
import { readFileSync, existsSync, mkdirSync, renameSync, createReadStream, createWriteStream, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { createGunzip } from 'node:zlib';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { TravelSearchIndex } from './travel-search.mjs';

const manifest = JSON.parse(readFileSync(new URL('../data/travel/manifest.json', import.meta.url), 'utf8'));
const path = join(workerData.cacheDirectory, `travel-${manifest.sha256.slice(0, 16)}.sqlite`);
if (!existsSync(path)) {
  mkdirSync(dirname(path), {recursive: true});
  const temporary = `${path}.${process.pid}.${threadId}.tmp`;
  const packedHash = createHash('sha256'), dataHash = createHash('sha256');
  let size = 0;
  async function* compressedParts() {
    for (const file of manifest.files ?? ['gazetteer.sqlite.gz']) {
      for await (const chunk of createReadStream(new URL(`../data/travel/${file}`, import.meta.url))) { packedHash.update(chunk); yield chunk; }
    }
  }
  try {
    await pipeline(Readable.from(compressedParts()), createGunzip(), new Transform({transform(chunk, encoding, callback) {
      size += chunk.length;
      if (size > manifest.databaseBytes) return callback(new Error('Travel index size mismatch'));
      dataHash.update(chunk); callback(null, chunk);
    }}), createWriteStream(temporary));
    if (size !== manifest.databaseBytes || packedHash.digest('hex') !== manifest.compressedSha256 || dataHash.digest('hex') !== manifest.sha256) throw new Error('Travel index checksum mismatch');
    renameSync(temporary, path);
  } catch (error) { rmSync(temporary, {force: true}); throw error; }
}
const index = new TravelSearchIndex(path);
parentPort.on('message', ({id, query, offset}) => {
  try { parentPort.postMessage({id, result: index.search(query, offset)}); }
  catch (error) { parentPort.postMessage({id, error: error.status ? error.message : '여행지 정보를 불러오지 못했어요.', status: error.status ?? 503}); }
});
parentPort.postMessage({ready: true});
