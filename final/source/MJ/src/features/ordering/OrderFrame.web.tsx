import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { OrderFrameHandle, OrderFrameProps } from './protocol';
export const OrderFrame = forwardRef<OrderFrameHandle,OrderFrameProps>(function OrderFrame({html,onMessage},ref){
  const frame=useRef<HTMLIFrameElement>(null);
  useImperativeHandle(ref,()=>({send(message){frame.current?.contentWindow?.postMessage(message,window.location.origin);}}),[]);
  useEffect(()=>{function receive(event:MessageEvent){if(event.source===frame.current?.contentWindow&&event.origin===window.location.origin&&typeof event.data==='string')onMessage(event.data);}window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[onMessage]);
  return <iframe ref={frame} title="메뉴와 주문" srcDoc={html} sandbox="allow-scripts allow-same-origin" style={{border:0,width:'100%',height:'100%',flex:1,display:'block'}} />;
});
