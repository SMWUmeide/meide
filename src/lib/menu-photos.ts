import { z } from 'zod';
import { apiUrl } from './api';
import { menuPhotoSchema } from '@/data/menu-photo';
import { withReviewedPhotos, type MenuBoard } from '@/data/menu-schema';
const resultSchema = z.object({photos:z.array(z.object({id:z.string(),photo:menuPhotoSchema.nullable(),status:z.enum(['ready','unavailable','limited','failed']).optional()})).max(4)});
export async function loadMenuPhotos(board: MenuBoard, signal: AbortSignal): Promise<MenuBoard> {
  const items = [...withReviewedPhotos(board).items];
  const missing = items.filter(item => (!item.photo?.cutoutUrl || item.photo.reviewVersion!=='dish-v5' || item.photo.reviewedFor!==item.originalName) && (item.photoQuery?.trim() || item.originalName.trim()));
  for (let i=0;i<missing.length;i+=4) {
    const response = await fetch(apiUrl('/api/menu-photos'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({queries:missing.slice(i,i+4).map(item=>({id:item.id,query:item.photoQuery?.trim() || item.originalName,menuName:item.originalName}))}),signal});
    if (!response.ok) throw new Error('음식 사진을 불러오지 못했어요. 메뉴는 계속 볼 수 있어요');
    const {photos} = resultSchema.parse(await response.json());
    for (const {id,photo} of photos) { const index=items.findIndex(item=>item.id===id); if(index>=0) items[index]={...items[index],photo:photo?.reviewVersion==='dish-v5'&&photo.reviewedFor===items[index].originalName?photo:undefined,photoUrl:photo?.reviewVersion==='dish-v5'&&photo.reviewedFor===items[index].originalName?photo.cutoutUrl??null:null,detailPhotoUrl:undefined}; }
  }
  return {...board,items};
}
