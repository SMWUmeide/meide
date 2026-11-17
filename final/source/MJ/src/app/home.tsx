import { Asset } from 'expo-asset';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, BackHandler, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop, SvgUri } from 'react-native-svg';
import { ErrorText } from '../components/ui';
import { BottomNavigation } from '../components/BottomNavigation';
import { useProgress } from '../state/ProgressProvider';
import { destination } from '../state/model';
import { currentTravelDestination, destinationLabel } from '../features/travel/catalog';

const icons = {
  location: Asset.fromModule(require('../../assets/home/imgIcon.svg')).uri,
  nearby: Asset.fromModule(require('../../assets/home/imgIcon1.svg')).uri,
  arrow: Asset.fromModule(require('../../assets/home/img20.svg')).uri,
  restaurant: Asset.fromModule(require('../../assets/home/img1.svg')).uri,
  circle: Asset.fromModule(require('../../assets/home/imgVector4.svg')).uri,
  scan: Asset.fromModule(require('../../assets/home/img.svg')).uri,
  guide: Asset.fromModule(require('../../assets/home/guide-arrow.svg')).uri,
};
// Figma content for the approved home. Replace with real ranking data in the ranking feature.
const foods = [
  { name: '서양 대파·감자 수프', score: '4.8', image: require('../../assets/home/imgThumb52R20.jpg') },
  { name: '호박·밀알 수프', score: '4.8', image: require('../../assets/home/imgThumb52R21.jpg') },
  { name: '토마토 소스 대구 튀김', score: '4.7', image: require('../../assets/home/imgThumb52R22.jpg') },
  { name: '병아리콩·포르치니 버섯 수프', score: '4.7', image: require('../../assets/home/imgThumb52R23.jpg') },
];
function pendingFeature(label: string) { Alert.alert(label, '아직 준비 중인 기능이에요.'); }
function ScanButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="메뉴판 촬영" disabled={disabled} onPress={onPress} style={h.scan}>
    <SvgUri uri={icons.circle} /><View pointerEvents="none" style={h.scanIcon}><SvgUri uri={icons.scan} /></View>
  </Pressable>;
}
export default function Home() {
  const { progress, save, busy, error } = useProgress();
  const guide = !progress.homeGuideSeen;
  const travel = progress.travelDestinationEnabled === false ? null : currentTravelDestination(progress);
  const dismiss = useCallback(() => { void save({ ...progress, homeGuideSeen: true }); }, [progress, save]);
  useFocusEffect(useCallback(() => {
    if (!guide) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { dismiss(); return true; });
    return () => subscription.remove();
  }, [guide, dismiss]));
  if (progress.stage !== 'home') return <Redirect href={destination(progress)} />;
  if (progress.pendingInvite) return <Redirect href={{ pathname: '/invite/[code]', params: { code: progress.pendingInvite } }} />;
  if (progress.pendingOrderInvite) return <Redirect href={{ pathname: '/join/[token]', params: { token: progress.pendingOrderInvite } }} />;
  return <SafeAreaView style={h.safe}><View style={h.page}>
    <View style={h.content} pointerEvents={guide ? 'none' : 'auto'} aria-hidden={guide} accessibilityElementsHidden={guide} importantForAccessibility={guide ? 'no-hide-descendants' : 'auto'}>
      <ScrollView contentContainerStyle={h.scroll}>
        <Pressable accessibilityRole="button" accessibilityLabel="여행지 설정" onPress={() => router.push('/travel')} style={h.location}><SvgUri uri={icons.location} /><Text style={h.locationText}>{travel ? destinationLabel(travel) : '여행지 설정'}</Text></Pressable>
        <Text accessibilityRole="header" style={h.title}>{travel ? `${travel.city || travel.country}에서\n뭘 먹을까요?` : '어디에서\n뭘 먹을까요?'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="내 주변 식당 찾기" onPress={() => router.push('/restaurants')} style={h.banner}>
          <Image source={require('../../assets/home/map.png')} style={h.map} />
          <View pointerEvents="none" style={[h.mapFade, Platform.OS === 'web' && { backgroundImage: 'linear-gradient(90deg, white 0%, white 9%, rgba(255,255,255,0.18) 43%, rgba(255,255,255,0) 100%)' }]}>{Platform.OS !== 'web' && <Svg width={203.964} height={91}><Defs><LinearGradient id="homeMapFade" x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0%" stopColor="white" /><Stop offset="9%" stopColor="white" /><Stop offset="43%" stopColor="white" stopOpacity={0.18} /><Stop offset="100%" stopColor="white" stopOpacity={0} /></LinearGradient></Defs><Rect width={203.964} height={91} fill="url(#homeMapFade)" /></Svg>}</View>
          <View style={h.bannerLabel}><SvgUri uri={icons.nearby} /><Text style={h.foodName}>내 주변 식당 찾기</Text><SvgUri uri={icons.arrow} /></View>
          <View style={h.marker}><SvgUri uri={icons.restaurant} /></View>
        </Pressable>
        <View style={h.ranking}>
          <View style={h.rankingHeader}><Text accessibilityRole="header" style={h.heading}>키우시 한국인 음식 랭킹</Text><Pressable accessibilityRole="button" onPress={() => pendingFeature('전체 보기')} style={h.more}><Text style={h.caption}>{'전체 보기 >'}</Text></Pressable></View>
          <View style={h.foods}>{foods.map((food, i) => <Pressable key={food.name} accessibilityRole="button" onPress={() => pendingFeature(food.name)} style={h.food}>
            <Image source={food.image} style={h.thumb} /><Text style={h.rank}>{i + 1}</Text><Text style={[h.foodName, h.name]}>{food.name}</Text><Text style={h.score}><Text style={h.star}>★</Text> {food.score}</Text>
          </Pressable>)}</View>
        </View>
      </ScrollView>
      <BottomNavigation active="home" />
      <ScanButton onPress={() => router.push('/menu/camera')} />
    </View>
    {guide && <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Pressable accessibilityRole="button" accessibilityLabel="촬영 안내 닫기" disabled={busy} onPress={dismiss} style={h.dim} />
      <View pointerEvents="none" style={h.guideCopy}><Text style={h.guideText}>{'메뉴판을 찍으면\n해석하고 주문까지\n할 수 있어요!'}</Text></View>
      <View pointerEvents="none" style={h.guideArrow}><SvgUri uri={icons.guide} /></View>
      <ScanButton onPress={dismiss} disabled={busy} />
      {error && <View style={h.error}><ErrorText message={error} /></View>}
    </View>}
  </View></SafeAreaView>;
}
const h = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F6', paddingTop: Platform.OS === 'web' ? 54 : 0, paddingBottom: Platform.OS === 'web' ? 23 : 0 },
  page: { flex: 1, width: '100%', maxWidth: 412, alignSelf: 'center' }, content: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 180 },
  location: { height: 48, paddingHorizontal: 16, backgroundColor: '#FFF', borderRadius: 24, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 19, color: '#212121' },
  title: { fontFamily: 'PretendardMedium', fontSize: 30, lineHeight: 39, letterSpacing: -0.9, color: '#212121', marginTop: 24, marginBottom: 26 },
  banner: { height: 91, borderRadius: 32, overflow: 'hidden', backgroundColor: '#FFF' }, map: { position: 'absolute', right: 0, top: 0, width: 203.964, height: 91 },
  mapFade: { position: 'absolute', right: 0, top: 0, width: 203.964, height: 91, zIndex: 1 },
  bannerLabel: { zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 12, height: 91, paddingHorizontal: 24 },
  marker: { zIndex: 2, position: 'absolute', right: 84, top: 51, width: 38, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#D8E8DC', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 2px 5px rgba(23,64,36,0.12)' },
  ranking: { marginTop: 24, padding: 24, borderRadius: 32, backgroundColor: '#FFF', gap: 24 },
  rankingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, gap: 8 },
  heading: { flexShrink: 1, fontFamily: 'PretendardMedium', fontSize: 22, lineHeight: 29, letterSpacing: -0.44, color: '#212121' }, more: { minHeight: 32, justifyContent: 'center' }, caption: { fontFamily: 'Pretendard', fontSize: 13, color: '#646873' },
  foods: { gap: 16 }, food: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }, thumb: { width: 48, height: 48, borderRadius: 8 },
  rank: { fontFamily: 'PretendardMedium', fontSize: 14, color: '#176B38' }, foodName: { fontFamily: 'PretendardMedium', fontSize: 16, lineHeight: 23, letterSpacing: -0.16, color: '#212121' }, name: { flex: 1 }, score: { fontFamily: 'PretendardMedium', fontSize: 14, color: '#212121' }, star: { color: '#9A6B00' },
  scan: { position: 'absolute', right: 20, bottom: 78, width: 76, height: 76, alignItems: 'center', justifyContent: 'center' }, scanIcon: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  dim: { position: 'absolute', left: 0, right: 0, top: -60, bottom: -40, backgroundColor: 'rgba(5,9,6,0.68)' },
  guideCopy: { position: 'absolute', left: 32, right: 110, bottom: 105 }, guideText: { fontFamily: 'NotoSansKRBold', fontSize: 22, lineHeight: 33, color: '#FFF' },
  guideArrow: { position: 'absolute', right: 100, bottom: 106 }, error: { position: 'absolute', left: 24, right: 24, top: 24, backgroundColor: '#FFF', borderRadius: 12 },
});
