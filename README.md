# 兴汉同盟前端源码

兴汉同盟面向用户的 Web 前端工程，提供站点导航、内容浏览、会员服务、友情链接与更新日志等公开页面。

## 工程架构

前端使用 React 18 + Ant Design + webpack 5 构建，TypeScript 全量覆盖。

- 页面层：`src/pages`
- 组件层：`src/components`
- 服务封装：`src/services`
- 工具函数：`src/utils`
- 统一样式：`src/styles.css`

`public/index.html` 为静态入口模板，不含任何内联脚本或样式。

## 本地开发

需要 Node.js 18 及以上版本。

```shell
npm install
npm start
```

启动后默认打开 [http://localhost:3000](http://localhost:3000)。

本地开发所需的服务端根地址通过 `.env` 注入，`.env` 与 `.env.production` 均已被 `.gitignore` 忽略，不会进入仓库。

## 构建与部署

```shell
NODE_ENV=production npm run build
```

构建产物输出到 `dist` 目录。

部署时由平台面板注入环境变量，仓库内不保存任何部署地址或环境配置。

### SPA 回退

前端使用 react-router history 模式，部署平台需将任意路径重写到 `/index.html`，以保证深链刷新可用。

## 目录结构

```
xinghantongmeng/
├── public/
│   └── index.html        # 入口模板
├── src/
│   ├── pages/            # 页面
│   ├── components/       # 公共组件
│   ├── services/         # 数据封装
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript 类型
│   └── styles.css        # 全局样式
├── webpack.config.js
└── package.json
```

## 开源许可

本项目源码仅供学习交流，未经许可不得用于商业用途。
