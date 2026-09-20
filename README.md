# 兴汉同盟前端源码

兴汉同盟（xinghantongmeng）是一个前后端分离的 Web 项目，该工程（[xinghantongmeng](https://github.com/wulintang/xinghantongmeng)）为前端部分。后端由「好道」系统（wulintang）承载，通过 `verify`、`feed`、`user` 等插件提供 `/api`、`/verify`、`/feed`、`/user` 等接口。

## 工程架构

前端使用 React + Ant Design（antd v6）编写，依赖管理及构建工具为 npm，打包工具为 webpack 5。工程结构主要分页面层（pages）、组件层（components），另有常量（const）、工具包（utils）、服务封装（services）等对外提供支持。对后台发请求使用原生 `fetch()` 方法（封装在 `src/utils/request.ts` 与 `src/utils/APIRequestUtil.ts`）。

## 设置与启动

启动前请确保本地已安装 Node.js（v18 及以上）与 npm。

### 依赖包安装

```shell
npm install
```

### 本地开发

```shell
npm start
```

程序启动完成后，浏览器打开 [http://localhost:3000](http://localhost:3000) 即可访问。开发环境读取 `.env` 中的 `BOYOUQUAN_API_ADDRESS`（默认 `http://localhost:8080`）。

## 环境变量

前端只依赖一个构建期环境变量：

| 变量名 | 说明 |
|---|---|
| `BOYOUQUAN_API_ADDRESS` | 后端根地址（如 `https://www.your-domain.com`），**不要带结尾斜杠**。会被烧进 JS 包，修改后需重新构建。 |

> 注：变量名保持历史命名 `BOYOUQUAN_API_ADDRESS` 仅为兼容既有代码，与「兴汉同盟」项目无关联。

在 `webpack.config.js` 中，`dotenv-webpack` 已开启 `systemvars: true`，因此**部署平台（如 EdgeOne Makers）构建环境变量中填写的值会优先生效**，无需修改 `.env.production` 文件。

## 构建与部署（EdgeOne Makers 示例）

构建命令（务必带 `NODE_ENV=production`，否则会读取开发环境配置且不压缩）：

```shell
NODE_ENV=production npm run build
```

输出目录为 `dist`。

在 EdgeOne Makers 中填写：

| 字段 | 填 |
|---|---|
| 框架预设 | 自定义 / 无 |
| 根目录 | `/`（仓库根即前端工程本体） |
| 安装命令 | `npm install` |
| 构建命令 | `NODE_ENV=production npm run build` |
| 输出目录 | `dist` |
| Node 版本 | 18+ |
| 构建环境变量 | `BOYOUQUAN_API_ADDRESS` = 你后端好道根地址（不带结尾斜杠） |

### SPA 回退

前端使用 react-router history 模式，需在 EdgeOne 路由/重写规则中将任意路径重写到 `/index.html`，否则深链刷新会 404。

### 跨域（CORS）

若前端域名与后端域名不同源，需后端对 `/api`、`/verify`、`/feed`、`/user` 开放跨域；同域反代则可免 CORS 配置。

## 后端接口说明

| 前缀 | 提供方 | 用途 |
|---|---|---|
| `/api/*` | 好道核心 | 博客广场、文章、动态、统计、订阅、管理员等 |
| `/verify/*` | verify 插件 | 短信/邮箱验证码（注册、登录、找回密码） |
| `/feed/*` | feed 插件 | 各站点 RSS/Atom 聚合（每站固定 10 条） |
| `/user/*` | user 插件 | 用户中心：注册、登录、资料、收藏、签到、消息、余额、订单、举报、友链、标签 |

## 目录结构（摘要）

```
xinghantongmeng/
├── public/              # 静态资源与 index.html
├── src/
│   ├── pages/           # 页面（含 user/ 用户中心、admin/ 管理后台）
│   ├── components/      # 组件
│   ├── services/        # 接口封装（userCenter.ts / request.ts / APIRequestUtil.ts）
│   ├── utils/           # 工具（auth.ts 本地登录态、request.ts 请求基类）
│   ├── const/           # 常量与版本说明
│   └── types/           # TypeScript 类型
├── webpack.config.js
├── package.json
└── .env.production      # 占位值，生产以构建环境变量为准
```
