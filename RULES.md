# 项目总规则（RULES）

> 本文件是唯一权威规则集。换 IDE、换机器、换 agent，规矩不变。
> 细则手册：`NAMING.md`（命名）、`WORKFLOW.md`（并行治理工具）、`KNOWLEDGE.md`（踩坑）。
> 规则冲突时以本文件 + 守卫用例为准；守卫红 = 规则红，不许绕。

## 0. 总则

1. **单一来源**：同类语义全库只有一个出口（一个词、一个实现、一份清单）。发现第二个就收敛或登记。
2. **守卫机械化**：每一类 recurring 缺陷必须有静态/契约守卫，且守卫要先用"改前代码"反证非空转，才允许合入。
3. **门禁即法律**：`npm run quality` 13 段全绿才算完。守卫红、口径错、产物脏都是红。
4. **派生产物不进分支**：`sizes.json`、`demo/meta.json`、`ci-report.json`、`dist/`、`.build/`、`coverage/` 只在 main 上由整合者统一再生成。
5. **编号即台账**：每修一个缺陷登记 F-x，README / KNOWLEDGE / REQUIREMENTS 三处口径同步。口径行写法固定为「共记录 N 条缺陷（F-1…F-N）」，治理脚本按正则校验。

## 1. 注释规范（最严）

**默认不写注释。** 命名已经说了 what，注释只说 why。

### 1.1 可以写（且只写这些）

- **隐藏约束**：不写出来读者一定会踩坑的（例：`// Boolean prop 必须显式 default: undefined，否则 Vue 归一化成 false，受控/非受控无法区分`）。
- **反直觉不变量**：代码看起来是 A 其实是 B（例：`// 缺了这一行面板就是 static，宿主写的 left/top 全都不生效`）。
- **特定 bug 的 workaround**：外部行为导致不能直接修（例：`// F-12 回归：空标题不再占一行高度`——仅测试文件允许带 F 号；源码注释保持纯 why）。
- **会惊讶读者的行为**：静态扫描看不出来的语义（例：`// 受控态下交互都不允许改写展开态，只由 visible 取值决定`）。

### 1.2 禁止写

- **复述代码**：`// 清空计时器` 盖在 `clearTimers()` 上、`//  emit('show')` 这类签名复读。
- **文档块**：JSDoc/param/return/@deprecated 块注释。解释写在 NAMING.md / spec.mjs，不写在代码里。
- **多行块**：一条注释一行，上限一行；写不下说明该抽函数或不该写。唯一例外：测试文件顶部契约头——一个文件最多一块，说明被测对象与红线（如守卫模式的判定依据）；逐用例的解释写进用例名，不再另加注释。
- **改码历史**：`// 2026-11 新增`、`// A25 改`、`// 原为 xxx`。历史在 git log 和 REQUIREMENTS.md。
- **占位与分隔线**：`// =====` `// TODO 待优化` `// ...` 一律不留；TODO 要么现在做，要么登记 F-x。
- **废话**：`// 注意`、`// 这里很重要`、空注释行。
- **英文注释**：全库中文。

### 1.3 判定口诀

> 删掉这句注释，下一个人会不会误判或踩坑？不会就删。会就留，并压到一行。

## 2. 命名规范

全量语义字典见 `NAMING.md §2/§3`，机器守卫 `tests/build/naming-guard.spec.ts`（6 模式，BASELINE 已清空）。硬规则：

1. **一个语义一个词**：受控显示 = `modelValue`（+`update:modelValue`）；禁用 = `disabled`；可清空 = `clearable`；显示子元素 = `showXxx`。
2. **布尔 prop = 形容词/分词**：`disabled/readonly/checked/collapsed/expanded/spinning/draggable`。动词原形禁止。
3. **状态事件 = `xxx-change`**：带布尔或 (index, opened) 载荷；裸 `show/hide/open` 禁止。`close` 动作义保留，状态义 `close-change`（第三刀）。
4. **事件全库 kebab-case**；`update:` 后的 v-model 参数按 Vue 惯例允许 camelCase。
5. **一个组件一个 v-model 写口**：附加受控态 = 普通 prop + `xxx-change` 事件。
6. **DOM 词不外泄**：对外 `focus/blur`，不是 `focusin/focusout`。
7. **内部 ref 随意，对外接口守公约**：`open` 作内部变量名可以，作 prop/事件名禁止。
8. **类名**：组件 `ui-<组件>`，元素 `__`，外观变体 `--<type>`，状态 `is-<状态>`，尺寸 `--size-<值>`（唯一词形，见 A22）。

## 3. 编码风格

### 3.1 工具链（不可改）

- TS 5.9 + Vue 3.5 + Vite 7 + Vitest 3.2。Node ≥ 22。
- prettier（单引号、无分号、宽 120、无尾逗号、LF）；`.editorconfig` / `.gitattributes` 已入库，IDE 不许自带第二套格式。
- eslint = `typescript-eslint` recommended；`no-explicit-any` 关（存量 600+ 处渐进收紧，新代码尽量不用 any、`as any` 禁止新增）。
- 未用变量报红；刻意不用的参数加 `_` 前缀。

### 3.2 组件写法（三轨已收敛为一轨）

- **一律走基座** `createUiComponent`（`shared/component.ts`）+ 配置工厂 `wrapperConfig/triggerConfig/checkboxConfig`（`shared/behavior.ts`）。
- 禁止手写 `defineComponent` 自铺 render 管线；豁免清单（table/scrollbar/roving-focus-group/collection/collapse-transition/slot，带理由）在 `tests/build/writing-convergence.spec.ts`，未豁免即红。
- 组件目录：`core.ts`（props/emits/setup/渲染）+ `core.css` + `spec.mjs` + `features/<特性id>/index.ts`（可裁剪特性）。特性 id = `<组件>.<特性>`。
- 浮层交互（hover 延迟、受控 visible、外点关闭、autoClose）必须用 `triggerConfig`，禁止自造。
- Boolean 受控 prop 必须 `default: undefined`（Vue 缺省归一化 false 会让受控/非受控不分）。
- 事件必须进 `emits` 声明：未声明的监听器落 attrs 形成双通道（F-88 类）。
- 错误处理：构建/门禁脚本用显式 Error + try-catch，静默 catch 禁止；运行时组件不吞异常。

### 3.3 颗粒化 / 单一化

- 一个文件一个职责：core.ts 只放该组件；可裁剪逻辑进 features/，不堆在 core。
- 一个函数一件事，超一屏考虑拆；早返回优先于深嵌套。
- 同类逻辑只许一份（normalizeOptions、size-class、图标渲染 renderIcon、尺寸换算 sizeValue 都在 shared）。
- 不加"以防万一"的兼容层、feature flag、防御系统内部参数的校验——只在系统边界（用户输入、外部 API）校验。

## 4. UI / CSS 风格

1. **结构**：`ui-<组件>` > `__<元素>`，`--<变体>`；状态一律 `is-*`，尺寸一律 `--size-*`，外观变体（type/effect）用 `--*`。三词性分开（NAMING.md §4）。
2. **主题**：颜色/圆角/阴影走 CSS 自定义属性（令牌在 profile 构建时落盘），组件里不写字面色值。
3. **浮层**：gpu 加速 `transform: translateZ(0)` 走基座 `gpuAcceleration`（默认开）；定位 `position: absolute|fixed` 由 `strategy` 决定，面板必须显式定位否则宿主坐标全失效。
4. **可访问性**：交互元素有 role/aria（aria-expanded 跟 expanded prop 走）；焦点环、键盘可达是契约不是增强。
5. **演示台即验收面**：`examples/consumer` 的场景切换、重表格交互必须保持快（大表 eager 加载、深拷贝已清，回归即红）。

## 5. 测试用例怎么写

五层各管一段，不许越层：

| 层 | 配置 | 管什么 |
| --- | --- | --- |
| 组件 | `vitest.config.ts` | 单组件行为：渲染、props/emits 断言、fake timers 交互。95 文件 1609 用例 |
| 构建契约 | `vitest.build.config.ts` | 产物体积/类型/裁剪/主题令牌 + 全部静态守卫（naming-guard、writing-convergence、size-class、test-impact…） |
| 浏览器 | `vitest.browser.config.ts` | 真渲染：定位、像素、键盘、axe wcag2a/aa。文件名必须含组件 id（`button-focus-trap.spec.ts`），否则治理段当红 |
| profile 运行时 | `vitest.profiles.config.ts` | 20 份产物逐个真挂载、前缀隔离、结构同构 |
| 覆盖率 | `vitest.coverage.config.ts` | 同批组件用例在源码入口重放；全局阈值 88/84/89/88 |

规矩：

1. **命名**：`tests/components/<组件id>.spec.ts`，describe 用中文组件名。
2. **新缺陷 = 回归用例收尾**：先写红用例 → 修复 → 绿 → 登记 F-x。不许"修完补个用例意思一下"。
3. **守卫必须非空转**：新扫描守卫合入前，用改前代码跑一遍证明会红（留证据在 REQUIREMENTS 波次节）。
4. **断言语义要真**：别把"没有 close 事件"写成"事件数组为空"——事件改名单后这类断言是最常见的假绿源（A25 波次踩过 4 处）。
5. **浏览器用例必须真跑过再提交**：focus-trap 断言语义写错（缺 loop）就是没跑就提交的下场（gate 第六刀）。
6. 不 mock 被测组件本身；fake timers 用完 `vi.useRealTimers()` 习惯成自然（成对出现）。
7. 缺陷编号引用写在测试标题或头注释（`F-12 回归：…`），源码注释不带 F 号。

## 6. git 怎么提交

1. **分支**：`refactor/<yyyyMMdd>-<slug>` / `feat/` / `fix/`；worktree 在 `.worktrees/<id>`，Node 模块用 junction 链主树，**禁止在 worktree 里 `npm install`**。
2. **commit 格式**：`<type>: <中文一句话>（F-x）`，type ∈ feat/fix/refactor/test/docs/chore/style/perf。body 写 why 不写 what。
3. **合流**：`git merge --ff-only`；多分支各在自家 worktree rebase main 再 ff。rebase 冲突优先手工解，不许 `--force`。
4. **产物提交**：全量门禁绿后由整合者单独一个 `chore: 合并后刷新派生产物` 提交。
5. **钩子**：pre-commit 跑快门（format/typecheck/lint/verify/governance），pre-push 跑全量 13 段（约 9 分钟，推一次验一次）。**永不 `--no-verify`**。
6. **推送**：`git -c http.proxy= -c https.proxy= push origin main`；推完 `git ls-remote origin main` 对哈希，对上才算完。后台命令**绝不接管道**（管道吃掉退出码，失败会报成成功）。
7. **worktree 拆除铁律**：先 `cmd //c "dir /al"` 确认无 `<JUNCTION>` → 有 junction 先 `rmdir <链接>`（不带 /s）→ 再 `git worktree remove`。`rmdir /s /q` 碰 junction 会穿进主树 node_modules，已经炸过一次。

## 7. agent 任务分配

1. **台账先行**：`node scripts/task-claim.mjs check --owns <路径>` 干跑无冲突再 claim；owns = 路径前缀，按路径边界判重叠。细则全在 `WORKFLOW.md`。
2. **所有权不相交**：一个 agent 一批组件，组件与 `tests/components/<id>.spec.ts` 一一对应，两人同领必互相覆盖。
3. **粒度**：一个 agent 12–16 文件 / 一个内聚修复集。更大的拆。agent 不是越大越好——9 组件×4 修复的 agent 6 分钟零产出。
4. **agent 禁区**：不 git commit/push、不 npm install、不改源码/配置/文档（让它写 spec 就只写 spec）、发现疑似缺陷写 `it.skip('【疑似缺陷 F-x】…')` 上报，由主 agent 在 fix 分支修。
5. **失联判定**：transcript 一两百字节 + `git -C <wt> status --short` 长时间为空 + 无任何通知 = 开机即死，别再等，自己接手或重派。完成通知可能丢失，交付物一律直接验盘。
6. **整合者唯一**：只有整合者碰 main、跑全量门禁、登记 F 号、删探针文件（`_probe_*` / `debug-*`）。
7. **worktree 提交绕过钩子**（`-c core.hooksPath=/dev/null`）：worktree 的 dist 是残的，pre-commit 的 verify 必假红；权威检查 = main 上一次全量门禁。

## 8. 语义化 / 出口收敛清单

凡以下同类，一律单出口（新增第二份 = 守卫红或登记迁移）：

| 语义 | 唯一出口 |
| --- | --- |
| 组件实例 | `createUiComponent`（+ writing-convergence 守卫） |
| 浮层交互 | `triggerConfig` |
| 包装组件 | `wrapperConfig` |
| checkbox 族 | `checkboxConfig` |
| 选项归一化 | `normalizeOptions`（shared 单源，F-100） |
| 尺寸/状态类 | behavior.ts 统一出口（`--size-*` / `is-*`，size-class 守卫） |
| 图标渲染 | `renderIcon` |
| 受控显示 | `modelValue` + `update:modelValue` + `visible-change` |
| 事件写口 | 一组件一 v-model 写口（naming-guard dual-update-alias） |
| 缺陷台账 | REQUIREMENTS.md F 表 + 三处口径（verify-governance） |
| 组件元数据 | registry.mjs |

## 9. 换环境 checklist（IDEA / 新机器）

1. `git clone` 后 `core.hooksPath` 已由 `.githooks` 注册（跟着仓库走），`npm install` 一次即可。
2. 编辑器装 prettier 插件、关掉自带格式化，以 `.prettierrc` 为准；行尾 LF（`.gitattributes` 强制）。
3. 所有动作走 `package.json` scripts，不手敲底层命令；门禁只有一条 `npm run quality`。
4. 视觉/布局基线改动：`npm run snap:layout` / `snap:pixels` 录入，别手改基线文件。
5. 不确定命名 → 查 `NAMING.md`；不确定流程 → 查 `WORKFLOW.md`；不确定坑 → 查 `KNOWLEDGE.md`。规则冲突 → 本文件 §0 总则裁决。
