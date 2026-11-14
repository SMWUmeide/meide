import { Capacitor } from "@capacitor/core";

export function apiUrl(path: string) {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (base) {
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("API 서버 주소를 확인해 주세요");
    return new URL(path, url.origin).href;
  }
  if (Capacitor.isNativePlatform()) throw new Error("아직 API 서버가 연결되지 않았어요");
  return path;
}
