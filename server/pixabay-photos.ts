import { createHash } from 'node:crypto';
import { z } from 'zod';
import { reserveApiCalls } from './api-budget.js';
import type { ApiEnv } from './http.js';
import { menuPhotoSchema, type MenuPhoto } from '../src/data/menu-photo.js';
const hitSchema=z.object({id:z.number().int().positive(),pageURL:z.string().url(),webformatURL:z.string().url(),user:z.string().min(1)});
function sourceUrl(value:string) {
  const u=new URL(value);
  if(u.protocol!=='https:' || !['pixabay.com','cdn.pixabay.com'].includes(u.hostname) || u.username || u.password)throw Error('PHOTO_URL');
  return u;
}
export async function pixabayPhoto(query:string,env:ApiEnv,signal:AbortSignal):Promise<MenuPhoto|null> {
  if(!env.PIXABAY_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)throw Error('PHOTO_CONFIG');
  const base=new URL(env.SUPABASE_URL);
  if(base.protocol!=='https:' || !base.hostname.endsWith('.supabase.co'))throw Error('STORAGE_CONFIG');
  const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`};
  const timed=()=>AbortSignal.any([signal,AbortSignal.timeout(15000)]);
  const normalized=query.toLowerCase().trim().slice(0,100);
  const key=createHash('sha256').update(normalized).digest('hex');
  const cacheUrl=new URL(`/storage/v1/object/menu-photo-cache/${key}.json`,base);
  const cached=await fetch(cacheUrl,{headers,signal:timed()});
  if(cached.ok){const data=await cached.json();if(typeof data.expires==='number'&&data.expires>Date.now())return data.photo===null?null:menuPhotoSchema.parse(data.photo);}
  else if(![400,404].includes(cached.status))throw Error('CACHE_READ');
  await reserveApiCalls('pixabay',env);
  const url=new URL('https://pixabay.com/api/');
  for(const [k,v] of Object.entries({key:env.PIXABAY_API_KEY,q:normalized,image_type:'photo',category:'food',safesearch:'true',per_page:'3'}))url.searchParams.set(k,v);
  const result=await fetch(url,{signal:timed()});if(!result.ok)throw Error('PHOTO_PROVIDER');
  const hits=z.object({hits:z.array(hitSchema)}).parse(await result.json()).hits;
  let photo:MenuPhoto|null=null;
  if(hits[0]){
    const hit=hits[0];sourceUrl(hit.pageURL);
    const response=await fetch(sourceUrl(hit.webformatURL),{redirect:'error',signal:timed()});
    const type=response.headers.get('content-type')?.split(';')[0];
    if(!response.ok || !['image/jpeg','image/png','image/webp'].includes(type||''))throw Error('PHOTO_IMAGE');
    const reader=response.body?.getReader();if(!reader)throw Error('PHOTO_IMAGE');
    const chunks:Uint8Array[]=[];let length=0;
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4_000_000){await reader.cancel();throw Error('PHOTO_SIZE');}chunks.push(value);}
    const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';const name=`pixabay-${hit.id}.${ext}`;
    const saved=await fetch(new URL(`/storage/v1/object/menu-photos/${name}`,base),{method:'POST',headers:{...headers,'Content-Type':type!,'x-upsert':'true'},body:new Uint8Array(Buffer.concat(chunks)),signal:timed()});
    if(!saved.ok)throw Error('PHOTO_SAVE');
    photo=menuPhotoSchema.parse({provider:'pixabay',url:new URL(`/storage/v1/object/public/menu-photos/${name}`,base).href,page:hit.pageURL,photographer:hit.user});
  }
  const saved=await fetch(cacheUrl,{method:'POST',headers:{...headers,'Content-Type':'application/json','x-upsert':'true'},body:JSON.stringify({photo,expires:Date.now()+86400000}),signal:timed()});
  if(!saved.ok)throw Error('CACHE_SAVE');
  return photo;
}
