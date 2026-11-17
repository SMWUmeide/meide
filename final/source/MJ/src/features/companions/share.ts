import { Platform, Share } from 'react-native';
export async function shareInvitation(url: string) {
  const title = 'Meide 동반인 초대';
  const text = 'Meide에서 함께 메뉴를 골라요. 초대를 수락해 주세요.';
  if (Platform.OS === 'web') {
    if (!navigator.share) throw new Error('이 브라우저에서는 공유창을 지원하지 않아요. 링크 복사하기를 이용해 주세요.');
    await navigator.share({title,text,url});
  } else {
    await Share.share(Platform.OS === 'ios' ? {title,message:text,url} : {title,message:`${text}\n${url}`});
  }
}
