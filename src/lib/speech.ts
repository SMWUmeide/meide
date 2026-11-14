import { Capacitor, registerPlugin } from "@capacitor/core";

const NativeSpeech = registerPlugin<{ speak(options: { text: string; language: string }): Promise<void>; stop(): Promise<void> }>("MeideSpeech");
export function stopSpeech() {
  if (Capacitor.isNativePlatform()) void NativeSpeech.stop().catch(() => {});
  else window.speechSynthesis?.cancel();
}
export async function speak(text: string) {
  stopSpeech();
  if (Capacitor.isNativePlatform()) return NativeSpeech.speak({ text, language: "it-IT" });
  if (!window.speechSynthesis) throw new Error("이 기기에서는 듣기를 지원하지 않아요. 확대해서 보여주세요");
  return new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.rate = 0.85;
    utterance.onend = () => resolve();
    utterance.onerror = event => event.error === "canceled" || event.error === "interrupted" ? resolve() : reject(new Error("음성을 재생할 수 없어요. 확대해서 보여주세요"));
    window.speechSynthesis.speak(utterance);
  });
}
