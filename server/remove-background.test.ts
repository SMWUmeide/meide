// @vitest-environment node
import { expect, it } from 'vitest';
import sharp from 'sharp';
import { removeBackground } from './remove-background';
it('빈 이미지의 마스크는 잘못된 흰 사진으로 저장하지 않아요',async()=>{
 const blank=await sharp({create:{width:320,height:320,channels:3,background:'white'}}).png().toBuffer();
 await expect(removeBackground(blank)).rejects.toThrow('CUTOUT_EMPTY');
});
