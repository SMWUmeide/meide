import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { MenuTranslation } from './menu-api';
export type MenuPhoto = { id: string; uri: string; width: number; height: number; base64?: string };
const Context = createContext<{ photos: MenuPhoto[]; menus:Record<string,MenuTranslation>; setMenu:(id:string,menu:Partial<MenuTranslation>)=>void; add: (items: MenuPhoto[]) => void; remove: (id: string) => void } | null>(null);
// Session draft: native photos remain in app cache, never sent to a server here.
export function MenuPhotosProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<MenuPhoto[]>([]);
  const [menus,setMenus]=useState<Record<string,MenuTranslation>>({});
  const setMenu = useCallback((id: string, patch: Partial<MenuTranslation>) => setMenus(current => ({ ...current, [id]: { ...(current[id] ?? { originalText: '' }), ...patch } })), []);
  return <Context.Provider value={{ photos,menus,setMenu, add: items => setPhotos(current => [...current, ...items]), remove: id => { setPhotos(current => current.filter(photo => photo.id !== id));setMenus(current=>Object.fromEntries(Object.entries(current).filter(([key])=>key!==id))); } }}>{children}</Context.Provider>;
}
export function useMenuPhotos() {
  const value = useContext(Context);
  if (!value) throw new Error('MenuPhotosProvider is required');
  return value;
}
