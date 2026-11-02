import { afterEach, expect, it, vi } from "vitest";
import { analyzeMenu } from "./analyze-menu";
import { analysisFixture } from "./analysis-fixture";
afterEach(() => vi.unstubAllGlobals());
it("실제 Google SDK의 HTTP 형식과 구조화 응답을 끝까지 검증해요", async () => {
  const googleFetch = vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { role: "model", parts: [{ text: JSON.stringify(analysisFixture) }] }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, totalTokenCount: 300 } }));
  vi.stubGlobal("fetch", googleFetch);
  const photo = Buffer.from([255, 216, 255, 224, 1, 2, 3]).toString("base64");
  const response = await analyzeMenu(new Request("https://meide.test/api/analyze-menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images: [{ mediaType: "image/jpeg", data: photo }] }) }), { GEMINI_API_KEY: "test-server-key" });
  expect(response.status).toBe(200);
  const result = await response.json(); expect(result.board.items[0].name).toBe("토마토 파스타"); expect(result.board.items[0].photoUrl).toBeNull();
  expect(googleFetch).toHaveBeenCalledTimes(1);
  const [url, init] = googleFetch.mock.calls[0];
  expect(String(url)).toContain("generativelanguage.googleapis.com"); expect(String(url)).not.toContain("test-server-key");
  expect(new Headers(init.headers).get("x-goog-api-key")).toBe("test-server-key");
  const body = JSON.parse(init.body); expect(body.contents[0].parts[0].inlineData).toEqual({ mimeType: "image/jpeg", data: photo });
  expect(body.generationConfig.responseMimeType).toBe("application/json");
});
