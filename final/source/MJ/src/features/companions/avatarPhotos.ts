import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

async function preparePhoto(asset: ImagePickerAsset) {
  const side = Math.min(asset.width, asset.height);
  if (!Number.isFinite(side) || side < 1) throw new Error('이 사진을 열 수 없어요. 다른 사진을 선택해 주세요.');
  const context = ImageManipulator.manipulate(asset.uri);
  try {
    context.crop({ originX: Math.floor((asset.width - side) / 2), originY: Math.floor((asset.height - side) / 2), width: side, height: side }).resize({ width: Math.min(512, side) });
    const rendered = await context.renderAsync();
    try {
      const photo = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: Platform.OS === 'web' });
      if (Platform.OS === 'web') {
        if (!photo.base64 || photo.base64.length > 700000) throw new Error('사진이 너무 커요. 다른 사진을 선택해 주세요.');
        return `data:image/jpeg;base64,${photo.base64}`;
      }
      const { Directory, File, Paths } = await import('expo-file-system');
      const directory = new Directory(Paths.document, 'companion-photos');
      directory.create({ intermediates: true, idempotent: true });
      const stored = new File(directory, `${randomUUID()}.jpg`);
      await new File(photo.uri).copy(stored);
      return stored.uri;
    } finally { rendered.release(); }
  } finally { context.release(); }
}

async function discardPhoto(uri?: string) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const { File, Paths } = await import('expo-file-system');
    if (uri.startsWith(`${Paths.document.uri}companion-photos/`)) {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
  } catch { /* Old app-owned files can be cleaned up later; never fail a saved edit. */ }
}

export function useAvatarPhotos(profileId: string | undefined, preview: boolean) {
  const key = `meide.companion-photos.v1:${preview ? 'preview' : profileId ?? 'unknown'}`;
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const current = useRef<Record<string, string>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const ready = loadedKey === key;
  const scope = useRef(key);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    scope.current = key;
    AsyncStorage.getItem(key).then(raw => {
      const value = raw ? JSON.parse(raw) : {};
      if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
      const clean = Object.fromEntries(Object.entries(value).filter(([id, uri]) => /^[a-zA-Z0-9-]{1,64}$/.test(id) && typeof uri === 'string' && /^(data:image\/jpeg;base64,|file:\/\/)/.test(uri))) as Record<string, string>;
      if (active) { current.current = clean; setPhotos(clean); setLoadedKey(key); setError(null); }
    }).catch(() => { if (active) setError('저장된 사진을 불러오지 못했어요. 화면을 다시 열어 주세요.'); });
    return () => { active = false; };
  }, [key]);
  const savePhoto = useCallback(async (id: string, asset: ImagePickerAsset) => {
    if (!ready || saving.current) throw new Error('잠시 후 다시 시도해 주세요.');
    saving.current = true;
    let uri: string | undefined;
    const base = current.current;
    const previous = base[id];
    try {
      uri = await preparePhoto(asset);
      const next = { ...base, [id]: uri };
      await AsyncStorage.setItem(key, JSON.stringify(next));
      if (scope.current === key) { current.current = next; setPhotos(next); setError(null); }
      await discardPhoto(previous);
    } catch (e) { await discardPhoto(uri); throw e; }
    finally { saving.current = false; }
  }, [key, ready]);
  return { photos: ready ? photos : {}, ready, error, savePhoto };
}
