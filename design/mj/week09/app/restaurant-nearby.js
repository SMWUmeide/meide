// Distances are measured from the confirmed restaurant, never from the device.
export const NEARBY_RADIUS_METERS=700;
export function distanceMeters(a,b){
 if(![a?.lat,a?.lng,b?.lat,b?.lng].every(Number.isFinite))return Infinity;
 const rad=n=>n*Math.PI/180,dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);
 const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function nearbyRestaurants(center,rows){return rows.filter(p=>(!center.id||p.id!==center.id)&&p.name!==center.name&&p.businessStatus!=='CLOSED_PERMANENTLY').map(p=>({...p,distance:distanceMeters(center,p)})).filter(p=>p.distance<=NEARBY_RADIUS_METERS).sort((a,b)=>a.distance-b.distance).slice(0,3)}
