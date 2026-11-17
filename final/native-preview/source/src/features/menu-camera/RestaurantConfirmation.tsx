import inlineSvg from '../../assets/inline-svg.json';
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { Button, ErrorText } from '../../components/ui';
import type { RestaurantPlace, RestaurantSearch } from './menu-api';
const icons = {
  back: inlineSvg["assets/restaurant/back.svg"],
  target: inlineSvg["assets/restaurant/map-target.svg"],
  photo: inlineSvg["assets/restaurant/photo-placeholder.svg"],
  dot: inlineSvg["assets/restaurant/open-dot.svg"],
};
export function RestaurantConfirmation({ search, onBack, onConfirm, onSkip, busy, error }: {
  search: RestaurantSearch; onBack: () => void; onConfirm: (place: RestaurantPlace) => void;
  onSkip: () => void; busy: boolean; error: string | null;
}) {
  const [selected, setSelected] = useState(search.places[0]?.id);
  const [linkError, setLinkError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const place = search.places.find(item => item.id === selected) ?? search.places[0];
  async function open(uri: string | null | undefined) {
    if (!uri || !/^https:\/\//i.test(uri)) return;
    try { setLinkError(null); await Linking.openURL(uri); } catch { setLinkError('링크를 열지 못했어요.'); }
  }
  if (!place) return <View style={s.empty}><Text style={s.heading}>찾은 식당이 없어요.</Text><Button title="메뉴 번역 계속하기" onPress={onSkip} /></View>;
  return <View style={s.screen}><View style={s.page}>
    <View style={[s.header, { paddingTop: Platform.OS === 'web' ? 54 : insets.top }]}>
      <View style={s.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 화면" disabled={busy} onPress={onBack} style={s.back}><SvgUri uri={icons.back} width={20} height={20} /></Pressable>
        <Text accessibilityRole="header" style={s.heading}>이 식당이 맞나요?</Text><View style={s.spacer} />
      </View>
    </View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.map}>
        {search.mapImage ? <Image accessibilityLabel="검색된 식당의 Google 지도" source={{ uri: search.mapImage }} style={s.mapImage} resizeMode="contain" /> : <Pressable accessibilityRole="link" onPress={() => void open(place.googleMapsUri)} style={s.mapFallback}><Text style={s.heading}>Google 지도에서 위치 보기</Text></Pressable>}
        <View style={s.count}><Text style={s.countText}>검색 결과 {search.places.length}곳</Text></View>
        {!!place.googleMapsUri && <Pressable accessibilityRole="link" accessibilityLabel="선택한 식당을 Google 지도에서 보기" onPress={() => void open(place.googleMapsUri)} style={s.target}><SvgUri uri={icons.target} width={22} height={22} /></Pressable>}
      </View>
      <View style={[s.sheet, { paddingBottom: Math.max(34, insets.bottom) }]}>
        <View style={s.handle} />
        <View style={s.details}>
          <Text style={s.heading}>{search.places.indexOf(place) + 1}. {place.name}</Text>
          {!!place.category && <Text style={s.secondary}>{place.category}</Text>}
          <Text style={s.secondary}>{place.address}</Text>
          {place.openNow !== null && <View style={s.openRow}>{place.openNow && <SvgUri uri={icons.dot} width={7} height={7} />}<Text style={[s.secondary,place.openNow && s.open]}>{place.openNow ? '영업 중' : '영업 종료'}</Text></View>}
        </View>
        <View>
          <RestaurantPhoto place={place} />
          {!!place.photo?.authors.length && <View style={s.attributions}>{place.photo.authors.map((author,index) => <Text key={index} accessibilityRole={author.uri ? 'link' : undefined} onPress={author.uri ? () => void open(author.uri) : undefined} style={s.credit}>사진: {author.name}</Text>)}</View>}
          {place.attributions.map((item,index) => <Text key={index} style={s.credit} onPress={() => void open(item.uri)}>{item.name}</Text>)}
        </View>
        <Button title={busy ? '식당 웹 메뉴를 찾고 있어요' : '이 식당이 맞아요'} disabled={busy} onPress={() => onConfirm(place)} style={s.confirm} />
        <ErrorText message={error ?? linkError} />
        {search.places.length > 1 && <><Text style={s.heading}>다른 식당 후보</Text>{search.places.filter(item => item.id !== place.id).map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name} 선택`} disabled={busy} onPress={() => setSelected(item.id)} style={s.candidate}>
          <RestaurantPhoto place={item} small />
          <View style={s.candidateText}><Text style={s.name}>{search.places.indexOf(item) + 1}. {item.name}</Text><Text style={s.credit}>Google Maps</Text><Text numberOfLines={2} style={s.secondary}>{item.address}</Text></View>
        </Pressable>)}</>}
        <Text style={s.google}>Google Maps</Text>
        <Pressable accessibilityRole="button" disabled={busy} onPress={onSkip} style={s.skip}><Text style={s.secondary}>식당 연결 없이 계속</Text></Pressable>
      </View>
    </ScrollView>
  </View></View>;
}
function RestaurantPhoto({ place, small = false }: { place: RestaurantPlace; small?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  // Candidate thumbnails use a neutral placeholder so photo author credits stay
  // next to the single displayed photo, with no attribution hidden by truncation.
  return <View style={[s.photo, small && s.thumbnail]}>{!small && place.photo && failed !== place.photo.uri ? <Image source={{ uri: place.photo.uri }} accessibilityLabel={`${place.name} 사진`} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(place.photo?.uri ?? null)} /> : <SvgUri uri={icons.photo} width={20} height={20} />}</View>;
}
const s = StyleSheet.create({
  screen:{ flex:1, backgroundColor:'#E8ECEA' }, page:{ flex:1, width:'100%', maxWidth:412, alignSelf:'center' },
  header:{ backgroundColor:'#FFF', borderBottomLeftRadius:28, borderBottomRightRadius:28, paddingBottom:10, zIndex:2, boxShadow:'0px 2px 10px rgba(0,0,0,0.05)' },
  toolbar:{ height:56, paddingHorizontal:24, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  back:{ width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center', backgroundColor:'#F2F4F6' }, spacer:{ width:44 },
  heading:{ fontFamily:'PretendardBold', fontSize:17, lineHeight:24, letterSpacing:-0.17, color:'#212121' },
  content:{ flexGrow:1 }, map:{ width:'100%', aspectRatio:412/284, backgroundColor:'#E8ECEA' }, mapImage:{ width:'100%', height:'100%' },
  mapFallback:{ flex:1, justifyContent:'center', alignItems:'center' }, count:{ position:'absolute', top:14, right:24, borderRadius:999, backgroundColor:'#FFF', paddingHorizontal:14, paddingVertical:12 }, countText:{ fontFamily:'Pretendard', fontSize:14, color:'#212121' },
  target:{ position:'absolute', right:24, bottom:40, height:48, width:48, borderRadius:24, backgroundColor:'#FFF', alignItems:'center', justifyContent:'center', boxShadow:'0px 2px 10px rgba(0,0,0,0.12)' },
  sheet:{ backgroundColor:'#FFF', borderTopLeftRadius:28, borderTopRightRadius:28, paddingHorizontal:24, paddingTop:12, gap:16 },
  handle:{ width:40, height:5, borderRadius:999, backgroundColor:'#D9DDE1', alignSelf:'center' }, details:{ gap:6 },
  secondary:{ fontFamily:'Pretendard', fontSize:13, lineHeight:19, color:'#626773' }, openRow:{ flexDirection:'row', alignItems:'center', gap:5 }, open:{ color:'#28A745' },
  photo:{ width:'100%', height:170, borderRadius:20, overflow:'hidden', backgroundColor:'#F2F4F6', alignItems:'center', justifyContent:'center' }, thumbnail:{ width:100, height:100, borderRadius:8 },
  attributions:{ flexDirection:'row', flexWrap:'wrap', gap:6, paddingTop:4 }, credit:{ fontFamily:'Pretendard', fontSize:11, lineHeight:16, color:'#626773' }, confirm:{ minHeight:56, borderRadius:20 },
  candidate:{ flexDirection:'row', alignItems:'center', gap:16, minHeight:120 }, candidateText:{ flex:1, gap:4 }, name:{ fontFamily:'PretendardBold', fontSize:16, lineHeight:23, color:'#212121' },
  google:{ fontFamily:'PretendardMedium', fontSize:14, color:'#626773' }, skip:{ minHeight:44, alignItems:'center', justifyContent:'center' }, empty:{ flex:1, justifyContent:'center', padding:24, gap:24 },
});
