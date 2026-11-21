export type Meal = {id:string; name:string; category:string; meters:number; price:number|null; spicy?:boolean; art?:number; point?:string; address?:string};
export const demo: Meal[] = [
 {id:"pork",name:"小碗湘菜",category:"湘菜",meters:450,price:36,spicy:true,art:0},
 {id:"beef",name:"红烧牛肉饭",category:"家常简餐",meters:320,price:32,spicy:true,art:1},
 {id:"noodles",name:"牛肉粉",category:"粉面",meters:260,price:25,art:1},
 {id:"rice",name:"石锅拌饭",category:"韩餐",meters:620,price:39,art:0},
 {id:"chicken",name:"卤味鸡爪",category:"家常简餐",meters:720,price:29,spicy:true,art:2},
 {id:"dumplings",name:"小笼包",category:"包点",meters:820,price:22,art:3},
 {id:"egg",name:"番茄炒蛋饭",category:"家常简餐",meters:900,price:28,art:4}
];
