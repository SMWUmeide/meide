import { MAP_LOAD_RESERVATION_MICRO_USD, reservedTotal } from './nearby-test-limits.mjs';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const WEB_MAP_DAILY_LIMIT=100;

// App-side permission before each new map instance. This cannot enforce a
// Google-wide billing cap: the browser must receive its restricted client key.
export class WebMapLimits {
  constructor({menuTest,key}) {this.menuTest=menuTest;this.key=key?.trim();}
  authorize({id,requestId}) {
    const policy=this.menuTest.check(id);
    if(!this.key)throw fail(503,'지도 연결을 준비하고 있어요.');
    if(!uuid.test(requestId??''))throw fail(400,'지도 요청을 확인해 주세요.');
    const reserved=this.menuTest.transaction(policy,ledger=>{
      ledger.mapLoads??=[];
      if(ledger.mapLoads.some(load=>load.requestId===requestId.toLowerCase()))throw fail(409,'이미 요청한 지도예요.');
      const day=new Date(this.menuTest.now()+9*3600000).toISOString().slice(0,10);
      if(ledger.mapLoads.filter(load=>load.day===day).length>=WEB_MAP_DAILY_LIMIT)throw fail(429,'오늘 지도 이용 한도에 도달했어요. 식당 목록은 계속 확인할 수 있어요.');
      if(ledger.mapLoads.length>=2500||reservedTotal(ledger)+MAP_LOAD_RESERVATION_MICRO_USD>policy.budgetMicroUsd)throw fail(429,'테스트 지도 이용 한도에 도달했어요.');
      ledger.mapLoads.push({id:id.toLowerCase(),requestId:requestId.toLowerCase(),day,reserved:MAP_LOAD_RESERVATION_MICRO_USD});
    });
    return reserved&&typeof reserved.then==='function'?reserved.then(()=>({apiKey:this.key})):{apiKey:this.key};
  }
}
