import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),source=new URL('hanip-europe-site/',root),target=new URL('gourmet-app/',root);
const check=process.argv.includes('--check');let differences=0,files=0;
async function transfer(from,to,transform){const original=await readFile(from);const data=transform?Buffer.from(transform(original.toString())):original;let existing;try{existing=await readFile(to);}catch{}files++;if(existing?.equals(data))return;differences++;if(check){console.error('Out of sync:',fileURLToPath(to));return;}await mkdir(new URL('./',to),{recursive:true});await writeFile(to,data);}
async function tree(from,to){for(const e of await readdir(from,{withFileTypes:true})){if(e.name.startsWith('.'))continue;const a=new URL(e.name+(e.isDirectory()?'/':''),from),b=new URL(e.name+(e.isDirectory()?'/':''),to);if(e.isDirectory())await tree(a,b);else if(e.isFile())await transfer(a,b);}}
for(const e of await readdir(new URL('public/',source),{withFileTypes:true}))if(e.isFile()&&!e.name.startsWith('.'))await transfer(new URL('public/'+e.name,source),new URL('public/'+e.name,target));
await tree(new URL('public/assets/',source),new URL('public/assets/',target));
await tree(new URL('lib/menus/',source),new URL('data/restaurants/',target));
await transfer(new URL('lib/restaurant-catalog.mjs',source),new URL('restaurant-catalog.mjs',target),s=>s.replaceAll("'../public/","'./public/").replaceAll('"./menus/','"./data/restaurants/'));
for(const name of ['korean-dining.test.mjs','live-translation.test.mjs'])await transfer(new URL('scripts/'+name,source),new URL('tests/'+name,target),s=>s.replaceAll("'../lib/restaurant-catalog.mjs'","'../restaurant-catalog.mjs'").replaceAll("'../lib/live-translation.mjs'","'../public/live-translation.js'"));
console.log(`${check?'Checked':'Synced'} ${files} shared files; ${differences} ${check?'differences':'updates'}.`);if(check&&differences)process.exitCode=1;
