import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
export function createApp({store, webRoot, allowedOrigins = [], menuAI, menuTest, nearbyTest, travelSearch, webMaps, health, requestLimit = 60, remoteApiOrigin}) {
  const remote=remoteApiOrigin?new URL(remoteApiOrigin):null;
  if(remote&&(remote.protocol!=='https:'||remote.username||remote.password||remote.pathname!=='/'||remote.search||remote.hash))throw Error('Use a public HTTPS API origin.');
  const buckets = new Map();
  const allowed = new Set(allowedOrigins);
  const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.otf':'font/otf','.ttf':'font/ttf','.json':'application/json','.wasm':'application/wasm'};
  return createServer(async (req,res) => {
    const send = (status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if(url.pathname==='/health'&&req.method==='GET') {if(health)await health();return send(200,{ok:true});}
      if (url.pathname.startsWith('/api/')) {
        const origin = req.headers.origin;
        if (origin && !allowed.has(origin)) return send(403, {error:'허용되지 않은 요청이에요.'});
        if (origin) { res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin'); }
        if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}); return res.end(); }
        // After migration, old localhost tabs must not create divergent local
        // profiles or spend against an obsolete file ledger. A 307 keeps POST
        // bodies intact and sends every API request to the configured service.
        if(remote){const destination=new URL(remote);destination.pathname=url.pathname;destination.search=url.search;res.writeHead(307,{Location:destination.href,'Cache-Control':'no-store'});return res.end();}
        const now = Date.now();
        for (const [key,b] of buckets) if (b.until < now) buckets.delete(key);
        const ip = req.socket.remoteAddress;
        const travelRequest = url.pathname === '/api/travel/search';
        const bucketKey = travelRequest ? `${ip}:travel` : ip;
        const bucket = buckets.get(bucketKey) ?? {until:now+60000,count:0};
        bucket.count++; buckets.set(bucketKey,bucket);
        if (bucket.count > (travelRequest ? 120 : requestLimit)) { res.setHeader('Retry-After','60'); return send(429,{error:'잠시 후 다시 시도해 주세요.'}); }
        if (req.method === 'GET' && url.pathname === '/api/travel/search') {
          if (!travelSearch) return send(503, {error:'여행지 검색을 준비하고 있어요.'});
          return send(200, await travelSearch.search(url.searchParams.get('q'), url.searchParams.get('offset') ?? '0'));
        }
        if (req.method === 'POST' && ['/api/restaurants/nearby','/api/restaurants/status','/api/restaurants/map-access'].includes(url.pathname)) {
          if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'잘못된 요청이에요.'});
          if (url.pathname!=='/api/restaurants/map-access'&&!nearbyTest) return send(503,{error:'주변 식당 연결을 준비하고 있어요.'});
          let body='';
          for await(const chunk of req) {body+=chunk;if(Buffer.byteLength(body)>2048)return send(413,{error:'입력 내용을 확인해 주세요.'});}
          let data;try{data=JSON.parse(body);}catch{return send(400,{error:'입력 내용을 확인해 주세요.'});}
          const own=await store.authenticate(data??{});
          if(url.pathname==='/api/restaurants/map-access') {
            if(!webMaps)return send(503,{error:'지도 연결을 준비하고 있어요.'});
            return send(200,await webMaps.authorize({id:own.id,requestId:data.requestId}));
          }
          if(url.pathname==='/api/restaurants/status')return send(200,await nearbyTest.status(own.id));
          return send(200,{result:await nearbyTest.search({...data,id:own.id})});
        }
        if (req.method === 'POST' && ['/api/menu/process','/api/menu/status'].includes(url.pathname)) {
          if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'잘못된 요청이에요.'});
          if (!menuTest) return send(503,{error:'테스트 API 연결을 준비 중이에요.'});
          const chunks=[]; let size=0;
          for await (const chunk of req) { size+=chunk.length; if (size>5700000) return send(413,{error:'메뉴판 사진 1장, 4MB 이하로 선택해 주세요.'}); chunks.push(chunk); }
          let data; try { data=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(400,{error:'입력 내용을 확인해 주세요.'}); }
          const own=await store.authenticate(data ?? {});
          if (url.pathname === '/api/menu/status') return send(200,await menuTest.status(own.id));
          const result=await menuTest.process({id:own.id,requestId:data.requestId,operation:data.operation,payload:data.payload});
          return send(200,{result});
        }
        if (req.method === 'POST' && url.pathname === '/api/menu/analyze') {
          if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'잘못된 요청이에요.'});
          if (!menuAI?.configured()) return send(503,{error:'GPT 연결 설정과 사용 한도를 확인 중이에요. 사진은 OpenAI에 전송하지 않았어요.'});
          const chunks=[]; let size=0;
          for await (const chunk of req) { size+=chunk.length; if (size>5700000) return send(413,{error:'4MB 이하의 메뉴판 사진을 선택해 주세요.'}); chunks.push(chunk); }
          let data; try { data=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(400,{error:'입력 내용을 확인해 주세요.'}); }
          const own=await store.authenticate(data ?? {});
          return send(200,{menu:await menuAI.analyze({...data,id:own.id})});
        }
        if (req.method === 'POST' && ['/api/invites','/api/companions/list','/api/companions/accept','/api/companions/remove'].includes(url.pathname)) {
          if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'잘못된 요청이에요.'});
          let body='';
          for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body)>2048) return send(413,{error:'입력 내용을 확인해 주세요.'}); }
          let data; try { data=JSON.parse(body); } catch { return send(400,{error:'입력 내용을 확인해 주세요.'}); }
          if (url.pathname === '/api/invites') return send(200,await store.register(data ?? {}));
          const action = url.pathname.split('/').pop();
          return send(200,{companions:await store[action](data ?? {})});
        }
        if (req.method === 'GET' && url.pathname.startsWith('/api/invites/')) return send(200,await store.find(decodeURIComponent(url.pathname.slice('/api/invites/'.length)).toUpperCase()));
        return send(404,{error:'찾을 수 없는 요청이에요.'});
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(405,{error:'허용되지 않은 요청이에요.'});
      const root=resolve(webRoot); let path=resolve(root,'.'+decodeURIComponent(url.pathname));
      if (path !== root && !path.startsWith(root+sep)) return send(403,{error:'찾을 수 없는 경로예요.'});
      if (!existsSync(path) || !statSync(path).isFile()) {
        if (extname(path)) return send(404,{error:'파일을 찾을 수 없어요.'});
        path=resolve(root,'index.html');
      }
      if (!existsSync(path)) return send(503,{error:'미리보기를 준비하고 있어요.'});
      res.writeHead(200,{'Content-Type':types[extname(path)] ?? 'application/octet-stream','Cache-Control':'no-store'});
      if (req.method === 'HEAD') return res.end();
      createReadStream(path).pipe(res);
    } catch (e) { if (!res.headersSent) send(e.status ?? 500,{error:e.status ? e.message : '요청을 처리하지 못했어요. 다시 시도해 주세요.'}); else res.end(); }
  });
}
