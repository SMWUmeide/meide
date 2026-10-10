import { useEffect, useRef, useState, type ChangeEvent } from "react";

const a = "/assets";
const icClose = `${a}/826d0.svg`;
const icGallery = `${a}/90623.svg`;

export default function CameraScreen({ count, onClose, onShot }: { count: number; onClose: () => void; onShot: (img: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setLive(true);
        }
      })
      .catch(() => setLive(false));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const shoot = () => {
    const v = videoRef.current;
    if (!live || !v || !v.videoWidth) return;
    setFlash(true);
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const img = c.toDataURL("image/jpeg", 0.85);
    setTimeout(() => onShot(img), 180);
  };

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onShot(String(r.result));
    r.readAsDataURL(f);
  };

  return (
    <div className="relative h-full overflow-hidden bg-[#050505] text-white">
      {/* Camera preview fills the whole screen; everything else floats on top. */}
      <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 size-full object-cover ${live ? "" : "hidden"}`} />
      {!live && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#746f66_0%,#514e48_30%,#3f3d38_45%,#2d2c29_70%)]" />}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[190px] bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-10">
        <div className="h-[16px]" />
        <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3">
          <button aria-label="촬영 닫기" onClick={onClose} className="grid place-items-center size-12 rounded-full">
            <img src={icClose} alt="" width={24} height={24} />
          </button>
          <p className="font-b text-[17px] text-center">메뉴판 촬영{count > 0 && ` · ${count + 1}장째`}</p>
        </header>
      </div>

      {/* Guide frame */}
      <div className="pointer-events-none absolute left-5 right-5 top-[78px] bottom-[188px] rounded-[6px] border border-white/90">
        <span className="absolute -left-0.5 -top-0.5 size-8 border-l-[3px] border-t-[3px] border-white" />
        <span className="absolute -right-0.5 -top-0.5 size-8 border-r-[3px] border-t-[3px] border-white" />
        <span className="absolute -left-0.5 -bottom-0.5 size-8 border-l-[3px] border-b-[3px] border-white" />
        <span className="absolute -right-0.5 -bottom-0.5 size-8 border-r-[3px] border-b-[3px] border-white" />
      </div>
      <p className="absolute left-5 right-5 bottom-[136px] rounded-full bg-black/70 px-3 py-2.5 text-center font-r text-[15px] leading-[22px]">
        메뉴판 글자가 선명하게 보이도록 맞춰주세요.
      </p>
      {flash && <div className="absolute inset-0 z-20 bg-white animate-[ping_0.2s_ease-out]" />}

      <div className="absolute inset-x-0 bottom-0 z-10 pb-[24px]">
        <div className="grid grid-cols-3 items-center px-8 py-2">
          <button aria-label="사진에서 선택" onClick={() => fileRef.current?.click()} className="justify-self-center grid place-items-center size-14 rounded-full bg-[#282828]/80">
            <img src={icGallery} alt="" width={23} height={24} />
          </button>
          <button aria-label="촬영" onClick={shoot} className="justify-self-center grid place-items-center size-[76px] rounded-full border-4 border-white active:scale-95 transition">
            <span className="size-[58px] rounded-full bg-white" />
          </button>
          <span />
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      </div>
    </div>
  );
}
