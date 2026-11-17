import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
process.loadEnvFile(resolve('server/.env.local'));
const allowed=['GOOGLE_MENU_API_KEY','GOOGLE_MAPS_API_KEY','GOOGLE_MAPS_WEB_API_KEY','MENU_TEST_ENABLED','MENU_TEST_START_DATE','MENU_TEST_PROFILE_IDS','MENU_TEST_BUDGET_USD','GEMINI_API_KEY','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','GEMINI_DAILY_LIMIT','GEMINI_MINUTE_LIMIT'];
const target=resolve('.local-data/cloud-deploy');mkdirSync(target,{recursive:true,mode:0o700});
const lines=allowed.map(name=>{
  // This script runs only in Node, outside Expo's client environment loader.
  // eslint-disable-next-line expo/no-dynamic-env-var
  const value=process.env[name];if(!value||/[\r\n]/.test(value))throw Error(`Missing or invalid ${name}.`);
  return name+'='+value;
});
writeFileSync(resolve(target,'server-config.env'),lines.join('\n')+'\n',{mode:0o600});
const manifest=JSON.parse(readFileSync('data/travel/manifest.json','utf8'));
console.log(`Prepared private server config with ${allowed.length} settings; travel index ${manifest.cities} places. No values printed.`);
