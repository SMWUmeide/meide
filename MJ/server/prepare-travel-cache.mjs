import { resolve } from 'node:path';
import { TravelService } from './travel-service.mjs';
const travel=new TravelService(resolve(process.env.TRAVEL_CACHE_DIR??'travel-cache'));
try {await travel.ready;console.log('Travel index verified and prepared.');}finally{await travel.close();}
