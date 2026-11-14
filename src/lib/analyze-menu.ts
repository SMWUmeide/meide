import { apiUrl } from "./api";
import { menuBoardSchema, type MenuBoard } from "@/data/menu-schema";

const MAX_REQUEST_BYTES = 3_900_000;
export type PreparedImage = { mediaType: "image/jpeg"; data: string };

function loadPhoto(file: File, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error("취소했어요")); return; }
    const url = URL.createObjectURL(file), image = new Image();
    function cleanup() { URL.revokeObjectURL(url); signal.removeEventListener("abort", abort); image.onload = null; image.onerror = null; }
    function abort() { cleanup(); image.src = ""; reject(new Error("취소했어요")); }
    image.onload = () => { cleanup(); resolve(image); };
    image.onerror = () => { cleanup(); reject(new Error("사진을 읽을 수 없어요")); };
    signal.addEventListener("abort", abort, { once: true }); image.src = url;
  });
}
export async function prepareImages(files: File[], signal: AbortSignal): Promise<PreparedImage[]> {
  if (!files.length || files.length > 6) throw new Error("사진은 1~6장 선택해 주세요");
  const images: PreparedImage[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) throw new Error("사진 파일을 확인해 주세요");
    const image = await loadPhoto(file, signal);
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("사진을 변환할 수 없어요");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let data = "";
    for (const quality of [0.88, 0.75, 0.6, 0.45]) {
      data = canvas.toDataURL("image/jpeg", quality).split(",")[1] || "";
      if (data.length <= Math.floor((MAX_REQUEST_BYTES - 2048) / files.length)) break;
    }
    canvas.width = 0; canvas.height = 0;
    if (!data || data.length > Math.floor((MAX_REQUEST_BYTES - 2048) / files.length)) throw new Error("사진 수나 용량을 줄여 주세요");
    images.push({ mediaType: "image/jpeg", data });
  }
  if (JSON.stringify({ images }).length > MAX_REQUEST_BYTES) throw new Error("사진 용량을 줄여 주세요");
  return images;
}

export async function analyzePhotos(files: File[], signal: AbortSignal): Promise<MenuBoard> {
  const images = await prepareImages(files, signal);
  const response = await fetch(apiUrl("/api/analyze-menu"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images }), signal });
  if (!response.ok) throw new Error("분석에 실패했어요");
  const value = await response.json();
  // 서버가 HTML 오류나 잘못된 객체를 반환해도 성공으로 취급하지 않아요.
  const result = menuBoardSchema.safeParse(value?.board);
  if (!result.success) throw new Error("분석에 실패했어요");
  return result.data;
}
