# AGENTS — 会话契约（每次会话自动加载，先读我再动手）

> 本文件是 agent 的入口契约；权威规则集是 [RULES.md](RULES.md)，冲突时以 RULES.md 为准。
> 本文件不写易漂移的数字（组件数/用例数/缺陷数一律以 `registry.mjs`、`ci-report.json`、命令输出为准）。

## 0. 这是什么项目

Vue 3.5 + TS 5.9 + Vite 7 的 UI 组件库**特性裁剪构建器**：一份源码树，按 JSON profile 以「组件 × 特性」粒度裁剪，产出多套可独立安装的主题包（`dist/<profile>/`）。配套可视化构建器（`configurator/` + `index.html`）与组件调试台（`examples/consumer/`）。

- 组件源码：`packages/ui-kit/src/components/<name>/`（`core.ts` + `core.css` + `spec.mjs` + `features/<特性id>/`）
- 共享基座：`packages/ui-kit/src/shared/`（`component.ts` 的 `createUiComponent`、`behavior.ts` 的 `triggerConfig`/`wrapperConfig`/`checkboxConfig` 是组件写法的唯一出口）
- 构建配置：`profiles/*.json`；构建器：`scripts/build-lib.mjs`；清单：`registry.mjs`

## 1. 动手前必读（按顺序）

1. **RULES.md** — 唯一权威规则集（注释/命名/编码/UI/测试/git/agent 分配/出口收敛/换环境 checklist）。做任何改动前重读相关小节。
2. **本任务的 owns 边界** — 见 §2 工作流；改文件前先想清楚这块地归不归你。
3. 按需查阅（路由表见 §5）。

## 2. 工作流（违反即返工）

**不许直接在主树改代码。** 所有代码/文档改动走 worktree + 台账：

```bash
node scripts/task-claim.mjs check --owns <路径,...>        # 干跑，无冲突再往下
git worktree add .worktrees/<id> -b <type>/<yyyyMMdd>-<slug>
node scripts/task-claim.mjs claim --id <id> --owner <你> --branch <branch> \
  --owns <路径,...> --worktree .worktrees/<id>
```

- owns = 相对仓库根的路径前缀，按路径边界判重叠；`node scripts/task-claim.mjs list` 看现有认领。
- 派生产物**永远不进分支、不可 own**：`sizes.json`、`ci-report.json`、`dist/`、`.build/`、`coverage/`、`examples/consumer/src/demo/meta.json`。合并后由整合者在 main 上统一再生成。
- 整合前 `node scripts/task-claim.mjs verify-branch --id <id>` 拦派生产物；合流只 `git merge --ff-only`。
- worktree 里**禁止 `npm install`**（node_modules 用 junction 链主树）。
- 拆 worktree 铁律：先 `cmd //c "dir /al"` 确认无 JUNCTION → 有 junction 先 `rmdir <链接>`（不带 /s）→ 再 `git worktree remove`。`rmdir /s /q` 碰 junction 会穿进主树。
- 子 agent 禁区：不 commit/push、不 npm install、不改 owns 之外的文件；发现疑似缺陷写 `it.skip('【疑似缺陷 F-x】…')` 上报，主 agent 在 fix 分支修。

## 3. 硬红线（每次提交前自查）

1. **门禁即法律**：完 = `npm run quality` 13 段全绿（可先 `npm run ci:changed` 内循环提速，合入前仍跑全量）。失败按 `ci-report.json` 阶段名定位。
2. **永不 `--no-verify`**；钩子就在 `.githooks/`（跟仓库走，不用重装）。pre-commit 秒级五段，pre-push 全量。
3. **默认不写注释**，中文、一行、只说 why（隐藏约束/反直觉不变量/特定 bug workaround/会惊讶读者的行为）。禁止复述代码、JSDoc、改码历史、TODO 占位。细则 RULES.md §1。
4. **单一来源**：同类语义全库只有一个出口（`createUiComponent`、`triggerConfig`、`normalizeOptions`、`renderIcon`、`--size-*`/`is-*` 类名……完整清单 RULES.md §8）。发现第二个就收敛或登记，静态守卫（`tests/build/*guard*.spec.ts`）会拦。
5. **新缺陷先红用例**：先写回归用例证明会红 → 修复 → 绿 → 登记 F-x，README/KNOWLEDGE/REQUIREMENTS 三处口径同步（「共记录 N 条缺陷（F-1…F-N）」）。新扫描守卫合入前要用改前代码反证非空转。
6. **不写防御系统内部的兜底**：只在系统边界（用户输入、外部 API）校验；不加 feature flag / 兼容层。
7. **后台命令绝不接管道**（管道吃掉退出码）；git 操作只用 `git -C <路径>`（在 worktree 里时）。
8. 提交格式 `<type>: <中文一句话>（F-x）`，body 写 why；推送 `git -c http.proxy= -c https.proxy= push origin main` 后 `git ls-remote origin main` 对哈希。

## 4. 常用命令（全部走 package.json scripts，不手敲底层命令）

| 目的 | 命令 |
| --- | --- |
| 唯一门禁（13 段） | `npm run quality` |
| 内循环门禁（只跑受影响段） | `npm run ci:changed`；先只看影响面 `npm run ci:plan` |
| 组件单测（跑前自动 build:full） | `npm test` |
| 构建器契约 / profile 运行时 / 浏览器 / 覆盖率 | `npm run test:build` / `test:profiles` / `test:browser` / `test:coverage`（各有 pre 构建） |
| 布局/像素基线改动后重录 | `npm run snap:layout` / `npm run snap:pixels`（别手改基线文件） |
| 视觉体检画廊 | `npm run audit:visual` → `visual-report/index.html` |
| 构建全部 profile | `npm run build:all`（`UIKIT_NO_BUILD_CACHE=1` 强制重算特性边际体积） |
| 台账治理 | `node scripts/task-claim.mjs list/check/claim/status/verify-branch/release/gc` |

注意：组件用例断言对象是**构建产物** `dist/full/ui-kit.js`，改完源码必须先 `npm run build:full`（`npm test` 的 pretest 已自动做）。

## 5. 检索路由（不确定就查，别猜）

| 问题 | 去哪 |
| --- | --- |
| 规则冲突 / 能不能这么写 | `RULES.md`（§0 总则裁决） |
| 命名（prop/事件/类名/词性） | `NAMING.md`，机器守卫 `tests/build/naming-guard.spec.ts` |
| 流程 / 认领 / worktree / 派生产物 | `WORKFLOW.md` + `node scripts/task-claim.mjs --help` |
| 踩坑 / 测试写法 / 环境陷阱 | `KNOWLEDGE.md` |
| 需求背景 / 缺陷台账 F-x / 波次历史 | `REQUIREMENTS.md` |
| 架构总览 / 质量分层 / 命令口径 | `README.md` |
| 组件有哪些、特性 id、规格契约 | `registry.mjs` + 各组件 `spec.mjs` |
| 语义化检索（知识图谱） | Repo Wiki 知识卡：用 SearchKnowledge 按模块名/语义查（构建器契约、测试分层、profile 运行时等均有卡） |

## 6. 测试五层（各管一段，不许越层）

| 层 | 配置 | 管什么 |
| --- | --- | --- |
| 组件 | `vitest.config.ts` | 单组件行为（happy-dom，断言 dist/full 产物） |
| 构建契约 | `vitest.build.config.ts` | 产物体积/类型/裁剪/主题令牌 + 全部静态守卫（node 环境） |
| 浏览器 | `vitest.browser.config.ts` | 真渲染：定位、像素、键盘、axe wcag2a/aa；文件名必须含组件 id |
| profile 运行时 | `vitest.profiles.config.ts` | 各份产物逐个真挂载、前缀隔离、结构同构 |
| 覆盖率 | `vitest.coverage.config.ts` | 同批组件用例在源码入口重放，卡阈值 |

写用例约定：文件名 `tests/components/<组件id>.spec.ts`；describe 用中文组件名；不 mock 被测组件；fake timers 成对 `vi.useRealTimers()`；浏览器用例必须真跑过再提交；断言语义要真（"没有 close 事件"≠"事件数组为空"）。
