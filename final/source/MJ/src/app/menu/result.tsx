import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMenuPhotos } from '../../features/menu-camera/MenuPhotosProvider';
import { OrderingScreen } from '../../features/ordering/OrderingScreen';
export default function MenuResult(){
 const {photoId}=useLocalSearchParams<{photoId:string}>();
 const {menus}=useMenuPhotos();
 if(!menus[photoId]?.originalText.trim())return <Redirect href="/menu/camera" />;
 return <OrderingScreen key={photoId} photoId={photoId}/>;
}
