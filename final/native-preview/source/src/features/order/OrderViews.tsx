import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Button, ErrorText } from '../../components/ui';
import type { MenuBoard, MenuItem } from './menu-schema';
import { orderText, totals, type OrderLine } from './order-model';
import { AICard, Avatar, Card, Divider, Icon, IconButton, InfoNote, Photo, Price, radius, space, type as t } from './ui';
import color from './native-colors.json';
import figma from './native-figma.json';

export function DetailContent({ item, source }: { item: MenuItem; source: MenuBoard['source'] }) {
  const [confirm, setConfirm] = useState(false);
  return <View style={s.stack}>
    {item.photo && <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(item.photo!.page)}><Text style={t.note}>사진: {item.photo.photographer} · {item.photo.provider === 'pixabay' ? 'Pixabay' : 'Pexels'}</Text></Pressable>}
    <View style={s.smallStack}><Text style={t.tiny}>{item.originalName}</Text><Text style={t.heading}>{item.name}</Text><Price value={item.priceEur} /></View>
    <AICard title="한국 음식으로 치면" source={source === 'demo' ? 'AI 설명의 예시예요. 실제 분석 결과는 아니에요.' : 'AI가 한국 음식에 빗대어 설명했어요. 실제와 다를 수 있어요.'}><Text style={t.title}>{item.analogy}</Text><Text style={t.body}>{item.description}</Text></AICard>
    <Card style={{ gap: space.sm }}><View style={s.row}><View style={s.verified}><Icon name="verified" /></View><View style={s.flex}><Text style={t.title}>메뉴판에 적힌 정보</Text><Text style={t.note}>메뉴판에서 읽었어요. 원문과 함께 확인해 주세요.</Text></View></View><Divider /><Text style={t.note}>재료</Text><View style={s.tags}>{item.ingredients.length ? item.ingredients.map(ingredient => <View key={ingredient.original} style={s.tag}><Text style={t.note}>{ingredient.name} · {ingredient.original}</Text></View>) : <Text style={t.body}>메뉴 이름 외 재료는 직원에게 확인해 주세요.</Text>}</View>{item.ingredients.some(i => i.original === 'farro') && <Text style={t.note}>보리처럼 톡톡 씹히는 고대 밀</Text>}<Divider /><Text style={t.note}>알레르기</Text><Text style={t.body}>{item.allergen}</Text></Card>
    <AICard title="AI가 추정한 정보" source="AI가 일반 레시피로 추정했어요. 식당의 조리법과 다를 수 있어요."><Divider /><Text style={s.aiLabel}>들어갔을 수 있는 재료</Text><View style={s.tags}>{item.estimated.length ? item.estimated.map(name => <View style={s.tag} key={name}><Text style={t.note}>{name}</Text></View>) : <Text style={t.body}>상세 재료는 직원에게 확인해 주세요.</Text>}</View><Divider /><Text style={s.aiLabel}>조리법</Text><Text style={t.body}>{item.method}</Text><Divider /><Text style={s.aiLabel}>알레르기 가능성</Text><Pressable accessibilityRole="button" accessibilityLabel="직원에게 확인하는 문장 보기" onPress={() => setConfirm(true)} style={s.confirmButton}><Text style={t.body}>{item.possibleAllergen}</Text></Pressable></AICard>
    <Modal visible={confirm} animationType="slide" transparent onRequestClose={() => setConfirm(false)}><View style={s.modalBackdrop}><SafeAreaView edges={['bottom']} style={s.confirmSheet}><View style={s.handle} /><Text style={t.heading}>직원에게 확인해 주세요</Text><Text style={t.body}>이 메뉴에 우유나 치즈가 들어가나요?</Text><Text style={t.heading}>Questo piatto contiene latte o formaggio?</Text><Text style={t.note}>미리 작성한 예시 문장이에요. 다른 알레르기는 따로 확인해 주세요.</Text><Button title="확인했어요" onPress={() => setConfirm(false)} /></SafeAreaView></View></Modal>
  </View>;
}

export function CartGroups({ board, cart, tip, tipRate, personName, onOpen, onQuantity, pending }: { board: MenuBoard; cart: OrderLine[]; tip: boolean; tipRate: number; personName: (person: string) => string; onOpen: (item: MenuItem) => void; onQuantity: (line: OrderLine, delta: number) => void; pending: boolean }) {
  const people = [...new Set(cart.map(line => line.person))].sort((a, b) => a === 'me' ? -1 : b === 'me' ? 1 : 0);
  return <>{people.map((person, index) => {
    const lines = cart.filter(line => line.person === person);
    const total = totals(lines, board.items, tip, tipRate);
    const name = personName(person);
    return <Card key={person}><View style={s.row}><Avatar name={person === 'me' ? '나' : name} index={index} size={32} /><Text style={[t.title, s.flex]}>{person === 'me' ? '내 메뉴' : `${name}님 메뉴`} · {total.count}개</Text></View>{lines.map(line => {
      const item = board.items.find(item => item.id === line.menuId); if (!item) return null;
      return <View style={s.cartItem} key={item.id}><Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 상세 보기`} onPress={() => onOpen(item)} style={s.cartPhoto}><Photo uri={item.detailPhotoUrl ?? item.photoUrl} height={72} contain /></Pressable><View style={[s.flex, s.smallStack]}><Text style={t.tiny} numberOfLines={1}>{item.originalName}</Text><Text style={t.body}>{item.name}</Text><Price value={item.priceEur} />{person === 'me' ? <View style={s.quantity}><IconButton name="minus" bare label={`${item.name} 수량 줄이기`} disabled={pending} onPress={() => onQuantity(line, -1)} /><Text style={t.label}>{line.quantity}</Text><IconButton name="plus" bare label={`${item.name} 수량 늘리기`} disabled={pending || line.quantity >= 20} onPress={() => onQuantity(line, 1)} /></View> : <View style={s.readOnlyQuantity}><Text style={t.note}>수량 {line.quantity}개</Text></View>}</View></View>;
    })}<Divider /><View style={s.between}><Text style={[t.note, s.flex]}>{person === 'me' ? '내 합계' : `${name}님 합계`} ({tip ? '팁 포함' : '팁 제외'})</Text><Price value={total.total} /></View></Card>;
  })}</>;
}

export function Checkout({ count, cover, value, tip, tipRate, setTip, setTipRate, disabled, onOrder }: { count: number; cover: number; value: number; tip: boolean; tipRate: number; setTip: (v: boolean) => void; setTipRate: (v: number) => void; disabled: boolean; onOrder: () => void }) {
  const [rates, setRates] = useState(false);
  return <View style={s.checkout}><View style={s.between}><Pressable accessibilityRole="checkbox" accessibilityLabel="선택 팁 포함" accessibilityState={{ checked: tip }} onPress={() => setTip(!tip)} style={s.tipToggle}><View style={[s.checkbox, tip && s.checked]}>{tip && <Icon name="check" />}</View><Text style={t.body}>선택 팁 포함</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`팁 비율 ${tipRate}% 변경`} disabled={!tip} onPress={() => setRates(!rates)} style={s.rate}><Text style={t.label}>{tipRate}%</Text><Icon name="chevron" /></Pressable></View>{rates && tip && <View style={s.tags}>{[5, 10, 15, 20].map(rate => <Pressable key={rate} accessibilityRole="button" accessibilityState={{ selected: rate === tipRate }} onPress={() => { setTipRate(rate); setRates(false); }} style={s.rate}><Text style={t.label}>{rate}%{rate === tipRate ? ' ✓' : ''}</Text></Pressable>)}</View>}{cover > 0 && <View style={s.between}><Text style={t.note}>자리 준비 요금</Text><Price value={cover} /></View>}<Divider /><View style={s.between}><View style={s.flex}><Text style={t.title}>예상 총액</Text><Text style={t.note}>메뉴{tip ? '+팁' : ''}{cover > 0 ? '+자리 준비 요금' : ''} · 총 {count}개</Text></View><Price value={value} large /></View><Button title="주문 문장 만들기" disabled={disabled} onPress={onOrder} /></View>;
}

const knownRequests: Record<string, string> = { '치즈는 빼주세요': 'Senza formaggio, per favore.', '덜 짜게 해주세요': 'Con poco sale, per favore.', '물 주세요': 'Dell’acqua, per favore.' };
export function OrderSentence({ board, cart, request, setRequest, onReceipt }: { board: MenuBoard; cart: OrderLine[]; request: string; setRequest: (v: string) => void; onReceipt: () => void }) {
  const [translation, setTranslation] = useState({ input: '', text: '' });
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const input = request.trim();
  const known = knownRequests[input];
  const translated = known ?? (translation.input === input ? translation.text : '');
  const pending = Boolean(input && !translated);
  const phrase = orderText(board.items, cart);
  const italian = `${phrase.italian}${translated ? ` ${translated}` : ''}`;
  useEffect(() => {
    if (!input || known) return;
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    const timer = setTimeout(async () => {
      const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 25000);
      try {
        const origin = process.env.EXPO_PUBLIC_MEIDE_API_URL || 'https://meide-meide1.vercel.app';
        const response = await fetch(new URL('/api/translate-request', origin).toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: input }), signal: controller.signal });
        const json = await response.json();
        if (!response.ok || typeof json.translation !== 'string' || !json.translation.trim() || json.translation.length > 2000) throw new Error();
        if (active) setTranslation({ input, text: json.translation });
      } catch { if (active && (!controller.signal.aborted || timedOut)) setError('요청사항을 번역하지 못했어요. 다시 시도해 주세요.'); }
      finally { clearTimeout(timeout); }
    }, 700);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [input, known, retry]);
  useEffect(() => () => { void Speech.stop(); }, []);
  function listen() {
    if (speaking) { void Speech.stop(); setSpeaking(false); return; }
    setSpeaking(true); setError(null);
    Speech.speak(italian, { language: 'it-IT', onDone: () => setSpeaking(false), onStopped: () => setSpeaking(false), onError: () => { setSpeaking(false); setError('음성을 재생하지 못했어요. 기기의 음성 설정을 확인해 주세요.'); } });
  }
  return <View style={s.flex}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Card><Text style={t.body}>{phrase.korean}{input ? ` ${input}` : ''}</Text><Divider /><Text style={t.heading}>{italian}</Text><View style={s.orderActions}><IconButton name="listen" neutral label={speaking ? '듣기 멈추기' : '주문 문장 듣기'} disabled={pending || !phrase.italian} onPress={listen} /><IconButton name="expand" neutral label="주문 문장 확대" disabled={pending || !phrase.italian} onPress={() => setExpanded(true)} /></View></Card><Card><Text style={t.title}>요청사항</Text><TextInput multiline maxLength={500} accessibilityLabel="요청사항" value={request} placeholder={'입력하면 주문 문장에 바로 반영돼요.\n예: 치즈는 빼주세요'} placeholderTextColor={color.secondary} onChangeText={value => { void Speech.stop(); setSpeaking(false); setError(null); setRequest(value); }} style={s.requestInput} />{input && <Text style={t.note}>{pending ? '요청사항을 이탈리아어로 번역하고 있어요.' : '요청사항을 주문 문장에 반영했어요.'}</Text>}{input && !known && <Text style={t.note}>요청사항을 Gemini로 보내 번역해요.</Text>}</Card><ErrorText message={error} />{error && pending && <Button variant="secondary" title="다시 번역하기" onPress={() => { setError(null); setRetry(v => v + 1); }} />}</ScrollView><View style={s.footer}><Button title="영수증 보기" disabled={pending || !phrase.italian} onPress={onReceipt} /></View><Modal visible={expanded} animationType="fade" onRequestClose={() => setExpanded(false)}><SafeAreaView style={s.expanded}><View style={s.expandedClose}><IconButton name="close" label="확대 닫기" neutral onPress={() => setExpanded(false)} /></View><ScrollView contentContainerStyle={s.expandedContent}><Text style={t.display}>{italian}</Text></ScrollView></SafeAreaView></Modal></View>;
}

export function Receipt({ board, cart, tip, tipRate, partySize, cover, units, onHome, onMore }: { board: MenuBoard; cart: OrderLine[]; tip: boolean; tipRate: number; partySize: number; cover: number; units: number; onHome: () => void; onMore: () => void }) {
  const [createdAt] = useState(() => new Date());
  const total = totals(cart, board.items, tip, tipRate);
  const date = `${createdAt.getFullYear()}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`;
  const water = cart.some(line => board.items.some(item => item.id === line.menuId && item.kind === 'water' && item.priceEvidence));
  return <ScrollView contentContainerStyle={s.content}><Text style={t.heading}>계산서에 붙을 금액을{'\n'}미리 정리했어요</Text><Card style={s.receiptCard}><View style={s.smallStack}><Text style={t.title}>{board.restaurantName}</Text><Text style={t.note}>{date}{partySize ? ` · ${partySize}명` : ''}</Text></View><Divider dashed />{cart.map(line => { const item = board.items.find(item => item.id === line.menuId); return item ? <View key={`${line.person}-${line.menuId}`} style={s.between}><Text style={[t.body, s.flex]}>{item.name}{line.quantity > 1 ? ` × ${line.quantity}` : ''}</Text><Price value={item.priceEur * line.quantity} /></View> : null; })}<Divider dashed />{cover > 0 && <><View style={s.between}><Text style={[t.body, s.flex]}>{board.coverCharge?.name} · {units}{board.coverCharge?.basis === 'per_person' ? '명' : '테이블'}</Text><Price value={cover} /></View><Text style={t.note}>메뉴판 원문: {board.coverCharge?.evidence}</Text><InfoNote>메뉴판에 적힌 자리 준비 요금만 표시된 부과 단위에 맞춰 반영했어요. 선택 팁과는 구분해요.</InfoNote></>}{water && <InfoNote>물값은 지역 관습으로 추가하지 않고, 메뉴판의 가격과 담은 수량만 반영했어요.</InfoNote>}<View style={s.between}><Text style={t.body}>선택 팁 {tip ? tipRate : 0}%</Text><Price value={total.tip} /></View><Divider /><View style={s.between}><View style={s.flex}><Text style={t.title}>예상 합계</Text><Text style={t.note}>{cover ? '확인된 자리 준비 요금 포함' : '확인되지 않은 추가 요금 제외'}</Text></View><Price value={Math.round((total.total + cover) * 100) / 100} large /></View></Card><Text style={[t.note, s.center]}>식당이 발행한 영수증이 아니에요. 실제 계산서와 다를 수 있어요.</Text><View style={s.receiptActions}><Button title="홈으로 가기" onPress={onHome} /><Button title="추가 주문하기" variant="secondary" onPress={onMore} /></View></ScrollView>;
}
const s = StyleSheet.create({
  flex: { flex: 1 }, content: { padding: space.xl, gap: space.xl, paddingBottom: space.xxl }, stack: { gap: space.xl }, smallStack: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }, tag: { borderWidth: 1, borderColor: color.border, borderRadius: radius.full, paddingHorizontal: space.lg, paddingVertical: space.sm },
  verified: { width: 30, height: 30, borderRadius: radius.full, backgroundColor: color.primary, justifyContent: 'center', alignItems: 'center' }, white: { ...t.body, color: color['on-primary'] }, aiLabel: { ...t.note, color: color['ai-text'] },
  confirmButton: { minHeight: 44, justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: color.primary, justifyContent: 'flex-end' }, confirmSheet: { padding: space.xl, gap: space.lg, backgroundColor: color.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }, handle: { width: 40, height: 5, borderRadius: radius.full, backgroundColor: color.border, alignSelf: 'center' },
  cartItem: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg }, cartPhoto: { width: 72, height: 72, overflow: 'hidden', borderRadius: figma.photoRadius },
  quantity: { height: figma.quantityHeight, flexDirection: 'row', alignItems: 'center', gap: 0, backgroundColor: color.neutral, borderRadius: radius.full, alignSelf: 'flex-start', marginTop: space.xs }, readOnlyQuantity: { alignSelf: 'flex-start', borderRadius: radius.full, backgroundColor: color.neutral, paddingHorizontal: space.lg, paddingVertical: space.sm },
  checkout: { flexShrink: 0, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: color.surface, paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xxl, gap: space.lg, boxShadow: figma.sheetShadow },
  tipToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.sm }, checkbox: { width: 24, height: 24, borderRadius: figma.checkboxRadius, borderWidth: 1, borderColor: color.primary, justifyContent: 'center', alignItems: 'center' }, checked: { backgroundColor: color.primary }, rate: { minHeight: 44, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: color.neutral, borderRadius: radius.sm },
  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm }, requestInput: { ...t.note, color: color['on-surface'], minHeight: figma.requestHeight, textAlignVertical: 'top', padding: space.lg, borderRadius: figma.photoRadius, backgroundColor: color.neutral },
  footer: { paddingHorizontal: space.xl, paddingBottom: space.xxl, paddingTop: space.xl }, expanded: { flex: 1, backgroundColor: color.surface, padding: space.xl }, expandedContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: space.xxl }, expandedClose: { alignSelf: 'flex-end' }, receiptCard: { gap: space.xl }, receiptActions: { gap: space.sm, marginTop: space.xl }, center: { textAlign: 'center' },
});
