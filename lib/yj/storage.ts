import type { MenuBoard, MenuPhoto } from "./model";
const DATABASE = "meide-yj-capture";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      for (const name of ["drafts", "photos"])
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function read<T>(store: string, key: string): Promise<T | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(store).objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
async function write(store: string, key: string, value: unknown) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export const saveBoard = (board: MenuBoard) => write("drafts", "board", board);
export const savePhoto = (key: string, dataUrl: string) =>
  write("photos", key, dataUrl);
export const readPhoto = (key: string) => read<string>("photos", key);
export async function readBoard(): Promise<MenuBoard | undefined> {
  const current = await read<MenuBoard>("drafts", "board");
  if (current) return current;
  const old = await read<{
    photos: { id: string; src?: string; readable: boolean }[];
  }>("drafts", "capture");
  if (!old?.photos?.length) return;
  const photos: MenuPhoto[] = [];
  for (const p of old.photos.filter((p) => p.src)) {
    const localKey = "photo:" + p.id;
    if (p.src) await savePhoto(localKey, p.src);
    photos.push({
      id: p.id,
      localKey,
      readable: p.readable ? "ok" : "blurry",
      itemIds: [],
    });
  }
  if (!photos.length) return;
  return {
    id: "migrated-capture",
    createdAt: new Date().toISOString(),
    status: "analyzing",
    photos,
    language: "it",
    currency: "EUR",
    sections: [],
    items: [],
  };
}
export async function photoSources(photos: MenuPhoto[]) {
  const entries = await Promise.all(
    photos.map(async (p) => [p.localKey, await readPhoto(p.localKey)] as const),
  );
  return Object.fromEntries(
    entries.filter((e): e is readonly [string, string] => Boolean(e[1])),
  );
}
