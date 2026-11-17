import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import type { Coordinates, NearbyCategory, NearbyPlace, NearbyResult } from './api';
import { RestaurantMap } from './RestaurantMap';
const icons={
  back:Asset.fromModule(require('../../../assets/nearby/back.svg')).uri,
  chevron:Asset.fromModule(require('../../../assets/nearby/chevron.svg')).uri,
  target:Asset.fromModule(require('../../../assets/nearby/target.svg')).uri,
};
const categories=[{id:'all',label:'전체'},{id:'asian',label:'아시안'},{id:'korean',label:'한식당'}] as const;
export function NearbyRestaurantsView({result,center,radius,recenter,busy,message,settings,onBack,onLocate,onRadius,onOpenPlace,onSettings}:{
  result:NearbyResult|null;center:Coordinates|null;radius:number;recenter:number;busy:boolean;message:string|null;settings:boolean;onBack:()=>void;onLocate:()=>void;
  onRadius:(radius:number)=>void;onOpenPlace:(place:NearbyPlace)=>void;onSettings:()=>void;
}) {
  const [category,setCategory]=useState<NearbyCategory>('all'),[radiusMenu,setRadiusMenu]=useState(false);
  const insets=useSafeAreaInsets(), group=result?.groups[category];
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const list=useRef<FlatList<NearbyPlace>>(null);
  function selectPlace(place:NearbyPlace) {
    setSelectedId(place.id);
    const index=group?.places.findIndex(item=>item.id===place.id)??-1;
    if(index>=0)list.current?.scrollToIndex({index,animated:true,viewPosition:0});
  }
  return <View style={s.screen}><View style={s.page}>
    <View style={[s.header,{paddingTop:Platform.OS==='web'?54:insets.top}]}><View style={s.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="홈으로 돌아가기" onPress={onBack} style={s.back}><SvgUri uri={icons.back} /></Pressable>
      <Text accessibilityRole="header" style={s.title}>내 주변 식당 찾기</Text><View style={s.spacer} />
    </View></View>
    <View style={s.map}>
      {center ? <RestaurantMap center={center} radius={radius} places={group?.places??EMPTY_PLACES} selectedId={selectedId} recenter={recenter} onSelect={selectPlace} />
        : <View style={s.mapPlaceholder}>{busy?<ActivityIndicator color="#17683E" />:<Text style={s.help}>현재 위치를 확인해 주세요.</Text>}</View>}
      <Pressable accessibilityRole="button" accessibilityLabel="검색 반경 변경" disabled={busy||!center} onPress={()=>setRadiusMenu(true)} style={[s.radius,busy&&s.disabled]}><Text style={s.radiusText}>반경 {formatDistance(radius)} · <Text style={s.green}>{group?.places.length??0}곳</Text></Text><SvgUri uri={icons.chevron} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="현재 위치로 주변 식당 다시 찾기" disabled={busy} onPress={onLocate} style={s.target}>{busy?<ActivityIndicator color="#17683E" />:<SvgUri uri={icons.target} />}</Pressable>
    </View>
    <View style={[s.sheet,{paddingBottom:Math.max(12,insets.bottom)}]}>
      <View style={s.handle} />
      <View style={s.categories}>{categories.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{selected:category===item.id}} onPress={()=>{setCategory(item.id);setSelectedId(null);list.current?.scrollToOffset({offset:0,animated:false});}} style={[s.chip,category===item.id&&s.selected]}><Text style={[s.chipText,category===item.id&&s.selectedText]}>{item.label}</Text></Pressable>)}</View>
      {!!message&&<View accessibilityLiveRegion="polite" style={s.notice}><Text style={s.help}>{message}</Text>{settings&&<Pressable accessibilityRole="button" onPress={onSettings} style={s.action}><Text style={s.actionText}>{Platform.OS==='web'?'위치 권한 안내':'위치 설정 열기'}</Text></Pressable>}</View>}
      {busy&&!result?<View style={s.empty}><ActivityIndicator color="#17683E"/><Text style={s.help}>주변 식당을 찾고 있어요</Text></View>:<FlatList ref={list} extraData={selectedId} onScrollToIndexFailed={({index,averageItemLength})=>list.current?.scrollToOffset({offset:index*averageItemLength,animated:true})} data={group?.places??[]} keyExtractor={item=>item.id} contentContainerStyle={s.list} renderItem={({item,index})=><Pressable accessibilityRole="button" accessibilityState={{selected:selectedId===item.id}} accessibilityLabel={item.name+', '+item.category+', 직선거리 '+item.distanceMeters+'미터, 지도에서 선택'} onPress={()=>selectPlace(item)} style={[s.row,selectedId===item.id&&s.selectedRow]}>
        <View style={s.copy}><Text numberOfLines={2} style={[s.name,index===0&&s.firstName]}>{item.name}</Text>
          <View style={s.rating}>{item.rating!==null?<><Text style={s.ratingNumber}>{item.rating.toFixed(1)}</Text><Stars rating={item.rating} /><Text style={s.reviewCount}>({item.reviewCount.toLocaleString()})</Text></>:<Text style={s.reviewCount}>평점 없음</Text>}</View>
          <Text numberOfLines={1} style={s.category}>{item.category} · 직선 {formatDistance(item.distanceMeters)}</Text>
          <Text numberOfLines={2} style={s.address}>{item.address}</Text>
          {item.attributions.map((a,i)=><Text key={i} style={s.attribution}>{a.name}</Text>)}{selectedId===item.id&&<Pressable accessibilityRole="link" accessibilityLabel={item.name+' Google Maps에서 보기'} onPress={event=>{event.stopPropagation();onOpenPlace(item);}} style={s.placeLink}><Text style={s.actionText}>Google Maps에서 보기</Text></Pressable>}
        </View><LinearGradient colors={['#F4EEE7','#E8EDF4']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.thumb}><Text style={s.plate}>🍽</Text></LinearGradient>
      </Pressable>} ListEmptyComponent={<View style={s.empty}><Text style={s.help}>{!result?(center?'주변 식당 목록을 불러오지 못했어요.':'위치를 허용하면 주변 식당을 찾을 수 있어요.'):group?.incomplete?'이 카테고리의 검색을 완료하지 못했어요.':'이 반경에서 '+(category==='korean'?'한식당을':category==='asian'?'아시안 식당을':'식당을')+' 찾지 못했어요.'}</Text>{!result&&!busy&&<Pressable accessibilityRole="button" onPress={onLocate} style={s.action}><Text style={s.actionText}>현재 위치로 찾기</Text></Pressable>}</View>} ListFooterComponent={result?<View style={s.footer}>{group?.incomplete&&group.places.length>0&&<Text style={s.help}>일부 검색 결과만 표시하고 있어요.</Text>}{group?.places.length===20&&<Text style={s.attribution}>가까운 식당 최대 20곳</Text>}<Text style={s.attribution}>Google Maps</Text></View>:undefined} />}
    </View>
    <Modal visible={radiusMenu} transparent animationType="fade" onRequestClose={()=>setRadiusMenu(false)}><Pressable accessibilityLabel="반경 선택 닫기" onPress={()=>setRadiusMenu(false)} style={s.overlay}><View style={s.radiusSheet}><Text style={s.title}>검색 반경</Text>{[500,1000,3000].map(option=><Pressable key={option} accessibilityRole="button" accessibilityState={{selected:radius===option}} onPress={()=>{setRadiusMenu(false);if(option!==radius)onRadius(option);}} style={s.radiusOption}><Text style={s.radiusText}>{formatDistance(option)}</Text></Pressable>)}</View></Pressable></Modal>
  </View></View>;
}
const EMPTY_PLACES:NearbyPlace[]=[];
function Stars({rating}:{rating:number}) {
  return <View style={s.stars}>{[0,1,2,3,4].map(index=><View key={index} style={s.starCell}><Text style={[s.starText,s.greyStars]}>★</Text><View style={[s.starFill,{width:Math.max(0,Math.min(1,rating-index))*11}]}><Text style={s.starText}>★</Text></View></View>)}</View>;
}
function formatDistance(meters:number){return meters>=1000?Number((meters/1000).toFixed(1))+'km':meters+'m';}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#E8ECEA'},page:{flex:1,width:'100%',maxWidth:412,alignSelf:'center'},
  header:{backgroundColor:'#FFF',paddingBottom:10,borderBottomLeftRadius:28,borderBottomRightRadius:28,zIndex:2,boxShadow:'0px 6px 20px rgba(0,0,0,0.08)'},toolbar:{height:56,paddingHorizontal:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:44,height:44,borderRadius:22,backgroundColor:'#F2F4F6',alignItems:'center',justifyContent:'center'},spacer:{width:44},title:{fontFamily:'PretendardBold',fontSize:17,lineHeight:24,letterSpacing:-0.17,color:'#212121'},
  map:{width:'100%',aspectRatio:412/350,flexShrink:1,minHeight:160,backgroundColor:'#E8ECEA'},mapPlaceholder:{flex:1,alignItems:'center',justifyContent:'center',padding:24,gap:12},
  radius:{position:'absolute',right:24,top:14,backgroundColor:'#FFF',borderRadius:999,paddingLeft:14,paddingRight:12,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:4,boxShadow:'0px 3px 12px rgba(0,0,0,0.12)'},radiusText:{fontFamily:'PretendardMedium',fontSize:14,lineHeight:20,color:'#212121'},green:{color:'#28A745'},target:{position:'absolute',right:24,bottom:38,width:48,height:48,borderRadius:24,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',boxShadow:'0px 3px 12px rgba(0,0,0,0.14)'},
  sheet:{flex:1,minHeight:250,backgroundColor:'#FFF',borderTopLeftRadius:28,borderTopRightRadius:28,paddingTop:34,boxShadow:'0px -6px 24px rgba(0,0,0,0.1)'},handle:{position:'absolute',top:12,left:'50%',marginLeft:-20,width:40,height:5,borderRadius:3,backgroundColor:'#D9DDE1'},categories:{flexDirection:'row',gap:7,marginHorizontal:24,marginBottom:8},chip:{height:35.2,paddingHorizontal:13,paddingVertical:7,borderWidth:1,borderColor:'#E7E7EC',borderRadius:20,alignItems:'center',justifyContent:'center'},selected:{backgroundColor:'#212121',borderColor:'#212121'},chipText:{fontFamily:'PretendardBold',fontSize:12,lineHeight:19.2,color:'#30333B'},selectedText:{color:'#FFF'},
  selectedRow:{backgroundColor:'#F0F7F2'},placeLink:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'},
  list:{paddingHorizontal:24,paddingBottom:12},row:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:17,borderBottomWidth:1,borderBottomColor:'#E2E4E8'},copy:{flex:1,minWidth:0},name:{fontFamily:'PretendardBold',fontSize:15,lineHeight:21.75,letterSpacing:-0.4,color:'#424D60'},firstName:{color:'#000'},rating:{flexDirection:'row',alignItems:'center',gap:5,minHeight:25,paddingTop:5},ratingNumber:{fontFamily:'PretendardBold',fontSize:12,lineHeight:19.2,color:'#657188'},stars:{flexDirection:'row',width:55,height:18},starCell:{width:11,height:18},starText:{fontFamily:'Pretendard',fontSize:11,lineHeight:17.6,color:'#D0A55A',width:11},greyStars:{color:'#DCE1E8'},starFill:{position:'absolute',left:0,top:0,overflow:'hidden'},reviewCount:{fontFamily:'Pretendard',fontSize:11,lineHeight:17.6,color:'#989DA6'},category:{fontFamily:'Pretendard',fontSize:12,lineHeight:20.4,color:'#7D8797',paddingTop:5},address:{fontFamily:'Pretendard',fontSize:10,lineHeight:16,color:'#A1A7B1',paddingTop:2},thumb:{width:76,height:79,borderRadius:15,alignItems:'center',justifyContent:'center'},plate:{fontSize:31,lineHeight:49.6},
  attribution:{fontFamily:'Pretendard',fontSize:11,lineHeight:18,color:'#777'},footer:{paddingTop:18,alignItems:'flex-end',gap:4},empty:{padding:24,gap:16,alignItems:'center'},help:{fontFamily:'Pretendard',fontSize:13,lineHeight:20,color:'#626773',textAlign:'center'},notice:{paddingHorizontal:24,paddingBottom:8},action:{minHeight:44,justifyContent:'center',alignItems:'center',paddingHorizontal:16},actionText:{fontFamily:'PretendardBold',fontSize:14,color:'#17683E'},disabled:{opacity:0.5},overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.35)',justifyContent:'flex-end'},radiusSheet:{backgroundColor:'#FFF',padding:24,borderTopLeftRadius:28,borderTopRightRadius:28,gap:8},radiusOption:{minHeight:52,justifyContent:'center',paddingHorizontal:16},
});
