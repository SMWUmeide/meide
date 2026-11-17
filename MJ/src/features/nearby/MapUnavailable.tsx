import { StyleSheet, Text, View } from 'react-native';

export function MapUnavailable({message='지도를 연결하지 못했어요. 아래 목록에서 주변 식당을 확인할 수 있어요.'}:{message?:string}) {
  return <View style={s.box}><Text accessibilityLiveRegion="polite" style={s.text}>{message}</Text></View>;
}
const s=StyleSheet.create({box:{flex:1,alignItems:'center',justifyContent:'center',padding:45,backgroundColor:'#E8ECEA'},text:{fontFamily:'Pretendard',fontSize:13,lineHeight:21,color:'#626773',textAlign:'center'}});
