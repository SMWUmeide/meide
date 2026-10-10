const dishes=[
['baccalà alla fiorentina','피렌체식 토마토 대구 조림','염장 대구를 토마토와 함께 익히는 이탈리아 요리입니다.'],
['maiale alle mele','사과를 곁들인 돼지고기 요리','돼지고기와 사과를 함께 쓰는 요리로, 고기의 고소함에 과일의 단맛을 더합니다.'],
['cinghiale in salmì','멧돼지고기 와인 조림','멧돼지고기를 와인과 향신료로 천천히 익히는 진한 풍미의 요리입니다.'],
['bistecca alla fiorentina','피렌체식 두꺼운 소고기 스테이크','두꺼운 뼈 있는 소고기를 굽는 토스카나 요리입니다. 굽기 정도는 직원에게 확인해주세요.'],
['cacio e pepe','치즈와 후추 파스타','페코리노 치즈와 후추가 중심인 로마식 파스타입니다.'],
['amatriciana','토마토와 돼지 볼살 파스타','토마토, 구안찰레와 치즈를 사용하는 이탈리아 파스타입니다.'],
['carbonara','달걀·치즈·돼지 볼살 파스타','달걀과 치즈로 소스를 만드는 파스타입니다. 전통 조리법에는 구안찰레를 쓰지만 식당마다 다릅니다.'],
['margherita','토마토·모차렐라·바질 피자','토마토, 모차렐라 치즈, 바질을 올리는 피자입니다.'],
['risotto','이탈리아식 크리미한 쌀 요리','쌀에 육수를 조금씩 더해 익히는 요리입니다. 버섯·해산물 등 추가 재료는 메뉴를 확인해주세요.'],
['lasagn','고기 소스와 치즈를 겹친 파스타','넓은 파스타 면에 소스와 치즈를 겹쳐 오븐에 굽는 요리입니다.'],
['tiramisu','커피향 치즈 크림 디저트','커피에 적신 과자와 마스카르포네 크림을 층층이 쌓는 디저트입니다.'],
['paella','스페인식 육수 볶음밥','넓은 팬에서 쌀을 육수와 함께 익힙니다. 해산물·고기 구성은 종류마다 다릅니다.'],
['gazpacho','차갑게 먹는 토마토 채소 수프','토마토와 채소를 갈아 차갑게 내는 스페인 수프입니다.'],
['schnitzel','얇은 고기에 빵가루를 입힌 튀김','얇게 편 고기를 튀기는 요리로 돈가스와 비슷합니다. 고기 종류는 식당에 확인해주세요.'],
['boeuf bourguignon','프랑스식 소고기 레드와인 조림','소고기를 레드와인과 채소로 천천히 익히는 프랑스 요리입니다.'],
['confit de canard','천천히 익힌 오리 다리 요리','오리를 지방 속에서 낮은 온도로 익히는 프랑스 요리입니다.'],
['ratatouille','프랑스식 가지·호박·토마토 채소 요리','남프랑스에서 즐기는 채소 요리로, 조리와 담음새는 식당마다 다릅니다.'],
['fish and chips','생선튀김과 감자튀김','흰살생선에 반죽을 입혀 튀기고 감자튀김을 곁들이는 영국 음식입니다.'],
['goulash','고기와 파프리카 스튜','고기와 파프리카를 사용하는 중유럽 음식이며, 국물 농도와 재료는 지역마다 다릅니다.'],
['bratwurst','독일식 구운 소시지','고기를 넣은 소시지를 굽는 음식입니다. 사용한 고기와 곁들임은 식당마다 다릅니다.'],
['croissant','버터 풍미의 층층이 구운 빵','버터를 넣은 반죽을 여러 겹 접어 굽는 빵입니다.'],
['panna cotta','이탈리아식 우유·크림 푸딩','크림을 굳혀 만드는 부드러운 디저트입니다.'],
['escargot','프랑스식 식용 달팽이 요리','버터와 허브 등을 곁들이는 달팽이 요리입니다.'],
['pizza','피자','반죽에 토핑을 얹어 굽는 음식입니다. 토핑은 원문 메뉴를 확인해주세요.'],
['pasta','파스타','밀가루 면에 소스를 곁들이는 음식입니다. 소스와 재료는 메뉴에 따라 다릅니다.']
];
const normalizeName=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function interpretDish(original){const n=normalizeName(original);const d=dishes.find(x=>n.includes(normalizeName(x[0])));return d?{korean:d[1],description:d[2]+' 일반적인 음식 설명이며 이 식당의 조리법을 확인한 정보는 아닙니다.'}:null;}
const known=[['baccal','염장 대구 요리'],['maiale','돼지고기 요리'],['cinghiale','멧돼지고기 요리'],['carbonara','카르보나라'],['margherita','마르게리타 피자'],['risotto','리소토'],['lasagn','라자냐'],['tiramisu','티라미수'],['paella','파에야'],['gazpacho','가스파초'],['schnitzel','슈니첼'],['croissant','크루아상'],['salad','샐러드'],['soup','수프'],['pizza','피자'],['pasta','파스타']];
export function parseFreeMenu(text,language='en'){
 const items=[];
 for(const line of text.split('\n')){
  const m=line.trim().match(/^(.+?)\s+(?:€|EUR|£|GBP|CHF)?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR|£|GBP|CHF)?\s*$/i);
  if(!m||!/[a-zÀ-ž]/i.test(m[1]))continue;
  const original=m[1].replace(/[.·—–-]+$/,'').trim();
  const normalized=original.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const meaning=interpretDish(original);
  const match=known.find(([name])=>normalized.includes(name));
  items.push({id:String(items.length),original,korean:meaning?.korean||(match?match[1]:original),price:Number(m[2].replace(',','.')),description:meaning?.description||(match?'음식 이름 사전의 일반적인 해석입니다. 식당의 실제 조리법은 확인해주세요.':'한국어 사전에 없는 음식입니다. 원문을 표시합니다.'),ingredients:[],allergens:[],cooking:'식당에 확인해주세요.',taste:'확인된 정보가 없습니다.',estimated:true,sourceLabel:'촬영 사진 · 무료 OCR · 사용자가 확인한 텍스트',sources:[],image:null,emoji:'🍽'});
 }
 return {restaurantName:'',language,currency:/£|GBP/.test(text)?'GBP':/CHF/.test(text)?'CHF':'EUR',items};
}
let loading;
export async function recognizeFree(images,language,onProgress){
 if(!loading)loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';s.onload=resolve;s.onerror=()=>{loading=null;reject(Error('문자 인식 도구를 불러오지 못했습니다. 직접 입력으로 계속할 수 있어요.'));};document.head.append(s);});
 await loading;
 const langs={it:'ita',fr:'fra',es:'spa',de:'deu',pt:'por',en:'eng'};
 const worker=await window.Tesseract.createWorker(langs[language]||'eng',1,{logger:m=>onProgress?.(m.status,m.progress)});
 try{const texts=[];for(const image of images){texts.push((await worker.recognize(image)).data.text);}return texts.join('\n');}finally{await worker.terminate();}
}
