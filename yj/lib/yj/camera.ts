/** Lifecycle is independent of React, so late permission replies and track cleanup can be tested. */
export class CameraController {
  private generation = 0;
  stream: MediaStream | null = null;
  constructor(
    private readonly request: (
      constraints: MediaStreamConstraints,
    ) => Promise<MediaStream>,
  ) {}
  async start(video: HTMLVideoElement) {
    const generation = ++this.generation;
    this.stopTracks();
    const stream = await this.request({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    if (this.generation !== generation) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    this.stream = stream;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    try {
      await video.play();
    } catch {
      if (this.generation === generation) {
        this.stop();
        throw Error("미리보기를 시작하지 못했어요. 다시 시도해 주세요.");
      }
    }
    return this.generation === generation;
  }
  private stopTracks() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
  stop() {
    this.generation++;
    this.stopTracks();
  }
  torchAvailable() {
    const track = this.stream?.getVideoTracks()[0];
    return Boolean(
      (
        track?.getCapabilities?.() as MediaTrackCapabilities & {
          torch?: boolean;
        }
      )?.torch,
    );
  }
  async torch(on: boolean) {
    const track = this.stream?.getVideoTracks()[0];
    if (!track || !this.torchAvailable()) return;
    await track.applyConstraints({
      advanced: [{ torch: on } as MediaTrackConstraintSet],
    });
  }
}
export function captureDimensions(width: number, height: number, max = 1600) {
  if (width <= 0 || height <= 0)
    throw Error("카메라가 준비 중이에요. 잠시 후 다시 눌러 주세요.");
  const factor = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.round(width * factor),
    height: Math.round(height * factor),
  };
}
export function captureVideo(video: HTMLVideoElement) {
  const size = captureDimensions(video.videoWidth, video.videoHeight);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("사진을 저장하지 못했어요. 앨범에서 골라 주세요.");
  ctx.drawImage(video, 0, 0, size.width, size.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}
export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024)
    throw Error("20MB 이하의 사진을 골라 주세요.");
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const size = captureDimensions(
            image.naturalWidth,
            image.naturalHeight,
          );
          const canvas = document.createElement("canvas");
          canvas.width = size.width;
          canvas.height = size.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw Error();
          ctx.drawImage(image, 0, 0, size.width, size.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch {
          reject(Error("사진을 줄이지 못했어요. 다른 사진을 골라 주세요."));
        }
      };
      image.onerror = () =>
        reject(
          Error("이 사진 형식을 열지 못했어요. JPEG나 PNG 사진을 골라 주세요."),
        );
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
