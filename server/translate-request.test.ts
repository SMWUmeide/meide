import { beforeEach, describe, expect, it, vi } from "vitest";
import { translateRequest } from "./translate-request";
import { apiAccess } from "./http";
const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("ai", () => ({ generateText: generate, Output: { object: vi.fn(value => value) } }));
vi.mock("@ai-sdk/google", () => ({ createGoogleGenerativeAI: () => () => "test-model" }));
const env = { GEMINI_API_KEY: "test-secret", NATIVE_APP_ORIGINS: "https://localhost" };
function request(value: unknown, origin = "https://localhost") {
  return new Request("https://meide.test/api/translate-request", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(value) });
}
beforeEach(() => { vi.clearAllMocks(); generate.mockResolvedValue({ output: { translation: "Senza formaggio, per favore." } }); });
describe("모바일 요청사항 번역", () => {
  it("허용한 Android origin만 preflight와 응답을 읽을 수 있어요", async () => {
    const preflight = apiAccess(new Request("https://meide.test/api/translate-request", { method: "OPTIONS", headers: { Origin: "https://localhost" } }), env).response!;
    expect(preflight.status).toBe(204); expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
    const result = await translateRequest(request({ text: "치즈는 빼주세요" }), env);
    expect(result.status).toBe(200); expect(await result.json()).toEqual({ translation: "Senza formaggio, per favore." });
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
    expect((await translateRequest(request({ text: "치즈는 빼주세요" }, "https://elsewhere.test"), env)).status).toBe(403);
  });
  it.each([{}, { text: "" }, { text: "x".repeat(501) }, { text: "양파 빼주세요", injected: true }])("잘못된 입력을 AI 호출 전에 거부해요", async value => {
    expect((await translateRequest(request(value), env)).status).toBe(400); expect(generate).not.toHaveBeenCalled();
  });
  it("큰 본문을 거부해요", async () => { expect((await translateRequest(request({ text: "x".repeat(5000) }), env)).status).toBe(413); expect(generate).not.toHaveBeenCalled(); });
  it("비어 있는 공급자 결과를 성공으로 표시하지 않아요", async () => { generate.mockResolvedValue({ output: { translation: "" } }); expect((await translateRequest(request({ text: "치즈는 빼주세요" }), env)).status).toBe(502); });
  it("키가 없어도 허용 origin에 오류가 전달돼요", async () => {
    const result = await translateRequest(request({ text: "치즈는 빼주세요" }), { NATIVE_APP_ORIGINS: "https://localhost" });
    expect(result.status).toBe(503); expect(result.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost"); expect(generate).not.toHaveBeenCalled();
  });
  it("공급자 오류 원문이나 서버 키가 응답에 나오지 않아요", async () => {
    generate.mockRejectedValue(new Error("test-secret"));
    const result = await translateRequest(request({ text: "치즈는 빼주세요" }), env);
    expect(result.status).toBe(502); expect(await result.text()).not.toContain("test-secret");
  });
});
