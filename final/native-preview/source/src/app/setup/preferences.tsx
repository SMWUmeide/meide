import { selectionStyles as s } from '../../components/selectionStyles';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { searchIcon } from '../../components/searchIcon';
import { backIcon } from '../../components/backIcon';
import { Button, ErrorText } from '../../components/ui';
import { allergens } from '../../features/allergies/catalog';
import { searchAllergens } from '../../features/allergies/search';
import { useProgress } from '../../state/ProgressProvider';
import { destination } from '../../state/model';

export default function AllergySelection() {
  const { progress, save, busy, error } = useProgress();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState<string[]>(() => (progress.allergyIds ?? []).filter(id => allergens.some(item => item.id === id)));
  const [none, setNone] = useState(progress.allergyStatus === 'none');
  const [saved, setSaved] = useState(false);
  if (progress.stage !== 'preferences') return <Redirect href={destination(progress)} />;
  const results = searchAllergens(query);
  const choices = selected.map(id => allergens.find(item => item.id === id)!);
  function toggle(id: string) {
    setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    setNone(false); setSaved(false);
  }
  async function persist() {
    if (!none && !selected.length) return;
    setSaved(await save({ ...progress, allergyIds: none ? [] : selected, allergyStatus: none ? 'none' : 'selected', stage: 'foods' }));
  }
  return <SafeAreaView style={s.safe}>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.page}>
        <View style={s.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="이름 입력으로 돌아가기" disabled={busy} onPress={() => void save({ ...progress, stage: 'name' })} style={s.back}><SvgXml xml={backIcon} /></Pressable>
          <Text style={s.heading}>알레르기 설정</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
          <Text accessibilityRole="header" style={s.title}>알레르기가 있나요?</Text>
          <Text style={s.description}>피해야 할 재료를 검색하고 선택해 주세요.</Text>
          <View style={[s.searchBox, focused && s.focused]}>
            <View style={{ marginLeft: 16 }}><SvgXml xml={searchIcon} /></View><TextInput accessibilityLabel="알레르기 식품 검색" placeholder="예: 땅콩, 우유, 새우" placeholderTextColor="#808080" value={query} onChangeText={setQuery} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoCorrect={false} autoCapitalize="none" selectionColor="#176B38" cursorColor="#176B38" underlineColorAndroid="transparent" style={s.input} />
            {!!query && <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => setQuery('')} style={s.clear}><Text style={s.clearText}>×</Text></Pressable>}
          </View>
          {!!query.trim() && <View style={s.results}>
            
            {results.map(item => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(item.id), disabled: busy }} accessibilityLabel={item.name} disabled={busy} onPress={() => { if (!selected.includes(item.id)) toggle(item.id); setQuery(''); }} style={s.result}>
              <View><Text style={s.resultName}>{item.name}</Text></View>
              <Text style={s.checked}>{selected.includes(item.id) ? '✓' : ''}</Text>
            </Pressable>)}
          </View>}
          <Text style={s.section}>선택한 재료  {choices.length}</Text>
          <View style={s.chips}>{choices.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name} 선택 해제`} disabled={busy} onPress={() => toggle(item.id)} style={s.chip}><Text style={s.chipText}>{item.name}  ×</Text></Pressable>)}</View>
        </ScrollView>
        <View style={s.footer}>
          <ErrorText message={error} />
          {saved && <Text accessibilityLabel="저장 완료" style={s.saved}>✓</Text>}
          <Button title="다음" disabled={busy || saved || (!none && !selected.length)} onPress={() => void persist()} />
          <Pressable accessibilityRole="button" disabled={busy} onPress={async () => { setNone(true); setSelected([]); setSaved(await save({ ...progress, allergyIds: [], allergyStatus: 'none', stage: 'foods' })); }} style={{ minHeight: 48, marginTop: 8, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'Pretendard', fontSize: 15, lineHeight: 21.75, letterSpacing: -0.15, color: '#222' }}>알레르기 없어요</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
