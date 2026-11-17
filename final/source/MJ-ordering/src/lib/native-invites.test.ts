import { beforeEach, expect, it, vi } from 'vitest';
import { listenForNativeInvites } from './native-invites';
const sdk=vi.hoisted(()=>({event:null as null|((e:{url:string})=>void),remove:vi.fn(),launch:vi.fn()}));
vi.mock('@capacitor/app',()=>({App:{addListener:vi.fn(async(_name,callback)=>{sdk.event=callback;return {remove:sdk.remove};}),getLaunchUrl:sdk.launch}}));
const url=(letter:string)=>`https://meide-meide1.vercel.app/join/${letter.repeat(64)}`;
beforeEach(()=>{vi.clearAllMocks();sdk.launch.mockResolvedValue(undefined);});
it('앱을 새로 연 초대와 실행 중 받은 초대를 처리해요',async()=>{
 sdk.launch.mockResolvedValue({url:url('a')});const receive=vi.fn();const stop=listenForNativeInvites(receive);
 await vi.waitFor(()=>expect(receive).toHaveBeenCalledWith('a'.repeat(64)));
 sdk.event?.({url:url('b')});expect(receive).toHaveBeenLastCalledWith('b'.repeat(64));
 stop();await vi.waitFor(()=>expect(sdk.remove).toHaveBeenCalledOnce());
 sdk.event?.({url:url('c')});expect(receive).toHaveBeenCalledTimes(2);
});
it('늦게 도착한 초기 링크가 최신 초대를 덮어쓰지 않아요',async()=>{
 let resolve!:(value:{url:string})=>void;sdk.launch.mockImplementation(()=>new Promise(r=>{resolve=r;}));
 const receive=vi.fn();const stop=listenForNativeInvites(receive);
 await vi.waitFor(()=>expect(sdk.launch).toHaveBeenCalled());
 sdk.event?.({url:url('b')});resolve({url:url('a')});await Promise.resolve();
 expect(receive).toHaveBeenCalledOnce();expect(receive).toHaveBeenCalledWith('b'.repeat(64));stop();
});
it('외부 사이트 링크로 초대 화면을 열지 않아요',async()=>{
 const receive=vi.fn();const stop=listenForNativeInvites(receive);
 sdk.event?.({url:`https://evil.example/join/${'a'.repeat(64)}`});await Promise.resolve();expect(receive).not.toHaveBeenCalled();stop();
});
