# 兴汉同盟前端源码

兴汉同盟是一个前后端分离的 Web 项目，本工程为前端部分。后端由「好道」系统承载（**不在本仓库内**），前端展示的一切数据都来自后端现有数据表对应的 JSON 接口，页面本身不含任何与后端无关的脚本或统计。

## 工程架构

前端使用 React 18 + Ant Design（antd v6），npm 管理依赖，webpack 5 打包。工程分页面层（`src/pages`）、组件层（`src/components`）、接口封装（`src/services`）、工具（`src/utils`）、类型（`src/types`）。

对后台发请求使用原生 `fetch()`，统一封装在 `src/utils/request.ts`（自动拼接后端根地址）。

样式集中写在 `src/styles.css`，页面内不写内联样式；模板 `public/index.html` 里不允许出现 `<style>` / `<script>` 标签。

## 设置与启动

启动前请确保本地已安装 Node.js（v18 及以上）与 npm。

```shell
npm install
npm start
```

启动后浏览器打开 [http://localhost:3000](http://localhost:3000)。开发环境读取 `.env` 中的 `BOYOUQUAN_API_ADDRESS`（默认 `http://localhost:8080`）。

## 环境变量

前端只依赖一个构建期环境变量：

| 变量名 | 说明 |
|---|---|
| `BOYOUQUAN_API_ADDRESS` | 后端根地址（形如 `https://<你的后端域名>`），**不要带结尾斜杠**。会被烧进 JS 包，修改后需重新构建。 |

> 注：变量名保持历史命名 `BOYOUQUAN_API_ADDRESS` 仅为兼容既有代码，与项目本身无关联。

**仓库内不保存任何后端地址**：生产构建的地址只来自部署平台面板里的构建环境变量（`webpack.config.js` 生产分支用 `DefinePlugin` 直接读取它），本地开发地址放 `.env`。`.env` 与 `.env.production` 都已在 `.gitignore` 中忽略。

本地模拟生产构建时，在命令行里带上变量即可：

```shell
BOYOUQUAN_API_ADDRESS=https://<你的后端域名> NODE_ENV=production npm run build
```

## 构建与部署（EdgeOne Makers 示例）

```shell
NODE_ENV=production npm run build
```

输出目录为 `dist`。

| 字段 | 填 |
|---|---|
| 框架预设 | 自定义 / 无 |
| 根目录 | `/`（仓库根即前端工程本体） |
| 安装命令 | `npm install` |
| 构建命令 | `NODE_ENV=production npm run build` |
| 输出目录 | `dist` |
| Node 版本 | 18+ |
| 构建环境变量 | `BOYOUQUAN_API_ADDRESS` = 后端好道根地址（不带结尾斜杠） |

### SPA 回退

前端使用 react-router history 模式，需在平台路由/重写规则中将任意路径重写到 `/index.html`，否则深链刷新会 404。

### 跨域（CORS）

若前端域名与后端域名不同源，需后端对相关接口前缀开放跨域；同域反代则免配置。

## 后端接口一览

| 前缀 | 提供方 | 用途 |
|---|---|---|
| `/index.php/openapi/index/*` | openapi 插件 | 公开只读：站点配置、导航/友链、单页、网址库、文章、标签、广告、附件、工具 |
| `/index.php/openapi/mine/*` | openapi 插件 | 会员只读数据（我的书签等），登录态用会员 `key` |
| `/index.php/openapi/admin/*` 等 | openapi 插件 | 后台管理接口（需后台登录态） |
| `/index.php/feed/index/posts.html` | feed 插件 | 各站点 RSS/Atom 聚合博文（每站固定 10 条，按发布时间倒序） |
| `/index.php/verify/index/send.html` | verify 插件 | 短信/邮箱验证码（注册、登录、找回密码） |
| `/index.php/api/*` | 好道核心 | 注册、登录、提交站点、图形验证码 |
| `/index.php/user/index/*` | user 插件 | 用户中心：资料、收藏、签到、消息、余额、订单、举报 |

## 页面与数据来源

| 路由 | 页面 | 数据来源 |
|---|---|---|
| `/home` | 首页（站点网格） | openapi 站点配置 + 网址库 |
| `/blogs` | 博客广场（博文流） | feed 聚合博文 |
| `/blogs/:domain` | 单个博客的博文列表 | feed 聚合博文（按域名过滤） |
| `/dan/:alias` | 单页 | openapi 单页 |
| `/login` `/register` | 登录 / 注册 | 好道核心 + verify 验证码 |
| `/user/*` | 用户中心 | user 插件 |

## 目录结构（摘要）

```
xinghantongmeng/
├── public/
│   └── index.html        # 模板（无内联 style/script）
├── src/
│   ├── pages/            # 页面（含 user/ 用户中心）
│   ├── components/       # 组件（common/、skeleton/、article/）
│   ├── services/         # 接口封装（userCenter.ts / postService.ts）
│   ├── utils/            # request.ts 请求基类、auth.ts 登录态、CommonUtil.ts
│   ├── types/            # TypeScript 类型
│   └── styles.css        # 统一样式
├── webpack.config.js
└── package.json
```
