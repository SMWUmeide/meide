"use client";
import type { Location } from "../model";
export function currentLocation(
  fallback: Location,
): Promise<{ location: Location; fallback: boolean }> {
  if (!navigator.geolocation)
    return Promise.resolve({ location: fallback, fallback: true });
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          location: { lat: p.coords.latitude, lng: p.coords.longitude },
          fallback: false,
        }),
      () => resolve({ location: fallback, fallback: true }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    ),
  );
}
export async function speak(text: string, language: string) {
  if (!("speechSynthesis" in window))
    throw Error(
      "이 브라우저는 소리 읽기를 지원하지 않아요. 크게 보여주기를 이용해 주세요.",
    );
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(
    (v) => v.localService && v.lang.startsWith(language.slice(0, 2)),
  );
  if (!voice)
    throw Error(
      "기기에 해당 언어 음성이 없어요. 크게 보여주기를 이용해 주세요.",
    );
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.voice = voice;
    utterance.onend = utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
type RecognitionResultEvent = { results: { 0: { 0: { transcript: string } } } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;
export function listen(
  language: string,
  onResult: (text: string) => void,
  onError: (message: string) => void,
): { stop: () => void; abort: () => void } | undefined {
  const w = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Recognition) return;
  const instance = new Recognition();
  instance.lang = language;
  instance.continuous = false;
  instance.interimResults = false;
  let received = false;
  instance.onresult = (e) => {
    received = true;
    onResult(e.results[0][0].transcript);
  };
  instance.onerror = (e) => {
    received = true;
    onError(
      e.error === "not-allowed"
        ? "마이크 사용을 허용하거나 직접 입력해 주세요."
        : "음성을 듣지 못했어요. 직접 입력해 주세요.",
    );
  };
  instance.onend = () => {
    if (!received) onError("음성을 듣지 못했어요. 직접 입력해 주세요.");
  };
  try {
    instance.start();
    return {
      stop: () => instance.stop(),
      abort: () => {
        received = true;
        instance.abort();
      },
    };
  } catch {
    onError("음성 입력을 시작하지 못했어요. 직접 입력해 주세요.");
  }
}
export function cameraGuidance(userAgent:string){const ios=/iPad|iPhone|iPod/.test(userAgent);const browser=/CriOS|Chrome/.test(userAgent)?'Chrome':/FxiOS|Firefox/.test(userAgent)?'Firefox':/EdgiOS|Edg\//.test(userAgent)?'Edge':/SamsungBrowser/.test(userAgent)?'삼성 인터넷':'Safari';return ios?`iPhone 설정 → 앱 → ${browser} → 카메라를 허용해 주세요. Safari는 주소창의 페이지 메뉴 → 웹사이트 설정 → 카메라에서도 허용할 수 있어요. 설정 후 이 화면으로 돌아오면 다시 요청해요.`:/Android/.test(userAgent)?`주소창 왼쪽 사이트 정보 → 권한 → 카메라를 허용해 주세요. Android 설정 → 앱 → ${browser} → 권한에서도 바꿀 수 있어요.`:'주소창 왼쪽 사이트 정보 → 사이트 설정 → 카메라를 허용해 주세요. 설정 후 돌아와 다시 시도해 주세요.'}
