import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, ErrorText } from '../../components/ui';
import { OrderingScreen } from '../../features/ordering/OrderingScreen';
import { useProgress } from '../../state/ProgressProvider';
import { destination } from '../../state/model';
export default function JoinOrder(){
 const {token}=useLocalSearchParams<{token:string}>();
 const {progress,save,busy,error}=useProgress();
 if(!/^[a-f0-9]{64}$/.test(token??''))return <Redirect href="/home"/>;
 async function start(){if(await save({...progress,pendingOrderInvite:token}))router.replace(destination(progress));}
 if(progress.stage!=='home')return <View style={{flex:1,justifyContent:'center',padding:24,gap:24}}><Button title="함께 메뉴 고르기 시작" disabled={busy} onPress={()=>void start()}/><ErrorText message={error}/></View>;
 // Consume the saved invitation before mounting, so exiting never reopens it.
 if(progress.pendingOrderInvite)return <View style={{flex:1,justifyContent:'center',padding:24,gap:24}}><Button title="초대 메뉴 확인" disabled={busy} onPress={()=>void save({...progress,pendingOrderInvite:undefined})}/><ErrorText message={error}/></View>;
 return <OrderingScreen key={token} invite={token}/>;
}
