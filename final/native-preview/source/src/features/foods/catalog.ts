// Everyday ingredients for preference selection, independent of allergen diagnoses.
export const commonFoods = ['고수','가지','올리브','오이','당근','양파','대파','마늘','생강','부추','파프리카','피망','고추','토마토','감자','고구마','호박','단호박','애호박','양배추','배추','상추','깻잎','시금치','브로콜리','콜리플라워','셀러리','아스파라거스','옥수수','무','연근','우엉','죽순','비트','콩나물','숙주','표고버섯','양송이버섯','팽이버섯','새송이버섯','목이버섯','트러플','소고기','돼지고기','닭고기','오리고기','양고기','칠면조고기','베이컨','햄','소시지','간','곱창','순대','달걀','메추리알','우유','치즈','버터','생크림','요구르트','두부','콩','완두콩','병아리콩','렌틸콩','땅콩','아몬드','호두','캐슈넛','잣','참깨','들깨','쌀','밀','보리','귀리','메밀','연어','참치','고등어','대구','멸치','정어리','장어','새우','게','바닷가재','오징어','문어','낙지','굴','홍합','전복','가리비','조개','미역','김','다시마','사과','배','복숭아','딸기','바나나','키위','오렌지','레몬','라임','자몽','포도','망고','파인애플','아보카도','코코넛','바질','파슬리','민트','로즈메리','딜','후추','겨자','계피','고추냉이','된장','고추장','간장','식초','마요네즈','꿀'] as const;
const aliases: Record<string,string[]> = { 고수:['cilantro','coriander'], 가지:['eggplant','aubergine'], 올리브:['olive'], 달걀:['계란','egg'], 소고기:['쇠고기','beef'], 돼지고기:['pork'], 닭고기:['chicken'], 셀러리:['샐러리','celery'], 요구르트:['요거트','yogurt'], 고추냉이:['와사비','wasabi'] };
export const cleanFood = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 40);
export const foodKey = (value: string) => cleanFood(value).toLowerCase().replace(/\s+/g, '');
export function canonicalFood(value: string) {
  const key = foodKey(value);
  return commonFoods.find(name => foodKey(name) === key || aliases[name]?.some(alias => foodKey(alias) === key)) ?? cleanFood(value);
}
export function searchFoods(value: string) {
  const key = foodKey(value);
  return key ? commonFoods.filter(name => [name,...(aliases[name] ?? [])].some(term => foodKey(term).startsWith(key))).sort((a,b)=>a.localeCompare(b,'ko')) : [];
}
export function addFood(selected: string[], value: string) {
  const name = canonicalFood(value);
  return !name || selected.some(item => foodKey(item) === foodKey(name)) ? selected : [...selected,name];
}
