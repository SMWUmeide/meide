import { useEffect, useId, useRef, type ReactNode } from "react";
export type BottomSheetProps = { open: boolean; dismissible?: boolean; onClose?: () => void; children: ReactNode; label?: string };
export function BottomSheet({ open, dismissible = true, onClose, children, label = "자세한 내용을 확인해 주세요" }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const startY = useRef<number | null>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      const previous = document.querySelector<HTMLDialogElement>("dialog[data-meide-sheet][open]");
      if (previous && previous !== dialog) throw new Error("바텀시트 위에 다른 시트를 열 수 없어요.");
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      timer = setTimeout(() => dialog.close(), 200);
    }
    return () => { clearTimeout(timer); };
  }, [open]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    return () => { if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} data-meide-sheet="" data-open={open} className="bottom-sheet" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (dismissible) onClose?.(); }} onClick={event => {
    if (!dismissible || event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose?.();
  }}>
    <h2 id={titleId} className="sr-only">{label}</h2>
    <div className="sheet-drag-area" onPointerDown={event => { startY.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={event => { if (dismissible && startY.current !== null && event.clientY - startY.current > 40) onClose?.(); startY.current = null; }} onPointerCancel={() => { startY.current = null; }}><span className="sheet-handle" /></div>
    {children}
  </dialog>;
}
