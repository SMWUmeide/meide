import { createHash } from 'node:crypto';
import { removeBackground } from './remove-background.js';
import { reserveApiCalls } from './api-budget.js';
import type { ApiEnv } from './http.js';
import { menuPhotoSchema } from '../src/data/menu-photo.js';
import {reviewCutout,boxSchema,type Box} from './photo-review.js';
export async function cutoutPhoto(source:string,env:ApiEnv,signal:AbortSignal,review:{bytes:Buffer;box:Box}):Promise<string>{
 menuPhotoSchema.shape.url.parse(source);boxSchema.parse(review.box);
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('STORAGE_CONFIG');
 const base=new URL(env.SUPABASE_URL);if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co'))throw Error('STORAGE_CONFIG');
 const name=createHash('sha256').update(`dish-v5:${source}:${JSON.stringify(review.box)}`).digest('hex')+'.png';
 const publicUrl=new URL(`/storage/v1/object/public/menu-cutouts/${name}`,base).href;
 const timed=()=>AbortSignal.any([signal,AbortSignal.timeout(10000)]);
 const cached=await fetch(publicUrl,{method:'HEAD',signal:timed()});if(cached.ok)return publicUrl;
 if(![400,404].includes(cached.status))throw Error('STORAGE');
 await reserveApiCalls('cutout',env);
 const png=await removeBackground(review.bytes,review.box);
 if(!await reviewCutout(review.bytes,png,env,signal))throw Error('CUTOUT_REVIEW_FAILED');
 const saved=await fetch(new URL(`/storage/v1/object/menu-cutouts/${name}`,base),{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,apikey:env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'image/png','x-upsert':'true'},body:new Uint8Array(png),signal:timed()});
 if(!saved.ok)throw Error('STORAGE');return publicUrl;
}
