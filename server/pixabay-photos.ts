import {createHash} from 'node:crypto';
import {z} from 'zod';
import {cutoutPhoto} from './cutout-photo.js';
import {reviewMenuPhoto} from './photo-review.js';
import {reserveApiCalls} from './api-budget.js';
import type {ApiEnv} from './http.js';
import {menuPhotoSchema,type MenuPhoto} from '../src/data/menu-photo.js';
const hitSchema=z.object({id:z.number().int().positive(),pageURL:z.string().url(),webformatURL:z.string().url(),user:z.string().min(1),tags:z.string().default('')});
function sourceUrl(value:string){const u=new URL(value);if(u.protocol!=='https:'||!['pixabay.com','cdn.pixabay.com'].includes(u.hostname)||u.username||u.password)throw Error('PHOTO_URL');return u;}
async function download(url:string,signal:AbortSignal){
 const response=await fetch(sourceUrl(url),{redirect:'error',signal});const type=response.headers.get('content-type')?.split(';')[0];
 if(!response.ok||!['image/jpeg','image/png','image/webp'].includes(type||''))throw Error('PHOTO_IMAGE');
 const reader=response.body?.getReader();if(!reader)throw Error('PHOTO_IMAGE');const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4_000_000){await reader.cancel();throw Error('PHOTO_SIZE');}chunks.push(value);}
 return {bytes:Buffer.concat(chunks),type:type!};
}
export async function pixabayPhoto(query:string,env:ApiEnv,signal:AbortSignal,menuName=query):Promise<MenuPhoto|null>{
 if(!env.PIXABAY_API_KEY||!env.GEMINI_API_KEY||!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('PHOTO_CONFIG');
 const base=new URL(env.SUPABASE_URL);if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co'))throw Error('STORAGE_CONFIG');
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`};
 const timed=()=>AbortSignal.any([signal,AbortSignal.timeout(15000)]);
 const normalized=query.toLowerCase().trim().slice(0,100);
 const cacheUrl=(key:string)=>new URL(`/storage/v1/object/menu-photo-cache/${createHash('sha256').update(key).digest('hex')}.json`,base);
 async function read(key:string){const r=await fetch(cacheUrl(key),{headers,signal:timed()});if(r.ok){const data=await r.json();if(typeof data.expires==='number'&&data.expires>Date.now())return data;}else if(![400,404].includes(r.status))throw Error('CACHE_READ');return null;}
 async function save(key:string,value:object){const r=await fetch(cacheUrl(key),{method:'POST',headers:{...headers,'Content-Type':'application/json','x-upsert':'true'},body:JSON.stringify({...value,expires:Date.now()+86400000}),signal:timed()});if(!r.ok)throw Error('CACHE_SAVE');}
 const reviewKey=`dish-v5:${JSON.stringify([normalized,menuName])}`;
 const cached=await read(reviewKey);
 if(cached){if(cached.photo===null)return null;const photo=menuPhotoSchema.parse(cached.photo);if(photo.reviewVersion==='dish-v5'&&photo.reviewedFor===menuName&&photo.cutoutUrl)return photo;}
 const searchKey=`pixabay-search-v1:${normalized}`;
 const stored=await read(searchKey);let hits:z.infer<typeof hitSchema>[];
 if(stored)hits=z.array(hitSchema).max(6).parse(stored.hits);
 else{
  await reserveApiCalls('pixabay',env);const url=new URL('https://pixabay.com/api/');
  for(const[k,v]of Object.entries({key:env.PIXABAY_API_KEY,q:normalized,image_type:'photo',safesearch:'true',per_page:'6'}))url.searchParams.set(k,v);
  const r=await fetch(url,{signal:timed()});if(!r.ok)throw Error('PHOTO_PROVIDER');
  hits=z.object({hits:z.array(hitSchema)}).parse(await r.json()).hits.slice(0,6);await save(searchKey,{hits});
 }
 if(!hits.length){await save(reviewKey,{photo:null,reason:'검색 결과가 없어요'});return null;}
 // A fruit mixture must not stand in for plain grape juice, even when search tags overlap.
 if(/succo.*uva|grape juice/i.test(menuName))hits=hits.filter(hit=>!/(papaya|mango|orange|pineapple|cocktail|wine|alcohol)/i.test(hit.tags+' '+hit.pageURL));
 for(const hit of hits){sourceUrl(hit.pageURL);sourceUrl(hit.webformatURL);}
 const downloaded=await Promise.allSettled(hits.map(async hit=>({...hit,...await download(hit.webformatURL,timed()),page:hit.pageURL})));
 const candidates=downloaded.flatMap(result=>result.status==='fulfilled'?[result.value]:[]);
 if(!hits.length){await save(reviewKey,{photo:null,reason:'음료 종류가 일치하지 않아요'});return null;}
 if(!candidates.length)throw Error('PHOTO_IMAGE');
 const review=await reviewMenuPhoto(menuName,candidates,env,signal);
 if(!review.selection){await save(reviewKey,{photo:null,reason:review.reason});return null;}
 const selected=candidates[review.selection.index];const ext=selected.type==='image/png'?'png':selected.type==='image/webp'?'webp':'jpg';const name=`pixabay-${selected.id}.${ext}`;
 const saved=await fetch(new URL(`/storage/v1/object/menu-photos/${name}`,base),{method:'POST',headers:{...headers,'Content-Type':selected.type,'x-upsert':'true'},body:new Uint8Array(selected.bytes),signal:timed()});if(!saved.ok)throw Error('PHOTO_SAVE');
 const url=new URL(`/storage/v1/object/public/menu-photos/${name}`,base).href;
 let cutoutUrl:string;
 try{cutoutUrl=await cutoutPhoto(url,env,signal,{bytes:selected.bytes,box:review.selection.box});}
 catch(error){
  if(error instanceof Error&&/^(CUTOUT_REVIEW_FAILED|INCOMPLETE_CONTAINER|MULTIPLE_OBJECTS)/.test(error.message)){await save(reviewKey,{photo:null,reason:'접시 전체를 깔끔하게 분리하지 못했어요'});return null;}
  throw error;
 }
 const photo=menuPhotoSchema.parse({provider:'pixabay',url,page:selected.pageURL,photographer:selected.user,cutoutUrl,reviewVersion:'dish-v5',reviewedFor:menuName});
 await save(reviewKey,{photo,reason:review.reason,box:review.selection.box});return photo;
}
