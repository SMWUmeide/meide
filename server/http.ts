export type ApiEnv = { PIXABAY_API_KEY?: string; PIXABAY_MINUTE_LIMIT?: string; PIXABAY_DAILY_LIMIT?: string; GEMINI_API_KEY?: string; GEMINI_MODEL?: string; NATIVE_APP_ORIGINS?: string; PEXELS_API_KEY?: string; PHOTOROOM_API_KEY?: string; PHOTOROOM_LIFETIME_LIMIT?: string; SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; GEMINI_MINUTE_LIMIT?: string; GEMINI_DAILY_LIMIT?: string; PEXELS_HOURLY_LIMIT?: string; PEXELS_MONTHLY_LIMIT?: string };

export function apiAccess(request: Request, env: ApiEnv) {
  const origin = request.headers.get("origin");
  const allowed = !origin || origin === new URL(request.url).origin || (env.NATIVE_APP_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean).includes(origin);
  const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", Vary: "Origin" });
  if (allowed && origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  const reply = (body: unknown, status: number) => Response.json(body, { status, headers });
  return { reply, response: !allowed ? reply({ error: "ORIGIN", message: "이 앱에서 다시 시도해 주세요" }, 403) : request.method === "OPTIONS" ? new Response(null, { status: 204, headers }) : null };
}

export async function readSmallJson(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing body");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new RangeError("Body too large"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
