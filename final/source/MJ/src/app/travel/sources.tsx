import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TravelSources() {
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.back}><Text style={s.link}>뒤로가기</Text></Pressable>
    <Text accessibilityRole="header" style={s.title}>여행지 데이터 출처</Text>
    <Text style={s.body}>GeoNames 지명 자료 · 2026년 10월 10일 자료본</Text>
    <Text style={s.body}>유럽과 유럽에 걸친 국가, 관련 영토를 포함한 58곳의 도시·마을과 원본의 지역명을 사용합니다. 기존 한국어 이름을 우선 사용하고, 없는 이름은 언어별 발음 규칙으로 한글 표기를 생성했습니다. 원어 이름도 함께 표시합니다.</Text>
    <Text style={s.body}>자동 생성한 발음 표기는 공식 명칭이 아니며 현지 발음과 차이가 있을 수 있습니다. Hangulize와 eSpeak NG의 발음 자료를 바탕으로 변환했습니다. 지역명은 원본의 분류이며 최신 행정 경계나 모든 관광 지역을 보장하지 않습니다.</Text>
    <Link href="https://www.geonames.org/" style={s.link}>GeoNames</Link>
    <Link href="https://download.geonames.org/export/dump/" style={s.link}>원본 자료</Link>
    <Link href="https://creativecommons.org/licenses/by/4.0/" style={s.link}>Creative Commons Attribution 4.0</Link>
    <Link href="https://github.com/sublee/hangulize" style={s.link}>Hangulize</Link>
    <Link href="https://github.com/espeak-ng/espeak-ng" style={s.link}>eSpeak NG</Link>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F2F4F6'},
  content: {width: '100%', maxWidth: 412, alignSelf: 'center', padding: 24, gap: 20},
  back: {alignSelf: 'flex-start', paddingVertical: 12},
  title: {fontFamily: 'PretendardBold', fontSize: 22, color: '#212121'},
  body: {fontFamily: 'Pretendard', fontSize: 15, lineHeight: 24, color: '#444'},
  link: {fontFamily: 'Pretendard', fontSize: 14, color: '#176B38', textDecorationLine: 'underline'},
});
