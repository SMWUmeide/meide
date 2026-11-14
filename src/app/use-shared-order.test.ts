import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoBoard } from '@/data/mock-menu';
import { useSharedOrder } from './use-shared-order';
const mocks=vi.hoisted(()=>({read:vi.fn(),change:vi.fn(),identity:vi.fn(),onChange:null as null|(()=>void),onStatus:null as null|((state:string)=>void),remove:vi.fn()}));
vi.mock('@/lib/shared-order',()=>({
  readOrderRoom:mocks.read,changeOrderItem:mocks.change,orderIdentity:mocks.identity,
  orderClient:()=>({removeChannel:mocks.remove,channel:()=>{
    const channel={on:(_event:unknown,_filter:unknown,callback:()=>void)=>{mocks.onChange=callback;return channel;},subscribe:(callback:(state:string)=>void)=>{mocks.onStatus=callback;queueMicrotask(()=>callback('SUBSCRIBED'));return channel;}};return channel;
  }}),
}));
const id='00000000-0000-4000-8000-000000000001';
const state=(revision:number)=>({id,revision,board:structuredClone(demoBoard),cart:[],members:[{id,name:'나',slot:0}]});
beforeEach(()=>{vi.clearAllMocks();localStorage.setItem('meide.shared-room.v1',id);mocks.identity.mockResolvedValue(id);mocks.read.mockResolvedValue(state(1));});
describe('실시간 구독과 재접속',()=>{
  it('동반인 이벤트와 재연결 시 최신 상태를 읽고 메뉴 스크롤 기준을 유지해요',async()=>{
    const {result}=renderHook(()=>useSharedOrder());
    await waitFor(()=>expect(result.current.snapshot?.revision).toBe(1));
    const board=result.current.snapshot!.board;
    mocks.read.mockResolvedValue(state(3));
    act(()=>mocks.onChange?.());
    await waitFor(()=>expect(result.current.snapshot?.revision).toBe(3));
    expect(result.current.snapshot!.board).toBe(board);
    mocks.read.mockResolvedValue(state(2));act(()=>mocks.onChange?.());
    await waitFor(()=>expect(mocks.read).toHaveBeenCalledTimes(4));
    expect(result.current.snapshot!.revision).toBe(3);
    act(()=>mocks.onStatus?.('CHANNEL_ERROR'));
    expect(result.current.connected).toBe(false);
    await expect(result.current.mutate('porri','add')).rejects.toThrow('연결');expect(mocks.change).not.toHaveBeenCalled();
    mocks.read.mockResolvedValue(state(4));act(()=>mocks.onStatus?.('SUBSCRIBED'));
    await waitFor(()=>expect(result.current.snapshot?.revision).toBe(4));
  });
});
