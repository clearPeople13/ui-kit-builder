# 并行任务治理手册（WORKFLOW）

多 agent / 多开发者在各自的 git worktree 里并行改同一份仓库。本手册约定怎么认领任务、
怎么判定"这块地归谁"、怎么收尾，避免改到同一文件、避免把构建产物当源码合入。

治理工具：`node scripts/task-claim.mjs`（零依赖，只用 node 内置模块）。

## 1. 角色与禁区

- **执行者（agent / 开发者）**：只在被认领的 owns 范围内改文件；不碰别人的 worktree；
  不提交派生产物（见 §4）；不直接动主树，除非自己就是整合者。
- **整合者**：唯一允许把分支合入主树、跑 `npm run quality`、做 git commit 的人。
- **禁区（任何角色都不可 own、不可提交）**：
  `sizes.json`、`ci-report.json`、`examples/consumer/src/demo/meta.json`、
  `coverage/`、`dist/`、`.build/`。这些是派生产物，合并后统一再生成（§4）。

## 2. 中央台账

- 台账在仓库根的 `.tasks/`（已 gitignore，本地状态不进仓库）：
  - `.tasks/active.json`：活跃认领，schema 为
    `version + tasks[id]{ owner, branch, worktree, owns, status, baseCommit, claimedAt, ttlMinutes }`。
  - `.tasks/history.jsonl`：追加式事件流（claim / status / release / gc），只增不改，供审计。
- 所有命令都认 `--root <path>`，默认取脚本所在仓库根；自己搭测试环境时用临时目录。

## 3. 所有权规则

- 所有权 = **相对仓库根的路径前缀**，目录以 `/` 结尾
  （如 `packages/ui-kit/src/components/button/`、`registry.mjs`）。
- 重叠 = 互为前缀且**按路径边界**判定：`a/` 与 `a/b.ts` 相交；`a/` 与 `ab/` 不相交。
- 先干跑后认领：

  ```bash
  node scripts/task-claim.mjs check --owns packages/ui-kit/src/components/button/
  ```

  退出 0 = 无重叠；1 = 相交，输出冲突任务 id 与相交路径。
- 一个任务的 owns 内部也不能自相重叠。

## 4. 派生产物：合并后再生成

- 上述禁区文件/目录**一律不可 own**；claim 时 owns 命中会被直接拒绝。
- 整合前用分支校验再拦一次：

  ```bash
  node scripts/task-claim.mjs verify-branch --id <id>
  ```

  它跑 `git diff --name-only <baseCommit>...HEAD`，分支 diff 混入派生产物则退出 1。
- 体积报告、demo meta、CI 报告、覆盖率：合入 main 之后由整合者统一
  `npm run build:all` / `npm run quality` 再生成，不进任何任务分支。

## 5. 分支 / worktree 生命周期

```bash
# 1. 建 worktree 与分支
git worktree add .worktrees/<id> -b feat/<id>

# 2. 认领（默认 ttl 180 分钟；base 默认取当前 HEAD）
node scripts/task-claim.mjs claim \
  --id <id> --owner <你> --branch feat/<id> \
  --owns packages/ui-kit/src/components/<comp>/ \
  --worktree .worktrees/<id>

# 3. 开发中按需迁移状态（running → integrating → done / aborted）
node scripts/task-claim.mjs status --id <id> --set integrating

# 4. 整合前校验分支 diff 不含派生产物
node scripts/task-claim.mjs verify-branch --id <id>

# 5. 整合者合入后归档
node scripts/task-claim.mjs release --id <id>            # 正常完成
node scripts/task-claim.mjs release --id <id> --status aborted
```

- 认领时 `baseCommit` 会记进台账，`verify-branch` 用它做三点 diff，
  所以**认领要在开发前做**，别把已经写了一半的分支拿来补认领。
- 随时查看：`node scripts/task-claim.mjs list [--json]`。

## 6. 失败 / stale claim 恢复

- **TTL 回收**：`node scripts/task-claim.mjs gc`。
  过期任务中，worktree 干净（`git status --porcelain` 为空）的自动按 aborted 归档；
  worktree 还有未提交改动的**置 aborted 但保留**，防止误丢工作，由人工确认后 release。
- **任务中途死掉**：任何人可用 `gc` + `list` 发现 stale claim；确认无活人后
  `release --id <id> --status aborted` 释放 owns，其他人即可重新认领。
- **history 是只追加的**：误操作不会抹掉记录，排查时先看
  `.tasks/history.jsonl`。

## 7. 命令速查

| 命令 | 作用 | 退出 1 的含义 |
| --- | --- | --- |
| `check --owns <p,...>` | 干跑重叠校验，不写台账 | 相交（打印冲突 id 与路径）或 owns 非法 |
| `claim --id --owner --branch --owns [--worktree] [--ttl 180] [--base]` | 校验后写台账 | 重叠或 id 已存在 |
| `status --id <id> --set running\|integrating\|done\|aborted` | 迁移状态并记 history | 任务不存在或状态非法 |
| `release --id <id> [--status done\|aborted]` | 归档并移出 active | 任务不存在 |
| `list [--json]` | 列活跃任务 | — |
| `gc` | TTL 回收（干净 release，脏 aborted 保留） | — |
| `verify-branch --id <id>` | 分支 diff 是否混入派生产物 | 混入 / git diff 失败 |
| `--root <path>` | 覆盖台账根（任意命令通用） | — |
| `--help` | 打印用法 | — |
