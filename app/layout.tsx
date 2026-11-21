import type { Metadata } from "next";
import "@fontsource/zcool-kuaile/chinese-simplified-400.css";
import "./style.css";
export const metadata: Metadata = {title:"今天吃什么？", description:"按口味挑一家附近餐厅", appleWebApp:{capable:true}};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="zh-CN"><body>{children}</body></html>}
