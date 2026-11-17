import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../../components/ui';
import { useMenuPhotos } from '../../features/menu-camera/MenuPhotosProvider';
import { analyzePhotos } from '../../features/order/analyze';
import type { MenuBoard, MenuItem } from '../../features/order/menu-schema';
import { changeQuantity, totals, type OrderLine } from '../../features/order/order-model';
import color from '../../features/order/native-colors.json';
import figma from '../../features/order/native-figma.json';
import { useProgress } from '../../state/ProgressProvider';
import { useSharedOrder } from '../../features/order/use-shared';
import { Avatar, Card, Icon, IconButton, Photo, Price, radius, space, type as t } from '../../features/order/ui';
import { CartGroups, Checkout, DetailContent, OrderSentence, Receipt } from '../../features/order/OrderViews';

type Screen = 'confirm' | 'menu' | 'detail' | 'cart' | 'order' | 'receipt';
export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const { photos } = useMenuPhotos();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const { progress } = useProgress();
  const [screen, setScreen] = useState<Screen>('confirm');
  const [board, setBoard] = useState<MenuBoard | null>(null);
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [tip, setTip] = useState(false);
  const [tipRate, setTipRate] = useState(10);
  const partySize = board?.dining?.partySize ?? 0;
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
    else if (screen === 'receipt') setScreen('order');
    else router.back();
  }
  function toggle(item: MenuItem) {
    if (shared.room) { void shared.mutate(item.id, cart.some(line => line.menuId === item.id && line.person === 'me') ? 'remove' : 'add'); return; }
    setCart(current => current.some(line => line.menuId === item.id && line.person === 'me')
      ? current.filter(line => !(line.menuId === item.id && line.person === 'me'))
      : [...current, { menuId: item.id, person: 'me', quantity: 1 }]);
  }
  const [request, setRequest] = useState('');
  const list = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const total = totals(cart, board?.items ?? [], tip, tipRate);
  const charge = board?.coverCharge;
  const units = charge?.basis === 'per_table' ? 1 : charge?.basis === 'per_person' ? partySize : 0;
  const cover = total.count && charge?.priceEur != null && charge.evidence.trim() ? Math.round(charge.priceEur * units * 100) / 100 : 0;
  const finalTotal = Math.round((total.total + cover) * 100) / 100;
  const members = shared.snapshot?.members ?? [];
  function personName(person: string) { return person === 'me' ? '나' : members.find(member => member.id === person)?.name ?? '동반인'; }
  function open(item: MenuItem) { setSelected(item); setScreen('detail'); }
  function quantity(line: OrderLine, delta: number) {
    if (shared.room) void shared.mutate(line.menuId, delta > 0 ? 'increase' : 'decrease');
    else setCart(current => changeQuantity(current, line.menuId, delta, line.person));
  }
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'detail' || screen === 'cart') { setScreen('menu'); return true; }
      if (screen === 'order') { setScreen('cart'); return true; }
      if (screen === 'receipt') { setScreen('order'); return true; }
      return false;
    });
    return () => handler.remove();
  }, [screen]);
  const title = screen === 'cart' ? '함께 담은 장바구니' : screen === 'order' ? '주문하기' : screen === 'receipt' ? '영수증 미리보기' : screen === 'menu' ? board?.restaurantName : '메뉴판 분석';
  return <SafeAreaView style={s.screen} edges={screen === 'detail' ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}>
    {screen !== 'detail' && screen !== 'menu' && <View style={s.toolbar}><IconButton name="back" label="뒤로 가기" onPress={back} /><Text style={[t.title, s.toolbarTitle]} numberOfLines={2}>{title}</Text><View style={s.spacer} /></View>}
    {screen === 'confirm' && <View style={s.content}><Text style={t.heading}>{invite ? '함께 고르는 메뉴판을 열고 있어요' : '메뉴판을 분석하고 있어요'}</Text><Text style={t.body}>사진 {photos.length}장을 읽고 있어요.</Text><ErrorText message={error || shared.error} />{busy || invite && !shared.error ? <ActivityIndicator /> : error ? <Button title="다시 분석하기" onPress={() => void start()} disabled={!photos.length || photos.length > 6} /> : null}</View>}
    {board && screen === 'menu' && <View style={s.flex}>
      <ScrollView stickyHeaderIndices={[2]} ref={list} contentContainerStyle={[s.content, s.menuContent, total.count > 0 && s.menuDockSpace]} scrollEventThrottle={100} onScroll={event => { const y = event.nativeEvent.contentOffset.y + 56; const current = [...board.categories].reverse().find(item => (sectionOffsets.current[item.id] ?? Infinity) <= y); if (current) setCategory(current.id); }}><View style={[s.toolbar, s.scrollToolbar]}><IconButton name="back" label="뒤로 가기" onPress={back} /><Text style={[t.title, s.toolbarTitle]} numberOfLines={2}>{board.restaurantName}</Text><View style={s.spacer} /></View><View style={s.row}><Avatar name="나" />{members.filter(member => member.name !== progress.name).slice(0, 3).map((member, i) => <Avatar key={member.id} name={member.name} index={i + 1} />)}<Text style={[t.body, s.flex]}>{shared.room ? '동반인과 함께 고르는 중이에요' : '메뉴를 골라 주세요'}</Text></View><View style={s.categoryNav}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{board.categories.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: category === item.id }} onPress={() => { setCategory(item.id); list.current?.scrollTo({ y: Math.max(0, (sectionOffsets.current[item.id] ?? 0) - 56), animated: true }); }} style={[s.chip, category === item.id && s.chipSelected]}><Text style={[t.label, category === item.id && { color: color['on-primary'] }]}>{item.name} {board.items.filter(menu => menu.category === item.id).length}</Text></Pressable>)}</ScrollView></View>
        <ErrorText message={shared.error} />
        {board.categories.map(section => { const items = board.items.filter(item => item.category === section.id); return <View key={section.id} style={s.section} onLayout={event => { sectionOffsets.current[section.id] = event.nativeEvent.layout.y; }}><View style={s.between}><View style={s.row}><Text style={t.title}>{section.name}</Text><Text style={t.note}>{section.original}</Text></View><Text style={t.note}>{items.length}개 메뉴</Text></View><View style={s.grid}>{items.map(item => { const added = cart.some(line => line.menuId === item.id && line.person === 'me'); const companions = cart.filter(line => line.menuId === item.id && line.person !== 'me').map(line => personName(line.person)); return <View style={s.menuCard} key={item.id}><View><Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 상세 보기`} onPress={() => open(item)}><Photo uri={item.photoUrl} contain={Boolean(item.photo?.cutoutUrl)} /></Pressable>{item.allergen.startsWith('글루텐') && <View style={s.allergen}><Text style={[t.tiny, { color: color['on-primary'] }]}>글루텐 포함</Text></View>}{companions.length > 0 && <View style={s.companionLabel}><Text style={t.note}>{companions.join(', ')}님이 담았어요</Text></View>}<Pressable accessibilityRole="button" accessibilityLabel={`${item.name} ${added ? '담기 취소' : '담기'}`} accessibilityState={{ selected: added, disabled: shared.pending }} disabled={shared.pending} onPress={() => toggle(item)} style={[s.addButton, added && s.added]}><Icon name={added ? 'added' : 'add'} /></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 상세 보기`} onPress={() => open(item)} style={s.menuInfo}><Text style={t.tiny} numberOfLines={1}>{item.originalName}</Text><Text style={[t.body, s.menuName]} numberOfLines={2}>{item.name}</Text><View style={s.priceGap}><Price value={item.priceEur} /></View></Pressable></View>; })}</View></View>; })}
        <Text style={t.note}>메뉴와 일치하는 검증된 음식 사진만 표시해요. 대표 이미지는 실제 음식과 다를 수 있어요.</Text><Text style={t.note}>Gemini로 읽은 메뉴예요. 원문과 가격을 확인해 주세요. 확인된 환율이 없어 EUR 가격만 표시해요.{board.skipped > 0 ? ` 가격을 읽지 못한 메뉴 ${board.skipped}개는 표시하지 않았어요.` : ''}</Text>
      </ScrollView>{total.count > 0 && <View style={s.barFooter}><Pressable accessibilityRole="button" accessibilityLabel={`함께 담은 장바구니 ${total.count}개 보기`} onPress={() => setScreen('cart')} style={s.cartBar}><View style={s.row}><Icon name="cart" /><Text style={s.white}>함께 담은 장바구니</Text></View><View style={s.cartPill}><Text style={s.pillText}>{total.count}개 보기</Text></View></Pressable></View>}
    </View>}
    {board && selected && screen === 'detail' && <View style={s.flex}><ScrollView><View><Photo uri={selected.detailPhotoUrl ?? selected.photoUrl} height={figma.heroHeight} contain={Boolean(selected.photo?.cutoutUrl)} />{!selected.photo?.cutoutUrl && <LinearGradient pointerEvents="none" colors={[figma.photoOverlayStart, figma.photoOverlayEnd]} style={s.photoOverlay} />}<View style={[s.heroBack, { top: insets.top + space.sm }]}><IconButton name="back" label="메뉴 고르기로 돌아가기" onPress={back} /></View>{(selected.detailPhotoUrl || selected.photoUrl) && <View style={s.photoCaption}><Text style={[t.tiny, { color: color['on-primary'] }]}>대표 이미지 · 실제 음식과 다를 수 있어요</Text></View>}</View><LinearGradient colors={[color.surface, color.neutral, color.neutral]} locations={[0, 0.39, 1]} style={s.detailContent}><DetailContent item={selected} source={board.source} /></LinearGradient></ScrollView><View style={s.barFooter}><View style={s.cartBar}><Text style={s.white}>장바구니에 담기</Text><Pressable accessibilityRole="button" accessibilityLabel={cart.some(line => line.menuId === selected.id && line.person === 'me') ? '장바구니 보기' : '장바구니에 담기'} disabled={shared.pending} onPress={() => { if (cart.some(line => line.menuId === selected.id && line.person === 'me')) setScreen('cart'); else toggle(selected); }} style={s.cartPill}><Text style={s.pillText}>{cart.some(line => line.menuId === selected.id && line.person === 'me') ? '보기' : '담기'}</Text></Pressable></View></View></View>}
    {board && screen === 'cart' && <View style={s.flex}><ScrollView contentContainerStyle={s.content}><ErrorText message={shared.error} />{!cart.length && <Card><Text style={t.heading}>아직 담은 메뉴가 없어요</Text><Button variant="secondary" title="메뉴 고르러 가기" onPress={() => setScreen('menu')} /></Card>}<CartGroups board={board} cart={cart} tip={tip} tipRate={tipRate} personName={personName} onOpen={open} onQuantity={quantity} pending={shared.pending} /></ScrollView><Checkout count={total.count} cover={cover} value={finalTotal} tip={tip} tipRate={tipRate} setTip={setTip} setTipRate={setTipRate} disabled={!cart.length || shared.pending} onOrder={() => setScreen('order')} /></View>}
    {board && screen === 'order' && <OrderSentence board={board} cart={cart} request={request} setRequest={setRequest} onReceipt={() => setScreen('receipt')} />}
    {board && screen === 'receipt' && <Receipt board={board} cart={cart} tip={tip} tipRate={tipRate} partySize={partySize} cover={cover} units={units} onHome={() => router.replace('/home')} onMore={() => setScreen('menu')} />}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  flex: { flex: 1 }, screen: { flex: 1, backgroundColor: color.neutral }, content: { padding: space.xl, gap: space.xl, paddingBottom: space.xxl }, toolbar: { minHeight: 56, paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.sm }, toolbarTitle: { flex: 1, textAlign: 'center' }, spacer: { width: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm }, scrollToolbar: { paddingHorizontal: 0 }, menuContent: { paddingTop: 0, gap: space.lg }, categoryNav: { backgroundColor: color.neutral, paddingVertical: space.sm, marginVertical: -space.sm }, tabs: { gap: space.sm }, chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.full, backgroundColor: color.surface }, chipSelected: { backgroundColor: color.primary }, section: { gap: space.lg, marginTop: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }, menuCard: { flexBasis: 0, minWidth: '45%', flexGrow: 1, maxWidth: '50%', overflow: 'hidden', borderRadius: figma.menuRadius, backgroundColor: color.surface }, menuInfo: { padding: space.lg, gap: space.xs }, menuName: { minHeight: 46 }, priceGap: { marginTop: space.md }, addButton: { position: 'absolute', bottom: space.md, right: space.md, width: 44, height: 44, borderRadius: radius.full, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', boxShadow: figma.toggleShadow }, added: { backgroundColor: color.primary },
  allergen: { position: 'absolute', top: space.md, left: space.md, backgroundColor: color.error, borderRadius: radius.full, paddingHorizontal: space.sm, paddingVertical: space.xs }, companionLabel: { position: 'absolute', top: space.md, left: space.md, backgroundColor: color.surface, borderRadius: radius.full, paddingHorizontal: space.sm, paddingVertical: space.xs },
  white: { ...t.body, color: color['on-primary'] }, pillText: { ...t.label, color: color['on-primary'] }, barFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: space.xl, paddingBottom: space.xxl, paddingTop: space.xxl }, menuDockSpace: { paddingBottom: 64 + space.xxl * 2 }, cartBar: { minHeight: 64, borderRadius: radius.full, paddingLeft: space.xl, paddingRight: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: figma.cartBackground, borderWidth: 1, borderColor: figma.cartBorder, boxShadow: figma.cartShadow }, cartPill: { minHeight: 44, paddingHorizontal: figma.space20, paddingVertical: space.md, borderRadius: radius.full, backgroundColor: figma.cartAction, justifyContent: 'center' },
  heroBack: { position: 'absolute', top: space.lg, left: space.xl }, photoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 }, photoCaption: { position: 'absolute', bottom: figma.space40, left: space.xl, backgroundColor: figma.photoCaption, borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: space.sm }, detailContent: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.xl, paddingBottom: 64 + space.xxl * 2, marginTop: -figma.sheetOverlap },
});
