// @vitest-environment node
import {expect,it} from 'vitest';
import sharp from 'sharp';
import {removeBackground} from './remove-background';
const box={left:150,top:150,right:850,bottom:850};
it('접시 안의 흰 픽셀을 보존하고 외부 배경은 제거하며 사방 여백을 남겨요',async()=>{
 const source=Buffer.from('<svg width="200" height="200"><rect width="200" height="200" fill="red"/><circle cx="100" cy="100" r="70" fill="white"/><circle cx="100" cy="100" r="40" fill="green"/></svg>');
 const input=await sharp(source).png().toBuffer();const output=await removeBackground(input,box);
 const {data,info}=await sharp(output).raw().toBuffer({resolveWithObject:true});
 expect([info.width,info.height]).toEqual([640,480]);
 const pixel=(x:number,y:number)=>[...data.subarray((y*info.width+x)*3,(y*info.width+x)*3+3)];
 expect(pixel(320,240)).toEqual([0,128,0]);
 for(const [x,y]of [[0,0],[320,20],[20,240],[620,240],[320,460]])expect(pixel(x,y)).toEqual([255,255,255]);
 expect(pixel(320,85)).toEqual([255,255,255]);
});
it('원본 가장자리에서 잘린 접시를 임의로 복원하지 않아요',async()=>{
 const bytes=await sharp({create:{width:100,height:100,channels:3,background:'white'}}).png().toBuffer();
 await expect(removeBackground(bytes,{...box,right:1000})).rejects.toThrow();
});
