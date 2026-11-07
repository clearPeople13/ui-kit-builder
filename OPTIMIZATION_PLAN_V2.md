# 评审优化与并行任务治理计划书（V2）

> 基线：本地 `main @ be5cd47`（十三段门禁全绿）；`origin/main` 领先 2 个提交（第十二批：虚拟列表统一），开工前先 `fetch` + `--ff-only` 同步。
> 范围：两部分——**A. 全仓评审发现的优化项**（框架 / 组件 / 调试台 / 测试）；**B. Git 与并行任务治理流程**（把"靠记忆拆分所有权"升级为可执行、可审计的硬约束）。
> 原则：先建治理地基（G0），再修会静默出错 / 安全 / 复用陈旧产物的（P0），再做一致性与性能，最后做结构性决策。每批独立分支、独立门禁、可单独回滚。
> 与 V1 关系：`OPTIMIZATION_PLAN.md`（V1，37 项工程/测试问题）已基本执行完毕，本计划不重复其已落地项；V1 的分支/门禁/缺陷登记规范继续生效，本计划在其上补"并行治理"与"评审深层项"。

---

## 1. 目标与验收指标

| 维度 | 当前 | 目标 | 验证方式 |
| --- | --- | --- | --- |
| 并行任务冲突 | 仅靠记忆拆分所有权，无下发前校验 | 下发前所有权相交即拒；台账可审计 | `task-claim.mjs check` 重叠返回非零 |
| 静默覆盖 | 共享工作树里越界改文件直接覆盖 | 任务在独立 worktree，越界只成 git 冲突 | 故意越界改文件，合并时报冲突而非覆盖 |
| 派生产物冲突 | sizes.json/meta.json 随源码提交，并行必冲突 | 任务分支只含源码+用例，派生产物合并后统一再生成 | 两个不相交任务合并无 sizes.json 冲突 |
| dev-api 安全 | packId 未校验，可路径穿越 | `/packs/../` 一律 400/404 | 单测 + 手工请求 `.git/config` 被拒 |
| 缓存正确性 | 跨组件 import 不在指纹内 | 改 checkbox 失效含 table 的 profile | 改 checkbox 后 `build:all` 日志显示 table 重算 |
| CI 视觉层 | ubuntu 无基线整段跳过仍报绿 | CI 录 linux 基线，视觉层真跑 | CI 报告 visual/pixels 非 skipped |
| 组件 emits | 89 组件仅 6 个声明 | 凡 emit 必声明，attrs 不双通道 | 全库 grep + 原生事件不二次触发用例 |
| Esc 分层 | dialog 内开下拉 Esc 连关两层 | 单一 escape 栈，判 defaultPrevented | 新增"dialog+select Esc 只关一层"用例 |
| a11y 原语 | focus-trap/roving 零消费 | dialog/tabs/menu/tree 接入 | axe 白名单 serious/critical 收敛 |
| 调试台启动 | 模块顶层生成 ~17.5 万行 | 惰性生成，进场景才造数 | 启动耗时与首屏内存实测下降 |
| 场景切换 | 每次 structuredClone 整表 | 重数据浅拷贝引用/markRaw | 10 万行场景切换 < 100ms |
| slot 自定义 | spec.mjs 零 slot 声明；input/dialog/tree/upload 等零 slot | slot 进 spec/d.ts/API 契约，高价值组件补全 | 补全组件有 slot 用例 + d.ts slot 类型 + API 表可见 |
| 同类实现 | size 类名三套、normalizeOptions 三份、三种组件写法 | 同类逻辑/视觉收拢单一出口 | grep 无重复 normalizeOptions；size 类名单一写法 |
| 命名/词性 | "显示"语义四种名（modelValue/visible/open/visible-change）；事件构词法混用 | 命名公约 + 常见语义字典 + spec 命名守卫 | 同语义全库单一词；命名守卫用例绿 |

---

## 2. 分批总览

| 批次 | 分支（`<type>/<yyyyMMdd>-<slug>`） | 覆盖 | 依赖 | 规模 | 核心产出 |
| --- | --- | --- | --- | --- | --- |
| G0 | `feat/20261108-task-governance` | §3 全部、B1–B3 | 无 | L | 台账 + claim 校验器 + WORKFLOW + worktree 规范 |
| G1 | `fix/20261108-safety-and-cache` | A1–A4 | G0 | M | 路径穿越、指纹闭包、CI 视觉基线、环检测 |
| G2 | `fix/20261108-component-conventions` | A5–A8 | G0 | M | emits、Esc、date-picker、form trigger |
| G3 | `feat/20261108-a11y-i18n` | A9–A10 | G2、G7 | L | focus-trap 接入、locale 地基 |
| G4 | `perf/20261108-demo-latency` | A11–A13 | G0 | M | 惰性造数、clone 改引用、heavyRows 响应 |
| G5 | `test/20261108-test-blinds` | A14–A16 | G1、G2、G7 | M | 泄漏守卫、组合抽样、触摸/SSR |
| G7 | `refactor/20261108-design-convergence` | A21–A25 | G2 | XL | slot 契约+补全、同类视觉/代码统一、出口收拢、命名公约 |
| G6 | `refactor/20261108-structural` | A17–A20 | G1–G5、G7 | XL | 裁剪口径、d.ts 单源、发布链、依赖升级 |

> G0 必须先做：它是后续所有并行批次的安全网。G1/G2/G4 可在 G0 后并行（所有权不相交，见 §3）；G7 依赖 G2 的约定收口，且触碰大量组件属高争用，须按 §3 拆成所有权不相交的子任务；G3 依赖 G2/G7（在统一基座上接 a11y）；G5 依赖 G1/G2/G7 的修复落定；G6 是结构性决策，最后做且需逐项拍板。

---

## 3. Git 与并行任务治理流程（命令级）

### 3.1 角色与禁区

- **整合者（main agent）**：唯一可做 git 写操作、`build:all`、合并、推送、台账读写的角色。所有网络 git 命令带 `-c http.proxy= -c https.proxy=`。
- **执行者（subagent）**：只在被分配的 worktree 内改源码与用例；可跑指定文件的 vitest；**禁** git、`npm install`、`build:all`、`test:*` 全量（会重写 `dist/**` 干扰兄弟）、改台账。需要产物时只允许开局 `build:full` 一次。
- 单工作树串行任务可豁免 worktree，但仍须走台账 claim（§3.3）。

### 3.2 任务台账（中央、不进版本库）

台账必须**中央唯一**，不能随 worktree 复制（worktree 各有独立工作目录，若台账被跟踪则每份各改各的，协调失效）。约定：

- 位置：主工作树根 `.tasks/active.json` + 追加审计 `.tasks/history.jsonl`。
- `.tasks/` 与 `.worktrees/` 加入 `.gitignore`（G0 落地），永不合并、永不冲突。
- 只有整合者读写；执行者不碰台账，只在 prompt 里收到自己的 owns 范围。

`active.json` schema：

```json
{
  "version": 1,
  "tasks": {
    "G1-devapi-traversal": {
      "owner": "agent:build-fix-1",
      "branch": "fix/20261108-devapi-traversal",
      "worktree": ".worktrees/G1-devapi-traversal",
      "owns": ["scripts/dev-api.mjs", "tests/build/dev-api.spec.ts"],
      "status": "running",
      "baseCommit": "be5cd47",
      "claimedAt": "2026-11-08T10:00:00Z",
      "ttlMinutes": 180
    }
  }
}
```

`status` 状态机：`claimed → running → integrating → done`，异常分支 `→ aborted`。`history.jsonl` 每次状态迁移追加一行（含时间戳、操作者、原因）。

### 3.3 所有权与重叠规则

- **所有权单位 = 路径前缀**（相对仓库根，目录以 `/` 结尾）。组件 claim 展开为组件目录 + 其组件用例：
  `component:select` → `packages/ui-kit/src/components/select/` + `tests/components/select.spec.ts`。
- **重叠判定**：两个前缀互为前缀即相交（`a/` 与 `a/b.ts` 相交；`a/` 与 `ab/` 不相交，按路径边界判）。新任务 owns 与任一 `running/claimed/integrating` 任务相交 ≠ 空 → **拒绝并行**。处置三选一：改 scope、排队（Task `blockedBy`）、拆分组件。
- **高争用共享文件**（`packages/ui-kit/src/shared/*`、`scripts/*`、`registry.mjs`、`profiles/*`、`vitest.*.config.ts`）：同一时刻只允许一个任务拥有；需要多任务改共享文件时串行。
- **派生产物不可 own**：`sizes.json`、`examples/consumer/src/demo/meta.json`、`ci-report.json`、`coverage/`、`dist/`、`.build/` 不进入任何 owns，按 §3.7 统一处理。

### 3.4 `scripts/task-claim.mjs` 命令契约（G0 实现）

| 命令 | 作用 | 退出码 |
| --- | --- | --- |
| `check --owns <p1,p2,...>` | 下发前干跑重叠校验，不写台账 | 0 无重叠 / 1 相交（打印冲突任务与路径） |
| `claim --id --owner --branch --owns [--worktree] [--ttl 180] [--base <commit>]` | 校验通过后写台账，状态 claimed | 0 / 1（重叠或 id 重复） |
| `status --id --set <running\|integrating\|done\|aborted>` | 迁移状态并追加 history | 0 / 1 |
| `release --id [--status done\|aborted]` | 归档到 history，从 active 移除 | 0 |
| `list [--json]` | 列出在跑任务与 owns | 0 |
| `gc` | 回收超 TTL 的 claim：worktree 脏则保留并告警，干净则 release | 0 |
| `verify-branch --id` | 检查任务分支 diff 不含派生产物（§3.7），含则非零 | 0 / 1 |

校验器与 `tests/build/task-claim.spec.ts` 同批交付（重叠/边界/共享文件/派生产物拒 own 各一条）。

### 3.5 分支与 worktree 生命周期（整合者执行）

**建立**（在主工作树）：

```bash
git -c http.proxy= -c https.proxy= fetch origin
git checkout main && git merge --ff-only origin/main          # 同步 main
node scripts/task-claim.mjs check --owns <owns>               # 重叠即停，不建分支
git branch fix/20261108-<slug> origin/main
git worktree add .worktrees/<id> fix/20261108-<slug>
# 端口隔离：给该 worktree 写本地 .env.workbuddy（非 CLI，脚本只读环境变量/文件）
printf 'UIKIT_DEV_PORT=5273\nUIKIT_CONSUMER_PORT=5274\nUIKIT_SWEEP_PORT=5299\n' > .worktrees/<id>/.env.workbuddy
npm --prefix .worktrees/<id> ci                               # 独立 node_modules
npm --prefix .worktrees/<id>/examples/consumer ci
node scripts/task-claim.mjs claim --id <id> --owner agent:<name> --branch fix/20261108-<slug> \
  --owns <owns> --worktree .worktrees/<id> --base "$(git rev-parse origin/main)"
node scripts/task-claim.mjs status --id <id> --set running
```

> 端口段每个 worktree 唯一（主树 5173/5174/5199，并行树依次 +100）；`scripts/worktree-ports.mjs` 只导出端口常量、读 `.env.workbuddy`，没有 alloc 子命令。hooks 走 `core.hooksPath .githooks`，是仓库级共享配置，所有 worktree 自动生效，无需各装。

**执行**（执行者在 worktree 内）：只改 owns 内文件；`npx vitest run --config vitest.config.ts <自己的用例>` 验证；不 git、不 build:all、不改派生产物（本地为测试可生成，但**不提交**，见 §3.7）。

### 3.6 完整时序（下发 → 执行 → 整合 → 释放）

1. 整合者 `check` 校验所有权 → 不重叠才继续。
2. 整合者建分支 + worktree + 装依赖 + `claim`（§3.5）。
3. 整合者派发 agent，prompt 写明：worktree 路径、owns 边界、禁区、产物只 build:full 一次。
4. 执行者改源码 + 用例，跑指定用例，回报 diff 摘要与测试结果（不 git）。
5. 整合者审 `git -C .worktrees/<id> diff`，**只 stage 源码与用例**（排除派生产物），在 worktree 提交（pre-commit 跑 `ci.mjs --fast`）。
6. 整合者 `verify-branch` 确认分支不含派生产物；在 worktree 跑该批门禁（`npm --prefix .worktrees/<id> run quality` 或受影响阶段）。
7. 整合者 `status --set integrating`；回 main：`git checkout main`，若 main 已前进则先在 worktree `git rebase main` 解冲突并重跑门禁，再 `git merge --ff-only fix/20261108-<slug>`。
8. 合并后在 main 统一再生成派生产物并提交（§3.7）。
9. 整合者 `git -c http.proxy= -c https.proxy= push origin main`，`git ls-remote origin main` 核对 hash 与本地一致。
10. `release --id --status done` → `git worktree remove .worktrees/<id>` → `git branch -d fix/20261108-<slug>`。

### 3.7 派生产物冲突处理（关键细化）

问题：`sizes.json` / `demo/meta.json` 是入库的机读派生文件。两个源码所有权不相交的任务，各自 `build:all` 都会改这两文件 → **即使源码不冲突，派生产物必冲突**。V1 的"派生产物随源码提交"约定只适用于单分支，并行下必须改：

- **任务分支只含源码 + 用例，不含派生产物。** 执行者本地可生成用于测试，但整合者提交时排除（`git reset HEAD -- sizes.json examples/consumer/src/demo/meta.json ci-report.json` 后再 commit）；`verify-branch` 把关。
- **合并后统一再生成**：所有源码合并到 main 后，整合者在 main 跑一次 `npm run build:all && npm run meta:demo`，把刷新后的 `sizes.json` / `meta.json` 单独提交（`chore: 合并后刷新派生产物`）。源码未变时 `sizes.json.generatedAt` 稳定，无意外 diff。
- 可选硬约束（兜底）：`.gitattributes` 加 `sizes.json merge=ours` 与 `examples/consumer/src/demo/meta.json merge=ours`，并由用户跑 `git config merge.ours.driver true`，使真合并时自动取 main 版本、随后再生成。**git config 由用户执行**，本计划只改 `.gitattributes`。

### 3.8 冲突裁决与门禁重跑

- 源码冲突只应来自所有权重叠（已被 §3.3 拦截）或共享文件串行失误。整合者人工裁决，**绝不 `--no-verify`、绝不盲取一侧**。
- 裁决后在合并结果上重跑完整 `npm run quality`，绿了才推。
- 合并只用 `--ff-only`；非 ff 一律先 rebase 再 ff，不产生 merge commit（派生产物再生成提交除外），不 force push。

### 3.9 失败、崩溃与 stale claim 恢复

- **执行者崩溃**：claim 超 TTL → `gc` 检查 worktree：有未提交改动则**保留 worktree 与分支**、台账标 `aborted` 并告警等人处理；干净则 release + 删 worktree。不自动丢弃脏工作。
- **中途主动放弃**：整合者在 worktree 把 WIP 提交到任务分支（或带唯一 tag 的 stash，`git stash apply` 恢复而非 `pop`），release claim，保留分支供续做。
- **门禁红**：该批不合并，分支留着修；台账维持 integrating，修复重跑后再走 §3.6 步 7。
- 共享 worktree 环境**禁裸 `git stash`/`pop`**；必须 stash 时用唯一 tag、`apply` 精确恢复、只 drop 自己那条。

### 3.10 长任务与 main 同步

- 任务跨天或 main 前进超过 ~10 个提交：整合者在 worktree `git rebase main`，解冲突、重跑受影响用例、更新台账 `baseCommit`。
- rebase 冲突由整合者裁决，必要时向 owning 执行者确认意图；rebase 后必须重跑门禁再合并。

### 3.11 命令速查

```bash
# 网络命令一律带代理清空
git -c http.proxy= -c https.proxy= fetch origin
git -c http.proxy= -c https.proxy= push origin main
git ls-remote origin main                       # 推送后核对 hash

# 台账
node scripts/task-claim.mjs check --owns packages/ui-kit/src/components/select/,tests/components/select.spec.ts
node scripts/task-claim.mjs list
node scripts/task-claim.mjs gc

# worktree
git worktree add .worktrees/<id> <branch>
git worktree remove .worktrees/<id>
git worktree list

# 合并（ff-only，非 ff 先 rebase）
git checkout main && git merge --ff-only <branch>
git -C .worktrees/<id> rebase main

# 派生产物再生成（合并后，main 上）
npm run build:all && npm run meta:demo
```

---

## 4. 批次详情（评审优化项）

### G0 · 并行任务治理地基（P0，先行）

| ID | 问题 | 做法 | 验收 |
| --- | --- | --- | --- |
| B1 | 无下发前所有权校验 | 实现 `scripts/task-claim.mjs`（§3.4）+ `.tasks/` 台账 + `.gitignore` 补 `.tasks/`、`.worktrees/` | 重叠 claim 返回 1；台账 schema 用例绿 |
| B2 | 并行无文件隔离 | WORKFLOW.md 固化 §3；高风险/长任务默认 worktree，端口经 `.env.workbuddy` 隔离 | 两个并行任务越界改文件 → 合并报冲突非覆盖 |
| B3 | 派生产物并行必冲突 | §3.7 规则 + `verify-branch` 命令；`.gitattributes` 可选 merge=ours | 两个不相交任务合并无 sizes.json 冲突 |

**DoD**：`task-claim.spec.ts` 覆盖重叠/边界/共享文件/派生产物拒 own；WORKFLOW.md 与 §3 一致；`npm run quality` 全绿。
**风险**：台账中央化是正确性前提，务必 gitignore；merge=ours 需用户跑 git config，不强制。

### G1 · 安全与缓存正确性（P0）

| ID | 问题 | 证据 | 做法 | 验收 |
| --- | --- | --- | --- | --- |
| A1 | dev-api 路径穿越 | dev-api.mjs:47 | packId 禁 `..`，resolve 后校验仍在 dist 内 | `/packs/../.git/config` 被拒；单测 ≥3 条 |
| A2 | 缓存指纹盲区 | build-all.mjs:134/116 | 指纹纳入 import 闭包 + tsconfig.json + package.json | 改 checkbox → 含 table 的 profile 重算 |
| A3 | CI 视觉层空转 | quality.yml:16 + 基线仅 win32 | CI 录 linux 基线（或容器统一平台） | CI visual/pixels 非 skipped |
| A4 | requires 环栈溢出 | registry.mjs:94 | 入栈即标记 seen，环抛 400 | A↔B 循环用例报 400 非 RangeError |

**DoD**：四项各带回归用例；`npm run quality` 全绿；缺陷登记 F-NN。
**风险**：A2 指纹扩大可能让首次缓存全失效（一次性冷构建），属预期。

### G2 · 组件约定一致性（P1）

| ID | 问题 | 证据 | 做法 | 验收 |
| --- | --- | --- | --- | --- |
| A5 | emits 缺失双通道 | component.ts:117，仅 6 组件声明 | 凡 emit 必在 config.emits 声明 | 原生 change/input 不二次触发用例 |
| A6 | Esc 连关两层 | behavior.ts:1554 + select/core.ts:404 | 单一 escape 栈 + 判 defaultPrevented | dialog+select Esc 只关一层 |
| A7 | date-picker 秒列误判 | date-picker/core.ts:89 | 改用 shared/date.ts hasSecondsToken | 含字面 s 格式不开秒列 |
| A8 | form 全量校验/trigger 死字段 | form/core.ts:119 + context.ts:10 | 按 trigger 增量校验 | 单字段按键不校验其它字段 |

**DoD**：四项回归用例；emits 全库 grep 无遗漏；门禁全绿。
**风险**：A5 补 emits 可能改变 attrs 落点，需跑浮层/键盘层确认无回归。

### G3 · a11y 接入与 i18n 地基（P1）

| ID | 问题 | 证据 | 做法 | 验收 |
| --- | --- | --- | --- | --- |
| A9 | a11y 原语零消费 | focus-trap/roving 无 import；tabs:267 同 tabindex | dialog/drawer 接 focus-trap+aria-modal；tabs/menu/tree 接 roving+方向键 | axe 白名单 serious/critical 收敛 |
| A10 | i18n 缺位 | config.ts:4 仅 size | ConfigProvider 扩 locale 注入，组件文案走注入 | 切 locale 文案变化；默认中文不变 |

**DoD**：axe 白名单逐项消减并留理由；locale 用例；门禁全绿。
**风险**：A10 是新增能力面，先做地基（注入机制 + 2-3 个组件示范），不全量铺文案。

### G4 · 调试台性能（P1，验收面）

| ID | 问题 | 证据 | 做法 | 验收 |
| --- | --- | --- | --- | --- |
| A11 | 启动 eager 造数 | presets.ts:1165/1172/1179/1203 | 场景进入时惰性生成 | 启动耗时/首屏内存下降 |
| A12 | 切换 clone 整表 | scenes.ts:71 | 重数据浅拷贝引用/markRaw | 10 万行切换 < 100ms |
| A13 | heavyRows 不响应 | table-demo.ts:560 | watch 重建或并入重挂载 key | 面板改行数即重建 |

**DoD**：浏览器实测场景切换并记录耗时（遵循 demo-quality 约定）；门禁全绿。
**风险**：markRaw 需要确认表格内部不依赖行的深层响应式。

### G5 · 测试补盲（P2）

| ID | 问题 | 做法 | 验收 |
| --- | --- | --- | --- |
| A14 | 无泄漏断言 | Affix/InfiniteScroll/button-wave 等加卸载清理守卫 | 卸载后定时器/监听器残留断言绿 |
| A15 | 特性组合只测全开/全关 | profiles 层按依赖对单特性关闭组合抽样挂载 | 中间组合运行时校验存在 |
| A16 | 移动端/SSR 盲点 | 补触摸用例、表格窄屏、SSR hydration 校验 | 新增层用例绿 |

**DoD**：新用例进现有 vitest 配置，不新增门禁段；门禁全绿。

### G6 · 结构性决策（P2，逐项拍板）

| ID | 问题 | 决策点 | 做法候选 |
| --- | --- | --- | --- |
| A17 | 特性裁剪收益有限（core 558KB vs full 636KB，175 特性仅 ~76KB） | 逻辑真裁剪 vs 对外改口径 | 逻辑迁 feature（重）或文档明示"逻辑不裁"（轻） |
| A18 | d.ts 双事实源 | spec 生成 vs vue-tsc 抽取 | 加 type/default/emits 对齐守卫，或 vue-tsc 单源 |
| A19 | 发布链缺位 | 是否产品化 | workspaces + changesets + publish 配置 |
| A20 | 依赖 audit 高危 | vitest 3→5 大跳 | 单独分支评估升级；dev-only 风险书面记录 |

**DoD**：每项有明确决策记录（做/不做/延后）；做的项独立分支 + 门禁。
**风险**：G6 改动面大，严禁与 G1–G5 混批；A20 升级可能波及全部测试配置。

### G7 · 设计系统收敛与自定义能力（P1，高争用）

> 用户反馈三点：① 很多组件缺 slot 无法自定义；② 同类组件 UI/设计与代码实现五花八门；③ 同类问题要收拢出口统一管理。下列项均经代码核实。

| ID | 问题 | 证据 | 做法 | 验收 |
| --- | --- | --- | --- | --- |
| A21 | slot 无契约且高价值组件缺 slot | 全库 spec.mjs 零 slot 声明；input/dialog/drawer/tree/transfer/upload/cascader/radio/checkbox 零 slot | slot 进 spec 声明（名称/作用域 props/回退）→ generateTypes 生成 slot 类型 → API 表展示；按优先级补全：input(prefix/suffix/prepend/append)、dialog/drawer(header/footer/close)、tree(自定义节点)、upload(触发/提示/文件项)、transfer/cascader(选项)、radio/checkbox(label) | 每个补全组件有 slot 渲染用例 + d.ts 含 slot 类型 + API 表可见 slot |
| A22 | 同类视觉风格分叉 | size 类名三套：`ui-button--size-`(button:184)/`ui-autocomplete--size-`(autocomplete:72) vs `is-size-`(select:712 等 11 个)；status/variant 各组件自定义 | 统一 size 类名规范（选定一套）+ 共享 size resolver；success/warning/error/info 等 status/variant 收敛到共享令牌与类名 | 全库 size 类名单一写法；同类组件视觉体检一致 |
| A23 | 同类逻辑未收拢出口 | normalizeOptions 三份：shared/behavior.ts:294、segmented/core.ts:20、select/core.ts:132；options-based 组件各造 | normalizeOptions 下沉 shared 单源，select/segmented/cascader/tree-select/autocomplete 复用；input-like 控件（input/input-number/input-tag/mention/select）共享基座；浮层 Esc 单栈（衔接 G2-A6） | 同类逻辑单一出口；grep 无重复 normalizeOptions |
| A24 | 组件三种写法并存 | createUiComponent 基座 / 手写 defineComponent(button/table/virtual-list) / behavior 配置工厂 | 收敛到统一基座入口；手写组件迁移或列明确豁免清单（带理由） | 新组件只走基座；豁免清单受治理校验 |
| A25 | 命名风格与词性不统一 | "显示"四义：dialog/drawer 用 modelValue:Boolean(dialog/core.ts:7)、dropdown/popover/popconfirm 用 visible(dropdown/core.ts:19)、select/cascader/date-picker 用 open+visible-change；布尔开关 showXxx(动词) vs visible/disabled(形容词)；事件 change/visible-change/add-tag/focusout 混用 | 制定 NAMING.md 公约：① 同语义固定唯一词（受控显示统一一种，open 仅作内部态）；② 词性规则（布尔 prop 形容词或 show- 前缀择一；事件动词或名词-change 择一）；③ 常见语义字典（显示/禁用/只读/清空/加载/选中）固定译名；④ spec 层加命名守卫用例 | 公约落地；同语义 grep 单一词；命名守卫用例绿 |

**DoD**：slot 契约用例 + 同类单源守卫（grep 无重复 normalizeOptions、size 类名一致）+ 命名守卫用例 + 视觉体检；`npm run quality` 全绿；缺陷登记 F-NN。
**风险**：G7 触碰大量组件，属高争用批次——**必须按 §3 拆成所有权不相交的子任务**（每子任务一组组件），共享文件（shared/、基座、spec schema）改动串行先行；slot 补全与 size 类名统一会改 DOM 结构/类名，需重录布局/像素基线并在 PR 说明原因；A21 的 spec slot schema 是新增契约面，先定 schema 再铺组件；**A25 改 prop/event 名是破坏性 API 变更**——趁 0.x 未发布（G6-A19）窗口一次对齐，必要时给旧名别名过渡，发布后再改成本翻倍。

---

## 5. 统一执行规范

1. **先 claim 后派活**：任何并行任务下发前必过 `task-claim.mjs check`；整合者把 owns 边界与禁区写进 agent prompt。
2. **分支**：每批从最新 `origin/main` 拉 `<type>/<yyyyMMdd>-<slug>`；禁直接改 main；合并 `--ff-only`，不 force push。
3. **测试先行**：能写成用例的问题先写 `it.fails` 守卫，修复后转常规用例；每批至少一条防复发断言。
4. **缺陷登记**：真实缺陷按 F-NN 登记 REQUIREMENTS.md，同步 README/KNOWLEDGE 总数；治理校验查编号唯一/连续。
5. **派生产物**：任务分支不含 sizes.json/meta.json；合并后 main 统一再生成（§3.7）。
6. **门禁**：每批收口 `npm run quality` 全绿；只跑 `test:xxx` 不算完成。
7. **提交粒度**：逻辑修复、格式/类型清理、文档、派生产物分开提交；信息写"为什么"。
8. **推送**：网络命令带 `-c http.proxy= -c https.proxy=`；推送后 `ls-remote` 核对 hash。
9. **回滚**：每批一个合并点；回归 revert 该批合并提交，不改历史。
10. **git config 由用户执行**：hooks:install、merge.ours.driver 等改 git 配置的命令交给用户，整合者不擅自改。
11. **同类收拢单一出口**：同类问题与同类组件逻辑必须收敛到 shared 抽象或单一事实源，禁各组件各造一套；新增同类实现前先查有无共享出口（normalizeOptions / size resolver / 组件基座 / 浮层 Esc 栈）。slot 是组件自定义的统一出口，须进 spec/d.ts/API 契约，不可散落代码。
12. **命名遵循公约**：prop/event/类名命名遵循 NAMING.md——同语义唯一词、词性一致（布尔形容词或 show- 前缀择一、事件动词或名词-change 择一）、常见语义按字典固定译名；新增命名先查字典，spec 命名守卫会拦漂移。

---

## 6. 执行顺序与检查点

| 轮次 | 内容 | 检查点 |
| --- | --- | --- |
| 第 1 轮 | G0 | 重叠 claim 被拒；越界改文件成 git 冲突；派生产物无并行冲突 |
| 第 2 轮 | G1（G2/G4 可并行） | 路径穿越被拒；改 checkbox 触发 table 重算；CI 视觉层真跑 |
| 第 3 轮 | G2 + G4 | emits/Esc/date-picker/form 收口；调试台切换 < 100ms |
| 第 4 轮 | G7（按组件所有权拆子任务） | slot 进契约+高价值组件补全；size/normalizeOptions 单源；命名公约落地；同类视觉一致 |
| 第 5 轮 | G3 | a11y 白名单收敛；locale 地基可用 |
| 第 6 轮 | G5 | 泄漏/组合/触摸/SSR 用例补齐 |
| 第 7 轮 | G6 | 四项结构性决策各有记录，做的项独立门禁绿 |

---

## 7. 暂不纳入本计划

- 全量 20 主题的像素回归（成本高，当前 6 场景 + 平台分桶）。
- 真实设备触摸/输入法/滚动惯性（需设备实验室）。
- `tests/**` 一次性提 strict（沿用 V1 增量收紧）。
- 构建器 UI 视觉重设计（本计划只补安全与治理）。
- 依赖大版本升级的全面实施（A20 仅评估，实施另开分支）。