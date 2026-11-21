import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {return {name:"今天吃什么",short_name:"吃什么",start_url:"/",display:"standalone",background_color:"#172a22",theme_color:"#172a22",icons:[{src:"/eatwhat-icon-192.png",sizes:"192x192",type:"image/png"},{src:"/eatwhat-icon-512.png",sizes:"512x512",type:"image/png"}]}}
