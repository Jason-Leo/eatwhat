import type { Metadata } from "next";
import "@fontsource/zcool-kuaile/chinese-simplified-400.css";
import "./style.css";
export const metadata: Metadata = {
 title:"今天吃什么？",
 description:"按口味挑一家附近餐厅",
 appleWebApp:{capable:true},
 icons:{icon:"/launch-icon.svg",apple:{url:"/eatwhat-icon-180.png",sizes:"180x180"}},
};

export default function Layout({children}:{children:React.ReactNode}) {
 return <html lang="zh-CN"><body>
  {children}
  <div className="launch-screen" aria-hidden="true">
   <div className="launch-brand">
    <img src="/launch-icon.svg" width="112" height="112" alt="" fetchPriority="high"/>
    <span>今天吃什么？</span>
   </div>
  </div>
 </body></html>;
}
