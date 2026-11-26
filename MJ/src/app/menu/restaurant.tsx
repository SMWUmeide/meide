import { Redirect, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { RestaurantConfirmation } from '../../features/menu-camera/RestaurantConfirmation';
import { useMenuPhotos } from '../../features/menu-camera/MenuPhotosProvider';
import { confirmRestaurant, type RestaurantPlace } from '../../features/menu-camera/menu-api';
import { useProgress } from '../../state/ProgressProvider';
import { restaurantMenuPatch } from '../../features/menu-camera/menu-source';
export default function RestaurantScreen() {
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const { menus, setMenu } = useMenuPhotos();
  const { progress, reviewCode } = useProgress();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => lock.current);
    return () => subscription.remove();
  }, []));
  const menu = menus[photoId];
  if (!menu?.restaurantSearch?.places.length) return <Redirect href="/menu/camera" />;
  function next() { router.replace({ pathname:'/menu/result', params:{ photoId } }); }
  async function confirm(place: RestaurantPlace) {
    if (lock.current || (menu.detailsAttempted && !menu.webMenu && !menu.restaurantNotice)) return;
    lock.current = true; setBusy(true);
    setMenu(photoId, { restaurantDecision:'confirmed', confirmedRestaurant:place });
    if (!menu.detailsAttempted) {
      setMenu(photoId, { detailsAttempted:true });
      try {
        const detail = await confirmRestaurant(place.id, photoId, { ...progress, reviewCode });
        setMenu(photoId, restaurantMenuPatch(menu, detail));
      } catch {
        setMenu(photoId, restaurantMenuPatch(menu));
      }
    }
    if (mounted.current) next();
  }
  return <RestaurantConfirmation search={menu.restaurantSearch} busy={busy} error={null} onBack={() => { if (!lock.current) router.back(); }} onConfirm={place => void confirm(place)} onSkip={() => { if (lock.current) return; setMenu(photoId,{ restaurantDecision:'skipped' }); next(); }} />;
}
