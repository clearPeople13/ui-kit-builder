# 后续执行计划（V3）：契约补齐、空壳收口与质量抬线

> 基线：`main@f83f0bf`（2026-11-08，`npm run quality` 十三段全绿，`ci-report.json` 无跳过阶段）。
> 本计划承接 `OPTIMIZATION_PLAN_V2.md` 的收尾欠账。V2 的 G0–G7 已全部落地或有明确决策记录，V3 只做三类事：**补契约、清空壳、抬质量**。
> 规则以 `RULES.md` 为准；命名查 `NAMING.md`；流程查 `WORKFLOW.md`；踩坑查 `KNOWLEDGE.md`。

## 1. 范围与非目标

### 1.1 范围

1. **Slot 契约铺量**：把有真实渲染点、消费方应该能自定义的 slot 接入 `spec.mjs → d.ts → meta.json → 调试台 API 表`。
2. **虚拟化空壳收口**：`cascader.virtualized` / `cascader-panel.virtualized` 真特性化，`transfer.virtualized` 删除或单独立项。
3. **a11y 白名单收敛**：把 axe serious / critical 白名单压到只剩主题色对比度这类外部项。
4. **覆盖率抬线**：补拖拽 / 测量类纯函数单测，把组件级下限从 21 / 33 / 21 逐步抬高。
5. **工程小项**：`ci:fast` 提速、NAMING 迁移表同步。

### 1.2 非目标

- 不新增门禁阶段；所有工作进现有十三段。
- 不做 20 套主题的逐组件像素回归（仍按 V2 §7 暂缓）。
- 不做发布链（A19）与 vitest 3→5 大跳（A20，任务 #23 单独立项）。
- 不为了“声明齐全”给没有渲染点的组件伪造 slot；要么先补渲染点，要么明确不提供。
- 不在任务分支提交 `sizes.json`、`demo/meta.json`、`dist/`、`.build/`、`coverage/`、`ci-report.json`。

## 2. 工作流总览

### 2.1 角色

| 角色 | 职责 |
| --- | --- |
| 整合者 | 唯一碰 `main`、跑全量门禁、登记 F 号、合并、刷新派生产物、更新文档口径 |
| 执行者 | 只在 claim 的 `owns` 范围内改文件；不 commit / push / npm install；完成后交回整合者 |
| 巡检 | 每批合并后跑 `verify:governance`，确认白名单、编号、文档口径没有被绕过 |

### 2.2 任务生命周期

```
planned → claimed → running → review → integrating → done
                         ↘ aborted（保留 worktree 与分支，人工确认后再清）
```

- 下发前：`node scripts/task-claim.mjs check --owns <路径>` 干跑无冲突。
- 认领：`node scripts/task-claim.mjs claim --id <id> --owner <你> --branch <branch> --owns <路径> --worktree .worktrees/<id>`。
- 合入前：`node scripts/task-claim.mjs verify-branch --id <id>` 确认 diff 没有派生产物。
- 合并后：`node scripts/task-claim.mjs release --id <id>` 归档。
- 失败：保留 worktree 与分支，状态置 `aborted`，不自动删脏工作。

### 2.3 分支 / worktree 规则

- 分支：`feat|fix|refactor|docs|test/<yyyyMMdd>-<slug>`。
- worktree：`.worktrees/<id>`；Node 模块用 junction 链主树，**禁止在 worktree 里 npm install**。
- 拆除：先 `cmd //c "dir /al"` 查 junction → 有链接先 `rmdir <链接>`（不带 `/s`）→ 再 `git worktree remove`。
- 合并：`git merge --ff-only`；非 ff 先 `git rebase main`，不 force push。

### 2.4 派生产物

`sizes.json`、`examples/consumer/src/demo/meta.json`、`ci-report.json`、`dist/`、`.build/`、`coverage/` 一律不进任务分支。合并后由整合者在 `main` 统一执行：

```bash
npm run build:all
npm run meta:demo
npm run quality
```

## 3. 工作分解（WBS）

| ID | 工作项 | 分支 | owns（写范围） | 依赖 | 交付与验收 | 量级 |
| --- | --- | --- | --- | --- | --- | --- |
| W0.1 | NAMING §5 迁移表同步 | `docs/20261108-naming-sync` | `NAMING.md` | 无 | 已完成行打勾；`verify:governance` 绿 | S |
| W1.1 | Slot 盘点与守卫基线 | `refactor/20261108-slot-audit` | `tests/build/slot-contract.spec.ts` | W0.1 可并行 | 盘点表进计划附录；守卫对“公开导出有渲染点但无声明”会红，先带 BASELINE + 理由 | S/M |
| W1.2a | 信息展示族 slot 声明 | `refactor/20261108-slot-info` | `alert`、`card`、`badge`、`breadcrumb`、`descriptions`、`timeline`、`statistic`、`watermark` 及对应 `tests/components/*.spec.ts` | W1.1 | 每个声明的 slot 有渲染用例；d.ts / meta / API 表同步 | M |
| W1.2b | 数据族 slot 声明 | `refactor/20261108-slot-data` | `table`、`select`、`form`、`pagination`、`switch` 及对应用例 | W1.1 | `table.empty`、`TableColumn.default/header`、`Option/OptionGroup.default`、`form.label/default`、`pagination.default`、`switch.default` 进契约 | M |
| W1.2c | 导航族 slot 声明 | `refactor/20261108-slot-nav` | `menu`、`page-header`、`steps` 及对应用例 | W1.1 | `menu.default/title`、`page-header.title/content/extra/default`、`steps.title/description/default` 进契约 | M |
| W1.2d | 反馈族 slot 声明 | `refactor/20261108-slot-feedback` | `popconfirm`、`popover`、`dropdown`、`tooltip`、`empty`、`result`、`tour`、`image-viewer`、`notification` 及对应用例 | W1.1 | `content/default/dropdown/icon/header/footer` 按真实渲染点声明 | M |
| W1.2e | 基础族 slot 声明 | `refactor/20261108-slot-base` | `icon`、`avatar`、`affix`、`anchor`、`backtop`、`carousel`、`check-tag`、`collapse`、`container`、`divider`、`skeleton`、`space`、`splitter`、`scrollbar`、`virtual-list`、`col`、`row`、`config-provider`、`overlay`、`link`、`text`、`tag`、`tabs`、`breadcrumb`、`descriptions` 及对应用例 | W1.1 | `virtual-list.default` 带 `{ item, index }` 作用域；A 类声明，C/D 类在 BASELINE 保留理由；`button/button-group` 子导出不在扫描集 | M |
| W1.3a | input 族追加插槽 | `feat/20261108-input-slots` | `shared/behavior.ts`（inputConfig）、`input`、`autocomplete`、`mention` 及对应用例 | W1.2a–d 之后（shared 串行） | `prefix/suffix/prepend` 与 clearable/password/word-limit 共存；`append` 保持 | M/L |
| W1.3b | dialog / drawer close slot | `feat/20261108-overlay-close-slot` | `shared/behavior.ts`（overlayConfig）、`dialog`、`drawer` 及对应用例 | W1.3a（shared 串行） | `close` 可替换关闭按钮；焦点闭环与 a11y 不回归 | M |
| W1.3c | upload 插槽补全 | `feat/20261108-upload-slots` | `upload` 及对应用例 | W1.1 | `trigger` / `hint` / `file-item` 至少补齐触发区与文件项，作用域字段写清 | M |
| W1.3d | tree 自定义节点 | `feat/20261108-tree-node-slot` | `tree` 及对应用例 | W1.1 | 自定义节点作用域至少含 `node/data/level`；键盘与展开语义不回归 | M |
| W2.1 | cascader / cascader-panel 虚拟特性化 | `refactor/20261108-cascader-virtualized` | `cascader`、`cascader-panel`、`shared/virtual-window.ts` 只读复用 | W1.1 | 窗口实现搬进 `features/virtualized/`；边际体积脱离 240B 量级；守卫移出 `SHELL_VIRTUAL_FEATURES` | M/L |
| W2.2 | transfer.virtualized 处置 | `refactor/20261108-transfer-virtualized` | `transfer`、`scripts/verify-governance.mjs`、`README.md`、`KNOWLEDGE.md`、`REQUIREMENTS.md` | 决策记录 | 已定：删除特性，清空 spec / 守卫 / 文档引用（REQUIREMENTS §25.4） | S/M |
| W3.1 | 触发器可访问名 | `fix/20261108-a11y-names` | `shared/behavior.ts`（triggerConfig）、`cascader`、`color-picker`、`rate`、`select`、`tests/browser/axe.spec.ts` | W1.3a/b | `aria-command-name` / `aria-input-field-name` 白名单条目可删 | M |
| W3.2 | role / aria / 滚动可达 | `fix/20261108-a11y-roles` | `shared/behavior.ts`、`dropdown`、`popover`、`table`、`tests/browser/axe.spec.ts` | W3.1 | 收掉 `aria-allowed-attr`、`aria-required-children`、`aria-tooltip-name`、`scrollable-region-focusable` | M |
| W3.3 | 纯图标按钮可访问名 | `fix/20261108-a11y-icon-buttons` | `calendar`、`carousel`、`collapse`、`transfer`、`shared/config.ts`（locale 文案）及浏览器用例 | W3.1 | `button-name` 白名单条目可删；文案走 locale | M |
| W4.1 | 拖拽 / 测量纯函数抽取与单测 | `test/20261108-coverage-drag` | `tree`、`drawer`、`table`、`splitter` 的纯函数与对应 `tests/components/*.spec.ts` | W2、W3 | 纯函数边界用例覆盖最小/最大/反向/越界/卸载 | M |
| W4.2 | 覆盖率下限抬升 | `test/20261108-coverage-floor` | `vitest.coverage.config.ts`、`REQUIREMENTS.md`（口径） | W4.1 | 组件级 21/33/21 → 30/40/30，稳定后再议；不引入 flaky | S |
| W5.1 | ci:fast 提速 | `perf/20261108-ci-fast` | `package.json`、`scripts/ci.mjs`、`.githooks/**` | 无 | 直调本地二进制，目标 15s+ → 10s 内；门禁入口不变 | S |

> 量级：S ≈ 0.5 天内，M ≈ 1–2 天，L ≈ 3 天以上。实际以会话产出与门禁结果为准。

## 4. 调度车道与并发上限

### 4.1 车道划分

| 车道 | 任务 | 说明 |
| --- | --- | --- |
| D · 文档 / 整合 | W0.1、文档口径、派生产物 | 整合者独占，不与其他写者并行 |
| S · 共享基座 | W1.3a → W1.3b → W3.1 → W3.2 | 都碰 `shared/behavior.ts`，必须串行；改完再放组件侧 |
| A · 信息展示 | W1.2a、W1.2e | 组件与用例路径不相交 |
| B · 数据 | W1.2b | 单独车道，避免 table/select 争用 |
| C · 导航 | W1.2c | 单独车道 |
| E · 反馈 | W1.2d | 单独车道 |
| F · 浮层能力 | W1.3c、W1.3d、W2.1、W2.2 | 按组件所有权分发；cascader 与 transfer 不并行到同一人 |
| G · 质量 | W3.3、W4.1、W4.2、W5.1 | W3.3 可与 W3.1 并行；W4 必须等 W2/W3 稳定 |

### 4.2 并发节奏

- **第 1 波（已完成）**：W0.1（`cedb99f`）+ W1.1（`a9fc051`）。55 条公开 slot 缺口已登记，双向守卫已生效。
- **第 2 波（已完成）**：W1.2a、W1.2b、W1.2c、W1.2d 四路并行合入，23 条 BASELINE 缺口清空。
- **第 4 波（当前）**：W2.2 已删除 transfer 空壳；W2.1 cascader / cascader-panel 特性化待启动。
- **第 4 波（已完成）**：W2.2 删除 transfer 空壳；W3.1 / W3.2 / W3.3 一次性收口并通过 6 个 axe 场景。
- **第 5 波（已完成）**：W2.1 / W4 / W5.1 全部并入；计划内批次收口。

> 历史教训：单个 agent 超过 12–16 文件或同时跨多个共享文件，产出会明显下降；本计划按组件族拆，不按“大而全”拆。

### 4.3 依赖图

```
W0.1 ─────────────────────────────────────────────┐
                                                   │
W1.1 ──┬── W1.2a ──┐                               │
       ├── W1.2b ──┤                               │
       ├── W1.2c ──┤                               │
       ├── W1.2d ──┤                               │
       ├── W1.2e ──┤                               │
       ├── W1.3c ──┤                               │
       ├── W1.3d ──┤                               │
       └── W2.1 ───┤                               │
                    ├── W1.3a → W1.3b → W3.1 → W3.2 ── W3.3
                    ├── W2.2
                    └── W4.1 → W4.2
W5.1 ───────────────────────────────────────────────┘
```

## 5. 各阶段执行细则

### W0.1 · NAMING 迁移表同步

- 把已完成的 4 行打勾：dialog 系 `modelValue`、checkbox / check-tag 双写口、8 组件 size 类名、alert `is-closable`。
- 补第三刀完成说明；不改规则正文。
- 验收：`npm run verify:governance` 绿；diff 仅 `NAMING.md`。

### W1.1 · Slot 盘点与守卫基线

- 盘点口径：`registry.mjs` 的导出 + 组件目录内 `slots.*` / `renderSlot()` 静态扫描。
- 分类：
  - **A 公开可自定义**：消费方应该能替换内容，必须进契约。
  - **B 需要新渲染点**：当前只有 props，需要先做功能。
  - **C 结构性子节点**：`default` 只是子组件容器（tabs / menu / splitter 等），可声明但低优先。
  - **D 内部件**：`collection` / `slot` / `roving-focus-group` 等，不对外承诺。
- 守卫：在 `tests/build/slot-contract.spec.ts` 增加“公开导出有渲染点但无声明”检查；先带 BASELINE（写明 C/D 类理由），后续波次逐条清空。
- 验收：守卫自测证明会咬人；BASELINE 无裸条目；附录盘点表与源码一致。

### W1.2a–e · 纯声明铺量

- 只声明已有渲染点的 slot，不改 DOM；每加一个声明，同步 d.ts、meta、demo API 表。
- 每个组件至少一条渲染用例：传入自定义内容，断言渲染结果，不再回退 props 文本。
- 不在本批声明 B 类（input prefix 等），避免“声明了但没实现”。

### W1.3a–d · 新增渲染点

- 每个任务先定作用域字段，再写渲染，再补样式与键盘 / a11y。
- input 族：`prefix` / `suffix` / `prepend` 必须与 `clearable`、`password`、`word-limit`、`suffixIcon` 共存；`append` 保持现状。
- overlay close：复用 `overlayConfig` 的关闭按钮出口，不另造第二套；焦点闭环与 Escape 语义不回归。
- upload：至少 `trigger` + `file-item`；文件项作用域需含 `file` / `index` / `remove`。
- tree：自定义节点作用域至少 `node` / `data` / `level`；展开、选中、键盘漫游不回归。

### W2.1 · cascader / cascader-panel 虚拟特性化

- 参照 `select.select-virtualized` 的 `featureHook` 模式：core 只留扩展点，窗口渲染与滚动跟随进 feature。
- 未选特性时产物里不得出现 `VirtualList` / 窗口节点；用 `sizes.json` 边际值与产物 grep 双重自证。
- 验收：边际体积脱离 240B 量级；治理守卫把两项移出 `SHELL_VIRTUAL_FEATURES`；开关关闭与分组回退行为不变。

### W2.2 · transfer.virtualized 处置

- 推荐：删除特性（当前零实现，双列表虚拟化属于新功能，不是还债）。
- 若选择实现：单独开 `feat/` 分支，按新功能评估，不混入本计划收口批次。
- 验收：全库无空壳引用；治理白名单同步；文档口径同步。

### W3.1–3.3 · a11y 白名单收敛

- 顺序：先补可访问名，再统一 role / aria，再处理图标按钮；每步只删对应白名单条目。
- `triggerConfig` 的 `ariaHaspopup` / `ariaExpanded` 输出要按 role 匹配，不允许把 `aria-expanded` 挂在任意 div 上。
- 图标按钮文案优先走 locale，其次显式 prop；默认中文不变。
- 验收：6 个 axe 场景无未登记 serious / critical；白名单只剩 `color-contrast`（若不改主题）并写明理由。

### W4.1–4.2 · 覆盖率抬线

- 先把 `tree/features/draggable`、`drawer/features/draggable`、`table/features/resize`、`splitter` 的纯计算抽成可测函数。
- 补最小/最大、反向拖拽、滚动越界、卸载清理四类边界。
- 阈值逐步抬：21/33/21 → 30/40/30；每次抬线单独提交，失败可单独回滚。
- 验收：`npm run test:coverage` 绿；阈值变化写进 REQUIREMENTS；无 flaky。

### W5.1 · ci:fast 提速

- 只改 pre-commit 内部实现，不新增门禁入口；直调本地 `tsc` / `eslint` / `prettier` 二进制。
- 验收：`npm run ci:fast` 目标 10s 内；失败退出码与阶段结论不变。

## 6. 门禁与基线

| 时点 | 命令 | 说明 |
| --- | --- | --- |
| 下发前 | `node scripts/task-claim.mjs check --owns ...` | 所有权无重叠 |
| 开发中 | `npm run ci:plan` / `npm run ci:changed` | 只跑受影响阶段 |
| 提交前 | `npm run typecheck` / `npm run lint` / 对应层用例 | 执行者自检 |
| 合入前 | `npm run quality` | 十三段全绿，唯一门禁 |
| 合并后 | `npm run build:all && npm run meta:demo && npm run quality` | 刷新派生产物 |
| 视觉变更 | `npm run snap:layout` / `npm run snap:pixels` | 只在 DOM / 样式变更后重录 |

## 7. 决策记录

| 决策点 | 结论 | 状态 |
| --- | --- | --- |
| 虚拟化空壳 | cascader / cascader-panel 真特性化；transfer 删除特性 | 已定：transfer 已删除（W2.2）；cascader 待 W2.1 |
| Slot 范围 | 只声明有渲染点的公开 slot；C/D 类登记理由，不伪造 | 已定 |
| a11y 对比度 | 本计划不动主题令牌，`color-contrast` 保留白名单 | 已定 |
| 发布链 / vitest 升级 | 沿用 V2：延后，单独立项 | 已定 |
| 并发上限 | 最多 4 个执行者 + 1 个整合者 | 已定 |

## 8. 风险与回滚

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| Slot 声明与渲染点脱钩 | d.ts / API 表撒谎 | W1.1 守卫 + 每组件渲染用例 + `slot-contract` 双向校验 |
| shared/behavior.ts 多任务争用 | 覆盖、冲突 | 共享车道严格串行，组件任务不碰 shared |
| 虚拟化特性化回归 | 滚动 / 键盘 / 分组行为变化 | 先补行为用例，再搬代码；边际体积与产物 grep 双证 |
| axe 修复改 DOM | 布局 / 像素基线漂移 | 改完按需重录基线，PR 说明原因 |
| 覆盖率抬线引入 flaky | 门禁不稳 | 逐步抬线，每次单独提交；flaky 立即回退 |
| worktree junction 误删 | 穿进主树 node_modules | 拆除前 `dir /al`，先删链接再 `git worktree remove` |

回滚：每批一个合并点；回归直接 revert 该批合并提交，不改历史。

## 9. 调度看板

> 状态以 `.tasks/active.json` 与 `node scripts/task-claim.mjs list` 为准；本表只做人类可读视图。

| ID | 状态 | claim id | 分支 | worktree | 备注 |
| --- | --- | --- | --- | --- | --- |
| W0.1 | done | w0-naming-sync | `docs/20261108-naming-sync` | `.worktrees/naming-sync` | 已合入 `cedb99f`，治理绿 |
| W1.1 | done | w1-slot-audit | `refactor/20261108-slot-audit` | `.worktrees/slot-audit` | 已合入 `a9fc051`，55 条缺口双向守卫，全量门禁绿 |
| W1.2a | done | w12a-slot-info | `refactor/20261108-slot-info` | `.worktrees/slot-info` | 已合入 `20940fd`；6 组件 / 99 用例 |
| W1.2b | done | w12b-slot-data | `refactor/20261108-slot-data` | `.worktrees/slot-data` | 已合入 `aa4bdb3`；5 组件 / 138 用例 |
| W1.2c | done | w12c-slot-nav | `refactor/20261108-slot-nav` | `.worktrees/slot-nav` | 已合入 `50fc798`；3 组件 / 63 用例 |
| W1.2d | done | w12d-slot-feedback | `refactor/20261108-slot-feedback` | `.worktrees/slot-feedback` | 已合入 `0728d6d`；9 组件 / 173 用例 |
| W1.2e | done | w12e-slot-base | `refactor/20261108-slot-base` | `.worktrees/slot-base` | 已合入 `57be1cf`；7 个 A 类组件，101 条用例，C/D 保留台账理由 |
| W1.3a | done | w13a-input-slots | `feat/20261108-input-slots` | `.worktrees/input-slots` | 已合入 `531496e`；input 四插槽 + autocomplete/mention append，62 条用例 |
| W1.3b | done | w13b-overlay-close | `feat/20261108-overlay-close-slot` | `.worktrees/overlay-close` | 已合入 `181bbe4` + `06c563e`；dialog/drawer/image-viewer/notification 四件套 close 插槽，86 条用例 |
| W1.3c | done | w13c-upload-slots | `feat/20261108-upload-slots` | `.worktrees/upload-slots` | 已合入 `d564cd1`；trigger / hint / file-item（作用域 file/index/remove），21 条用例 |
| W1.3d | done | w13d-tree-node | `feat/20261108-tree-node-slot` | `.worktrees/tree-node-slot` | 已合入 `70626e7`；default 节点插槽（node/data/level），优先于 renderContent |
| W2.1 | done | w21-cascader-virt | `refactor/20261108-cascader-virtualized` | `.worktrees/cascader-virt` | 已合入 `332a675` + `7259f0e`；JS 与虚拟 CSS 均特性化，js+css 边际 240B/258B → 2398B/1735B |
| W2.2 | done | w22-transfer-virtualized | `refactor/20261108-transfer-virtualized` | `.worktrees/transfer-virtualized` | 已删除零实现特性、白名单与文档同步；README 特性数 175→174 |
| W3.1 | done | w31-a11y-names | `fix/20261108-a11y-names` | `.worktrees/a11y` | 触发器 / 输入默认可访问名，`aria-command-name` / `aria-input-field-name` 白名单已删 |
| W3.2 | done | w31-a11y-names | `fix/20261108-a11y-names` | `.worktrees/a11y` | 空数据级联列、TreeV2 空态、Tooltip/Popper 名称、Table 滚动可达收口 |
| W3.3 | done | w31-a11y-names | `fix/20261108-a11y-names` | `.worktrees/a11y` | 日历 / 轮播 / 折叠 / 穿梭图标按钮补 `aria-label` |
| W4.1 | done | w4-coverage | `test/20261108-coverage` | `.worktrees/coverage` | 已合入 `5f3a2ad`；37 条边界用例，四个目标文件 lines 均 ≥89% |
| W4.2 | done | w4-coverage | `test/20261108-coverage` | `.worktrees/coverage` | 组件级下限 7/0/7 → 30/40/30；W4b 再开 `perFile` 并补齐低覆盖文件，全量 88.8/80.29/93.53/88.8 |
| W5.1 | done | w51-ci-fast | `perf/20261108-ci-fast` | `.worktrees/ci-fast` | 已合入 `d61d545`；fast 五段并行，实测 5.7s（15s+ → 5.7s） |

## 10. 完成定义（DoD）

- 所有 W1.2 声明都有真实渲染点、渲染用例、d.ts、meta、API 表五处一致。
- W1.3 新增插槽有作用域说明、键盘 / a11y 不回归、视觉基线按需重录。
- 虚拟化空壳为 0：`SHELL_VIRTUAL_FEATURES` 只剩有书面理由的延后项，新增空壳被守卫拦下。
- axe 白名单只剩主题色对比度或明确外部项，且每条带理由。
- 覆盖率下限抬升有记录，`test:coverage` 稳定。
- 每批 `npm run quality` 十三段全绿；派生产物只在 `main` 刷新。
- README / KNOWLEDGE / REQUIREMENTS / NAMING 口径同步；新增缺陷 F-114 起连续登记。

## 附录 A · Slot 盘点（2026-11-08 静态扫描，W1.1 校正）

> 口径：`registry.mjs` 导出 + `core.ts` / `features` / `core.ts` 从 shared 引入的 `*Config` 函数体中的 `slots.*` / `renderSlot()`。
> 子导出目录（如 `button/button-group`）不在扫描集内，故不进台账。
> 结果：**61 个组件涉及 slot**，其中 6 个已声明，55 个有渲染点但未进 spec，全部登记在
> `tests/build/slot-contract.spec.ts` 的 `SLOT_DECLARATION_BASELINE`；双向守卫保证「补完要删、新增要登记」。

| 组件 | 已声明 | 检测到的 slot | 分类 / 排期 |
| --- | --- | --- | --- |
| alert | — | default, title | A（W1.2a） |
| badge | — | default | A（W1.2a） |
| card | — | cover, default, footer, header | A（W1.2a） |
| statistic | — | default | A（W1.2a） |
| timeline | — | default | A（W1.2a） |
| watermark | — | default | A（W1.2a） |
| form | — | default, label | A（label，W1.2b）/ C（default 字段容器） |
| pagination | — | default | A（额外内容，W1.2b 评估） |
| select | — | default | A（Option / OptionGroup，W1.2b） |
| switch | — | default | A（label 自定义，W1.2b） |
| table | — | default, empty, header | A（empty，W1.2b）/ C（default、header 属列） |
| menu | — | default, title | A（title，W1.2c）/ C（default 子项） |
| page-header | — | content, default, extra, title | A（W1.2c） |
| steps | — | default, description, title | A（W1.2c） |
| dropdown | — | content, default, dropdown | A（W1.2d；default 为触发器内容） |
| empty | — | default | A（W1.2d） |
| image-viewer | — | default, footer, header | A（W1.2d） |
| notification | — | default, footer, header | A（W1.2d） |
| popconfirm | — | content, default | A（W1.2d；default 为触发器内容） |
| popover | — | content, default | A（W1.2d；default 为触发器内容） |
| result | — | default, icon | A（W1.2d） |
| tooltip | — | default | A（W1.2d） |
| tour | — | default, footer, header | A（W1.2d） |
| affix | — | default | C（children 容器） |
| anchor | — | default | C（children 容器） |
| avatar | — | default | A（W1.2e） |
| backtop | — | default | A（W1.2e） |
| breadcrumb | — | default | C（子项容器） |
| carousel | — | default | C（子项容器） |
| check-tag | — | default | A（W1.2e） |
| col | — | default | C（children 容器） |
| collapse | — | default | C（子项容器） |
| config-provider | — | default | C（children 容器） |
| container | — | default | C（children 容器） |
| descriptions | — | default | C（子项容器） |
| divider | — | default | A（W1.2e） |
| icon | — | default | A（W1.2e） |
| link | — | default | C（文本内容容器） |
| overlay | — | default | C（内部浮层包装） |
| row | — | default | C（children 容器） |
| scrollbar | — | default | C（children 容器） |
| skeleton | — | default | A（W1.2e） |
| space | — | default | C（children 容器） |
| splitter | — | default | C（面板容器） |
| tabs | — | default | C（页签容器） |
| tag | — | default | C（文本内容容器） |
| text | — | default | C（文本内容容器） |
| virtual-list | — | default | A（W1.2e，`{ item, index }`） |
| autocomplete | — | append | A（W1.3a，与 input 同步） |
| mention | — | append | A（W1.3a，与 input 同步） |
| collapse-transition | — | default | D（内部过渡件） |
| collection | — | default | D（内部件） |
| popper | — | default | D（内部浮层容器） |
| roving-focus-group | — | default | D（内部件） |
| slot | — | default | D（内部件） |
| dialog | default, footer, header | — | 已完成 |
| drawer | default, footer, header | — | 已完成 |
| input | append | — | 已完成；prefix / suffix / prepend 待 W1.3a |
| checkbox | default | — | 已完成 |
| radio | default | — | 已完成 |
| upload | default | — | 已完成；trigger / hint / file-item 待 W1.3c |

## 附录 B · 批次启动清单

1. ~~认领 W0.1、W1.1，建 `.worktrees/naming-sync`、`.worktrees/slot-audit`。~~ ✅ 已完成。
2. ~~W1.1 产出分类结果回填附录 A，并把守卫 BASELINE 写清楚。~~ ✅ 55 条缺口已进 `SLOT_DECLARATION_BASELINE`。
3. 释放 W1.2a–d 四个车道，按 §4.2 第 2 波并行；W1.2e 可同时启动。
4. 每个执行者交付格式：改了哪些文件、跑了哪些命令、结果、未决问题；不 commit / push / install。
5. 整合者按 §6 合并、刷新产物、更新台账与文档口径。
6. **W1.2 执行约定**：只声明已有渲染点的 slot；每声明一个，删除 `SLOT_DECLARATION_BASELINE` 对应条目，守卫会在漏删时报红。C/D 类若本批不铺，保留条目不删。
