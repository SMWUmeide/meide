"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CameraController } from "@/lib/yj/camera";
export function useCamera(
  enabled: boolean,
  video: RefObject<HTMLVideoElement | null>,
  onFailure: (message: string) => void,
) {
  const [ready, setReady] = useState(false),
    [torchAvailable, setTorchAvailable] = useState(false),
    [torch, setTorch] = useState(false),
    [fallback, setFallback] = useState(false);
  const controller = useRef<CameraController | null>(null);
  const failure = useRef(onFailure);
  useEffect(() => {
    failure.current = onFailure;
  }, [onFailure]);
  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    const unsupported = !navigator.mediaDevices?.getUserMedia;
    if (unsupported) {
      queueMicrotask(() => {
        if (mounted) setFallback(true);
      });
      return () => {
        mounted = false;
      };
    }
    const element = video.current;
    const camera = new CameraController((c) =>
      navigator.mediaDevices.getUserMedia(c),
    );
    controller.current = camera;
    let requesting = false,
      startedAfterHide = false;
    async function start() {
      if (
        !mounted ||
        document.visibilityState === "hidden" ||
        requesting ||
        !video.current
      )
        return;
      requesting = true;
      try {
        const started = await camera.start(video.current!);
        if (mounted && started) {
          setReady(true);
          setTorchAvailable(camera.torchAvailable());
          setTorch(false);
          setFallback(false);
        }
      } catch (e) {
        if (mounted) {
          const name = e instanceof DOMException ? e.name : "";
          failure.current(
            name === "NotAllowedError"
              ? "카메라 권한이 꺼져 있어요."
              : name === "NotFoundError"
                ? "사용할 수 있는 카메라가 없어요."
                : "카메라를 시작하지 못했어요. 다른 앱이 카메라를 사용 중인지 확인해 주세요.",
          );
        }
      } finally {
        requesting = false;
        if (
          mounted &&
          document.visibilityState === ("visible" as DocumentVisibilityState) &&
          !camera.stream &&
          startedAfterHide
        ) {
          startedAfterHide = false;
          void start();
        }
      }
    }
    function stop() {
      camera.stop();
      if (video.current) video.current.srcObject = null;
      if (mounted) {
        setReady(false);
        setTorchAvailable(false);
        setTorch(false);
      }
    }
    function visibility() {
      if (document.visibilityState === "hidden") stop();
      else {
        if (requesting) startedAfterHide = true;
        else void start();
      }
    }
    function pageshow() {
      void start();
    }
    void start();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", stop);
    window.addEventListener("pageshow", pageshow);
    return () => {
      mounted = false;
      camera.stop();
      if (element) element.srcObject = null;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("pageshow", pageshow);
      controller.current = null;
    };
  }, [enabled, video]);
  async function toggleTorch() {
    try {
      await controller.current?.torch(!torch);
      setTorch((v) => !v);
    } catch {
      failure.current(
        "플래시를 켜지 못했어요. 조명이 밝은 곳에서 촬영해 주세요.",
      );
    }
  }
  return { ready, torchAvailable, torch, fallback, toggleTorch };
}
