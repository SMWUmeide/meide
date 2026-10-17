import {testMenu} from './test-menu.js';
export const reviewRestaurants=[{id:'solita',name:testMenu.restaurantName},{id:'trattoria-example',name:'로마 트라토리아 · 예시 식당'},{id:'osteria-example',name:'토스카나 오스테리아 · 예시 식당'}];
export const reviewFoods=testMenu.items.slice(0,4);
const entries=[
 [0,'solita','수진',5,'버섯 향이 진하고 고소해요. 따뜻한 콩 수프라 부담 없이 먹었어요.'],
 [0,'solita','민호',4,'콩이 부드럽고 든든해요. 빵을 곁들이면 한 끼로 좋아요.'],
 [0,'trattoria-example','지은',5,'비슷한 수프를 로마에서도 먹었어요. 고소한 맛이 입맛에 잘 맞았어요.'],
 [0,'osteria-example','준서',4,'국물 요리를 좋아한다면 추천해요. 버섯 향은 조금 강한 편이에요.'],
 [1,'solita','유나',5,'훈제 향이 은은하고 가지가 부드러워요. 다시 먹고 싶은 메뉴예요.'],
 [1,'solita','도윤',5,'익숙한 구운 가지 맛이라 맛있게 먹었어요.'],
 [1,'trattoria-example','서연',4,'가지는 부드러웠고 제 입맛에는 조금 짰어요.'],
 [2,'solita','하린',4,'부드러운 감자 수프라 편하게 먹었어요.'],
 [2,'solita','태호',3,'담백한 맛이에요. 진한 맛을 좋아하면 조금 심심할 수 있어요.'],
 [2,'osteria-example','지후',4,'서양 대파의 단맛이 좋아요. 가벼운 시작 메뉴로 골랐어요.'],
 [3,'solita','소영',5,'호박의 단맛과 곡물 식감이 잘 어울려요.'],
 [3,'solita','현우',4,'익숙한 호박 맛이라 먹기 편했어요. 생각보다 든든해요.'],
 [3,'trattoria-example','다은',5,'곡물 씹는 맛이 좋고 달지 않아 좋았어요.']
];
export const communityReviews=entries.map(([index,restaurantId,name,score,text],n)=>({id:'example-review-'+n,foodId:reviewFoods[index].id,restaurantId,name:name.slice(0,1)+'*',score,text,date:'2026-10-'+String(15-n%6).padStart(2,'0'),image:reviewFoods[index].image?.url,example:true}));
export function foodReviews(foodId,restaurantId=null){return communityReviews.filter(r=>r.foodId===foodId&&(!restaurantId||r.restaurantId===restaurantId));}
export function foodRanking(restaurantId=null,sort='rating'){return reviewFoods.map(food=>{const reviews=foodReviews(food.id,restaurantId);return {food,reviews,count:reviews.length,average:reviews.length?reviews.reduce((n,r)=>n+r.score,0)/reviews.length:0,restaurantCount:new Set(reviews.map(r=>r.restaurantId)).size};}).filter(row=>row.count).sort(sort==='reviews'?(a,b)=>b.count-a.count||b.average-a.average:(a,b)=>b.average-a.average||b.count-a.count);}
