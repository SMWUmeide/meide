import { z } from 'zod';
const hostedUrl = (host: string) => z.string().url().refine(value => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password; } catch { return false; } });
export const cutoutUrlSchema = z.string().url().refine(value=>{try{const url=new URL(value);return url.protocol==='https:' && url.hostname.endsWith('.supabase.co') && !url.username && !url.password && /^\/storage\/v1\/object\/public\/menu-cutouts\/[a-f0-9]{64}\.png$/.test(url.pathname) && !url.search && !url.hash;}catch{return false;}});
export const menuPhotoSchema = z.object({ url: hostedUrl('images.pexels.com'), page: hostedUrl('www.pexels.com'), photographer: z.string().trim().min(1).max(160), cutoutUrl: cutoutUrlSchema.optional() });
export type MenuPhoto = z.infer<typeof menuPhotoSchema>;
