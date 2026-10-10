const originalPage=await figma.getNodeByIdAsync('335:2');await figma.setCurrentPageAsync(originalPage);
const fonts=await figma.listAvailableFontsAsync();
for(const style of ['Regular','Medium','Bold','Black'])await figma.loadFontAsync({family:'Noto Sans KR',style});
for(const style of ['Regular','Bold'])await figma.loadFontAsync({family:'Lora',style});
const fontMap=new Map();for(const t of originalPage.findAllWithCriteria({types:['TEXT']}))for(const seg of t.getStyledTextSegments(['fontName']))fontMap.set(JSON.stringify(seg.fontName),seg.fontName);
for(const f of fontMap.values())try{await figma.loadFontAsync(f);}catch{}
const createdNodeIds=[];const color=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const page=figma.createPage();page.name='한입 유럽 · 캐치테이블 스타일 수정본';createdNodeIds.push(page.id);
async function createVariableCollection(name,modeNames){const collection=figma.variables.createVariableCollection(name);collection.renameMode(collection.modes[0].modeId,modeNames[0]);return {collection,modeIds:{[modeNames[0]]:collection.modes[0].modeId}};}
const prim=(await createVariableCollection('한입 유럽 / Primitives',['Value'])).collection;
const semantic=(await createVariableCollection('한입 유럽 / UI Colors',['Light'])).collection;
const vars={};const variableIds=[];
for(const [name,hex,css] of [['accent','#ff4b00','--orange'],['surface','#ffffff','--surface'],['ink','#252629','--ink'],['muted','#86888b','--muted'],['line','#eeeeef','--line'],['soft','#fff1e7','--soft']]){
 const p=figma.variables.createVariable(name,prim,'COLOR');p.scopes=[];p.setValueForMode(prim.modes[0].modeId,color(hex));p.setVariableCodeSyntax('WEB',`var(${css})`);variableIds.push(p.id);
 const v=figma.variables.createVariable('color/'+name,semantic,'COLOR');v.scopes=name==='ink'||name==='muted'?['TEXT_FILL','STROKE_COLOR']:['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(semantic.modes[0].modeId,{type:'VARIABLE_ALIAS',id:p.id});v.setVariableCodeSyntax('WEB',`var(${css})`);vars[name]=v;variableIds.push(v.id);
}
const styles={};const styleIds=[];
for(const [key,size,style] of [['body',13,'Regular'],['title',17,'Medium'],['button',16,'Bold'],['caption',11,'Regular'],['price',15,'Bold'],['display',31,'Bold']]){const st=figma.createTextStyle();st.name='한입 유럽 / '+key;st.fontName={family:'Noto Sans KR',style};st.fontSize=size;st.lineHeight={unit:'PERCENT',value:150};styles[key]=st;styleIds.push(st.id);}
const sourceIDs=['335:3','335:117','335:166','335:206','335:332','335:504','335:565','335:622'];
const names=['01 홈 · 5개 탭','02 메뉴판 촬영','03 메뉴판 확인','04 한국어 메뉴','05 음식 상세 팝업','06 장바구니','07 현지어 주문','08 직원에게 보여주기'];
const frames=[];
for(let k=0;k<sourceIDs.length;k++){
 const src=await figma.getNodeByIdAsync(sourceIDs[k]);const f=src.clone();page.appendChild(f);f.name=names[k];
 for(const t of f.findAllWithCriteria({types:['TEXT']})){
  const segments=t.getStyledTextSegments(['fontName']);
  for(const seg of segments){const serif=seg.fontName.family==='Georgia';const style=/Bold|Black/.test(seg.fontName.style)?'Bold':'Regular';t.setRangeFontName(seg.start,seg.end,{family:serif?'Lora':'Noto Sans KR',style});}
 }
 f.rescale(360/409);f.resize(360,780);f.clipsContent=true;f.x=(k%4)*420+160;f.y=Math.floor(k/4)*870+100;
 for(const child of f.children){if(child.name==='Body')child.resize(360,780);if(child.name==='App'&&child.y>600)child.y=780-child.height;if(['BottomNav','ReviewScreen','CartScreen','OrderScreen','MenuResultScreen'].includes(child.name)&&child.y>500)child.y=780-21-child.height;if(child.name==='FoodDetailPopup')child.resize(360,780);if(k===7&&child.name==='OrderScreen'&&child.y===0)child.resize(360,780);}
 for(const n of [f,...f.findAll(()=>true)]){
  for(const prop of ['fills','strokes'])if(prop in n&&Array.isArray(n[prop])){
   n[prop]=n[prop].map(p=>{if(p.type!=='SOLID')return p;const c=p.color;let role=null;
    if(c.r>.65&&c.g<.55&&c.b<.4)role='accent';else if(c.r>.8&&c.g>.8&&c.b>.8&&c.r-c.b>.04&&c.r-c.b<.2)role=c.r>.95?'surface':null;
    else if(c.g>c.r*.9&&c.g>c.b&&c.r<.5&&c.g<.6&&c.b<.45)role='accent';
    else if(c.r>.97&&c.g>.97&&c.b>.97)role='surface';
    if(role)return figma.variables.setBoundVariableForPaint({...p,color:color(role==='accent'?'#ff4b00':role==='surface'?'#ffffff':'#fff1e7')},'color',vars[role]);return p;});
  }
  if(n.type==='TEXT'&&typeof n.fontSize==='number'&&n.fontName!==figma.mixed&&n.fontName.family==='Noto Sans KR'){
   const size=n.fontSize;let st=size>=26?styles.display:size>=17?styles.title:size<=10?styles.caption: /Bold/.test(n.fontName.style)?styles.price:styles.body;
   const keepSize=n.fontSize;n.textStyleId=st.id;n.fontSize=keepSize;
   if(/^약.*원/.test(n.characters))n.characters='참고 금액';
   if(n.characters.includes('알러지 ('))n.characters='추정 알레르기: 생선 · 직원에게 확인';
  }
 }
 // Editable demo disclosure is a real text layer, not an image overlay.
 const disclosure=figma.createText();disclosure.name='예시 안내';disclosure.fontName={family:'Noto Sans KR',style:'Regular'};disclosure.fontSize=8;disclosure.characters=k===1?'예시 촬영 화면 · 웹에서는 실제 카메라 사용':'데모 예시 · 실제 사진의 AI 분석 결과 아님';disclosure.fills=[{type:'SOLID',color:color(k===1?'#bbbbbb':'#a56849')}];f.appendChild(disclosure);disclosure.x=14;disclosure.y=k===7?70:23;disclosure.resize(330,12);
 frames.push(f);createdNodeIds.push(f.id,...f.findAll(()=>true).map(n=>n.id));
}
// Home navigation uses an editable auto-layout row of five related tabs.
const home=frames[0];const nav=home.findOne(n=>n.name==='BottomNav');nav.layoutMode='HORIZONTAL';nav.itemSpacing=0;nav.primaryAxisSizingMode='FIXED';nav.counterAxisSizingMode='FIXED';nav.resize(360,65);nav.y=694;
const tabLabels=['홈','찜한 음식','주문 내역','동반인','마이페이지'];
const byLabel=label=>nav.children.find(n=>n.findAllWithCriteria({types:['TEXT']}).some(t=>t.characters.replace(/\s/g,'')===label.replace(/\s/g,'')));
const ordered=[byLabel('홈'),byLabel('찜한 음식'),byLabel('주문 내역'),byLabel('마이페이지')];
const companion=ordered[3].clone();nav.appendChild(companion);companion.name='동반인 탭';
for(const t of companion.findAllWithCriteria({types:['TEXT']})){if(t.characters==='마이페이지')t.characters='동반인';}
const tabs=[ordered[0],ordered[1],ordered[2],companion,ordered[3]];
for(let i=0;i<tabs.length;i++){nav.insertChild(i,tabs[i]);tabs[i].resize(72,65);tabs[i].layoutSizingHorizontal='FILL';for(const t of tabs[i].findAllWithCriteria({types:['TEXT']}))if(tabLabels.includes(t.characters)){t.fontSize=9;t.textAutoResize='WIDTH_AND_HEIGHT';}}
createdNodeIds.push(companion.id,...companion.findAll(()=>true).map(n=>n.id));
const info=figma.createText();info.name='편집 안내';info.fontName={family:'Noto Sans KR',style:'Bold'};info.characters='한입 유럽 · 캐치테이블 참고 스타일\n원본 8개 화면의 레이아웃 유지 / 화면 360 × 780 / 오렌지 강조색 / 홈 5개 탭\n색상은 한입 유럽 UI Colors, 글자는 한입 유럽 텍스트 스타일에서 함께 수정할 수 있어요.';info.fontSize=16;info.lineHeight={unit:'PERCENT',value:160};info.fills=[{type:'SOLID',color:color('#252629')}];page.appendChild(info);info.x=160;info.y=-80;info.resize(1500,100);createdNodeIds.push(info.id);
return {createdNodeIds:[...new Set(createdNodeIds)],pageId:page.id,frames:frames.map(f=>({id:f.id,name:f.name,w:f.width,h:f.height,texts:f.findAllWithCriteria({types:['TEXT']}).length,images:f.findAll(n=>'fills' in n&&Array.isArray(n.fills)&&n.fills.some(p=>p.type==='IMAGE')).length})),collections:[prim.id,semantic.id],variableIds,styleIds};
