import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { InviteStore } from './invite-store.mjs';
import { createApp } from './app.mjs';
import { MenuTestLimits } from './menu-test-limits.mjs';
import { createGoogleMenuProviders } from './google-menu.mjs';
import { NearbyTestLimits } from './nearby-test-limits.mjs';
import { createGoogleNearbyProvider } from './google-nearby.mjs';
import { existsSync } from 'node:fs';
import { TravelService } from './travel-service.mjs';
import { WebMapLimits } from './web-map-limits.mjs';
import { createFirestoreStorage } from './firestore-storage.mjs';
const root = fileURLToPath(new URL('../',import.meta.url));
// Server secrets live separately from Expo's environment loader.
const serverEnv=process.env.SERVER_CONFIG_FILE??resolve(root,'server/.env.local');
if (existsSync(serverEnv)) process.loadEnvFile(serverEnv);
const port = Number(process.env.PORT ?? 5190);
const origins = (process.env.ALLOWED_ORIGINS ?? `http://localhost:${port},http://127.0.0.1:${port},http://localhost:8081,http://127.0.0.1:8081`).split(',');
const cloud=process.env.STORAGE_BACKEND==='firestore'?await createFirestoreStorage():null;
if(process.env.K_SERVICE&&process.env.REMOTE_API_ORIGIN)throw Error('Cloud Run must serve its own API.');
if(process.env.K_SERVICE&&!cloud)throw Error('Cloud Run requires Firestore persistence.');
if(cloud)await cloud.ready();
const store = cloud?.store??new InviteStore(process.env.INVITE_DB_PATH ?? resolve(root,'.local-data/invites.json'));
// Google search includes at most five photos and one map; no automatic retry.
// The old GPT route remains disabled even if historical GPT env flags are set.
const interpret = (await import('./ordering-analysis.mjs')).interpretMenu;
const menuTest = new MenuTestLimits({file:process.env.MENU_TEST_LEDGER_PATH ?? resolve(root,'.local-data/menu-test-usage.json'),providers:{...createGoogleMenuProviders(),interpret},ledger:cloud?.ledger});
const nearbyTest = new NearbyTestLimits({menuTest,provider:createGoogleNearbyProvider()});
const travelSearch = new TravelService(process.env.TRAVEL_CACHE_DIR??resolve(root,'.local-data'));
await travelSearch.ready;
const webMaps=new WebMapLimits({menuTest,key:process.env.GOOGLE_MAPS_WEB_API_KEY});
// Cloud Run's proxy can share one socket IP across all 12 pilot users. Keep an
// aggregate request cap without trusting a spoofable forwarded address; paid
// operations still use authenticated, transactional per-user daily limits.
const server = createApp({store,webRoot:resolve(root,'dist/web'),allowedOrigins:origins,menuTest,nearbyTest,travelSearch,webMaps,requestLimit:cloud?240:60,remoteApiOrigin:process.env.REMOTE_API_ORIGIN});
server.on('close', () => {void travelSearch.close();void cloud?.close();});
server.listen(port,process.env.HOST ?? (process.env.K_SERVICE?'0.0.0.0':'127.0.0.1'),()=>console.log(`Meide server ready on port ${port}; storage=${cloud?'firestore':'local'}`));
process.on('SIGTERM',()=>{server.close();setTimeout(()=>process.exit(0),8000).unref();});
