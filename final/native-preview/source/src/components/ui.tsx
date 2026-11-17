import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
export function Button({ title, onPress, disabled = false, style }: { title: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, style, { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 }]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
export function ErrorText({ message }: { message: string | null }) {
  return message ? <View accessibilityLiveRegion="polite"><Text style={styles.error}>{message}</Text></View> : null;
}
export const styles = StyleSheet.create({
  button: { minHeight: 64, borderRadius: 32, backgroundColor: '#212121', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  buttonText: { fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 24, color: '#FFF' },
  error: { fontFamily: 'Pretendard', fontSize: 14, color: '#B42318', textAlign: 'center', padding: 8 },
});
