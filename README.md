# UI Kit 特性裁剪构建器

基于 Vue 3 + TypeScript 的 UI 组件库按需构建方案：一份源码树，通过 profile 配置按「组件 × 特性」粒度裁剪产物，输出为一个个可独立安装的 npm 包，并配套 20 套主题与可视化构建器、组件调试台。

## 特性

- **特性级裁剪**：每个组件的可选能力（如 `pagination.layout`、`select.clearable`、`table.virtual-scroll`）都是独立特性模块，构建时按 profile 白名单剔除未选中的代码与样式
- **profile 驱动构建**：一个 profile 产出一个独立包（ESM + 类型声明 + 独立 CSS + `meta.json` 体积/特性清单）
- **20 套主题**：15 套对齐主流设计体系（Ant Design、Arco、TDesign、Naive UI、View Design、Vant、Varlet、Semi、Material 3、Bootstrap、shadcn/ui、Fluent 2、Carbon、Mantine、iOS），另有 `core` / `full` / `branded` / `chinese` / `cute` 5 套内置风格；主题全部由 CSS 令牌驱动，不侵入组件逻辑
- **可视化构建器**：勾选组件、特性与主题，实时生成构建配置并估算产物体积
- **组件调试台**：91 个组件的场景预设、属性面板、API 属性表与在线编辑预览

## 目录结构

```
packages/ui-kit/src/      组件源码；每个组件由 spec.mjs 声明导出、属性与特性
profiles/                 构建配置（core、full + 18 套主题）
scripts/                  构建、元数据生成、校验等脚本
configurator/ + index.html  可视化构建器
examples/consumer/        组件调试台（Vite + Vue 3）
dist/                     构建产物（每个 profile 一个包）
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动构建器（http://localhost:5173）
npm run dev

# 构建全部 profile 到 dist/
npm run build:all

# 生成调试台元数据（组件、属性、包体积）
npm run meta:demo

# 启动组件调试台
npm --prefix examples/consumer install
npm run demo:consumer
```

单个主题构建：`npm run build:antd`、`npm run build:shadcn`、`npm run build:full` 等，命名规则为 `build:<profile>`。

## 按需构建机制

- `packages/ui-kit/src/components/<name>/spec.mjs` 声明组件的核心属性与可选特性
- `profiles/<name>.json` 指定该包包含的组件、特性与主题令牌
- `scripts/build-lib.mjs` 按配置生成入口文件，只 import 选中的特性，未选中的代码与样式不会进入产物
- 产物中的 `meta.json` 记录组件清单、特性矩阵、文件体积与 gzip 体积，可直接被构建器与调试台消费

## 质量检查

```bash
npm test               # 组件单元测试（Vitest + @vue/test-utils，跑前先构建 full 产物）
npm run test:watch     # 单元测试增量模式
npm run test:coverage  # 单元测试覆盖率
npm run typecheck      # TypeScript 类型检查
npm run lint           # ESLint
npm run verify         # 库级校验（构建产物、API 一致性等）
npm run verify:consumer  # 消费方校验（类型、负向用例、运行时渲染）
```

组件用例位于 `tests/components/`，断言对象是构建产物 `dist/full/ui-kit.js`；
`tests/findings.spec.ts` 用 `it.fails` 记录已知缺陷，背景与缺陷清单见 `REQUIREMENTS.md`、`KNOWLEDGE.md`。

## License

[Apache-2.0](./LICENSE)
