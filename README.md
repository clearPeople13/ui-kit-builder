# UI Kit 特性裁剪构建器

基于 Vue 3 + TypeScript 的 UI 组件库按需构建方案：一份源码树，通过 profile 配置按「组件 × 特性」粒度裁剪产物，输出为一个个可独立安装的 npm 包，并配套 20 套主题与可视化构建器、组件调试台。

## 特性

- **特性级裁剪**：每个组件的可选能力（如 `pagination.layout`、`select.select-clearable`、`select.select-virtualized`）都是独立特性模块，构建时按 profile 白名单剔除未选中的代码与样式
- **profile 驱动构建**：一个 profile 产出一个独立包（ESM + 类型声明 + 独立 CSS + `meta.json` 体积/特性清单）
- **20 套主题**：15 套对齐主流设计体系（Ant Design、Arco、TDesign、Naive UI、View Design、Vant、Varlet、Semi、Material 3、Bootstrap、shadcn/ui、Fluent 2、Carbon、Mantine、iOS），另有 `core` / `full` / `branded` / `chinese` / `cute` 5 套内置风格；主题全部由 CSS 令牌驱动，不侵入组件逻辑
- **可视化构建器**：勾选组件、特性与主题，实时生成构建配置并估算产物体积
- **组件调试台**：87 个组件的场景预设、属性面板、API 属性表与在线编辑预览

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

# 构建全部 profile 到 dist/（20 份正式包；173 个特性边际试算走 .build/，构建后清理）
npm run build:all

# 生成调试台元数据（组件、属性、包体积）
npm run meta:demo

# 启动组件调试台
npm --prefix examples/consumer install
npm run demo:consumer

# 重建/检索项目知识图谱（组件、特性、profile、文档章节、测试、脚本）
npm run knowledge:build
npm run knowledge:search -- "虚拟滚动"
npm run knowledge:explain -- component:table
```

单个主题构建：`npm run build:antd`、`npm run build:shadcn`、`npm run build:full` 等，命名规则为 `build:<profile>`。

## 按需构建机制

- `packages/ui-kit/src/components/<name>/spec.mjs` 声明组件的核心属性与可选特性
- `profiles/<name>.json` 指定该包包含的组件、特性与主题令牌
- `scripts/build-lib.mjs` 按配置生成入口文件，只 import 选中的特性，未选中的代码与样式不会进入产物
- 产物中的 `meta.json` 记录组件清单、特性矩阵、文件体积与 gzip 体积，可直接被构建器与调试台消费

`sizes.json` 里"单个特性的边际体积"来自 173 份「full 去掉该特性」的试算产物：它们只写 `.build/feature-deltas/`，构建结束（含失败退出）即清理，不会混进 `dist/`。20 份正式 profile 与试算产物都按 6 路并发构建；试算结果按源码内容哈希缓存在 `.build/feature-size-cache.json`，源码、profiles、`registry.mjs` 与构建器都没变时直接复用——冷启动约 10 分钟，命中缓存约 1 分钟。需要强制重算时设 `UIKIT_NO_BUILD_CACHE=1`。

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

组件用例位于 `tests/components/`，断言对象是构建产物 `dist/full/ui-kit.js`：覆盖 87 个组件目录，含 `feature-class-switch.spec.ts` 的特性开关类名专项、`style-attrs.spec.ts` 的样式属性归位、`floating-keyboard.spec.ts` 的浮层键盘与 Escape 分层、`time-picker-scenes.spec.ts` 的场景契约回归，无一目录遗漏。
构建器侧用例位于 `tests/build/`，走独立的 `vitest.build.config.ts`（node 环境），断言对象是 20 份 profile 的产物本身：
特性裁剪结果、`meta.json` / `sizes.json` 自证信息、体积阈值、主题令牌落盘与指纹、`index.d.ts` 与 `spec.mjs` 的类型契约、dev-api 接口分支、demo meta 新鲜度、门禁选择器、组件分类唯一来源、版本 / license / engines 一致性。
浏览器层用例位于 `tests/browser/`，走 `vitest.browser.config.ts`（Vite dev server + Chromium，固定 1280×720 视口；Firefox 只跑布局 / 定位 / 键盘子集），补的是 happy-dom 里"永远为 0 的尺寸"测不到的东西：
布局与几何基线（`npm run snap:layout` 录入）、像素基线（`npm run snap:pixels` 录入）、浮层定位与滚动跟随、拖拽、键盘可达性、真实点击，以及"控制台告警归零"、`time-picker.scene.spec.ts` 的 7 条真实操作序列、构建器 UI（入口跳转 / 组件数 / 试算 / 构建产物 / 配置下载）、`core` / `antd` / `chinese` 裁剪产物冒烟、375×812 窄屏，以及 6 个场景的 axe wcag2a/aa 审计（serious / critical 白名单带理由）。
另有 `npm run audit:visual` 的视觉体检：它在真实 Chromium 里对 124 个导出的组件做计算样式契约扫描（双层边框、原生外观残留、字体错配、文本裁切、渲染缺口），另开调试台服务对 5 个含原生控件的组件页做同一套检查（防止「源码修好、dist 产物或加载路径没跟上」），并产出 123 张逐组件截图（1 个抽象导出默认态无内容）+ 6 个重点场景首屏 + 5 张调试台页面的可视画廊 `visual-report/index.html`。像素基线只能防"以后变"，这一层专治"现在就长歪了"；有阻断项即非零退出，是门禁第十段。
profile 运行时用例位于 `tests/profiles/`（`vitest.profiles.config.ts`），把 20 份产物逐个 import 后真挂载：导出全挂得起、控制台不报警、类名前缀完全隔离、结构性类名在自家 CSS 里有规则、同特性集的组件与 `full` 渲染出同样的标签骨架。
覆盖率层走 `vitest.coverage.config.ts`：同一批组件用例改在源码入口 `.build/full/entry.ts` 上重放，报告输出逐文件表格，全局阈值 88 / 84 / 89 / 88，并对 `src/components/**` 设 21 / 33 / 21 的组件级下限，低于下限即红。
用例暴露的缺陷都以组件文件里的常规回归用例收尾；目前共记录 140 条缺陷（F-1…F-140）。F-101 存量命名违规已随第二刀（F-106）全部改完；第三刀（F-113）把 visible 阵营统一为 v-model、mention 混型拆开，守卫 BASELINE 只剩两处书面豁免（见 NAMING.md §5）。F-114 是 dropdown 向上弹出的假/双滚动条：外层面板是滚动容器，把箭头探出底边的溢出计成可滚动区域冒出假滚动条，再叠加统一限高与内层 maxHeight 形成嵌套双滚动条；修复为外层面板改被动盒子（退出统一限高 + overflow visible，与 cascader「外层被动、内层滚动」同构），浏览器层守卫断言外层不再是滚动容器。F-115 是 pre-push 钩子向子进程注入 GIT_DIR 导致 task-claim 的 git 子进程把临时目录判成真实仓库（钩子内 test:build 假红、推送被拦）：git 调用统一经 gitEnv() 剥离 GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE 等环境变量，含会红回归用例（详见 REQUIREMENTS.md §46）。F-116 是页面缩放后 Chrome/Firefox 在表格底部露出几乎无可滚内容的横向滚动条（Edge 的叠加式滚动条不显示）：缩放产生的小数 CSS 像素让 scrollWidth 被向上取整 1px；修复为表格铺满时留 1px 余量，并在调试台 html/body 用 overflow-x: clip 裁掉页面级 1px，不缩列、不加逐帧测量（详见 REQUIREMENTS.md §47）。F-117 是调试台动态包 URL 只带文件 mtime，Edge 复用旧模块体后指向另一份 Vue，Lucide 的 inject 取不到上下文，表格渲染中断只剩部分行：页面加载时生成一次 preview token 绕开旧缓存（详见 REQUIREMENTS.md §47）。F-118 是展开示例代码时 Shiki 的 theme/lang/wasm 才被 Vite 发现，触发依赖重新预构建，旧 dep URL 返回 504（Outdated Optimize Dep）：改用 fine-grained API 静态导入，首屏完成依赖发现（详见 REQUIREMENTS.md §48）。F-119 是冻结列阴影在表头/表体/合计三张分表的单元格上各画一段，边界处断开：改为根节点一条绝对定位 overlay 贯穿全高，并用 CSS 变量对齐左右冻结边界（详见 REQUIREMENTS.md §49）。F-120 是 Select 默认 persistent 让表格里每个未展开的单元格都提前渲染完整下拉面板（80 个 Select 带出 80 个面板、520 个选项节点）：改为首次展开才创建面板，之后仍按 persistent 保留（详见 REQUIREMENTS.md §50）。F-121 是虚拟表格滚到某行后异步实测提交把视口内容整体顶走（顶部行从 y 变成 x）：改为中途不提交实测，只在滚动到顶部/底部时提交；停下后保持原估算与滚动位置，不会再从 y 行跳到 x 行（详见 REQUIREMENTS.md §51）。F-122 是 F-119 的贯穿式阴影 overlay 用 `width: 1px` 配负 spread 的 `box-shadow`，阴影矩形被收缩成零面积，冻结列边界整条消失：改为 10px 宽渐变带，回归用例改成有/无阴影两次截图的像素亮度 A/B，要求表头/表体/合计三段同样可见且强度一致（详见 REQUIREMENTS.md §53）。F-123 是合并块虚拟化把内容固定在起始行，和原生 `rowspan` 的垂直居中不一致，示例中模块输入框位置错：改为按块中线所在行渲染内容、仍编辑起始行数据（详见 REQUIREMENTS.md §56）。F-124 是合并内容单元格沿用 `nowrap + ellipsis`，多个 Input/Select/文本并排时后面内容被裁成省略号：合并内容改为可换行、取消省略号（详见 REQUIREMENTS.md §57）。F-125…F-133 是表格行键与选择修复集：行身份改用对象身份兜底并统一 DFS 行图，选择类 prop 补表级回退与列级优先级，滚动帧缓存全表可用性，实例方法按全量行定位，树形元数据与排序方向归一化，expand 列抛 `expand-change`，树箭头落在首个内容列，父行半选按本次提交集合重算（详见 REQUIREMENTS.md §58）。F-134…F-136 是表格列宽拖拽修复集：拖一列不再牵动其余列（有用户列宽时按上次渲染宽度钉住，余量只分给弹性列），窄于 `minColumnWidth` 的多选 / 序号列不再一拖就变宽（下限不高于起始宽），手柄整体收进 th 并让右冻结列左邻列的手柄避开滚动条槽宽（详见 REQUIREMENTS.md §59）。F-137 是表格 `showOverflowTooltip` 的问题集：原生 `title` 提示既不受控也不统一，单行省略无法配置多行；改为表头与单元格共用的统一浮层（列级未声明继承表格级、`false` 关闭），`true` 单行、`{ lineClamp }` 多行，多行是否溢出按临时展开后的真实高度判断（详见 REQUIREMENTS.md §60）。F-138 是表格铺满宽度在宽度由内容撑出的容器（flex 居中 / `fit-content` / `inline-block`）里逐帧抖动：铺满分摊改表宽会反过来改变下一次测得的容器宽度，形成正反馈；改为忽略 1px 内的回显、只接受真实的容器 resize（详见 REQUIREMENTS.md §61）。F-139 是表格滚动帧每帧重复读容器几何（`clientWidth` / `scrollWidth` 各 2 次、`scrollLeft` 6 次）：DOM patch 后读布局强制同步布局，综合示例每帧约 30ms、拖滚动条白屏；改为宽度在测量时机缓存、偏移每帧只读一次并供阴影与表头对齐共用（详见 REQUIREMENTS.md §62）。F-140 是同一场景 F-139 之后仍白屏的第二个根因：`handleScroll` 只在帧内第一个 scroll 事件记录偏移，同帧后续事件被丢弃，拖动原生滚动条时渲染窗口落后拇指一个事件位移（拇指 1px 约 700px 内容），视口落到已渲染区间外露白；改为偏移每事件更新、容器尺寸每帧读一次（详见 REQUIREMENTS.md §63）。
背景、缺陷清单与修复落点见 `REQUIREMENTS.md`，写用例的约定与踩坑见 `KNOWLEDGE.md`；**全量项目规则（注释/命名/编码/UI/测试/git/agent 分配/出口收敛）见 `RULES.md`**——换 IDE、换机器以它为准。

## 服务端 CI

`.github/workflows/quality.yml` 在 push 与 PR 上只做三件事：装依赖、装 Playwright 浏览器、执行 `node scripts/ci.mjs`；十三段的判定逻辑不复制进流水线，永远与本机的 `npm run quality` 同一份实现。无论成败都会上传 `ci-report.json`，失败时用阶段名定位（`build` / `format` / `typecheck` / `lint` / `verify` / `governance` / `test` / `test:build` / `test:profiles` / `test:browser` / `visual` / `test:coverage` / `consumer`）。

仓库托管在 Gitee；若改用 Gitee Go，用 Node 22 的运行环境执行同一条 `node scripts/ci.mjs` 即可，浏览器层需要先 `npx playwright install --with-deps chromium firefox`。服务端没有浏览器运行环境时，先跑 `node scripts/ci.mjs --fast`（格式 / 类型 / lint / 库级校验 / 治理校验），浏览器层交给 `pre-push`，并在 PR 描述里注明未覆盖的层。

## License

[Apache-2.0](./LICENSE)
