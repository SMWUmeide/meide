import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { onboardingContent } from '../../features/onboarding/content';
import { useProgress } from '../../state/ProgressProvider';
import { advance, destination } from '../../state/model';
import { Button, ErrorText } from '../../components/ui';
export default function Onboarding() {
  const { progress, busy, error, save } = useProgress();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const w = Math.min(width, 480);
  const safeTop = Platform.OS === 'web' ? 54 : insets.top;
  const safeBottom = Platform.OS === 'web' ? 23 : insets.bottom;
  const hero = Math.min(400 * w / 412, Math.max(220, height - safeTop - safeBottom - 440));
  const artworkScale = Math.min(w / 412, hero / 400);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy) return true;
      if (progress.slide === 0) return false;
      void save({ ...progress, slide: progress.slide - 1 }); return true;
    }); return () => sub.remove();
  }, [progress, busy, save]);
  if (progress.stage !== 'intro') return <Redirect href={destination(progress)} />;
  const page = onboardingContent[progress.slide];
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.scroll}>
    <View style={[s.page, { width: w }]}>
      <View style={s.header}><Text style={s.brand}>Meide</Text><Pressable accessibilityRole="button" disabled={busy} hitSlop={10} onPress={() => void save({ ...progress, stage: 'name' })} style={s.skip}><Text style={s.skipText}>건너뛰기</Text></Pressable></View>
      <View style={[s.hero, { height: hero }]}>
        <View style={{ width: 412 * artworkScale, height: 400 * artworkScale }}>
          <Image source={page.image} accessibilityLabel={page.title.replace('\n', ' ')} resizeMode="contain" style={{ position: 'absolute', width: page.artwork.width * artworkScale, height: page.artwork.height * artworkScale, top: page.artwork.top * artworkScale }} />
        </View>
      </View>
      <View style={s.copy}><Text accessibilityRole="header" style={s.title}>{page.title}</Text><Text style={s.description}>{page.description}</Text></View>
      <View accessibilityLabel={`${progress.slide + 1} / 3 페이지`} style={s.dots}>{onboardingContent.map((p, i) => <View key={p.id} style={[s.dot, i === progress.slide && s.active]} />)}</View>
      <View style={s.footer}><ErrorText message={error} /><Button title={progress.slide === 2 ? '시작하기' : '다음'} disabled={busy} onPress={() => void save(advance(progress))} /></View>
    </View>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'web' ? 54 : 0, paddingBottom: Platform.OS === 'web' ? 23 : 0 }, scroll: { flexGrow: 1, alignItems: 'center' }, page: { flexGrow: 1, overflow: 'hidden' },
  header: { marginHorizontal: 24, marginTop: 18, marginBottom: 32, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 },
  brand: { fontFamily: 'PretendardBold', fontSize: 22, lineHeight: 33, color: '#212121', alignSelf: 'flex-start' }, skip: { minHeight: 32, justifyContent: 'center', alignSelf: 'flex-start' }, skipText: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 20, color: '#646873' },
  hero: { alignItems: 'center', justifyContent: 'center' },
  copy: { marginTop: 36, paddingHorizontal: 16, gap: 12 }, title: { fontFamily: 'Pretendard', fontSize: 30, lineHeight: 39, textAlign: 'center', color: '#212121' },
  description: { fontFamily: 'Pretendard', fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#646873' }, dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 32, marginBottom: 38 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CCD6CF' }, active: { width: 20, backgroundColor: '#176B38' }, footer: { paddingHorizontal: 24, paddingBottom: 32, marginTop: 'auto' },
});
