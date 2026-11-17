import { CameraView, useCameraPermissions } from 'expo-camera';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../../components/ui';
import { SetupHeader } from '../../components/SetupHeader';
import { selectionStyles as s } from '../../components/selectionStyles';
import { addCompanion, type Companion } from '../../features/companions/invite';
import { issueInvite, loadCompanions, resolveInvite } from '../../features/companions/api';
import { useProgress } from '../../state/ProgressProvider';
import { destination, finishSetup, withCompanions } from '../../state/model';
export default function Scan() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { progress, save, busy, error } = useProgress();
  const fromCompanions = progress.stage === 'home' && from === 'companions';
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [candidate, setCandidate] = useState<Companion | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mountError, setMountError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const scanLock = useRef(false);
  const confirmLock = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const scannedCode = useRef('');
  const permissionRequested = useRef(false);
  const [requesting, setRequesting] = useState(false);
  const [resolving, setResolving] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => { const listener = AppState.addEventListener('change', state => { setActive(state === 'active'); if (state === 'active') void getPermission().catch(() => setMessage('카메라 권한을 확인해 주세요.')); }); return () => listener.remove(); }, [getPermission]);
  useEffect(() => {
    if (!focused || !permission || permission.granted || permissionRequested.current || !permission.canAskAgain) return;
    permissionRequested.current = true;
    setRequesting(true);
    requestPermission().catch(() => setMessage('카메라 권한을 확인해 주세요.')).finally(() => setRequesting(false));
  }, [focused, permission, requestPermission]);
  if (progress.stage !== 'companions' && progress.stage !== 'home') return <Redirect href={destination(progress)} />;
  async function enableCamera() {
    try { setMessage(null); await requestPermission(); } catch { setMessage('카메라를 열 수 없어요. 카메라 권한과 연결을 확인해 주세요.'); }
  }
  async function scanned(data: string) {
    if (scanLock.current || busy) return;
    scanLock.current = true;
    setResolving(true);
    try { const person = await resolveInvite(data); scannedCode.current = data.trim().toUpperCase(); addCompanion(progress.companions ?? [], progress.profileId!, person); setCandidate(person); setMessage(null); }
    catch (e) { setMessage((e as Error).message); }
    finally { setResolving(false); }
  }
  function retry() { setCandidate(null); setMessage(null); setMountError(false); setAttempt(n => n + 1); scanLock.current = false; }
  async function confirm() {
    if (confirmLock.current || busy) return;
    confirmLock.current = true; setConfirming(true);
    try {
      await issueInvite(progress.profileId!,progress.profileToken!,progress.name);
      const companions = await loadCompanions(progress.profileId!,progress.profileToken!,'accept',{code:scannedCode.current});
      if (await save(finishSetup(withCompanions(progress, companions), 'selected'))) {
        if (fromCompanions) router.navigate('/companions');
        else router.replace('/home');
      } }
    catch (e) { setMessage((e as Error).message); }
    finally { confirmLock.current = false; setConfirming(false); }
  }
  return <SafeAreaView style={s.safe}><View style={s.page}>
    <SetupHeader title="동반인 QR 스캔" disabled={busy || confirming} onBack={() => router.navigate({ pathname: '/setup/companions', params: fromCompanions ? { from: 'companions' } : {} })} />
    <View style={c.body}>
      <View style={c.preview}>
        {permission?.granted && focused && active && !candidate && !mountError && <CameraView key={attempt} style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => void scanned(data)} onMountError={() => { setMountError(true); setMessage('카메라를 시작하지 못했어요. 권한 또는 카메라 사용 상태를 확인해 주세요.'); }} />}
        {!candidate && <View pointerEvents="none" style={c.guide}><View style={c.square} /></View>}
        {candidate && <View style={c.match}><Text style={c.matchText}>{candidate.name}님</Text></View>}
      </View>
      {!permission?.granted ? <View style={c.permission}>
        {requesting || !permission ? <Text style={s.description}>카메라 권한을 확인하고 있어요.</Text> : <>
          <Text style={s.description}>QR을 스캔하려면 카메라 접근을 허용해 주세요.</Text>
          {permission.canAskAgain ? <Button title="카메라 허용하기" onPress={() => void enableCamera()} /> : <><Text style={s.description}>{Platform.OS === 'web' ? '브라우저의 사이트 설정에서 카메라 권한을 허용해 주세요.' : '기기 설정에서 카메라 권한을 허용해 주세요.'}</Text>{Platform.OS !== 'web' && <Button title="설정 열기" onPress={() => void Linking.openSettings()} />}</>}
        </>}
      </View> : <>
        <Text style={s.description}>{resolving ? '동반인 정보를 확인하고 있어요.' : candidate ? '이 동반인을 추가할까요?' : '동반인의 QR 코드를 화면 안에 맞춰 주세요.'}</Text>
        {candidate && <Button title="동반인 추가" disabled={busy || confirming} onPress={() => void confirm()} />}
        {(candidate || message) && <Pressable accessibilityRole="button" disabled={busy || confirming} style={c.retry} onPress={retry}><Text style={c.retryText}>다시 스캔</Text></Pressable>}
      </>}
      <ErrorText message={message ?? error} />
    </View>
  </View></SafeAreaView>;
}
const c = StyleSheet.create({ body: { flex: 1, padding: 24, gap: 16 }, permission: { gap: 12 }, preview: { flex: 1, minHeight: 260, maxHeight: 480, backgroundColor: '#212121', borderRadius: 20, overflow: 'hidden' }, guide: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }, square: { width: '76%', aspectRatio: 1, borderColor: 'white', borderWidth: 3, borderRadius: 20 }, match: { flex: 1, justifyContent: 'center', alignItems: 'center' }, matchText: { fontFamily: 'PretendardBold', fontSize: 24, color: 'white' }, retry: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, retryText: { fontFamily: 'PretendardBold', fontSize: 16, color: '#176B38' } });
