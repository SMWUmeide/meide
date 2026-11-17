import inlineSvg from '../../assets/inline-svg.json';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { useMenuPhotos } from '../../features/menu-camera/MenuPhotosProvider';
import { Button } from '../../components/ui';
import { useProgress } from '../../state/ProgressProvider';
import { destination } from '../../state/model';
const icons = {
  close: inlineSvg["assets/camera/imgFrame1.svg"],
  flash: inlineSvg["assets/camera/imgFrame2.svg"],
  gallery: inlineSvg["assets/camera/imgFrame3.svg"],
  guide: inlineSvg["assets/camera/imgGroup.svg"],
  ring: inlineSvg["assets/camera/img.svg"],
  shutter: inlineSvg["assets/camera/img1.svg"],
};
export default function MenuCamera() {
  const { progress } = useProgress();
  const { photos, add, remove } = useMenuPhotos();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const requested = useRef(false);
  const working = useRef(false);
  const mounted = useRef(true);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [torch, setTorch] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [guideSize, setGuideSize] = useState({width:332,height:500});
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => { setFocused(true); setReady(false); return () => { setFocused(false); setReady(false); setTorch(false); }; }, []));
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      setActive(state === 'active'); setReady(false);
      if (state === 'active') void getPermission().catch(() => setMessage('카메라 권한을 확인해 주세요.'));
    });
    return () => listener.remove();
  }, [getPermission]);
  const allow = useCallback(async () => {
    try { setMessage(null); await requestPermission(); }
    catch { setMessage('카메라를 열 수 없어요. 권한과 카메라 연결을 확인해 주세요.'); }
  }, [requestPermission]);
  useEffect(() => {
    if (progress.stage !== 'home' || !focused || !permission || permission.granted || !permission.canAskAgain || requested.current) return;
    requested.current = true; void allow();
  }, [progress.stage, focused, permission, allow]);
  const running = focused && active && permission?.granted && !failed && !reviewing;
  async function capture() {
    if (working.current || !ready || !running || !camera.current) return;
    working.current = true; setBusy(true); setMessage(null);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8, exif: false, base64: true });
      if (!photo?.uri) throw new Error('empty-photo');
      if (mounted.current) add([{ id: randomUUID(), uri: photo.uri, width: photo.width, height: photo.height, base64: photo.base64 }]);
    } catch { if (mounted.current) setMessage('촬영하지 못했어요. 다시 눌러 주세요.'); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  }
  async function pick() {
    if (working.current) return;
    working.current = true; setBusy(true); setMessage(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 8, quality: 0.8, base64: true });
      if (!result.canceled && mounted.current) {
        add(result.assets.map(photo => ({id:randomUUID(),uri:photo.uri,width:photo.width,height:photo.height,base64:photo.base64 ?? undefined})));
        setReady(false); setReviewing(true);
      }
    } catch { if (mounted.current) setMessage('사진을 불러오지 못했어요. 다시 시도해 주세요.'); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  }
  function closeReview() { setReady(false); setReviewing(false); }
  if (progress.stage !== 'home') return <Redirect href={destination(progress)} />;
  const scale = Math.min(guideSize.width / 331, guideSize.height / 499);
  return <View style={c.screen}>
    {focused && <StatusBar style="light" />}
    {running && <CameraView key={attempt} ref={camera} style={StyleSheet.absoluteFill} facing="back" mode="picture" autofocus="on" enableTorch={torch} onCameraReady={() => setReady(true)} onMountError={() => { setReady(false); setFailed(true); setMessage('카메라를 시작하지 못했어요. 권한과 카메라 사용 상태를 확인해 주세요.'); }} />}
    <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.8)','rgba(0,0,0,0.35)','transparent']} style={c.topShade} />
    <LinearGradient pointerEvents="none" colors={['transparent','rgba(0,0,0,0.55)','rgba(0,0,0,0.9)']} locations={[0,0.45,1]} style={c.bottomShade} />
    <SafeAreaView style={c.safe}><View style={c.page}>
      <View style={c.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="촬영 닫기" disabled={busy} onPress={() => router.replace('/home')} style={c.round}><SvgUri uri={icons.close} /></Pressable>
        <Text accessibilityRole="header" style={c.title}>메뉴판 촬영하기</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={torch ? '플래시 끄기' : '플래시 켜기'} accessibilityState={{ selected: torch }} disabled={!ready || busy || Platform.OS === 'web'} onPress={() => setTorch(value => !value)} style={[c.round,torch && c.flashOn]}><SvgUri uri={icons.flash} /></Pressable>
      </View>
      <View style={c.guideArea} onLayout={event => setGuideSize(event.nativeEvent.layout)}>
        <View pointerEvents="none" style={[c.frame,{transform:[{scale}]}]}><SvgUri uri={icons.guide} /></View>
        {(!permission?.granted || failed) && <View style={c.permission}>
          {!permission ? <ActivityIndicator color="white" /> : <><Text style={c.permissionText}>{message ?? '메뉴판을 찍으려면 카메라 접근을 허용해 주세요.'}</Text>
          {failed ? <Pressable accessibilityRole="button" onPress={() => { setFailed(false); setMessage(null); setReady(false); setAttempt(n=>n+1); }} style={c.permissionButton}><Text style={c.title}>다시 시도</Text></Pressable> : permission.canAskAgain ? <Pressable accessibilityRole="button" onPress={() => void allow()} style={c.permissionButton}><Text style={c.title}>카메라 허용하기</Text></Pressable> : Platform.OS !== 'web' ? <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings().catch(()=>setMessage('기기 설정에서 카메라를 허용해 주세요.'))} style={c.permissionButton}><Text style={c.title}>설정 열기</Text></Pressable> : <Text style={c.permissionText}>브라우저 설정에서 카메라를 허용해 주세요.</Text>}</>}
        </View>}
      </View>
      <View style={c.bottom}>
        <Text style={c.hint}>여러 장이면 이어서 찍을 수 있어요</Text>
        {message && permission?.granted && !failed && <Text accessibilityLiveRegion="polite" style={c.error}>{message}</Text>}
        <View style={c.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="갤러리에서 메뉴판 선택" disabled={busy} onPress={() => void pick()} style={c.gallery}><SvgUri uri={icons.gallery} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="메뉴판 사진 촬영" accessibilityState={{disabled:!ready || busy}} disabled={!ready || busy} onPress={() => void capture()} style={[c.shutter,(!ready || busy) && c.disabled]}><SvgUri uri={icons.ring} /><View pointerEvents="none" style={c.shutterCore}><SvgUri uri={icons.shutter} /></View>{busy && <ActivityIndicator style={StyleSheet.absoluteFill} color="#176B38" />}</Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`촬영한 사진 ${photos.length}장 확인`} disabled={!photos.length || busy} onPress={() => { setReady(false); setReviewing(true); }} style={c.stack}>
            {photos.length > 0 && <><Image source={{uri:photos[photos.length-1].uri}} style={c.thumb} /><View style={c.badge}><Text style={c.badgeText}>{photos.length}</Text></View></>}
          </Pressable>
        </View>
      </View>
    </View></SafeAreaView>
    <Modal visible={reviewing} animationType="slide" onRequestClose={closeReview}><SafeAreaView style={c.review}>
      <View style={c.header}><Pressable accessibilityRole="button" accessibilityLabel="사진 확인 닫기" onPress={closeReview} style={c.round}><SvgUri uri={icons.close} /></Pressable><Text style={c.title}>촬영한 사진 {photos.length}장</Text><View style={c.roundSpacer} /></View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={c.reviewList}>{photos.map((photo,index) => <View key={photo.id} style={c.reviewItem}><Image accessibilityLabel={`메뉴판 사진 ${index+1}`} source={{uri:photo.uri}} resizeMode="contain" style={c.reviewPhoto} /><Pressable accessibilityRole="button" accessibilityLabel={`${index+1}번째 사진 삭제`} onPress={() => remove(photo.id)} style={c.delete}><Text style={c.title}>삭제</Text></Pressable></View>)}</ScrollView>
      <Button title="메뉴판 분석하기" disabled={!photos.length || photos.length > 6} onPress={() => { closeReview(); router.push('/menu/order'); }} />
    </SafeAreaView></Modal>
  </View>;
}
const c = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0E0F10'}, safe:{flex:1,paddingTop:Platform.OS==='web'?54:0,paddingBottom:Platform.OS==='web'?23:0}, page:{flex:1,width:'100%',maxWidth:412,alignSelf:'center'},
  topShade:{position:'absolute',top:0,left:0,right:0,height:250},bottomShade:{position:'absolute',bottom:0,left:0,right:0,height:340},
  header:{height:56,marginTop:4,paddingHorizontal:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},round:{width:44,height:44,borderRadius:22,backgroundColor:'rgba(255,255,255,0.16)',alignItems:'center',justifyContent:'center'},roundSpacer:{width:44},title:{fontFamily:'PretendardBold',fontSize:17,lineHeight:24,color:'#FFF'},flashOn:{backgroundColor:'#176B38'},
  guideArea:{flex:1,marginTop:48,marginHorizontal:40,marginBottom:32,alignItems:'center',justifyContent:'center',minHeight:120},frame:{width:331,height:499,position:'absolute',alignItems:'center',justifyContent:'center'},
  permission:{maxWidth:280,padding:20,gap:16,backgroundColor:'rgba(0,0,0,0.8)',borderRadius:16},permissionText:{fontFamily:'Pretendard',fontSize:15,lineHeight:23,color:'#FFF',textAlign:'center'},permissionButton:{backgroundColor:'#176B38',borderRadius:24,minHeight:48,alignItems:'center',justifyContent:'center',padding:12},
  bottom:{paddingBottom:49},hint:{fontFamily:'Pretendard',fontSize:13,lineHeight:19,textAlign:'center',color:'rgba(255,255,255,0.7)'},error:{fontFamily:'Pretendard',fontSize:13,color:'#FFF',textAlign:'center',padding:8},
  controls:{height:100,marginTop:32,marginHorizontal:0,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},gallery:{position:'absolute',left:56,width:54,height:54,borderRadius:16,backgroundColor:'rgba(255,255,255,0.14)',alignItems:'center',justifyContent:'center'},shutter:{position:'absolute',left:'50%',marginLeft:-42,width:84,height:84,alignItems:'center',justifyContent:'center'},shutterCore:{position:'absolute',width:108,height:108,alignItems:'center',justifyContent:'center'},disabled:{opacity:0.45},stack:{position:'absolute',right:46,top:11,width:56,height:64,justifyContent:'center',alignItems:'center'},thumb:{width:45,height:63,borderRadius:1,transform:[{rotate:'4deg'}]},badge:{position:'absolute',right:-4,top:-4,minWidth:22,height:22,paddingHorizontal:3,backgroundColor:'#28A745',borderColor:'#FFF',borderWidth:2,borderRadius:11,alignItems:'center',justifyContent:'center'},badgeText:{fontFamily:'PretendardBold',fontSize:12,color:'#FFF'},
  review:{flex:1,backgroundColor:'#0E0F10'},reviewList:{padding:24,gap:24},reviewItem:{gap:8},reviewPhoto:{width:'100%',height:420},delete:{minHeight:44,alignItems:'center',justifyContent:'center'},
});
