import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzePhotos, prepareImages } from "./analyze-menu";
import { analysisFixture } from "../../server/analysis-fixture";
import { normalizeAnalysis } from "@/data/menu-schema";
const base64 = " /9j/4A==".trim();
const canvasContext = { drawImage: vi.fn() };
beforeEach(() => {
  const NativeURL = URL;
  vi.stubGlobal("URL", class extends NativeURL { static createObjectURL() { return "blob:local-photo"; } static revokeObjectURL = vi.fn(); });
  vi.stubGlobal("Image", class { naturalWidth = 3600; naturalHeight = 2400; onload: (() => void) | null = null; onerror: (() => void) | null = null; set src(value: string) { if (value) queueMicrotask(() => this.onload?.()); } });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(`data:image/jpeg;base64,${base64}`);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const file = () => new File(["photo"], "menu.jpg", { type: "image/jpeg" });
describe("사진 압축과 서버 요청", () => {
  it("최대 변 1800으로 줄이고 JPEG로 전송해요", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ board: normalizeAnalysis(analysisFixture) })); vi.stubGlobal("fetch", fetch);
    const result = await analyzePhotos([file()], new AbortController().signal);
    expect(result.items[0].priceEur).toBe(12.5); expect(canvasContext.drawImage.mock.calls.at(-1)?.slice(1)).toEqual([0, 0, 1800, 1200]);
    const [url, init] = fetch.mock.calls[0]; expect(url).toBe("/api/analyze-menu"); expect(init.headers).toEqual({ "Content-Type": "application/json" }); expect(JSON.parse(init.body)).toEqual({ images: [{ mediaType: "image/jpeg", data: base64 }] });
    expect(init.body).not.toContain("GEMINI_API_KEY"); expect(init.body).not.toContain("menu.jpg");
  });
  it("압축해도 큰 사진은 전송하지 않아요", async () => {
    vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockReturnValue(`data:image/jpeg;base64,${"a".repeat(4_000_000)}`);
    await expect(prepareImages([file()], new AbortController().signal)).rejects.toThrow("용량");
  });
  it("취소된 분석은 사진을 전송하지 않아요", async () => { const controller = new AbortController(); controller.abort(); await expect(prepareImages([file()], controller.signal)).rejects.toThrow("취소"); });
  it.each([503, 429, 502, 413])("서버 %i 오류를 성공 처리하지 않아요", async status => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("failure", { status }))); await expect(analyzePhotos([file()], new AbortController().signal)).rejects.toThrow("분석에 실패했어요"); });
  it("잘못된 서버 결과를 화면으로 보내지 않아요", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ board: { source: "gemini", items: [{ name: "깨진 데이터" }] } }))); await expect(analyzePhotos([file()], new AbortController().signal)).rejects.toThrow("분석에 실패했어요"); });
});
