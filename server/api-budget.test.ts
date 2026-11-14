import { afterEach, describe, expect, it, vi } from 'vitest';
import { reserveApiCalls } from './api-budget';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-only'};
afterEach(()=>vi.unstubAllGlobals());
describe('API 호출 예산',()=>{
  it('영구 카운터가 허용한 경우에만 공급자 요청을 허용해요',async()=>{const fetch=vi.fn().mockResolvedValue(Response.json(true));vi.stubGlobal('fetch',fetch);await reserveApiCalls('gemini',env);expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({provider_name:'gemini',caps:{minute:5,day:50},units:1});});
  it('설정 없음·저장소 실패 시 제한 없이 호출하지 않아요',async()=>{await expect(reserveApiCalls('gemini',{})).rejects.toMatchObject({status:503});vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('secret')));await expect(reserveApiCalls('gemini',env)).rejects.toMatchObject({status:503});});
  it('한도 초과·잘못된 설정·배경 제거 기본 비활성을 차단해요',async()=>{const fetch=vi.fn().mockResolvedValue(Response.json(false));vi.stubGlobal('fetch',fetch);await expect(reserveApiCalls('pexels',env)).rejects.toMatchObject({status:429});await expect(reserveApiCalls('gemini',{...env,GEMINI_DAILY_LIMIT:'NaN'})).rejects.toMatchObject({status:503});await expect(reserveApiCalls('photoroom',env)).rejects.toMatchObject({status:429});expect(fetch).toHaveBeenCalledTimes(1);});
});
