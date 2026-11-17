import { randomUUID } from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Companion } from '../features/companions/invite';
import { initialProgress, parseProgress, withCompanions, type Progress } from './model';
const KEY = 'meide.first-run.v1';
const Context = createContext<{
  progress: Progress; ready: boolean; error: string | null; busy: boolean;
  syncCompanions: (people: Companion[]) => Promise<boolean>;
  save: (value: Progress) => Promise<boolean>; retry: () => void;
} | null>(null);
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(initialProgress);
  const current = useRef(progress);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(async raw => {
      const loaded = { ...parseProgress(raw) };
      if (!loaded.profileId || !loaded.profileToken) { loaded.profileId ??= randomUUID(); loaded.profileToken ??= randomUUID(); await AsyncStorage.setItem(KEY, JSON.stringify(loaded)); }
      if (active) { current.current = loaded; setProgress(loaded); setReady(true); setError(null); }
    }).catch(() => { if (active) setError('저장된 정보를 읽지 못했어요. 다시 시도해 주세요.'); });
    return () => { active = false; };
  }, [attempt]);
  const save = useCallback(async (value: Progress) => {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError(null);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(value)); current.current = value; setProgress(value); return true; }
    catch { setError('저장하지 못했어요. 다시 눌러 주세요.'); return false; }
    finally { lock.current = false; setBusy(false); }
  }, []);
  const syncCompanions = useCallback(async (people: Companion[]) => {
    if (JSON.stringify(current.current.companions ?? []) === JSON.stringify(people)) return true;
    return save(withCompanions(current.current, people));
  }, [save]);
  return <Context.Provider value={{ progress, ready, error, busy, save, syncCompanions, retry: () => setAttempt(v => v + 1) }}>{children}</Context.Provider>;
}
export function useProgress() {
  const value = useContext(Context);
  if (!value) throw new Error('ProgressProvider is required');
  return value;
}
