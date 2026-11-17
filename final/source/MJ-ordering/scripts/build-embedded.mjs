import { Buffer } from "node:buffer";
import { build } from 'vite';
import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const mobileRoot=resolve(process.env.MEIDE_MOBILE_DIR ?? (existsSync('../meide-mobile/package.json')?'../meide-mobile':'../MJ'));
// Only public client configuration. Server credentials are never build inputs.
Object.assign(process.env,{VITE_EMBEDDED:'true',VITE_API_BASE_URL:'https://meide-meide1.vercel.app',VITE_SUPABASE_URL:'https://xtxyobkbxpfyeuiuhbaf.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_MbATZ-RjVCkL2VYJ3Ykk1w_VSBRbdFk',VITE_APP_URL:'https://meide-api-dxnbcriiga-du.a.run.app'});
await build({configFile:'vite.embedded.config.ts'});
let html=readFileSync('dist-embedded/embedded.html','utf8');
html=html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,path)=>{
 let js=readFileSync(resolve('dist-embedded',path),'utf8');
 js=js.replace(/\/figma\/([A-Za-z0-9_-]+\.(?:svg|png|jpg))/g,(_match,name)=>{
  const mime=name.endsWith('.svg')?'image/svg+xml':name.endsWith('.png')?'image/png':'image/jpeg';
  return `data:${mime};base64,${readFileSync(resolve('public/figma',name)).toString('base64')}`;
 });
 return `<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`;
});
html=html.replace(/<link[^>]*href="([^"]+\.css)"[^>]*>/g,(_,path)=>`<style>${readFileSync(resolve('dist-embedded',path),'utf8')}</style>`);
if(/(?:src|href)="\.\/assets\//.test(html))throw Error('Unbundled assets remain');
const destination=resolve(mobileRoot,'assets/ordering');mkdirSync(destination,{recursive:true});
writeFileSync(resolve(destination,'embedded.json'),JSON.stringify({html})+'\n');
writeFileSync(resolve(destination,'NOTICE.md'),'YJ source: SMWUmeide/meide src branch d9466d8, adapted into a bundled in-app screen.\nSources: apps/meide-orders. Rebuild: node scripts/build-embedded.mjs in that directory.\nNo secret credentials. Supabase publishable configuration is intentionally public.\n');
await build({configFile:'vite.server.config.ts'});
writeFileSync(resolve(mobileRoot,'server/ordering-analysis.mjs'),readFileSync('dist-server/ordering-analysis.mjs'));
console.log(JSON.stringify({bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')}));
