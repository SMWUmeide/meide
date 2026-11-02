import { fileURLToPath, URL } from "node:url";
import { Readable } from "node:stream";
import react from "@vitejs/plugin-react";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";

// Vercel의 /api 경로를 로컬에서도 같은 서버 함수로 실행해요.
function localMenuApi(): Plugin {
  return { name: "local-menu-api", configureServer(server) {
    const env = loadEnv(server.config.mode, server.config.root, "");
    server.middlewares.use("/api/analyze-menu", async (req, res) => {
      const controller = new AbortController();
      res.on("close", () => { if (!res.writableEnded) controller.abort(); });
      try {
        const { analyzeMenu } = await import("./server/analyze-menu");
        const init: RequestInit & { duplex: "half" } = { method: req.method, headers: Object.fromEntries(Object.entries(req.headers).filter((entry): entry is [string, string] => typeof entry[1] === "string")), duplex: "half", signal: controller.signal };
        if (req.method !== "GET" && req.method !== "HEAD") init.body = Readable.toWeb(req) as ReadableStream;
        const response = await analyzeMenu(new Request(`http://${req.headers.host || "127.0.0.1:5173"}/api/analyze-menu`, init), { GEMINI_API_KEY: process.env.GEMINI_API_KEY || env.GEMINI_API_KEY, GEMINI_MODEL: process.env.GEMINI_MODEL || env.GEMINI_MODEL });
        res.statusCode = response.status; response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch { res.statusCode = 500; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ message: "분석에 실패했어요" })); }
    });
  } };
}
export default defineConfig({
  plugins: [react(), localMenuApi()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"], include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.ts"] },
});
