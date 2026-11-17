import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { backIcon } from '../../components/backIcon';
import { Button, ErrorText } from '../../components/ui';
import { useProgress } from '../../state/ProgressProvider';
import { destination } from '../../state/model';
export default function NameEntry() {
  const { progress, busy, error, save } = useProgress();
  const [name, setName] = useState(progress.name);
  const [focused, setFocused] = useState(false);
  if (progress.stage !== 'name') return <Redirect href={destination(progress)} />;
  const submit = () => { if (name.trim()) void save({ ...progress, name: name.trim(), stage: 'preferences' }); };
  return <SafeAreaView style={[s.safe, { paddingTop: Platform.OS === 'web' ? 54 : 0, paddingBottom: Platform.OS === 'web' ? 23 : 0 }]}><KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
    <View style={s.page}>
      <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="소개 화면으로 돌아가기" disabled={busy} onPress={() => void save({ ...progress, name, stage: 'intro' })} style={s.back}><SvgXml xml={backIcon} /></Pressable><Text style={s.heading}>이름 입력</Text></View>
      <View style={s.body}><Text accessibilityRole="header" style={s.title}>어떻게 불러드릴까요?</Text><Text style={s.description}>여행에서 사용할 이름을 입력해 주세요.</Text>
        <TextInput accessibilityLabel="이름" value={name} onChangeText={setName} placeholder="이름을 입력해 주세요" placeholderTextColor="#808080" maxLength={20} autoCorrect={false} returnKeyType="next" onSubmitEditing={submit} selectionColor="#176B38" cursorColor="#176B38" selectionHandleColor="#176B38" underlineColorAndroid="transparent" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[s.input, focused && s.inputFocused]} />
      </View>
      <View style={s.footer}><ErrorText message={error} /><Button title="다음" disabled={busy || !name.trim()} onPress={submit} /></View>
    </View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' }, scroll: { flexGrow: 1, alignItems: 'center' }, page: { flexGrow: 1, width: '100%', maxWidth: 480 }, header: { height: 44, marginTop: 16, marginHorizontal: 24, alignItems: 'center', justifyContent: 'center' }, back: { position: 'absolute', left: -10, padding: 10, width: 44, height: 44 }, heading: { fontFamily: 'PretendardBold', fontSize: 17, color: '#111' }, body: { marginTop: 28, paddingHorizontal: 24 }, title: { fontFamily: 'PretendardMedium', fontSize: 22, lineHeight: 29, color: '#212121' }, description: { fontFamily: 'Pretendard', fontSize: 16, lineHeight: 24, color: '#646873', marginTop: 4 }, inputFocused: { borderColor: '#176B38' }, input: { borderWidth: 2, borderColor: 'transparent', outlineColor: '#176B38', marginTop: 32, minHeight: 48, borderRadius: 8, paddingHorizontal: 16, backgroundColor: '#F2F2F2', fontFamily: 'Pretendard', fontSize: 16, color: '#212121' }, footer: { marginTop: 'auto', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
});
