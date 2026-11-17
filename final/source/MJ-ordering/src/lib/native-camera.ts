import { Capacitor } from "@capacitor/core";
import { Camera, type MediaResult } from "@capacitor/camera";

export async function photoFile(photo: Pick<MediaResult, "uri" | "webPath">): Promise<File> {
  const path = photo.webPath || (photo.uri ? Capacitor.convertFileSrc(photo.uri) : "");
  if (!path) throw new Error("사진을 읽지 못했어요");
  const response = await fetch(path);
  if (!response.ok) throw new Error("사진을 읽지 못했어요");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") || blob.size > 10 * 1024 * 1024) throw new Error("사진은 10MB 이하의 이미지로 선택해 주세요");
  return new File([blob], `menu-${Date.now()}.jpg`, { type: blob.type });
}
export async function pickNativePhotos(source: "camera" | "gallery", limit: number) {
  const photos = source === "camera"
    ? [await Camera.takePhoto({ quality: 88, targetWidth: 1800, targetHeight: 1800, saveToGallery: false })]
    : (await Camera.chooseFromGallery({ allowMultipleSelection: true, limit, quality: 88, targetWidth: 1800, targetHeight: 1800 })).results;
  return Promise.all(photos.slice(0, limit).map(photoFile));
}
