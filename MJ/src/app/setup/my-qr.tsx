import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SetupHeader } from '../../components/SetupHeader';
import { selectionStyles as s } from '../../components/selectionStyles';
import { useProgress } from '../../state/ProgressProvider';
import { destination } from '../../state/model';
import { issueInvite } from '../../features/companions/api';
import { Button, ErrorText } from '../../components/ui';
export default function MyQR() {
  const { progress } = useProgress();
  const [invite, setInvite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { profileId, profileToken, name, stage } = progress;
  useEffect(() => {
    let active = true;
    if (stage === 'companions' && profileId && profileToken) {
      issueInvite(profileId, profileToken, name).then(code => { if (active) setInvite(code); }).catch(e => { if (active) setError(e.message); });
    }
    return () => { active = false; };
  }, [profileId, profileToken, name, stage, attempt]);
  if (progress.stage !== 'companions') return <Redirect href={destination(progress)} />;
  if (!progress.profileId) return null;
  return <SafeAreaView style={s.safe}><View style={s.page}><SetupHeader title="내 QR 코드" onBack={() => router.replace('/setup/companions')} /><ScrollView contentContainerStyle={s.content}>
    <Text style={s.title}>{progress.name}님의 초대 QR</Text><Text style={s.description}>동반인에게 이 QR 코드를 보여주세요.</Text>
    {invite ? <><View style={q.card} accessibilityLabel="내 동반인 초대 QR 코드"><QRCode value={invite} size={232} quietZone={20} ecl="M" /></View>
    <Text style={s.section}>초대 코드</Text><Text selectable style={q.code}>{invite}</Text></> : error ? <View style={{marginTop:48}}><ErrorText message={error} /><Button title="다시 시도" onPress={() => { setError(null); setAttempt(n => n + 1); }} /></View> : <ActivityIndicator accessibilityLabel="QR 코드 생성 중" style={{marginTop:48}} />}
  </ScrollView></View></SafeAreaView>;
}
const q = StyleSheet.create({ card: { alignSelf: 'center', backgroundColor: '#FFF', marginTop: 48, marginBottom: 24 }, code: { padding: 16, borderRadius: 8, backgroundColor: '#F2F2F2', fontFamily: 'Pretendard', fontSize: 26, lineHeight: 36, letterSpacing: 4, textAlign: 'center', color: '#212121' } });
