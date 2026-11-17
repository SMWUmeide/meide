import inlineSvg from '../../assets/inline-svg.json';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { ErrorText } from '../../components/ui';
import type { CompanionDisplay } from './CompanionLists';

const icons = {
  back: inlineSvg["assets/travel/back.svg"],
  status: inlineSvg["assets/travel/status.svg"],
  pencil: inlineSvg["assets/companions/pencil.svg"],
  photo: inlineSvg["assets/companions/photo.svg"],
  camera: inlineSvg["assets/companions/camera.svg"],
};

export function CompanionPhotoEditor({ person, ready, onClose, onSave }: {
  person: CompanionDisplay; ready: boolean; onClose: () => void;
  onSave: (id: string, asset: ImagePicker.ImagePickerAsset) => Promise<void>;
}) {
  const [options, setOptions] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const locked = useRef(false);
  async function choose(source: 'library' | 'camera') {
    if (locked.current || !ready) return;
    locked.current = true; setWorking(true); setMessage(null);
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setMessage(permission.canAskAgain ? '사진을 찍으려면 카메라 접근을 허용해 주세요.' : '기기 설정에서 카메라 접근을 허용해 주세요.');
          return;
        }
      }
      const config: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85, exif: false };
      // Keep web picker launch in the button's user gesture. The system photo
      // picker does not need broad photo-library permission for this one image.
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(config) : await ImagePicker.launchImageLibraryAsync(config);
      if (result.canceled || !result.assets?.[0]) return;
      await onSave(person.id, result.assets[0]);
      setOptions(false);
    } catch { setMessage('사진을 변경하지 못했어요. 권한이나 저장 공간을 확인하고 다시 시도해 주세요.'); }
    finally { locked.current = false; setWorking(false); }
  }
  return <Modal visible animationType="fade" onRequestClose={() => { if (!working) { if (options) setOptions(false); else onClose(); } }}>
    <SafeAreaView style={s.safe} accessibilityViewIsModal><View style={s.page}>
      {Platform.OS === 'web' && <View style={s.status} aria-hidden><Text style={s.time}>9:41</Text><View style={s.statusIcons}><SvgUri uri={icons.status} /></View></View>}
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="동반인 목록으로 돌아가기" disabled={working} onPress={onClose} hitSlop={6} style={s.back}><SvgUri uri={icons.back} /></Pressable>
        <Text accessibilityRole="header" style={s.title}>{person.name}</Text><View style={s.balance} />
      </View>
      <View style={s.body}>
        <Pressable accessibilityLabel="사진 메뉴 닫기" accessibilityRole="button" aria-hidden={!options} accessibilityElementsHidden={!options} disabled={!options || working} onPress={() => setOptions(false)} style={StyleSheet.absoluteFill} />
        <View style={s.portraitArea}>
          <View style={s.portrait}>{person.photo ? <Image accessibilityLabel={`${person.name} 동반인 사진`} source={person.photo} style={s.image} resizeMode="cover" /> : <Text style={s.initial}>{Array.from(person.name).slice(-2).join('')}</Text>}</View>
          {!options && <Pressable accessibilityRole="button" accessibilityLabel="동반인 사진 편집" disabled={!ready || working} onPress={() => setOptions(true)} style={s.edit}><SvgUri uri={icons.pencil} width={28} height={28} /></Pressable>}
          {options && <View style={s.options}>
            <Pressable accessibilityRole="button" disabled={working || !ready} onPress={() => void choose('library')} style={({ pressed }) => [s.option, pressed && s.pressed]}><SvgUri uri={icons.photo} /><Text style={s.optionText}>사진첩에서 선택</Text></Pressable>
            <View style={s.separator} />
            <Pressable accessibilityRole="button" disabled={working || !ready} onPress={() => void choose('camera')} style={({ pressed }) => [s.option, pressed && s.pressed]}><SvgUri uri={icons.camera} /><Text style={s.optionText}>사진 찍기</Text></Pressable>
          </View>}
        </View>
      </View>
      <View style={s.feedback}>{working && <ActivityIndicator accessibilityLabel="사진 저장 중" color="#176B38" />}<ErrorText message={message} /></View>
      {Platform.OS === 'web' && <View style={s.systemBottom} aria-hidden><View style={s.homeIndicator} /></View>}
    </View></SafeAreaView>
  </Modal>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F6' }, page: { flex: 1, width: '100%', maxWidth: 412, alignSelf: 'center' },
  status: { height: 54 }, time: { position: 'absolute', left: 36, top: 20.5, fontFamily: 'NotoSansKRBold', fontSize: 16, lineHeight: 22.4, color: '#212121' }, statusIcons: { position: 'absolute', right: 28, top: 23.5 },
  header: { height: 51.5, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  back: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.74)' }, balance: { width: 34 },
  title: { flex: 1, fontFamily: 'PretendardBold', fontSize: 17, lineHeight: 24, textAlign: 'center', color: '#212121' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 160 },
  portraitArea: { width: '100%', maxWidth: 288, aspectRatio: 1 },
  portrait: { width: '100%', height: '100%', borderRadius: 999, overflow: 'hidden', backgroundColor: '#A5E4FF', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' }, initial: { fontFamily: 'Pretendard', fontSize: 48, color: '#647482' },
  edit: { position: 'absolute', right: -4, bottom: -6, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 14px rgba(0,0,0,0.08)' },
  options: { position: 'absolute', top: '100%', marginTop: 24, left: -6, right: -6, padding: 8, borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E7E8EC', boxShadow: '0px 8px 24px rgba(0,0,0,0.06)' },
  option: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 16 }, optionText: { fontFamily: 'Pretendard', fontSize: 17, lineHeight: 25, color: '#212121' },
  separator: { height: 1, marginHorizontal: 16, backgroundColor: '#F2F4F6' }, pressed: { backgroundColor: '#F2F4F6' },
  feedback: { position: 'absolute', bottom: 36, left: 24, right: 24, gap: 12 },
  systemBottom: { height: 23 }, homeIndicator: { position: 'absolute', bottom: 12, width: 134, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: '#212121' },
});
