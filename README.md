# 极简养生平台

这是公众首页的第一阶段实现，使用 GitHub 作为源码与自动部署入口，Firebase Hosting 作为网站运行层，Firebase Auth、Firestore 和 Storage 作为身份、内容和媒体基础服务。

## 已实现

- 极简养生公众首页，采用参考站点的米白、深绿、草本绿和暖棕配色。
- 左侧导航、子导航展开/折叠、桌面端侧栏折叠和移动端抽屉导航。
- Google 会员登录入口和 WhatsApp 咨询入口。
- `/admin` 管理入口：导航树、首页文案、方法卡片、草稿保存、发布和图片/视频上传。
- 导航入口对应独立内容页，内容区块可绑定图片或视频。
- Firestore 内容版本：`publicHomeContent/draft` 与 `publicHomeContent/published`。
- Firebase Storage 媒体路径：`public-home/media/**`。
- 规则文件限制公开内容读取和管理员写入，并保留 50 MB 媒体大小上限。

## 数据迁移约定

首页内容以带 `schemaVersion` 的 JSON 结构保存，导航、内容卡片和媒体元数据分离保存，媒体 URL 可在迁移时重新映射。后续会员、商家和管理员模块应沿用版本化文档与稳定 ID，不把业务数据绑定在页面组件内部。

## 本地命令

```bash
npm run dev
npm run build
npm run lint
```

## GitHub Actions 部署

推送到 `main` 会运行 `.github/workflows/firebase-hosting.yml`，先执行静态导出，再部署到 Firebase Hosting。仓库需要配置名为 `FIREBASE_SERVICE_ACCOUNT_SIMPLEWELLNESSV1` 的 GitHub Actions Secret，内容为 Firebase 项目的部署服务账号 JSON。
