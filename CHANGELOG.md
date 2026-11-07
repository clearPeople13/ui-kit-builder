# Changelog

版本号的唯一事实源是根目录 `package.json`：`registry.mjs` 与每份 `dist/<profile>/package.json` 都从它读取，不另行手写。

## 0.3.0

工程与测试优化（B1–B5），门禁从"跑得起来"收紧到"跑得对、看得见"。

### 构建与产物

- 门禁短路：`build` / `verify` 失败即停，避免后续阶段刷出二次报错；产物写入前确认目标命名空间，旧产物不会被复用
- 构建缓存：组件级特性缓存 v2 + profile 缓存 v1 + 源码指纹 `.build/build-fingerprint.json`；`UIKIT_NO_BUILD_CACHE=1` 强制全量
- 单一清单源：profile 清单由 `scripts/profile-catalog.mjs` 生成；90 个组件的分类由 `scripts/demo-categories.mjs` 一处定义，构建器与调试台同时消费
- 版本 / license / engines 同源：根 `package.json` → `registry.mjs` → 产物 `package.json`

### 测试层

- 浏览器层补齐 Firefox 子集、375×812 窄屏、`core` / `antd` / `chinese` 裁剪产物冒烟，以及 6 个场景的 axe wcag2a/aa 审计
- 覆盖率改为 per-file 报告，全局阈值 88 / 84 / 89 / 88，`src/components/**` 增设组件级下限
- 用例工程切到 strict TypeScript，`as any` 清零，未使用导入与死代码清理

### 工程卫生

- 删除 `manifest.json`、`sweep-shots.mjs`、`generate-suite.mjs` 与 `reference/`；`guardian` 迁入 `tools/`
- format / ESLint 覆盖构建器、消费方与 `tools/`；消费方 Vite `server.fs.allow` 收敛到自身 + `dist/` + 构建器 + 分类清单
- `quality` 成为唯一门禁入口（`test:all` 保留为同一命令的历史别名）；新增服务端 CI，直接执行 `node scripts/ci.mjs` 并上传 `ci-report.json`
- 文档不再手写用例条数，统一以命令输出与 `ci-report.json` 为准

## 0.2.0

- 组件层、构建器层、profile 运行时层、浏览器层与覆盖率层五层用例成型，缺陷登记与治理校验接入门禁

## 0.1.0

- 首个可运行版本：profile 驱动的特性裁剪构建、20 套主题、可视化构建器与组件调试台
