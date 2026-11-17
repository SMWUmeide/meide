import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InviteStore, generateCode } from '../server/invite-store.mjs';
import { createApp } from '../server/app.mjs';
test('8-character allocation avoids collisions, preserves identity, and restricts updates', () => {
 const dir=mkdtempSync(join(tmpdir(),'meide-invite-')); const file=join(dir,'registry.json');
 try {
  const codes=['AB23CD45','AB23CD45','EF67GH89']; const store=new InviteStore(file,()=>codes.shift());
  const a={id:randomUUID(),token:randomUUID(),name:'가영'}, b={id:randomUUID(),token:randomUUID(),name:'지민'};
  const first=store.register(a), second=store.register(b);
  assert.equal(first.code,'AB23CD45'); assert.equal(second.code,'EF67GH89');
  assert.notEqual(first.code,second.code);
  assert.equal(new InviteStore(file).register(a).code,first.code);
  assert.deepEqual(store.find(first.code),{id:a.id,name:a.name});
  assert.throws(()=>store.register({...a,token:randomUUID()}), e=>e.status===403);
  assert.equal(store.register({...a,name:'새 이름'}).code,first.code);
  assert.equal(store.find(first.code).name,'새 이름');
  assert.throws(()=>store.find('ZZZZ9999'),e=>e.status===404);
  for(let i=0;i<100;i++) { const code=generateCode(); assert.match(code,/^[A-Z0-9]{8}$/); assert.match(code,/[A-Z]/); assert.match(code,/[0-9]/); }
 } finally {rmSync(dir,{recursive:true,force:true});}
});
test('HTTP registration and code lookup work across clients without leaking credentials', async () => {
 const dir=mkdtempSync(join(tmpdir(),'meide-api-'));
 const app=createApp({store:new InviteStore(join(dir,'registry.json')),webRoot:dir,allowedOrigins:['http://localhost:5190']});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${app.address().port}`;
 try {
  const client={id:randomUUID(),token:randomUUID(),name:'연결 테스트'};
  const response=await fetch(base+'/api/invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(client)});
  assert.equal(response.status,200); const own=await response.json(); assert.match(own.code,/^[A-Z0-9]{8}$/);
  const other=await fetch(base+'/api/invites/'+own.code); assert.equal(other.status,200);
  assert.deepEqual(await other.json(),{id:client.id,name:client.name});
  const absent=await fetch(base+'/api/invites/ZZZZ9999'); assert.equal(absent.status,404);
  const bad=await fetch(base+'/api/invites/123'); assert.equal(bad.status,400);
  const cross=await fetch(base+'/api/invites/'+own.code,{headers:{Origin:'https://unknown.example'}}); assert.equal(cross.status,403);
 } finally { await new Promise(resolve=>app.close(resolve)); rmSync(dir,{recursive:true,force:true}); }
});
test('acceptance atomically connects both users, is idempotent and survives restart; removal is mutual', () => {
 const dir=mkdtempSync(join(tmpdir(),'meide-friends-')); const file=join(dir,'registry.json');
 try {
  const store=new InviteStore(file); const a={id:randomUUID(),token:randomUUID(),name:'초대한 사람'}, b={id:randomUUID(),token:randomUUID(),name:'수락한 사람'};
  const own=store.register(a); store.register(b);
  assert.deepEqual(store.list(a),[]); assert.deepEqual(store.list(b),[]);
  assert.throws(()=>store.accept({...b,token:randomUUID(),code:own.code}),e=>e.status===401);
  assert.throws(()=>store.accept({...a,code:own.code}),e=>e.status===400);
  store.accept({...b,code:own.code}); store.accept({...b,code:own.code});
  const reloaded=new InviteStore(file);
  assert.deepEqual(reloaded.list(a),[{id:b.id,name:b.name}]);
  assert.deepEqual(reloaded.list(b),[{id:a.id,name:a.name}]);
  reloaded.remove({...b,friendId:a.id});
  assert.deepEqual(reloaded.list(a),[]); assert.deepEqual(reloaded.list(b),[]);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
test('accept API and authenticated list return reciprocal friends', async () => {
 const dir=mkdtempSync(join(tmpdir(),'meide-accept-'));
 const app=createApp({store:new InviteStore(join(dir,'registry.json')),webRoot:dir});
 await new Promise((resolve,reject)=>{app.once('error',reject);app.listen(0,'127.0.0.1',resolve);});
 const base=`http://127.0.0.1:${app.address().port}`;
 const post=(path,data)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 try {
  const a={id:randomUUID(),token:randomUUID(),name:'A'}, b={id:randomUUID(),token:randomUUID(),name:'B'};
  const own=await (await post('/api/invites',a)).json(); await post('/api/invites',b);
  const accepted=await post('/api/companions/accept',{...b,code:own.code}); assert.equal(accepted.status,200);
  assert.deepEqual((await accepted.json()).companions,[{id:a.id,name:a.name}]);
  const friends=await (await post('/api/companions/list',a)).json(); assert.deepEqual(friends.companions,[{id:b.id,name:b.name}]);
 } finally {await new Promise(resolve=>app.close(resolve));rmSync(dir,{recursive:true,force:true});}
});
