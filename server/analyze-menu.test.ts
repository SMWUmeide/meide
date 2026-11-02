import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeMenu, MAX_BODY_BYTES } from "./analyze-menu";
import { analysisFixture } from "./analysis-fixture";
import { normalizeAnalysis } from "../src/data/menu-schema";
const { generate, provider } = vi.hoisted(() => ({ generate: vi.fn(), provider: vi.fn(() => "test-model") }));
vi.mock("ai", () => ({ generateText: generate, Output: { object: vi.fn(value => value) } }));
vi.mock("@ai-sdk/google", () => ({ createGoogleGenerativeAI: vi.fn(() => provider) }));
const jpeg = Buffer.from([255, 216, 255, 224, 1, 2, 3]).toString("base64");
const body = { images: [{ mediaType: "image/jpeg", data: jpeg }] };
function request(value: unknown = body, headers: Record<string, string> = {}) { return new Request("https://meide.test/api/analyze-menu", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(value) }); }
const env = { GEMINI_API_KEY: "test-server-secret" };
beforeEach(() => { vi.clearAllMocks(); generate.mockResolvedValue({ output: structuredClone(analysisFixture) }); });
describe("Gemini 서버 함수", () => {
  it("사진을 구조화하고 키·사진 원문 없이 메뉴만 반환해요", async () => {
    const response = await analyzeMenu(request(), env); const text = await response.text();
    expect(response.status).toBe(200); expect(JSON.parse(text).board).toEqual(normalizeAnalysis(analysisFixture));
    expect(text).not.toContain(env.GEMINI_API_KEY); expect(text).not.toContain(jpeg); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(generate.mock.calls[0][0].messages[0].content).toEqual([{ type: "file", data: jpeg, mediaType: "image/jpeg" }]);
    expect(generate.mock.calls[0][0].maxRetries).toBe(0); expect(provider).toHaveBeenCalledWith("gemini-3.5-flash-lite");
  });
  it("환경변수로 모델을 바꿀 수 있어요", async () => { await analyzeMenu(request(), { ...env, GEMINI_MODEL: "test-configured-model" }); expect(provider).toHaveBeenCalledWith("test-configured-model"); });
  it("키가 없으면 공급자를 호출하지 않아요", async () => { expect((await analyzeMenu(request(), {})).status).toBe(503); expect(generate).not.toHaveBeenCalled(); });
  it("GET은 거부해요", async () => { const result = await analyzeMenu(new Request("https://meide.test/api/analyze-menu"), env); expect(result.status).toBe(405); expect(result.headers.get("Allow")).toBe("POST"); });
  it("다른 사이트의 브라우저 요청을 거부해요", async () => { expect((await analyzeMenu(request(body, { origin: "https://another.test" }), env)).status).toBe(403); expect(generate).not.toHaveBeenCalled(); });
  it.each([{ images: [] }, { images: Array(7).fill(body.images[0]) }, { images: [{ mediaType: "image/svg+xml", data: jpeg }] }, { images: [{ mediaType: "image/jpeg", data: "https://another.test/file" }] }, { images: [{ mediaType: "image/jpeg", data: "aGVsbG8=" }] }])("잘못된 사진 요청을 거부해요: %j", async value => { expect((await analyzeMenu(request(value), env)).status).toBe(400); expect(generate).not.toHaveBeenCalled(); });
  it("content-length가 없어도 큰 본문은 공급자 호출 전에 거부해요", async () => { const result = await analyzeMenu(request({ images: [], extra: "x".repeat(MAX_BODY_BYTES) }), env); expect(result.status).toBe(413); expect(generate).not.toHaveBeenCalled(); });
  it("JSON 파싱 오류를 안전하게 반환해요", async () => { const result = await analyzeMenu(new Request("https://meide.test/api/analyze-menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: "broken" }), env); expect(result.status).toBe(400); });
  it.each(["quota exceeded", "timeout", "invalid key test-server-secret"])("공급자 실패 내용이 노출되지 않아요: %s", async message => { generate.mockRejectedValueOnce(new Error(message)); const result = await analyzeMenu(request(), env); expect(result.status).toBe(502); expect(await result.json()).toEqual({ error: "ANALYSIS_FAILED", message: "분석에 실패했어요" }); });
  it("메뉴판이 아닌 결과를 성공으로 반환하지 않아요", async () => { generate.mockResolvedValueOnce({ output: { ...analysisFixture, isMenu: false } }); expect((await analyzeMenu(request(), env)).status).toBe(502); });
});
describe("메뉴 분석 정규화", () => {
  it("판독 불가 가격은 빼고 다른 사진의 중복 메뉴는 합쳐요", () => {
    const menu = analysisFixture.items[0]; const result = normalizeAnalysis({ ...analysisFixture, items: [menu, menu, { ...menu, originalName: "UNREADABLE", priceEur: null }] });
    expect(result.items).toHaveLength(1); expect(result.skipped).toBe(1); expect(result.items[0].photoUrl).toBeNull();
  });
  it("실제 카테고리를 쓰고 임의 사진 URL은 버려요", () => { const result = normalizeAnalysis({ ...analysisFixture, items: [{ ...analysisFixture.items[0], photoUrl: "https://wrong-photo.test" }] }); expect(result.categories[0].name).toBe("파스타"); expect(result.items[0].photoUrl).toBeNull(); });
  it.each(["OTHER", "UNKNOWN"])("%s 통화는 유로 가격으로 오인하지 않아요", currency => { expect(() => normalizeAnalysis({ ...analysisFixture, currency })).toThrow(); });
  it("아무 가격도 읽지 못하면 실패해요", () => { expect(() => normalizeAnalysis({ ...analysisFixture, items: [{ ...analysisFixture.items[0], priceEur: null }] })).toThrow(); });
});
