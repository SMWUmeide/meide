import type {
  AllergenCode,
  Friend,
  Location,
  MenuImage,
  Restaurant,
  Trip,
} from "./model";
import { allergenNames } from "./model";
import { fixtureMedia } from "./fixtures";
export function imageUrl(image: MenuImage | undefined, fixtureId?: string) {
  return (
    image?.url ??
    (fixtureId && fixtureMedia[fixtureId]
      ? `/assets/yj/${fixtureMedia[fixtureId]}`
      : "")
  );
}
export function allergyText(codes: AllergenCode[]) {
  return codes.length
    ? codes.map((c) => `${allergenNames[c]} (EU ${c})`).join(" · ")
    : "메뉴판에 별도 표기가 없어요";
}
export function distanceMeters(a: Location, b: Location) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const p = rad(b.lat - a.lat),
    q = rad(b.lng - a.lng);
  return Math.round(
    6371000 *
      2 *
      Math.asin(
        Math.sqrt(
          Math.sin(p / 2) ** 2 +
            Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(q / 2) ** 2,
        ),
      ),
  );
}
export function openingLabel(
  hours: string | undefined,
  timezone = "Europe/Rome",
  now = new Date(),
) {
  if (!hours) return "영업시간 정보 없음";
  if (hours === "24/7") return "24시간 영업";
  const match = hours.match(/^Mo-Su\s+(\d\d:\d\d)-(\d\d:\d\d)$/);
  if (!match) return hours;
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  if (time >= match[1] && time < match[2]) return `영업 중 · ${match[2]}까지`;
  return `영업시간 ${match[1]}–${match[2]}`;
}
export function restaurantView(r: Restaurant, origin: Location, trip: Trip) {
  const distance = distanceMeters(origin, r.location);
  return {
    ...r,
    type:
      r.kind === "korean"
        ? "한식"
        : r.kind === "asian"
          ? "아시안"
          : r.kind === "market"
            ? "마켓"
            : r.id.startsWith("osm:")
              ? r.cuisine.join(" · ") || "식당"
              : r.category.includes("국물 요리")
                ? "수프·스튜"
                : "토스카나 가정식",
    distance,
    walk: Math.max(1, Math.ceil(distance / 80)),
    photoUrl: imageUrl(r.photo, r.id),
    rating: r.koreanRating?.average ?? 0,
    count: r.koreanRating?.count ?? 0,
    signature: r.signatureItem?.korean,
    analogy: r.signatureItem?.analogy,
    hours: openingLabel(r.openingHours, trip.timezone),
  };
}
export function friendView(f: Friend, index: number) {
  return {
    ...f,
    initial: f.name.startsWith("김영수") ? "영" : f.name.slice(0, 1),
    kind: f.travelingWith
      ? ("companion" as const)
      : index % 2
        ? ("teal" as const)
        : ("orange" as const),
  };
}
