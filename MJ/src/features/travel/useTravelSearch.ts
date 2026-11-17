import { useEffect, useRef, useState } from 'react';
import { fetchTravelDestinations, type TravelResults } from './api';
import { recommendedDestinations } from './catalog';

const recommendations: TravelResults = {places: recommendedDestinations, nextOffset: null};
export function useTravelSearch(query: string) {
  const key = query.trim();
  const [state, setState] = useState({key: '', result: recommendations, loading: false, error: ''});
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const cache = useRef(new Map<string, TravelResults>());

  useEffect(() => {
    const version = ++generation.current;
    pending.current?.abort();
    if (!key) return;
    const controller = new AbortController();
    pending.current = controller;
    const cached = cache.current.get(key);
    if (cached) { setState({key, result: cached, loading: false, error: ''}); return; }
    setState({key, result: {places: [], nextOffset: null}, loading: true, error: ''});
    const timer = setTimeout(() => {
      void fetchTravelDestinations(key, 0, controller.signal).then(result => {
        if (controller.signal.aborted || version !== generation.current) return;
        cache.current.set(key, result);
        if (cache.current.size > 30) cache.current.delete(cache.current.keys().next().value!);
        setState({key, result, loading: false, error: ''});
      }).catch(error => {
        if (!controller.signal.aborted && version === generation.current) setState({key, result: {places: [], nextOffset: null}, loading: false, error: error instanceof Error ? error.message : '검색하지 못했어요.'});
      });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, attempt]);

  async function loadMore() {
    if (state.key !== key || state.loading || state.result.nextOffset === null || pending.current?.signal.aborted) return;
    const controller = new AbortController();
    pending.current?.abort();
    pending.current = controller;
    const version = generation.current;
    setState(previous => ({...previous, loading: true, error: ''}));
    try {
      const page = await fetchTravelDestinations(key, state.result.nextOffset, controller.signal);
      if (controller.signal.aborted || version !== generation.current) return;
      const ids = new Set(state.result.places.map(place => place.id));
      const result = {places: [...state.result.places, ...page.places.filter(place => !ids.has(place.id))], nextOffset: page.nextOffset};
      setState({key, result, loading: false, error: ''});
    } catch (error) {
      if (!controller.signal.aborted && version === generation.current) setState(previous => ({...previous, loading: false, error: error instanceof Error ? error.message : '검색하지 못했어요.'}));
    }
  }
  useEffect(() => () => { generation.current++; pending.current?.abort(); }, []);
  if (!key) return {...recommendations, loading: false, error: '', retry: () => {}, loadMore};
  const visible = state.key === key ? state : {result: {places: [], nextOffset: null}, loading: true, error: ''};
  return {...visible.result, loading: visible.loading, error: visible.error, retry: () => { cache.current.delete(key); setAttempt(value => value + 1); }, loadMore};
}
