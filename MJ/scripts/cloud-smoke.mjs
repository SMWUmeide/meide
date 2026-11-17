import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const [origin,project,mode]=process.argv.slice(2);
if(!origin?.startsWith('https://')||new URL(origin).origin!==origin||!/^[a-z][a-z0-9-]+$/.test(project??''))throw Error('Pass a verified HTTPS origin and project ID.');
const require=createRequire(new URL('../server/package.json',import.meta.url));
const {Firestore}=require('@google-cloud/firestore'),{OAuth2Client}=require('google-auth-library');
const cli=(...args)=>execFileSync('sh',['scripts/gcloud.sh',...args,'--account=alswn2963@gmail.com'],{encoding:'utf8'}).trim();
const authClient=new OAuth2Client();authClient.setCredentials({access_token:cli('auth','print-access-token'),expiry_date:Date.now()+3000000});
const db=new Firestore({projectId:project,authClient,preferRest:true});
const authorization=mode==='--private'?`Bearer ${cli('auth','print-identity-token')}`:null;
const a={id:randomUUID(),token:randomUUID(),name:'배포 확인 A'},b={id:randomUUID(),token:randomUUID(),name:'배포 확인 B'};
const records=db.collection('meidePrivate'),usage=records.doc('pilot-2026-11-usage'),identities=records.doc('pilot-2026-11-invites');
async function request(path,body,extra={}){
  const response=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(authorization?{Authorization:authorization}:{}),...(body?{'Content-Type':'application/json'}:{}),...extra},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
  if(!response.headers.get('content-type')?.includes('application/json'))throw Error(`Non-JSON service response: HTTP ${response.status} at ${path}; ${(await response.text()).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,220)}`);
  return {status:response.status,data:await response.json()};
}
try{
  const before=(await usage.get()).data().serialized;
  assert.equal((await request('/health')).status,200);
  assert.equal((await request('/api/companions/list',{})).status,401);
  assert.equal((await request('/api/companions/list',{}, {Origin:'https://untrusted.invalid'})).status,403);
  const first=await request('/api/invites',a),second=await request('/api/invites',b);
  assert.equal(first.status,200);assert.equal(second.status,200);
  assert.equal((await request('/api/companions/accept',{...a,code:second.data.code})).status,200);
  assert.deepEqual((await request('/api/companions/list',b)).data.companions,[{id:a.id,name:a.name}]);
  assert.equal((await request('/api/menu/process',{...a,requestId:randomUUID(),operation:'ocr',payload:{}})).status,403);
  assert.equal((await request('/api/restaurants/map-access',{...a,requestId:randomUUID()})).status,403);
  const travel=await request('/api/travel/search?q='+encodeURIComponent('파리'));
  assert.equal(travel.status,200);assert.equal(travel.data.places[0].city,'파리');
  await request('/api/companions/remove',{...a,friendId:b.id});
  assert.deepEqual((await request('/api/companions/list',b)).data.companions,[]);
  assert.equal((await usage.get()).data().serialized,before);
  const denied=await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/meidePrivate/pilot-2026-11-invites`);
  assert.equal(denied.status,403);
  console.log('CLOUD SMOKE PASSED: HTTPS health, authentication, CORS, two-user invite acceptance/removal, Korean travel search, unregistered paid API rejection, private Firestore. Real usage unchanged.');
}finally{
  await db.runTransaction(async transaction=>{
    const snapshot=await transaction.get(identities);const data=JSON.parse(snapshot.data().serialized);
    const disposable=new Set([a.id,b.id]);
    data.rows=data.rows.filter(row=>!disposable.has(row.id)).map(row=>row.friends?{...row,friends:row.friends.filter(id=>!disposable.has(id))}:row);
    transaction.set(identities,{serialized:JSON.stringify(data),updatedAt:new Date().toISOString()});
  });
  await db.terminate();
}
