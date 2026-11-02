import {apiRequest} from './api-client.js';
// The preview always covers the viewport. Analysis uses full sensor frames.
export class MenuCamera {
 constructor(){this.stream=null;this.pending=null;this.generation=0;this.error='';this.torch=false;}
 async mount(video,onError){
  const generation=this.generation;
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('이 브라우저에서는 카메라를 열 수 없어요. 앨범에서 사진을 선택해주세요.');
   if(!this.stream){
    this.pending??=navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:2560},height:{ideal:1920}},audio:false}).finally(()=>{this.pending=null});
    const stream=await this.pending;
    if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
    this.stream=stream;
   }
   if(!video.isConnected)return;
   video.srcObject=this.stream;await video.play();this.error='';
  }catch(e){
   if(generation!==this.generation)return;
   this.error=e.name==='NotAllowedError'?'카메라 권한을 허용하거나 앨범에서 사진을 선택해주세요.':e.name==='NotFoundError'?'연결된 카메라가 없어요. 앨범에서 사진을 선택해주세요.':e.name==='NotReadableError'?'다른 앱에서 카메라를 사용 중일 수 있어요. 앨범을 이용하거나 다시 열어주세요.':e.message||'카메라를 열지 못했어요.';
   onError(this.error);
  }
 }
 stop(){this.generation++;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.torch=false;}
 async flash(){const track=this.stream?.getVideoTracks()[0];if(!track?.getCapabilities?.().torch)throw new Error('이 카메라는 플래시를 지원하지 않아요.');this.torch=!this.torch;await track.applyConstraints({advanced:[{torch:this.torch}]});return this.torch;}
 capture(video){if(!video?.videoWidth||video.readyState<2)throw new Error('카메라가 준비되면 촬영해주세요.');return compressImage(video,video.videoWidth,video.videoHeight);}
}
export function compressImage(source,width,height){
 const scale=Math.min(1,2200/Math.max(width,height));const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
 let quality=.88,data=canvas.toDataURL('image/jpeg',quality);
 while(data.length>3000000&&quality>.38){quality-=.1;data=canvas.toDataURL('image/jpeg',quality)}
 if(data.length>3500000)throw new Error('사진 용량이 커요. 메뉴판을 나눠 찍어주세요.');return data;
}
export async function readPhoto(file){
 if(file.size>25e6)throw new Error('25MB 이하 사진을 선택해주세요.');
 if(!/^image\//.test(file.type))throw new Error('이미지 파일을 선택해주세요.');
 const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();if(!image.width||!image.height)throw new Error();return compressImage(image,image.width,image.height)}catch(e){throw new Error(e.message?.includes('용량')?e.message:'읽을 수 없는 사진이에요. JPG나 PNG로 다시 선택해주세요.')}finally{URL.revokeObjectURL(url)}
}
export function requestJson(path,body,signal){return apiRequest(path,{body,signal})}
export function locate(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('위치를 사용할 수 없어요.'));navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude}),()=>reject(new Error('위치 권한을 허용하거나 식당 이름으로 검색해주세요.')),{enableHighAccuracy:true,timeout:12000,maximumAge:60000})})}
