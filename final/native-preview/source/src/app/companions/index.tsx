import inlineSvg from '../../assets/inline-svg.json';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { BottomNavigation } from '../../components/BottomNavigation';
import { ErrorText } from '../../components/ui';
import { CompanionLists } from '../../features/companions/CompanionLists';
import { companionPreview } from '../../features/companions/preview';
import { CompanionPhotoEditor } from '../../features/companions/CompanionPhotoEditor';
import { useAvatarPhotos } from '../../features/companions/avatarPhotos';
import { issueInvite, loadCompanions } from '../../features/companions/api';
import { useProgress } from '../../state/ProgressProvider';
import { destination, toggleTravelCompanion, travelCompanions } from '../../state/model';

// Verified identical to the provided companion-page SVGs, including root sizes.
const icons = {
  status: inlineSvg["assets/travel/status.svg"],
  back: inlineSvg["assets/travel/back.svg"],
};

export default function CompanionsPage() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const previewing = preview === 'connected';
  const [previewIds, setPreviewIds] = useState(['preview-miyoung']);
  const { progress, save, syncCompanions, busy, error } = useProgress();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { stage, profileId, profileToken, name, pendingInvite } = progress;
  const avatars = useAvatarPhotos(profileId, previewing);
  const [photoId, setPhotoId] = useState<string | null>(null);
  useFocusEffect(useCallback(() => () => setPhotoId(null), []));
  const friends = (previewing ? companionPreview : progress.companions ?? []).map(person => ({ ...person, ...(avatars.photos[person.id] ? { photo: { uri: avatars.photos[person.id] } } : {}) }));
  const selectedIds = previewing ? previewIds : travelCompanions(progress).map(person => person.id);
  const photoPerson = friends.find(person => person.id === photoId);
  useFocusEffect(useCallback(() => {
    if (previewing || stage !== 'home' || pendingInvite || !profileId || !profileToken) return;
    if (attempt > 0) setLoading(true);
    let active = true;
    let working = false;
    let registered = false;
    async function refresh() {
      if (!active || working || AppState.currentState !== 'active') return;
      working = true;
      try {
        if (!registered) { await issueInvite(profileId!, profileToken!, name); registered = true; }
        if (!active) return;
        const people = await loadCompanions(profileId!, profileToken!);
        if (active) { await syncCompanions(people); setMessage(null); }
      } catch (e) { if (active) setMessage((e as Error).message); }
      finally { working = false; if (active) setLoading(false); }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [previewing, stage, profileId, profileToken, name, pendingInvite, syncCompanions, attempt]));

  if (stage !== 'home') return <Redirect href={destination(progress)} />;
  if (pendingInvite) return <Redirect href={{ pathname: '/invite/[code]', params: { code: pendingInvite } }} />;

  return <><SafeAreaView style={s.safe} aria-hidden={Boolean(photoPerson)} accessibilityElementsHidden={Boolean(photoPerson)} importantForAccessibility={photoPerson ? 'no-hide-descendants' : 'auto'}><View style={s.page}>
    {Platform.OS === 'web' && <View style={s.status} aria-hidden><Text style={s.time}>9:41</Text><View style={s.statusIcons}><SvgUri uri={icons.status} /></View></View>}
    <View style={s.content}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="홈으로 돌아가기" onPress={() => router.navigate('/home')} hitSlop={6} style={s.back}><SvgUri uri={icons.back} /></Pressable>
        <Text accessibilityRole="header" style={s.headerTitle}>동반인</Text><View style={s.headerBalance} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <CompanionLists friends={friends} selected={friends.filter(person => selectedIds.includes(person.id))} busy={!previewing && busy} loading={!previewing && loading}
          onPhoto={setPhotoId}
          onToggle={id => {
            if (previewing) setPreviewIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
            else void save(toggleTravelCompanion(progress, id));
          }}
          onInvite={() => router.push({ pathname: '/setup/companions', params: { from: 'companions' } })} />
        {!previewing && <ErrorText message={error || message} />}
        <ErrorText message={avatars.error} />
        {!previewing && message && <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={s.retry}><Text style={s.retryText}>다시 시도</Text></Pressable>}
      </ScrollView>
      <BottomNavigation active="companions" />
    </View>
    {Platform.OS === 'web' && <View style={s.systemBottom} aria-hidden><View style={s.homeIndicator} /></View>}
  </View></SafeAreaView>
  {photoPerson && <CompanionPhotoEditor key={photoPerson.id} person={photoPerson} ready={avatars.ready} onClose={() => setPhotoId(null)} onSave={avatars.savePhoto} />}
  </>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F6' },
  page: { flex: 1, width: '100%', maxWidth: 412, alignSelf: 'center' },
  content: { flex: 1 },
  status: { height: 54 },
  time: { position: 'absolute', left: 36, top: 20.5, fontFamily: 'NotoSansKRBold', fontSize: 16, lineHeight: 22.4, color: '#212121' },
  statusIcons: { position: 'absolute', right: 28, top: 23.5 },
  header: { height: 51.5, paddingHorizontal: 15.918, flexDirection: 'row', alignItems: 'center' },
  back: { width: 33.709, height: 33.709, borderRadius: 16.855, backgroundColor: 'rgba(255,255,255,0.74)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 23.8, textAlign: 'center', color: '#212121' },
  headerBalance: { width: 33.709 },
  scroll: { paddingHorizontal: 24, paddingTop: 39.5, paddingBottom: 104 },
  retry: { padding: 16, alignItems: 'center' },
  retryText: { color: '#176B38', fontFamily: 'PretendardBold', fontSize: 14 },
  systemBottom: { height: 23 },
  homeIndicator: { position: 'absolute', bottom: 12, width: 134, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: '#212121' },
});
