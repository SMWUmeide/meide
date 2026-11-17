import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SetupHeader } from '../../components/SetupHeader';
import { selectionStyles as s } from '../../components/selectionStyles';
import { Button, ErrorText } from '../../components/ui';
import { issueInvite, loadCompanions, resolveInvite } from '../../features/companions/api';
import { parseInvite, type Companion } from '../../features/companions/invite';
import { useProgress } from '../../state/ProgressProvider';
import { destination, finishSetup, withCompanions } from '../../state/model';
export default function AcceptInvitation() {
  const params=useLocalSearchParams<{code:string}>();
  const code=Array.isArray(params.code) ? params.code[0] : params.code;
  return <InviteContent key={code} code={code} />;
}
function InviteContent({code}: {code:string}) {
  const {progress,save,busy,error}=useProgress();
  const [sender,setSender]=useState<Companion | null>(null);
  const [message,setMessage]=useState<string | null>(null);
  const [acting,setActing]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;
    resolveInvite(code ?? '').then(person=>{if(active)setSender(person);}).catch(e=>{if(active)setMessage(e.message);});
    return ()=>{active=false;};
  },[code,attempt]);
  async function leave() {
    if(await save({...progress,pendingInvite:undefined})) router.replace(destination(progress));
  }
  async function accept() {
    if (acting || busy || !sender) return;
    setActing(true); setMessage(null);
    try {
      const invite=parseInvite(code);
      if(progress.stage !== 'companions' && progress.stage !== 'home') {
        if(await save({...progress,pendingInvite:invite})) router.replace(destination(progress));
        return;
      }
      await issueInvite(progress.profileId!,progress.profileToken!,progress.name);
      const people=await loadCompanions(progress.profileId!,progress.profileToken!,'accept',{code:invite});
      if(await save(finishSetup(withCompanions(progress,people), 'selected'))) router.replace('/home');
    } catch(e) {setMessage((e as Error).message);}
    finally {setActing(false);}
  }
  const self=sender?.id===progress.profileId;
  return <SafeAreaView style={s.safe}><View style={s.page}><SetupHeader title="동반인 초대" disabled={acting || busy} onBack={()=>void leave()} /><ScrollView contentContainerStyle={[s.content,{gap:20}]}>
    {sender ? <><Text style={s.title}>{`${sender.name}님이 초대했어요`}</Text><Text style={s.description}>{self ? '내 초대 링크예요. 동반인에게 보내주세요.' : '초대를 수락하면 서로 동반인으로 연결돼요.'}</Text>
      {self ? <Button title="돌아가기" onPress={()=>void leave()} /> : <Button title={(progress.stage === 'companions' || progress.stage === 'home') ? '초대 수락' : '시작하기'} disabled={acting || busy} onPress={()=>void accept()} />}
      {!self && <Pressable accessibilityRole="button" disabled={acting || busy} onPress={()=>void leave()} style={{minHeight:48,alignItems:'center',justifyContent:'center'}}><Text style={s.chipTextCustom}>나중에</Text></Pressable>}
    </> : !message ? <ActivityIndicator accessibilityLabel="초대 확인 중" /> : null}
    <ErrorText message={message ?? error} />{message && !sender && <Button title="다시 시도" onPress={()=>{setMessage(null);setAttempt(n=>n+1);}} />}
  </ScrollView></View></SafeAreaView>;
}
