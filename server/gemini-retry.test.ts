// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { withGeminiRetry } from './gemini-retry';
import { reserveApiCalls, ApiBudgetError } from './api-budget';
import { setTimeout as delay } from 'node:timers/promises';
vi.mock('./api-budget', async original => ({ ...await original<typeof import('./api-budget')>(), reserveApiCalls: vi.fn() }));
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn().mockResolvedValue(undefined) }));
beforeEach(() => { vi.mocked(reserveApiCalls).mockResolvedValue(undefined); });
afterEach(() => { vi.clearAllMocks(); });
const failure = (statusCode: number) => Object.assign(new Error('provider private details'), { statusCode });
it('503을 두 번 받으면 같은 요청을 대체 모델에 보내고 모든 시도를 계수해요', async () => {
 const run = vi.fn().mockRejectedValueOnce(failure(503)).mockRejectedValueOnce(failure(503)).mockResolvedValueOnce('real response');
 expect(await withGeminiRetry({}, new AbortController().signal, run)).toBe('real response');
 expect(run.mock.calls.map(call=>call[0])).toEqual(['gemini-3.5-flash-lite','gemini-3.5-flash-lite','gemini-3.1-flash-lite']);
 expect(reserveApiCalls).toHaveBeenCalledTimes(3);
 expect(vi.mocked(delay).mock.calls[1][0]).toBeGreaterThan(vi.mocked(delay).mock.calls[0][0]!);
});
it.each([400,401,403,429])('%s는 다시 호출하지 않아요', async status => {
 const run=vi.fn().mockRejectedValue(failure(status));
 await expect(withGeminiRetry({},new AbortController().signal,run)).rejects.toMatchObject({statusCode:status});
 expect(run).toHaveBeenCalledTimes(1);expect(delay).not.toHaveBeenCalled();
});
it('재시도 예산이 없으면 공급자에 다시 보내지 않아요',async()=>{
 vi.mocked(reserveApiCalls).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new ApiBudgetError(429));
 const run=vi.fn().mockRejectedValue(failure(503));
 await expect(withGeminiRetry({},new AbortController().signal,run)).rejects.toMatchObject({status:429});
 expect(run).toHaveBeenCalledTimes(1);
});
it('중단된 요청은 예산이나 공급자를 호출하지 않아요',async()=>{
 const controller=new AbortController();controller.abort();const run=vi.fn();
 await expect(withGeminiRetry({},controller.signal,run)).rejects.toThrow();expect(run).not.toHaveBeenCalled();expect(reserveApiCalls).not.toHaveBeenCalled();
});
it('대체 모델을 비우면 한 번만 재시도하고 실패를 반환해요',async()=>{
 const run=vi.fn().mockRejectedValue(failure(503));
 await expect(withGeminiRetry({GEMINI_FALLBACK_MODEL:''},new AbortController().signal,run)).rejects.toMatchObject({statusCode:503});
 expect(run).toHaveBeenCalledTimes(2);
});
it('출력 형식 오류는 반복 과금하지 않아요',async()=>{
 const run=vi.fn().mockRejectedValue(new Error('invalid output'));
 await expect(withGeminiRetry({},new AbortController().signal,run)).rejects.toThrow('invalid output');expect(run).toHaveBeenCalledTimes(1);
});
