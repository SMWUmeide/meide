import inlineSvg from '../../assets/inline-svg.json';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { ErrorText } from '../../components/ui';
import { currentTravelDestination, destinationLabel, type TravelDestination } from '../../features/travel/catalog';
import { useTravelSearch } from '../../features/travel/useTravelSearch';
import { useProgress } from '../../state/ProgressProvider';
import { destination, toggleTravelDestination } from '../../state/model';

const icons = {
  status: inlineSvg["assets/travel/status.svg"],
  back: inlineSvg["assets/travel/back.svg"],
  search: inlineSvg["assets/travel/search.svg"],
  check: inlineSvg["assets/travel/check.svg"],
};

function goHome() {
  Keyboard.dismiss();
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}

function DestinationName({ place }: { place: TravelDestination }) {
  return <>
    <Text style={s.flag} accessible={false}>{place.flag}</Text>
    <View style={s.names}>
      <Text style={s.placeName}>{destinationLabel(place)}</Text>
      <Text style={s.localName} numberOfLines={1}>{place.kind === 'region' ? (place.localName === place.city ? '지역' : `${place.localName} · 지역`) : place.region ? `${place.localName} · ${place.region}` : place.localName}</Text>
    </View>
  </>;
}

function SelectionCheck({ checked }: { checked: boolean }) {
  return <View style={[s.check, !checked && s.unchecked]}><SvgUri uri={icons.check} /></View>;
}

export default function TravelSettings() {
  const { progress, save, busy, error } = useProgress();
  const [query, setQuery] = useState('');
  const current = currentTravelDestination(progress);
  const enabled = progress.travelDestinationEnabled !== false;
  const search = useTravelSearch(query);
  const { places } = search;
  const searching = Boolean(query.trim());

  async function select(place: TravelDestination) {
    await save(toggleTravelDestination(progress, place));
  }

  if (progress.stage !== 'home') return <Redirect href={destination(progress)} />;
  return <SafeAreaView style={s.safe}>
    <View style={s.page}>
      {Platform.OS === 'web' && <View style={s.status} aria-hidden>
        <Text style={s.time}>9:41</Text><View style={s.statusIcons}><SvgUri uri={icons.status} /></View>
      </View>}
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="홈으로 돌아가기" disabled={busy} onPress={goHome} hitSlop={5} style={s.back}><SvgUri uri={icons.back} /></Pressable>
        <Text accessibilityRole="header" style={s.headerTitle}>여행지 설정</Text>
        <View style={s.headerBalance} />
      </View>
      <FlatList data={places} keyExtractor={place => place.id} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" initialNumToRender={12} windowSize={5} extraData={`${current.id}:${enabled}:${busy}`} ListHeaderComponent={<View style={s.listHeader}>
        <View style={s.current}>
          <Text accessibilityRole="header" style={s.sectionTitle}>현재 여행지</Text>
          <Pressable style={({ pressed }) => [s.currentCard, pressed && s.pressed]} accessibilityRole="checkbox" accessibilityLabel={`현재 여행지 ${destinationLabel(current)}`} aria-checked={enabled} aria-disabled={busy} accessibilityState={{ checked: enabled, disabled: busy }} disabled={busy} onPress={() => void select(current)}>
            <DestinationName place={current} />
            <SelectionCheck checked={enabled} />
          </Pressable>
        </View>
        <View style={s.intro}>
          <Text accessibilityRole="header" style={s.title}>어디로 여행 가시나요?</Text>
          <View style={s.search}>
            <SvgUri uri={icons.search} />
            <TextInput accessibilityLabel="국가 또는 도시 검색" placeholder="국가 또는 도시 검색" placeholderTextColor="#91949E" value={query} onChangeText={setQuery} style={s.input} autoCapitalize="none" autoCorrect={false} maxLength={80} returnKeyType="search" selectionColor="#176B38" onSubmitEditing={Keyboard.dismiss} />
          </View>
        </View>
        <Text accessibilityRole="header" style={s.sectionTitle}>{searching ? '검색 결과' : '추천 여행지'}</Text>
        </View>}
        renderItem={({ item: place }) => <Pressable accessibilityRole="checkbox" accessibilityLabel={destinationLabel(place)} aria-checked={enabled && current.id === place.id} aria-disabled={busy} accessibilityState={{ disabled: busy, checked: enabled && current.id === place.id }} disabled={busy} onPress={() => void select(place)} style={({ pressed }) => [s.row, pressed && s.pressed]}>
          <DestinationName place={place} /><SelectionCheck checked={enabled && current.id === place.id} />
        </Pressable>}
        ListEmptyComponent={!search.loading && !search.error ? <Text accessibilityLiveRegion="polite" style={s.empty}>검색 결과가 없어요.</Text> : undefined}
        ListFooterComponent={<View style={s.listFooter}>
          {search.loading && <ActivityIndicator accessibilityLabel="여행지 검색 중" color="#176B38" style={s.loading} />}
          <ErrorText message={search.error || error} />
          {search.error && <Pressable accessibilityRole="button" onPress={search.retry} style={s.more}><Text style={s.moreText}>다시 시도</Text></Pressable>}
          {search.nextOffset !== null && !search.loading && !search.error && <Pressable accessibilityRole="button" onPress={() => void search.loadMore()} style={s.more}><Text style={s.moreText}>더 보기</Text></Pressable>}
          <Pressable accessibilityRole="link" accessibilityLabel="여행지 데이터 출처" onPress={() => router.push('/travel/sources')} style={s.source}><Text style={s.sourceText}>GeoNames · CC BY 4.0</Text></Pressable>
        </View>} />
      {Platform.OS === 'web' && <View style={s.systemBottom} aria-hidden><View style={s.homeIndicator} /></View>}
    </View>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F6' },
  page: { flex: 1, width: '100%', maxWidth: 412, alignSelf: 'center' },
  status: { height: 54 },
  time: { position: 'absolute', left: 36, top: 20.5, fontFamily: 'NotoSansKRBold', fontSize: 16, lineHeight: 22.4, color: '#212121' },
  statusIcons: { position: 'absolute', right: 28, top: 23.5 },
  header: { height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  back: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.74)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 24, textAlign: 'center', color: '#212121' },
  headerBalance: { width: 34 },
  scroll: { paddingHorizontal: 24, paddingTop: 38, paddingBottom: 24 },
  listHeader: { gap: 24, marginBottom: 8 },
  listFooter: { paddingTop: 16 },
  loading: { paddingVertical: 20 },
  more: { padding: 16, alignItems: 'center' },
  moreText: { color: '#176B38', fontFamily: 'PretendardBold', fontSize: 14 },
  source: { alignSelf: 'center', padding: 12, marginTop: 8 },
  sourceText: { fontFamily: 'Pretendard', fontSize: 11, color: '#91949E' },
  intro: { gap: 20 },
  title: { fontFamily: 'PretendardBold', fontSize: 22, lineHeight: 29, color: '#212121' },
  search: { height: 56, borderRadius: 28, backgroundColor: '#FFF', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, minWidth: 0, height: 56, padding: 0, fontFamily: 'Pretendard', fontSize: 15, lineHeight: 22, color: '#212121', ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) },
  current: { gap: 12 },
  sectionTitle: { fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 24, color: '#212121' },
  currentCard: { minHeight: 80, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 32, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', gap: 16 },
  flag: { width: 28, height: 28, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  names: { flex: 1, minWidth: 0, gap: 1 },
  placeName: { fontFamily: 'PretendardBold', fontSize: 16, lineHeight: 24, color: '#212121' },
  localName: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 19, color: '#91949E' },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#176B38', alignItems: 'center', justifyContent: 'center' },
  unchecked: { backgroundColor: '#E3E5EB' },
  row: { minHeight: 72, paddingVertical: 13.5, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(227,229,235,0.5)' },
  pressed: { opacity: 0.6 },
  empty: { paddingVertical: 24, fontFamily: 'Pretendard', fontSize: 15, lineHeight: 22, color: '#91949E' },
  systemBottom: { height: 23 },
  homeIndicator: { position: 'absolute', bottom: 12, width: 134, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: '#212121' },
});
