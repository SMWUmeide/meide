import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/ui';
import colors from '../order/native-colors.json';

export function PlayReviewCode({ busy, onApply }: { busy: boolean; onApply: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const code = draft.trim();
  const valid = /^[A-Za-z0-9_-]{32,64}$/.test(code);
  const apply = () => {
    if (busy || !valid) return;
    setDraft('');
    setOpen(false);
    onApply(code);
  };
  return <View style={styles.container}>
    {open ? <>
      <TextInput accessibilityLabel="Google Play 심사 코드" autoCapitalize="none" autoCorrect={false}
        maxLength={64} onChangeText={setDraft} onSubmitEditing={apply} placeholder="Google Play 심사 코드"
        placeholderTextColor={colors.secondary} secureTextEntry style={styles.input} value={draft} />
      <Button title="피렌체 예시 위치로 검색" disabled={busy || !valid} onPress={apply} style={styles.submit} />
    </> : <Text accessibilityRole="button" onPress={() => setOpen(true)} style={styles.link}>Google Play 심사 코드 입력</Text>}
  </View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, gap: 8, paddingHorizontal: 24, paddingVertical: 8 },
  input: { minHeight: 44, borderRadius: 20, paddingHorizontal: 16, backgroundColor: colors.neutral, color: colors['on-surface'], fontFamily: 'PretendardMedium', fontSize: 16 },
  link: { minHeight: 44, paddingVertical: 12, textAlign: 'center', color: colors.secondary, fontFamily: 'PretendardMedium', fontSize: 14, lineHeight: 20 },
  submit: { minHeight: 56, borderRadius: 20 },
});
