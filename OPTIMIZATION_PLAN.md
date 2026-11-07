# 工程与测试优化计划书

> 基线：`origin/main @ c415f1e`（十二段门禁全绿，组件层 95 文件 1582 条、构建器侧 8 文件 95 条、profile 运行时 142 条、浏览器层 11 文件 65 条）。
> 范围：2026-11-07 全量审计的 37 项工程 / 测试 / 文档问题，全部列在本文，不另行追加"下一批"。
> 原则：先修会静默出错或被覆盖的（P0），再做效率，再补测试，最后收口文档；每批独立分支、独立门禁、可单独回滚。

## 1. 目标与验收指标

| 指标                 | 当前                                       | 目标                                                       | 验证方式                                        |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------- |
| 门禁失败行为         | build 失败后仍继续跑后续阶段               | build / verify 失败立即短路，报告只保留已执行阶段          | 人为改坏一个 profile，`ci.mjs` 退出码 1 且不跑测试 |
| 自定义包安全性       | `/api/build` 可覆盖 `dist/full` 等正式产物 | 正式 profile 名保留，自定义包只写 `dist/custom/<name>`     | dev-api 单测 + 手工 POST `name=full` 被拒        |
| 复用产物可信度       | `verify:reuse` 只看文件是否存在            | 复用前校验源码指纹，指纹不符自动重建                       | 改一行源码后 `verify:reuse` 必须重建             |
| 构建冷启动           | `build:all` 约 9–10 分钟                   | ≤ 6 分钟                                                   | 清空 `.build/feature-size-cache.json` 实测       |
| 构建热启动           | `build:all` 约 45 秒                       | ≤ 30 秒                                                    | 源码未变连续跑两次                               |
| pre-commit           | 约 45–60 秒（verify 仍会重建 20 份包）     | ≤ 15 秒（源码未变时真正复用）                              | `time git commit --allow-empty`                  |
| 特性缓存失效面       | 任意源文件改动 → 178 项全重算              | 单组件改动只重算该组件特性                                 | 改一个组件后再构建，观察日志中的重算数量         |
| 覆盖率               | 只有全局 87 / 83 / 88 / 87                 | 全局各 +1 点，并对 `src/components/**` 设组件级下限        | `npm run test:coverage`                          |
| 浏览器矩阵           | 仅 `full` + Chromium + 1280×720            | `full` / `core` / `antd` / `chinese` 冒烟；Firefox 跑布局子集 | `npm run test:browser`                           |
| 无障碍               | 仅键盘可达性手工断言                       | 6 个场景 axe serious / critical 归零                        | `npm run test:browser`                          |
| 文档口径             | 用例数字已出现 94/1570 与 95/1582 并存     | 所有文档数字与产物/报告一致，或改由报告生成                | `npm run verify:governance` + 人工抽查           |

## 2. 分批总览

| 批次 | 分支（`<type>/<yyyyMMdd>-<slug>`）        | 覆盖条目                             | 依赖     | 规模 | 核心产出                                     |
| ---- | ----------------------------------------- | ------------------------------------ | -------- | ---- | -------------------------------------------- |
| B1   | `fix/20261107-gate-and-artifact-safety`   | A1–A7、A9                            | 无       | L    | 门禁短路、产物命名空间、复用指纹、负边际     |
| B2   | `perf/20261107-cache-granularity`         | A10、C1–C4、C11                      | B1       | L    | 组件级缓存、profile 缓存、registry 单次加载  |
| B3a  | `test/20261107-tooling-contracts`         | B1、B5、B6、B10                      | B1       | M    | dev-api / 构建器用例、门禁选择器用例         |
| B3b  | `test/20261107-browser-matrix-a11y`       | B2、B3、B4、B7                       | B2       | M    | 裁剪产物冒烟、Firefox、组件级覆盖率、axe     |
| B4   | `refactor/20261107-consistency-and-scope` | A8、C5–C10                           | B2、B3a  | L    | 单一清单源、分类合并、死资产、检查范围       |
| B5   | `docs/20261107-docs-and-ci-entry`         | A2、B8、B9、D1–D6                    | B1–B4    | S    | 文档收口、服务端 CI、唯一入口                |

> B3a 与 B3b 可以在 B2 之后并行；B4 会触碰用例 tsconfig 与浏览器/消费方路径，放在 B3b 之后最省冲突；B5 最后做，数字与段数一次性对齐。

## 3. 批次详情

### B1 · 正确性与产物安全（P0）

**目标**：让"构建失败 / 产物被覆盖 / 复用旧包"三类问题在门禁里直接报红，而不是靠人记得。

| ID  | 问题                                          | 做法                                                                                                                        | 验收                                                                 |
| --- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| A1  | `ci.mjs` 阶段失败不短路                       | 在循环里遇到 `build` / `verify` 失败立即 `break`（其余阶段可选 `--keep-going`）；汇总里标记未执行阶段                        | 改坏 `profiles/full.json` 后 `node scripts/ci.mjs` 只跑 build 并退出 1 |
| A3  | `/api/build` 可覆盖正式 profile               | 保留名集合来自当前 `profiles/`；命中保留名返回 409；自定义包统一写 `dist/custom/<name>`；返回体新增 `dir` 供 UI 展示          | 单测：`name=full` 返回 409；`name=demo` 落在 `dist/custom/demo`        |
| A4  | `verify:reuse` 只验文件存在                   | `build:all` 结束时写 `.build/build-fingerprint.json`（源码指纹 + 时间）；`loadBuiltResults` 校验指纹，不符返回 null 触发重建 | 改一行源码后 `npm run verify:reuse` 日志显示重新构建                  |
| A5  | `dist/` 陈旧 profile 不清理                   | 清理范围改为"`dist/` 下不在 `profiles/` 且不在 `dist/custom/` 的目录"，保留自定义包；启动日志列出删除项                     | 删除一个 profile JSON 后构建，旧目录消失；`custom/*` 保留             |
| A6  | 特性负边际被夹成 0                            | `delta()` 返回有符号差值；`sizes.json` 保留负值；构建日志对负值给一条提示                                                    | 单测覆盖负值；`sizes.json` 中不再出现被抹平的可疑 0                  |
| A7  | `sameFeatures` 配对分支是死代码               | 删除该分支，只保留"full 减特性"的试算路径；或在改为子集判定后补一条能命中的用例                                             | 覆盖分支的用例存在；构建日志不再出现两条路径的歧义                   |
| A9  | 自定义包名 `feat-*` 会被下次构建删除          | 与 A3 一并解决：自定义包进入 `dist/custom/`，清理逻辑不再扫描该命名空间                                                     | 自定义包 `feat-demo` 连续两次构建后仍存在                            |

**DoD**：`npm run quality` 十二段全绿；`tests/build/build-hygiene.spec.ts` 增加 A5 / A6 断言；dev-api 至少 3 条单测；`REQUIREMENTS.md` 登记本次缺陷（F-NN）并同步缺陷总数与三处文档口径；`sizes.json` 除负值修正外无意外 diff。

**风险**：A4 的指纹必须包含 `profiles/`、`registry.mjs`、`scripts/build-lib.mjs`、`packages/ui-kit/src`、`package-lock.json`，漏掉任一项都会让旧产物被误复用；A5 删除目录属于破坏性操作，必须先打印再删除，且只在显式构建命令里执行。

### B2 · 构建缓存与单一事实源（P1）

**目标**：把"改一行代码等 10 分钟"和"pre-commit 仍要 1 分钟"压下去，同时让 profile / 分类清单只有一个来源。

| ID  | 问题                                | 做法                                                                                                                     | 验收                                                     |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| A10 | 特性缓存全局指纹、结束才落盘        | 缓存 v2：按组件分键（组件目录 + `src/shared` + registry + build-lib + full profile + lockfile）；每完成一批 `mapPool` 即写盘 | 改一个组件后只重算该组件特性；中途 Ctrl+C 后已完成的项仍在 |
| C1  | `--fast` 仍会重建 20 份 profile     | `ci.mjs --fast` 的 verify 改用带指纹校验的 `verify:reuse`；指纹不符时才重建                                              | 源码未变时 pre-commit ≤ 15 秒，改源码后自动重建           |
| C2  | 20 份 profile 无增量缓存            | `.build/profile-cache.json`：按 profile 配置 + 选中组件源码 + build-lib 指纹缓存整份产物；命中时校验 `ui-kit.js`/`meta.json` | 连续两次 `build:all` 第二次 ≤ 30 秒                       |
| C3  | 每次 `buildProfile` 重新加载注册表  | `loadRegistry()` 加进程内 Promise memo，提供 `{ fresh: true }` 逃生口；`generateTypes` 同源复用                            | 冷构建日志/埋点显示 registry 只加载 1 次                  |
| C4  | profile 清单分散在 4 处             | 以 `profiles/*.json` 为唯一来源：构建器扫描目录；`generate-demo-meta` 从 profile 读 `label`（缺省回退）；消费方依赖由脚本生成并加一致性用例 | 新增一个 profile 只改 1 个 JSON + 跑一次生成脚本          |
| C11 | `/api/estimate` 每次真打包、串行排队 | 以 selection + theme 的 JSON 哈希做 LRU（10 条）；前端 150ms debounce；旧请求结果直接丢弃                                  | 连续拖动只触发 1–2 次构建；重复配置命中缓存               |

**DoD**：三类缓存都有失效测试（改 registry / 改组件 / 改 profile 各一条）；`UIKIT_NO_BUILD_CACHE=1` 仍能强制全量；`sizes.json` 在源码未变时字节稳定；文档更新实测数字。

**风险**：缓存正确性优先于速度。任何指纹拿不准的输入一律并入指纹；缓存命中后仍需校验关键文件存在与 `meta.json` 可解析，损坏条目自动重建。

### B3a · 工具链测试（P1）

**目标**：给仓库里唯一没有安全网的两块代码（2584 行构建器 UI + 5 个 dev-api 接口）补上可维护的用例，并让门禁自身可测。

| ID  | 问题                            | 做法                                                                                                                                          | 验收                                                             |
| --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| B1  | configurator + dev-api 零用例   | dev-api 拆出可导出的 `createApiHandlers()`；node 环境直测 5 个接口的正常/405/400/超限/保留名分支；浏览器层新增 `configurator.spec.ts`：加载 `/`、组件数 90、选 2 个组件试算 > 0、构建产物可下载 | `tests/build` 新增 dev-api 用例 ≥ 12 条；浏览器层新增 ≥ 4 条      |
| B5  | demo meta 无新鲜度守卫          | `tests/build` 增加"`demo/meta.json` 的包集合 / 体积 / 组件数与 `dist/*/meta.json` 一致"；不一致时给出重新生成命令                             | 手工改 demo meta 后用例报红                                      |
| B6  | `verify.mjs` 与构建器用例重叠   | 先盘点 2239 条断言中已被 `tests/build/**` 覆盖的部分，逐组迁移；verify 收缩为产物存在性 / 导出冒烟 / SSR 冒烟三类                              | verify 断言数显著下降且覆盖率不降；删除重复断言不留空档          |
| B10 | 门禁选择器无测试                | 从 `ci.mjs` 导出纯函数 `selectStages({ fast, only })`；单测覆盖全量 / fast / `--stage build` / 无匹配四种情况                                  | 四种组合各一条用例；行为与现网一致                               |

**DoD**：新增用例全部进现有 vitest 配置，不新增门禁段（configurator 复用浏览器层 setup）；`npm run quality` 全绿；无新增 `it.skip`。

**风险**：dev-api 的 handler 抽取不能改变 HTTP 契约；浏览器层 setup 需要挂 `apiPlugin()`（当前 `_global-setup.ts` 是 `configFile: false`），挂上后要确认原有组件场景不出现额外接口日志。

### B3b · 浏览器矩阵、覆盖率与无障碍（P1）

**目标**：把"只有 full 在真浏览器里验过"扩到关键裁剪产物，并让覆盖率从"大盘达标"变成"单组件也有底线"。

| ID  | 问题                          | 做法                                                                                                                                                | 验收                                                          |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| B2  | 只有 full 进浏览器 / 像素     | 给 `core`、`antd`、`chinese` 各加一个冒烟场景：挂载 3 个代表组件 + 一个浮层定位 + 控制台静默；消费方依赖补 `chinese` 并由脚本同步                     | 4 份 profile 的浏览器冒烟全绿；消费方 20/20 覆盖              |
| B3  | 只有 Chromium、单一视口       | 浏览器层加 Firefox project，只跑布局/定位/键盘子集（不跑像素）；视口至少补 375×812 的布局断言                                                       | Firefox 子集全绿；窄屏不出现横向溢出                          |
| B4  | 覆盖率只有全局阈值            | 先落 top-10 低覆盖清单（anchor lines 69.84%、autocomplete branches 78.82% 等），逐项补；再给 `src/components/**` 设组件级下限，全局阈值各 +1 点         | 覆盖率报告出现 per-file 表；低于下限直接失败                  |
| B7  | 无 axe 无障碍扫描             | 引入 `@axe-core/playwright`，对 6 个布局场景跑 `wcag2a/aa`，只允许 serious / critical 归零；已知问题登记白名单并带说明                               | 新增 a11y 断言；白名单为空或每项都有理由                      |

**DoD**：浏览器层文件/条数更新进 README、KNOWLEDGE、REQUIREMENTS；布局/像素基线只在预期变化时重录并说明原因；Firefox/窄屏不写像素基线。

**风险**：Firefox 与窄屏可能暴露真实样式缺陷，按"先见红 → 登记 F-NN → 修复 → 降级为常规用例"的既有流程处理；组件级覆盖率阈值先取当前实测向下取整，避免一上来大面积红。

### B4 · 一致性与检查范围（P2）

**目标**：消灭"同一份事实写四遍""跑不起来的历史脚本"和"门禁看不见的目录"。

| ID  | 问题                                | 做法                                                                                                                         | 验收                                                               |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| A8  | 版本 / engines / license 不一致     | root 与 `registry.mjs` 版本对齐；补 `engines.node >= 22`、`license`；消费方 `file:` 依赖版本随产物走                             | `npm pkg get version engines license` 与产物 package.json 一致     |
| C5  | 分类逻辑两份且已分叉                | 合并到 `scripts/demo-categories.mjs`（或 `shared/categories.mjs`），构建器直接 import；90 个组件必须恰好归属一个分组              | 单测：分组并集 = 90、无重复；构建器与调试台分组一致                 |
| C6  | 两份 `node_modules`                 | 评估 workspaces 迁移成本；不迁移则写清 `file:` 语义与升级步骤，并在 CI 缓存策略里体现                                          | 有明确决策记录；`npm ci` 在根与消费方都能复现                       |
| C7  | 死资产 / 一次性脚本                 | 删除 `manifest.json`、`sweep-shots.mjs`、`reference/` 与 `generate-suite.mjs`；`guardian` 移入 `tools/` 并声明外部依赖或删除 | 全仓无悬空引用；README 结构同步；`git grep` 无孤儿路径              |
| C8  | 格式 / lint 范围不全                | format glob 补 `configurator/**/*.js`、消费方配置与 html/css；ESLint 加 `@typescript-eslint/recommended` 并清完新增报错         | `format:check` / `lint` 覆盖新目录且全绿                            |
| C9  | 用例 tsconfig 宽松                  | 新用例文件先走 strict；按目录逐步收紧，优先清 36 处 `as any`；保留 `noImplicitAny` 的例外清单                                  | `tsc -p tsconfig.tests.json` 全绿；新增文件不允许 `as any`          |
| C10 | 消费方 dev server 暴露整个仓库      | `fs.allow` 收敛到消费方 `rootDir` + `dist/`；确认调试台热更新与 `@demo/*` 解析不受影响                                          | 访问 `/@fs/<repo>/.git/...` 被拒；调试台功能正常                    |

**DoD**：删除类改动先 `git grep` 确认无引用；格式化/类型/Lint 清理单独提交，避免与逻辑改动混在一起；`verify:consumer` 全绿。

**风险**：C6 的 workspaces 迁移会改变 lockfile 与 `file:` 解析，若评估后收益不足就明确"不迁移"，不要半途改一半；C9 收紧类型可能暴露大量历史问题，按目录分批，每批保持门禁全绿。

### B5 · 文档、入口与服务端 CI（P2）

**目标**：新机器照文档能一次跑通；文档数字不再手写漂移；门禁不再只依赖本机钩子。

| ID  | 问题                            | 做法                                                                                                                               | 验收                                                         |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A2  | 没有服务端 CI                   | 提供 Gitee Go（或 GitHub Actions）流水线，直接执行 `node scripts/ci.mjs` 并上传 `ci-report.json`；仓库侧权限由你开启                  | 一次 PR 上能看到十二段结论与耗时；失败可定位到阶段            |
| B8  | 文档用例数字漂移                | 删除手写精确计数，改为"测试层 + 命令 + 报告路径"；或由脚本从 `ci-report.json` 生成数字；治理校验增加一致性检查                        | `REQUIREMENTS.md` 不再出现 94/1570 与 95/1582 并存            |
| B9  | `test:all` 重复构建且漏消费方   | `test:all` 改为 `node scripts/ci.mjs` 别名，或改用 `:run` 变体并补 `verify:consumer`；文档只保留 `quality` 为唯一入口               | `npm run test:all` 只构建一次；与 `quality` 行为一致           |
| D1  | 复现前置缺失                    | README 写清 Node 版本、`npx playwright install chromium`、`npm run hooks:install`、首次 `build:all`                                | 全新目录按文档可跑通 `npm run quality`                        |
| D2  | 目录结构与测试层数写错          | 更新结构图为五层用例 + 补齐 `scripts/guardian`、`reference`、根脚本；"三层"改为实际分层                                             | README 与实际目录一致                                         |
| D3  | `.workbuddy/` 豁免不一致        | 把本地目录统一写进 `.gitignore`；保留 `.env.workbuddy` 既有规则                                                                     | 换机器签出后 `git status` 不出现本地目录                       |
| D4  | REQUIREMENTS 无目录             | 增加 TOC 与 F-NN 索引；章节编号一次性梳理                                                                                           | 文档头部可跳转；缺陷编号可检索                                |
| D5  | 包元数据不全                    | 补 `license` 字段与 CHANGELOG（或发布说明约定）                                                                                     | `package.json` 与 LICENSE 一致                                |
| D6  | 两套入口语义重叠                | README / KNOWLEDGE 明确 `quality` 唯一入口；`test:all` 仅本地调试                                                                   | 文档不再出现两种"唯一门禁"说法                                |

**DoD**：门禁段数、用例数、缺陷数、组件数四类口径在 README / KNOWLEDGE / REQUIREMENTS / 治理校验四处一致；新增 CI 配置只引用现有 npm 脚本，不复制检查逻辑。

**风险**：Gitee Go 的运行环境可能没有 Chromium，需要 `npx playwright install chromium` 与缓存；若服务端无法跑浏览器层，先跑 build + 单元/构建器层，浏览器层保留在 pre-push，并在文档写明分工。

## 4. 统一执行规范

1. **分支**：每批从最新 `origin/main` 拉新分支，命名 `<type>/<yyyyMMdd>-<slug>`；禁止直接改 `main`；合并只用 `--ff-only`，不 force push。
2. **测试先行**：能写成用例的问题先写 `it.fails` 守卫（`tests/findings.spec.ts`），修复后转常规用例并删除守卫；每批至少新增一条能防止问题复发的断言。
3. **缺陷登记**：真实缺陷按 F-NN 登记进 `REQUIREMENTS.md`，同步 README / KNOWLEDGE 的"共记录 N 条缺陷"口径；治理校验会检查编号唯一性与连续性。
4. **文档同步**：新增脚本 / 配置 / 用例层时同步 README、KNOWLEDGE、REQUIREMENTS；段数与数字以 `ci-report.json` 和治理校验为准。
5. **门禁**：每批收口跑 `npm run quality`（十二段）全绿；只跑 `npm run test:xxx` 不算完成。
6. **提交粒度**：逻辑修复、格式化/类型清理、文档更新分开提交；提交信息写"为什么"，不复述 diff。
7. **推送**：所有网络 git 命令带 `-c http.proxy= -c https.proxy=`；推送后确认 `ls-remote` 的 hash 与本地一致。
8. **回滚**：每批一个合并点；出现回归时 revert 该批合并提交，不修改历史。

## 5. 执行顺序与检查点

| 轮次 | 内容                     | 检查点                                                                 |
| ---- | ------------------------ | ---------------------------------------------------------------------- |
| 第 1 轮 | B1                       | P0 清零；人为制造构建失败 / 覆盖正式包 / 旧产物复用，三种情况都报红     |
| 第 2 轮 | B2                       | 冷构建 ≤ 6 分钟、热构建 ≤ 30 秒、pre-commit ≤ 15 秒；缓存失效测试全绿   |
| 第 3 轮 | B3a 与 B3b（可并行）     | dev-api / 构建器有真实用例；4 份 profile 浏览器冒烟、axe 归零、组件级覆盖率 |
| 第 4 轮 | B4                       | 检查范围补齐；死资产清零；单一清单源生效                               |
| 第 5 轮 | B5                       | 新机器按 README 跑通；服务端 CI 可见；文档数字一致                     |

## 6. 暂不纳入本计划

- 全量主题的像素回归（当前只覆盖 6 个场景，且像素基线按平台分桶）。
- 真实设备上的触摸 / 输入法 / 滚动惯性行为。
- 把 `tests/**` 一次性提到 `strict: true`（B4 只做增量收紧）。
- 构建器 UI 的视觉重设计或功能扩展（本计划只补测试与安全边界）。
- 依赖大版本升级（除非 `npm audit` 出现高危，且单独开分支）。
