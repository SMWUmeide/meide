import { setTimeout as delay } from 'node:timers/promises';
import { reserveApiCalls } from './api-budget.js';
import type { ApiEnv } from './http.js';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const FALLBACK_GEMINI_MODEL = 'gemini-3.1-flash-lite';

// The SDK's built-in retries are disabled at call sites so every actual attempt
// is reserved against the shared, persistent daily/minute budget here.
export async function withGeminiRetry<T>(env: ApiEnv, signal: AbortSignal, operation: (model: string) => Promise<T>): Promise<T> {
  const primary = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  // An explicitly blank fallback disables switching. Custom primary models do
  // not silently switch unless their fallback is explicitly configured.
  const fallback = env.GEMINI_FALLBACK_MODEL?.trim() ?? (primary === DEFAULT_GEMINI_MODEL ? FALLBACK_GEMINI_MODEL : '');
  if (![primary, ...(fallback ? [fallback] : [])].every(model => /^[a-zA-Z0-9._-]+$/.test(model))) throw new Error('GEMINI_MODEL_CONFIG');
  const models = [primary, primary, ...(fallback && fallback !== primary ? [fallback] : [])];
  for (let attempt = 0; attempt < models.length; attempt++) {
    signal.throwIfAborted();
    await reserveApiCalls('gemini', env);
    signal.throwIfAborted();
    try { return await operation(models[attempt]); }
    catch (error) {
      const status = (error as { statusCode?: number } | null)?.statusCode;
      if (signal.aborted || !status || ![500, 502, 503, 504].includes(status) || attempt === models.length - 1) throw error;
      // Only provider availability failures are retried; never invalid inputs,
      // authentication errors, quota errors, schema failures or user cancellation.
      const waitMs = 1000 * 2 ** attempt + Math.floor(Math.random() * 250);
      console.info('gemini-retry', { status, attempt: attempt + 1, model: models[attempt], nextModel: models[attempt + 1], waitMs });
      await delay(waitMs, undefined, { signal });
    }
  }
  throw new Error('GEMINI_RETRY_EXHAUSTED');
}
