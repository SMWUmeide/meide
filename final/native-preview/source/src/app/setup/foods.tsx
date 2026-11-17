import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { backIcon } from '../../components/backIcon';
import { selectionStyles as s } from '../../components/selectionStyles';
import { Button, ErrorText } from '../../components/ui';
import { cleanFood, foodKey } from '../../features/foods/catalog';
import { useProgress } from '../../state/ProgressProvider';
import { destination } from '../../state/model';

export default function FoodSelection() {
  const { progress, save, busy, error } = useProgress();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(progress.avoidedFoods ?? []);
  const [saved, setSaved] = useState(false);
  if (progress.stage !== 'foods') return <Redirect href={destination(progress)} />;
  const typed = cleanFood(query);
  const pending = typed && !selected.some(item => foodKey(item) === foodKey(typed)) ? [...selected, typed] : selected;
  function select() { setSelected(pending); setQuery(''); setSaved(false); }
  async function persist(none = false) {
    if (busy || (!none && !pending.length)) return;
    const foods = none ? [] : pending;
    const ok = await save({ ...progress, stage: 'companions', avoidedFoods: foods, foodStatus: none ? 'none' : 'selected' });
    if (ok) { setSelected(foods); setQuery(''); setSaved(true); }
  }
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={s.page}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="알레르기 설정으로 돌아가기" disabled={busy} style={s.back} onPress={() => void save({ ...progress, stage: 'preferences' })}><SvgXml xml={backIcon} /></Pressable><Text style={s.heading}>못 먹는 음식 설정</Text></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <Text accessibilityRole="header" style={s.title}>못 먹는 음식이 있나요?</Text>
      <Text style={s.description}>알레르기 외에 꺼리는 음식도 알려주세요.</Text>
      <View style={[s.searchBox, focused && s.focused]}>
        <TextInput accessibilityLabel="못 먹는 음식 입력" placeholder="예: 고수, 가지, 올리브" placeholderTextColor="#808080" maxLength={40} value={query} onChangeText={value => { setQuery(value); setSaved(false); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoCorrect={false} autoCapitalize="none" selectionColor="#176B38" cursorColor="#176B38" underlineColorAndroid="transparent" returnKeyType="done" onSubmitEditing={() => { if (typed && !busy) select(); }} editable={!busy} style={s.input} />
        {!!typed && <Pressable accessibilityRole="button" accessibilityLabel="음식 추가" disabled={busy} onPress={select} style={{ minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={s.chipTextCustom}>추가</Text></Pressable>}
      </View>
      <Text style={s.section}>선택한 음식  {selected.length}</Text>
      <View style={s.chips}>{selected.map(name => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${name} 선택 해제`} disabled={busy} style={s.chip} onPress={() => { setSelected(current => current.filter(item => item !== name)); setSaved(false); }}><Text style={s.chipText}>{name}  ×</Text></Pressable>)}</View>
    </ScrollView>
    <View style={s.footer}><ErrorText message={error} />{saved && <Text accessibilityLabel="저장 완료" style={s.saved}>✓</Text>}<Button title="다음" disabled={busy || saved || !pending.length} onPress={() => void persist()} />
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void persist(true)} style={{ minHeight: 48, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'Pretendard', fontSize: 15, lineHeight: 21.75, letterSpacing: -0.15, color: '#222' }}>해당 없어요</Text></Pressable>
    </View>
  </View></KeyboardAvoidingView></SafeAreaView>;
}
