import { Pressable, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { backIcon } from './backIcon';
import { selectionStyles as s } from './selectionStyles';
export function SetupHeader({ title, onBack, disabled = false }: {title: string; onBack: () => void; disabled?: boolean}) {
  return <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="뒤로" disabled={disabled} style={s.back} onPress={onBack}><SvgXml xml={backIcon} /></Pressable><Text style={s.heading}>{title}</Text></View>;
}
