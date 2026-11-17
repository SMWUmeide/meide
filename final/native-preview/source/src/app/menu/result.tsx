import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useMenuPhotos } from '../../features/menu-camera/MenuPhotosProvider';
import { MenuAnalysis } from '../../features/menu-camera/MenuAnalysis';
import { ErrorText } from '../../components/ui';
export default function MenuResult() {
  const { photoId } = useLocalSearchParams<{ photoId:string }>();
  const { photos, menus } = useMenuPhotos();
  const photo = photos.find(item => item.id === photoId), menu = menus[photoId];
  const [error, setError] = useState<string | null>(null);
  if (!photo || !menu) return <Redirect href="/menu/camera" />;
  async function open(uri: string) {
    try { await Linking.openURL(uri); } catch { setError('링크를 열지 못했어요.'); }
  }
  return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.content}>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/menu/camera')} style={s.back}><Text style={s.text}>‹ 메뉴판 촬영하기</Text></Pressable>
    {menu.confirmedRestaurant && <><Text style={s.title}>{menu.confirmedRestaurant.name}</Text><Text style={s.text}>{menu.confirmedRestaurant.address}</Text><Text style={s.credit}>Google Maps</Text></>}
    {!!menu.websiteUri && <Pressable accessibilityRole="link" onPress={() => void open(menu.websiteUri!)} style={s.back}><Text style={s.link}>식당 웹사이트 보기 ↗</Text></Pressable>}
    {menu.webMenu?.status === 'found' && <Pressable accessibilityRole="link" onPress={() => { if (menu.webMenu?.status === 'found') void open(menu.webMenu.url); }} style={s.back}><Text style={s.link}>가져온 웹 메뉴 보기 ↗</Text></Pressable>}
    <ErrorText message={error} />
    <MenuAnalysis photo={photo} autoTranslate />
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({ screen:{ flex:1, backgroundColor:'#F4F6F4' }, content:{ width:'100%', maxWidth:412, alignSelf:'center', padding:24, gap:12 }, back:{ minHeight:44, justifyContent:'center' }, text:{ fontFamily:'Pretendard', fontSize:15, lineHeight:22, color:'#212121' }, title:{ fontFamily:'PretendardBold', fontSize:20, color:'#212121' }, link:{ fontFamily:'PretendardBold', fontSize:15, color:'#17683E' }, credit:{ fontFamily:'Pretendard', fontSize:12, color:'#626773' } });
