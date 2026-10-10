import {DatabaseSync} from 'node:sqlite';
export function createGoogleBudget(path=new URL('./data/google-usage.sqlite',import.meta.url).pathname){
 const db=new DatabaseSync(path);db.exec('CREATE TABLE IF NOT EXISTS usage(month TEXT, kind TEXT, count INTEGER NOT NULL, PRIMARY KEY(month,kind))');
 return {take(kind,limit){if(!Number.isInteger(limit)||limit<1)throw Error('Google 호출 한도가 설정되지 않았습니다.');const month=new Date().toISOString().slice(0,7);const r=db.prepare('INSERT INTO usage(month,kind,count) VALUES(?,?,1) ON CONFLICT(month,kind) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count').get(month,kind,limit);if(!r)throw Error('이번 달 Google '+kind+' 호출 제한에 도달했습니다. 추가 요청을 차단했습니다.');return r.count;},close(){db.close();}};
}
