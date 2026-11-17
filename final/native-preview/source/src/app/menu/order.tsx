import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../../components/ui';
import { useMenuPhotos } from '../../features/menu-camera/MenuPhotosProvider';
import { analyzePhotos } from '../../features/order/analyze';
import type { MenuBoard, MenuItem } from '../../features/order/menu-schema';
import { changeQuantity, orderText, totals, type OrderLine } from '../../features/order/order-model';
import color from '../../features/order/native-colors.json';
import { useProgress } from '../../state/ProgressProvider';
import { useSharedOrder } from '../../features/order/use-shared';

type Screen = 'confirm' | 'menu' | 'detail' | 'cart' | 'order';
function MenuPhoto({ uri }: { uri: string | null }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = Boolean(uri && failedUri === uri);
  return uri && !failed ? <Image source={{ uri }} style={s.photo} onError={() => setFailedUri(uri)} /> : <View style={s.photo}><Text style={s.note}>{failed ? '사진을 불러오지 못했어요' : '사진 준비 중'}</Text></View>;
}
export default function OrderScreen() {
  const { photos } = useMenuPhotos();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const { progress } = useProgress();
  const [screen, setScreen] = useState<Screen>('confirm');
  const [board, setBoard] = useState<MenuBoard | null>(null);
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [tip, setTip] = useState(false);
  const [tipRate, setTipRate] = useState(10);
  const [partySize, setPartySize] = useState(0);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const openedInvite = useRef(false);
  const autoStarted = useRef(false);
  const shared = useSharedOrder(invite, progress.name, (next, lines) => { setBoard(next); setCart(lines); setCategory(old => old || next.categories[0].id); if (invite && !openedInvite.current) { openedInvite.current = true; setScreen('menu'); } });
  useEffect(() => () => controller.current?.abort(), []);
  async function start() {
    if (controller.current) return;
    const current = new AbortController(); controller.current = current; setBusy(true); setError(null);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; current.abort(); }, 80_000);
    try {
      const result = await analyzePhotos(photos, current.signal);
      if (current.signal.aborted) return;
      setBoard(result); setCart([]); setCategory(result.categories[0].id); setScreen('menu');
    } catch (e) { if (timedOut) setError('응답 시간이 초과됐어요. 다시 시도해 주세요.'); else if (!current.signal.aborted) setError(e instanceof Error ? e.message : '분석에 실패했어요.'); }
    finally { clearTimeout(timer); if (controller.current === current) { controller.current = null; setBusy(false); } }
  }
  useEffect(() => { if (!invite && photos.length && !autoStarted.current) { autoStarted.current = true; void start(); } });
  function back() {
    if (busy) { controller.current?.abort(); controller.current = null; setBusy(false); }
    if (screen === 'confirm') router.back();
    else if (screen === 'detail' || screen === 'cart') setScreen('menu');
    else if (screen === 'order') setScreen('cart');
    else setScreen('confirm');
  }
  function toggle(item: MenuItem) {
    if (shared.room) { void shared.mutate(item.id, cart.some(line => line.menuId === item.id && line.person === 'me') ? 'remove' : 'add'); return; }
    setCart(current => current.some(line => line.menuId === item.id && line.person === 'me')
      ? current.filter(line => !(line.menuId === item.id && line.person === 'me'))
      : [...current, { menuId: item.id, person: 'me', quantity: 1 }]);
  }
  const total = totals(cart, board?.items ?? [], tip, tipRate);
  const charge = board?.coverCharge;
  const units = charge?.basis === 'per_table' ? 1 : charge?.basis === 'per_person' ? partySize : 0;
  const cover = total.count && charge?.priceEur != null && charge.evidence.trim() ? Math.round(charge.priceEur * units * 100) / 100 : 0;
  const finalTotal = Math.round((total.total + cover) * 100) / 100;
  const phrase = orderText(board?.items ?? [], cart);
  return <SafeAreaView style={s.screen}><View style={s.layout}><ScrollView contentContainerStyle={[s.content, (screen === 'menu' && total.count > 0) && s.dockSpace]}>
    <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" onPress={back} style={s.back}><Text style={s.title}>‹</Text></Pressable>
    {screen === 'confirm' && <><Text style={s.heading}>메뉴판을 분석하고 있어요</Text><Text style={s.body}>사진 {photos.length}장을 읽고 있어요.</Text><ErrorText message={error || shared.error} />{busy ? <ActivityIndicator /> : error ? <Button title="다시 분석하기" onPress={() => void start()} disabled={!photos.length || photos.length > 6} /> : null}</>}
    {board && screen === 'menu' && <>
      <Text style={s.heading}>{board.restaurantName}</Text><Text style={s.body}>메뉴를 선택해 주세요</Text>
      <ErrorText message={shared.error} />
      {board.skipped > 0 && <Text style={s.note}>가격을 확인하지 못한 메뉴 {board.skipped}개는 제외했어요.</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{board.categories.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: category === item.id }} onPress={() => setCategory(item.id)} style={[s.chip, category === item.id && s.chipSelected]}><Text style={category === item.id ? s.white : s.body}>{item.name}</Text></Pressable>)}</ScrollView>
      <Text style={s.title}>{board.categories.find(item => item.id === category)?.name}</Text>
      <View style={s.grid}>{board.items.filter(item => item.category === category).map(item => {
        const added = cart.some(line => line.menuId === item.id && line.person === 'me');
        return <View key={item.id} style={s.menuCard}>
          <View><Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 상세 보기`} onPress={() => { setSelected(item); setScreen('detail'); }}><MenuPhoto uri={item.photoUrl} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${item.name} ${added ? '담기 취소' : '담기'}`} accessibilityState={{ selected: added, disabled: shared.pending }} disabled={shared.pending} onPress={() => toggle(item)} style={[s.addButton, added && s.added]}><Text style={added ? s.addedText : s.addText}>{added ? '✓' : '+'}</Text></Pressable></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 상세 보기`} onPress={() => { setSelected(item); setScreen('detail'); }} style={s.menuInfo}><Text style={s.note} numberOfLines={1}>{item.originalName}</Text><Text style={s.menuName} numberOfLines={2}>{item.name}</Text><Text style={s.price}>EUR {item.priceEur.toFixed(2)}</Text></Pressable>
        </View>;
      })}</View>
    </>}
    {board && selected && screen === 'detail' && <><MenuPhoto uri={selected.detailPhotoUrl ?? selected.photoUrl} /><Text style={s.note}>{selected.originalName}</Text><Text style={s.heading}>{selected.name}</Text><Text style={s.title}>EUR {selected.priceEur.toFixed(2)}</Text><View style={s.card}><Text style={s.title}>메뉴판에서 확인한 정보</Text><Text style={s.body}>재료: {selected.ingredients.map(i => i.name).join(', ') || '메뉴판에서 확인되지 않았어요'}</Text><Text style={s.body}>알레르기: {selected.allergen}</Text></View><View style={s.card}><Text style={s.title}>AI가 설명했어요</Text><Text style={s.body}>{selected.analogy}</Text><Text style={s.body}>{selected.description}</Text><Text style={s.note}>AI가 추정한 내용은 실제와 다를 수 있어요. 알레르기는 직원에게 확인해 주세요.</Text><Text style={s.body}>들어갔을 수 있는 재료: {selected.estimated.join(', ') || '직원에게 확인해 주세요'}</Text><Text style={s.body}>조리법: {selected.method}</Text><Text style={s.body}>알레르기 가능성: {selected.possibleAllergen}</Text></View><Button title={cart.some(line => line.menuId === selected.id && line.person === 'me') ? '담기 취소하기' : '장바구니에 담기'} onPress={() => { toggle(selected); setScreen('menu'); }} /></>}
    {board && screen === 'cart' && <><Text style={s.heading}>함께 담은 장바구니</Text><ErrorText message={shared.error} />{shared.room && <Pressable accessibilityRole="button" disabled={shared.pending} onPress={() => { shared.leave(); setCart(lines => lines.filter(line => line.person === 'me')); }} style={s.action}><Text style={s.body}>이 기기에서 공유 연결 닫기</Text></Pressable>}{shared.canShare && <Pressable accessibilityRole="button" disabled={shared.pending} onPress={() => void shared.share(board, cart)} style={s.action}><Text style={s.body}>{shared.pending ? '연결하고 있어요' : shared.room ? '초대 링크 다시 보내기' : '동반인과 함께 담기'}</Text></Pressable>}{!cart.length && <Text style={s.body}>아직 담은 메뉴가 없어요.</Text>}{cart.map(line => { const item = board.items.find(i => i.id === line.menuId); if (!item) return null; return <View key={`${line.person}-${line.menuId}`} style={s.card}><View style={s.cartItem}><Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 상세 보기`} onPress={() => { setSelected(item); setScreen('detail'); }} style={s.cartPhoto}><MenuPhoto uri={item.photoUrl} /></Pressable><View style={s.cartInfo}><Text style={s.title}>{item.name}</Text><Text style={s.note}>{line.person === 'me' ? '내 메뉴' : `${shared.snapshot?.members.find(member => member.id === line.person)?.name ?? '동반인'}님 메뉴`}</Text><Text style={s.note}>{item.originalName}</Text><Text style={s.body}>EUR {item.priceEur.toFixed(2)}</Text><View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 수량 줄이기`} disabled={shared.pending || line.person !== 'me'} onPress={() => shared.room ? void shared.mutate(item.id, 'decrease') : setCart(current => changeQuantity(current, item.id, -1, line.person))} style={s.action}><Text style={s.title}>−</Text></Pressable><Text style={s.title}>{line.quantity}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 수량 늘리기`} disabled={shared.pending || line.person !== 'me' || line.quantity >= 20} onPress={() => shared.room ? void shared.mutate(item.id, 'increase') : setCart(current => changeQuantity(current, item.id, 1, line.person))} style={s.action}><Text style={s.title}>+</Text></Pressable></View></View></View></View>; })}<View style={s.card}><Text style={s.title}>식사 정보와 팁</Text><Text style={s.body}>식사 인원 {partySize || '미선택'}{partySize ? '명' : ''}</Text><View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel="식사 인원 줄이기" onPress={() => setPartySize(n => Math.max(0, n - 1))} style={s.action}><Text style={s.title}>−</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="식사 인원 늘리기" onPress={() => setPartySize(n => Math.min(30, n + 1))} style={s.action}><Text style={s.title}>+</Text></Pressable></View><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: tip }} onPress={() => setTip(value => !value)} style={s.action}><Text style={s.body}>{tip ? '☑' : '☐'} 선택 팁 {tipRate}%</Text></Pressable>{tip && <View style={s.row}>{[5, 10, 15].map(rate => <Pressable key={rate} accessibilityRole="button" accessibilityState={{ selected: tipRate === rate }} onPress={() => setTipRate(rate)} style={s.action}><Text style={s.body}>{rate}%{tipRate === rate ? ' ✓' : ''}</Text></Pressable>)}</View>}{charge && <><Text style={s.body}>{charge.name}: {charge.priceEur === null ? '가격 확인 필요' : `EUR ${charge.priceEur.toFixed(2)}`} {charge.basis === 'per_person' ? '/ 1명' : charge.basis === 'per_table' ? '/ 테이블' : '/ 부과 기준 확인 필요'}</Text><Text style={s.note}>메뉴판 원문: {charge.evidence}</Text>{charge.basis === 'per_person' && !partySize && <Text style={s.note}>인원을 선택해야 자리 요금을 합계에 반영해요.</Text>}</>}</View><Text style={s.body}>음식 EUR {total.food.toFixed(2)}{tip ? ` · 팁 EUR ${total.tip.toFixed(2)}` : ''}{cover ? ` · 자리 요금 EUR ${cover.toFixed(2)}` : ''}</Text><Text style={s.title}>합계 EUR {finalTotal.toFixed(2)}</Text><Text style={s.note}>메뉴판에서 확인한 가격만 반영했어요. 별도 요금은 직원에게 확인해 주세요.</Text><Button title="주문 문장 보기" disabled={!cart.length} onPress={() => setScreen('order')} /></>}
    {screen === 'order' && <><Text style={s.heading}>직원에게 보여 주세요</Text><View style={s.card}><Text style={s.title}>{phrase.italian}</Text><Text style={s.body}>{phrase.korean}</Text></View><Text style={s.note}>이탈리아어 주문 문장이에요. 메뉴와 수량을 확인해 주세요.</Text><Button title="장바구니로 돌아가기" onPress={() => setScreen('cart')} /></>}
  </ScrollView>{screen === 'menu' && total.count > 0 && <View style={s.dock}><Pressable accessibilityRole="button" accessibilityLabel={`함께 담은 장바구니 ${total.count}개 보기`} onPress={() => setScreen('cart')} style={s.cartBar}><Text style={s.white}>함께 담은 장바구니</Text><View style={s.cartPill}><Text style={s.white}>{total.count}개 보기</Text></View></Pressable></View>}</View></SafeAreaView>;
}
const s = StyleSheet.create({
  cartItem: { flexDirection: 'row', gap: 16 }, cartPhoto: { width: 80, overflow: 'hidden', borderRadius: 14 }, cartInfo: { flex: 1, gap: 4 }, layout: { flex: 1 }, dockSpace: { paddingBottom: 120 }, dock: { position: 'absolute', bottom: 32, left: 24, right: 24 }, cartBar: { minHeight: 64, borderRadius: 999, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: color.primary }, cartPill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: color.brand }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, menuCard: { width: '48%', flexGrow: 1, maxWidth: '50%', overflow: 'hidden', borderRadius: 24, backgroundColor: color.surface }, menuInfo: { padding: 16, gap: 4 }, menuName: { minHeight: 46, fontFamily: 'PretendardMedium', fontSize: 16, lineHeight: 23, color: color['on-surface'] }, price: { marginTop: 12, fontFamily: 'PretendardMedium', fontSize: 14, lineHeight: 20, color: color['on-surface'] }, addButton: { position: 'absolute', bottom: 12, right: 12, width: 44, height: 44, borderRadius: 999, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }, added: { backgroundColor: color.primary }, addText: { color: color.primary, fontSize: 22 }, addedText: { color: color['on-primary'], fontSize: 22 }, photo: { height: 150, backgroundColor: color.neutral, justifyContent: 'center', alignItems: 'center' }, screen: { flex: 1, backgroundColor: color.neutral }, content: { padding: 24, gap: 16 }, back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }, heading: { fontFamily: 'PretendardMedium', fontSize: 22, lineHeight: 29, color: color['on-surface'] }, title: { fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 24, color: color['on-surface'] }, body: { fontFamily: 'Pretendard', fontSize: 16, lineHeight: 23, color: color['on-surface'] }, note: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 19, color: color.secondary }, white: { fontFamily: 'Pretendard', fontSize: 16, color: color['on-primary'] }, card: { backgroundColor: color.surface, borderRadius: 24, padding: 24, gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 16 }, tabs: { gap: 8 }, chip: { padding: 12, borderRadius: 999, backgroundColor: color.surface }, chipSelected: { backgroundColor: color.primary }, action: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
});
