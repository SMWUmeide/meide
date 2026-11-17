import { Asset } from 'expo-asset';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SvgUri } from 'react-native-svg';
import type { Companion } from './invite';

export type CompanionDisplay = Companion & { foodSummary?: string; photo?: ImageSourcePropType };
const addIcon = Asset.fromModule(require('../../../assets/companions/add.svg')).uri;

function Avatar({ person, onPress }: { person: CompanionDisplay; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${person.name} 사진 보기`} onPress={onPress} hitSlop={2} style={s.avatar}>
    {person.photo ? <Image source={person.photo} style={s.avatarImage} resizeMode="cover" /> : <Text style={s.avatarText}>{Array.from(person.name).slice(-2).join('')}</Text>}
  </Pressable>;
}

export function CompanionLists({ friends, selected, busy, loading, onToggle, onInvite, onPhoto }: {
  friends: CompanionDisplay[]; selected: CompanionDisplay[]; busy: boolean; loading: boolean;
  onToggle: (id: string) => void; onInvite: () => void;
  onPhoto: (id: string) => void;
}) {
  return <>
    <Text accessibilityRole="header" style={s.title}>이번 여행 동반인</Text>
    <View style={s.cards}>
      {selected.map(person => <View key={person.id} style={s.card}>
        <Avatar person={person} onPress={() => onPhoto(person.id)} />
        <View style={[s.names, s.cardName]}><Text style={s.name} numberOfLines={2}>{person.name}</Text>{person.foodSummary && <Text style={s.foodSummary}>{person.foodSummary}</Text>}</View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${person.name} 이번 여행에서 빼기`} disabled={busy} onPress={() => onToggle(person.id)} hitSlop={4} style={({ pressed }) => [s.remove, pressed && s.pressed]}>
          <Text style={s.removeText}>빼기</Text>
        </Pressable>
      </View>)}
      {selected.length === 0 && <View style={s.emptyCard}><Text style={s.empty}>{loading ? '불러오는 중…' : '이번 여행 동반인이 없어요.'}</Text></View>}
    </View>
    <View style={s.friendsHeading}>
      <Text accessibilityRole="header" style={s.heading}>친구 목록</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="새 친구 추가" onPress={onInvite} hitSlop={10} style={({ pressed }) => [s.invite, pressed && s.pressed]}><Text style={s.inviteText}>+ 새 친구</Text></Pressable>
    </View>
    <View style={s.list}>
      {friends.map(person => {
        const included = selected.some(member => member.id === person.id);
        return <View key={person.id} style={s.row}>
          <Avatar person={person} onPress={() => onPhoto(person.id)} />
          <Pressable accessibilityRole="checkbox" accessibilityLabel={included ? `${person.name} 이번 여행 동반인` : `${person.name} 이번 여행에 추가`} aria-checked={included} accessibilityState={{ checked: included, disabled: busy }} disabled={busy} onPress={() => onToggle(person.id)} style={({ pressed }) => [s.friendSelect, pressed && s.pressed, busy && s.disabled]}>
            <View style={s.names}><Text style={s.name} numberOfLines={2}>{person.name}</Text>{person.foodSummary && <Text style={s.foodSummary}>{person.foodSummary}</Text>}</View>
            {included ? <Text style={s.included}>함께하는 중</Text> : <View aria-hidden pointerEvents="none" style={s.addTarget}>
              <View style={s.addCircle}><View style={s.addIcon}><SvgUri uri={addIcon} /></View></View>
            </View>}
          </Pressable>
        </View>;
      })}
      {!loading && friends.length === 0 && <Text style={[s.empty, s.emptyFriends]}>아직 연결된 친구가 없어요.</Text>}
    </View>
  </>;
}

const s = StyleSheet.create({
  title: { fontFamily: 'PretendardBold', fontSize: 22, lineHeight: 32, letterSpacing: -0.9364, color: '#212121' },
  cards: { gap: 12, marginTop: 18 },
  card: { minHeight: 80, borderRadius: 32, backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A5E4FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Pretendard', fontSize: 12, lineHeight: 17.4, color: '#91949E' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  names: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: 'PretendardBold', fontSize: 16, lineHeight: 23.2, letterSpacing: -0.4682, color: '#212121' },
  foodSummary: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 18.85, color: '#91949E' },
  cardName: { paddingLeft: 5.618 },
  remove: { width: 52, height: 36, borderRadius: 15.544, borderWidth: 0.936, borderColor: '#E7E8EC', alignItems: 'center', justifyContent: 'center' },
  removeText: { fontFamily: 'Pretendard', fontSize: 15, lineHeight: 21, color: '#91949E' },
  friendsHeading: { marginTop: 24, height: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 23.8, letterSpacing: -0.4682, color: '#212121' },
  invite: { height: 24, justifyContent: 'center' },
  inviteText: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 18.85, color: '#91949E' },
  list: { marginTop: 8 },
  row: { minHeight: 72, paddingVertical: 11.5, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 0.936, borderBottomColor: '#ECECF0' },
  friendSelect: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  addTarget: { width: 48, height: 48, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  addCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(23,104,62,0.22)', alignItems: 'center', justifyContent: 'center' },
  addIcon: { width: 20, height: 20 },
  included: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 18.85, color: '#91949E' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.6 },
  emptyCard: { minHeight: 80, padding: 24, backgroundColor: '#FFF', borderRadius: 32, justifyContent: 'center' },
  empty: { fontFamily: 'Pretendard', fontSize: 13, lineHeight: 19, color: '#91949E' },
  emptyFriends: { paddingVertical: 24 },
});
