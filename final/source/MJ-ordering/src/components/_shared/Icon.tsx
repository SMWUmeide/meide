export type IconName = "back" | "close" | "add" | "added" | "camera" | "flash" | "cart" | "info" | "ai";
const paths: Record<IconName, string> = {
  back: "m14 5-7 7 7 7", close: "m6 6 12 12M6 18 18 6", add: "M12 5v14M5 12h14", added: "m5 12 4 4L19 6",
  camera: "M4 7h4l2-3h4l2 3h4v13H4ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0", flash: "m13 2-8 12h6l-1 8 9-13h-7Z",
  cart: "M2 3h3l3 13h11l3-10H6M9 20h.01M18 20h.01", info: "M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  ai: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
};
export function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
