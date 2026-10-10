import { sections, type Dish } from "./data";

// Photo if we have one; otherwise a soft section-tinted plate placeholder.
export default function DishImg({ d, className = "", fit = "cover" }: { d: Dish; className?: string; fit?: "cover" | "contain" }) {
  if (d.img) return <img src={d.img} alt={`${d.name} 음식 예시 이미지`} className={`${className} ${fit === "cover" ? "object-cover" : "object-contain"}`} />;
  const tint = sections.find((s) => s.id === d.section)?.tint ?? "#efe9e0";
  return (
    <div role="img" aria-label={`${d.name} 사진 없음`} className={`${className} grid place-items-center`} style={{ background: tint }}>
      <svg width="40%" height="40%" viewBox="0 0 48 48" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="2" aria-hidden className="max-w-12 max-h-12">
        <circle cx="24" cy="26" r="14" /><circle cx="24" cy="26" r="8" />
        <path d="M6 10v8a3 3 0 0 0 3 3v17M9 10v8M12 10v8a3 3 0 0 1-3 3M40 10c-3 2-4 6-4 10h4v18" strokeLinecap="round" />
      </svg>
    </div>
  );
}
