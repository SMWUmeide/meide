import sharp from 'sharp';
import {InferenceSession,Tensor} from 'onnxruntime-node';
import {join} from 'node:path';
import type {Box} from './photo-review.js';
let models:Promise<[InferenceSession,InferenceSession]>|undefined;
let queue:Promise<unknown>=Promise.resolve();
export function plateMask(bytes:Buffer,box:Box){const next=queue.then(()=>segment(bytes,box));queue=next.catch(()=>undefined);return next;}
async function segment(bytes:Buffer,box:Box){
 models??=Promise.all(['sam-encoder.onnx','sam-decoder.onnx'].map(file=>InferenceSession.create(join(process.cwd(),'server/models',file),{executionProviders:['cpu'],intraOpNumThreads:1,interOpNumThreads:1}))).then(s=>s as [InferenceSession,InferenceSession]).catch(e=>{models=undefined;throw e;});
 const[encoder,decoder]=await models;
 const original=await sharp(bytes,{limitInputPixels:20_000_000}).rotate().resize({width:1000,height:1000,fit:'inside',withoutEnlargement:true}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const{width,height}=original.info,scale=1024/Math.max(width,height),rw=Math.round(width*scale),rh=Math.round(height*scale);
 const resized=await sharp(original.data,{raw:{width,height,channels:3}}).resize(rw,rh,{kernel:'linear'}).raw().toBuffer();
 const pixels=new Float32Array(3*1024*1024),mean=[.485,.456,.406],std=[.229,.224,.225];
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)for(let c=0;c<3;c++)pixels[c*1024*1024+y*1024+x]=(resized[(y*rw+x)*3+c]/255-mean[c])/std[c];
 const embeddings=await encoder.run({pixel_values:new Tensor('float32',pixels,[1,3,1024,1024])});
 const result=await decoder.run({...embeddings,input_boxes:new Tensor('float32',new Float32Array([box.left/1000*rw,box.top/1000*rh,box.right/1000*rw,box.bottom/1000*rh]),[1,1,4]),input_points:new Tensor('float32',new Float32Array([(box.left+box.right)/2000*rw,(box.top+box.bottom)/2000*rh]),[1,1,1,2]),input_labels:new Tensor('int64',BigInt64Array.from([1n]),[1,1,1])});
 const masks=result.pred_masks.data as Float32Array,scores=result.iou_scores.data as Float32Array;
 let best:{alpha:Buffer;bounds:{left:number;top:number;right:number;bottom:number};score:number}|undefined;
 for(let n=0;n<scores.length;n++){
  const alpha=Buffer.alloc(width*height);let left=width,top=height,right=0,bottom=0,count=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const sx=x/width*rw/4,sy=y/height*rh/4,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
   const at=(xx:number,yy:number)=>masks[n*256*256+Math.min(255,yy)*256+Math.min(255,xx)];
   const logit=at(x0,y0)*(1-fx)*(1-fy)+at(x0+1,y0)*fx*(1-fy)+at(x0,y0+1)*(1-fx)*fy+at(x0+1,y0+1)*fx*fy;
   if(logit>0){alpha[y*width+x]=255;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);count++;}
  }
  const expected=[box.left,box.top,box.right,box.bottom],actual=[left/width*1000,top/height*1000,right/width*1000,bottom/height*1000];
  const error=actual.reduce((sum,value,i)=>sum+Math.abs(value-expected[i]),0)/1000;
  // A smaller soup-only mask or a background/edge-clipped mask is not a complete dish.
  if(count<width*height*.015||left<2||top<2||right>width-2||bottom>height-2||error>.22)continue;
  const score=scores[n]-error;if(!best||score>best.score)best={alpha,bounds:{left,top,right,bottom},score};
 }
 if(!best)throw Error('INCOMPLETE_CONTAINER');
 // Keep only the main connected object, removing isolated crumbs/background fragments.
 const labels=new Int32Array(width*height),sizes:number[]=[0],work=new Uint32Array(width*height);let label=0;
 for(let start=0;start<best.alpha.length;start++){
  if(!best.alpha[start]||labels[start])continue;label++;let head=0,tail=1;work[0]=start;labels[start]=label;
  while(head<tail){const p=work[head++],x=p%width,y=Math.floor(p/width);for(const n of [x?p-1:-1,x+1<width?p+1:-1,y?p-width:-1,y+1<height?p+width:-1])if(n>=0&&best.alpha[n]&&!labels[n]){labels[n]=label;work[tail++]=n;}}
  sizes[label]=tail;
 }
 let main=1;for(let i=2;i<sizes.length;i++)if(sizes[i]>sizes[main])main=i;
 if(sizes.some((size,i)=>i!==main&&size>sizes[main]*.1))throw Error('MULTIPLE_OBJECTS');
 let ml=width,mt=height,mr=0,mb=0;
 for(let p=0;p<best.alpha.length;p++){best.alpha[p]=labels[p]===main?255:0;if(best.alpha[p]){const x=p%width,y=Math.floor(p/width);ml=Math.min(ml,x);mt=Math.min(mt,y);mr=Math.max(mr,x+1);mb=Math.max(mb,y+1);}}
 best.bounds={left:ml,top:mt,right:mr,bottom:mb};
 // Fill enclosed holes so white rims and food highlights cannot become transparent.
 const outside=new Uint8Array(width*height),todo:number[]=[];
 for(let x=0;x<width;x++){todo.push(x,(height-1)*width+x);}for(let y=0;y<height;y++){todo.push(y*width,y*width+width-1);}
 for(let i=0;i<todo.length;i++){const p=todo[i];if(outside[p]||best.alpha[p])continue;outside[p]=1;const x=p%width,y=Math.floor(p/width);if(x)todo.push(p-1);if(x+1<width)todo.push(p+1);if(y)todo.push(p-width);if(y+1<height)todo.push(p+width);}
 for(let i=0;i<best.alpha.length;i++)if(!outside[i])best.alpha[i]=255;
 return{rgb:original.data,width,height,alpha:best.alpha,bounds:best.bounds};
}
