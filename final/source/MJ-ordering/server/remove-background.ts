import sharp from 'sharp';
import {boxSchema,type Box} from './photo-review.js';
import {plateMask} from './sam-mask.js';
export async function removeBackground(bytes:Buffer,box:Box):Promise<Buffer>{
 boxSchema.parse(box);
 const{rgb,width,height,alpha,bounds}=await transparentMask(bytes,box) ?? await plateMask(bytes,box);
 const rgba=Buffer.alloc(width*height*4);
 for(let i=0;i<width*height;i++){rgba[i*4]=rgb[i*3];rgba[i*4+1]=rgb[i*3+1];rgba[i*4+2]=rgb[i*3+2];rgba[i*4+3]=alpha[i];}
 const subject=await sharp(rgba,{raw:{width,height,channels:4}}).extract({left:bounds.left,top:bounds.top,width:bounds.right-bounds.left,height:bounds.bottom-bounds.top}).resize({width:512,height:384,fit:'inside'}).png().toBuffer();
 return sharp({create:{width:640,height:480,channels:3,background:'white'}}).composite([{input:subject,gravity:'centre'}]).png().toBuffer();
}

// Some providers already supply a full isolated dish. Preserve its original
// alpha instead of discarding it and segmenting invisible RGB garbage.
async function transparentMask(bytes:Buffer,box:Box) {
 const metadata=await sharp(bytes,{limitInputPixels:20_000_000}).metadata();
 if(!metadata.hasAlpha)return null;
 const {data,info}=await sharp(bytes,{limitInputPixels:20_000_000}).rotate().resize({width:1000,height:1000,fit:'inside',withoutEnlargement:true}).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info;const rgb=Buffer.alloc(width*height*3),alpha=Buffer.alloc(width*height);
 let left=width,top=height,right=0,bottom=0,transparent=0;
 for(let p=0;p<width*height;p++) {
  rgb[p*3]=data[p*4];rgb[p*3+1]=data[p*4+1];rgb[p*3+2]=data[p*4+2];alpha[p]=data[p*4+3];
  if(alpha[p]===0)transparent++;
  else {const x=p%width,y=Math.floor(p/width);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
 }
 if(transparent<width*height*.1||right<=left||bottom<=top||left<2||top<2||right>width-2||bottom>height-2)return null;
 const expected=[box.left,box.top,box.right,box.bottom],actual=[left/width*1000,top/height*1000,right/width*1000,bottom/height*1000];
 if(actual.reduce((sum,value,i)=>sum+Math.abs(value-expected[i]),0)>220)return null;
 return {rgb,width,height,alpha,bounds:{left,top,right,bottom}};
}
