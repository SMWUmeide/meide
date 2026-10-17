import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';

test('a fresh local server serves every UI module and the same prototype API as the public site',async()=>{
 const server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 try{
  const html=await fetch(origin).then(r=>r.text());assert.match(html,/<script type="module" src="\/app.js/);
  const app=await fetch(origin+'/app.js').then(r=>r.text());
  const imports=[...app.matchAll(/from ['"](\/[^'"]+)['"]/g)].map(m=>m[1]);
  for(const path of imports){const r=await fetch(origin+path);assert.equal(r.status,200,path);assert.match(r.headers.get('content-type'),/javascript/,path);}
  const config=await fetch(origin+'/api/config').then(r=>r.json());assert.equal(config.translation,true);
  const order=await fetch(origin+'/api/translate-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:'it',request:'',items:[{original:'ZUPPA DI CECI E PORCINI',korean:'병아리콩 수프',quantity:2}]})}).then(r=>r.json());
  assert.match(order.text,/due porzioni/);assert.match(order.korean,/2인분/);
  const menu=await fetch(origin+'/api/usability-menu',{method:'POST',body:'{}'}).then(r=>r.json());assert.equal(menu.items.length,30);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
