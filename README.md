# UI Kit 特性裁剪构建器

基于 Vue 3 + TypeScript 的 UI 组件库按需构建方案：一份源码树，通过 profile 配置按「组件 × 特性」粒度裁剪产物，输出为一个个可独立安装的 npm 包，并配套 20 套主题与可视化构建器、组件调试台。

## 特性

- **特性级裁剪**：每个组件的可选能力（如 `pagination.layout`、`select.select-clearable`、`select.select-virtualized`）都是独立特性模块，构建时按 profile 白名单剔除未选中的代码与样式
- **profile 驱动构建**：一个 profile 产出一个独立包（ESM + 类型声明 + 独立 CSS + `meta.json` 体积/特性清单）
- **20 套主题**：15 套对齐主流设计体系（Ant Design、Arco、TDesign、Naive UI、View Design、Vant、Varlet、Semi、Material 3、Bootstrap、shadcn/ui、Fluent 2、Carbon、Mantine、iOS），另有 `core` / `full` / `branded` / `chinese` / `cute` 5 套内置风格；主题全部由 CSS 令牌驱动，不侵入组件逻辑
- **可视化构建器**：勾选组件、特性与主题，实时生成构建配置并估算产物体积
- **组件调试台**：89 个组件的场景预设、属性面板、API 属性表与在线编辑预览

## 目录结构

```
packages/ui-kit/src/      组件源码；每个组件由 spec.mjs 声明导出、属性与特性
profiles/                 构建配置（core、full + 18 套主题）
scripts/                  构建、元数据生成、校验与门禁编排（ci.mjs）
tools/                    非门禁的本地工具（guardian 常驻巡检）
configurator/ + index.html  可视化构建器
examples/consumer/        组件调试台（Vite + Vue 3）
dist/                     构建产物（每个 profile 一个包）
tests/                    五层用例：components（组件）/ build（构建器）/ profiles（运行时）/ browser（真实浏览器）/ coverage（源码覆盖率），外加布局与像素基线
.githooks/                pre-commit（秒级五段）与 pre-push（全量十三段）
.github/workflows/        服务端 CI：执行 node scripts/ci.mjs 并上传 ci-report.json
```

根目录的 `registry.mjs`（组件与特性清单）、`sizes.json`（产物体积）、`vitest.*.config.ts`（各层用例入口）、`tsconfig*.json` 与 `ci-report.json`（门禁机读报告，运行后生成）由上述目录共同消费。

## 环境要求

- Node.js ≥ 22、npm 10+（`package.json` 的 `engines` 会在安装时校验）
- 首次克隆后按顺序执行：

```bash
npm install                              # 安装依赖
npm run hooks:install                    # 装 pre-commit（秒级五段）与 pre-push（全量十三段）
npx playwright install chromium firefox  # 浏览器层：Chromium 全量，Firefox 只跑布局 / 定位 / 键盘子集
npm run build:all                        # 首次统一构建 20 份 profile（quality 内部也会先构建一次）
```

消费方（调试台）另有独立依赖：`npm --prefix examples/consumer install`。

## 快速开始

```bash
# 启动构建器（http://localhost:5173；并行工作树可用 .env.workbuddy 换成独立端口段）
npm run dev

# 构建全部 profile 到 dist/（20 份正式包；175 个特性边际试算走 .build/，构建后清理）
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

`sizes.json` 里"单个特性的边际体积"来自 175 份「full 去掉该特性」的试算产物：它们只写 `.build/feature-deltas/`，构建结束（含失败退出）即清理，不会混进 `dist/`。20 份正式 profile 与试算产物都按 6 路并发构建；试算结果按源码内容哈希缓存在 `.build/feature-size-cache.json`，源码、profiles、`registry.mjs` 与构建器都没变时直接复用——冷启动约 10 分钟，命中缓存约 1 分钟。需要强制重算时设 `UIKIT_NO_BUILD_CACHE=1`。

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
npm run test:all       # 历史别名，等价于 npm run quality；仅用于本机调试，不作为门禁口径
npm run typecheck      # TypeScript 类型检查（库 + 用例两份 tsconfig）
npm run lint           # ESLint
npm run verify         # 库级校验（构建产物、API 一致性等）
npm run verify:governance # 治理校验（影响面清单、特性裁剪静态守卫、缺陷编号与文档数字对齐）
npm run audit:visual  # 视觉体检（真实浏览器计算样式契约 + 逐组件截图画廊，见 visual-report/index.html）
npm run verify:consumer  # 消费方校验（类型、负向用例、运行时渲染）
npm run quality        # 唯一门禁（十三段）：先统一构建一次，再依次跑格式 → 类型 → lint → 库级校验 → 治理校验 → 五层用例 → 视觉体检 → 消费方校验
npm run ci             # quality 的 CI 别名（同一条命令），供服务端流水线直接调用，额外逐段输出耗时并落机读的 ci-report.json
npm run ci:changed     # 内循环门禁：只跑这次改动影响到的阶段与用例（改一个组件 13 段 → 9 段）
npm run ci:plan        # 只打印受影响范围，不执行（改完先看要跑什么）
npm run hooks:install  # 装 pre-commit（秒级五段）与 pre-push（全量十三段）钩子
```

`quality` 是唯一的门禁入口，也是 `pre-push` 钩子与服务端 CI 执行的同一条命令；每段结论与耗时写入 `ci-report.json`，失败时按阶段名即可定位。`test:all` 只是同一命令的旧名字，保留它以免破坏既有习惯。

`ci:changed` 是同一套阶段定义的收窄版本，不是第二套门禁：它按改动文件算出受影响的层与具体用例（组件用例按 `import` 判定归属，不按名字子串），共享模块、组件库入口、构建器、profile、测试基础设施与未知路径一律回落全量。**合入前仍要跑一次 `npm run quality`**，`ci:changed` 只负责把内循环从分钟级压到十秒级。

各层用例条数不再写进文档（历史上手写计数漂移过多次），一律以对应命令的终端输出和 `ci-report.json` 的阶段记录为准。

组件用例位于 `tests/components/`，断言对象是构建产物 `dist/full/ui-kit.js`：覆盖 89 个组件目录，含 `feature-class-switch.spec.ts` 的特性开关类名专项、`style-attrs.spec.ts` 的样式属性归位、`floating-keyboard.spec.ts` 的浮层键盘与 Escape 分层、`time-picker-scenes.spec.ts` 的场景契约回归，无一目录遗漏。
构建器侧用例位于 `tests/build/`，走独立的 `vitest.build.config.ts`（node 环境），断言对象是 20 份 profile 的产物本身：
特性裁剪结果、`meta.json` / `sizes.json` 自证信息、体积阈值、主题令牌落盘与指纹、`index.d.ts` 与 `spec.mjs` 的类型契约、dev-api 接口分支、demo meta 新鲜度、门禁选择器、组件分类唯一来源、版本 / license / engines 一致性。
浏览器层用例位于 `tests/browser/`，走 `vitest.browser.config.ts`（Vite dev server + Chromium，固定 1280×720 视口；Firefox 只跑布局 / 定位 / 键盘子集），补的是 happy-dom 里"永远为 0 的尺寸"测不到的东西：
布局与几何基线（`npm run snap:layout` 录入）、像素基线（`npm run snap:pixels` 录入）、浮层定位与滚动跟随、拖拽、键盘可达性、真实点击，以及"控制台告警归零"、`time-picker.scene.spec.ts` 的 7 条真实操作序列、构建器 UI（入口跳转 / 组件数 / 试算 / 构建产物 / 配置下载）、`core` / `antd` / `chinese` 裁剪产物冒烟、375×812 窄屏，以及 6 个场景的 axe wcag2a/aa 审计（serious / critical 白名单带理由）。
另有 `npm run audit:visual` 的视觉体检：它在真实 Chromium 里对 124 个导出的组件做计算样式契约扫描（双层边框、原生外观残留、字体错配、文本裁切、渲染缺口），另开调试台服务对 5 个含原生控件的组件页做同一套检查（防止「源码修好、dist 产物或加载路径没跟上」），并产出 123 张逐组件截图（1 个抽象导出默认态无内容）+ 6 个重点场景首屏 + 5 张调试台页面的可视画廊 `visual-report/index.html`。像素基线只能防"以后变"，这一层专治"现在就长歪了"；有阻断项即非零退出，是门禁第十段。
profile 运行时用例位于 `tests/profiles/`（`vitest.profiles.config.ts`），把 20 份产物逐个 import 后真挂载：导出全挂得起、控制台不报警、类名前缀完全隔离、结构性类名在自家 CSS 里有规则、同特性集的组件与 `full` 渲染出同样的标签骨架。
覆盖率层走 `vitest.coverage.config.ts`：同一批组件用例改在源码入口 `.build/full/entry.ts` 上重放，报告输出逐文件表格，全局阈值 88 / 84 / 89 / 88，并对 `src/components/**` 设 21 / 33 / 21 的组件级下限，低于下限即红。
用例暴露的缺陷都以组件文件里的常规回归用例收尾；目前共记录 111 条缺陷（F-1…F-111）。F-101 存量命名违规已随第二刀（F-106）全部改完，守卫 BASELINE 清空；剩余 visible 阵营统一等三项为第三刀（见 NAMING.md §5）。
背景、缺陷清单与修复落点见 `REQUIREMENTS.md`，写用例的约定与踩坑见 `KNOWLEDGE.md`；**全量项目规则（注释/命名/编码/UI/测试/git/agent 分配/出口收敛）见 `RULES.md`**——换 IDE、换机器以它为准。

## 服务端 CI

`.github/workflows/quality.yml` 在 push 与 PR 上只做三件事：装依赖、装 Playwright 浏览器、执行 `node scripts/ci.mjs`；十三段的判定逻辑不复制进流水线，永远与本机的 `npm run quality` 同一份实现。无论成败都会上传 `ci-report.json`，失败时用阶段名定位（`build` / `format` / `typecheck` / `lint` / `verify` / `governance` / `test` / `test:build` / `test:profiles` / `test:browser` / `visual` / `test:coverage` / `consumer`）。

仓库托管在 Gitee；若改用 Gitee Go，用 Node 22 的运行环境执行同一条 `node scripts/ci.mjs` 即可，浏览器层需要先 `npx playwright install --with-deps chromium firefox`。服务端没有浏览器运行环境时，先跑 `node scripts/ci.mjs --fast`（格式 / 类型 / lint / 库级校验 / 治理校验），浏览器层交给 `pre-push`，并在 PR 描述里注明未覆盖的层。

## License

[Apache-2.0](./LICENSE)
