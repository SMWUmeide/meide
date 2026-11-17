import { NearbyProvider } from '../features/nearby/NearbyProvider';
import { MenuPhotosProvider } from '../features/menu-camera/MenuPhotosProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider, useProgress } from '../state/ProgressProvider';
import { Button, ErrorText } from '../components/ui';
function Gate() {
  const { ready, error, retry } = useProgress();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFF' }}>{error ? <><ErrorText message={error} /><Button title="다시 시도" onPress={retry} /></> : <ActivityIndicator accessibilityLabel="불러오는 중" />}</View>;
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />;
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSansKRBold: require('../../assets/fonts/NotoSansKR-Bold.ttf'),
    Pretendard: require('../../assets/fonts/Pretendard-Regular.otf'),
    PretendardBold: require('../../assets/fonts/Pretendard-Bold.otf'),
    PretendardMedium: require('../../assets/fonts/Pretendard-Medium.otf'),
  });
  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Text>글꼴을 불러오지 못했어요. 앱을 다시 열어 주세요.</Text></View>;
  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#FFF' }} />;
  return <SafeAreaProvider><StatusBar style="dark" /><ProgressProvider><MenuPhotosProvider><NearbyProvider><Gate /></NearbyProvider></MenuPhotosProvider></ProgressProvider></SafeAreaProvider>;
}
