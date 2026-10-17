import {sameFood} from './food-recommendations.js';
export const ratingChoices=[['again','또 먹고 싶어요','☺'],['once','한 번이면 충분해요','⊖'],['dislike','입맛에 맞지 않았어요','☹']];
export function foodRating(food,ratings){return [...ratings].reverse().find(r=>(food.catalogProductId&&r.food.catalogProductId===food.catalogProductId)||sameFood(food,r.food))?.value;}
export function preferredMenu(items,ratings){return items.map((food,index)=>({food,index,again:foodRating(food,ratings)==='again'})).sort((a,b)=>Number(b.again)-Number(a.again)||a.index-b.index).map(r=>r.food);}
export function mealItems(items,cart){return items.filter(i=>cart[i.id]>0).map(i=>({...i,quantity:cart[i.id]}));}
