export function createCameraSession(getMedia){
 let stream=null,pending=null,version=0;
 return {
  async open(){
   if(stream?.getVideoTracks().some(t=>t.readyState==='live'))return stream;
   if(pending)return pending;
   const requestVersion=version;
   const request=Promise.resolve().then(()=>getMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1600}},audio:false})).then(s=>{
    if(requestVersion!==version){s.getTracks().forEach(t=>t.stop());return null;}
    stream=s;return s;
   },error=>{if(requestVersion!==version)return null;throw error;});
   pending=request;
   try{return await request;}finally{if(pending===request)pending=null;}
  },
  stop(){version++;stream?.getTracks().forEach(t=>t.stop());stream=null;pending=null;}
 };
}
