import type { ApiEnv } from './http';
export class ApiBudgetError extends Error {
  constructor(public status: number) { super(status===429?'설정한 호출 한도에 도달했어요. 나중에 다시 시도해 주세요':'호출 제한 서버를 연결해 주세요'); }
}
function limit(value: string | undefined, fallback: number) {
  if (value === undefined || value === '') return fallback;
  const parsed=Number(value);
  if(!Number.isSafeInteger(parsed) || parsed<0) throw new ApiBudgetError(503);
  return parsed;
}
export async function reserveApiCalls(provider: 'gemini'|'pexels'|'photoroom', env: ApiEnv, units=1) {
  const caps=provider==='gemini' ? {minute:limit(env.GEMINI_MINUTE_LIMIT,5),day:limit(env.GEMINI_DAILY_LIMIT,50)} : provider==='pexels' ? {hour:limit(env.PEXELS_HOURLY_LIMIT,100),month:limit(env.PEXELS_MONTHLY_LIMIT,1000)} : {lifetime:limit(env.PHOTOROOM_LIFETIME_LIMIT,0)};
  if(Object.values(caps).some(value=>value<units)) throw new ApiBudgetError(429);
  if(!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new ApiBudgetError(503);
  try {
    const base=new URL(env.SUPABASE_URL);
    if(base.protocol!=='https:' || base.username || base.password) throw new Error('CONFIG');
    const response=await fetch(new URL('/rest/v1/rpc/reserve_api_calls',base),{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({provider_name:provider,caps,units}),signal:AbortSignal.timeout(5000)});
    if(!response.ok) throw new Error('BUDGET');
    const allowed=await response.json();
    if(allowed===false) throw new ApiBudgetError(429);
    if(allowed!==true) throw new Error('BUDGET');
  }catch(error){ if(error instanceof ApiBudgetError) throw error;throw new ApiBudgetError(503); }
}
