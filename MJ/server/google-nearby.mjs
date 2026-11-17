import { ASIAN_TYPES, KOREAN_TYPES, classifyRestaurant, distanceMeters } from './nearby-categories.mjs';
const fields = ['id','displayName','formattedAddress','location','googleMapsUri','primaryType','primaryTypeDisplayName','types','rating','userRatingCount','attributions','businessStatus'].map(field=>'places.'+field).join(',');
const safeUrl = value => { try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;} };
export function createGoogleNearbyProvider({env=process.env,fetchImpl=fetch}={}) {
  const key=env.GOOGLE_MENU_API_KEY?.trim();
  if (!key) return null;
  async function search(center,radius,includedTypes) {
    const response=await fetchImpl('https://places.googleapis.com/v1/places:searchNearby',{
      method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':fields},
      body:JSON.stringify({includedTypes,maxResultCount:20,rankPreference:'DISTANCE',languageCode:'ko',locationRestriction:{circle:{center,radius}}}),
      redirect:'error',signal:AbortSignal.timeout(25000),
    });
    if(!response.ok) throw Error('Google 식당 검색에 연결하지 못했어요.');
    const data=await response.json();
    return (data.places??[]).slice(0,20);
  }
  return async({latitude,longitude,radius})=>{
    const center={latitude,longitude};
    // Fetch each category once; changing tabs has no provider requests. A
    // targeted Korean query avoids losing it behind 20 nearer other cuisines.
    const queries=await Promise.allSettled([search(center,radius,['restaurant']),search(center,radius,ASIAN_TYPES),search(center,radius,KOREAN_TYPES)]);
    if(queries.every(query=>query.status==='rejected')) throw Error('Google 식당 검색에 연결하지 못했어요.');
    const byId=new Map();
    for(const query of queries) if(query.status==='fulfilled') for(const place of query.value) {
      if(!/^[A-Za-z0-9_-]+$/.test(place.id)||!place.displayName?.text||place.businessStatus==='CLOSED_PERMANENTLY')continue;
      const {latitude:lat,longitude:lon}=place.location??{};
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)continue;
      const distance=distanceMeters(center,place.location);
      if(distance>radius)continue;
      const cuisine=classifyRestaurant(place);
      byId.set(place.id,{id:place.id,name:place.displayName.text,address:place.formattedAddress??'',category:place.primaryTypeDisplayName?.text??'음식점',location:{latitude:lat,longitude:lon},distanceMeters:Math.round(distance),rating:typeof place.rating==='number'?place.rating:null,reviewCount:place.userRatingCount??0,googleMapsUri:safeUrl(place.googleMapsUri),cuisine,attributions:(place.attributions??[]).map(item=>({name:item.provider??'',uri:safeUrl(item.providerUri)}))});
    }
    const sorted=[...byId.values()].sort((a,b)=>a.distanceMeters-b.distanceMeters);
    const lists={all:sorted.slice(0,20),asian:sorted.filter(p=>p.cuisine.asian).slice(0,20),korean:sorted.filter(p=>p.cuisine.korean).slice(0,20)};
    // Coordinates feed the interactive Google map. No Static Maps requests.
    return {center,radius,groups:Object.fromEntries(Object.entries(lists).map(([category,places],index)=>[category,{places,incomplete:queries[index].status==='rejected'}])),fetchedAt:Date.now()};
  };
}
