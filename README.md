# 今天吃什么

以 Figma 抹茶渐变原型为基础的移动端 Next.js PWA。

## 本地运行

```powershell
npm ci
npm run dev
```

打开 http://localhost:3000。首次进入会展示中南大学南校区的演示餐厅，可以更换推荐、调整当餐筛选、修改长期偏好和收藏。

## 接入真实餐厅

将 .env.example 复制为 .env.local，填写高德 Web 服务类型的 AMAP_WEB_KEY，然后重启应用。通过顶部的位置入口使用浏览器定位，或搜索地标。浏览器坐标在服务端转换后用于查询餐饮 POI。人均缺失时会在界面明确标注。

## 生产运行

```powershell
npm run build
npm start
```

正式部署使用 HTTPS 和 Next.js Node.js 服务端。Service Worker 在生产模式注册，断网时会显示离线页面。偏好和收藏存于当前浏览器。位置只在本次查询中使用。正式上线前应按实际流量为高德接口配置限流。
