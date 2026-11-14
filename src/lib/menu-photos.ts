import { z } from 'zod';
import { apiUrl } from './api';
import { menuPhotoSchema } from '@/data/menu-photo';
import type { MenuBoard } from '@/data/menu-schema';
const resultSchema = z.object({photos:z.array(z.object({id:z.string(),photo:menuPhotoSchema.nullable()})).max(4)});
export async function loadMenuPhotos(board: MenuBoard, signal: AbortSignal): Promise<MenuBoard> {
  const items = [...board.items];
  const missing = items.filter(item => (!item.photoUrl || (item.photo && !item.photo.cutoutUrl)) && item.photoQuery?.trim());
  for (let i=0;i<missing.length;i+=4) {
    const response = await fetch(apiUrl('/api/menu-photos'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({queries:missing.slice(i,i+4).map(item=>({id:item.id,query:item.photoQuery}))}),signal});
    if (!response.ok) throw new Error('음식 사진을 불러오지 못했어요. 메뉴는 계속 볼 수 있어요');
    const {photos} = resultSchema.parse(await response.json());
    for (const {id,photo} of photos) { const index=items.findIndex(item=>item.id===id); if(index>=0 && photo) items[index]={...items[index],photo,photoUrl:photo.cutoutUrl ?? photo.url}; }
  }
  return {...board,items};
}
