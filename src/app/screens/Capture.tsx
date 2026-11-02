import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/IconButton";
import { Button } from "@/components/Button";
import { menuItems } from "@/data/mock-menu";
import { figmaAssets } from "@/data/figma-assets";
const assets = figmaAssets["533-2"];
export function Capture({ files, setFiles, onBack, onContinue, notify }: { files: File[]; setFiles: (files: File[]) => void; onBack: () => void; onContinue: () => void; notify: (text: string) => void }) {
  const camera = useRef<HTMLInputElement>(null), gallery = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    const file = files.at(-1); if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort(); };
  }, [files]);
  function addFiles(input: HTMLInputElement) {
    const selected = Array.from(input.files ?? []);
    if (selected.some(file => !file.type.startsWith("image/"))) { notify("사진 파일을 선택해 주세요"); input.value = ""; return; }
    if (selected.some(file => file.size > 10 * 1024 * 1024)) { notify("사진은 한 장에 10MB 이하로 선택해 주세요"); input.value = ""; return; }
    if (files.length + selected.length > 6) notify("사진은 최대 6장까지 선택할 수 있어요");
    setFiles([...files, ...selected].slice(0, 6)); input.value = "";
  }
  return <main className="capture-page" data-screen="capture"><header className="toolbar"><IconButton icon="close" iconSrc={assets.imgFrame1} tone="glass" label="촬영 닫기" onClick={onBack} /><h1 className="t-title-md">메뉴판 찍기</h1><IconButton icon="flash" iconSrc={assets.imgFrame2} tone="glass" label="플래시 안내" onClick={() => notify("플래시는 휴대폰 카메라에서 설정해 주세요")} /></header>
    <div className="camera-view"><div className="scan-frame" aria-hidden="true"><img src={assets.imgGroup} alt="" /></div>{preview ? <img className="capture-preview" src={preview} alt="선택한 메뉴판 사진" /> : <div className="sample-paper"><span className="t-body-sm">Osteria</span><h2 className="t-headline-md">La Solita Zuppa</h2><p className="t-body-sm muted">— ZUPPE —</p>{menuItems.filter(item => item.category === "soup").map(item => <div className="paper-row t-body-sm" key={item.id}><span>{item.originalName.toLowerCase()}</span><span>{item.priceEur}</span></div>)}<p className="t-body-sm muted">— SECONDI —</p><div className="paper-row t-body-sm"><span>Ossobuco di Chianina e purè</span><span>18</span></div><div className="paper-row t-body-sm"><span>Peposo all’imprunetana</span><span>17</span></div><span className="t-body-sm muted">Coperto EUR 2.50 · 약 3,748원</span><span className="sample-label t-body-sm">예시 메뉴판이에요</span></div>}</div>
    <p className="capture-hint t-body-sm">여러 장이면 이어서 찍을 수 있어요 · 최대 6장</p>
    <input ref={camera} className="sr-only" aria-label="메뉴판 사진 촬영" type="file" accept="image/*" capture="environment" tabIndex={-1} onChange={event => addFiles(event.currentTarget)} />
    <input ref={gallery} className="sr-only" aria-label="메뉴판 사진 파일 선택" type="file" accept="image/*" multiple tabIndex={-1} onChange={event => addFiles(event.currentTarget)} />
    <div className="capture-controls"><button className="gallery-button" aria-label="사진에서 고르기" onClick={() => gallery.current?.click()}><img src={assets.imgFrame3} alt="" /></button><button className="shutter" aria-label="메뉴판 촬영하기" onClick={() => camera.current?.click()}><img src={assets.img} alt="" /><span className="shutter-face"><img src={assets.img1} alt="" /></span></button><span className="capture-count t-title-md" aria-live="polite">{files.length}장</span></div>
    <div className="capture-next"><Button variant="secondary" onClick={onContinue}>{files.length ? "선택한 사진으로 메뉴 고르기" : "예시 메뉴판으로 시작하기"}</Button><p className="t-body-sm">지금은 사진을 전송하지 않고 예시 메뉴를 보여 드려요</p></div>
  </main>;
}
