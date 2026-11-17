export const NEARBY_RESERVATION_MICRO_USD=120000;
export const NEARBY_DAILY_LIMIT=2;
export const MAP_LOAD_RESERVATION_MICRO_USD=20000;
const fail=(status,message)=>Object.assign(new Error(message),{status});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const day=now=>new Date(now+9*3600000).toISOString().slice(0,10);
export const reservedTotal=ledger=>ledger.jobs.reduce((sum,job)=>sum+job.reserved,0)+(ledger.nearbyJobs??[]).reduce((sum,job)=>sum+job.reserved,0)+(ledger.mapLoads??[]).reduce((sum,job)=>sum+job.reserved,0);
export function validateNearbyLedger(ledger) {
  const nearbyValid=ledger.nearbyJobs===undefined || (Array.isArray(ledger.nearbyJobs)&&ledger.nearbyJobs.length<=600&&ledger.nearbyJobs.every(job=>job&&uuid.test(job.id)&&uuid.test(job.requestId)&&/^\d{4}-\d{2}-\d{2}$/.test(job.day)&&job.reserved===NEARBY_RESERVATION_MICRO_USD&&['pending','done','failed'].includes(job.status)));
  const mapsValid=ledger.mapLoads===undefined || (Array.isArray(ledger.mapLoads)&&ledger.mapLoads.length<=2500&&ledger.mapLoads.every(job=>job&&uuid.test(job.id)&&uuid.test(job.requestId)&&/^\d{4}-\d{2}-\d{2}$/.test(job.day)&&job.reserved===MAP_LOAD_RESERVATION_MICRO_USD));
  return nearbyValid&&mapsValid;
}
export class NearbyTestLimits {
  constructor({menuTest,provider}) {this.menuTest=menuTest;this.provider=provider;}
  status(id) {
    try {
      const policy=this.menuTest.check(id);
      if(!this.provider)return {ready:false,message:'주변 식당 연결을 준비하고 있어요.'};
      return this.menuTest.transaction(policy,ledger=>{
        const jobs=ledger.nearbyJobs??[], used=jobs.filter(job=>job.id===id.toLowerCase()&&job.day===day(this.menuTest.now())).length;
        const remaining=reservedTotal(ledger)+NEARBY_RESERVATION_MICRO_USD<=policy.budgetMicroUsd && jobs.length<600?Math.max(0,NEARBY_DAILY_LIMIT-used):0;
        return {ready:remaining>0,remaining,message:remaining?'':'오늘 사용할 수 있는 주변 검색 횟수 또는 테스트 비용 한도에 도달했어요.'};
      });
    } catch(error) {return {ready:false,message:error.status?error.message:'사용량을 확인하지 못했어요.'};}
  }
  async search({id,requestId,latitude,longitude,radius,consent}) {
    const policy=this.menuTest.check(id);id=id.toLowerCase();
    if(!uuid.test(requestId??''))throw fail(400,'주변 검색 요청을 확인해 주세요.');
    requestId=requestId.toLowerCase();
    if(consent!==true||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180||![500,1000,3000].includes(radius)) throw fail(400,'위치와 검색 범위를 확인해 주세요.');
    if(!this.provider)throw fail(503,'주변 식당 연결을 준비하고 있어요.');
    await this.menuTest.transaction(policy,ledger=>{
      ledger.nearbyJobs??=[];
      if(ledger.nearbyJobs.some(job=>job.id===id&&job.requestId===requestId))throw fail(409,'이미 요청한 주변 검색이에요. 자동 재시도하지 않았어요.');
      const today=day(this.menuTest.now());
      if(ledger.nearbyJobs.filter(job=>job.id===id&&job.day===today).length>=NEARBY_DAILY_LIMIT)throw fail(429,'오늘은 주변 검색 2회를 모두 사용했어요. 받아둔 결과는 계속 볼 수 있어요.');
      if(ledger.nearbyJobs.length>=600||reservedTotal(ledger)+NEARBY_RESERVATION_MICRO_USD>policy.budgetMicroUsd)throw fail(429,'테스트 API 비용 한도에 도달했어요.');
      // Never persist coordinates or Google place content in the quota ledger.
      ledger.nearbyJobs.push({id,requestId,day:today,reserved:NEARBY_RESERVATION_MICRO_USD,status:'pending'});
    });
    try {
      const result=await this.provider({latitude,longitude,radius});
      await this.menuTest.transaction(policy,ledger=>{ledger.nearbyJobs.find(job=>job.id===id&&job.requestId===requestId).status='done';});
      return result;
    } catch {
      await this.menuTest.transaction(policy,ledger=>{ledger.nearbyJobs.find(job=>job.id===id&&job.requestId===requestId).status='failed';});
      throw fail(502,'주변 식당을 불러오지 못했어요. 자동 재시도하지 않았어요.');
    }
  }
}
