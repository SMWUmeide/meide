import { z } from 'zod';
const hostedUrl = (host: string) => z.string().url().refine(value => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password; } catch { return false; } });
export const menuPhotoSchema = z.object({ url: hostedUrl('images.pexels.com'), page: hostedUrl('www.pexels.com'), photographer: z.string().trim().min(1).max(160) });
export type MenuPhoto = z.infer<typeof menuPhotoSchema>;
