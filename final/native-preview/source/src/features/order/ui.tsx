import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import color from './native-colors.json';
import icons from './icons.json';
import figma from './native-figma.json';

// Values mirror DESIGN.md and src/styles/tokens.css in the web app.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 14, md: figma.radius, lg: figma.radius, full: 999 };
export const type = StyleSheet.create({
  heading: { fontFamily: 'PretendardMedium', fontSize: 22, letterSpacing: -0.44, lineHeight: 22 * 1.3, color: color['on-surface'] },
  display: { fontFamily: 'PretendardMedium', fontSize: 30, letterSpacing: -0.9, lineHeight: 30 * 1.25, color: color['on-surface'] },
  title: { fontFamily: 'PretendardBold', fontSize: 17, letterSpacing: -0.17, lineHeight: 17 * 1.4, color: color['on-surface'] },
  body: { fontFamily: 'PretendardMedium', fontSize: 16, letterSpacing: -0.16, lineHeight: 16 * 1.45, color: color['on-surface'] },
  label: { fontFamily: 'PretendardMedium', fontSize: 14, letterSpacing: -0.14, lineHeight: 14 * 1.4, color: color['on-surface'] },
  tiny: { fontFamily: 'PretendardMedium', fontSize: figma.tinySize, lineHeight: figma.tinyLine, color: color.secondary },
  note: { fontFamily: 'Pretendard', fontSize: 13, letterSpacing: -0.13, lineHeight: 13 * 1.45, color: color.secondary },
});
export function Icon({ name }: { name: keyof typeof icons }) { return <SvgXml xml={icons[name]} color={color['on-surface']} />; }
export function IconButton({ name, label, onPress, disabled = false, neutral = false, bare = false }: { name: keyof typeof icons; label: string; onPress: () => void; disabled?: boolean; neutral?: boolean; bare?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.iconButton, neutral && s.neutral, bare && { backgroundColor: figma.transparent }, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}><Icon name={name} /></Pressable>;
}
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[s.card, style]}>{children}</View>; }
export function Divider({ dashed = false }: { dashed?: boolean }) { return <View style={[s.divider, dashed && s.dashed]} />; }
export function Price({ value, large = false }: { value: number; large?: boolean }) { return <View style={s.price}><Text style={large ? type.label : type.tiny}>EUR</Text><Text style={large ? type.display : type.label}>{value.toFixed(2)}</Text></View>; }
export function Avatar({ name, index = 0, size = 40 }: { name: string; index?: number; size?: number }) { const colors = [color['person-1'], color['person-2'], color['person-3'], color['person-4']]; return <View style={[s.avatar, { backgroundColor: colors[index % colors.length], width: size, height: size }]}><Text style={size === 32 ? type.note : type.label}>{name.slice(0, 1)}</Text></View>; }
export function Photo({ uri, height = figma.menuPhotoHeight, contain = false }: { uri: string | null; height?: number; contain?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  return uri && failed !== uri ? <Image source={{ uri }} resizeMode={contain ? 'contain' : 'cover'} style={{ height, width: '100%', backgroundColor: contain ? color.surface : color.neutral }} onError={() => setFailed(uri)} /> : <View style={[s.photo, { height }]}><Text style={type.note}>{uri ? '사진을 불러오지 못했어요' : '사진 준비 중'}</Text></View>;
}
export function AICard({ title, source, children }: { title: string; source: string; children: ReactNode }) {
  return <LinearGradient colors={[color['ai-gradient-start'], color['ai-gradient-mid'], color['ai-gradient-end']]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.aiBorder}><View style={s.aiSurface}><LinearGradient colors={[figma.aiTintStart, figma.aiTintEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.aiCard}><View style={s.row}><LinearGradient colors={[color['ai-gradient-mid'], color['ai-gradient-end']]} style={s.aiIcon}><Icon name="ai" /></LinearGradient><Text style={[type.title, s.flex]}>{title}</Text></View>{children}<Text accessibilityLabel={source} style={s.srOnly}>{source}</Text></LinearGradient></View></LinearGradient>;
}
export function InfoNote({ children }: { children: ReactNode }) { return <View style={s.info}><Icon name="info" /><Text style={[type.note, s.flex, { color: color['info-text'] }]}>{children}</Text></View>; }
const s = StyleSheet.create({
  flex: { flex: 1 }, row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  card: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space.xl, gap: space.lg },
  iconButton: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: color.surface, justifyContent: 'center', alignItems: 'center' }, neutral: { backgroundColor: color.neutral },
  divider: { borderTopWidth: 1, borderColor: color.border }, dashed: { borderStyle: 'dashed' }, price: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  avatar: { width: 40, height: 40, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  photo: { backgroundColor: color.neutral, justifyContent: 'center', alignItems: 'center' },
  aiBorder: { borderRadius: radius.lg, padding: figma.aiBorder }, aiSurface: { backgroundColor: color.surface, borderRadius: radius.lg - figma.aiBorder, overflow: 'hidden' }, aiCard: { borderRadius: radius.lg - figma.aiBorder, padding: space.xl - figma.aiBorder, gap: space.lg }, srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  aiIcon: { width: 30, height: 30, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  info: { flexDirection: 'row', gap: space.sm, backgroundColor: color['info-bg'], borderRadius: radius.sm, paddingVertical: space.md, paddingHorizontal: space.lg },
});
