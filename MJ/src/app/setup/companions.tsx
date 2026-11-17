import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri, SvgXml } from 'react-native-svg';
import { SetupHeader } from '../../components/SetupHeader';
import { selectionStyles as s } from '../../components/selectionStyles';
import { Button, ErrorText } from '../../components/ui';
import { invitationUrl, issueInvite, loadCompanions } from '../../features/companions/api';
import { shareInvitation } from '../../features/companions/share';
import { useProgress } from '../../state/ProgressProvider';
import { destination, finishSetup } from '../../state/model';
const copyIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#176B38" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
const scannerIcon = Asset.fromModule(require('../../../assets/qr-scanner.svg')).uri;
export default function Companions() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { progress, save, syncCompanions, busy, error } = useProgress();
  const [link, setLink] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteActionTaken, setInviteActionTaken] = useState(false);
  useEffect(() => { if (!copied) return; const timer=setTimeout(()=>setCopied(false),1600); return ()=>clearTimeout(timer); },[copied]);
  const [acting, setActing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const working = useRef(false);
  const { profileId, profileToken, name, stage, pendingInvite } = progress;
  const fromCompanions = stage === 'home' && from === 'companions';
  useFocusEffect(useCallback(() => {
    let active = true;
    let inviteReady = false;
    void attempt;
    if ((stage !== 'companions' && stage !== 'home') || pendingInvite || !profileId || !profileToken) return;
    async function refresh() {
      if (working.current || AppState.currentState !== 'active') return;
      working.current = true;
      try {
        if (!inviteReady) {
          const code = await issueInvite(profileId!, profileToken!, name);
          if (active) setLink(invitationUrl(code));
          inviteReady = true;
        }
        const people = await loadCompanions(profileId!, profileToken!);
        if (active) { setMessage(null); await syncCompanions(people); }
      } catch(e) { if (active) setMessage((e as Error).message); }
      finally { working.current = false; }
    }
    void refresh();
    const interval = setInterval(() => void refresh(), 10000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active=false; clearInterval(interval); listener.remove(); };
  },[profileId,profileToken,name,stage,pendingInvite,syncCompanions,attempt]));
  if (stage !== 'companions' && stage !== 'home') return <Redirect href={destination(progress)} />;
  if (pendingInvite) return <Redirect href={{pathname:'/invite/[code]',params:{code:pendingInvite}}} />;
  async function copy() {
    try { if (!await Clipboard.setStringAsync(link)) throw new Error('링크를 복사하지 못했어요. 다시 시도해 주세요.'); setCopied(true); setInviteActionTaken(true); setMessage(null); }
    catch(e) { setMessage((e as Error).message); }
  }
  async function share() {
    // Continuing setup depends on tapping share, not sending or accepting an invitation.
    setInviteActionTaken(true);
    setActing(true);
    try { await shareInvitation(link); }
    catch(e) { if ((e as Error).name !== 'AbortError') setMessage((e as Error).message); }
    finally { setActing(false); }
  }
  async function remove(friendId: string) {
    if (working.current || acting) return;
    working.current=true; setActing(true);
    try { const people=await loadCompanions(profileId!,profileToken!,'remove',{friendId}); await syncCompanions(people); }
    catch(e) { setMessage((e as Error).message); }
    finally { working.current=false; setActing(false); }
  }
  async function finish(status: 'selected' | 'later') {
    if (await save(finishSetup(progress, status))) {
      if (fromCompanions) router.navigate('/companions');
      else router.replace('/home');
    }
  }
  const companions=progress.companions ?? [];
  return <SafeAreaView style={s.safe}><View style={s.page}>
    <SetupHeader title="동반인 설정" disabled={busy || acting} onBack={() => fromCompanions ? router.navigate('/companions') : stage === 'home' ? router.replace('/home') : void save({...progress,stage:'foods'})} />
    <ScrollView contentContainerStyle={s.content}>
      <Text accessibilityRole="header" style={s.title}>동반인과 연결해 주세요</Text>
      <Text style={s.description}>연결하면 같은 메뉴판과 장바구니를 함께 봐요.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="동반인 QR 스캔" style={c.scan} onPress={() => router.push({ pathname: '/setup/scan', params: fromCompanions ? { from: 'companions' } : {} })}><SvgUri uri={scannerIcon} /><Text style={c.label}>동반인 QR 스캔</Text></Pressable>
      <Text style={c.or}>또는</Text>
      <View style={c.inviteCard}>
        <View style={c.inviteHeading}><Text style={c.label}>동반인 초대 링크</Text><Pressable accessibilityRole="button" accessibilityLabel={copied ? '초대 링크 복사 완료' : '초대 링크 복사'} disabled={!link || acting} onPress={() => void copy()} style={[c.copyIcon,copied && c.copied,(!link || acting) && c.disabled]}><SvgXml xml={copyIcon} /></Pressable></View>
        <Pressable accessibilityRole="button" disabled={!link || acting} onPress={() => void share()} style={[c.action,c.share,(!link || acting) && c.disabled]}><Text style={[c.actionText,c.shareText]}>공유하기</Text></Pressable>
      </View>
      <ErrorText message={message} />{message && !link && <Pressable accessibilityRole="button" style={c.later} onPress={() => setAttempt(n => n+1)}><Text style={c.actionText}>다시 시도</Text></Pressable>}
      {companions.length > 0 && <View style={[s.chips,{marginTop:24}]}>{companions.map(person => <Pressable key={person.id} accessibilityRole="button" accessibilityLabel={`${person.name} 동반인 삭제`} disabled={busy || acting} style={s.chip} onPress={() => void remove(person.id)}><Text style={s.chipText}>{person.name}  ×</Text></Pressable>)}</View>}
    </ScrollView>
    <View style={s.footer}><ErrorText message={error} /><Button title="연결을 완료했어요" disabled={busy || acting || (!companions.length && !inviteActionTaken)} onPress={() => void finish('selected')} /><Pressable accessibilityRole="button" disabled={busy || acting} style={c.later} onPress={() => void finish('later')}><Text style={c.laterText}>나중에 연결하기</Text></Pressable></View>
  </View></SafeAreaView>;
}
const c=StyleSheet.create({scan:{marginTop:16,height:172,borderRadius:16,backgroundColor:'#F5F5F5',alignItems:'center',justifyContent:'center',gap:12},label:{fontFamily:'PretendardBold',fontSize:17,lineHeight:26,color:'#212121'},or:{marginTop:16,textAlign:'center',fontFamily:'Pretendard',fontSize:13,lineHeight:20,color:'#707070'},inviteCard:{marginTop:24,padding:20,borderRadius:16,backgroundColor:'#F5F5F5',gap:12},inviteHeading:{flexDirection:'row',alignItems:'center',gap:4},copyIcon:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22},copied:{backgroundColor:'#E4EFE7'},action:{width:'100%',minHeight:48,borderRadius:24,backgroundColor:'#FFF',justifyContent:'center',alignItems:'center'},actionText:{fontFamily:'PretendardBold',fontSize:14,color:'#176B38'},share:{backgroundColor:'#176B38'},shareText:{color:'#FFF'},disabled:{opacity:0.4},note:{fontFamily:'Pretendard',fontSize:13,lineHeight:20,color:'#707070',marginTop:12},later:{minHeight:48,marginTop:8,justifyContent:'center',alignItems:'center'},laterText:{fontFamily:'Pretendard',fontSize:15,lineHeight:21.75,color:'#222'}});
