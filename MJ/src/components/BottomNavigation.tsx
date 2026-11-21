import { Asset } from 'expo-asset';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

// Original Figma paths at 28×28. State variants change fills, never geometry.
const tabs = [
  { key: 'home', label: '홈', outline: Asset.fromModule(require('../../assets/navigation/home-outline.svg')).uri, filled: Asset.fromModule(require('../../assets/home/imgFilled.svg')).uri },
  { key: 'orders', label: '주문내역', outline: Asset.fromModule(require('../../assets/home/imgOutline.svg')).uri, filled: Asset.fromModule(require('../../assets/navigation/orders-filled.svg')).uri },
  { key: 'companions', label: '동반인', outline: Asset.fromModule(require('../../assets/home/imgOutline1.svg')).uri, filled: Asset.fromModule(require('../../assets/navigation/companions-filled.svg')).uri },
  { key: 'profile', label: '마이페이지', outline: Asset.fromModule(require('../../assets/home/imgOutline2.svg')).uri, filled: Asset.fromModule(require('../../assets/navigation/profile-filled.svg')).uri },
] as const;

export function BottomNavigation({ active }: { active: (typeof tabs)[number]['key'] }) {
  return <View style={[s.navigation, active === 'home' && s.homeNavigation]}>
    {tabs.map(tab => <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={tab.label} aria-selected={tab.key === active}
      accessibilityState={{ selected: tab.key === active }} style={[s.tab, tab.key === active && s.selected]}
      onPress={() => {
        if (tab.key === active) return;
        if (tab.key === 'home') router.navigate('/home');
        else if (tab.key === 'companions') router.navigate('/companions');
        else if (tab.key === 'profile') router.navigate('/privacy');
        else Alert.alert(tab.label, '아직 준비 중인 기능이에요.');
      }}>
      <SvgUri uri={tab.key === active ? tab.filled : tab.outline} /><Text style={s.tabText}>{tab.label}</Text>
    </Pressable>)}
  </View>;
}

const s = StyleSheet.create({
  navigation: { position: 'absolute', left: 16, right: 16, bottom: 0, height: 72, padding: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.84)', flexDirection: 'row', boxShadow: '0px 5px 11px rgba(0,0,0,0.08)' },
  homeNavigation: { borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.94)' },
  tab: { flex: 1, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 4 },
  selected: { backgroundColor: 'rgba(0,0,0,0.06)' },
  tabText: { fontFamily: 'Pretendard', fontSize: 11, lineHeight: 15.4, color: '#202124' },
});
