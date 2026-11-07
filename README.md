# UI Kit 特性裁剪构建器

基于 Vue 3 + TypeScript 的 UI 组件库按需构建方案：一份源码树，通过 profile 配置按「组件 × 特性」粒度裁剪产物，输出为一个个可独立安装的 npm 包，并配套 20 套主题与可视化构建器、组件调试台。

## 特性

- **特性级裁剪**：每个组件的可选能力（如 `pagination.layout`、`select.clearable`、`table.virtual-scroll`）都是独立特性模块，构建时按 profile 白名单剔除未选中的代码与样式
- **profile 驱动构建**：一个 profile 产出一个独立包（ESM + 类型声明 + 独立 CSS + `meta.json` 体积/特性清单）
- **20 套主题**：15 套对齐主流设计体系（Ant Design、Arco、TDesign、Naive UI、View Design、Vant、Varlet、Semi、Material 3、Bootstrap、shadcn/ui、Fluent 2、Carbon、Mantine、iOS），另有 `core` / `full` / `branded` / `chinese` / `cute` 5 套内置风格；主题全部由 CSS 令牌驱动，不侵入组件逻辑
- **可视化构建器**：勾选组件、特性与主题，实时生成构建配置并估算产物体积
- **组件调试台**：90 个组件的场景预设、属性面板、API 属性表与在线编辑预览

## 目录结构

```
packages/ui-kit/src/      组件源码；每个组件由 spec.mjs 声明导出、属性与特性
profiles/                 构建配置（core、full + 18 套主题）
scripts/                  构建、元数据生成、校验等脚本
tools/                    非门禁的本地工具（guardian 常驻巡检）
configurator/ + index.html  可视化构建器
examples/consumer/        组件调试台（Vite + Vue 3）
dist/                     构建产物（每个 profile 一个包）
tests/                    组件 / 构建器 / 真实浏览器三层用例与布局基线
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动构建器（http://localhost:5173；并行工作树可用 .env.workbuddy 换成独立端口段）
npm run dev

# 构建全部 profile 到 dist/（20 份正式包；178 个特性边际试算走 .build/，构建后清理）
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

`sizes.json` 里"单个特性的边际体积"来自 178 份「full 去掉该特性」的试算产物：它们只写 `.build/feature-deltas/`，构建结束（含失败退出）即清理，不会混进 `dist/`。20 份正式 profile 与试算产物都按 6 路并发构建；试算结果按源码内容哈希缓存在 `.build/feature-size-cache.json`，源码、profiles、`registry.mjs` 与构建器都没变时直接复用——冷启动约 10 分钟，命中缓存约 1 分钟。需要强制重算时设 `UIKIT_NO_BUILD_CACHE=1`。

## 质量检查

```bash
npm test               # 组件单元测试（Vitest + @vue/test-utils，跑前先构建 full 产物）
npm run test:watch     # 单元测试增量模式
npm run test:coverage  # 单元测试覆盖率
npm run test:build     # 构建器侧契约测试（跑前先构建全部 20 份 profile）
npm run test:browser   # 真实浏览器层（Playwright + Chromium，Firefox 跑布局/定位/键盘子集，跑前先构建 full 产物）
npm run snap:layout    # 重新录入布局基线（改动样式/布局后按需执行）
npm run test:profiles  # 20 份 profile 的运行时挂载校验（跑前先构建全部 profile）
npm run test:coverage  # 同一批组件用例在源码入口上重放并卡覆盖率阈值
npm run test:all       # 组件侧 + 构建器侧 + profile 运行时 + 浏览器层 + 覆盖率一次跑完
npm run typecheck      # TypeScript 类型检查（库 + 用例两份 tsconfig）
npm run lint           # ESLint
npm run verify         # 库级校验（构建产物、API 一致性等）
npm run verify:governance # 治理校验（影响面清单、特性裁剪静态守卫、缺陷编号与文档数字对齐）
npm run verify:consumer  # 消费方校验（类型、负向用例、运行时渲染）
npm run quality        # 唯一门禁（十二段）：先统一构建一次，再依次跑格式 → 类型 → lint → 库级校验 → 治理校验 → 五层用例 → 消费方校验
npm run ci             # 与 quality 同一条命令，额外逐段输出耗时并落机读的 ci-report.json
npm run hooks:install  # 装 pre-commit（秒级五段）与 pre-push（全量十二段）钩子
```

组件用例位于 `tests/components/`，断言对象是构建产物 `dist/full/ui-kit.js`；
当前覆盖 95 个文件、1582 条用例（含 `feature-class-switch.spec.ts` 的特性开关类名专项、`style-attrs.spec.ts` 的样式属性归位、`floating-keyboard.spec.ts` 的浮层键盘与 Escape 分层、`time-picker-scenes.spec.ts` 的场景契约回归），90 个组件目录无一遗漏。
构建器侧用例位于 `tests/build/`，走独立的 `vitest.build.config.ts`（node 环境），断言对象是 20 份 profile 的产物本身：
特性裁剪结果、`meta.json` / `sizes.json` 自证信息、体积阈值、主题令牌落盘与指纹、`index.d.ts` 与 `spec.mjs` 的类型契约、dev-api 接口分支、demo meta 新鲜度、门禁选择器、组件分类唯一来源、版本 / license / engines 一致性，共 137 条。
浏览器层用例位于 `tests/browser/`，走 `vitest.browser.config.ts`（Vite dev server + Chromium，固定 1280×720 视口；Firefox 只跑布局 / 定位 / 键盘子集），补的是 happy-dom 里"永远为 0 的尺寸"测不到的东西：
布局与几何基线（`npm run snap:layout` 录入）、像素基线（`npm run snap:pixels` 录入）、浮层定位与滚动跟随、拖拽、键盘可达性、真实点击，以及"控制台告警归零"、`time-picker.scene.spec.ts` 的 7 条真实操作序列、构建器 UI（入口跳转 / 组件数 / 试算 / 构建产物 / 配置下载）、`core` / `antd` / `chinese` 裁剪产物冒烟、375×812 窄屏，以及 6 个场景的 axe wcag2a/aa 审计（serious / critical 白名单带理由），共 83 条。
profile 运行时用例位于 `tests/profiles/`（`vitest.profiles.config.ts`），把 20 份产物逐个 import 后真挂载：导出全挂得起、控制台不报警、类名前缀完全隔离、结构性类名在自家 CSS 里有规则、同特性集的组件与 `full` 渲染出同样的标签骨架，共 142 条。
覆盖率层走 `vitest.coverage.config.ts`：同一批组件用例改在源码入口 `.build/full/entry.ts` 上重放，报告输出逐文件表格，全局阈值 88 / 84 / 89 / 88，并对 `src/components/**` 设 21 / 33 / 21 的组件级下限，低于下限即红。
用例暴露的缺陷都以组件文件里的常规回归用例收尾；目前共记录 81 条缺陷（F-1…F-81），全部已修复。
背景、缺陷清单与修复落点见 `REQUIREMENTS.md`，写用例的约定与踩坑见 `KNOWLEDGE.md`。

## License

[Apache-2.0](./LICENSE)
