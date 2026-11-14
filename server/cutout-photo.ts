import { createHash } from 'node:crypto';
import { reserveApiCalls } from './api-budget.js';
import type { ApiEnv } from './http.js';
import { menuPhotoSchema } from '../src/data/menu-photo.js';
async function imageBytes(response: Response, maxBytes=4_000_000) {
  if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw new Error('IMAGE');
  const reader=response.body?.getReader();if(!reader)throw new Error('IMAGE');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();throw new Error('IMAGE_SIZE');}chunks.push(value);}
  return Buffer.concat(chunks);
}
export async function cutoutPhoto(source: string, env: ApiEnv, signal: AbortSignal): Promise<string | null> {
  menuPhotoSchema.shape.url.parse(source);
  if(!env.PHOTOROOM_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || Number(env.PHOTOROOM_LIFETIME_LIMIT || 0)<=0)return null;
  const base=new URL(env.SUPABASE_URL);
  if(base.protocol!=='https:' || !base.hostname.endsWith('.supabase.co'))throw new Error('STORAGE_CONFIG');
  const name=createHash('sha256').update(`white-v1:${source}`).digest('hex')+'.png';
  const publicUrl=new URL(`/storage/v1/object/public/menu-cutouts/${name}`,base).href;
  const cached=await fetch(publicUrl,{method:'HEAD',signal:AbortSignal.any([signal,AbortSignal.timeout(5000)])});
  if(cached.ok)return publicUrl;
  if(cached.status!==404 && cached.status!==400)throw new Error('STORAGE');
  const photo=await fetch(source,{redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(8000)])});
  const bytes=await imageBytes(photo);
  await reserveApiCalls('photoroom',env);
  const form=new FormData();form.set('image_file',new Blob([new Uint8Array(bytes)],{type:photo.headers.get('content-type')!}),'dish.jpg');
  form.set('bg_color','white');form.set('format','png');form.set('size','preview');form.set('crop','false');
  const result=await fetch('https://sdk.photoroom.com/v1/segment',{method:'POST',headers:{'x-api-key':env.PHOTOROOM_API_KEY},body:form,signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});
  const png=await imageBytes(result);
  if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('INVALID_PNG');
  const saved=await fetch(new URL(`/storage/v1/object/menu-cutouts/${name}`,base),{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,apikey:env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'image/png','x-upsert':'true','Cache-Control':'max-age=31536000'},body:new Uint8Array(png),signal:AbortSignal.any([signal,AbortSignal.timeout(8000)])});
  if(!saved.ok)throw new Error('STORAGE');
  return publicUrl;
}
