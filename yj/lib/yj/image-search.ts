// Keep search text literal: menu punctuation must not become Commons operators.
export function imageQueries(name: string): string[] {
  const clean = name
    .normalize("NFKC")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const short = clean.split(/\s+(?:e|con|with|and|avec|mit)\s+/i)[0];
  return [...new Set([clean, short])].filter(Boolean);
}

export async function loadMenuImages<
  T extends { id: string; image?: { verification?: string } },
  R,
>(
  items: T[],
  load: (item: T) => Promise<R | undefined>,
  apply: (item: T, image: R) => void,
  active: () => boolean,
) {
  for (const item of items) {
    if (!active()) break;
    if (item.image?.verification === "dish-v1") continue;
    try {
      const image = await load(item);
      if (active() && image) apply(item, image);
    } catch {
      // One unavailable photo must not block the rest of the menu.
    }
  }
}
