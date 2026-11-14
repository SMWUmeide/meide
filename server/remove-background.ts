import sharp from 'sharp';
import {boxSchema,type Box} from './photo-review.js';
import {plateMask} from './sam-mask.js';
export async function removeBackground(bytes:Buffer,box:Box):Promise<Buffer>{
 boxSchema.parse(box);
 const{rgb,width,height,alpha,bounds}=await plateMask(bytes,box);
 const rgba=Buffer.alloc(width*height*4);
 for(let i=0;i<width*height;i++){rgba[i*4]=rgb[i*3];rgba[i*4+1]=rgb[i*3+1];rgba[i*4+2]=rgb[i*3+2];rgba[i*4+3]=alpha[i];}
 const subject=await sharp(rgba,{raw:{width,height,channels:4}}).extract({left:bounds.left,top:bounds.top,width:bounds.right-bounds.left,height:bounds.bottom-bounds.top}).resize({width:512,height:384,fit:'inside'}).png().toBuffer();
 return sharp({create:{width:640,height:480,channels:3,background:'white'}}).composite([{input:subject,gravity:'centre'}]).png().toBuffer();
}
