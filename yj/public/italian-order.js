const pronunciations={
"BACCALA' ALLA FIORENTINA":'바깔라 알라 피오렌티나',"BACCALA' FRITTO":'바깔라 프리또',
'BINDELLA GEMELLA IGT 2025':'빈델라 제멜라 이 지 티 두에밀라벤티친퀘',
'ZUPPA DI CECI E PORCINI':'줍파 디 체치 에 포르치니',
'CAPOCOLLO AL ROSMARINO E MIELE DI CASTAGNO':'카포콜로 알 로즈마리노 에 미엘레 디 카스타뇨',
"CINGHIALE IN SALMI'":'칭기알레 인 살미',
'CONIGLIO ALLO ZENZERO E LIMONE':'코닐료 알로 젠제로 에 리모네',
"COSTA D'AMALFI 2024 - MARISA CUOMO":'코스타 다말피 두에밀라벤티콰트로 마리사 쿠오모',
'ETNA ROSATO DOC 2024 - GRACI':'에트나 로자토 디 오 치 두에밀라벤티콰트로 그라치',
'FUORI MISURA IGT 2024 - SAN GIUSTO A RENTENNANO':'푸오리 미주라 이 지 티 두에밀라벤티콰트로 산 주스토 아 렌텐나노',
'GUANCIA DI MANZO ALLE SPEZIE':'구안차 디 만초 알레 스페치에',
'IGT 2024 14 PRIMAVERE FATTORIA SARDI':'이 지 티 두에밀라벤티콰트로 콰토르디치 프리마베레 파토리아 사르디',
'KERNOS IGT 2024 - COLLE SANTA MUSTIOLA':'케르노스 이 지 티 두에밀라벤티콰트로 콜레 산타 무스티올라',
'MANZO AI PORCINI':'만초 아이 포르치니',"ZUPPA DI MELANZANE FUME'":'줍파 디 멜란차네 푸메',
"OSSOBUCO DI CHIANINA E PURE' DI PATATE":'오쏘부코 디 키아니나 에 푸레 디 파타테',
'POLLO ALLE SPEZIE':'폴로 알레 스페치에',
'POLPETTE DI CHIANINA E CINTA SENESE AL POMODORO':'폴페테 디 키아니나 에 친타 세네제 알 포모도로',
'ZUPPA DI PORRI E PATATE':'줍파 디 포리 에 파타테','ROAST-BEEF DI CHIANINA':'로스트 비프 디 키아니나',
'ROSATO IGT 2024 A - MARCHESI ANTINORI':'로자토 이 지 티 두에밀라벤티콰트로 아 마르케지 안티노리',
'ROSATO IGT 2024 - GUIDOTTI':'로자토 이 지 티 두에밀라벤티콰트로 귀도티',
'ROSATO IGT SMORFIOSA IN ROSA - RAVAZZI':'로자토 이 지 티 스모르피오자 인 로자 라바치',
'ROSATO TOSCANA IGT 2024 USTA - PODERE DELLA BRUCIATA':'로자토 토스카나 이 지 티 두에밀라벤티콰트로 우스타 포데레 델라 브루차타',
'ROSATO TOSCANA IGT 2024 ZELIA - OLIVI':'로자토 토스카나 이 지 티 두에밀라벤티콰트로 젤리아 올리비',
'ROSATO UMBRIA IGT BIO VEGANO AMORE - BARBERANI':'로자토 움브리아 이 지 티 비오 베가노 아모레 바르베라니',
'SALENTO ROSATO IGT 2024 CALAFURIA - MARCHESI ANTINORI':'살렌토 로자토 이 지 티 두에밀라벤티콰트로 칼라푸리아 마르케지 안티노리',
'TOSCANA IGT ALIKI - PODERNUOVO':'토스카나 이 지 티 알리키 포데르누오보',
'TRIPPA ALLA FIORENTINA':'트립파 알라 피오렌티나','ZUPPA DI ZUCCA E FARRO':'줍파 디 주카 에 파로',
'MAIALE ALLE MELE':'마이알레 알레 멜레',
'BACCALA ALLA FIORENTINA':'바깔라 알라 피오렌티나','CINGHIALE IN SALMI':'칭기알레 인 살미'
};
const units=['','uno','due','tre','quattro','cinque','sei','sette','otto','nove','dieci','undici','dodici','tredici','quattordici','quindici','sedici','diciassette','diciotto','diciannove'];
const sounds=['','우노','두에','트레','콰트로','친퀘','세이','세테','오토','노베','디에치','운디치','도디치','트레디치','콰토르디치','퀸디치','세디치','디차세테','디초토','디찬노베'];
const tens=['','','venti','trenta','quaranta','cinquanta','sessanta','settanta','ottanta','novanta'];
const tensSounds=['','','벤티','트렌타','콰란타','친콴타','세산타','세탄타','오탄타','노반타'];
function number(n){if(n<20)return [units[n],sounds[n]];if(n<100){const t=Math.floor(n/10),u=n%10,elide=u===1||u===8;return [(elide?tens[t].slice(0,-1):tens[t])+units[u],u===1?['','','벤투노','트렌투노','콰란투노','친콴투노','세산투노','세탄투노','오탄투노','노반투노'][t]:u===8?['','','벤토토','트렌토토','콰란토토','친콴토토','세산토토','세탄토토','오탄토토','노반토토'][t]:tensSounds[t]+sounds[u]];}const rest=n-100;return ['cento'+(rest?number(rest)[0]:''),'첸토'+(rest?number(rest)[1]:'')];}
export function italianOrder(items){if(!items.length)return null;const parts=[];for(const i of items){const key=String(i.original).normalize('NFD').replace(/\p{M}/gu,'').toUpperCase(),name=pronunciations[key];if(!name||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>198)return null;const wine=/vino|rosato/i.test(i.category||'');const [n,phonetic]=number(i.quantity);const amount=i.quantity===1?(wine?['una bottiglia','우나 보틸리아']:['una porzione','우나 포르치오네']):(wine?[n+' bottiglie',phonetic+' 보틸리에']:[n+' porzioni',phonetic+' 포르치오니']);parts.push({text:amount[0]+' di '+i.original,pronunciation:amount[1]+' 디 '+name,korean:i.korean+' '+i.quantity+(wine?'병':'인분')});}return {text:'Vorremmo ordinare '+parts.map(p=>p.text).join(', ')+', per favore.',pronunciation:'보렘모 오르디나레 '+parts.map(p=>p.pronunciation).join(', ')+', 페르 파보레.',korean:parts.map(p=>p.korean).join(', ')+' 주세요.',language:'it'};}
