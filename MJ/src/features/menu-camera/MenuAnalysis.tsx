import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useProgress } from '../../state/ProgressProvider';
import { useMenuPhotos, type MenuPhoto } from './MenuPhotosProvider';
import { getMenuTestStatus, readMenu, searchRestaurants, translateMenu, type MenuTestStatus } from './menu-api';
export function MenuAnalysis({ photo, onRestaurantFound, autoTranslate = false }: { photo: MenuPhoto; onRestaurantFound?: () => void; autoTranslate?: boolean }) {
  const { progress, reviewCode } = useProgress();
  const { menus, setMenu } = useMenuPhotos();
  const menu = menus[photo.id];
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<MenuTestStatus | null>(null);
  const [editedText, setEditedText] = useState<string | null>(null);
  const lock = useRef(false), alive = useRef(true);
  const { profileId, profileToken, name } = progress;
  useEffect(() => {
    alive.current = true;
    let active = true;
    void getMenuTestStatus({ profileId, profileToken, name, reviewCode })
      .then(value => { if (active) setStatus(value); })
      .catch(e => { if (active) setStatus({ ready: false, message: e instanceof Error ? e.message : '연결을 확인해 주세요.' }); });
    return () => { active = false; alive.current = false; };
  }, [profileId, profileToken, name, reviewCode]);
  async function run() {
    if (lock.current || (!menu && (!consented || !status?.ready))) return;
    lock.current = true; setBusy(true); setError('');
    const profile = { profileId, profileToken, name, reviewCode };
    try {
      let current = menu;
      let original = current?.originalText;
      if (original === undefined) {
        const raw = photo.base64 ?? (photo.uri.startsWith('data:image/') ? photo.uri : '');
        const base64 = raw.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
        if (!base64) throw new Error('사진을 다시 촬영하거나 선택해 주세요.');
        setStep('메뉴판 글자를 읽고 있어요');
        const read = await readMenu(base64, photo.id, profile);
        original = read.text;
        current = { originalText: original, restaurantName: read.restaurantName, restaurantQuery: read.restaurantQuery };
        setMenu(photo.id, current);
      }
      if (!original.trim()) throw new Error('읽을 수 있는 글자가 없어요. 메뉴판을 가까이 찍어 주세요.');
      if (current?.restaurantQuery && !current.searchAttempted) {
        setStep('식당 정보를 찾고 있어요');
        setMenu(photo.id, { searchAttempted: true });
        try {
          const restaurantSearch = await searchRestaurants(current.restaurantQuery, photo.id, profile);
          current = { ...current, searchAttempted: true, restaurantSearch };
          setMenu(photo.id, { restaurantSearch, restaurantNotice: restaurantSearch.places.length ? undefined : '식당을 찾지 못해 메뉴판의 글자를 번역했어요.' });
        } catch {
          setMenu(photo.id, { restaurantNotice: '식당 정보를 불러오지 못해 메뉴판의 글자를 번역했어요.' });
        }
      }
      if (current?.restaurantSearch?.places.length && !current.restaurantDecision && onRestaurantFound) {
        if (alive.current) onRestaurantFound();
        return;
      }
      setStep('한국어로 번역하고 있어요');
      const translatedText = await translateMenu(editedText ?? original, photo.id, profile);
      setMenu(photo.id, { originalText: original, translatedText });
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '번역을 완료하지 못했어요.'); }
    finally { lock.current = false; if (alive.current) { setBusy(false); setStep(''); } }
  }
  const runLatest = useRef(run);
  useEffect(() => { runLatest.current = run; });
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoTranslate && menu && menu.translatedText === undefined && !autoStarted.current) {
      autoStarted.current = true;
      void runLatest.current();
    }
  }, [autoTranslate, menu]);
  const tooLong = !!menu && Array.from(editedText ?? menu.originalText).length > 5000;
  const disabled = busy || (!menu && (!consented || !status?.ready)) || tooLong || (!!menu && !(editedText ?? menu.originalText).trim());
  return <View style={s.panel}>
    {!menu && <>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consented }} disabled={busy} onPress={() => setConsented(value => !value)} style={s.consent}>
        <Text style={s.body}>{consented ? '☑' : '☐'} 사진과 인식한 글자를 Google에 보내 번역하는 데 동의해요.</Text>
      </Pressable>
      {!status ? <ActivityIndicator color="#176B38" /> : !status.ready ? <Text style={s.note}>{status.message}</Text> : <Text style={s.note}>오늘 {status.remaining}회 이용할 수 있어요.</Text>}
    </>}
    {!!menu?.restaurantNotice && <Text style={s.note}>{menu.restaurantNotice}</Text>}
    {menu && <>
      <Text style={s.title}>{menu.menuSource === 'website' ? '웹사이트 메뉴' : '인식한 원문'}</Text>
      {menu.translatedText !== undefined ? <Text selectable style={s.body}>{menu.originalText}</Text> : <TextInput accessibilityLabel="번역할 원문" multiline value={editedText ?? menu.originalText} onChangeText={setEditedText} editable={!busy} style={[s.body, s.input]} />}
      {tooLong && <Text style={s.note}>번역할 부분을 5,000자 이내로 줄여 주세요.</Text>}
      {menu.translatedText !== undefined && <><Text style={s.title}>한국어 번역</Text><Text selectable style={s.body}>{menu.translatedText}</Text><Text style={s.note}>Google 번역 · 음식 설명과 알레르기 판정은 포함하지 않아요.</Text></>}
    </>}
    {menu?.translatedText === undefined && <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => void run()} style={[s.button, disabled && s.disabled]}>
      {busy ? <><ActivityIndicator color="white" /><Text accessibilityLiveRegion="polite" style={s.buttonText}>{step}</Text></> : <Text style={s.buttonText}>{menu?.restaurantSearch?.places.length && !menu.restaurantDecision ? '식당 정보 확인하기' : menu ? '한국어로 번역하기' : '메뉴판 번역하기'}</Text>}
    </Pressable>}
    {!!error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 12 },
  consent: { minHeight: 44, justifyContent: 'center' },
  body: { fontFamily: 'Pretendard', fontSize: 15, lineHeight: 23, color: '#252525' },
  title: { fontFamily: 'PretendardBold', fontSize: 18, color: '#176B38' },
  input: { minHeight: 100, borderWidth: 1, borderColor: '#D6DDD7', borderRadius: 8, padding: 12, textAlignVertical: 'top' },
  button: { backgroundColor: '#176B38', borderRadius: 24, padding: 14, gap: 8, alignItems: 'center', minHeight: 48 },
  buttonText: { fontFamily: 'PretendardBold', fontSize: 16, color: '#FFF' },
  disabled: { opacity: 0.45 },
  error: { fontFamily: 'Pretendard', fontSize: 14, lineHeight: 21, color: '#9D3028' },
  note: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 20, color: '#666' },
});
