import { z } from "zod";
import tzlookup from "tz-lookup";
import type {
  ExchangeRate,
  KoreanCategory,
  Location,
  MenuImage,
  Restaurant,
  Trip,
} from "../model";
import {
  ServiceStore,
  ServiceError,
  externalJSON,
  type ServiceEnv,
} from "./store";
import { citySearch } from "../../cloud-cities";
import { distanceMeters } from "../presentation";
const agent = (env: ServiceEnv) =>
  env.OSM_USER_AGENT ||
  "MEIDE-YJ/1.0 (classroom menu assistant; github.com/SMWUmeide/meide)";
let osmTail: Promise<unknown> = Promise.resolve();
let nextOSM = 0;
async function osm(
  url: string,
  env: ServiceEnv,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
) {
  const job = osmTail
    .catch(() => {})
    .then(async () => {
      const slot = await new ServiceStore(env).reserveOSM();
      const delay = Math.max(0, (slot ?? nextOSM) - Date.now());
      if (delay) await new Promise((r) => setTimeout(r, delay));
      nextOSM = Date.now() + 1100;
      return externalJSON(
        url,
        {
          ...init,
          headers: {
            ...init.headers,
            "User-Agent": agent(env),
            "Accept-Language": "ko,it,en",
          },
        },
        fetcher,
      );
    });
  osmTail = job;
  return job;
}
const point = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
const osmElement = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string()).default({}),
});
function restaurant(
  element: z.infer<typeof osmElement>,
): Restaurant | undefined {
  const tags = element.tags;
  const lat = element.lat ?? element.center?.lat,
    lng = element.lon ?? element.center?.lon;
  if (lat === undefined || lng === undefined || !tags.name) return;
  const cuisine = (tags.cuisine ?? "").split(";").filter(Boolean);
  const kind = tags.shop
    ? "market"
    : cuisine.includes("korean")
      ? "korean"
      : cuisine.some((c) => /chinese|japanese|thai|asian|vietnamese/.test(c))
        ? "asian"
        : "local";
  const category: KoreanCategory[] = [];
  if (cuisine.some((c) => /soup|ramen|korean/.test(c)))
    category.push("국물 요리");
  if (cuisine.some((c) => /italian|pasta|noodle|ramen/.test(c)))
    category.push("면 요리");
  if (cuisine.some((c) => /pizza|bakery/.test(c))) category.push("빵·피자");
  if (cuisine.some((c) => /seafood|fish/.test(c))) category.push("해산물");
  if (cuisine.some((c) => /steak|barbecue|grill/.test(c)))
    category.push("고기 구이");
  return {
    id: `osm:${element.type}/${element.id}`,
    name: tags.name,
    location: { lat, lng },
    address:
      tags["addr:full"] ||
      [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]]
        .filter(Boolean)
        .join(", ") ||
      undefined,
    cuisine,
    kind,
    category,
    openingHours: tags.opening_hours,
  };
}
export async function nearbyRestaurants(
  location: Location,
  radius: number,
  category: KoreanCategory | undefined,
  env: ServiceEnv = {},
  fetcher: typeof fetch = fetch,
) {
  point.parse(location);
  const distance = Math.min(5000, Math.max(100, Math.round(radius)));
  const key = `osm:near:${location.lat.toFixed(4)}:${location.lng.toFixed(4)}:${distance}`;
  const store = new ServiceStore(env);
  let result = await store.get<Restaurant[]>(key);
  if (!result) {
    const query = `[out:json][timeout:20];(nwr(around:${distance},${location.lat},${location.lng})[amenity~"^(restaurant|cafe|fast_food|food_court)$"];nwr(around:${distance},${location.lat},${location.lng})[shop~"^(supermarket|convenience|deli)$"][cuisine];);out center tags 100;`;
    try {
      if (await store.get("osm:overpass:cooldown"))
        throw new ServiceError("UPSTREAM", "식당 검색 서버가 붐비고 있어요.");
      const url = new URL("https://overpass-api.de/api/interpreter");
      url.searchParams.set("data", query);
      const raw = await osm(url.href, env, {}, fetcher);
      const parsed = z.object({ elements: z.array(osmElement) }).parse(raw);
      result = parsed.elements.flatMap((e) => {
        const r = restaurant(e);
        return r ? [r] : [];
      });
    } catch {
      // One bounded user search when Overpass is overloaded; never grid-scan Nominatim.
      await store.put("osm:overpass:cooldown", true, 30000);
      result = await searchOSM("restaurant", location, distance, env, fetcher);
    }
    result = result
      .filter((r) => distanceMeters(location, r.location) <= distance)
      .sort(
        (a, b) =>
          distanceMeters(location, a.location) -
          distanceMeters(location, b.location),
      );
    await store.put(key, result, 3600000);
  }
  return category
    ? result.filter((r) => r.category.includes(category))
    : result;
}
async function searchOSM(
  name: string,
  location: Location,
  radius: number | undefined,
  env: ServiceEnv = {},
  fetcher: typeof fetch = fetch,
) {
  point.parse(location);
  const query = name.trim().slice(0, 160);
  if (!query) return [];
  const key = `osm:name:${query}:${location.lat.toFixed(3)}:${location.lng.toFixed(3)}:${radius ?? ""}`;
  const store = new ServiceStore(env);
  const saved = await store.get<Restaurant[]>(key);
  if (saved) return saved;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "8",
    addressdetails: "1",
    extratags: "1",
    viewbox: `${location.lng - (radius ? radius / 111000 / Math.cos((location.lat * Math.PI) / 180) : 0.2)},${location.lat + (radius ? radius / 111000 : 0.2)},${location.lng + (radius ? radius / 111000 / Math.cos((location.lat * Math.PI) / 180) : 0.2)},${location.lat - (radius ? radius / 111000 : 0.2)}`,
    ...(radius ? { bounded: "1" } : {}),
  }).toString();
  const raw = await osm(url.href, env, {}, fetcher);
  const rows = z
    .array(
      z.object({
        osm_type: z.enum(["node", "way", "relation"]),
        osm_id: z.number(),
        name: z.string().optional(),
        display_name: z.string(),
        lat: z.string(),
        lon: z.string(),
        extratags: z.record(z.string()).nullish(),
      }),
    )
    .parse(raw);
  const results = rows.flatMap((row) => {
    const r = restaurant({
      type: row.osm_type,
      id: row.osm_id,
      lat: Number(row.lat),
      lon: Number(row.lon),
      tags: {
        name: row.name || row.display_name.split(",")[0],
        ...row.extratags,
      },
    });
    return r && point.safeParse(r.location).success
      ? [{ ...r, address: row.display_name }]
      : [];
  });
  await store.put(key, results, 86400000);
  return results;
}
export async function findRestaurantOnMenu(
  name: string,
  location: Location,
  env: ServiceEnv = {},
  fetcher: typeof fetch = fetch,
) {
  return name.trim()
    ? searchOSM(name, location, undefined, env, fetcher)
    : nearbyRestaurants(location, 800, undefined, env, fetcher);
}

function plain(value: unknown) {
  return typeof value === "string"
    ? value
        .replace(/<[^>]*>/g, "")
        .replace(
          /&(?:amp|quot|lt|gt);/g,
          (m) =>
            ({ "&amp;": "&", "&quot;": '"', "&lt;": "<", "&gt;": ">" })[m] ?? m,
        )
        .trim()
    : "";
}
function https(value: unknown) {
  return typeof value === "string" && /^https:\/\//.test(value)
    ? value
    : undefined;
}
async function commons(
  title: string | undefined,
  query: string,
  env: ServiceEnv,
  fetcher: typeof fetch,
) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "960",
    ...(title
      ? { titles: "File:" + title }
      : {
          generator: "search",
          gsrsearch: `${query} filetype:bitmap`,
          gsrnamespace: "6",
          gsrlimit: "3",
        }),
  }).toString();
  const raw = (await externalJSON(
    url.href,
    { headers: { "User-Agent": agent(env) } },
    fetcher,
  )) as {
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: {
            url?: string;
            thumburl?: string;
            descriptionurl?: string;
            extmetadata?: Record<string, { value?: string }>;
          }[];
        }
      >;
    };
  };
  for (const page of Object.values(raw.query?.pages ?? {})) {
    const info = page.imageinfo?.[0],
      meta = info?.extmetadata;
    const image = https(info?.thumburl ?? info?.url),
      pageUrl = https(info?.descriptionurl),
      license = plain(meta?.LicenseShortName?.value),
      credit = plain(meta?.Artist?.value) || plain(meta?.Credit?.value);
    if (
      image &&
      pageUrl &&
      license &&
      credit &&
      /CC|public domain|PD|GFDL/i.test(license)
    )
      return {
        url: image,
        source: "wikimedia" as const,
        credit,
        license,
        pageUrl,
        isReference: true as const,
      };
  }
}
export async function menuImage(
  original: string,
  korean: string,
  env: ServiceEnv = {},
  fetcher: typeof fetch = fetch,
): Promise<MenuImage | undefined> {
  const store = new ServiceStore(env),
    key = "image:" + original.toLowerCase().trim();
  const saved = await store.get<MenuImage | null>(key);
  if (saved !== undefined) return saved ?? undefined;
  let image: MenuImage | undefined;
  try {
    const search = new URL("https://www.wikidata.org/w/api.php");
    search.search = new URLSearchParams({
      action: "wbsearchentities",
      search: original.slice(0, 160),
      language: "it",
      format: "json",
      limit: "3",
    }).toString();
    const data = (await externalJSON(
      search.href,
      { headers: { "User-Agent": agent(env) } },
      fetcher,
    )) as { search?: { id?: string }[] };
    const id = data.search?.find((e) => /^Q\d+$/.test(e.id ?? ""))?.id;
    if (id) {
      const entities = (await externalJSON(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=claims&format=json`,
        { headers: { "User-Agent": agent(env) } },
        fetcher,
      )) as {
        entities?: Record<
          string,
          {
            claims?: {
              P18?: { mainsnak?: { datavalue?: { value?: string } } }[];
            };
          }
        >;
      };
      const title =
        entities.entities?.[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (title) image = await commons(title, original, env, fetcher);
    }
    if (!image) image = await commons(undefined, original, env, fetcher);
  } catch {
    /* No unlicensed fallback image. */
  }
  if (!image && env.PEXELS_API_KEY) {
    try {
      const result = (await externalJSON(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(original || korean)}&per_page=1`,
        { headers: { Authorization: env.PEXELS_API_KEY } },
        fetcher,
      )) as {
        photos?: {
          src?: { large?: string };
          url?: string;
          photographer?: string;
        }[];
      };
      const photo = result.photos?.[0];
      if (https(photo?.src?.large) && https(photo?.url) && photo?.photographer)
        image = {
          url: photo.src!.large!,
          source: "pexels",
          credit: photo.photographer,
          license: "Pexels License",
          pageUrl: photo.url!,
          isReference: true,
        };
    } catch {
      /* Keep placeholder. */
    }
  }
  await store.put(key, image ?? null, 7 * 86400000);
  return image;
}
export async function exchangeRate(
  base: string,
  quote: string,
  env: ServiceEnv = {},
  fetcher: typeof fetch = fetch,
): Promise<ExchangeRate> {
  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote))
    throw Error("Invalid currency");
  const store = new ServiceStore(env),
    day = new Date().toISOString().slice(0, 10),
    key = `fx:ecb:${base}:${quote}:${day}`;
  const saved = await store.get<ExchangeRate>(key);
  if (saved) return saved;
  if (base === quote) return { base, quote, rate: 1, date: day };
  const result = z
    .object({
      rate: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .parse(
      await externalJSON(
        `https://api.frankfurter.dev/v2/providers/ecb/rate/${base.toLowerCase()}/${quote.toLowerCase()}`,
        {},
        fetcher,
      ),
    );
  const value = { base, quote, ...result };
  await store.put(key, value, 86400000);
  return value;
}
export async function searchDestinations(
  query: string,
  env: ServiceEnv & { ASSETS?: { fetch(request: Request): Promise<Response> } },
  origin: string,
): Promise<Trip[]> {
  if (!env.ASSETS || !query.trim()) return [];
  const result = await citySearch({ ASSETS: env.ASSETS }, origin)(
    query.trim().slice(0, 100),
    null,
  );
  return result.cities
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .slice(0, 30)
    .map((r) => ({
      id: r.id,
      country: r.country ?? "",
      city: r.city,
      detail: [r.english, r.region].filter(Boolean).join(" · "),
      timezone: tzlookup(r.latitude, r.longitude),
      location: { lat: r.latitude, lng: r.longitude },
    }));
}
