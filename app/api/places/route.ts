import type { Meal } from "../../model";
export const dynamic = "force-dynamic";
type Poi = {id:string;name:string;type?:string;address?:string;location:string;distance?:string;business?:{cost?:string}};
type AmapResponse = {status:string;pois?:Poi[];locations?:string};
async function amap(path:string, args:Record<string,string>):Promise<AmapResponse> {
 const query=new URLSearchParams({...args,key:process.env.AMAP_WEB_KEY!});
 const response=await fetch("https://restapi.amap.com/"+path+"?"+query,{cache:"no-store",signal:AbortSignal.timeout(6500)});
 if(!response.ok)throw new Error("Map service unavailable");
 const data=await response.json();
 if(data.status!=="1")throw new Error("Map service rejected request");
 return data;
}
export async function POST(request:Request){
 if(!process.env.AMAP_WEB_KEY)return Response.json({error:"未配置高德地图服务"},{status:503});
 try {
  const {keyword, point, gps, radius}=await request.json();
  if(typeof keyword==="string"&&keyword.trim()&&keyword.length<=80){
   const {pois=[]}=await amap("v5/place/text",{keywords:keyword.trim(),page_size:"10"});
   return Response.json({places:pois.filter(p=>p.location).map(p=>({id:p.id,name:p.name,address:p.address,point:p.location}))});
  }
  const coordinates=typeof point==="string"&&/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(point)?point.split(",").map(Number):[];
  if(coordinates.length!==2||Math.abs(coordinates[0])>180||Math.abs(coordinates[1])>90)return Response.json({error:"坐标无效"},{status:400});
  const location=gps===true?(await amap("v3/assistant/coordinate/convert",{locations:point,coordsys:"gps"})).locations:point;
  if(!location)throw new Error("Coordinate unavailable");
  const {pois=[]}=await amap("v5/place/around",{location,radius:[500,1000,2000].includes(radius)?String(radius):"1000",types:"050000",show_fields:"business",page_size:"25"});
  const meals:Meal[]=pois.filter(p=>p.id&&p.location&&p.distance&&Number.isFinite(Number(p.distance))).map(p=>{
   const cost=Number(p.business?.cost);
   const category=p.type?.split(";").pop()||"餐饮";
   return {id:p.id,name:p.name,category,meters:Number(p.distance),price:cost>0?cost:null,spicy:/湘菜|川菜/.test(category)?true:undefined,point:p.location,address:typeof p.address==="string"?p.address:undefined};
  });
  return Response.json({meals});
 } catch {return Response.json({error:"地图服务暂不可用，请稍后再试"},{status:502});}
}
