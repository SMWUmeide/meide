import { openURL } from 'expo-linking';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SetupHeader } from '../components/SetupHeader';
import { selectionStyles as s } from '../components/selectionStyles';
import { Button, ErrorText } from '../components/ui';
import { sharedClient } from '../features/order/shared-order';
import { useProgress } from '../state/ProgressProvider';

const policyUrl = 'https://meide-privacy.vercel.app/';
const contactEmail = '2026meide@gmail.com';

export default function Privacy() {
  const { progress } = useProgress();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestDeletion() {
    setOpening(true);
    setError(null);
    try {
      const { data } = await Promise.resolve()
        .then(() => sharedClient().auth.getSession())
        .catch(() => ({ data: null }));
      const accountId = data?.session?.user.id;
      const subject = encodeURIComponent('meide 계정 및 데이터 삭제 요청');
      const body = encodeURIComponent([
        'meide 계정 및 데이터 삭제를 요청해요.',
        '',
        `앱에서 사용한 이름: ${progress.name}`,
        `기기 프로필 ID: ${progress.profileId ?? ''}`,
        ...(accountId ? [`공유 장바구니 계정 ID: ${accountId}`] : []),
        '요청 사항: ',
      ].join('\n'));
      await openURL(`mailto:${contactEmail}?subject=${subject}&body=${body}`);
    } catch {
      setError(`메일 앱을 열지 못했어요. ${contactEmail}으로 요청해 주세요.`);
    } finally {
      setOpening(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.page}>
        <SetupHeader title="마이페이지" onBack={() => router.canGoBack() ? router.back() : router.replace('/home')} />
        <ScrollView contentContainerStyle={s.content}>
          <Link href={policyUrl} style={[s.description, s.none, { textDecorationLine: 'underline' }]}>
            개인정보처리방침 보기
          </Link>
          <Text style={s.section}>계정 및 데이터 삭제</Text>
          <Text style={s.description}>
            삭제 요청은 이메일로 접수해요. 계정을 확인할 수 있도록 이름과 식별자가 포함된 메일 초안을 열어요.
          </Text>
          <Link href={`${policyUrl}#account-deletion`} style={[s.description, s.none, { textDecorationLine: 'underline' }]}>
            삭제 절차 보기
          </Link>
          <Button title={opening ? '메일 앱을 여는 중이에요' : '삭제 요청 이메일 작성하기'} disabled={opening} onPress={() => void requestDeletion()} />
          <ErrorText message={error} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
