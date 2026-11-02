"use client";
import { getSvgPath } from "figma-squircle";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export const SQUIRCLE_SMOOTHING = 0.8;

type ShapeProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  radius?: number | "chip";
  round?: boolean;
  children?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  title?: string;
};
/** All paint, clipping and stroke share the measured Figma path. Shadows remain outside the path. */
export function Squircle({
  as: Tag = "div",
  radius = 30,
  round = false,
  className = "",
  style,
  children,
  ...props
}: ShapeProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const cornerRadius = round
        ? Math.min(width, height) / 2
        : radius === "chip"
          ? height * 0.44
          : radius;
      const options = {
        width,
        height,
        cornerRadius,
        cornerSmoothing: round ? 0 : SQUIRCLE_SMOOTHING,
        preserveSmoothing: true,
      };
      const path = getSvgPath(options);
      const stroke = getSvgPath({
        ...options,
        width: Math.max(1, width - 2),
        height: Math.max(1, height - 2),
        cornerRadius: Math.max(0, cornerRadius - 1),
      });
      const color =
        getComputedStyle(element).getPropertyValue("--shape-stroke").trim() ||
        "transparent";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${stroke}" transform="translate(1 1)" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
      element.style.setProperty("--squircle-path", `path('${path}')`);
      element.style.setProperty(
        "--squircle-stroke-image",
        `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
      );
      element.dataset.smoothing = round ? "0" : String(SQUIRCLE_SMOOTHING);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [radius, round, className]);
  return (
    <Tag
      ref={ref}
      className={`squircle-host ${className}`}
      style={style as CSSProperties}
      {...props}
    >
      {children}
    </Tag>
  );
}
export function Glass({ className = "", ...props }: ShapeProps) {
  return <Squircle className={`glass ${className}`} {...props} />;
}
