import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import color from '../features/order/native-colors.json';
import figma from '../features/order/native-figma.json';
export function Button({ title, onPress, disabled = false, style, variant = 'primary' }: { title: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; variant?: 'primary' | 'secondary' }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, variant === 'secondary' && styles.secondary, style, { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 }]}><Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryText]}>{title}</Text></Pressable>;
}
export function ErrorText({ message }: { message: string | null }) {
  return message ? <View accessibilityLiveRegion="polite"><Text style={styles.error}>{message}</Text></View> : null;
}
export const styles = StyleSheet.create({
  button: { minHeight: figma.buttonHeight, borderRadius: figma.radius, backgroundColor: color.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  buttonText: { fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 24, color: color['on-primary'] },
  secondary: { backgroundColor: color.surface }, secondaryText: { color: color['on-surface'] },
  error: { fontFamily: 'Pretendard', fontSize: 14, color: color.error, textAlign: 'center', padding: 8 },
});
