import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
export function createSharedCarts(file=new URL('./data/shared-carts.sqlite',import.meta.url).pathname){
 const db=new DatabaseSync(file);db.exec('CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY,data TEXT NOT NULL,updated INTEGER NOT NULL)');
 const save=r=>{r.version++;db.prepare('INSERT INTO rooms VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated=excluded.updated').run(r.id,JSON.stringify(r),Date.now());};
 const load=id=>{const row=db.prepare('SELECT data,updated FROM rooms WHERE id=?').get(String(id||''));if(!row||Date.now()-row.updated>86400000)throw Error('함께 담기 연결이 만료됐어요. 새 초대 링크를 만들어주세요.');return JSON.parse(row.data);};
 const view=r=>({id:r.id,version:r.version,menu:r.menu,restaurant:r.restaurant,demo:r.demo,members:r.members.map(({token,...m})=>m),events:r.events.slice(-8)});
 const auth=b=>{const r=load(b.roomId),member=r.members.find(m=>m.token===b.token);if(!member)throw Error('함께 담기 연결을 확인해주세요.');return {r,member};};
 return {handle(action,b={}){
 if(action==='create'){const r={id:randomUUID(),invite:randomUUID(),version:0,menu:null,restaurant:null,demo:false,members:[{id:'me',name:'나',token:randomUUID(),cart:{},done:false},{id:'companion',name:String(b.name||'동반인').slice(0,30),token:randomUUID(),cart:{},done:false,joined:false}],events:[],operations:[]};save(r);return {room:view(r),token:r.members[0].token,memberId:'me',invite:r.invite};}
 if(action==='join'){const r=load(b.roomId);if(b.invite!==r.invite)throw Error('초대 링크를 확인해주세요.');r.members[1].joined=true;save(r);return {room:view(r),token:r.members[1].token,memberId:'companion'};}
 const {r,member}=auth(b);
 if(action==='get')return {room:view(r)};
 if(action==='menu'){if(member.id!=='me')throw Error('메뉴판은 초대한 사람이 공유할 수 있어요.');if(!b.menu?.items?.length||b.menu.items.length>60||JSON.stringify(b.menu).length>300000)throw Error('공유할 메뉴를 확인해주세요.');r.menu=b.menu;r.restaurant=b.restaurant?{name:String(b.restaurant.name||'').slice(0,200),address:String(b.restaurant.address||'').slice(0,500),countryCode:typeof b.restaurant.countryCode==='string'?b.restaurant.countryCode.slice(0,2):null}:null;r.demo=!!b.demo;for(const m of r.members){m.cart={};m.done=false;}for(const i of r.menu.items){const q=b.cart?.[i.id];if(Number.isInteger(q)&&q>0&&q<=99)member.cart[i.id]=q;}r.events=[];r.operations=[];}
 else if(action==='delta'){if(!r.menu?.items.some(i=>String(i.id)===String(b.itemId))||![1,-1].includes(b.delta)||typeof b.operationId!=='string'||b.operationId.length>100)throw Error('잘못된 장바구니 변경입니다.');if(r.operations.includes(b.operationId))return {room:view(r)};r.operations.push(b.operationId);r.operations=r.operations.slice(-1000);const id=String(b.itemId),q=Math.min(99,Math.max(0,(member.cart[id]||0)+b.delta));if(q)member.cart[id]=q;else delete member.cart[id];member.done=false;r.events.push({memberId:member.id,name:member.name,itemId:id,delta:b.delta,at:Date.now()});r.events=r.events.slice(-20);}
 else if(action==='done'){member.done=!!b.done;}
 else throw Error('함께 담기 요청을 확인해주세요.');save(r);return {room:view(r)};
 }};
}
