/* global document */
import { _android, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import assert from 'node:assert/strict';
// User takes a real photo in the native camera before running this check.
// Do not reload, seed a session, select a file, or replace API responses.
const device=(await _android.devices())[0];
assert.ok(device,'촬영하고 돌아온 실제 Android 폰이 필요해요');
const report={startedAt:new Date().toISOString(),requests:[],photos:[],errors:[]};
try{
 const page=await (await device.webView({pkg:'app.meide.preview'})).page();
 const pending=[];
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',response=>{if(!response.url().includes('/api/'))return;pending.push((async()=>{
  const path=new URL(response.url()).pathname;const body=await response.json();report.requests.push({path,status:response.status()});
  if(body.board)report.board=body.board;if(body.photos)report.photos.push(...body.photos);
 })().catch(e=>report.errors.push(e.message)));});
 await expect(page.getByText('촬영한 사진을 선택했어요. 분석하기를 눌러 주세요',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'메뉴판 분석하기',exact:true})).toBeEnabled();
 report.nativeCameraReturned=true;
 await page.getByRole('button',{name:'메뉴판 분석하기',exact:true}).click();
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='메뉴판 분석하기'&&!b.disabled),{},{timeout:450000});
 await Promise.all(pending);assert.equal(report.board?.source,'gemini');assert.equal(report.board.items.length,4);
 report.status=await page.getByRole('status').allTextContents();
 await page.getByRole('button',{name:'개인 메뉴판 열기',exact:true}).click();
 const item=report.board.items[0];
 await page.getByRole('button',{name:`${item.name} 담기`,exact:true}).click();
 await page.locator('.cart-bar button').click();
 await page.getByRole('button',{name:'주문 문장 만들기',exact:true}).click();
 await page.getByRole('button',{name:'영수증 보기',exact:true}).click();
 report.receipt=await page.locator('.receipt-total').innerText();assert.ok(report.receipt.includes(item.priceEur.toFixed(2)));
 assert.deepEqual(report.errors,[]);report.success=true;
 console.log(JSON.stringify({camera:report.nativeCameraReturned,menus:report.board.items.map(i=>({name:i.originalName,price:i.priceEur})),photos:report.photos.map(p=>p.status),receipt:report.receipt,status:report.status},null,2));
}finally{await writeFile('outputs/native-camera-report.json',JSON.stringify(report,null,2));await device.close();}
