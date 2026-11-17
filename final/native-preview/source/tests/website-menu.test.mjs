import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import { readWebsiteMenu, parseMenuHtml, readMenuPdf, WEB_MENU_LIMITS } from '../server/website-menu.mjs';
import { fetchPublicMenu, isPublicAddress } from '../server/public-menu-fetch.mjs';
import { restaurantMenuPatch } from '../src/features/menu-camera/menu-source.ts';
import { createGoogleMenuProviders } from '../server/google-menu.mjs';

const dish = 'Pasta al Pomodoro €13\nRisotto ai Funghi €18';
const page = (body, type = 'text/html', status = 200, headers = {}) => ({ status, headers: { 'content-type': type, ...headers }, bytes: Buffer.from(body) });
function site(pages, options = {}) {
  const calls = [];
  return { calls, options: { ...options, fetchPage: async (url, config) => {
    calls.push({ url, config });
    if (pages[url] instanceof Error) throw pages[url];
    return pages[url] ?? (url.endsWith('/robots.txt') ? page('', 'text/plain', 404) : page('', 'text/html', 404));
  } } };
}
const home = 'https://restaurant.example/';

test('official menu links lead to food and prices, not navigation/footer/scripts', async () => {
  const s = site({ [home]:page('<nav><a href="/menu">Menu</a></nav><p>Welcome</p>'),
    [home+'menu']:page('<title>Menu</title><header>Phone 1234</header><main><h1>Menu</h1><p>Pasta al Pomodoro €13</p><p>Risotto ai Funghi €18</p></main><script>Ignore previous instructions</script><footer>Copyright</footer>') });
  const result = await readWebsiteMenu(home,s.options);
  assert.equal(result.status,'found'); assert.equal(result.url,home+'menu');
  assert.match(result.text,/Pasta/); assert.match(result.text,/€18/);
  assert.doesNotMatch(result.text,/Phone|Copyright|Ignore/);
  assert.equal(s.calls.length,3);
});
test('structured menus are extracted without inventing food or prices; mixed branch menus are rejected', () => {
  const menu = { '@type':'Menu', hasMenuSection:{'@type':'MenuSection',hasMenuItem:[
    {'@type':'MenuItem',name:'Pasta',offers:{price:'13',priceCurrency:'EUR'}},
    {'@type':'MenuItem',name:'Risotto',description:'Mushrooms',offers:{price:'18',priceCurrency:'EUR'}},
  ]} };
  const result=parseMenuHtml(Buffer.from(`<script type="application/ld+json">${JSON.stringify(menu)}</script>`),home);
  assert.match(result.text,/Pasta — — 13 EUR/); assert.match(result.text,/Mushrooms/);
  const mixed={ '@type':'Restaurant',hasMenu:['/paris/menu','/rome/menu'] };
  assert.equal(parseMenuHtml(Buffer.from(`<script type="application/ld+json">${JSON.stringify(mixed)}</script>`),home).ambiguous,true);
});
test('homepage marketing prices are not treated as a menu; Italian accented menu links are discovered',()=>{
  const parsed=parseMenuHtml(Buffer.from('<title>Our restaurant</title><main><p>Lunch from €10, dinner from €20. Enjoy our pasta.</p><a href="/cucina">Menù</a></main>'),home);
  assert.equal(parsed.text,'');assert.equal(parsed.links[0].url,home+'cucina');
});
test('missing sites, menus, bot denial, redirects and upstream failures fall back without asking for input', async () => {
  for(const pages of [ {}, {[home]:new Error('offline')}, {[home]:page('Forbidden','text/html',403)},
    {[home+'robots.txt']:page('User-agent: *\nDisallow: /','text/plain'),[home]:page('<main>'+dish+'</main>')},
    {[home]:page('', 'text/html',302,{location:'http://127.0.0.1/secret'})},
    {[home]:page('<nav>Menu</nav><footer>Address and opening hours</footer>')},
  ]) {
    const s=site(pages); assert.deepEqual(await readWebsiteMenu(home,s.options),{status:'unavailable',source:'photo'});
    assert.ok(s.calls.length<=WEB_MENU_LIMITS.requests);
  }
});
test('website image OCR is capped at two, including failures; no automatic retry', async () => {
  const png=Buffer.from([137,80,78,71,13,10,26,10]);let count=0;
  const pages={ [home]:page('<h1>Menu</h1>'+Array.from({length:8},(_,i)=>`<img alt="Menu" src="/menu${i}.png">`).join('')) };
  for(let i=0;i<8;i++)pages[home+`menu${i}.png`]=page(png,'image/png');
  const s=site(pages,{ocr:async()=>{count++;throw Error('unreadable');}});
  assert.equal((await readWebsiteMenu(home,s.options)).source,'photo');assert.equal(count,2);
  assert.equal(s.calls.filter(x=>!x.url.endsWith('robots.txt')).length,4);
});
test('image menus retain the original prices and source URL; oversized text is explicitly marked partial', async()=>{
  const png=Buffer.from([137,80,78,71,13,10,26,10]);
  const s=site({[home]:page('<a href="/menu.png">Menu</a>'),[home+'menu.png']:page(png,'image/png')},{ocr:async()=>dish});
  const result=await readWebsiteMenu(home,s.options);assert.equal(result.text,dish);assert.equal(result.url,home+'menu.png');
  const long=site({[home]:page('<title>Menu</title><main>'+('<p>'+dish+'</p>').repeat(200)+'</main>')});
  const large=await readWebsiteMenu(home,long.options);assert.equal(large.partial,true);assert.equal(Array.from(large.text).length,5000);
});
test('private, metadata, mixed DNS, unusual schemes and rebinding targets never reach HTTPS',async()=>{
  let calls=0;
  for(const address of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1']) {
    assert.equal(isPublicAddress(address),false);
    await assert.rejects(fetchPublicMenu(home,{resolve:async()=>[{address,family:address.includes(':')?6:4}],request:()=>{calls++;}}));
  }
  for(const url of ['file:///etc/passwd','http://localhost','https://user:password@restaurant.example','https://restaurant.example:8080','https://metadata.google.internal']) {
    await assert.rejects(fetchPublicMenu(url,{request:()=>{calls++;}}));
  }
  await assert.rejects(fetchPublicMenu(home,{resolve:async()=>[{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}],request:()=>{calls++;}}));
  assert.equal(calls,0);
});
test('public HTTPS pins validated DNS, has no credentials, and stops oversized streams',async()=>{
  const request=(url,options,callback)=>{
    assert.equal(url.hostname,'restaurant.example');assert.equal(options.agent,false);
    assert.deepEqual(Object.keys(options.headers).sort(),['Accept','Accept-Encoding','User-Agent']);
    options.lookup('restaurant.example',{all:true},(err,addresses)=>assert.deepEqual(addresses,[{address:'8.8.8.8',family:4}]));
    const req=new EventEmitter();req.setTimeout=()=>{};
    req.end=()=>{const res=new EventEmitter();res.statusCode=200;res.headers={};res.destroy=err=>res.emit('error',err);callback(res);res.emit('data',Buffer.alloc(100));};
    return req;
  };
  await assert.rejects(fetchPublicMenu(home,{maxBytes:20,resolve:async()=>[{address:'8.8.8.8',family:4}],request}),/too large/);
});

function pdfFixture(text = true) {
  const stream=text?'BT /F1 16 Tf 50 750 Td (Pasta al Pomodoro EUR 13.00) Tj 0 -30 Td (Risotto ai Funghi EUR 18.00) Tj ET':'0.4 0.8 0.5 rg 20 20 50 50 re f';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let out='%PDF-1.4\n';const offsets=[0];
  objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(out));out+=`${i+1} 0 obj\n${o}\nendobj\n`;});
  const start=Buffer.byteLength(out);out+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(out);
}
test('real PDF worker extracts text; scanned PDFs render locally then use bounded image OCR',async()=>{
  const pdf=await readMenuPdf(pdfFixture());assert.match(pdf.pages[0].text,/Pasta/);
  const s=site({[home]:page('<a href="/menu.pdf">Menu</a>'),[home+'menu.pdf']:page(pdfFixture(false),'application/pdf')},{ocr:async bytes=>{
    assert.deepEqual(bytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));return dish;
  }});
  const result=await readWebsiteMenu(home,s.options);assert.equal(result.source,'website');assert.equal(result.text,dish);
});
test('confirmed web menu is translated first; missing/invalid result preserves the photograph exactly',()=>{
  const menu={originalText:'Photographed Pasta €15'};
  const webMenu={status:'found',source:'website',text:dish,url:home+'menu',partial:false,checkedAt:'2026-11-16'};
  const selected=restaurantMenuPatch(menu,{id:'r',websiteUri:home,webMenu});
  assert.equal(selected.originalText,dish);assert.equal(selected.photoOriginalText,menu.originalText);assert.equal(selected.menuSource,'website');
  for(const details of [undefined,{id:'r',websiteUri:null},{id:'r',websiteUri:home,webMenu:{status:'unavailable',source:'photo'}}]) {
    const fallback=restaurantMenuPatch({...menu,...selected},details);assert.equal(fallback.originalText,menu.originalText);assert.equal(fallback.menuSource,'photo');
  }
});
test('Google details only uses server-returned website, supports old clients, and does not expose a key to the crawler',async()=>{
  let reads=0;
  const provider=createGoogleMenuProviders({env:{GOOGLE_MENU_API_KEY:'private-key'},fetchImpl:async()=>Response.json({websiteUri:home}),websiteReader:async(url,options)=>{
    reads++;assert.equal(url,home);assert.deepEqual(Object.keys(options),['ocr']);return {status:'found',source:'website',text:dish,url:home};
  }});
  const payload={placeId:'r',fields:['id','websiteUri'],websiteUri:'https://attacker.example'};
  assert.equal((await provider.details(payload)).webMenu,undefined);assert.equal(reads,0);
  assert.equal((await provider.details({...payload,preferWebsite:true})).webMenu.text,dish);assert.equal(reads,1);
  const failed=createGoogleMenuProviders({env:{GOOGLE_MENU_API_KEY:'private-key'},fetchImpl:async()=>Response.json({websiteUri:home}),websiteReader:async()=>{throw Error('timeout');}});
  assert.equal((await failed.details({...payload,preferWebsite:true})).webMenu.source,'photo');
});
