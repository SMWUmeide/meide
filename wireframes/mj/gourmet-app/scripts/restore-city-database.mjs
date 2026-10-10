import {createReadStream, createWriteStream, existsSync, readFileSync, renameSync, unlinkSync} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createGunzip} from 'node:zlib';
import {createHash} from 'node:crypto';
const base=new URL('../data/',import.meta.url);
const target=new URL('europe-cities.sqlite',base);
if(!existsSync(target)){
 const archive=new URL('europe-cities.sqlite.gz',base);
 const parts=[];
 if(existsSync(archive)) parts.push(archive);
 else for(let n=1;;n++){const part=new URL('europe-cities.sqlite.gz.part'+String(n).padStart(2,'0'),base);if(!existsSync(part))break;parts.push(part);}
 if(!parts.length)throw Error('압축된 도시 데이터가 없습니다.');
 async function* chunks(){for(const part of parts)for await(const chunk of createReadStream(part))yield chunk;}
 const temp=new URL('europe-cities.sqlite.restoring',base);
 try{
  await pipeline(Readable.from(chunks()),createGunzip(),createWriteStream(temp));
  const hash=createHash('sha256');for await(const chunk of createReadStream(temp))hash.update(chunk);
  const expected=JSON.parse(readFileSync(new URL('city-database-checksum.json',base),'utf8'));
  if(hash.digest('hex')!==expected.sha256)throw Error('도시 데이터 검증 실패');
  renameSync(temp,target);console.log('도시 데이터 복원 완료');
 }catch(error){if(existsSync(temp))unlinkSync(temp);throw error;}
}
