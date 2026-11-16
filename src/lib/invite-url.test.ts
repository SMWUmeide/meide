import { afterEach, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { inviteUrl, inviteToken } from './invite-url';
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it('설치 앱에서도 공개 HTTPS 초대 주소를 만들어요',()=>{
 vi.spyOn(Capacitor,'isNativePlatform').mockReturnValue(true);
 vi.stubEnv('VITE_APP_URL','https://meide-meide1.vercel.app');
 expect(inviteUrl('a'.repeat(64))).toBe(`https://meide-meide1.vercel.app/join/${'a'.repeat(64)}`);
});
it('네이티브 앱의 localhost 초대는 차단해요',()=>{
 vi.spyOn(Capacitor,'isNativePlatform').mockReturnValue(true);
 vi.stubEnv('VITE_APP_URL','https://localhost');
 expect(()=>inviteUrl('a'.repeat(64))).toThrow('초대용 서버');
});
it('설정된 API 주소를 초대 주소로도 사용할 수 있어요',()=>{
 vi.stubEnv('VITE_APP_URL','');vi.stubEnv('VITE_API_BASE_URL','https://meide-meide1.vercel.app');
 expect(inviteUrl('b'.repeat(64))).toContain('https://meide-meide1.vercel.app/join/');
});

it('검증된 호스트의 새 링크와 기존 링크만 읽어요',()=>{
 const token='c'.repeat(64);
 expect(inviteToken(`https://meide-meide1.vercel.app/join/${token}`)).toBe(token);
 expect(inviteToken(`https://meide-meide1.vercel.app/#/join/${token}`)).toBe(token);
 for(const url of [`https://meide-meide1.vercel.app.evil.example/join/${token}`,`https://evil.example/join/${token}`,`https://user@meide-meide1.vercel.app/join/${token}`,`https://meide-meide1.vercel.app/join/${token}?redirect=x`,`https://meide-meide1.vercel.app/join/short`,`http://meide-meide1.vercel.app/join/${token}`]) expect(inviteToken(url)).toBeNull();
});
