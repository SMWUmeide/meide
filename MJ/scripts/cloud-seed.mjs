// One-time, create-only migration. OAuth access token comes from stdin and is
// never logged or written to disk. Existing cloud documents are never replaced.
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { MenuTestLimits,testPolicy } from '../server/menu-test-limits.mjs';
const project=process.argv[2],namespace=process.argv[3]??'pilot-2026-11';
if(!/^[a-z][a-z0-9-]+$/.test(project??'')||!/^[a-zA-Z0-9_-]{1,80}$/.test(namespace))throw Error('Pass project ID and a valid namespace.');
process.loadEnvFile(resolve('server/.env.local'));
const token=readFileSync(0,'utf8').trim();if(!token)throw Error('Supply a short-lived OAuth token through stdin.');
const rows=JSON.parse(readFileSync('.local-data/invites.json','utf8'));
const ledger=JSON.parse(readFileSync('.local-data/menu-test-usage.json','utf8'));
const uuid=/^[0-9a-f-]{36}$/i;
if(!Array.isArray(rows)||rows.length>100||rows.some(row=>!uuid.test(row.id)||!/^\w{8}$/.test(row.code)||! /^[a-f0-9]{64}$/.test(row.tokenHash)||typeof row.name!=='string'))throw Error('Invalid local identity registry.');
const policy=testPolicy(process.env);if(!policy.valid)throw Error('Invalid local pilot settings.');
new MenuTestLimits({file:'/unused'}).validateLedger(ledger,policy);
const base=`projects/${project}/databases/(default)/documents`;
const records=[['invites',{version:1,rows}],['usage',ledger]];
const writes=records.map(([suffix,value])=>{
  const serialized=JSON.stringify(value);if(Buffer.byteLength(serialized)>800000)throw Error('Migration record too large.');
  return {update:{name:`${base}/meidePrivate/${namespace}-${suffix}`,fields:{serialized:{stringValue:serialized},updatedAt:{timestampValue:new Date().toISOString()}}},currentDocument:{exists:false}};
});
const response=await fetch(`https://firestore.googleapis.com/v1/${base}:commit`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({writes}),signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Create-only migration failed (HTTP ${response.status}); existing cloud records were not overwritten.`);
console.log(`Migrated ${rows.length} profiles and existing usage to Firestore. Secrets and medical data were not copied into documents.`);
