"use client";
import { useEffect, useState } from "react";
import { demo, type Meal } from "./model";

type Screen = "recommend" | "nearby" | "me" | "location" | "filters" | "directions";
type Place = {id:string; name:string; point?:string; address?:string; gps?:boolean};
type Filters = {low:number; high:number; radius:number; taste:string};
type Profile = {likes:string[]; filters:Filters; favorites:Meal[]};
const defaults: Filters = {low:30,high:50,radius:1000,taste:"辣"};
const empty:Profile = {likes:["湘菜","粉面"],filters:defaults,favorites:[]};
const example:Place = {id:"demo",name:"中南大学南校区"};
const assets = ["0","1","2","3","4","5","6"];
const icons = {pin:3,filter:4,directions:5,refresh:6,food:7,person:8};
function Icon({name}:{name:keyof typeof icons}) {
 // Figma exports these icons at their design size.
 return <img alt="" width="17" height="17" src={"/design/0-"+icons[name]+".svg"} />;
}
const tabs = [{id:"recommend",label:"推荐",icon:"food"},{id:"nearby",label:"附近",icon:"pin"},{id:"me",label:"我的",icon:"person"}] as const;
const price = (f:Filters) => f.high===0?"不限预算":f.low?"¥"+f.low+"–"+f.high:"¥"+f.high+"以内";
const radius = (n:number) => n<1000?n+" 米内":n/1000+" 公里内";
const info = (m:Meal) => m.category+" · 约 "+m.meters+" 米"+(m.price!==null?" · 人均 ¥"+m.price:" · 人均未知");
async function places(args:Record<string,unknown>, signal?:AbortSignal){
 const response=await fetch("/api/places",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(args),signal});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error||"查询失败");
 return result;
}

export default function Home(){
 const [screen,show]=useState<Screen>("recommend");
 const [place,setPlace]=useState<Place>(example);
 const [profile,setProfile]=useState<Profile>(empty);
 const [filters,setFilters]=useState(defaults);
 const [draft,setDraft]=useState(defaults);
 const [editingProfile,setEditingProfile]=useState(false);
 const [ready,setReady]=useState(false);
 const [foods,setFoods]=useState<Meal[]>(demo);
 const [index,setIndex]=useState(0);
 const [category,setCategory]=useState("");
 const [keyword,setKeyword]=useState("");
 const [results,setResults]=useState<Place[]>([]);
 const [feedback,setFeedback]=useState("");
 const [queryError,setQueryError]=useState("");
 const [pending,setPending]=useState(false);
 const [searching,setSearching]=useState(false);
 const [attempt,setAttempt]=useState(0);
 const [target,setTarget]=useState<Meal>();
 const [savedView,setSavedView]=useState(false);

 useEffect(()=>{
  try {
   const stored=localStorage.getItem("eatwhat-profile-v1");
   if(stored){
    const value=JSON.parse(stored) as Profile;
    if(Array.isArray(value.likes)&&Array.isArray(value.favorites)&&value.filters){setProfile(value);setFilters(value.filters);}
   }
  }catch{/* The defaults are usable when browser storage is unavailable. */}
  setReady(true);
  if(process.env.NODE_ENV==="production" && "serviceWorker" in navigator)void navigator.serviceWorker.register("/sw.js").catch(()=>{});
 },[]);
 useEffect(()=>{if(ready)try{localStorage.setItem("eatwhat-profile-v1",JSON.stringify(profile));}catch{/* Storage can be disabled. */}},[profile,ready]);
 useEffect(()=>{
  setQueryError("");
  if(!place.point){setFoods(demo);setPending(false);return;}
  const controller=new AbortController();
  setPending(true);
  places({point:place.point,gps:place.gps,radius:filters.radius},controller.signal)
   .then(data=>setFoods(data.meals))
   .catch((error:Error)=>{if(!controller.signal.aborted){setFoods([]);setQueryError(error.message);}})
   .finally(()=>{if(!controller.signal.aborted)setPending(false);});
  return ()=>controller.abort();
 },[place,filters.radius,attempt]);

 const nearby=foods.filter(m=>m.meters<=filters.radius).sort((a,b)=>a.meters-b.meters);
 const score=(m:Meal)=>Number(profile.likes.includes(m.category))*2+(filters.taste==="辣"&&m.spicy?4:0)+(m.price===null?0:2)-m.meters/1000;
 const ranked=nearby.filter(m=>(m.price===null||filters.high===0||m.price>=filters.low&&m.price<=filters.high)&&(filters.taste!=="清淡"||m.spicy!==true)).sort((a,b)=>score(b)-score(a));
 const chosen=ranked[index%ranked.length];
 const others=nearby.filter(m=>m.id!==chosen?.id).slice(0,2);
 const art=screen==="me"?"3":screen==="nearby"?"2":screen==="location"?"4":screen==="filters"?"5":screen==="directions"?"6":assets[chosen?.art??0];
 const categories=Array.from(new Set(nearby.map(m=>m.category))).slice(0,8);
 const isSaved=(m:Meal)=>profile.favorites.some(x=>x.id===m.id);
 function favorite(m:Meal){
  setProfile(p=>({...p,favorites:p.favorites.some(x=>x.id===m.id)?p.favorites.filter(x=>x.id!==m.id):[...p.favorites,m]}));
 }
 function choose(p:Place){
  setFoods(p.point?[]:demo);setPending(Boolean(p.point));setQueryError("");setPlace(p);setIndex(0);setCategory("");show("recommend");
 }
 function locate(){
  if(!navigator.geolocation){setFeedback("当前浏览器无法定位，可以搜索地标。");return;}
  setFeedback("正在获取位置…");
  navigator.geolocation.getCurrentPosition(({coords})=>{
   setFeedback("");choose({id:"gps",name:"当前位置",point:coords.longitude.toFixed(6)+","+coords.latitude.toFixed(6),gps:true});
  },()=>setFeedback("未能获取位置，可以手动搜索地标。"),{timeout:8000,maximumAge:60000});
 }
 async function search(event:React.FormEvent){
  event.preventDefault();
  if(!keyword.trim()||searching)return;
  setSearching(true);setFeedback("");setResults([]);
  try{
   const result=await places({keyword});
   setResults(result.places);
   if(!result.places.length)setFeedback("没有找到地标，试试加上城市名。");
  }catch(error){setFeedback(error instanceof Error?error.message:"搜索失败");}
  finally{setSearching(false);}
 }
 function edit(remember=false){setEditingProfile(remember);setDraft(remember?profile.filters:filters);show("filters");}
 function directions(m:Meal){setTarget(m);show("directions");}
 const row=(m:Meal)=><button type="button" className="glass place-row" key={m.id} onClick={()=>directions(m)}><strong>{m.name}</strong><span>约 {m.meters} 米 · {m.category}</span></button>;
 const location=<button className="pill location" type="button" onClick={()=>{setFeedback("");show("location");}}><Icon name="pin"/>{place.name} ›</button>;
 const liveState=pending?<p role="status" className="glass note">正在找附近的餐厅…</p>:queryError?<div className="glass note" role="alert">{queryError}<div className="actions"><button className="pill" onClick={()=>setAttempt(a=>a+1)}>重试</button><button className="pill" onClick={()=>choose(example)}>预览示例</button></div></div>:null;
 return <main className="screen">
  <div className="backdrop" aria-hidden="true">
   <img className="food-art" alt="" src={"/design/"+art+"-0.png"}/>
   <div className="light-fade"/><div className="text-fade"/><img className="glow gold" alt="" src="/design/0-1.svg"/><img className="glow green" alt="" src="/design/0-2.svg"/>
  </div>
  <div className="content" key={screen}>
  {screen==="recommend"&&<>
   {location}
   <header><span>午餐 · 晚餐</span><h1>今天吃什么？</h1><p>按你今天的口味，在附近挑一家。</p></header>
   <div className="filters"><Icon name="filter"/><button className="pill" onClick={()=>edit()}>{price(filters)} ▾</button><button className="pill" onClick={()=>edit()}>{radius(filters.radius)}</button><button className="pill" onClick={()=>edit()}>{filters.taste==="辣"?"想吃辣":filters.taste||"不限口味"}</button></div>
   {liveState}
   {!pending&&!queryError&&(chosen?<section className="glass recommendation">
    <span>{index===0?"今天推荐":"备选推荐"}</span><h2>{chosen.name}</h2><p>{info(chosen)}</p>
    <p>{filters.taste==="辣"&&chosen.spicy?"符合你今天想吃辣的口味。":profile.likes.includes(chosen.category)?"符合你喜欢的菜系。":"可以看看这家附近的餐厅。"}</p>
    <div className="actions"><button className="primary" onClick={()=>directions(chosen)}><Icon name="directions"/>去导航</button><button className="secondary" disabled={ranked.length<2} onClick={()=>setIndex((index+1)%ranked.length)}><Icon name="refresh"/>换一家</button></div>
   </section>:<div className="glass note">暂时没有符合条件的餐厅。<button className="pill" onClick={()=>edit()}>调整范围或预算</button></div>)}
   {!pending&&!queryError&&others.length>0&&<><h3>附近还有</h3>{others.map(row)}</>}
  </>}
  {screen==="nearby"&&<>{location}<header><h1>附近有什么？</h1><p>按距离看看这一带的餐厅。</p></header><div className="filters wrap">{["",...categories].map(c=><button key={c} className={category===c?"pill primary":"pill"} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c||"全部"}</button>)}</div>{liveState}{!pending&&!queryError&&(nearby.length?nearby.filter(m=>!category||m.category===category).map(row):<p className="glass note">当前范围内没有找到餐厅。</p>)}</>}
  {screen==="me"&&<><header><span>个人设置</span><h1>{savedView?"我的收藏":"我的口味"}</h1><p>{savedView?"你保存的餐厅。":"这些偏好用于平时的推荐。"}</p></header>{savedView?<><button className="pill" onClick={()=>setSavedView(false)}>返回口味设置</button>{profile.favorites.length?profile.favorites.map(row):<p className="glass note">还没有收藏。</p>}</>:<>
   <section className="glass note"><h3>喜欢的菜系</h3><div className="filters wrap">{["湘菜","粉面","韩餐","家常简餐","川菜","粤菜"].map(c=><button key={c} className={profile.likes.includes(c)?"pill primary":"pill"} aria-pressed={profile.likes.includes(c)} onClick={()=>{setIndex(0);setProfile(p=>({...p,likes:p.likes.includes(c)?p.likes.filter(x=>x!==c):[...p.likes,c]}));}}>{c}</button>)}</div></section>
   <button className="glass place-row" onClick={()=>edit(true)}><strong>常用预算和距离</strong><span>{price(profile.filters)} · {radius(profile.filters.radius)}</span></button><button className="glass place-row" onClick={()=>setSavedView(true)}><strong>我的收藏</strong><span>{profile.favorites.length} 家餐厅</span></button>
  </>}</>}
  {screen==="location"&&<><header><span>切换位置</span><h1>你在哪儿？</h1><p>位置仅用于搜索附近吃的。</p></header><button className="primary broad" onClick={locate}><Icon name="pin"/>用当前位置</button>
   <form className="glass note" onSubmit={search}><label htmlFor="landmark">手动选择地点</label><div className="actions"><input id="landmark" placeholder="搜索小区、商场或学校" value={keyword} onChange={e=>setKeyword(e.target.value)} maxLength={80}/><button type="submit" className="secondary" disabled={searching}>{searching?"搜索中…":"搜索"}</button></div></form>
   {feedback&&<p className="glass note" role="status">{feedback}</p>}
   {results.map(p=><button className="glass place-row" key={p.id} onClick={()=>choose(p)}><strong>{p.name}</strong><span>{p.address}</span></button>)}
   <button className="secondary broad" onClick={()=>choose(example)}>中南大学南校区 · 示例</button><button className="pill" onClick={()=>show("recommend")}>返回推荐</button>
  </>}
  {screen==="filters"&&<><header><span>推荐设置</span><h1>{editingProfile?"常用偏好":"这一餐想怎么吃？"}</h1><p>{editingProfile?"下次打开时会使用这些设置。":"调整仅用于当前一餐。"}</p></header>
   <section className="glass note"><h3>人均预算</h3><div className="filters wrap">{[[0,30],[30,50],[0,0]].map(([low,high])=><button key={high} className={draft.high===high?"pill primary":"pill"} aria-pressed={draft.high===high} onClick={()=>setDraft({...draft,low,high})}>{price({...draft,low,high})}</button>)}</div></section>
   <section className="glass note"><h3>距离</h3><div className="filters wrap">{[500,1000,2000].map(n=><button key={n} className={draft.radius===n?"pill primary":"pill"} aria-pressed={draft.radius===n} onClick={()=>setDraft({...draft,radius:n})}>{radius(n)}</button>)}</div></section>
   <section className="glass note"><h3>口味</h3><div className="filters wrap">{["辣","清淡",""].map(t=><button key={t} className={draft.taste===t?"pill primary":"pill"} aria-pressed={draft.taste===t} onClick={()=>setDraft({...draft,taste:t})}>{t==="辣"?"想吃辣":t||"都可以"}</button>)}</div></section>
   <button className="primary broad" onClick={()=>{if(editingProfile)setProfile({...profile,filters:draft});setFilters(draft);setIndex(0);setCategory("");show(editingProfile?"me":"recommend");}}>{editingProfile?"保存常用设置":"查看符合条件的推荐"}</button><button className="pill" onClick={()=>show(editingProfile?"me":"recommend")}>取消</button>
  </>}
  {screen==="directions"&&target&&<><header><span>去吃饭</span><h1>{target.name}</h1><p>{info(target)}</p></header><section className="glass note"><h3>准备出发</h3><p>{target.address||"示例餐厅仅用于演示选餐流程。"}</p><div className="actions">{target.point&&<a className="primary" href={"https://uri.amap.com/navigation?"+new URLSearchParams({to:target.point+","+target.name,mode:"walk",coordinate:"gaode",callnative:"1"})}><Icon name="directions"/>打开高德地图</a>}<button className="secondary" aria-pressed={isSaved(target)} onClick={()=>favorite(target)}>{isSaved(target)?"取消收藏":"收藏餐厅"}</button></div></section><button className="pill" onClick={()=>show("recommend")}>返回推荐</button></>}
  </div>
  {(screen==="recommend"||screen==="nearby"||screen==="me"||screen==="filters")&&<nav className="dock glass" aria-label="主导航">{tabs.map(tab=><button key={tab.id} className={screen===tab.id?"pill primary":"pill"} aria-current={screen===tab.id?"page":undefined} onClick={()=>{show(tab.id);setSavedView(false);}}><Icon name={tab.icon}/>{tab.label}</button>)}</nav>}
 </main>;
}
