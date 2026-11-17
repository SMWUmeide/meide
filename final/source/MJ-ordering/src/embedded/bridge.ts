type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<string, Pending>();
let serial = 0;
export function nativeCall<T = unknown>(action: string, payload?: unknown): Promise<T> {
  const id = String(++serial);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('응답이 늦어지고 있어요. 다시 확인해 주세요.')); }, 125000);
    pending.set(id, { resolve: value => resolve(value as T), reject, timer });
    const message = JSON.stringify({ channel: 'meide-orders-v1', id, action, payload });
    const native = (window as unknown as { ReactNativeWebView?: { postMessage: (data:string)=>void } }).ReactNativeWebView;
    if (native) native.postMessage(message); else window.parent.postMessage(message, window.location.origin === 'null' ? '*' : window.location.origin);
  });
}
function receive(event: MessageEvent) {
  if (event.source && event.source !== window.parent && event.source !== window) return;
  try {
    const value = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if(value?.channel !== 'meide-orders-v1') return;
    if(value.action === 'back') {
      const dialog=document.querySelector<HTMLDialogElement>('dialog[open]');
      if(dialog){ const close=dialog.dispatchEvent(new Event('cancel',{cancelable:true}));if(close&&dialog.open)dialog.close();return; }
      const route=window.location.hash.slice(2);
      if(route==='receipt') window.location.hash='/order';
      else if(route==='order') window.location.hash='/cart';
      else if(route==='cart'||route.startsWith('detail/')) window.location.hash='/menu';
      else void nativeCall('exit');
      return;
    }
    const job = pending.get(value.id); if (!job) return;
    clearTimeout(job.timer); pending.delete(value.id);
    if(value.error) job.reject(new Error(value.error)); else job.resolve(value.result);
  } catch { /* Ignore unrelated messages. */ }
}
window.addEventListener('message', receive);
document.addEventListener('message', receive as EventListener);
export const persistedKey=(key:string)=>key==='meide.order.v1'||key==='meide.shared-room.v1'||key==='sb-xtxyobkbxpfyeuiuhbaf-auth-token';
export function installBridge(storage: Record<string,string>) {
  const originalSet = Storage.prototype.setItem, originalRemove = Storage.prototype.removeItem;
  for(const key of Object.keys(localStorage)) if(persistedKey(key)) originalRemove.call(localStorage,key);
  for(const [key,value] of Object.entries(storage)) if(persistedKey(key)) originalSet.call(localStorage,key,value);
  function save() { const snapshot=Object.fromEntries(Object.keys(localStorage).filter(persistedKey).map(key=>[key,localStorage.getItem(key)!]));void nativeCall('save',snapshot).catch(()=>{}); }
  Storage.prototype.setItem=function(key,value){originalSet.call(this,key,value);if(this===localStorage&&persistedKey(key))save();};
  Storage.prototype.removeItem=function(key){originalRemove.call(this,key);if(this===localStorage&&persistedKey(key))save();};
  const originalFetch=window.fetch.bind(window);
  window.fetch=async (input,init)=>{
    const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,window.location.href);
    if(url.origin==='https://meide-meide1.vercel.app' && ['/api/menu-photos','/api/translate-request'].includes(url.pathname)) {
      if(init?.signal?.aborted)throw new DOMException('Aborted','AbortError');
      const result=await nativeCall<{status:number;body:unknown}>('api',{endpoint:url.pathname,body:JSON.parse(String(init?.body??'{}'))});
      return new Response(JSON.stringify(result.body),{status:result.status,headers:{'Content-Type':'application/json'}});
    }
    return originalFetch(input,init);
  };
  document.addEventListener('click',event=>{
    const anchor=(event.target as Element)?.closest?.('a');
    if(anchor?.href && /^https?:/.test(anchor.href)){event.preventDefault();void nativeCall('external',anchor.href);}
  });
}
