import {pixabayPhoto} from './pixabay-photos.js';
import {ApiBudgetError} from './api-budget.js';
import {z} from 'zod';
import {apiAccess,readSmallJson,type ApiEnv} from './http.js';
const input=z.object({queries:z.array(z.object({id:z.string().min(1).max(100),query:z.string().trim().min(2).max(120),menuName:z.string().trim().min(1).max(800).optional(),menuDescription:z.string().max(2000).optional()}).strict()).min(1).max(4)}).strict();
export async function menuPhotos(request:Request,env:ApiEnv=process.env):Promise<Response>{
 const{reply,response}=apiAccess(request,env);if(response)return response;
 if(request.method!=='POST')return reply({error:'METHOD'},405);
 if(!env.PIXABAY_API_KEY?.trim()||!env.GEMINI_API_KEY?.trim())return reply({error:'CONFIG',message:'사진 검색과 검증 서버를 연결해 주세요'},503);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'CONTENT_TYPE'},415);
 let parsed:z.infer<typeof input>;try{parsed=input.parse(await readSmallJson(request,16000));}catch(error){return reply({error:'INVALID_INPUT'},error instanceof RangeError?413:400);}
 const photos=await Promise.all(parsed.queries.map(async({id,query,menuName,menuDescription})=>{
  try{const photo=await pixabayPhoto(query,env,request.signal,menuName??query,menuDescription??'');return{id,photo,status:photo?'ready':'unavailable'};}
  catch(error){
   const diagnostic=error as {name?:string;statusCode?:number;message?:string};
   console.warn('menu-photo-failed',{kind:diagnostic?.name,status:diagnostic?.statusCode,code:diagnostic?.message&&/^[A-Z_]+$/.test(diagnostic.message)?diagnostic.message:undefined});
   return{id,photo:null,status:(error instanceof ApiBudgetError&&error.status===429)||diagnostic?.statusCode===429?'limited':'failed'};
  }
 }));
 return reply({photos},200);
}
