import { readFileSync } from 'node:fs';
const project=process.argv[2];
if(!/^[a-z][a-z0-9-]+$/.test(project??''))throw Error('Pass the Google project ID.');
const token=readFileSync(0,'utf8').trim();
if(!token)throw Error('Supply a temporary OAuth token through stdin.');
const base=`https://firebaserules.googleapis.com/v1/projects/${project}`;
async function request(url,method='GET',body){
  const response=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'X-Goog-User-Project':project,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
  if(response.status===404)return null;
  if(!response.ok){const detail=await response.json();throw Error(`Security rules request failed (HTTP ${response.status}): ${detail.error?.message??'Unknown error'}`);}
  return response.json();
}
const release=await request(`${base}/releases/cloud.firestore`);
const content=readFileSync('firestore.rules','utf8');
if(release){
  const current=await request(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`);
  if(current?.source?.files?.length!==1||current.source.files[0].content!==content)throw Error('Existing rules differ. Inspect before replacing them.');
}else{
  const ruleset=await request(`${base}/rulesets`,'POST',{source:{files:[{name:'firestore.rules',content}]}});
  await request(`${base}/releases`,'POST',{name:`projects/${project}/releases/cloud.firestore`,rulesetName:ruleset.name});
}
console.log('Firestore client access is denied; server access uses IAM.');
