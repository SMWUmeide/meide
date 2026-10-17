export function createSharedCarts(db){
 const save=async r=>{const previous=r.version;r.version++;const result=previous===0?await db.prepare('INSERT OR IGNORE INTO rooms(id,data,updated,version) VALUES(?,?,?,?)').bind(r.id,JSON.stringify(r),Date.now(),r.version).run():await db.prepare('UPDATE rooms SET data=?,updated=?,version=? WHERE id=? AND version=?').bind(JSON.stringify(r),Date.now(),r.version,r.id,previous).run();if(!result.meta.changes)throw Error('CART_CONFLICT');};
 const load=async id=>{const row=await db.prepare('SELECT data,updated FROM rooms WHERE id=?').bind(String(id||'')).first();if(!row||(!JSON.parse(row.data).prototype&&Date.now()-row.updated>86400000))throw Error('함께 담기 연결이 만료됐어요. 새 초대 링크를 만들어주세요.');return JSON.parse(row.data);};
 const view=r=>({id:r.id,version:r.version,menu:r.menu,restaurant:r.restaurant,demo:r.demo,members:r.members.map(({token,...m})=>m),events:r.events.slice(-8)});
 const auth=async b=>{const r=await load(b.roomId),member=r.members.find(m=>m.token===b.token);if(!member)throw Error('함께 담기 연결을 확인해주세요.');return {r,member};};
 return {async handle(action,b={}){
 if(action==='prototype'){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.pair)||!['seongho','miyeong'].includes(b.person))throw Error('프로토타입 연결 주소를 확인해주세요.');
  const id='prototype-'+b.pair,existing=await db.prepare('SELECT data,updated FROM rooms WHERE id=?').bind(id).first();
  const r=existing?JSON.parse(existing.data):{id,prototype:true,invite:crypto.randomUUID(),version:0,menu:b.menu,restaurant:{name:b.menu.restaurantName},demo:false,members:[{id:'me',name:'박성호',token:crypto.randomUUID(),cart:{},done:false,joined:false},{id:'companion',name:'김미영',token:crypto.randomUUID(),cart:{},done:false,joined:false}],events:[],operations:[]};
  const member=r.members[b.person==='seongho'?0:1];if(!member.joined){member.joined=true;await save(r);}return {room:view(r),token:member.token,memberId:member.id,invite:r.invite};
 }
 if(action==='create'){const r={id:crypto.randomUUID(),invite:crypto.randomUUID(),version:0,menu:null,restaurant:null,demo:false,members:[{id:'me',name:'나',token:crypto.randomUUID(),cart:{},done:false},{id:'companion',name:String(b.name||'동반인').slice(0,30),token:crypto.randomUUID(),cart:{},done:false,joined:false}],events:[],operations:[]};await save(r);return {room:view(r),token:r.members[0].token,memberId:'me',invite:r.invite};}
 if(action==='join'){const r=await load(b.roomId);if(b.invite!==r.invite)throw Error('초대 링크를 확인해주세요.');r.members[1].joined=true;await save(r);return {room:view(r),token:r.members[1].token,memberId:'companion'};}
 const {r,member}=await auth(b);
 if(action==='get')return {room:view(r)};
 if(action==='menu'){if(member.id!=='me')throw Error('메뉴판은 초대한 사람이 공유할 수 있어요.');if(!b.menu?.items?.length||b.menu.items.length>60||JSON.stringify(b.menu).length>300000)throw Error('공유할 메뉴를 확인해주세요.');r.menu=b.menu;r.restaurant=b.restaurant?{name:String(b.restaurant.name||'').slice(0,200),address:String(b.restaurant.address||'').slice(0,500),countryCode:typeof b.restaurant.countryCode==='string'?b.restaurant.countryCode.slice(0,2):null}:null;r.demo=!!b.demo;for(const m of r.members){m.cart={};m.done=false;}for(const i of r.menu.items){const q=b.cart?.[i.id];if(Number.isInteger(q)&&q>0&&q<=99)member.cart[i.id]=q;}r.events=[];r.operations=[];}
 else if(action==='delta'){if(!r.menu?.items.some(i=>String(i.id)===String(b.itemId))||![1,-1].includes(b.delta)||typeof b.operationId!=='string'||b.operationId.length>100)throw Error('잘못된 장바구니 변경입니다.');if(r.operations.includes(b.operationId))return {room:view(r)};r.operations.push(b.operationId);r.operations=r.operations.slice(-1000);const id=String(b.itemId),q=Math.min(99,Math.max(0,(member.cart[id]||0)+b.delta));if(q)member.cart[id]=q;else delete member.cart[id];member.done=false;r.events.push({id:b.operationId,memberId:member.id,name:member.name,itemId:id,delta:b.delta,at:Date.now()});r.events=r.events.slice(-20);}
 else if(action==='done'){member.done=!!b.done;}
 else throw Error('함께 담기 요청을 확인해주세요.');await save(r);return {room:view(r)};
 }};
}
