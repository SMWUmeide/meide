import type { ApiEnv } from './http.js';
export class ApiBudgetError extends Error {
  constructor(public status: number, public retryAfterSeconds?: number) { super(status===429?'설정한 호출 한도에 도달했어요. 나중에 다시 시도해 주세요':'호출 제한 서버를 연결해 주세요'); }
}
function limit(value: string | undefined, fallback: number) {
  if (value === undefined || value === '') return fallback;
  const parsed=Number(value);
  if(!Number.isSafeInteger(parsed) || parsed<0) throw new ApiBudgetError(503);
  return parsed;
}
export async function reserveApiCalls(provider: 'gemini'|'pexels'|'pixabay'|'photoroom'|'cutout', env: ApiEnv, units=1) {
  const caps=provider==='cutout' ? {minute:limit(env.CUTOUT_MINUTE_LIMIT,20),day:limit(env.CUTOUT_DAILY_LIMIT,200)} : provider==='pixabay' ? {minute:limit(env.PIXABAY_MINUTE_LIMIT,20),day:limit(env.PIXABAY_DAILY_LIMIT,200)} : provider==='gemini' ? {minute:limit(env.GEMINI_MINUTE_LIMIT,5),day:limit(env.GEMINI_DAILY_LIMIT,50)} : provider==='pexels' ? {hour:limit(env.PEXELS_HOURLY_LIMIT,100),month:limit(env.PEXELS_MONTHLY_LIMIT,1000)} : {lifetime:limit(env.PHOTOROOM_LIFETIME_LIMIT,0)};
  if(Object.values(caps).some(value=>value<units)) throw new ApiBudgetError(429);
  if(!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new ApiBudgetError(503);
  try {
    const base=new URL(env.SUPABASE_URL);
    if(base.protocol!=='https:' || base.username || base.password) throw new Error('CONFIG');
    const response=await fetch(new URL('/rest/v1/rpc/reserve_api_calls',base),{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({provider_name:provider,caps,units}),signal:AbortSignal.timeout(5000)});
    if(!response.ok) throw new Error('BUDGET');
    const allowed=await response.json();
    if(allowed===false) {
      // Only a short-window limit is retryable. Read the daily counter without
      // changing it; the atomic RPC still authorizes every subsequent attempt.
      let retryAfterSeconds: number | undefined;
      if ('minute' in caps && 'day' in caps) {
        try {
          const now = new Date();
          const usageUrl = new URL('/rest/v1/api_usage_counts', base);
          usageUrl.searchParams.set('select', 'calls'); usageUrl.searchParams.set('provider', `eq.${provider}`);
          usageUrl.searchParams.set('period', 'eq.day'); usageUrl.searchParams.set('bucket', `eq.${now.toISOString().slice(0,10)}`);
          const usage = await fetch(usageUrl, { headers: { apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }, signal:AbortSignal.timeout(5000) });
          const rows = usage.ok ? await usage.json() : null;
          if (Array.isArray(rows) && rows.length <= 1 && (rows.length === 0 || typeof rows[0].calls === 'number') && (rows[0]?.calls ?? 0) + units <= caps.day!) retryAfterSeconds = 62 - new Date().getUTCSeconds();
        } catch { /* Unknown budget state is not automatically retried. */ }
      }
      throw new ApiBudgetError(429, retryAfterSeconds);
    }
    if(allowed!==true) throw new Error('BUDGET');
  }catch(error){ if(error instanceof ApiBudgetError) throw error;throw new ApiBudgetError(503); }
}
