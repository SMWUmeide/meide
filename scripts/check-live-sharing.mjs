/* global localStorage */
import { URL } from 'node:url';
import { chromium, expect, _android } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

// Restore a previously captured REAL analysis. Never intercept network responses.
const input = JSON.parse(await readFile(process.argv[2] || 'outputs/live-api-report.json', 'utf8'));
assert.equal(input.board?.source, 'gemini');
assert.ok(input.restored && input.requests.some(r => r.endpoint === '/api/analyze-menu' && r.status === 200));
const board = input.board;
const base = process.env.MEIDE_TEST_URL || 'http://127.0.0.1:5174';
const report = { startedAt: new Date().toISOString(), analysisRecordedAt: input.startedAt, checks: [], errors: [], realtimeFrames: 0, snapshots: [], socketEvents: [] };
const androidDevice = process.env.MEIDE_ANDROID === '1' ? (await _android.devices())[0] : null;
if (process.env.MEIDE_ANDROID === '1' && !androidDevice) throw new Error('연결된 Android 폰이 필요해요');
const hostBase = androidDevice ? 'https://localhost' : base;
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const check = name => { report.checks.push(name); console.log('✓', name); };
try {
  const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  const [desktopHost, guest] = await Promise.all(contexts.map(c => c.newPage()));
  const host = androidDevice ? await (await androidDevice.webView({pkg:'app.meide.preview'})).page() : desktopHost;
  for (const page of [host, guest]) {
    page.on('response', async response => { if (!response.url().includes('/rpc/')) return; try { const d = await response.json(); if (d?.revision) report.snapshots.push({path: new URL(response.url()).pathname, page: page===host?'host':'guest', revision:d.revision,members:d.members.map(m=>m.name), cartCount:d.cart.length}); } catch { /* Only record successful snapshots. */ } });
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('websocket', socket => socket.on('framereceived', event => {
      if (String(event.payload).includes('postgres_changes')) report.realtimeFrames++;
      try { const d=JSON.parse(String(event.payload));report.socketEvents.push({page:page===host?'host':'guest',event:d.event,topic:d.topic?.split(':')[0],status:d.payload?.status}); } catch { /* Heartbeats can use a non-JSON frame. */ }
    }));
  }
  await host.goto(hostBase);
  await host.evaluate(board => localStorage.setItem('meide.order.v1', JSON.stringify({ version: 1, board, cart: [], category: board.categories[0].id, tip: false, tipRate: 10, request: '' })), board);
  await host.goto(`${hostBase}/#/setup`); await host.reload();
  await host.getByLabel('동반인에게 보일 이름', { exact: true }).fill('점검호스트');
  await host.getByRole('button', { name: '동반인 초대 링크 만들기', exact: true }).click();
  const invite = await host.getByLabel('동반인 초대 링크', { exact: true }).inputValue({ timeout: 30000 });
  report.inviteOrigin = new URL(invite).origin;
  await host.getByRole('button', { name: '공동 메뉴판 열기', exact: true }).click();
  await expect(host.getByText('동반인과 실시간으로 함께 고르고 있어요', { exact: true })).toBeVisible({ timeout: 30000 });
  await guest.goto(invite);
  await guest.getByRole('dialog').getByLabel('동반인에게 보일 이름', { exact: true }).fill('점검동반인');
  await guest.getByRole('button', { name: '함께 고르기', exact: true }).click();
  await expect(guest.getByText('동반인과 실시간으로 함께 고르고 있어요', { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(host.getByText('점검동반인님과 함께 고르는 중', { exact: true })).toBeVisible({ timeout: 15000 });
  check('서로 다른 게스트 로그인 · 실제 방 생성 · 초대 참여');
  for (const category of board.categories) {
    await expect(guest.getByRole('region', { name: `${category.name} 메뉴`, exact: true })).toBeVisible();
  }
  check('실제 AI 카테고리와 메뉴판 공유');
  const first = board.items[0];
  const second = board.items[1];
  await guest.getByRole('button', { name: `${first.name} 담기`, exact: true }).click();
  await expect(host.locator('.companion-notice')).toContainText(`점검동반인님이 ‘${first.name}’을 1개 담았어요`, { timeout: 15000 });
  await expect(host.locator('.menu-card').filter({ has: host.getByRole('button', {name: `${first.name} 상세 보기`, exact: true}) }).locator('.menu-person')).toContainText('점검동반인님');
  check('동반인 담기 → 호스트 실시간 알림과 메뉴 표시');
  await host.getByRole('button', { name: `${second.name} 담기`, exact: true }).click();
  await expect(guest.locator('.companion-notice')).toContainText(`점검호스트님이 ‘${second.name}’을 1개 담았어요`, { timeout: 15000 });
  check('호스트 담기 → 동반인 역방향 실시간 알림');
  for (const page of [host, guest]) {
    await page.locator('.cart-bar button').click();
    await expect(page.locator('.cart-group')).toHaveCount(2);
  }
  await guest.getByRole('button', { name: `${first.name} 수량 늘리기`, exact: true }).click();
  await expect(host.getByLabel(`${first.name} 수량`, {exact:true})).toHaveText('2', {timeout:15000});
  await expect(host.getByRole('button', {name:`${first.name} 수량 늘리기`,exact:true})).toBeDisabled();
  check('공동 장바구니 수량 실시간 동기화 · 다른 사람 메뉴 변경 방지');
  await host.reload();
  await expect(host.getByLabel(`${first.name} 수량`, {exact:true})).toHaveText('2', {timeout:30000});
  await host.getByRole('button', {name:'주문 문장 만들기',exact:true}).click();
  await host.getByRole('button', {name:'영수증 보기',exact:true}).click();
  await expect(host.locator('.receipt-total')).toContainText((first.priceEur*2+second.priceEur).toFixed(2));
  check('새로고침 공유 복원 · 공동 주문/영수증 합계');
  const roomId = await host.evaluate(() => localStorage.getItem('meide.shared-room.v1'));
  const env = loadEnv('development',process.cwd(),'');
  const outsider = createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const signed = await outsider.auth.signInAnonymously(); assert.equal(signed.error,null);
  const denied = await outsider.rpc('read_order_room',{target:roomId}); assert.ok(denied.error);
  const deniedWrite = await outsider.rpc('change_order_item',{target:roomId,menu_id:first.id,action:'add'}); assert.ok(deniedWrite.error);
  await outsider.auth.signOut();
  check('초대받지 않은 사용자 조회·수정 차단');
  assert.ok(report.realtimeFrames > 0); assert.deepEqual(report.errors,[]);
  report.success = true;
} finally {
  await mkdir('outputs',{recursive:true});
  await writeFile(androidDevice ? 'outputs/android-live-sharing-report.json' : 'outputs/live-sharing-report.json',JSON.stringify(report,null,2));
  await browser.close();
  await androidDevice?.close();
}
