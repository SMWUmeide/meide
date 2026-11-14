import sharp from 'sharp';
import { InferenceSession, Tensor } from 'onnxruntime-node';
import { join } from 'node:path';
let session: Promise<InferenceSession> | undefined;
// Limit CPU and memory use when a request contains several menu photos.
let queue: Promise<unknown> = Promise.resolve();
export function removeBackground(bytes: Buffer): Promise<Buffer> {
  const job = queue.then(() => segment(bytes));
  queue = job.catch(() => undefined);
  return job;
}
async function segment(bytes: Buffer): Promise<Buffer> {
  session ??= InferenceSession.create(join(process.cwd(), 'server/models/u2netp.onnx'), { executionProviders: ['cpu'], intraOpNumThreads: 1, interOpNumThreads: 1 }).catch(error => { session = undefined; throw error; });
  const model = await session;
  const original = await sharp(bytes, { limitInputPixels: 20_000_000 }).rotate().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const {width,height} = original.info;
  const small = await sharp(original.data,{raw:{width,height,channels:3}}).resize(320,320,{fit:'fill'}).raw().toBuffer();
  const input = new Float32Array(3*320*320);
  const mean=[0.485,0.456,0.406],std=[0.229,0.224,0.225];
  let max=1; for(const value of small)max=Math.max(max,value);
  for(let i=0;i<320*320;i++)for(let c=0;c<3;c++)input[c*320*320+i]=(small[i*3+c]/max-mean[c])/std[c];
  const results=await model.run({[model.inputNames[0]]:new Tensor('float32',input,[1,3,320,320])});
  const mask=results[model.outputNames[0]].data as Float32Array;
  let lo=Infinity,hi=-Infinity;for(const value of mask){lo=Math.min(lo,value);hi=Math.max(hi,value);}
  if(!Number.isFinite(lo)||hi-lo<0.01)throw Error('CUTOUT_EMPTY');
  let center=0;for(let y=112;y<208;y++)for(let x=112;x<208;x++)center+=(mask[y*320+x]-lo)/(hi-lo);
  if(center/(96*96)<0.6)throw Error('CUTOUT_SUBJECT_MISSING');
  const alpha=Buffer.from(mask.map(value=>Math.round(255*Math.min(1,Math.max(0,((value-lo)/(hi-lo)-0.05)/0.9)))));
  const resized=await sharp(alpha,{raw:{width:320,height:320,channels:1}}).resize(width,height).greyscale().raw().toBuffer();
  // Composite on white; retain the whole detected foreground rather than crop the plate.
  const rgb=Buffer.alloc(width*height*3);let foreground=0;
  for(let i=0;i<width*height;i++){const a=resized[i]/255;if(a>0.5)foreground++;for(let c=0;c<3;c++)rgb[i*3+c]=Math.round(original.data[i*3+c]*a+255*(1-a));}
  if(foreground<width*height*0.01)throw Error('CUTOUT_EMPTY');
  return sharp(rgb,{raw:{width,height,channels:3}}).png().toBuffer();
}
