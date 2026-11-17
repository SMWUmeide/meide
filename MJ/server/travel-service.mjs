import { Worker } from 'node:worker_threads';
import { validateTravelQuery } from './travel-search.mjs';

// A single read-only worker keeps large result sets off the API event loop.
// Queue, cache and timeouts are bounded; this service never calls a paid API.
export class TravelService {
  constructor(cacheDirectory) {
    this.pending = new Map();
    this.cache = new Map();
    this.nextId = 0;
    this.unavailable = false;
    this.ready=new Promise((resolve,reject)=>{this.resolveReady=resolve;this.rejectReady=reject;});
    this.ready.catch(()=>{});
    this.worker = new Worker(new URL('./travel-worker.mjs', import.meta.url), {workerData: {cacheDirectory}, execArgv: process.execArgv.filter(arg => !arg.startsWith('--input-type'))});
    this.worker.on('message', message => {
      if (message.ready) {this.resolveReady();return;}
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) request.reject(Object.assign(new Error(message.error), {status: message.status}));
      else { this.cache.set(request.key, message.result); if (this.cache.size > 100) this.cache.delete(this.cache.keys().next().value); request.resolve(message.result); }
    });
    const fail = () => {
      this.unavailable = true;
      this.rejectReady(new Error('Travel index unavailable'));
      for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(Object.assign(new Error('여행지 검색에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'), {status: 503})); }
      this.pending.clear();
    };
    this.worker.on('error', error => { console.error('Travel index unavailable:', error.message); fail(); });
    this.worker.on('exit', fail);
  }
  search(query, offset = 0) {
    const parsed = validateTravelQuery(query, offset);
    const key = `${parsed.query}\0${parsed.offset}`;
    if (this.cache.has(key)) return Promise.resolve(this.cache.get(key));
    if (this.unavailable || this.pending.size >= 16) throw Object.assign(new Error('잠시 후 다시 검색해 주세요.'), {status: 503});
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => { this.pending.delete(id); reject(Object.assign(new Error('검색이 지연되고 있어요. 다시 시도해 주세요.'), {status: 503})); }, 10000);
      this.pending.set(id, {resolve, reject, key, timer});
      this.worker.postMessage({id, query: parsed.query, offset: parsed.offset});
    });
  }
  async close() { await this.worker.terminate(); }
}
