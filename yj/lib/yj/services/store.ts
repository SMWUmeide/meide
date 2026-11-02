/** Server cache stores results/metadata, never menu photo bytes. D1 if bound, memory for local demo/tests. */
export type ServiceEnv = {
  DB?: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_DAILY_LIMIT?: string;
  PEXELS_API_KEY?: string;
  OSM_USER_AGENT?: string;
};
const memory = new Map<string, { value: unknown; expires: number }>();
const counts = new Map<string, number>();
const initializing = new WeakMap<D1Database, Promise<void>>();
async function ready(db: D1Database) {
  let job = initializing.get(db);
  if (!job) {
    job = db
      .batch([
        db.prepare(
          "CREATE TABLE IF NOT EXISTS yj_cache (key TEXT PRIMARY KEY,value TEXT NOT NULL,expires INTEGER NOT NULL)",
        ),
        db.prepare(
          "CREATE TABLE IF NOT EXISTS yj_analysis_usage (user_id TEXT NOT NULL,day TEXT NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(user_id,day))",
        ),
      ])
      .then(() => {});
    initializing.set(db, job);
  }
  return job;
}
export class ServiceStore {
  constructor(
    readonly env: ServiceEnv = {},
    readonly now = () => Date.now(),
  ) {}
  async get<T>(key: string): Promise<T | undefined> {
    if (this.env.DB) {
      await ready(this.env.DB);
      const row = await this.env.DB.prepare(
        "SELECT value FROM yj_cache WHERE key=? AND expires>?",
      )
        .bind(key, this.now())
        .first<{ value: string }>();
      return row ? JSON.parse(row.value) : undefined;
    }
    const row = memory.get(key);
    if (row && row.expires > this.now()) return structuredClone(row.value) as T;
    memory.delete(key);
  }
  async put(key: string, value: unknown, ttl = 86400000) {
    if (this.env.DB) {
      await ready(this.env.DB);
      await this.env.DB.prepare(
        "INSERT INTO yj_cache(key,value,expires) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,expires=excluded.expires",
      )
        .bind(key, JSON.stringify(value), this.now() + ttl)
        .run();
    } else
      memory.set(key, {
        value: structuredClone(value),
        expires: this.now() + ttl,
      });
  }
  async reserveOSM() {
    if (!this.env.DB) return undefined;
    await ready(this.env.DB);
    const row = await this.env.DB.prepare(
      "INSERT INTO yj_cache(key,value,expires) VALUES('osm:slot',?,?) ON CONFLICT(key) DO UPDATE SET value=CAST(MAX(CAST(value AS INTEGER)+1100,?) AS TEXT),expires=excluded.expires RETURNING value",
    )
      .bind(String(this.now()), this.now() + 60000, this.now())
      .first<{ value: string }>();
    return Number(row?.value ?? this.now());
  }
  async consume(userId: string, limit: number) {
    const day = new Date(this.now()).toISOString().slice(0, 10);
    if (this.env.DB) {
      await ready(this.env.DB);
      const row = await this.env.DB.prepare(
        "INSERT INTO yj_analysis_usage(user_id,day,count) VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1 WHERE count<? RETURNING count",
      )
        .bind(userId, day, limit)
        .first<{ count: number }>();
      return Boolean(row);
    }
    const key = userId + ":" + day;
    const count = counts.get(key) ?? 0;
    if (count >= limit) return false;
    counts.set(key, count + 1);
    return true;
  }
}
export class ServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}
export async function hash(value: string | Uint8Array) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function externalJSON(
  url: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  try {
    const r = await fetcher(url, {
      ...init,
      signal: init.signal
        ? AbortSignal.any([
            init.signal,
            AbortSignal.timeout(
              url.includes("generativelanguage.googleapis.com")
                ? 90000
                : url.includes("overpass.")
                  ? 30000
                  : 15000,
            ),
          ])
        : AbortSignal.timeout(
            url.includes("generativelanguage.googleapis.com")
              ? 90000
              : url.includes("overpass.")
                ? 30000
                : 15000,
          ),
    });
    if (
      !r.ok &&
      new URL(url).hostname === "generativelanguage.googleapis.com"
    ) {
      const payload = (await r.json().catch(() => undefined)) as
        | {
            error?: { details?: { reason?: string }[] };
          }
        | undefined;
      const invalidKey = payload?.error?.details?.some(
        (d) => d.reason === "API_KEY_INVALID",
      );
      if (invalidKey || r.status === 401 || r.status === 403)
        throw new ServiceError(
          "GEMINI_AUTH",
          "Gemini API 키 또는 사용 권한을 확인해 주세요. 사진은 보관했어요.",
        );
      if ([408, 500, 502, 503, 504].includes(r.status))
        throw new ServiceError(
          "UNAVAILABLE",
          r.status === 503
            ? "Gemini 요청이 몰려 분석을 마치지 못했어요. 잠시 후 같은 사진으로 다시 시도해 주세요."
            : "Gemini가 일시적으로 응답하지 못했어요. 잠시 후 같은 사진으로 다시 시도해 주세요.",
          503,
        );
      if (r.status === 404)
        throw new ServiceError(
          "GEMINI_MODEL",
          "설정한 Gemini 모델을 사용할 수 없어요. 서버의 GEMINI_MODEL 설정을 확인해 주세요.",
        );
      if (r.status === 400)
        throw new ServiceError(
          "GEMINI_REQUEST",
          "Gemini가 분석 요청 형식을 처리하지 못했어요. 사진은 보관했어요.",
        );
    }
    if (!r.ok)
      throw new ServiceError(
        r.status === 429 ? "RATE_LIMIT" : "UPSTREAM",
        r.status === 429
          ? "오늘 분석 가능 횟수를 다 썼어요. 내일 다시 시도해 주세요."
          : "외부 서비스가 응답하지 않아요.",
        r.status === 429 ? 429 : 502,
      );
    return await r.json();
  } catch (e) {
    if (e instanceof ServiceError) throw e;
    throw new ServiceError(
      "NETWORK",
      "연결이 불안정해요. 사진은 그대로 있으니 다시 시도해 주세요.",
    );
  }
}
