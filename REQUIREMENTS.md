# 需求说明：组件库测试用例体系（前两批共 27 个组件）

## 目录

| 章节        | 标题                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| [§1](#s1)   | 需求背景                                                                                                  |
| [§2](#s2)   | 需求范围                                                                                                  |
| [§3](#s3)   | 关键设计决定                                                                                              |
| [§4](#s4)   | 验收标准                                                                                                  |
| [§5](#s5)   | 已知缺陷清单（首批记录，现已全部修复）                                                                    |
| [§6](#s6)   | 后续批次建议                                                                                              |
| [§7](#s7)   | 第二批交付（15 个组件文件、319 条组件用例 + 15 条缺陷守卫，守卫已随 §7.2 降级）                           |
| [§8](#s8)   | 第三批交付（6 个构建器侧测试文件、68 条用例，分支 `feature/20261107-tests-batch3`）                       |
| [§9](#s9)   | 第四批交付（质量门禁：真实浏览器层 + 统一入口，分支 `feature/20261107-quality-gate`）                     |
| [§10](#s10) | 第五批交付（全 profile 运行时校验 + 门禁阶段化与提交钩子，分支 `feature/20261107-every-profile-runtime`） |
| [§11](#s11) | 第六批交付（63 个组件目录全量接入用例，分支 `feature/20261107-tests-batch6`）                             |
| [§12](#s12) | 第七批交付（覆盖率阈值 + 像素基线，分支 `feature/20261107-coverage-pixel-baseline`）                      |
| [§13](#s13) | 缺陷修复：特性-属性归属（分支 `fix/20261107-prop-attribution`）                                           |
| [§14](#s14) | 构建流水线优化（分支 `perf/20261107-build-pipeline`）                                                     |
| [§15](#s15) | 第八批交付（场景缺陷闭环 + 治理校验，分支 `feature/20261107-scene-defect-closure`）                       |
| [§16](#s16) | 第九批交付（视觉能力补齐，分支 `feature/20261107-visual-capability`）                                     |
| [§17](#s17) | 第十批：调试台产物隔离与视觉体检补齐消费方路径（F-67）                                                    |
| [§18](#s18) | 第十一批交付（工程与测试优化 · B1：门禁短路与产物安全，分支 `feature/20261107-optimization-plan`）        |
| [§19](#s19) | 第十一批交付（工程与测试优化 · B2：构建缓存与清单单一来源，分支 `feature/20261107-optimization-plan`）    |
| [§20](#s20) | 第十一批交付（工程与测试优化 · B3a：工具链测试，分支 `feature/20261107-optimization-plan`）               |
| [§21](#s21) | 第十一批交付（工程与测试优化 · B3b：浏览器矩阵、覆盖率与无障碍）                                          |
| [§22](#s22) | 第十一批 B4：一致性与检查范围（分支 `feature/20261107-optimization-plan`）                                |
| [§23](#s23) | 第十一批 B5：文档、入口与服务端 CI（分支 `docs/20261107-docs-and-ci-entry`）                              |
| [§24](#s24) | 选择器统一：只保留 Select 并吸收大数据虚拟列表（分支 `feature/20261107-select-unification`）              |
| [§25](#s25) | 虚拟列表统一：一套算法、一个组件、真按需打包（分支 `feature/20261107-virtual-list-unify`）                |

## 缺陷编号索引

每条缺陷的登记行（现象 / 根因 / 修复落点）都在对应章节的表格里；编号连续性与唯一性由 `scripts/verify-governance.mjs`（门禁 `governance` 段）校验。

| 缺陷 | 章节        |
| ---- | ----------- |
| F-1  | [§5](#s5)   |
| F-2  | [§5](#s5)   |
| F-3  | [§5](#s5)   |
| F-4  | [§5](#s5)   |
| F-5  | [§5](#s5)   |
| F-6  | [§5](#s5)   |
| F-7  | [§5](#s5)   |
| F-8  | [§5](#s5)   |
| F-9  | [§5](#s5)   |
| F-10 | [§5](#s5)   |
| F-11 | [§7](#s7)   |
| F-12 | [§7](#s7)   |
| F-13 | [§7](#s7)   |
| F-14 | [§7](#s7)   |
| F-15 | [§7](#s7)   |
| F-16 | [§7](#s7)   |
| F-17 | [§7](#s7)   |
| F-18 | [§7](#s7)   |
| F-19 | [§7](#s7)   |
| F-20 | [§7](#s7)   |
| F-21 | [§7](#s7)   |
| F-22 | [§7](#s7)   |
| F-23 | [§7](#s7)   |
| F-24 | [§7](#s7)   |
| F-25 | [§7](#s7)   |
| F-26 | [§8](#s8)   |
| F-27 | [§8](#s8)   |
| F-28 | [§8](#s8)   |
| F-29 | [§9](#s9)   |
| F-30 | [§9](#s9)   |
| F-31 | [§9](#s9)   |
| F-32 | [§9](#s9)   |
| F-33 | [§9](#s9)   |
| F-34 | [§10](#s10) |
| F-35 | [§10](#s10) |
| F-36 | [§10](#s10) |
| F-37 | [§11](#s11) |
| F-38 | [§11](#s11) |
| F-39 | [§11](#s11) |
| F-40 | [§11](#s11) |
| F-41 | [§11](#s11) |
| F-42 | [§11](#s11) |
| F-43 | [§11](#s11) |
| F-44 | [§11](#s11) |
| F-45 | [§11](#s11) |
| F-46 | [§11](#s11) |
| F-47 | [§11](#s11) |
| F-48 | [§11](#s11) |
| F-49 | [§11](#s11) |
| F-50 | [§11](#s11) |
| F-51 | [§12](#s12) |
| F-52 | [§12](#s12) |
| F-53 | [§13](#s13) |
| F-54 | [§14](#s14) |
| F-55 | [§15](#s15) |
| F-56 | [§15](#s15) |
| F-57 | [§15](#s15) |
| F-58 | [§15](#s15) |
| F-59 | [§15](#s15) |
| F-60 | [§15](#s15) |
| F-61 | [§15](#s15) |
| F-62 | [§15](#s15) |
| F-63 | [§15](#s15) |
| F-64 | [§15](#s15) |
| F-65 | [§15](#s15) |
| F-66 | [§16](#s16) |
| F-67 | [§17](#s17) |
| F-68 | [§18](#s18) |
| F-69 | [§18](#s18) |
| F-70 | [§18](#s18) |
| F-71 | [§18](#s18) |
| F-72 | [§18](#s18) |
| F-73 | [§18](#s18) |
| F-74 | [§18](#s18) |
| F-75 | [§19](#s19) |
| F-76 | [§19](#s19) |
| F-77 | [§19](#s19) |
| F-78 | [§19](#s19) |
| F-79 | [§19](#s19) |
| F-80 | [§19](#s19) |
| F-81 | [§20](#s20) |
| F-82 | [§20](#s20) |
| F-83 | [§20](#s20) |
| F-84 | [§25](#s25) |
| F-85 | [§25](#s25) |

<a id="s1"></a>

## 1. 需求背景

项目此前只有一层"构建产物是否正确打包"的校验（`npm run verify`、`npm run verify:consumer`），
以及依赖 Playwright 的浏览器截图回归。组件的行为、属性推导、事件抛出和边界情况没有任何单元测试覆盖，
改动 `shared/behavior.ts` 或某个特性模块时无法快速判断影响面。

本需求为组件库建立可持续运行的单元测试层，并先把使用频率最高的核心组件覆盖起来。

<a id="s2"></a>

## 2. 需求范围

### 2.1 在本期范围内

- 引入 Vitest + @vue/test-utils + happy-dom 的测试基础设施（配置、脚本、别名）
- 覆盖 12 个核心高频组件：Button、Input、Select、Checkbox、Radio、Switch、Form、Tabs、Dialog、Table、Tree、Pagination
- 每个组件按四个层次断言：行为（用户操作后的结果）、属性（props → 类名/样式/DOM 属性）、事件（emit 的载荷与时序）、边界（禁用、空数据、越界值、缺省值）
- 用例暴露的库缺陷单独归档，并以 `it.fails` 守卫固定"期望行为"
- 测试目录纳入 `npm run format` / `format:check`
- 第二批（见 §7）沿用同一套基础设施与断言口径，追加 15 个组件与一份新的 `tests/findings.spec.ts`

### 2.2 不在本期范围

- 不修改任何组件源码（缺陷只记录、不修复），保持本 PR 的变更面为"纯新增测试"；修复另开分支 `fix/20261106-component-defects` 完成，结果见 §5
- 不做视觉回归（Playwright 截图链路保持原样）
- 不覆盖其余组件（Menu、Dropdown、Upload、DatePicker 等留待第二批，见 §6）
- 不引入覆盖率阈值门禁（只提供 `npm run test:coverage` 命令）

<a id="s3"></a>

## 3. 关键设计决定

| 决定     | 结论                                                         | 原因                                                                                                          |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 测试对象 | 构建产物 `dist/full/ui-kit.js`，通过别名 `@ui-kit-full` 引入 | 与消费方 `examples/consumer` 的引用方式一致，测的是"真正被使用的那份代码"；`build:full` 仅约 3 秒，成本可忽略 |
| 构建时机 | `pretest` 钩子自动执行 `npm run build:full`                  | 避免出现"源码改了但测试仍跑旧产物"的假绿                                                                      |
| DOM 环境 | happy-dom                                                    | 组件全部是渲染函数，无 SSR 专属逻辑；happy-dom 比 jsdom 快，足以支撑类名/事件断言                             |
| 断言口径 | 以真实 DOM 输出为准，而非源码推测                            | 写用例前用临时探针脚本采集每个组件的类名、内联样式与 emit 载荷，再据此固化断言                                |
| 浮层组件 | `attachTo: document.body` + 直接查询 `document`              | Select 下拉、Dialog 面板 teleport 到 body，`wrapper.html()` 只剩传送门注释                                    |
| 缺陷记录 | `tests/findings.spec.ts` 内使用 `it.fails`                   | 断言失败才算通过；组件一旦修好该用例会转为失败，提示把断言迁回对应组件用例                                    |

<a id="s4"></a>

## 4. 验收标准

1. `npm test` 全绿，首批交付为 13 个测试文件、258 条用例；缺陷修复批次补齐守卫后为 12 个文件、266 条用例；第二批交付后为 28 个文件、600 条用例（新增 15 个组件 319 条 + 缺陷守卫 15 条），单次运行耗时 ≤ 5 秒（不含构建）
2. `npm run test:watch` 可增量运行；`npm run test:coverage` 可产出覆盖率报告
3. `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm run verify` 均不因新增测试而失败
4. 12 个组件各自具备"行为 + 属性 + 事件 + 边界"四类断言，缺失维度需在文档或注释中说明原因
5. 已知缺陷以 `it.fails` 守卫形式存在且有根因注释；修复批次把守卫降级为组件文件里的常规回归用例，而不是删掉了事

<a id="s5"></a>

## 5. 已知缺陷清单（首批记录，现已全部修复）

| 编号 | 组件             | 原现象                                                 | 根因                                                                             | 修复                                                                                                                      | 回归用例                                                                                                  |
| ---- | ---------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| F-1  | Select           | `props: { label, value }` 字段映射不生效，选项文案为空 | `normalizeOptions(props.options)` 调用时漏传第二个参数 mapping                   | `select/core.ts` 增 `optionFieldKeys(mapping)` 并透传 `props.props`（含分组递归）                                         | `select.spec.ts`「props 字段映射决定选项文案与取值」                                                      |
| F-2  | Select           | 完全不传 `modelValue` 时回显 `false` 而非占位文案      | prop 类型联合含 Boolean，Vue 对缺省键做布尔归一化                                | `modelValue` 显式 `default: undefined`                                                                                    | `select.spec.ts`「完全不传 modelValue 时仍显示占位文案」                                                  |
| F-3  | Input            | `id` 未渲染到内部 `<input>`                            | `inputConfig` 组装控件属性时没有带上 id                                          | `shared/behavior.ts` 的 `inputConfig` 补 `id: props.id`（input 与 textarea 共用）                                         | `input.spec.ts`「id 落到内部控件上，textarea 同样生效」                                                   |
| F-4  | Radio / Checkbox | 只写 `label` 时无法作为选项值                          | `value` 的类型联合含 Boolean，缺省被归一化为 `false`，挡住 `value ?? label` 回退 | Radio/RadioButton/RadioGroup、Checkbox/CheckboxButton 的 `value`/`label`/`modelValue` 显式 `default: undefined`           | `radio.spec.ts`「只写 label 时 label 即选项值」、`checkbox.spec.ts` 同名用例（含 CheckboxGroup 数组匹配） |
| F-5  | Tabs             | `type` 属性只是声明，不产生类名与样式                  | `classes()` 仅输出 `is-<tabPosition>` / `is-stretch`                             | `classes()` 增 `ui-tabs--<type>`，`tabs/core.css` 补 card / border-card 样式                                              | `tabs.spec.ts`「type 落到 ui-tabs--<type> 类名，缺省不附加」                                              |
| F-6  | Tabs             | `beforeLeave` 从未被调用，无法拦截切换                 | `features/tabs-editable` 只用它推导类名                                          | `setActive` 接住 `beforeLeave(旧名, 新名)`，reject/`false`/抛错均拦截；未声明时保持同步提交时序                           | `tabs.spec.ts`「beforeLeave 返回 reject 时阻止切换」等 3 条                                               |
| F-7  | Dialog           | `beforeClose` 从未被调用，异步确认无处生效             | `features/closable` 只用它决定关闭按钮是否渲染                                   | `overlayConfig` 新增 `requestClose()`，关闭按钮 / 遮罩 / Escape 三条路径统一走 `beforeClose(done)`，Drawer 等浮层同样受益 | `dialog.spec.ts`「beforeClose 不调用 done 时保持打开」等 3 条                                             |
| F-8  | Table            | 按调用方持有的行引用调用 `toggleRowSelection` 静默无效 | 内部用 `indexOf` 比对，代理对象与原始对象不相等                                  | `features/methods` 增 `indexOfRow()`：先按 `toRaw` 身份匹配，再按 `rowKey` 兜底，并统一用列表内那一份继续勾选             | `table.spec.ts`「toggleRowSelection 同时接受原始对象与渲染代理」等 3 条                                   |
| F-9  | Dialog           | `modal: false` 仍带 `ui-dialog--modal` 类名            | `features/modal` 的 className 是无条件常量                                       | `className` 与 `modal` 取值联动                                                                                           | `dialog.spec.ts`「modal=false 不渲染遮罩也不带 ui-dialog--modal 类名」                                    |
| F-10 | Checkbox         | 数组 `modelValue` 触发 Vue 的 prop 类型告警            | `resolveCheckedValue` 支持数组匹配，但 `modelValue` 类型联合漏了 `Array`         | Checkbox / CheckboxButton 的 `modelValue` 类型补 `Array`                                                                  | `checkbox.spec.ts`「只写 label 时 label 即选项值」（运行无告警）                                          |

修复批次（`fix/20261106-component-defects`）不改动组件的公开 API 与事件语义，只补齐声明已承诺却未接线的行为；`tests/findings.spec.ts` 的 `it.fails` 守卫全部降级为组件文件里的常规用例，守卫文件随之删除，待第二批再发现缺陷时重建。

<a id="s6"></a>

## 6. 后续批次建议

- 第二批已交付（分支 `feature/20261106-component-tests-batch2`，内容见 §7），其缺陷也已清除（分支 `fix/20261107-component-defects-batch2`，内容见 §7.1）
- 第三批已交付（分支 `feature/20261107-tests-batch3`，内容见 §8）：构建器侧的裁剪契约、产物自证信息、体积阈值与主题令牌快照，附带清掉构建器缺陷 F-26、F-28，并记录 F-27
- 第四批已交付（分支 `feature/20261107-quality-gate`，内容见 §9）：真实浏览器层的布局 / 定位 / 拖拽 / 滚动 / 键盘断言、控制台告警归零、属性落盘扫描、布局指纹基线、用例侧类型检查，附带清掉浏览器层暴露的缺陷 F-29~F-33，全部收敛成一条 `npm run quality`
- 第五批（建议）：把 `npm run quality` 接到 CI 与提交钩子（当前仍是本地一条命令），并把"裁剪后 19 份 profile 的运行时可用性"补成按 profile 起 alias 的关键用例
- 缺陷修复已按"单独分支 + 单独 PR"完成（`fix/20261106-component-defects`），每条 `it.fails` 守卫都降级为组件文件里的常规用例；后续批次沿用同一约定
- §5 的 F-1~F-10、§7.1 的 F-11~F-25 均已修复，守卫文件 `tests/findings.spec.ts` 按约定删除

<a id="s7"></a>

## 7. 第二批交付（15 个组件文件、319 条组件用例 + 15 条缺陷守卫，守卫已随 §7.2 降级）

组件清单与用例数：Menu 18、Dropdown 19、Popover 18、Tooltip 19、Upload 19、DatePicker 29、TimePicker + TimeSelect 37、ColorPicker + ColorPickerPanel 27、Progress 23、Badge 14、Avatar + AvatarGroup 20、Skeleton 14、Carousel 23、Image 18、Transfer 21。

本批新增的两条编写约定：

| 约定         | 做法                                                                                                                                                             | 原因                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 时钟冻结     | 凡是"今天 / 此刻 / 本年"一类读系统时钟的断言，用 `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime()` 冻结到固定时刻，并在 `afterEach` 归还真实计时器 | 不冻结的用例在跨天（首批写作 11-06 → 11-07 凌晨）会集体转红；只 fake `Date`，`setTimeout` 仍走真实计时器，浮层的 show/hide 时序不受干扰 |
| 浮层显隐口径 | Dropdown/Popover/Tooltip 走 `triggerConfig`，面板常驻 DOM、靠 `display: none` + `aria-hidden` 收起；DatePicker/TimePicker/TimeSelect 收起后直接从 DOM 移除       | 断言前先确认该组件属于哪一类，否则 `querySelector` 命中或落空都会误导结论                                                               |

本批未能覆盖的维度（happy-dom 限制，非遗漏）：ColorPicker 的 SV 区与色相/明度拖拽、DatePicker/Tooltip 的真实定位（`actualSide` 回退），这些路径依赖非零尺寸矩形与 `getBoundingClientRect`，在测试环境下矩形恒为 0，只断言到"不产生错误提交"。

### 7.1 第二批已知缺陷清单（已修复，修复分支 `fix/20261107-component-defects-batch2`）

| 编号 | 组件                                                                                            | 原现象                                                                                           | 根因                                                                                                                                                                      | 修复                                                                                                                                                                                                                                                                                | 回归用例                                                                                                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-11 | 特性开关类（Upload / Image / Transfer / Select / Slider / Drawer / DatePicker / TimePicker 等） | `multiple`、`lazy`、`filterable`、`range`、`modal`、`isRange` 关掉后 `ui-x--<特性>` 仍挂在根节点 | `createClassFeature` 里 `className: () => '常量'` 会被无条件拼接，只有 `className: (props) => …` 才拿得到 props；全库 178 个特性中 59 个写成常量形式                      | 17 个以布尔开关命名的特性改成条件求值；区间类名沿用 core 的"isRange 或区间型 type"判据；结构性类名（`--popper`、`--validate`、`--format`、`autocomplete--filterable`）没有对应开关，保留常量形式并在注释里说明                                                                      | `feature-class-switch.spec.ts`（8 组开关正反断言 + DatePicker/TimePicker 区间类名 2 组）、`date-picker.spec.ts`「触发区由图标、输入框与动作区组成」、`time-picker.spec.ts`「触发区由图标、真实输入框与动作区组成」 |
| F-12 | MenuItemGroup                                                                                   | 未传 `title` 仍渲染 `__title` 节点，占一行高度                                                   | 分组标题直接渲染 `props.title`，没有空值判断（spec 描述为留空不渲染）                                                                                                     | `menu/core.ts` 分组内容改为 `props.title` 为真才渲染标题节点                                                                                                                                                                                                                        | `menu.spec.ts`「分组未传 title 时不渲染标题节点」                                                                                                                                                                  |
| F-13 | Dropdown                                                                                        | `visible: false` 下点击触发区仍会展开                                                            | `triggerConfig` 只把 `defaultOpen` 与 `visible` 折成 `open` 的初值，之后 `visible` 不再参与；且 `visible` 缺省被 Vue 归一化成 `false`，无法区分"未受控"与"受控且强制收起" | `shared/behavior.ts` 拆出 `applyShow/applyHide` 与 `isControlledVisible()`：声明 `visible` 时交互（点击 / 悬停 / 外点 / 面板点击 / 计时器）都不改写展开态；`dropdown`、`popover`、`popconfirm` 的 `visible` 显式 `default: undefined`                                               | `dropdown.spec.ts`「visible=false 强制收起，交互不能把它重新打开」（「visible 受控展开与收起」同时保持通过）                                                                                                       |
| F-14 | Popover                                                                                         | 同 F-13                                                                                          | 同一套 `triggerConfig`                                                                                                                                                    | 同 F-13 的 `triggerConfig` 修复                                                                                                                                                                                                                                                     | `popover.spec.ts`「visible=false 强制收起，交互不能把它重新打开」                                                                                                                                                  |
| F-15 | DatePicker                                                                                      | `type: 'dates'` 实为单选，抛字符串、只有一个 `is-selected`                                       | 面板未按 dates 粒度累积多选集合                                                                                                                                           | `date-picker/core.ts` 增 `isDates`/`selectedDates`，点击切换该日在集合内的勾选，按升序以数组抛 `update:modelValue` + `change`，多选过程中面板不收起、页脚「确定」才提交收起                                                                                                         | `date-picker.spec.ts`「type=dates 支持多选，每次点击抛出升序日期数组」                                                                                                                                             |
| F-16 | TimePicker                                                                                      | 声明了 `editable`/`readonly`/`id`/`name`，但触发区是纯 `span` 文本，没有任何可输入控件           | time-picker 未复用 input 结构，`editable` 只推导类名                                                                                                                      | `time-picker/core.ts` 触发区改成真实 `<input class="ui-time-picker__value">`（空值时换成 `__placeholder` 并写 `placeholder` 属性），`editable`/`readonly` 决定 `readonly`，`id`/`name` 支持字符串或数组（区间两端各自映射），键入后回车或失焦走既有解析路径，解析失败回退原值不提交 | `time-picker.spec.ts`「触发区由图标、真实输入框与动作区组成」「editable 与 readonly 决定输入框可否键入，id / name 落到输入框」「键入时间文本后回车提交，解析失败不提交且回退原值」                                 |
| F-17 | TimeSelect                                                                                      | `format: 'HH:mm:ss'` 的选项文案变成 `09:00:ss`                                                   | 格式化只替换时分段，`ss` 段未识别                                                                                                                                         | `time-select/core.ts` 复用 `shared/date` 的 `parseTimeValue` + `formatDateValue`，选项文案、隐藏 input 值与回显走同一套完整格式化                                                                                                                                                   | `time-picker.spec.ts`「format 的时分秒三段都参与格式化」                                                                                                                                                           |
| F-18 | ColorPicker                                                                                     | 清空后受控值未回写时显示 `#409eff` 兜底色并保持 `has-value`                                      | `clear` 改写内部 draft 色，展示值脱离 props；与 DatePicker「未回写保持原值」不一致                                                                                        | `color-picker/core.ts` 展示值默认跟随 props（新增 `draftDirty`，仅用户提交后置脏），`clearValue` 只写回事件载荷并复位脏位                                                                                                                                                           | `color-picker.spec.ts`「清空后未回写 modelValue 时继续显示原值」                                                                                                                                                   |
| F-19 | ColorPicker                                                                                     | 无法解析的色值（如 `not-a-color`）被当作有值渲染                                                 | 解析失败回退 `FALLBACK_COLOR` 且按有值出图，用户看不出填错                                                                                                                | 解析失败视作空值（`modelColor` 为 null）：不带 `has-value`、显示占位、色板透明                                                                                                                                                                                                      | `color-picker.spec.ts`「无法解析的色值视作空值，显示占位而不是兜底色」                                                                                                                                             |
| F-20 | ColorPickerPanel                                                                                | `modelValue` 为空时文本回吐 `#40a0ff`，与声明的 `#409eff` 也不一致                               | 面板把兜底色反解析成文本，反解析本身有精度损失                                                                                                                            | `color-picker-panel/core.ts` 先判 `hasModel`，空值时 `__value` 输出空串（色相条仍停在缺省色 210 度）                                                                                                                                                                                | `color-picker.spec.ts`「空值面板不回吐兜底色，文本位保持为空」                                                                                                                                                     |
| F-21 | Transfer                                                                                        | `change` 的第二参数恒为 `'right'`，移回左侧也报错方向                                            | `transfer/core.ts` 的 `emitKeys()` 写死 `emit('change', next, 'right')`                                                                                                   | `emitKeys(next, direction)`，右移传 `'right'`、移回左传 `'left'`                                                                                                                                                                                                                    | `transfer.spec.ts`「移回左侧时从 modelValue 中移除对应键、清空勾选并报 left 方向」                                                                                                                                 |
| F-22 | Transfer                                                                                        | `leftDefaultChecked` 可把 `disabled` 条目预勾选，右移按钮随之可点                                | 预设吞并左键集合时跳过 disabled 校验                                                                                                                                      | 预设勾选经 `pickEnabled` 过滤禁用键，禁用项不会被搬走                                                                                                                                                                                                                               | `transfer.spec.ts`「预设勾选跳过 disabled 条目」                                                                                                                                                                   |
| F-23 | Carousel                                                                                        | 内部切换不抛 `update:modelValue`/`change`，无法 v-model                                          | 只改内部 `activeIndex`，既未声明 `modelValue` 也未 emit                                                                                                                   | 声明 `modelValue`（name / label / 序号）与 `update:modelValue`、`change(新值, 旧值)`，`go()` 统一抛出，外部值变化驱动切换、非法值保持当前条目，注册时静默对齐初值                                                                                                                   | `carousel.spec.ts`「内部切换抛出 modelValue/change，支持 v-model」「外部改写 modelValue 会驱动切换」                                                                                                               |
| F-24 | Carousel                                                                                        | 条目未传 `name`/`label` 时，指示点 `aria-label` 是 `item-4f2a…` 随机串                           | 回退到 `CarouselItem` 自动生成的条目名                                                                                                                                    | 条目 meta 标记 `autoName`，指示器 aria-label 走 `indicatorLabel`，自动名一律换成「第 N 张」                                                                                                                                                                                         | `carousel.spec.ts`「未传 name 与 label 时指示器给出可读的序号 aria-label」                                                                                                                                         |
| F-25 | AvatarGroup                                                                                     | `gap` 未声明为 prop，透传成 `gap="4"` DOM 属性，间距由 CSS 写死 `-8px`                           | `AvatarGroupCoreProps` 缺 `gap`                                                                                                                                           | `avatar/core.ts` 声明 `gap: [Number, String]` 并写成内联变量 `--ui-avatar-group-gap`，`core.css` 的负边距改成 `calc(-1 * var(--ui-avatar-group-gap, 8px))`                                                                                                                          | `avatar.spec.ts`「gap 是受控 prop，写成 CSS 变量而不是 DOM 属性」                                                                                                                                                  |

### 7.2 缺陷清除的交付说明（分支 `fix/20261107-component-defects-batch2`）

修复只补齐"声明已承诺却未接线"的行为，除两处外不改动组件的公开 API：Carousel 新增 `modelValue` 与 `update:modelValue`/`change`（此前只能内部切换，无法 v-model），AvatarGroup 新增 `gap` prop（此前透传成非法 DOM 属性）。TimePicker 的触发区从纯文本 `span` 换成真实 `<input>`，视觉与类名结构保持不变，但依赖"触发区不是表单控件"的写法需要复查。

回归覆盖：15 条守卫全部降级为组件文件里的常规用例，`tests/findings.spec.ts` 删除；新增 [tests/components/feature-class-switch.spec.ts](tests/components/feature-class-switch.spec.ts)（18 条）专测特性开关类名跟随 props。全量 28 个测试文件、612 条用例通过。

F-11 的口径澄清：只有"类名与同名布尔开关 prop 对应"却写成常量求值的特性才是缺陷，已改 17 个；`--popper`、`--validate`、`--format`、`autocomplete--filterable` 一类结构性类名没有对应开关，其特性 CSS 为空或仅由 core 选择器引用，保留常量形式并在源码注释里说明。

<a id="s8"></a>

## 8. 第三批交付（6 个构建器侧测试文件、68 条用例，分支 `feature/20261107-tests-batch3`）

组件用例只跑 `dist/full` 这一份产物，管的是"组件行为对不对"；构建器管的是"装进包里的是不是选中的那一份"，这两件事互看不到。第三批把后者单独建成一套用例：`vitest.build.config.ts`（`environment: 'node'`，只读文本、起 happy-dom 反而拖慢）跑 `tests/build/**`，先 `npm run build:all` 产出 20 份 profile 再断言，命令是 `npm run test:build`，`npm run test:all` 一次跑完两侧。

| 文件                                                                           | 用例 | 盯住的缺口                                                                                                                                                     |
| ------------------------------------------------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [tests/build/profile-contract.spec.ts](tests/build/profile-contract.spec.ts)   | 10   | `meta.json` 是否自证：四个产物文件齐全、`selection` 与当前 `spec.mjs` 同源（防陈旧产物）、字节数与磁盘真实值一致、`package.json` 与 `sizes.json` 是同一份事实  |
| [tests/build/tree-shaking.spec.ts](tests/build/tree-shaking.spec.ts)           | 9    | 裁剪结果与选择一致：入口 import 表、136 个可标记特性 × 20 份产物的命中矩阵、临时探针只装 button/input/table 时的类名与体积下界                                 |
| [tests/build/size-budget.spec.ts](tests/build/size-budget.spec.ts)             | 7    | 体积阈值：core 严格最小、特性增量在带内、主题 CSS 增幅 ≤ 1.25×、前缀长度带来的体积差 ≤ 2%                                                                      |
| [tests/build/theme-tokens.spec.ts](tests/build/theme-tokens.spec.ts)           | 10   | 令牌落盘：profile 声明的 1664 个令牌逐个在产物 CSS 里出现且不被静默丢弃、皮肤不发明新令牌、组件级皮肤块与未选中组件令牌的裁剪、20 份生效令牌表指纹快照         |
| [tests/build/builder-functions.spec.ts](tests/build/builder-functions.spec.ts) | 17   | 构建器纯函数：`sanitizeName` / `sanitizePrefix`（空前缀必须 400 而不是静默退回 `ui`）/ `rewritePrefix` 的边界 / `normalizePropType` / 图标名单三方对齐         |
| [tests/build/types-contract.spec.ts](tests/build/types-contract.spec.ts)       | 15   | `index.d.ts` 与 `spec.mjs` 同源：导出面、属性表、方法表、特性接口注释、图标网关开关、`activeComponents`/`activeFeatures` 三方（d.ts / meta.json / 运行时）一致 |

本批顺带清掉与记录三条构建器侧缺陷，见 §8.1。全量：`npm test` 28 文件 612 条 + `npm run test:build` 6 文件 68 条，共 680 条通过；消费方 `npm run verify:consumer` 的正向类型、8 条反向报错与运行时渲染全部保持通过。

### 8.1 第三批构建器侧缺陷清单（分支 `feature/20261107-tests-batch3`）

| 编号 | 位置                    | 原现象                                                                           | 根因                                                                                                                                       | 修复                                                                                                                                                                                               | 回归用例                                                                                                                                                                      |
| ---- | ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-26 | `scripts/build-lib.mjs` | `meta.features` 报 179 条，入口 `entry.ts` 出现重复 import 语句                  | 同一个特性可以挂在同组件的多个导出上（`table.selection` 同时在 `Table` 与 `TableColumn`），`generateEntry` 按"导出 × 特性"逐条推送，没去重 | 入口生成按 `导出名 + 模块` 去重 import、按特性 id 去重 `activeFeatures`；类型生成侧同样按 id 去重                                                                                                  | `profile-contract.spec.ts`「features 是 registry 声明顺序下的特性 id，且不含重复项」+ `tree-shaking.spec.ts`「entry.ts 的特性 import 恰好等于被选中的特性模块，且没有重复行」 |
| F-27 | `scripts/build-all.mjs` | `sizes.json.features` 恒为空对象，构建器界面拿不到"单个特性的体积成本"           | 增量靠"恰好等于 `requires` 与 `requires + [id]` 的两份 profile"配对求得；仓库里除 core（0 特性）外 19 份都是全特性集，任何配对都不成立     | 已修：对每个特性构建一份「full 去掉该特性」的临时产物与 `full` 相减，得到该特性在完整产物里的边际成本；178 个特性全部有数据，临时产物构建后清理                                                    | `size-budget.spec.ts`「features 段覆盖全部 178 个特性，且每项都是非负增量」                                                                                                   |
| F-28 | `normalizePropType`     | `index.d.ts` 里出现 `((...args: any[]) => any \| any[])`，数组分支被吞进返回类型 | 括号深度表把 `=>` 的 `>` 当右括号，深度穿到负数，箭头函数之后的顶层 `\|` 不再拆分                                                          | 深度计算跳过 `=` 之后的 `>`；两份 `spec.mjs` 把有歧义的类型写成显式括号（`((...args: any[]) => any) \| any[]`、`(value: string) => (boolean \| string \| undefined)`），生成器 `tsType` 同步补括号 | `builder-functions.spec.ts`「F-28：=> 的右尖括号不计入括号深度」「d.ts 里每一行属性类型都已规范化且幂等」                                                                     |

<a id="s9"></a>

## 9. 第四批交付（质量门禁：真实浏览器层 + 统一入口，分支 `feature/20261107-quality-gate`）

第三批之后仍有 612 条用例全绿，而浏览器里打开示例页会直接抛 `TypeError: Failed to set an indexed property [0] on 'CSSStyleDeclaration'`。两者的落差来自 happy-dom：它把所有元素的矩形算成 0，样式表与布局不参与判定，于是"定位、翻转、夹取、滚动跟随、拖拽、真实尺寸、控制台告警"这一整类事实在单元层不可证伪。第四批不再补用例，而是把这一类缺口整体接进来，并把所有检查收敛成一条命令。

### 9.1 门禁清单（`npm run quality`）

| 顺序 | 入口                      | 规模                         | 堵住的缺口                                                                             |
| ---- | ------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| 1    | `npm run format:check`    | 全仓 ts / mjs                | 格式漂移导致评审 diff 失真                                                             |
| 2    | `npm run typecheck`       | 库 + 用例两份工程            | 组件属性表与用例的拼写错误；新增 `tsconfig.tests.json` 把 `tests/**` 纳入检查          |
| 3    | `npm run lint`            | eslint 全仓                  | 单行 `if`、`==`、`var` 等一致性                                                        |
| 4    | `npm run verify`          | 库级校验                     | 产物存在性、API 一致性、图标名单三方对齐                                               |
| 5    | `npm test`                | 94 文件 1570 条              | 组件行为、属性、事件、边界（happy-dom，90 个目录全覆盖，无占位跳过）                   |
| 6    | `npm run test:build`      | 7 文件 89 条                 | 裁剪、令牌、体积、类型生成（20 份 profile）                                            |
| 7    | `npm run test:browser`    | 9 文件 51 条                 | 真实布局 / 定位 / 滚动 / 拖拽 / 键盘 / 控制台归零 / 属性落盘 / 布局基线 / 固钉回顶引导 |
| 8    | `npm run verify:consumer` | 正向类型 + 8 条反向 + 运行时 | 消费方按产物消费时的类型契约与渲染                                                     |

### 9.2 浏览器层用例（`tests/browser/**`，Chromium + 固定 1280×720）

| 文件                                                                       | 用例 | 盯住的缺口                                                                                                   |
| -------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------ |
| [tests/browser/floating.spec.ts](tests/browser/floating.spec.ts)           | 8    | 贴边翻转、右沿夹取、Select 面板等宽、滚动时面板与触发器相对位移恒定                                          |
| [tests/browser/table.spec.ts](tests/browser/table.spec.ts)                 | 6    | body 独立滚动而表头 / 合计固定、横向 scrollLeft 同步、冻结列贴边、列宽拖拽落列、合计数值                     |
| [tests/browser/tree.spec.ts](tests/browser/tree.spec.ts)                   | 4    | 5000 子节点展开耗时（实测 96 ms，门禁 800 ms）、逐层展开的节点数与 `node-click`                              |
| [tests/browser/interaction.spec.ts](tests/browser/interaction.spec.ts)     | 5    | 取色器 SV 区 / 色相条的真实矩形命中、点选与按住拖动的连续更新、十六进制回显一致                              |
| [tests/browser/a11y.spec.ts](tests/browser/a11y.spec.ts)                   | 7    | Tab 序列命中触发器 / 标签页 / 开关、Enter 展开、Space 收起、Escape 关闭、焦点可见                            |
| [tests/browser/attributes.spec.ts](tests/browser/attributes.spec.ts)       | 3    | 以 `spec.mjs` 为清单的 `id` 落盘扫描、全导出字符串 `style` 扫描、Popover 样式路由                            |
| [tests/browser/console-clean.spec.ts](tests/browser/console-clean.spec.ts) | 3    | 全家桶默认属性渲染零告警 / 零异常、渲染数量与尺寸下限                                                        |
| [tests/browser/visual.spec.ts](tests/browser/visual.spec.ts)               | 6    | 六个场景的布局指纹与基线比对（容差 1px，按平台分桶，`npm run snap:layout` 重录）                             |
| [tests/browser/sticky.spec.ts](tests/browser/sticky.spec.ts)               | 9    | 固钉吸附阈值与占位尺寸、容器内回顶 calc 贴边、平滑滚回顶部并收起、引导面板 placement / offset 贴靠与高亮包裹 |

支撑件：`vitest.browser.config.ts`（串行、60 s 超时）、`tests/browser/_global-setup.ts`（仓库根起 Vite dev server，并 `define` 三个 Vue feature flags 常量）、`tests/browser/harness/`（`?scene=` 选场景，`window.__probe` 回传运行期事实，`window.__kit` / `__vue` 供页面内直接挂载）、`tests/browser/_session.ts`（会话与断言工具箱）、`tests/browser/_geometry.ts`（锚点表 + 指纹采集 + 差异报告）。

单元层同步补两份锚点，避免"只有浏览器能发现"的缺陷在合入后才红：[tests/components/style-attrs.spec.ts](tests/components/style-attrs.spec.ts)（10 条，字符串 / 数组 / `false` 的 style 合并与属性优先契约）、[tests/components/floating-keyboard.spec.ts](tests/components/floating-keyboard.spec.ts)（7 条，Enter / Space / 分层 Escape）。

### 9.3 第四批已知缺陷清单（已修复，与浏览器层同分支）

| 编号 | 位置                                                                                  | 原现象                                                                                                                                          | 根因                                                                                                            | 修复                                                                                                                                                                              | 回归用例                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-29 | Button                                                                                | `type` 的默认值链里读 `globalConfig?.value.type`，而 `UiGlobalConfig` 与 ConfigProvider 只声明并 provide `size`，`spec.mjs` 也没有 `type`       | 全局配置的契约只有 size，按钮却预留了一条永远取到 `undefined` 的死分支，读代码会误判"全局可以治理按钮类型"      | `button/core.ts` 的类型链改成"属性 → 按钮组 → 缺省"，并就地注释                                                                                                                   | 无可观察行为差异，不新增用例；由 §9.2 的属性落盘扫描保证 ConfigProvider 不再被误当成 type 来源                                                             |
| F-30 | `shared/component.ts` 及 button / scrollbar / table / virtual-list / popover / popper | 宿主写 `style="width: 220px"`，真浏览器一进页面就抛 `TypeError: Failed to set an indexed property [0] on 'CSSStyleDeclaration'`，整棵子树不渲染 | 合并样式用对象展开 `{...attrs.style}`，字符串被摊成 `{0:'w',1:'i',…}`；happy-dom 静默吞掉数字键，612 条用例全绿 | `shared/utils.ts` 新增 `mergeStyles()`（字符串按 `;` 拆声明、数组递归、对象跳过 `nil`/`false`），7 处调用点全部换成它                                                             | 浏览器层 attributes.spec（全导出扫字符串 style，任何组件抛错都点名）+ 单元层 style-attrs.spec（`width` 必须落到根节点，附带数组 / 对象混写与 `false`）     |
| F-31 | Select、Message、Notification                                                         | `spec.mjs` 对外声明了 `id`，但页面上 `document.getElementById` 取不到节点                                                                       | `id` 被声明成 prop 之后不再走 attrs 透传，而这三处没有显式落盘；单测里只断言了类名与文本，取不到 id 无人察觉    | Select 触发区写 `id`（combobox 节点才是可被 label / aria 引用的目标），Message / Notification 在 `attrs` 钩子里补 `id`                                                            | attributes.spec「声明了 id 属性的组件，挂载后 document.getElementById 必须命中」：以 `spec.mjs` 为清单逐个挂载回查，声明与实现从此不能再脱钩               |
| F-32 | `shared/behavior.ts` 的 `triggerConfig`                                               | Dropdown / Popover / Tooltip 的触发器是带 `tabindex` 的 `div`，Tab 到位后按 Enter 或 Space 没有任何反应                                         | 触发器只挂了 `click` / `mouseenter`，纯 `div` 对键盘是死的；`page.hover` 一类的鼠标用例永远覆盖不到这条路径     | `attrs` 补 `onKeydown`：Enter / Space 走 `state.toggle()` 并 `preventDefault`；焦点落在 `button / a / input / select / textarea / [role=button]` 内层时不接管，避免一次按键切两下 | a11y.spec「聚焦在下拉触发器上按 Enter 展开面板，aria-expanded 同步」「Space 关闭已展开的面板」+ 单元层 floating-keyboard.spec 的 span 触发器与原生按钮两条 |
| F-33 | `shared/behavior.ts` 的 `triggerConfig`                                               | 面板用 Enter 打开后，按 Escape 不收回；对话框有这条通路，触发型浮层没有                                                                         | Escape 只在 `overlayConfig`（Dialog / Drawer / Image）里接，`triggerConfig` 完全没有键盘关闭                    | 引入模块级 Escape 登记栈：展开时入栈、收起或卸载时出栈，一次按键只交还栈顶那层，嵌套浮层不会被一键全关；`closeOnPressEscape === false` 时不登记                                   | floating-keyboard.spec「两层浮层同屏时一次 Escape 只收起最后打开的那层」「全部卸载后 Escape 不再触达组件」+ a11y.spec 的下拉与对话框两条                   |

### 9.4 交付说明与已知限制

行为变化只有两处，且都是"补齐键盘通路"：触发型浮层现在响应 Enter / Space 开合，以及 Escape 收起栈顶浮层；依赖"按 Enter 不展开"的宿主写法需要复查。`style` 的路由口径同步写进文档与用例：Aside 的宽度由 `width` 属性决定、Popover 的 `style` / `className` 落到面板，这两点在 attributes.spec 里以白名单形式钉住并写明理由，新增同类例外必须附理由才会被放行。

配套改动：`tsconfig.tests.json` 把 `tests/**` 与三份 vitest 配置纳入 `npm run typecheck`（先取 `strict: false` 的宽松档，拦拼写与 DOM 类型误用）；`eslint.config.mjs` 与 `.gitignore` 同批忽略 `_scratch/`、`.trae-html-share-packages/`，临时探针不再污染 lint；本地截图脚本顺带过了一遍 `eslint --fix`（该脚本已在 C7 删除）。体积影响：`dist/full/ui-kit.js` 641367 B（较上一批 +914 B，来自 `mergeStyles` 与键盘 / Escape 通路），CSS 250588 B 不变。

仍存在的缺口，按重要性排列：没有 CI 与提交钩子，`npm run quality` 目前靠本地自觉执行；布局基线只比几何矩形不比像素，且非本机平台自动跳过；浏览器层 8 个文件串行执行约 15 s，profile 只验 `dist/full` 的运行时，另外 19 份产物仍只有结构与体积证据；覆盖率未设阈值门禁；真实设备（触摸、输入法、异构字体）未纳入。

<a id="s10"></a>

## 10. 第五批交付（全 profile 运行时校验 + 门禁阶段化与提交钩子，分支 `feature/20261107-every-profile-runtime`）

§9.4 里排在第三位的缺口——"profile 只验 `dist/full` 的运行时，另外 19 份产物仍只有结构与体积证据"——本批补齐；同时把"靠本地自觉执行 `npm run quality`"换成机制。

### 10.1 门禁清单（第五批时九段，第七批起十段，构建流水线优化后十一段，第八批起十二段，第九批起十三段）

`npm run quality` 与 `npm run ci` 现在是同一条命令（`node scripts/ci.mjs`）：先统一构建一次，再依次跑格式 → 类型（库 + 用例）→ lint → 库级校验 → 治理校验 → 组件用例 → 构建器侧契约 → **20 份 profile 运行时** → 真实浏览器层 → **视觉体检** → **源码覆盖率阈值** → 消费方校验。runner 可以只看退出码与机读的 `ci-report.json`（已 gitignore）判定，不必 grep 终端输出。

| 段落       | 命令                                   | 说明                                                                                                                    |
| ---------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 秒级五段   | `npm run ci:fast`                      | 格式 / 类型 / lint / 库级校验 / 治理校验，`.githooks/pre-commit` 就是它                                                 |
| 全量十三段 | `npm run ci`                           | 先统一构建一次，后续各层复用，含四层用例、视觉体检、源码覆盖率、profile 运行时与消费方校验，`.githooks/pre-push` 就是它 |
| 单段       | `node scripts/ci.mjs --stage profiles` | 只跑名字命中的阶段，便于定位（该段仍会自行构建）                                                                        |
| 装钩子     | `npm run hooks:install`                | `git config core.hooksPath .githooks`，一次即可；`SKIP_HOOKS=1` 留逃生门                                                |

### 10.2 profile 运行时用例（`tests/profiles/**`，142 条）

| 断言                                                       | 抓的是什么                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 全部导出挂得起、零异常，且渲染出真实节点的导出数不低于阈值 | 裁剪把组件代码切断了（例如特性依赖没跟着进来）                                         |
| 挂载过程不产生与裁剪无关的控制台告警                       | 产物内部运行时报错，happy-dom 下静默失败的那类                                         |
| 类名前缀完全隔离，品牌产物里不残留 `ui-` 默认前缀          | 前缀改写漏点，宿主换主题时样式互相打架                                                 |
| 组件根类名与元素类名在自家 CSS 里有规则                    | JS 发了类名而 CSS 被裁掉，页面变成裸 HTML                                              |
| 同特性集组件在每份产物里的标签 + 类名骨架与 `full` 一致    | 裁剪顺带改了 DOM 结构；特性集不同则不比对（关掉 popper 的 Badge 少一个类名是正确结果） |

支撑件 `tests/profiles/_load.ts`：从 `dist/<profile>/package.json` 的 `uiKit.prefix` 与 `uiKit.components` 取前缀与特性清单，动态 import 该产物并逐个 `mount`；`normalizePrefix` 先换前缀再排序，否则 `antd-switch` 与 `ui-switch` 会因首字母不同排到不同位置，比出来的"结构漂移"其实只是类名顺序。

### 10.3 第五批已知缺陷清单

| 编号 | 位置                               | 现象                                                                       | 根因                                                                                                                | 状态                                                                                                                                                                                           |
| ---- | ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-34 | 仓库 git 配置 / `.prettierrc.json` | 换一台机器全新 clone 后 `npm run quality` 第一段就红：144 个文件格式不合规 | `core.autocrlf=true` 把签出文本变成 CRLF，而 `endOfLine: "lf"` 不容许；门禁此前只在"本机首次构建出来的工作树"上成立 | 已修：新增 `.gitattributes`（`* text=auto eol=lf` + 二进制标注）并全仓 renormalize，main `539877a`                                                                                             |
| F-35 | `countdown/core.ts:110`            | 发出 `ui-countdown__time` 类名，20 份产物里没有任何一条规则选中它          | 时间文本从未有过专属样式，数字抖动时宽度会跳                                                                        | 已修：`countdown/core.css` 补 `.ui-countdown__time { font-variant-numeric: tabular-nums }`（与 `__value` 继承值一致，浏览器层 42 条与布局基线全绿，证明零渲染变化），`DEAD_CLASS_NAMES` 已清空 |
| F-36 | `watermark` 核心                   | `ui-watermark__layer` 同样是死类名                                         | 图层靠内联样式定位，类名只是占位                                                                                    | 已修：`watermark/core.css` 补 `.ui-watermark__layer { user-select: none }`，图层类名成为可覆写的真实落点（分支 `fix/20261107-dead-class-names`），`dead-classes` 守卫转绿                      |

同批还发现 `ui-rate__icon--void` 无独立规则，但状态修饰类允许由基础规则兜底（Alert 的默认 `effect=light` 同理），不计入缺陷，用例也只对 `前缀-组件` 与 `前缀-组件__元素` 两类结构性类名要求样式覆盖。

### 10.4 交付说明与仍存的缺口

新增一层不改变任何产物内容：`sizes.json` 与 20 份 `dist/**` 在本批未动。九段门禁在本机一次跑通的体量约为组件层 30 s + 构建器层 15 s + profile 层 20 s + 浏览器层 60 s。

仍存在的缺口：布局基线仍只比几何矩形不比像素；覆盖率仍未设阈值门禁；真实设备（触摸、输入法、异构字体）未纳入；`ci.mjs` 目前只在本机与钩子里生效，仓库还没有服务端 runner——Gitee 上这两个 Issue 的评论功能处于关闭状态，`PATCH /repos/.../issues/{number}` 对这类 Issue 返回 404，结案的评论需要开 Issue 评论权限或改用 Web 界面补。

> 前两条已在第七批补上（像素基线 + 覆盖率阈值，见 §12）；其余仍然有效。

<a id="s11"></a>

## 11. 第六批交付（63 个组件目录全量接入用例，分支 `feature/20261107-tests-batch6`）

§7 里"剩余未接入单元用例的组件"这类欠账，本批一次性抹平：`packages/ui-kit/src/components/` 下 90 个组件目录，此前 27 个有专属用例，本批补齐其余 63 个（含内部件 Slot、OnlyChild 一类无根节点的特殊件）。四路并行产出，逐文件跑绿后汇总。组件层用例从 30 文件 629 条扩到 94 文件 1576 条（其中 6 条是浏览器层覆盖的占位 `it.skip`；收口时已落地为 `tests/browser/sticky.spec.ts` 的真实用例，见 §11.5，最终 1570 条全通过），90 个组件目录全部有专属 spec。同批新增 `tests/profiles/props-documented.spec.ts`：把「运行时真实生效的 props 必须能在 spec.mjs 的 coreProps / feature props 里找到，字典里声明的 props 运行时也必须存在」做成贯穿 20 份产物的双向守卫。

### 11.1 第六批前期缺陷清单（F-37 / F-38）

| 编号 | 位置                   | 现象                                                                                           | 根因                                                                                                                                                                                                                                                      | 修复                                                    | 回归用例                                                                                                                                                                     |
| ---- | ---------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-37 | `segmented/core.ts:9`  | 不传 `modelValue` 时，`value: false` 的选项初始就挂上 `is-active` 与 `aria-checked=true`       | `modelValue: { type: [String, Number, Boolean] }` 没写 `default`，Vue 把缺失值归一成 `false`，与 `spec.mjs` 声明的 `default: null` 相悖；这是 F-2 / F-4 / F-13 / F-14 的同一类坑第 5 次出现                                                               | 显式补 `default: undefined`，保住"没传就是没传"         | [tests/components/segmented.spec.ts](tests/components/segmented.spec.ts)「未受控（不传 modelValue）时不应有任何选项高亮」，守卫已从 `it.fails` 降级为常规用例                |
| F-38 | `select-v2/core.ts:17` | 不传 `modelValue` 时占位符不显示，且 `value: false` 的选项被当成已选中（触发区直接回显「否」） | `modelValue: { type: [Array, String, Number, Boolean, Object] }` 没写 `default`，Vue 的布尔转换把缺省值归一成 `false`；而 `core.ts` 的判空只认 `undefined / null / 空串`，于是 `false` 被当作真实选中值。F-2 / F-4 / F-13 / F-14 / F-37 同类坑第 6 次出现 | 显式补 `default: undefined`，并加一条跨组件静态扫描守卫 | [tests/components/model-value-boolean-cast.spec.ts](tests/components/model-value-boolean-cast.spec.ts)（5 条：静态扫描、产物 props、未受控 / 显式 false / 受控切换三档渲染） |

### 11.2 属性声明全量审计（Boolean 联合类型归一）

F-37 不是孤例，所以本批把同一类坑整体扫了一遍：解析 90 个组件 `core.ts` 里所有 `type: [...]` 声明，挑出「联合类型中出现 Boolean 且未写 `default`」的 prop，共 16 条，逐条判定：

| 分组                                                                                                                                                                                                                                           | 数量 | 判定                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue` 受控值通道（SelectV2）                                                                                                                                                                                                            | 1    | 缺陷 F-38，已修                                                                                                                                                                           |
| `class` / `style` 透传位（AvatarGroup `collapseClass/Style`、Card `header/body/footerClass`、ColorPickerPanel `hueSliderClass/Style`、Countdown 与 Statistic `valueStyle`、Popover 与 PopperContent `style/className`、Slider `tooltipClass`） | 14   | 无害：`false` 与 `undefined` 经 `cn()` / `normalizeStyle()` 后渲染完全一致，实测无差异，留档不再复查                                                                                      |
| 选项值通道（`Option.value`）                                                                                                                                                                                                                   | 1    | 无害：`props.value ?? props.label` 名义上会被 `false` 短路，但选中匹配与点击 emit 都走 label 回退路径，实测 `modelValue=甲` 能高亮、点击只给 `label` 的选项 emit 的是「甲」而不是 `false` |

判定同时固化成会红的用例：`tests/components/model-value-boolean-cast.spec.ts` 的静态扫描要求任何 `modelValue` 声明只要类型联合里含 Boolean 就必须显式写 `default`，新组件再踩同一坑会在组件层直接失败。

### 11.3 第六批收尾缺陷清单（12 条，已全部修复）

新接入的 63 个组件在写用例的过程中又暴露了一批"声明与实现脱钩"的问题，全部按同一约定处理：先用 `it.fails` 守卫记录 → 修源码 → 守卫降级为常规用例。

| 编号 | 位置                       | 现象                                                                                | 根因                                                                                                         | 修复                                                                                            | 回归用例                |
| ---- | -------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------- |
| F-39 | Link、Result               | 传 `tag="span"` / `tag="section"` 不换标签，只把无效属性漏到 DOM 上                 | 两处 `tag` 读取都写在 `tag: (props) => …` 里，但 props 表从未声明 `tag`，值只进 attrs                        | 两处 core props 补 `tag: { type: String }`（无 default，保住"没传就用默认标签"），spec.mjs 同步 | link.spec / result.spec |
| F-40 | DatePickerPanel            | `type: 'month'` 提交 `2026-03-01`、`type: 'year'` 提交 `2022-01-01`                 | `outputFormat()` 只读 `valueFormat / dateFormat`，缺省恒为 `YYYY-MM-DD`，没按粒度收敛                        | 缺省输出按 `gridType()` 分支：月 `YYYY-MM`、年 `YYYY`、日 `YYYY-MM-DD`                          | date-picker-panel.spec  |
| F-41 | Slider popper 特性         | 垂直滑块的气泡仍贴顶部（`is-top`），而不是右侧                                      | 特性声明给 `placement` 设了 `default: 'top'`，`behavior.ts` 里 `vertical ? 'right' : 'top'` 的兜底永远走不到 | 去掉 default，改为缺省 `undefined`；spec.mjs 的 default 同步为 `null`                           | slider.spec             |
| F-42 | `shared/behavior.ts` range | 低位从 20 拖到 30 后，`change` 仍回吐 `[20, 60]`                                    | `onChange` 读的是 props 派生的 `rangeLow / rangeHigh`，父层尚未回写时落后一拍                                | `onChange` 改读原生输入框当前值并做 min/max 归一                                                | slider.spec             |
| F-43 | ColorPickerPanel           | `predefine: ['red']` 点选得到兜底蓝 `#409eff`                                       | `parseColor` 只认 `#` / `rgb()` / `hsl()`，颜色名直接落兜底                                                  | 兜底前加 `chroma.valid` 分支（与 ColorPicker 同源依赖），颜色名归一为 RGBA                      | color-picker-panel.spec |
| F-44 | InputTag                   | `trigger: 'Both'` 按空格不提交，退化成只认 Enter                                    | `Both` 在映射表里是 `null`，`TRIGGER_KEY_MAP[...] ?? 'Enter'` 把 null 当成缺省值，`null` 分支永不可达        | 改为 `in` 判键存在，null 分支按 "Enter 与空格都提交" 处理                                       | input-tag.spec          |
| F-45 | PopperContent              | `className` 完全丢失                                                                | `attrs` 返回的 `class` 被 `component.ts` 用宿主 `attrs.class` 重建的 class 数组覆盖                          | `className` 改走 `classes` 合并（字符串 / 数组 / 对象 / 布尔四档归一）                          | popper.spec             |
| F-46 | PopperContent              | `content / label / title` 只落到 HTML 属性，面板内无文本                            | props 表未声明这五个内容位，`content()` 的回退链读到的全是 `undefined`                                       | props 表补 `content / label / title / description / value`，spec.mjs 同步                       | popper.spec             |
| F-47 | SelectV2                   | 非过滤态下焦点在触发器按 Escape 不收起面板                                          | Escape 只绑在面板上，面板是触发器的兄弟节点，键盘事件到不了                                                  | 触发器 `onKeydown` 补 Escape → `hideDropdown()`                                                 | select-v2.spec          |
| F-48 | TreeSelect                 | 触发器 `tabindex=0` 可聚焦，但 Enter / Space 无任何反应                             | 触发器只挂了 `onClick`，没有键盘通路                                                                         | 触发器补 `onKeydown`：Enter / Space 开合、Escape 收起                                           | tree-select.spec        |
| F-49 | CheckTag                   | `type` 声明了 primary / success / info / warning / danger，但任意值都不产生修饰类名 | `classes` 只拼了 `is-checked` / `is-disabled`，从未消费 `type`                                               | 四个有独立配色规则的变体发 `ui-check-tag--{type}`；primary 走基础规则，不造无样式规则的死类名   | check-tag.spec          |
| F-50 | Notification               | 传 `modelValue=false` 不会隐藏，值只漏成属性                                        | `overlayConfig` 以 `modelValue` 为可见性通道，但组件 props 表没声明它，`resolveVisible` 永远取缺省 `true`    | props 表补 `modelValue: { type: Boolean, default: true }`，spec.mjs 同步                        | notification.spec       |

另有一条复核后判定"不是缺陷"：Popconfirm 的 `hideAfter` 只在触发器 `mouseleave` 后延迟收起，确认 / 取消按钮点击立即关闭——与 Element Plus 口径一致，`spec.mjs` 的描述没写清作用范围。守卫已改为契约用例，明确"按钮路径不受 `hideAfter` 影响"。

### 11.4 交付说明

- 探针清零：本批遗留的 12 个 `_probe_*.spec.ts` 全部删除，`tests/components/` 只保留正式用例。
- 产物变化来自 F-39…F-50 的源码修复，`npm run build:all` 重新生成 20 份产物与 `sizes.json`；`examples/consumer/src/demo/meta.json` 随 `meta:demo` 同步。
- 门禁：组件层 94 文件 1570 条全部通过（无占位跳过）；构建器层 7 文件 89 条、profile 运行时 2 文件 142 条、浏览器层 10 文件 58 条、`verify` 2239 项全部通过。
- 用例工程 `tsconfig.tests.json` 的 15 条类型基线（affix / autocomplete / breadcrumb / cascader / collapse / roving-focus-group / space）已全部清零，`npm run typecheck` 两份工程均无输出。

### 11.5 六批次与缺陷收口

| 批次   | 交付内容                                                       | 分支                                      | 缺陷                       |
| ------ | -------------------------------------------------------------- | ----------------------------------------- | -------------------------- |
| 首批   | 13 个测试文件 258 条，核心组件行为与属性                       | `feature/20261106-component-tests`        | F-1…F-18，另开修复分支     |
| 缺陷修 | `it.fails` 守卫全部降级为常规用例                              | `fix/20261106-component-defects`          | F-1…F-18 修复与回归        |
| 第二批 | 15 个组件 319 条 + 守卫降级，28 文件 612 条                    | `feature/20261106-component-tests-batch2` | F-19…F-25，修复分支并行    |
| 第三批 | 构建器侧 6 文件 68 条：裁剪、令牌、体积、类型                  | `feature/20261107-tests-batch3`           | F-26、F-28 修复；F-27 记录 |
| 第四批 | 真实浏览器层 8 文件 42 条 + 统一门禁 `quality`                 | `feature/20261107-quality-gate`           | F-29…F-33                  |
| 第五批 | 20 份 profile 运行时 2 文件 142 条 + 阶段化 runner 与钩子      | `feature/20261107-every-profile-runtime`  | —                          |
| 第六批 | 63 个组件目录全量接入，94 文件 1576 条；属性字典双向回查 41 条 | `feature/20261107-tests-batch6`           | F-39…F-50                  |
| 收口   | 15 条类型基线清零、格式与 lint 归零、全部合入 `main`           | `main`                                    | F-34…F-38（前批遗留）      |

- 前六批共记录 50 条缺陷（F-1…F-50），全部已修复且都留有会红的回归用例；守卫文件 `tests/findings.spec.ts` 已随修复删除，不允许以 `it.fails` 长期挂账。后续第七批、特性-属性修复与构建流水线优化新增的缺陷见 §12、§13、§14、§15。
- 15 条分支（8 条 `feature/*`、7 条 `fix/*`）全部已合入默认分支 `main`，合并后 `git branch --merged main` 覆盖全部分支；Gitee 侧 issue（IKTJSG、IKTJS5）均为 closed，PR #1、#2 均为 merged，无遗留待办。
- 收口后的门禁基线：组件层 94 文件 1570 条、构建器层 7 文件 89 条、profile 运行时 2 文件 142 条、浏览器层 10 文件 58 条、`verify` 2239 项、消费方正反向类型与运行时校验，合计 1859 条用例；另有覆盖率层在同一批组件用例上重放并卡阈值（不重复计入条数，见 §12）。
- 原先把 affix / backtop / tour 的 6 条 `it.skip` 占位（注释写着"归 tests/browser/\*\*"）全部落地为真实浏览器用例 `tests/browser/sticky.spec.ts`，组件层从此没有占位跳过。

<a id="s12"></a>

## 12. 第七批交付（覆盖率阈值 + 像素基线，分支 `feature/20261107-coverage-pixel-baseline`）

§10.4 留下的两个缺口——"覆盖率没有阈值门禁""布局基线只比几何不比像素"——本批一并补齐；顺带修掉一个工具链缺陷 F-51：`test:coverage` 脚本从写下那天起就没装过 coverage provider，真跑必失败。

### 12.1 覆盖率层：把同一批组件用例在源码入口上重放

直接给主配置加 `--coverage` 只能统计到 `dist/full/ui-kit.js` 这一个 bundle 的行覆盖——数字再高也说不出"哪个组件没被测到"。本批新增 `vitest.coverage.config.ts`：仍跑 `tests/components/**` 的同一批用例，但把 `@ui-kit-full` 指向 `.build/full/entry.ts` 源码入口。full profile 下产物与源码前缀同为 `ui-`、特性全开，1570 条用例在源码上逐条重放全过——这本身就是"产物与源码行为同构"的旁证。

| 项目     | 说明                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| 统计范围 | `packages/ui-kit/src/**/*.ts`，`all: true`（没被 import 的文件也进分母，删用例不能虚高） |
| 实测基线 | statements 88.35%（21031/23802）、branches 84.78%、functions 89.20%、lines 88.35%        |
| 阈值     | statements 87 / branches 83 / functions 88 / lines 87，只允许往上走                      |
| 输出     | 终端摘要 + `coverage/coverage-summary.json`（已 gitignore）                              |
| 接入门禁 | `npm run test:coverage` 成为第十段                                                       |

阈值可失败已验证：临时把 statements 抬到 99% 时 Vitest 打印 `ERROR: Coverage for statements (88.35%) does not meet global threshold (99%)` 并以非零码退出。

### 12.2 像素基线：6 个场景页的首屏截图

几何指纹只比矩形，颜色、字号粗细、圆角、阴影、图标缺失这些纯视觉漂移它看不见。新增 `tests/browser/_pixels.ts` + `tests/browser/pixels.spec.ts`，复用 `_geometry.ts` 的场景表（floating / table / tree / color / a11y / gallery），在 1280×720 视口下截首屏逐像素对比。

- **防误报**：基线按平台分桶（`tests/browser/__snapshots__/pixels/<platform>/`，当前提交 win32 的 6 张 PNG，合计约 136 KB）；`includeAA: false` 忽略抗锯齿像素；容差 0.1%（1280×720 下约 921 像素）。
- **确定性**：`openScene` 新增 `fixedTime` 选项，用 `page.clock.setFixedTime(2026-06-15T10:30:00)` 只冻结 Date、不动 setTimeout / rAF，日期类组件不再随"今天"漂移；截图前停掉 CSS 动画与过渡、复位滚动与鼠标、等字体与两帧。
- **录入**：`npm run snap:pixels`（`scripts/update-pixel-snapshot.mjs`），与 `snap:layout` 同一模式。
- **失败信息**：直接给出差异像素数、比例与差异图路径（`shots/pixels-diff/<platform>-<scene>.png`，已 gitignore）。
- **可失败已验证**：把 `color.png` 临时换成 `floating.png` 后立即报 `6952/921600 像素不同（0.754%，上限 0.1%）` 并落差异图，恢复后转绿；同一基线连续两次运行 0 差异。
- **防静默跳过**：另有一条守卫断言"当前平台要么没录基线，要么 6 个场景齐全"，避免只录一半导致部分场景永远跳过。

### 12.3 第七批缺陷清单

| 编号 | 位置                | 现象                                               | 根因                                                                             | 修复                                                                                       |
| ---- | ------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| F-51 | `package.json` 脚本 | `npm run test:coverage` 直接失败，覆盖率长期不可用 | 只有脚本没有 provider 依赖，`@vitest/coverage-v8` 从未安装                       | 安装 `@vitest/coverage-v8`（对齐 vitest 3.2.7），补 `vitest.coverage.config.ts` 与阈值门禁 |
| F-52 | `README.md:11`      | 调试台写"91 个组件的场景预设"，实际 90 个          | `meta:demo` 产出的 `components` 与 `dist/full/meta.json` 都是 90，文档多算了一个 | 改为 90，并以 `examples/consumer/src/demo/meta.json` 为唯一口径                            |

门禁从九段变十段：`scripts/ci.mjs` 的 STAGES 增加 `test:coverage`（在 `test:browser` 之后），`npm run quality` 与 pre-push 钩子自动包含。

<a id="s13"></a>

## 13. 缺陷修复：特性-属性归属（分支 `fix/20261107-prop-attribution`）

第七批把属性字典的双向守卫收紧到"已启用特性"口径后，暴露出四组把 core prop 记在特性名下的归属错误：这些 props 在组件 `core.ts` 里无条件声明、core 产物里也真实存在，字典却只挂在某个可被裁掉的特性上。后果有两层——开关关掉后属性仍在运行时，但生成的 `index.d.ts` 不再声明它；正向守卫用"任意特性"放行，等于让被关掉的特性替 core prop 背书，再丢也没人发现。

| 编号 | 位置                                      | 现象                                                                   | 根因                                                                                                                                         | 修复                                                                          |
| ---- | ----------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| F-53 | message / skeleton / steps / tree 的 spec | 4 条 core prop 记在特性名下，特性关闭后 d.ts 缺声明而运行时仍有该 prop | `showClose`、`loading`、`icon`、`checkStrictly` 在 `core.ts` 已无条件声明，spec 却重复记在 `closable` / `loading` / `icons` / `selection` 上 | 四条移入对应 export 的 `coreProps`，特性 props 置空或只保留真正由特性提供的项 |

守卫同步收紧：`tests/profiles/props-documented.spec.ts` 的正向检查从"coreProps 或任意 feature"改为"coreProps 加上本 profile 已启用的特性"，与反向完全同口径；原先为这四条开的后门注释一并删除。修复后 20 份 profile 的正反向守卫全绿，`index.d.ts` 与运行时 props 重新一一对应。

<a id="s14"></a>

## 14. 构建流水线优化（分支 `perf/20261107-build-pipeline`）

第七批之后 `npm run quality` 一次要跑 22 分钟以上，其中绝大部分不是断言，而是重复构建：`build:all` 每次产出 20 份正式 profile + 178 份「full 去掉某特性」的试算产物（合计 198 份），而 `quality` 串行调用 `verify`、`test:build`、`test:profiles` 各自的前置钩子，把这一轮构建重复了三次（约 600 份包）；试算产物还曾写进 `dist/`，中断时会在构建器界面里留下上百个 `feat-*` 包。

| 编号 | 位置                                                        | 现象                                                                              | 根因                                                                                                   | 修复                                                                                                                                                                                       |
| ---- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-54 | `scripts/build-all.mjs` / `package.json` / `scripts/ci.mjs` | `quality` 一轮重复构建三次，单次 22 分钟以上；试算产物混入 `dist/` 且中断后不清理 | 各层用例用 `pretest` 各自触发 `build:all`/`build:full`；试算产物直接写到 `dist/<name>`；无缓存、无并发 | 门禁改为"先 build 一次，后续切 `verify:reuse` 与 `test:*:run`"；试算产物移入 `.build/feature-deltas/` 并在 `finally` 清理；178 条边际值按源码 sha1 缓存；20 份 profile 与试算池按 6 路并发 |

四层改动：

1. **单次构建**：`npm run quality` 改为 `node scripts/ci.mjs`；STAGES 增加 `fullOnly` 的 `build` 段，并给 `verify` / 四层用例配 `fullScript`（`verify:reuse`、`test:unit`、`test:build:run`、`test:profiles:run`、`test:browser:run`、`test:coverage:run`）。只有全量模式且确实选中 `build` 时才用这些变体；`--fast` 与 `--stage` 单跑保持自给自足。
2. **内容哈希缓存**：`.build/feature-size-cache.json` 记录源码指纹（`packages/ui-kit/src`、`profiles`、`registry.mjs`、`build-lib.mjs`、`package.json`、`package-lock.json`、node/平台/架构）与 178 条边际值；指纹一致时跳过全部试算。`UIKIT_NO_BUILD_CACHE=1` 强制重算。
3. **并行池**：`os.availableParallelism() - 1`，上限 6 路；结果按 profile 顺序返回，保证 `sizes.json` 字节稳定（本次构建后 `sizes.json` 无 diff）。
4. **临时目录隔离**：试算产物写 `.build/feature-deltas/`，`try/finally` 连同 `.build/feat-*` 入口目录一起清理；构建开头清掉旧版本留在 `dist/` 与 `.build/` 的 `feat-*`；`dev-api` 的包列表防御性跳过 `feat-*`。

实测（本机 Ryzen 9 7950X）：冷启动 `build:all` 10 分 17 秒（20 份 profile 65.0 s + 178 份试算 551.4 s），源码未变时命中缓存 57 s；`npm run quality` 从三次全量构建收敛为一次，`verify` 段从 70.5 s 降到复用后的秒级。

新增守卫 `tests/build/build-hygiene.spec.ts`（6 条）：`dist/` 含全部 20 份 profile 且无试算残留（构建器 UI 生成的自定义包允许存在）、试算目录与 `.build/feat-*` 构建后为空、`sizes.json.features` 覆盖全部特性且为非负整数（正增量多于 100 条）、20 份 profile 元数据与 `sizes.json` 一一对应、缓存指纹是 40 位 sha1 且与本次 `sizes.json` 完全一致。构建器侧用例从 89 条增至 95 条。

<a id="s15"></a>

## 15. 第八批交付（场景缺陷闭环 + 治理校验，分支 `feature/20261107-scene-defect-closure`）

### 15.1 背景与机制

TimePicker 被外部指出有问题：F-16 把触发区从纯 `span` 换成真实 `<input>` 时，§7.2 自己写下的"依赖触发区不是表单控件的写法需要复查"一直没人复查。组件层 39 条用例全绿、浏览器层 TimePicker 0 条用例，于是"点输入框会收起面板""输入被面板旧值覆盖"这类问题既修不掉也测不出来。本批不靠补用例数量，而是把流程缺的三道闸做成机器判定。

| 闸         | 落地物                                                                        | 失败条件                                                             |
| ---------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 场景契约化 | `REQUIREMENTS.md` F-NN 登记                                                   | 守卫挂账却没登记，治理校验报红                                       |
| 必须先见红 | `tests/findings.spec.ts`（`it.fails`），常驻两份 vitest 配置的 include        | 未修代码上守卫全绿＝缺陷已复现；修完转红才允许降级                   |
| 影响面清单 | `scripts/verify-governance.mjs`                                               | 改 `shared/*` 而同族组件缺组件层用例；改交互代码而缺浏览器层场景用例 |
| 基线零漂移 | `snap:layout` / `snap:pixels` + 覆盖率四维阈值 + `KNOWLEDGE.md` §5.1 归因口径 | 除报障场景外任何漂移，或覆盖率阈值下降                               |
| 全链路归档 | `npm run quality`（十二段）                                                   | 任一段红                                                             |

治理校验成为门禁第六段：`package.json` 新增 `verify:governance` 并插入 `quality` 链，`scripts/ci.mjs` 的 STAGES 同步增加 `governance`（`fast: true`，pre-commit 也跑），pre-push 注释与 `KNOWLEDGE.md` 的段数口径同步。它做五件静态检查：影响面清单、特性裁剪静态守卫、文档数字与产物对齐（README 组件数 ↔ `examples/consumer/src/demo/meta.json`；quality 段数 ↔ STAGES ↔ KNOWLEDGE 标注）、缺陷编号唯一性与连续性、三处文档的缺陷总数口径。可失败已验证：把 README 的 90 临时改成 91，校验立即报 `README 组件数 91 与 demo/meta.json 的 90 不一致（F-52 复发）` 并以退出码 1 结束，恢复后转绿；编号守卫的可失败验证见 §15.6。

**并行编号冲突（本批真实发生两次）**：本批开工时主线停在 `e61b91c`（缺陷到 F-52、文档到 §12），先按 F-53…F-63、§13 登记。开发期间主线合入 `38db3d3`（`fix/20261107-prop-attribution`），占走 F-53 与 §13，本批第一次顺延为 F-54…F-64、§14；随后并行的 `perf/20261107-build-pipeline` 又占走 F-54 与 §14（构建流水线优化），第二次顺延为 F-55…F-65、§15。两次都由 `git fetch origin main` 与治理守卫的编号唯一性检查拦下，否则合入后同一编号会对应不同缺陷。收口时把"开新编号前先取主线最大编号、并确认其它在途分支的编号"写进 `KNOWLEDGE.md`，治理校验常驻守卫让撞号 / 断档 / 文档口径滞后在门禁第六段直接报红。

### 15.2 第八批缺陷清单

| 编号 | 位置                             | 现象                                                                        | 根因                                                                        | 修复 / 守护                                                                                                             |
| ---- | -------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| F-55 | `time-picker/core.ts`            | 面板已开时点输入框会收起浮层，无法连续键入                                  | `onClick: toggleSide` 挂在触发区 div 上，F-16 新增的 input 点击冒泡触发开关 | input 命中走 `openSide`（只开不关），其余区域仍 toggle；组件层 + 浏览器层各一条                                         |
| F-56 | `time-picker/core.ts`            | 键入草稿未回车就点列项，草稿被打开面板时的旧值覆盖，一次点击两次写回        | `commitDraft` 与 `applyTime` 各自基于不同状态，互不感知                     | 统一 `writeValue`（一次操作一次 emit + 乐观同步草稿），`adoptDraft` 让所有写回通道先并入草稿；blur 到面板内部时跳过提交 |
| F-57 | `shared/date.ts`                 | `abc1:2xyz` / `1:299` / `上午9:30随意` 被吞成合法时间提交                   | `parseTimeValue` 正则未首尾锚定                                             | 锚定；新增 `parseTimeText` 按显示格式回输；同族 time-select 的口径变更另有一条用例锁住                                  |
| F-58 | `time-picker/core.ts`            | 照着 `format: 'HH 点 mm 分'` 显示的内容键入无法提交                         | 显示 / 输入 / 输出三套格式没打通                                            | `parseTimeText(text, displayFormat)` 按 pattern 编译正则回输                                                            |
| F-59 | `time-picker/core.ts`            | `defaultValue` / `defaultTime` 只影响面板高亮，输入框空着且默认值永远写不回 | `displayAt` 只读 `modelValue`                                               | 抽 `initialPartsAt` 共用默认值链，显示与初始高亮同一来源                                                                |
| F-60 | `time-picker/core.ts`            | 区间写回一端带秒一端不带秒（`['03:24:00','18:30']`）                        | `applyTime` 只格式化被改的一端                                              | `writeValue` 用 `normalizeModelValue` 规范化两端；原先把混合格式当预期的用例已改正                                      |
| F-61 | `time-picker/core.ts`            | 清空后输入框仍显示旧值                                                      | `clearValue` 只 emit，不碰草稿                                              | 清空后同步两端草稿                                                                                                      |
| F-62 | `time-picker/features/clearable` | `clearable: false` 时 `--clearable` 类名仍挂                                | `className` 把恒真的默认 `clearIcon` 一起判进去                             | 只认 `clearable`；改正组件层错误预期，`feature-class-switch` 补一组正反断言                                             |
| F-63 | `shared/date.ts`                 | `format: 'hh:mm A'` 输出字面量 `hh:24 A`                                    | 格式化只支持 24 小时制 token                                                | 支持 `hh` / `h` / `A` / `a`；`hasSecondsToken` 取代 `includes('s')` 避免字面 s 误开秒列                                 |
| F-64 | `time-picker/core.ts`            | 构建时裁掉 `editable` 特性后输入框仍可键入                                  | `props.editable !== false` 把"特性未启用=undefined"当成可编辑               | 只认显式 `=== true`；由治理校验的全库静态守卫守护                                                                       |
| F-65 | `date-picker/core.ts`            | 与 F-64 同源，`canEdit` 同样用 `!== false`                                  | 全库静态扫描发现                                                            | 同样改为 `=== true`；静态守卫守护                                                                                       |

F-55…F-63 先在 `tests/findings.spec.ts` 以 9 条 `it.fails` 在未修代码上全部见红，修复后全部报 `Expect test to fail`，再降级为 `tests/components/time-picker-scenes.spec.ts` 的常规 `it` 并删除守卫文件。F-64 / F-65 属于构建期特性裁剪，运行时用例证不了，由 `verify:governance` 的常驻静态守卫覆盖。

**行为口径变更（有意为之，不是回归）**：触发区在写回后立即乐观同步本次操作，父组件回写仍由 `watch` 覆盖；原用例「此刻按钮写回当前时间但不收起面板」里"受控写法下展示值由使用方回写"的断言已改为验证乐观值 + 外部回写覆盖。这一步消除了"输入框显示 A、modelValue 却是 B"的背离。

### 15.3 全库静态扫描与审计结论

治理校验扫描 90 个组件目录的 feature 布尔 prop，凡在 `core.ts` 里被写成 `props.x !== false` 就报红。除 F-64 / F-65 外还有 5 处命中，逐条核实后分类如下；按约定"已审计但无害"也必须落盘，白名单项必须带编号且能在本文查到，否则门禁变红。

| 编号 | 命中                          | 结论                                                                                                                        |
| ---- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| A-1  | `avatar.teleported`           | `panel` 由 `avatar-group-popper` 特性提供，特性裁掉时 `panel` 为 null，`panel && ...` 短路，Teleport 分支根本不会执行，无害 |
| A-2  | `form.showMessage`            | 该 getter 缺省 true 与 core 默认展示校验消息一致；`form.validate` 特性裁剪后子项不再消费该 provide 值，无害                 |
| A-3  | `form.validateOnRuleChange`   | 同上，缺省 true 与默认行为一致，且只在校验规则变化时触发，裁剪后不产生额外能力，无害                                        |
| A-4  | `tooltip.enterable`           | 缺省 true 与 Tooltip 默认"鼠标可进入浮层"一致，`tooltip.popper` 特性裁剪后浮层由该特性决定，无害                            |
| —    | `date-picker-panel.clearable` | 误报：源码已有 `'clearable' in props &&` 存在性守卫，守卫已改为识别 `in props` 并跳过，不是缺陷                             |

### 15.4 产物与数字

- 组件层 95 文件 1582 条（原 94 / 1570）：新增 `time-picker-scenes.spec.ts` 9 条、`feature-class-switch` 2 条、time-select 同族口径 1 条，并把混合格式等被固化的错误预期改正。
- 浏览器层 11 文件 65 条（原 10 / 58）：新增 `tests/browser/time-picker.scene.spec.ts` 7 条与 harness 的 `time-picker` 场景；**没有**把新场景登记进 `_geometry.ts` 的 `ANCHORS`，避免像素基线完整性守卫因缺 PNG 误红。
- 门禁十二段，`scripts/ci.mjs` STAGES 与 `npm run quality` 段数一致；`KNOWLEDGE.md`、pre-push / pre-commit 注释同步。
- 缺陷 F-1…F-65 全部修复，守卫文件已删除，无 `it.fails` 长期挂账。

### 15.5 并行工作树的端口隔离

专属工作树与主工作树、其他并行任务同时开发时，根 dev server / 调试台 / guardian 巡检若都抢 5173 / 5174 / 5199，会互相把服务顶掉或让浏览器层连错实例。本批把三处端口收敛到 `scripts/worktree-ports.mjs`：优先读环境变量，其次读工作树根目录的 `.env.workbuddy`，都没有才回退到原默认值；`.env.workbuddy` 已加进 `.gitignore`，每个工作树各写各的，不进版本库。

- 主工作树：保持 5173 / 5174 / 5199，行为不变。
- WorkBuddy 专属工作树 `C:/WorkBench/ui-kit-builder-wb`：5273 / 5274 / 5299，已确认三个端口均空闲、5173 仍归主工作树。
- `tests/browser/_global-setup.ts` 的探针服务用 `port: 0` 随机取端口并把地址写进 `UIKIT_HARNESS_BASE`，不参与这套配置，天然不冲突。
- 三个消费方均已改为读取导出值：`vite.config.mjs`（根 dev）、`examples/consumer/vite.config.mjs`（调试台）、`tools/guardian/detectors/sweep.mjs`（巡检）；全仓已无 5173 / 5174 / 5199 的硬编码使用点，只在缺省值与注释里出现。

### 15.6 治理守卫的可失败验证与自身盲点修复

- 文档数字：临时把 README 的「90 个组件」改成 91 → 报 `README 组件数 91 与 demo/meta.json 的 90 不一致（F-52 复发）`，退出码 1；恢复后转绿。
- 编号撞号：临时在 REQUIREMENTS 追加一行重复的 `| F-55 |` → 报 `F-55 被定义两次（并行分支撞号，合入前必须顺延）`，退出码 1；删除探针行后恢复。
- 编号断档：第一次顺延后主线 F-53 尚未合入，守卫报 `缺陷编号断档：缺 F-53`；第二次顺延后构建流水线的 F-54 尚未合入，报 `缺 F-54`；两边都合入后转为「已登记 65 条，最大 F-65」且退出码 0。
- **守卫自身盲点（已修）**：初版用 `git diff`（只看未暂存）取改动面，开发者只要先 `git add`，影响面清单就会打印"本次无源码改动"后静默跳过。改为 `git diff HEAD`（未暂存 + 已暂存）与 `git diff HEAD -- <components>`，并对未跟踪的新 `core.ts` 按全文补扫交互关键字。同一批已暂存改动的前后对照：修复前跳过，修复后重新报出「shared/date.ts 同族 3 个组件」「time-picker 浏览器层 1 个文件」。
- **合并兼容性**：并行的构建流水线分支会把 `quality` 改成委托 `ci.mjs`、并新增统一 `build` 段。治理校验的段数判定同时认硬编码 `npm run` 链与委托形态；另外常驻一条「STAGES 必须含 `governance` 且 `package.json` 必须有 `verify:governance`」的守卫，避免合并 `ci.mjs` 时把治理段覆盖掉、让治理校验变成"没进门禁的脚本"。

<a id="s16"></a>

## 16. 第九批交付（视觉能力补齐，分支 `feature/20261107-visual-capability`）

### 16.1 报障与定性

外部用调试台截图指出：TimePicker 输入框里仍套着一个深灰矩形边框，与外层圆角容器构成"框中框"；而第八批结案时写的是"已修复、可避免"。**这个结论不合理，本批先认账再补机制。**

根因不是用例数量不够，而是整条验证链路没有视觉维度：

- 组件层 39 条 TimePicker 用例跑在 happy-dom，矩形恒为 0、没有 CSS 合成器，断言的是"抛了什么事件 / 改了什么草稿"；
- 浏览器层 `time-picker.scene.spec.ts` 7 条断言焦点链与写回序列，同样不看样式；
- 布局指纹只比矩形，像素基线把"录入那一刻的样子"当成真理——双层边框在基线录入前就存在，于是被固化成正确答案，之后永不报警；
- 助手没有主动查看组件外观的入口，只能凭断言绿就宣布"可避免"。

也就是说：前三层能防"逻辑回归"，防不住"本来就没画对"；补第 N 条用例也补不出视觉能力。用户问"还有什么要补"，补的是**能力**，不是用例。

### 16.2 缺陷清单

| 编号 | 位置                                                  | 现象                                                                                                                                        | 根因                                                                                                                                                                                                                                                                                                    | 修复 / 守护                                                                                                                                 |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| F-66 | `time-picker/core.css`、`features/editable/style.css` | 触发区圆角外壳里套着原生 `<input>` 的 2px 深灰边框、白色不透明底、2px 内边距与 Arial 字体，形成双层边框；文本相对图标内缩、字体与外壳不一致 | F-16 把触发区从 `span` 换成真实 `<input>` 时，`.ui-time-picker__value` / `__placeholder` 只写了 flex / 省略号，漏掉 `border: 0`、`background: transparent`、`padding: 0`、`font: inherit`、`appearance: none` 等原生外观复位；`controls.css` 的 reset 只覆盖 `.ui-input__inner` 等类名，不含 TimePicker | `core.css` 补齐完整复位 + `::placeholder` 口径；`editable/style.css` 承载 `cursor: text`；由 `audit:visual` 的 `nested-border` 规则常驻阻断 |

按约定做了全库同类扫描：视觉体检在真实 Chromium 里覆盖 **124 个导出组件 / 21 个可见原生控件**，逐条查计算样式与矩形；除 TimePicker 外没有第二处双层边框（`InputTag` 的 4px 内边距是标签间留白的设计，记为 warning 不阻断）。修复后复跑：**0 项阻断 / 1 项提示**，并逐张查看 `TimePicker` 元素图与 `?scene=time-picker` 首屏确认内框消失、图标 / 文本 / 箭头落回同一条容器。

### 16.3 补上的能力：视觉体检（`scripts/visual-audit.mjs`，门禁第十段）

不依赖任何基线，把"肉眼可见的丑"翻译成可计算契约：

| 规则             | 判定                                                         | 级别          |
| ---------------- | ------------------------------------------------------------ | ------------- |
| `nested-border`  | 组件内部原生控件自己画了可见边框，且祖先容器也画了边框       | error（阻断） |
| `opaque-fill`    | 内层控件背景不透明，与外壳底色叠成色块                       | warning       |
| `nested-padding` | 内层控件还有左右内边距，文本相对图标内缩                     | warning       |
| `font-mismatch`  | 内层控件字体与外壳不一致                                     | warning       |
| `clipped-text`   | 输入值宽超出可见宽且未省略                                   | error（阻断） |
| `render-gap`     | 组件没渲染根节点 / 声明数与渲染数或截图数不符 / 重点场景缺失 | error（阻断） |

同时产出**看得见的复核入口**（这是"视觉能力"的另一半）：`visual-report/shots/` 下 124 张逐组件元素截图 + 6 张重点场景首屏（`floating` / `table` / `tree` / `color` / `a11y` / `time-picker`），`visual-report/index.html` 是可直接打开的画廊，阻断项标红、写明命中规则与具体数值。截图前停掉动画 / 过渡 / 光标，整页只截一次再按文档坐标裁出逐组件图（初版逐元素截图 124 次要跑 278s，改后整段约十几秒），零尺寸组件写占位图并标注"默认态无内容"；画廊已 gitignore，每次体检重新生成。

**流程约定（写进 `KNOWLEDGE.md` §5.1 第 5 道闸）**：涉及样式改动，除了门禁全绿，必须跑 `npm run audit:visual` 并**亲眼看画廊对应的 PNG** 才能宣告修复；不许只凭断言绿就写"可避免"。助手侧用图像查看能力打开截图复核，修复前后各一次。

### 16.4 门禁与自守卫

- `package.json` 新增 `audit:visual`；`scripts/ci.mjs` STAGES 在 `test:browser` 之后插入 `visual` 段，门禁由十二段扩到**十三段**；`quality` 委托形态不变，段数由治理校验统一核对。
- `verify:governance` 新增视觉能力自守卫：STAGES 必须含 `visual` 且 `package.json` 有 `audit:visual`；`AUDIT_RULES` 不少于 6 条；`NON_VISUAL` 豁免清单必须覆盖 harness 的 `GALLERY_SKIP`；`FOCUS_SCENES` 每个场景都在 harness 的 `scenes` 登记；脚本必须按 error 数决定退出码。顺带修掉段数映射里 `十二段` 重复键（原本 `十一段` 写成了第二个 `十二段`）。
- 体检器自身反向守卫：豁免清单里的辅助组件（`CollapseTransition` / `Collection` / `OnlyChild` / `CollectionItem`）若哪天渲染出可见根节点，立即报 `render-gap` error，要求移出白名单接受正常体检，白名单不会变成藏缺陷的后门。
- 规则降噪：1×1 透明隐藏域（单选 / 复选的原生 input）不参与契约；默认态零尺寸不再算异常，只在画廊标注需到重点场景复核。

### 16.5 产物与数字

- 新增 `scripts/visual-audit.mjs`；改动 `package.json`、`scripts/ci.mjs`、`scripts/verify-governance.mjs`、`.gitignore`、三份文档与 TimePicker 两份 CSS。
- 视觉体检基线：124 组件 / 21 可见原生控件 / 124 张组件图 / 6 张重点场景图 / 6 条规则；修复前 1 项阻断（F-66）+ 4 项样式提示，修复后 0 项阻断 + 1 项提示。
- 门禁十三段，STAGES 与 `npm run quality` 段数一致；`KNOWLEDGE.md` 的「唯一门禁（十三段）」、README 与 pre-push 注释同步。
- 缺陷 F-1…F-66 全部修复，守卫文件已删除，无 `it.fails` 长期挂账。
- 用例数不变（组件层 95 文件 1582 条、构建器侧 8 文件 95 条、profile 2 文件 142 条、浏览器 11 文件 65 条）：本批交付的是门禁能力与复核入口，不是用例。

<a id="s17"></a>

## 17. 第十批：调试台产物隔离与视觉体检补齐消费方路径（F-67）

### 17.1 触发：把项目跑起来才看见的真相

用户问「项目有运行起来吗」，本批把可视化构建器（`5273`）与组件调试台（`5274`）真正启动，用真实 Chromium 打开 `#/c/time-picker` 复核第九批结论。结果 `.ui-time-picker__value` 的计算样式仍是 `2px inset rgb(118,118,118)` / 白底 / Arial / `appearance: auto` / `padding: 1px 2px` —— 用户截图里的双层边框**依然存在**。第九批的「已修复」只在源码与源码画廊里成立，用户实际评审的那个界面根本没吃到修复，用户此前的质疑成立。

### 17.2 根因：跨工作树的软链 + 体检只覆盖源码

`examples/consumer/node_modules/@demo/ui-kit-*` 是 `npm install` 按 `file:../../dist/<profile>` 生成的软链；在 WorkBuddy 专属工作树里，这些软链（连同 `examples/consumer/node_modules` 这个 Junction）指向主工作树 `C:/WorkBench/ui-kit-builder/dist/`，而主工作树由另一条工作流并行维护，其源码尚未包含第九批的 CSS 修复。于是：

- `src/demo/main.ts` 静态 import 的 4 份 `style.css` 与 `playground-preview.ts` 静态 import 的 5 份组件 JS，全部从主工作树的旧 dist 加载；
- `scripts/dev-api.mjs` 提供的 `/packs/<id>/…` 动态包反而正确指向本工作树 dist，两套来源混在同一页面；
- 第九批的 `audit:visual` 只体检 `tests/browser/harness`（Vite 直接编译源码 CSS），看不到 dist 产物，更看不到加载路径，所以十三段门禁全绿、界面依旧是旧样式。

结论：**视觉体检只做「源码现场」是不完整的**，必须同时体检「用户实际打开的界面」，否则「源码修了、产物没跟上 / 加载错产物」这类偏差没有监护人。

### 17.3 缺陷清单

| 编号 | 位置                                                            | 现象                                                                                                     | 根因                                                                                                 | 修复 / 守护                                                                                                                                                                                                                                             |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-67 | `examples/consumer/vite.config.mjs`、`scripts/visual-audit.mjs` | 第九批修掉 TimePicker 双层边框后，组件调试台里仍显示 2px 深灰内框、白底与 Arial 字体；门禁与源码画廊全绿 | `node_modules/@demo` 软链跨工作树指向主工作树旧 dist；视觉体检只覆盖源码 harness，没有覆盖消费方页面 | `vite.config.mjs` 用两条 `resolve.alias` 把 20 份 profile 的 JS / CSS 钉到本工作树 `dist/<id>/`；`visual-audit.mjs` 另起调试台服务，对 5 个含原生控件的组件页跑同一套计算样式契约并把截图 / 异常写进画廊；`verify-governance` 静态锁死 alias 与页面清单 |

### 17.4 修复与机制

1. **产物来源钉死**：`examples/consumer/vite.config.mjs` 新增 `distDir` 与两条 alias（`@demo/ui-kit-<id>/style.css` → `dist/<id>/ui-kit.css`；`@demo/ui-kit-<id>` → `dist/<id>/ui-kit.js`）。调试台不再依赖 `npm install` 时生成的软链指向，每棵工作树各消费自己的构建产物；`/packs/…` 动态包本来就从本工作树 dist 提供，两套来源归一。
2. **视觉体检第二现场**：`scripts/visual-audit.mjs` 在源码画廊之外另起一台调试台 Vite 服务（随机端口），用同一个 Chromium 打开 `#/c/time-picker`、`input`、`date-picker`、`autocomplete`、`input-number` 共 5 页，复用 6 条规则对可见原生控件做 `getComputedStyle` 体检；命中项以 `consumer/<页面>` 记入 `audit.json`，画廊新增「消费方真实界面」区块放 5 张页面截图。页面数 / 控件数不足即报 `render-gap` error，防止「页面没渲染出来也算绿」。
3. **会红验证（本批实证）**：往 `dist/full/ui-kit.css` 临时注入旧规则后跑体检，退出码 1，命中 `consumer/time-picker [nested-border]`，同时带出 `opaque-fill` / `nested-padding` / `font-mismatch` 三条提示；恢复产物后 md5 一致、体检回到 0 阻断。即「源码画廊全绿、调试台页报红」这条链路确实能抓到 F-67，不是摆设。
4. **治理自守卫**：`verify-governance.mjs` 静态核对调试台配置的 alias 未被删除、`CONSUMER_PAGES` 不少于 3 页且页面 id 都在 `demo/meta.json` 登记、体检器含 `inspectConsumerInPage` 与 `consumerServer`。与已有的 `visual` 段、规则集、豁免清单守卫并列，合并分支时不会把这层能力悄悄架空。

### 17.5 产物与数字

- 修复后调试台 `#/c/time-picker` 计算样式：`border: 0` / `background: rgba(0,0,0,0)` / `font: inherit` / `appearance: none` / `padding: 0`；真实页面截图已亲眼复核，内框消失、图标 / 文本 / 箭头落在同一条容器。
- 视觉体检基线更新为：124 组件 / 21 可见原生控件 / 124 张组件图 / 6 张重点场景图 / **5 个调试台页面 5 个控件 / 5 张调试台截图** / 6 条规则；整段约 11s（原 3.4s，多出的是第二台服务与 5 页加载）。
- 门禁仍为十三段，`audit:visual` 段名与位置不变；用例数不变（组件 1582 / 构建器侧 95 / profile 142 / 浏览器 65）。本批仍属能力层，不新增用例层断言。
- 缺陷 F-1…F-67 全部修复，无 `it.fails` 长期挂账。改动文件：`examples/consumer/vite.config.mjs`、`scripts/visual-audit.mjs`、`scripts/verify-governance.mjs`、三份文档。

<a id="s18"></a>

## 18. 第十一批交付（工程与测试优化 · B1：门禁短路与产物安全，分支 `feature/20261107-optimization-plan`）

### 18.1 背景与范围

`OPTIMIZATION_PLAN.md` 把 2026-11-07 全量审计的 37 项工程 / 测试 / 文档问题分成五批，B1 只做"会静默出错或被覆盖"的一类（计划书 §3 的 A1–A7、A9）。本批的判定标准不是"改完能跑"，而是三类故障都能在门禁里直接报红：人为制造构建失败、覆盖正式包、复用旧产物。

### 18.2 缺陷清单

| 编号 | 位置                                           | 现象                                                                           | 根因                                           | 修复 / 守护                                                                                                 |
| ---- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| F-68 | `scripts/dev-api.mjs`                          | `/api/build` 传 `name=full` 可直接覆盖 `dist/full` 这类正式产物                | 自定义构建直接写 `dist/<name>`，没有校验保留名 | 保留名来自 `profiles/*.json`，命中返回 409；自定义包统一写 `dist/custom/<name>`，返回体新增 `dir`           |
| F-69 | `scripts/build-all.mjs`                        | 特性负边际被夹成 `0`，与"真的没变"无法区分                                     | `delta()` 对四项差值取 `Math.max(0, …)`        | `delta()` 返回带符号差值，负值原样写入 `sizes.json`，构建日志给出负值提示                                   |
| F-70 | `scripts/build-all.mjs`                        | 删掉 profile JSON 后旧 `dist/<name>` 仍在，继续被 `/api/packages` 当成可安装包 | 构建前没有清理陈旧目录                         | 构建前清理"不在 `profiles/` 且不在 `dist/custom/`"的目录，先打印再删除                                      |
| F-71 | `scripts/build-all.mjs`                        | 改了边际算法后仍命中旧缓存，负边际继续被旧值覆盖                               | 特性缓存指纹没有包含 `scripts/build-all.mjs`   | 指纹输入补 `scripts/build-all.mjs`，改算法即全量重算                                                        |
| F-72 | `scripts/verify.mjs` / `scripts/build-all.mjs` | `verify:reuse` 只看 `ui-kit.js` 是否存在，改一行源码后仍复用旧产物             | 复用凭据只有文件存在性与 `sizes.json`          | `build:all` 落盘 `.build/build-fingerprint.json`；`loadBuiltResults` 校验源码指纹，不符返回 `null` 触发重建 |
| F-73 | `scripts/ci.mjs`                               | build 失败后仍继续跑后续阶段，二次报错掩盖真正的失败点                         | 循环只累计 `failed`，没有短路                  | `build` / `verify` 失败立即中断（`--keep-going` 可改为继续）；汇总与 `ci-report.json` 标记未执行阶段        |
| F-74 | `dist/` 自定义包                               | 自定义包名以 `feat-` 开头会被下一次构建当作试算残留删除                        | 清理逻辑按 `feat-*` 前缀扫描 `dist/`           | 自定义包进入 `dist/custom/` 命名空间，清理只针对 `dist/` 顶层目录且保留 `custom/`                           |

计划书 A7（`sameFeatures` 配对的死代码分支）属于构建口径收敛，不是缺陷：本批直接删除该分支，特性边际统一走"full 减去特性"的试算路径，`sizes.json` 全部 178 条都由同一套口径产出。

### 18.3 交付与数字

- 构建器层新增 `tests/build/dev-api.spec.ts` 4 条（保留名 409、非法 JSON 400、空选择试算、自定义包落盘与包列表回读）与 `tests/build/build-hygiene.spec.ts` 3 条（A4 指纹、A5 陈旧目录判定、A6 有符号 delta）。
- 门禁十二段（本批未动 `STAGES` 条目；与主干的视觉体检段合并后为十三段）；`ci-report.json` 新增 `abortedBy` 与 `skipped` 字段，短路时汇总用 `· 未执行` 标记后续阶段。
- 缺陷 F-1…F-74 全部修复；B1 交付时三处口径同步为 74 条（B2 继续追加 F-75…F-80）。

<a id="s19"></a>

## 19. 第十一批交付（工程与测试优化 · B2：构建缓存与清单单一来源，分支 `feature/20261107-optimization-plan`）

### 19.1 背景与范围

B2 承接 B1 的指纹机制，把"每次门禁都像冷启动"的构建成本压下来：特性边际缓存从全局单键改成组件级分键、profile 产物加缓存、`--fast` 走指纹复用、注册表进程内只加载一次，并把 profile 清单 / 展示名 / 消费方依赖收敛到 `profiles/*.json` 一个来源（计划书 §3 的 A10、C1–C4、C11）。

### 19.2 缺陷清单

| 编号 | 位置                                                                                                                  | 现象                                                                                           | 根因                                    | 修复 / 守护                                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| F-75 | `scripts/build-all.mjs` / `scripts/dev-api.mjs` / `scripts/generate-demo-meta.mjs` / `examples/consumer/package.json` | profile 清单、展示名、消费方依赖各维护一份，新增 profile 要改 4 处，`chinese` 一直没进示例工程 | 清单靠手写数组与包名表                  | 新增 `scripts/profile-catalog.mjs` 作为唯一来源（含 `label` / `order`）；`npm run sync:consumer-deps` 从 `dist/` 生成消费方依赖 |
| F-76 | `scripts/build-all.mjs`                                                                                               | 任一组件改动都会让 178 条特性边际全部重算                                                      | 缓存只有一个全局 `sourceFingerprint` 键 | 缓存 v2 按组件分键（组件源码 + shared + 注册表 + build-lib + full 配置），每批完成即落盘                                        |
| F-77 | `scripts/build-all.mjs`                                                                                               | 每次门禁都重打 20 份 profile，哪怕配置与源码没变                                               | profile 产物没有缓存                    | profile 级指纹（配置 + 选中组件源码 + shared + 注册表 + build-lib）+ 产物三件套校验，命中直接复用 `meta.json`                   |
| F-78 | `scripts/ci.mjs`                                                                                                      | pre-commit 的 `--fast` 仍跑裸 `verify`，每次都重打 198 份包                                    | `verify` 段没有指纹复用                 | `--fast` 改用 `verify:reuse`，产物没变秒过、源码变了自动重建                                                                    |
| F-79 | `registry.mjs`                                                                                                        | 同一次构建里 20 次 `buildProfile` 各加载一遍 90 个 `spec.mjs`                                  | `loadRegistry` 无进程内缓存             | 进程级 Promise memo，dev 调试台用 `{ fresh: true }` 绕过                                                                        |
| F-80 | `scripts/dev-api.mjs` / `configurator/main.js`                                                                        | 来回切换相同组件组合会反复打包试算；旧请求不能中止                                             | 估算无缓存、请求只靠 seq 丢弃响应       | 估算结果按"选中组件 + 主题"LRU（30 条）；前端 debounce 降到 300ms 并新增 AbortController                                        |

### 19.3 交付与数字

- `npm run build:all` 首轮冷构建：20 份 profile 43.5s + 178 条边际约 7 分钟；**第二轮 1.7 秒**（20/20 profile 命中、178 条边际命中组件级缓存）。
- `sizes.json` 连续两次构建 SHA-256 完全一致（含 `generatedAt` 只在内容变化时更新）。
- `node scripts/ci.mjs --fast` 实测约 24.5 秒（format 4.3s / typecheck 7.0s / lint 3.8s / verify 复用 8.5s / governance 0.9s；目标 15 秒，差距见 §19.4）。
- 消费方依赖脚本同步后 20 个 `@demo/ui-kit-*` 全部就位（`chinese` 补上），`examples/consumer/package-lock.json` 一并更新。
- 新增用例 `tests/build/build-cache.spec.ts` 3 条（组件 / profile / 注册表三类失效）与 `tests/build/consumer-deps.spec.ts` 1 条（依赖与产物一一对应）。
- 缺陷 F-1…F-80 全部修复；三处文档口径同步为 80 条。

### 19.4 遗留说明

- `--fast` 实测高于计划书的 15 秒目标，主要由 typecheck（6.8s）与四次 npm 进程启动构成；进一步压缩需要把 pre-commit 改成直接调用本地 `tsc/eslint/prettier` 二进制（计划书 B3a 的 B8 已列为后续项），本批不改，避免把门禁入口再分叉。

<a id="s20"></a>

## 20. 第十一批交付（工程与测试优化 · B3a：工具链测试，分支 `feature/20261107-optimization-plan`）

### 20.1 背景与范围

B3a 给仓库里两块没有安全网的代码补用例（计划书 §3 的 B1、B5、B6、B10）：dev-api 从 HTTP 中间件里拆出可导出的 `createApiHandlers()`，node 直测正常 / 405 / 400 / 413 / 409 六类分支；浏览器层新增 `configurator.spec.ts`；`verify.mjs` 与 `tests/build/**` 的重叠断言逐组迁移；门禁选择器抽成纯函数并加单测。

### 20.2 缺陷清单

| 编号 | 位置                  | 现象                                                                     | 根因                                                              | 修复 / 守护                                                                                                            |
| ---- | --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| F-81 | `scripts/dev-api.mjs` | `/api/presets` 每次返回 500，构建器打开即报错                            | B2 删除模块级 `PACKAGE_LABELS` 后，`listPresets()` 仍在引用该变量 | label 改从 `profileCatalog()` 读，与构建器 / 调试台同源                                                                |
| F-82 | `scripts/dev-api.mjs` | POST 请求体超过 512 KB 时中间件 promise 拒绝且无人兜底，请求挂起、无响应 | `readBody()` 的 reject 直接抛出 `async` 中间件                    | 中间件捕获后返回 413（`请求体过大`），estimate / build 两条路由一致                                                    |
| F-83 | `scripts/verify.mjs`  | 2239 条断言里大量内容与 `tests/build/**` 重复，同一事实两套口径各自漂移  | verify 同时承担产物细查与运行时冒烟                               | 令牌 / 前缀 / d.ts / 特性标记 / package.json 细查迁到 `tests/build`，verify 收缩为产物存在性 / 导出冒烟 / SSR 冒烟三类 |

### 20.3 交付与数字

- 构建器侧用例 107 → **131 条**（14 个文件）：新增 `ci-stages.spec.ts` 4 条（全量 / fast / `--stage build` / 无匹配）、`demo-meta.spec.ts` 3 条（包集合 / 体积 / 清单与 `dist/*/meta.json` 一致）、`core-css.spec.ts` 6 条（从 verify 迁出的 core CSS/JS 边界）；`dev-api.spec.ts` 4 → 14 条（405 / 413 / 409 / 名字净化 / registry / packages / presets / estimate 缓存）；`theme-tokens.spec.ts` 新增 1 条主题皮肤规则随前缀改写。
- 浏览器层用例 65 → **70 条**（12 个文件）：新增 `configurator.spec.ts` 5 条（根入口跳转、90 个组件、选 2 个组件试算为正、构建产物清单、配置下载）；浏览器层 setup 挂上 `apiPlugin()`，原探针场景不请求接口，控制台仍归零。
- `node scripts/verify.mjs --reuse` 断言数 2239 → **44 项**，执行内容收敛为产物存在性、`activeComponents` 导出冒烟、类型测试与 SSR 渲染冒烟。
- 门禁十二段（B10 只导出纯函数，不改 `STAGES` 条目；与主干的视觉体检段合并后为十三段）；`ci.mjs` 顶层执行加了入口守卫，被测试 import 时不会真的跑门禁。
- 缺陷 F-1…F-83 全部修复；三处文档口径同步为 83 条。

<a id="s21"></a>

## 21. 第十一批交付（工程与测试优化 · B3b：浏览器矩阵、覆盖率与无障碍）

### 21.1 背景与范围

B3b 把"只有 full 进过真浏览器"扩到裁剪产物，并让覆盖率从"大盘达标"变成"单组件也有底线"（计划书 §3 的 B2、B3、B4、B7）：core / antd / chinese 各加一个冒烟场景；浏览器层补 Firefox 子集与 375×812 窄屏断言；覆盖率开启 per-file 文本报告、全局阈值各 +1、`src/components/**` 设组件级下限；接入 `@axe-core/playwright` 对 6 个场景跑 wcag2a/aa。

### 21.2 交付与数字

- 浏览器层用例 70 → **83 条**（16 个文件）：`profile-smoke.spec.ts` 3 条（core / antd / chinese 各挂 3 个代表组件 + 贴底浮层 + 控制台静默）、`firefox.spec.ts` 3 条（布局 / 定位 / 键盘）、`narrow.spec.ts` 1 条（375×812 无横向溢出且浮层夹在视口内）、`axe.spec.ts` 6 条（`it.each` 六个场景）。
- 消费方依赖仍为 20/20（`chinese` 在 B2 已由 `sync:consumer-deps` 纳入），profile 冒烟与 `consumer-deps.spec.ts` 互相印证。
- 覆盖率阈值 87/83/88/87 → **88/84/89/88**（仍贴着实测 88.31 / 84.81 / 89.27 / 88.31）；`src/components/**` 增设组件级下限 **statements 21 / branches 33 / lines 21**（按当前实测最小值向下取整）；报告器增加 `text`，每次 `test:coverage` 输出逐文件表格。
- 新增 devDependency `@axe-core/playwright`；6 个场景只把 serious / critical 计为失败，白名单逐条带理由（§21.4）。
- 本批未新增缺陷编号：Firefox、窄屏与 axe 首轮发现的样式 / 无障碍项均为已知限制或测试脚手架占位，按白名单与专项跟踪，不混入"已修复"统计。

### 21.3 top-10 低覆盖清单与组件级下限

| 文件                                     | lines | branches |
| ---------------------------------------- | ----- | -------- |
| `tree/features/draggable/index.ts`       | 21.67 | 50.00    |
| `drawer/features/draggable/resize.ts`    | 34.42 | 66.66    |
| `collapse-transition/core.ts`            | 37.66 | 100.00   |
| `table/features/resize/index.ts`         | 46.93 | 44.44    |
| `splitter/core.ts`                       | 48.22 | 77.27    |
| `button/features/bg-color/index.ts`      | 59.52 | 60.00    |
| `scrollbar/core.ts`                      | 67.06 | 73.07    |
| `anchor/core.ts`                         | 69.84 | 76.47    |
| `table/core.ts`                          | 72.82 | 74.10    |
| `input-number/features/methods/index.ts` | 75.00 | 100.00   |

这些文件以指针拖拽、真实测量为主，happy-dom 里无法可靠复现；先保底不再下滑。

W4 已补盲：把 `resolveDropType` / `canDropNode` / `moveNode`、`resolveDrawerSize`、`resolveColumnWidth`、`resolveDragRange` / `resolveKeyboardDelta` 等纯函数从闭包抽出，新增 37 条边界用例。四个目标文件现为 tree 96.61/88.75、drawer resize 100/100、table resize 89.47/81.25、splitter 96.15/82.08（lines/branches）。组件级下限从实际的 7/0/7 抬到 **30/40/30**，全量聚合覆盖率 lines 84.59 → **87.69**、branches 77.64 → **79.79**。

W4b 进一步把组件 glob 改为真正的逐文件下限（`perFile: true` + 30/40/30），并补齐 16 条用例：`collapse-transition` 11.11 → **100**、`button.bg-color` 44.44 → **100**、`scrollbar` 42.57 → **100**、input / input-number / select 的 `features/methods` 与 `table.features.column-sort` 均到 **100**。开启 perFile 后 `packages/ui-kit/src/components/**` 下无文件低于 30/40/30，汇总 88.8 / 80.29 / 93.53 / 88.8（stmts/branches/funcs/lines）。

### 21.4 axe 白名单（按场景 × 规则）

| 规则                               | 涉及场景                  | 理由 / 归属                                                                                      |
| ---------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `aria-allowed-attr`                | gallery / floating / a11y | 浮层触发器可能包裹用户自己的可交互内容，不能一律加 `role=button`；`aria-expanded` 暂随触发器输出 |
| `button-name`                      | gallery                   | 画廊用空 props 渲染 Button，可访问名由消费方提供，属探针场景                                     |
| `color-contrast`                   | gallery                   | 主题色对比度统一由 20 套主题令牌治理，单批只记录不改主题                                         |
| `image-alt` / `label` / `listitem` | gallery / a11y            | 探针场景用空 props 渲染，没有 alt / label；TimelineItem 在画廊里孤立渲染缺少 list 容器           |

> W3.1/W3.2 已收口：Cascader / ColorPicker / Rate / Select / TimeSelect 补默认 `aria-label`；Popper 触发器与内容区补可访问名；日历翻页、轮播箭头、折叠头、穿梭按钮补 `aria-label`；空数据级联列补 `role=option`；TreeV2 空态不再挂 `role=tree`；Table 滚动容器补 `tabindex=0`。`aria-command-name`、`aria-input-field-name`、`aria-required-children`、`aria-tooltip-name`、`scrollable-region-focusable` 已从白名单删除。

白名单按「场景 + 规则」登记，新增未登记的 serious / critical 会直接报红。

<a id="s22"></a>

## 22. 第十一批 B4：一致性与检查范围（分支 `feature/20261107-optimization-plan`）

### 22.1 范围

按 `OPTIMIZATION_PLAN.md` 的 B4 执行 A8 与 C5–C10：版本 / engines / license 单一事实源、组件分类合并、workspaces 决策、死资产清理、格式化与 ESLint 范围、用例 strict 与 `as any` 清理、消费方 `fs.allow` 收敛。本批未新增缺陷编号（F-84 起保留给后续真实缺陷，已在 §25 使用），以下均为计划条目落地与配套守卫。

### 22.2 交付与数字

- 版本三处对齐：`package.json` 由 `0.1.0` 升到 `0.3.0`，`registry.mjs` 改为直接读 root `package.json` 的 `version`，产物 `dist/*/package.json` 继续用 registry 版本；三者由 `tests/build/package-consistency.spec.ts`（3 条）守住。
- `license` 与 `engines`：root 声明 `Apache-2.0`（与 `LICENSE` 一致）与 `node >= 22`；`scripts/build-lib.mjs` 生成产物 package.json 时从 root 读取同源字段，消费方 `file:` 依赖不写版本号，升级只跟随产物。
- 组件分类合并：`scripts/demo-categories.mjs` 成为唯一来源（8 组，含标题与说明），`configurator/main.js` 直接 import；`tests/build/category-groups.spec.ts`（3 条）校验 90 个组件无重复、无遗漏、`categoryOf` 与 `meta.json` 一致。
- 死资产清理：删除 root `manifest.json`、`sweep-shots.mjs`、`scripts/generate-suite.mjs`、`reference/`；`scripts/guardian/**` 移入 `tools/guardian/**` 并更新 `package.json` 与文档路径，全仓 `git grep` 已无悬空引用。
- 检查范围：`format` / `format:check` 覆盖 `configurator/**`（js/css/html）、根 `index.html`、消费方配置 / html / css、`tools/**/*.mjs`；ESLint 接入 `@typescript-eslint/recommended`，清掉 194 条新增报错（153 条未使用导入 + 41 条未使用局部变量 / 参数），唯一保留例外是 `no-explicit-any`（600+ 处历史泛型标注，见 20.4）。
- 用例 strict：`tsconfig.tests.json` 改为 `strict: true` / `noImplicitAny: true`，`tests/shims.d.ts` 为未带声明的 `.mjs` / `.js` 产物提供环境声明；`npm run typecheck` 全绿。测试内 36 处 `as any` 全部改为 `as unknown as <具体形状>`，新用例不再允许 `as any`。
- 消费方 `fs.allow`：从整个仓库收窄为 `examples/consumer`、`dist/`、`configurator/`、`scripts/` 四个目录；实测 `GET /` 200、`GET /configurator/` 200、`GET /@fs/<repo>/.git/config` 403、`GET /@fs/<repo>/tests/...` 403。
- 用例数字：构建器侧 131 → **137 条**（16 个文件）；组件侧 1582、profile 142、浏览器 83 不变；`npm run quality` 十二段全绿（与主干的视觉体检段合并后为十三段）。覆盖率清理死代码后实测 statements 88.39% / branches 84.81% / functions 89.39% / lines 88.39%，仍高于 88 / 84 / 89 / 88。

### 22.3 死资产处置明细

| 资产                                         | 处置                     | 理由                                                             |
| -------------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `manifest.json`                              | 删除                     | 只登记了 Button 的过时清单，与 `registry.mjs` / `meta.json` 重复 |
| `sweep-shots.mjs`                            | 删除                     | 一次性截图巡检脚本，不进门禁、无引用                             |
| `reference/element-plus-2.14.7-catalog.json` | 删除                     | 早期对标快照，组件清单已由 registry 维护                         |
| `scripts/generate-suite.mjs`                 | 删除                     | 一次性搭骨架生成器，spec.mjs 已是手工事实源                      |
| `scripts/guardian/**`                        | 移到 `tools/guardian/**` | 常驻巡检不属于构建流水线；端口仍走 `scripts/worktree-ports.mjs`  |

### 22.4 ESLint recommended 的例外

`@typescript-eslint/recommended` 的 `no-explicit-any` 在 90 个组件与测试里命中 600+ 处，多为泛型插槽 / 事件载荷的历史标注。本批按计划 C9 只清「新文件与 36 处 `as any`」，不把这个规则一次性转成 error，以免把大规模类型重写混进一致性批次；其余 recommended 规则（未使用变量、空对象类型、`Function` 类型误用等）已全部清零。后续新增文件仍受 `no-explicit-any` 之外的全部 recommended 约束。

### 22.5 workspaces 决策记录（C6）

- 决策：**不迁移到 npm workspaces**。消费方 `examples/consumer` 虽然有独立 `package.json` / `package-lock.json`，但它依赖的 20 个 `@demo/ui-kit-*` 是 `file:../../dist/<profile>`，产物目录不是 workspace 包；迁移后 npm 仍要按 `file:` 复制 / 链接，收益只有少一个 `npm ci`，却会把「先构建 dist、再安装消费方」的隐式顺序藏进 workspace 链接，风险大于收益。
- `file:` 语义：依赖值不带版本号，npm 以链接方式指向 `dist/<profile>` 的实际 `package.json`；版本升级只需改 root `package.json` → `npm run build:all` → 重装消费方依赖，不需要在消费方逐个改版本。
- 升级步骤：`npm run build:all` → `npm --prefix examples/consumer ci` → `npm run verify:consumer`。
- CI 缓存策略（与 B5 服务端流水线一致）：分别缓存 root 与 `examples/consumer` 的 `node_modules`，key 用各自的 `package-lock.json` 哈希；dist 不进缓存，必须由当前提交现场构建，避免旧产物被链接进消费方。

<a id="s23"></a>

## 23. 第十一批 B5：文档、入口与服务端 CI（分支 `docs/20261107-docs-and-ci-entry`）

### 23.1 范围

按 `OPTIMIZATION_PLAN.md` 的 B5 执行 A2、B8、B9 与 D1–D6：服务端 CI、删除手写用例计数、`test:all` 与 `quality` 同源、复现前置、目录结构与测试分层、本地目录忽略、REQUIREMENTS 目录与缺陷索引、包元数据、单一门禁入口。本批同样不新增缺陷编号（沿用 F-1…F-83），以下为计划条目落地与配套守卫。

### 23.2 交付与数字

- 服务端 CI：新增 `.github/workflows/quality.yml`，push / PR 触发后依次执行 `npm ci` → `npx playwright install --with-deps chromium firefox` → `npm run build:all` → `npm --prefix examples/consumer ci` → `node scripts/ci.mjs`，无论成败上传 `ci-report.json`；流水线不复制任何判定逻辑，阶段名与耗时完全由 `ci.mjs` 输出。仓库托管在 Gitee，文档写明 Gitee Go 用 Node 22 执行同一条命令的等价做法。
- 文档计数：README / KNOWLEDGE 删除「95 个文件 1582 条」「共 137 条」「共 142 条」「共 83 条」等手写值，改为「测试层 + 命令 + 报告路径」；治理校验新增两条守卫——文档不得再出现手写用例计数，且 `test:all` 必须与 `quality` 同一条命令。
- 入口收敛：`test:all` 改为 `node scripts/ci.mjs` 的别名，与 `quality` / `ci` 同源，只保留名字兼容；文档明确 `quality` 是唯一门禁入口，`test:all` 仅本机调试。
- 复现前置：README 新增「环境要求」，写清 Node ≥ 22、`npm install`、`npm run hooks:install`、`npx playwright install chromium firefox`、首次 `npm run build:all` 与消费方独立依赖。
- 目录结构：README 结构图改成五层用例（components / build / profiles / browser / coverage），补齐 `tools/`、`.githooks/`、`.github/workflows/` 与根目录清单源（`registry.mjs`、`sizes.json`、`vitest.*.config.ts`）；`reference/` 与 `scripts/guardian` 已按 B4 处置，不再出现在结构图里。
- 本地目录：`.gitignore` 增加 `.workbuddy/`，与既有 `.env.workbuddy` 规则并列，换机器签出后 `git status` 不再出现本地工作目录。
- REQUIREMENTS 导航：新增「目录」（24 个章节，全部带 `<a id="sN">` 稳定锚点）与「缺陷编号索引」（83 条 F-NN → 章节链接）；治理校验的编号解析改为只认五列登记行，索引的两列引用不参与唯一性判定。
- 包元数据：`license: Apache-2.0` 与 `LICENSE` 一致（B4 已落 root 与产物），新增 `CHANGELOG.md` 记录 0.1.0 / 0.2.0 / 0.3.0，版本号唯一事实源仍是 root `package.json`。
- 浏览器层稳定性：整跑门禁时 `a11y` 场景偶发 `color-contrast` serious（TabPane 的 180ms 淡入被 axe 扫到中间帧）；`tests/browser/axe.spec.ts` 在扫描前等 `document.getAnimations()` 收敛（封顶 500ms），KNOWLEDGE 同步记录该前置。
- 门禁：与主干的视觉体检段合并后 `npm run quality` 十三段全绿；本批不新增用例，各层条数不变，仍以命令输出与 `ci-report.json` 为准。

<a id="s24"></a>

## 24. 选择器统一：只保留 Select 并吸收大数据虚拟列表（分支 `feature/20261107-select-unification`）

> 编号口径：与 §18–§23 的工程与测试优化批次（Qoder 的 B1–B5）并行开发，两边同时从 §18 起排，本批在合入时顺延到 §24。本批是功能改造而非缺陷修复，沿用 F-1…F-83，不新增缺陷编号（与 B4 / B5 的「本批未新增缺陷编号」同例）。

### 24.1 范围与目标

用户要求：只保留 `Select` 一个选择器，删除 `SelectV2 虚拟列表选择器`，但大数据能力必须留在 Select 上，并在调试台补上大数据示例。

改造前的全库静态审计结论：旧虚拟列表选择器相对 Select 的唯一增量是「扁平大列表窗口化」——阈值 100、overscan 5、运行时测量行高、`scrollTop` + `translateY` 可视窗口、分组列表回退全量；其余 `clearable` / `multiple` / `filterable` / `popper` / `loading` / 字段映射 / `effect` 都是 Select 已有能力的子集。Select 反而多出插槽 `Option` / `OptionGroup`、方向键与 Enter 导航、`clear` / `remove-tag` / `visible-change` 事件、`valueOnClear`、远程搜索 debounce 与 `focus` / `blur` 方法。因此合并方向定为：把窗口化做成 Select 的一个可选特性，其余全部丢弃。

### 24.2 方案与验收口径

- 新增特性 `select.select-virtualized`，props 为 `virtualized`（开关，默认开）、`itemSize`（默认 34，对齐 `cascader.virtualized`）、`virtualThreshold`（默认 100）；窗口计算依赖 `visibleOptions` / `activeIndex` / 面板 ref，逻辑落在 `select/core.ts`，滚动容器与虚拟层样式落在 `features/select-virtualized/style.css`。
- 特性类名按项目约定走 `className(props)` 挂 `ui-select--virtualized`，样式只在特性被选中时生效（不写成常量类名，避免 F-11 那类「特性关掉仍挂类名」的复发）；core 只在真正进入窗口化时追加 `is-virtual`。
- 分组列表、未达阈值、未开启特性时一律回退全量渲染，保证既有浮层场景与键盘导航语义不变；方向键移动后把活动项滚进可视区。
- 删除 `packages/ui-kit/src/components/select-v2/` 整个组件目录，连带清理主题孤儿令牌与配置清单里的旧组件字面量；`Select` / `Option` / `OptionGroup` 三个导出名不变。
- 调试台把原虚拟列表选择器的 1 万条场景迁到 `Select`，且 `demo-code.ts` 对大数据 `options` 只输出生成器调用、不内联 MB 级字面量（沿用 `heavy-tree` 的口径）。
- 新增「旧选择器不得复活」的全库静态守卫，防止并行分支合并时把旧组件带回来；视觉体检画廊的组件数随导出数自动收敛。

### 24.3 交付与数字

- 组件目录 90 → **89**、导出 125 → **124**、gallery 逐组件图 124 → **123**；特性 178 → **175**（删 4 个 `select-v2.*`，新增 1 个 `select.select-virtualized`）。20 份 profile 与 `sizes.json` / `demo/meta.json` 全部重生成，旧组件名在这些产物里零残留。
- 用例：删掉 `select-v2.spec.ts`，把虚拟窗口断言迁进 `select.spec.ts` 并扩成 5 条（阈值窗口化 / 滚动位移 / 开关关闭回退 / 分组回退 / 阈值与行高可调）；`model-value-boolean-cast.spec.ts` 的 F-38 同类回归改挂 `Select`。各层条数以 `npm run quality` 输出与 `ci-report.json` 为准。
- 真实调试台复核：`#/c/select` 的「大数据虚拟列表（1 万条）」场景在默认 full 包下展开面板只渲染 14 个 `.ui-select__option`、虚拟层占位高 320000px（实测行高 32px × 1 万条）、控制台零报错；展开代码输出 `Array.from({ length: 10000 }, …)` 生成器，源码约 375 字符，不再内联 MB 级字面量，场景切换约 0.8s。
- `audit:visual` 新增「消费方大数据现场」：另起调试台服务点开该场景并展开面板，断言虚拟层存在、渲染节点 ≤ 30、占位高 ≥ 100000px，截图进画廊；治理校验静态锁死 `BIG_DATA_SCENE` / `bigDataShot`，防止合并时把这层能力架空。
- 治理校验新增「Select 统一守卫」：扫描源码 / profile / 配置 / 示例 / 测试里所有跟踪文件，旧组件名零残留；`select` 目录、新特性声明与生成物登记三者缺一即报红。历史缺陷登记（F-38 / F-47）与上游参考目录不在扫描范围内。
- 门禁仍十三段，缺陷口径仍 F-1…F-83（本批为功能改造，不新增缺陷编号）；布局基线按 gallery 少一个组件重录，像素基线 6 场景保持零漂移。
- 存量数字校正：令牌指纹快照按「删掉 1 个孤儿令牌」重录（每份 profile 少 1 条生效令牌），树摇快照同步去掉旧组件的 3 条不可标记特性。

<a id="s25"></a>

## 25. 虚拟列表统一：一套算法、一个组件、真按需打包（分支 `feature/20261107-virtual-list-unify`）

> 编号口径：本批新增 F-84（特性裁剪失效）与 F-85（构建器侧用例 flaky），正好用掉 §22 预留的起始号 F-84。

### 25.1 触发问题与审计结论

用户提问：仓库里多处用到虚拟列表，却几乎不用 `virtual-list` 组件，是不是每个都自己实现了一套？

对 `packages/ui-kit/src/components` 全量静态审计后，答案是「是」，而且比预想更分散：

| 位置                     | 改造前实现                                                                    | 窗口算法                                 |
| ------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------- |
| `select/core.ts`         | `virtualWindow()` + `.ui-select__virtual` / `__virtual-window` + `translateY` | overscan 5、运行时实测行高、分组回退全量 |
| `cascader/core.ts`       | `.ui-cascader__window` + 逐行 `top` 定位                                      | overscan 4、`itemSize` 下限 16           |
| `cascader-panel/core.ts` | 与 cascader 同一段逻辑的第二份拷贝                                            | overscan 4、`itemSize > 0` 才启用        |
| `table/core.ts`          | 变量行高前缀和 + 贴底锁 + 滚动停稳后实测回填                                  | 动态行高，与前三种不同类                 |
| `transfer.virtualized`   | 只挂 `ui-transfer--virtualized` 类名                                          | **无实现（空壳）**；W2.2 已删除特性      |
| `virtual-list` 组件      | 除自身用例与调试台元数据外**全仓零引用**                                      | 第三套固定行高实现                       |

决定性证据来自 `sizes.json`：`select.select-virtualized` 的边际体积只有 **441 B js / 310 B css**，与同样是空壳的 `cascader.virtualized`（240 B）同量级。这说明 §24 把窗口算术写进 `select/core.ts` 后，**不开特性也照样打包**，「开了才打包」只是运行时 `props.virtualized === true` 的分支判定，并没有发生体积裁剪。

### 25.2 改造方案

- **一套算法**：新增 `packages/ui-kit/src/shared/virtual-window.ts`，只放纯函数（`computeVirtualRange` / `alignVirtualScrollTop` / 默认值解析）。空列表、不足一屏、滚动越界、行高与可视高度未知、总高收缩这些边界统一在这里收敛。
- **一个组件**：`virtual-list` 接入内核，并新增受控窗口模式（`scrollTop` / `viewportHeight` / `scrollable`），让「外层容器负责滚动、内部只渲染窗口」的场景也能复用它——Select 的浮层面板正是这种形态。另暴露 `scrollToIndex` / `scrollToTop`，供方向键跟随使用。
- **Select 真按需打包**：`select/core.ts` 删除全部虚拟状态与算术，只保留 `featureHook` 扩展点（`renderOptionList` / `onListScroll` / `onListOpen` / `onListClose` / `onListReset` / `onActiveChange`）；虚拟渲染整体搬进 `features/select-virtualized/`，用 `h(VirtualList, { scrollable: false, scrollTop })` 渲染，单行仍交给 core 的 `renderOption`，保证 `role=option` / `aria-selected` / 悬停高亮 / 点击选择语义不变。特性未选中时，该模块与 VirtualList 都不会被构建器写入产物。
- **其余组件收敛**：`cascader` / `cascader-panel` 的窗口算术改为调用内核（等价替换，渲染结构不变）。

### 25.3 验证与数字

- 裁剪实测（同一份源码，只改选中的特性）：仅 `select.select-clearable` 的包 **60924 B**；仅 `select.select-virtualized` 的包 **67820 B**；差 **6896 B**。前者产物里 `ui-virtual-list` / `virtual-list__spacer` / `ui-select__virtual` 命中数均为 **0**，后者为 3 / 1 / 1。
- `sizes.json` 里 `select.select-virtualized` 从 **441 B** 变为 **2499 B js / 209 B css（gzip 727 B）**——边际值终于反映真实实现，这也是本批的机器判据。
- 新增 `tests/components/virtual-window.spec.ts` 14 条纯函数边界用例；`select.spec.ts` 的 5 条虚拟断言改认新结构（占位高落在 `.ui-virtual-list__spacer`、位移改看行的 `top`），其余回退语义（开关关闭 / 分组 / 阈值与行高可调）不动。
- 治理校验新增「虚拟窗口统一守卫」（门禁 `governance` 段）：`select/core.ts` 的 import 里不得出现虚拟实现、`select-virtualized` 必须 import `virtual-list/core`、该特性边际值不得低于 1500 B，三者任一破坏即报红。

### 25.4 本批未统一的部分（已登记，避免被当成已完成）

- `cascader.virtualized` / `cascader-panel.virtualized` 已于 W2.1 真正特性化：core 只留 `featureHook` 扩展点，滚动状态、窗口算术与 `__window` / `__row` 渲染全部搬进各自 `features/virtualized/`；边际值从 240B / 258B 提升到 **1782B / 1622B**。治理守卫改为检查 core 不得 import 虚拟实现、不得直接读 `virtualScroll` / `itemSize`，且特性必须复用 `shared/virtual-window`。
- `transfer.virtualized` 零实现，已于 W2.2 删除；双列表虚拟化若要做，按新功能单独立项，不再挂空壳。
- `table` 的虚拟滚动是变量行高 + 前缀和 + 贴底锁，与固定行高窗口不是同一种算法，强行套内核会丢掉动态行高能力，本批不动。

### 25.5 缺陷登记

| 编号 | 文件                                            | 现象                                                                                                    | 根因                                                                                                         | 修复                                                                                                                                              |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-84 | `packages/ui-kit/src/components/select/core.ts` | 不选 `select.select-virtualized` 也照样打包虚拟渲染代码；该特性边际值只有 441 B，「开了才打包」名不副实 | §24 把窗口算术与 `ui-select__virtual` 渲染写进 core；构建器只裁特性模块，不裁 core 里的分支                  | 虚拟实现整体搬进 `features/select-virtualized/`，core 只留 `featureHook` 扩展点并复用 `virtual-list`；off/on 实测差 6896 B，边际值 441 B → 2499 B |
| F-85 | `tests/build/build-cache.spec.ts`               | `npm run test:build` 偶发红（同一份代码一次红一次绿），失败点固定在「改组件源码只让该组件的缓存键变化」 | 固定名探针 `__cache_probe.tmp` 在 Windows 上偶发删不掉；下次 `before` 已包含探针内容，再写入同样内容指纹不变 | 写入前先清残留、探针内容带唯一值、删除带重试；`vitest.build.config.ts` 改串行（这批用例会真改源码、真打包，与只读断言并发互相污染）               |

## 26. 门禁成本：从"每改一行跑十三段"到"只跑受影响的部分"（分支 `perf/20261107-scoped-gate`）

> 触发：用户提出"才改了这几个文件，跑测试跑那么久"。先按会话记录逐条时间戳归因（窗口 54.3 分钟），再改机制，不靠感觉。

### 26.1 归因（54.3 分钟实测）

| 去向                               | 时长      | 占比 | 性质                                                              |
| ---------------------------------- | --------- | ---- | ----------------------------------------------------------------- |
| 等后台门禁 / 浏览器任务跑完        | 17.1 分钟 | 31%  | 其中 15:31、15:34 连跑两遍全量门禁，第二次单轮等了 529s（冷构建） |
| 重跑用例                           | 14.6 分钟 | 27%  | 其中 10.6 分钟是同一个套件连跑 2–4 遍"赌是不是 flaky"             |
| 模型侧（思考 / 输出 / 上下文压缩） | 21.2 分钟 | 39%  | 含收尾压缩 6.1 分钟，整任务两次压缩合计约 17 分钟                 |
| 构建（6 次 `build:all`）           | 1.2 分钟  | 2%   | 缓存本身是有效的，**不该往构建上继续投资**                        |

结论：六成是"改一步就跑一遍全量"的节奏问题，四成是项目缺少增量入口与可预测性（冷热差 5 倍却不说原因）。两者相乘：入口慢 → 想多跑一遍确认 → 上下文被长输出撑到压缩。

### 26.2 做法

- **受影响范围选择器**（`scripts/test-impact.mjs` + `ci.mjs --changed`）：把「文件 → 受影响层 + 受影响用例」写成纯函数。默认只看工作区（`git diff HEAD` + 未跟踪），要看整条分支的累计影响面得显式 `--base origin/main`——否则分支提交过几轮之后，脚本与配置改动必然进入 diff，选择器会一律回落全量（真机踩过：只改了一个组件却跑了十三段）。组件用例按 `import` 判定归属（不是名字子串，`button` 不会把 `alert.spec.ts` 拉进来）；共享模块 / 组件库入口 / 构建器 / profile / 测试基础设施 / 未知路径一律回落全量。`npm run ci:plan` 只打印计划，`npm run ci:changed` 才执行。
- **产物相关层不可省**：组件用例读的是 `dist/full/ui-kit.js`，`--changed` 仍保留 `build` / `verify` / 体积契约，否则是拿旧产物测新代码。
- **浏览器层 3 路并行**：16 个文件 46s → 20s；探针服务仍由 `globalSetup` 单实例提供，worker 共享同一随机高位端口。
- **类型检查增量**：两份 tsconfig 各写一份 `tsBuildInfoFile` 到 `.build/`，库 7.0s → 2.7s、用例 5.0s → 2.8s。
- **隐式前置收进 `ci.mjs`**：宿主注入的 `CODEBUDDY_SAFE_DELETE_ENABLED=1` 会让构建清空 `dist/` 时整段假红，`NO_PROXY` 不设会让 Firefox 子集超时——现在由门禁自己补，并把补了什么打出来。
- **构建并发 6 → 8，冷启动有交代**：开跑即报「要重算多少个特性、量级多久」，并按实际吞吐持续修正（固定 18s 常数第一次就偏了 50%，所以改成自校正）。10 路压测出现过一次 EMFILE（postcss 打开 core.css 失败），构建偶发红比慢几分钟更贵，退到 8 路。
- **缓存口径与编排脚本解耦**：`componentFingerprint` / `profileFingerprint` 不再包含 `build-all.mjs` 全文，改用 `SIZE_ALGO_VERSION` 代表计量口径；治理校验扫 diff，动了 `delta()` / `SIZE_KEYS` / 缓存写盘等代码却没升版本号直接报红。
- **pre-commit 不再重建**：`verify` 段在 fast 模式改用 `verify:if-fresh`，产物过期就跳过并说明"pre-push 会重建"，钩子 45–60s → 14s。

### 26.3 验证数字

- 全量门禁非构建段：132.7s → 118.9s（浏览器 −26s、类型 −4.3s；`test:build` +14s 是冷产物首次读取，热态回落）。
- `ci:changed` 端到端实测：只改 `button/core.ts` 时 **41.2s / 9 段**（build 5.0 / format 4.5 / typecheck 2.5 / lint 4.2 / verify 4.8 / governance 1.0 / test 1.9 / test:build 5.3 / visual 11.1），同一场景走全量是 125s 起、产物过期时还要加一次构建；其中 `test` 只跑 `button.spec.ts` 与 `style-attrs.spec.ts`；改 `time-picker/core.css` 额外带 `tests/browser/time-picker.scene.spec.ts` 与 CSS 令牌两条构建器用例；只改 `README.md` → 仅 governance。
- pre-commit（`ci:fast`）：14s（format 4.8 / typecheck 2.6 / lint 4.3 / verify 0.9 跳过 / governance 1.1）。
- 缓存口径守卫自测：仅追加注释 → 通过；追加 `delta(` 调用但不升版本号 → 报红并指出「SIZE_ALGO_VERSION 仍是 v2」。

### 26.4 本批未做（附原因，避免被当成已完成）

- **`test:build` 拆"只读并行 + 变异串行"**：试过并已回退——拆开后只读段并行 8s、变异段仍是 14s（dev-api 真打包、types-contract 生成 d.ts、theme-tokens / tree-shaking 各建一次），合计 22s，比不拆的 23s 只省 1s；变异段占六成，拆分层不解决问题。真要提速得让这五个用例共用一次构建产物，属于改测试契约，留待下一批。
- **覆盖率与组件层重复跑同一批用例**：覆盖率必须在源码入口重放才有 per-file 数字，合并会丢掉"产物行为一致"这层保证；只在全量门禁跑，内循环由 `--changed` 跳过。
- **绕过 npm 直调 CLI**：13 段各起一次 npm，固定开销约 10s，收益有限且要自己维护各 CLI 入口。
- **门禁输出瘦身**：全量日志约 1140 行 / 195KB，改为精简 reporter 需要逐段确认失败信息仍可定位，留待下一批。

### 26.5 缺陷登记

| 编号 | 文件                    | 现象                                                                                              | 根因                                                                               | 修复                                                                                       |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| F-86 | `scripts/build-all.mjs` | 改一句构建日志文案，`build:all` 就要重算 175 个特性边际，实测 467s                                | 组件级与 profile 级缓存键都包含 `build-all.mjs` 全文，把"编排脚本"当成了"计量口径" | 缓存键改用 `SIZE_ALGO_VERSION` 表示计量口径；治理校验扫 diff，算法代码变了却没升版号即报红 |
| F-87 | `scripts/verify.mjs`    | 源码改动后 `git commit` 会卡在 pre-commit：`verify:reuse` 发现指纹不一致就重建 198 份包，钩子超时 | fast 模式沿用了"过期即重建"的复用策略，把重活留在了提交钩子里                      | 新增 `--if-fresh`：产物过期时跳过库级校验并说明"pre-push 全量门禁会重建"，钩子回到 14s     |

## 27. 优化计划第一波：服务端安全、构建指纹、组件约定与调试台性能（分支 `fix/20261108-opt-wave-1`）

> 触发：`OPTIMIZATION_PLAN_V2.md` 全库评审的 A1 / A2 / A4 / A5 / A6 / A7 / A8 / A11–A14。按 worktree 隔离 + 路径归属台账并行开发（G0 治理工具同批交付），统一全量门禁后合入。

### 27.1 缺陷登记

| 编号 | 文件                                                                       | 现象                                                                                                                                                             | 根因                                                                                                                                       | 修复                                                                                                                                                                                                                                                           |
| ---- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-88 | `scripts/dev-api.mjs`                                                      | `/packs/:packId/*` 的 `packId` 未校验，`GET /packs/../.git/config` 这类路径能读到仓库外文件                                                                      | `packId` / `fileName` 直接拼进 `path.resolve`，没有任何 `..` 与分隔符拦截                                                                  | 入参拒绝 `..` 与路径分隔符；resolve 后双重 `startsWith` 确认仍落在 `dist/<packId>/` 内，不存在返回 404                                                                                                                                                         |
| F-89 | `scripts/build-all.mjs`                                                    | 改了 `table` 里 import 的 `checkbox`，缓存指纹不识别，`build:all` 复用旧特性产物                                                                                 | 组件指纹只含自身目录，漏掉跨组件 import 闭包；`builtinInputs` 也没含 `package.json` / `tsconfig.json` / `vite.config.mjs`                  | `siblingComponentDeps` 沿源码 import 收集跨组件目录并入指纹；`builtinInputs` 补三份根配置                                                                                                                                                                      |
| F-90 | `registry.mjs`                                                             | `spec.mjs` 里 `requires` 成环时 `visit()` 无限递归，报 `RangeError: Maximum call stack size exceeded`，看不出是哪两个特性互相依赖                                | 递归前没有 visiting 集合，只有事后 `seen`                                                                                                  | 加 `visiting` 集合：入递归前登记、出递归摘除，撞环直接抛带 `status=400` 的错误并点明环上特性                                                                                                                                                                   |
| F-91 | `packages/ui-kit/src/shared/behavior.ts`                                   | dialog 里开 select，一次 Escape 把两层一起关掉                                                                                                                   | overlay 公共层 Escape 处理不查 `defaultPrevented`；内层 select 只 `preventDefault` 不 `stopPropagation`，按键冒泡到外层 overlay            | `handleKeydown` 前置 `defaultPrevented` 检查；内层浮层接管后外层不再响应。回归用例：dialog 内开 select，第一次 Escape 只关 select、第二次才关 dialog                                                                                                           |
| F-92 | `packages/ui-kit/src/components/date-picker/core.ts`                       | 格式串 `YYYY-MM-DD HH:mm (summer)` 这种含字面 `s` 的串会误渲染秒列                                                                                               | `showSeconds` 用 `pattern.includes('s')` 判断，把字面量当占位符                                                                            | 改用 `shared/date` 的 `hasSecondsToken`（与 time-picker 同一判定口径），只认 `s` / `ss` token                                                                                                                                                                  |
| F-93 | `packages/ui-kit/src/components/form/core.ts`                              | A 字段每次输入都会把 B 字段的 validator 重跑一遍（远程查重等副作用被无辜触发）；`FormRule.trigger` 写了不生效                                                    | `watch(model, validateFields, {deep, immediate})` 全量校验所有字段，trigger 字段无人读取                                                   | 按 path 快照比对（Date / 数组 / 嵌套对象安全）找出变更字段，只重校验 trigger 含 `change` 的规则；FormItem 挂 `focusout` + `blurCapture` 冒泡失焦，只重校验 trigger 含 `blur` 的规则；首次 immediate 保持整表校验兼容既有行为                                   |
| F-94 | `packages/ui-kit/src/shared/component.ts` 及 10 个组件                     | input / checkbox / switch 等挂 `onChange` 后一次操作回调两次                                                                                                     | 事件未声明进 `emits` 时监听留在 `attrs` 被铺到根节点成原生监听，组件内 `emit()` 又回退调用 `attrs` 同名监听，原生冒泡 + emit 回退 = 双通道 | select / date-picker / input / checkbox / checkbox-button / checkbox-group / switch / input-number / cascader / autocomplete 按实际 `emit()` 补全 `emits` 声明（Vue 自动把对应监听从 attrs 剔除）；component.ts 补机制说明注释；每组件加「只触发一次」回归用例 |
| F-95 | `packages/ui-kit/src/components/button/core.ts`                            | 连点按钮产生的 ripple `setTimeout` 在组件卸载后才回调，闭包持有已卸载实例                                                                                        | 水波纹定时器没有登记与清理                                                                                                                 | `waveTimers` 集合登记全部定时器，`onBeforeUnmount` 统一 `clearTimeout`；affix / infinite-scroll 同批补泄漏守卫用例                                                                                                                                             |
| F-96 | `examples/consumer/src/demo/table-data.ts` / `scenes.ts` / `table-demo.ts` | 切到 Table 场景明显卡顿：预设的 10 万行数据在模块加载时 eager 生成约 175k 行；每次场景切换对所有 preset 值 `structuredClone`；`heavyRows` 非响应式导致重渲染失效 | presets.ts 顶层执行重计算；scenes.ts 无差别深拷贝；table-demo 直接暴露静态数组                                                             | 重数据改惰性工厂（首次用到才生成，引用不变复用）；`presetValues` 按引用物化惰性值（小值仍 structuredClone）；`heavyRows` 改 `computed` + `watch`。10 万行场景切换 180–200ms → 0.12ms（同引用），配套 `scripts/bench-heavy.mjs` 基准                            |

### 27.2 验证

- 组件层全量：95 文件 1597 用例通过（含本批新增回归：Escape 分层、秒列判定、form 增量校验、emits 单通道、泄漏守卫）。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`，连同 G0 治理工具与派生产物刷新一并验证。
- 缺陷口径：F-1…F-96 全部修复，三处文档（README / KNOWLEDGE / REQUIREMENTS）同步为 96 条。

## 28. 优化计划第二波：键盘可达性（Tabs / TreeV2）（分支 `fix/20261108-a11y-keyboard`）

> 触发：`OPTIMIZATION_PLAN_V2.md` 评审结论 A9 / A10（G3）。worktree 隔离开发，统一全量门禁后合入。

### 28.1 缺陷登记

| 编号 | 文件                                             | 现象                                                                          | 根因                                | 修复                                                                                                                                                                                                                                                                                                     |
| ---- | ------------------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-97 | `packages/ui-kit/src/components/tabs/core.ts`    | 所有页签 tabindex 相同，方向键不能在页签间移动焦点，不符合 WAI-ARIA Tabs 模式 | 从未实现 roving tabindex 与键盘导航 | 激活页签 `tabindex=0`、其余 `-1`，补 `aria-selected`；tablist 容器内联 `onKeydown`：ArrowLeft/ArrowRight 循环移动焦点并自动激活（复用 `setActive` 出口，跳过禁用），Home/End 跳首/尾可用页签                                                                                                             |
| F-98 | `packages/ui-kit/src/components/tree-v2/core.ts` | 树无 `role`/`aria-*`，键盘完全不可操作                                        | 未实现 ARIA 与键盘导航              | 容器 `role="tree"`、节点 `role="treeitem"`，`aria-expanded`/`aria-selected` 与状态同步；容器内联 `onKeydown` 实现 WAI-ARIA Tree View 模式：ArrowUp/Down 在可见节点循环移动焦点、ArrowRight 展开/下钻、ArrowLeft 收起/回父级、Enter 选中（复用 `handleNodeClick` 出口）；无 window 级监听，不涉及卸载清理 |

### 28.2 验证

- 组件层：tabs + tree-v2 共 53/53 用例通过（含新增键盘导航与 ARIA 契约用例）。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-98 全部修复，三处文档同步为 98 条。

## 29. 优化计划第二波：测试补盲（特性组合抽样 / 触摸 / SSR）（分支 `test/20261108-combo-ssr-blinds`）

> 触发：`OPTIMIZATION_PLAN_V2.md` G5 的 A15 / A16。纯测试批次，沿用 B4/B5 先例不新增修复类缺陷；批次中发现的存量缺陷登记为 F-99。

### 29.1 缺陷登记

| 编号 | 文件                                          | 现象                                                                      | 根因                                                                                    | 修复                                                                                                            |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| F-99 | `packages/ui-kit/src/components/tabs/core.ts` | SSR 首渲页签栏为空：服务端渲染的 HTML 里 tab 导航无内容，hydrate 后才出现 | TabPane 在 setup 里向父级注册，晚于父组件首次渲染，父级导航依赖的子组件元数据首渲不存在 | 已修复（§32）：导航元数据改为渲染期从 default slot VNode 声明式推导；豁免已移除，用例直接断言 SSR HTML 含页签栏 |

### 29.2 本批测试层交付

- A15 特性中间组合抽样：`tests/profiles/feature-combos.spec.ts`——样本从 registry 实际 `requires` 推导（当前三对：`button.gradient→button.bg-color`、`cascader.select-all→cascader.multiple`、`table.column-sort→table.sort`），每对现场构建「仅关该特性、其余全开」临时产物（`build-lib.mjs` 真实 CLI，落 `.tmp/` 不进 dist）并 sweepMount 全量挂载，9 条用例。
- A16 触摸：`tests/browser/touch.spec.ts`——tabs 经 CDP `Input.dispatchTouchEvent` tap 切换页签、slider 触摸序列不抛错；窄屏：`tests/browser/narrow.spec.ts` 追加 375×812 表格横向滚动与列宽下限断言；SSR：`tests/build/ssr-hydrate.spec.ts`——renderToString → createSSRApp hydrate 零告警 + 事件接管可用，3 条用例。

### 29.3 验证

- profiles 9/9、browser touch+narrow 4/4、build ssr 3/3 全绿；typecheck 零错误。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`（profiles/build 层用例要求 20 份产物齐备，由门禁 build 段保证）。
- 缺陷口径：F-1…F-99（F-99 登记未修复，属已知豁免），三处文档同步为 99 条。

## 30. 优化计划第三波：同类逻辑单源与命名公约（G7 A23/A25 第一刀）（分支 `refactor/20261108-normalize-options` / `refactor/20261108-naming-convention`）

> 触发：`OPTIMIZATION_PLAN_V2.md` G7。按 §3 拆所有权不相交子任务并行（A23 改组件与 shared、A25 只建文档与守卫），共享面零交叉。

### 30.1 缺陷登记

| 编号  | 文件                                                                              | 现象                                                                                                                                    | 根因                                 | 修复                                                                                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-100 | `packages/ui-kit/src/shared/behavior.ts` / `segmented/core.ts` / `select/core.ts` | normalizeOptions 三份实现并存，字段回退链各自漂移（「自定义字段名+缺字段」场景两版各有盲区）                                            | 同类逻辑从未收拢出口，各组件各造一份 | 收拢为 `shared/options.ts` 唯一出口（回退链取并集，注释写明取舍；groups 开关默认关防误吞带 `options` 字段的普通对象）；segmented/behavior/select 迁移，守卫 `options-normalizer-exit.spec` 锁定组件侧零定义                                |
| F-101 | 全库 props/events 命名                                                            | 同语义多词并存：受控显示 modelValue(6 组件)/visible(5)/open(1) 三套，布尔 prop 出现动词原形 4 处，事件 focusout 外泄、双 update: 写口等 | 无命名公约、无漂移守卫               | 第一刀已落地：`NAMING.md` 公约（受控显示=modelValue、布尔=形容词/分词、事件=动词原形或 `xxx-change`）+ `naming-guard.spec` 6 模式守卫（存量白名单 10 文件双向校验）。**存量违规改名（visible/open 收敛等）为第二刀**，迁移清单见 NAMING.md |

### 30.2 验证

- 组件层 95 文件 1609 用例全绿（去重后 bundle 缩小约 1.15 kB，产物合并后统一刷新）；naming-guard 6/6、options 守卫正反验证。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-101（F-99/F-101 含已登记的存量待改项），三处文档同步为 101 条。

## 31. 优化计划第四波：slot 契约层（G7 A21 第一刀）（分支 `refactor/20261108-slot-contract`）

> 触发：`OPTIMIZATION_PLAN_V2.md` G7 A21。slots 是唯一没有 second source 的组件事实（props/features 有运行时声明与 d.ts 互证，slot 只存在于渲染代码），先建契约层与 input 样板；零 slot 组件铺量第二刀在 `refactor/20261108-slot-rollout` 执行。

### 31.1 缺陷登记

| 编号  | 文件                                                                                 | 现象                                                                                                                                                                                                         | 根因                                                                               | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-102 | 全部组件 `spec.mjs` / 产物 d.ts / demo meta                                          | 组件 slot 无契约：d.ts 与调试台 API 表没有 slot 事实来源，声明口径全靠口口相传                                                                                                                               | slot 从未纳入 spec 元数据体系                                                      | 契约层落地：`spec.mjs` 新增 `slots` schema（registry 加载时强校验 name/scope/fallback/description/renderedVia）→ 构建生成 `XxxSlots` 接口（VNode 按用到引入）→ 产物 `meta.json` 带 `slots` 段 → 调试台 API 表新增 Slots 段（core 属性表契约同步放行 `Slots$` 接口）；input `append` 样板；守卫 `tests/build/slot-contract.spec.ts` 四组用例：dist meta 与 spec 逐字一致、d.ts 形态、demo meta 数据源、静态渲染守卫（renderedVia 豁免须在台账登记原因）。第二刀已落地：dialog/drawer/upload/radio/checkbox 按实际渲染点声明（9 个导出）；tree/transfer/cascader 经核验无 slot 渲染点，按约定保持零声明 |
| F-103 | `packages/ui-kit/src/components/input/spec.mjs` / `tests/browser/attributes.spec.ts` | 属性落盘契约的红线清单（钉住 select/message/input/dropdown/input-number 必须命中）在门禁 test:browser 误红：input 被 prettier 从 JSON 词形（`"name": "id"`）重排为 JS 词形（`name: 'id'`），扫描正则只认前者 | spec.mjs 本质是 JS 模块，prettier 一遇机会就互转两种词形，而测试用源码正则当解析器 | spec 内容无损（id 声明仍在，仅词形变化）；扫描正则改为两种词形都认（`\\b` 键边界防 rename 误命中），并注释写明成因，防止下一只被 prettier 碰过的 spec 再触发同类误红                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### 31.2 验证

- build 层 21 文件 198 用例全绿（slot 契约 4 组 + types 契约修正后）；组件层 95 文件 1609 用例全绿；typecheck 零错误。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-103（F-99/F-101 含已登记的存量待改项），三处文档同步为 103 条。

## 32. 优化计划第五波：tabs SSR 首渲导航修复（F-99）（分支 `fix/20261108-tabs-ssr-nav`）

> 触发：§29.1 登记的 F-99 已知豁免到期修复。纯修复批次，无新增缺陷；顺带收敛 A22 留给 tabs 的 `--closable` 词形尾巴。

### 32.1 修复记录

| 编号 | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-99 | TabPane 组件类型打 `TAB_PANE_MARKER` 标记，Tabs 在渲染期从 default slot 的 VNode 声明式推导页签元数据（label/disabled/name/closable），不再依赖子组件 setup 注册（注册晚于父级首渲，SSR 单遍渲染时导航为空）。未命名页签写回确定性 fallback name（`pane-<序号>`）到 vnode.props 副本，子组件 setup 解析到同一个 name，SSR 与客户端 hydrate 输出逐字一致；可见列表 = slot 推导 + 注册补充按 name 去重、剔除已关闭项；未受控首渲激活项在渲染期落定（setup 期调 slot 会触发 Vue「Slot invoked outside of the render function」告警，零告警 spy 会抓）。`beforeMount` 方案经论证不可行：该钩子不在服务端执行。顺带收敛 tabs 尾部 `--closable` → `is-closable`（A22 台账 4 处 + 用例 1 处） |

### 32.2 验证

- worktree 全绿：`build:full`、ssr-hydrate 3/3（豁免移除后断言 SSR HTML 含 2 个 nav-item / role="tab" / aria-selected）、组件层 95 文件 1609 用例、浏览器层 18 文件 91 用例；typecheck 零错误。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-103（F-101 为唯一已登记存量待改项），三处文档同步为 103 条。

## 33. 优化计划第六波：尺寸/状态修饰类词形收敛（G7 A22）（分支 `refactor/20261108-size-class-unify`）

> 触发：`OPTIMIZATION_PLAN_V2.md` G7 A22。DoD 的「size 类名一致」grep 守卫随本波落地；tabs 目录由 F-99 wave（§32）顺带收尾。

### 33.1 缺陷登记

| 编号  | 文件                                                                              | 现象                                                                                                                                                                                                       | 根因                                         | 修复                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-104 | 18 个组件 `core.css` / `features/*/style.css` / `core.ts` / `shared/controls.css` | 尺寸类三套词形并存（`--size-*` 32 处 vs `is-size-*` 20+12 处 vs 裸 `--small/--large` 6+2 处）；状态类漂移出 `--closable`（15 处）/`--loading`（10 处）/`--vertical`（2 处），与多数派 `is-*`（641 处）并存 | 无词形公约、无守卫，各组件按当时参考库随手写 | 收敛为尺寸 `--size-<值>`、状态 `is-<状态>`（NAMING.md BEM 公约）；css 44 处选择器 + ts 26 处渲染字符串改名，22 个组件用例同步；零死类名（alert/table/select 旧类本就无规则）；接通 switch 在 controls.css 已有的 `.ui-switch.is-loading` 真实样式；守卫 `tests/build/size-class.spec.ts` 扫描漂移词形（tabs 为 F-99 wave 登记豁免，§32 已一并归并），已用 A22 前代码反证守卫非空转；tree-shaking 快照随可标记字面量变化重录 |

### 33.2 验证

- worktree 全绿：`build:all`、组件层 95 文件 1609 用例、build 层 24 文件 206 用例（含新守卫）、双配置 typecheck；prettier/eslint 零告警。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-104（F-101 为唯一已登记存量待改项），三处文档同步为 104 条。

## 34. 优化计划第七波：组件写法收敛到统一基座（G7 A24）（分支 `refactor/20261108-writing-convergence`）

> 触发：`OPTIMIZATION_PLAN_V2.md` G7 A24。同类实现必须收敛到 shared 出口（执行规范 11），三种组件写法（基座 / 手写 defineComponent / behavior 配置工厂）并存属同类漂移。执行中 agent 中途失联，交付物由整合者补完（button 涟漪渲染桩、悬空 state 引用、expose 残留）。

### 34.1 缺陷登记

| 编号  | 文件                                                                                                             | 现象                                                                                                                                                      | 根因                                                                                                                               | 修复                                                                                                                                                                                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-105 | `packages/ui-kit/src/components/{button,focus-trap,infinite-scroll,virtual-list}/core.ts`、`shared/component.ts` | 组件写法三轨并存：button/virtual-list 手写 defineComponent 自铺 render 管线，与基座 createUiComponent 的能力（特性 states/expose/attrs 合并）大量平行实现 | 基座早期能力缺口（无 root ref 进 setup、无 append/expose 覆盖点、attrs 拿不到特性 states、全局 size 注入不可关），组件绕过基座自造 | 基座补四个扩展点后四组件全部迁回：setup 上下文带 root ref、append（button 水波层）、组件级 expose（focus-trap/infinite-scroll/virtual-list 的 api）、attrs 第三参透传 states、globalSize:false 关闭开关（button 的 属性→按钮组→全局 继承链）；button 涟漪节点渲染、focusout emit、virtual-list 受控窗口语义保持不动 |

### 34.2 验证

- worktree 全绿：双配置 typecheck、组件层 95 文件 1609 用例、build 层 24 文件 207 用例（含新守卫）、profiles 层 151 用例；prettier/eslint 零告警。
- 新守卫 `tests/build/writing-convergence.spec.ts`：扫描组件 core.ts 的 defineComponent 残留，未豁免即红 + 豁免清单反向校验防死登记；已用 A24 前 main 反证非空转（当时报 button/focus-trap/infinite-scroll/virtual-list 四组件）。
- 豁免清单（带理由）：table（渲染管线复杂，迁移单列波次）、scrollbar（原生滚动封装，expose/事件面不重合）、roving-focus-group（headless 焦点组）、collection（纯注册节点）、collapse-transition（Transition 壳）、slot（渲染工具）。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-105（F-101 为唯一已登记存量待改项），三处文档同步为 105 条。

## 35. 优化计划第七波：命名存量改名第二刀（G7 A25 第二刀）（分支 `refactor/20261108-naming-float`）

> 触发：`OPTIMIZATION_PLAN_V2.md` G7 A25 第二刀 + NAMING.md §5 迁移清单。守卫（F-101）BASELINE 登记的 10 组件存量命名违规全部改完，白名单清空。三个调度 agent 均开机即失联（159 字节 transcript、零文件活动），改码由整合者执行；checkbox/check-tag 分支（`refactor/20261108-naming-vmodel`）的部分交付经审计后并入。

### 35.1 缺陷登记

| 编号  | 文件                                                                                                                                                                                        | 现象                                                                                                                                                                                                                                               | 根因                                                              | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-106 | `packages/ui-kit/src/components/{checkbox,check-tag,focus-trap,icon,menu,message-box,popper,roving-focus-group,tooltip,tour,upload}/core.ts`、`shared/behavior.ts`、demo presets/playground | F-101 守卫 BASELINE 的 10 组件存量违规：双 v-model 写口（checkbox/message-box/tour）、DOM 焦点词外泄（focus-trap）、动词原形布尔 prop（icon/menu/upload/popper）、camelCase 事件（roving-focus-group）、裸 show/hide/open 状态事件（tooltip/menu） | 各组件独立演化期命名随意，公约（NAMING.md）第一刀只立规矩未动存量 | 全部按 §5 清单改名：checkbox/check-tag `update:checked`→`checked-change`（shared checkboxChoiceState 内部写口经 setup 边界 withCheckedChange 转译，shared 基座不动）；focus-trap `focusout`→`blur`（原生 window 监听不动）；icon `spin`→`spinning`；menu `collapse`→`collapsed`、`open`/`close`→`submenu-change`(index, opened)；message-box `update:inputValue`→`input-value-change`；popper `open`→`expanded`（原目标「收敛 modelValue；open 删除」会丢 aria-expanded 驱动源，执行修正并回写 NAMING.md，PopperContent `visible` 单显示词合法保留）；roving-focus-group `itemFocus`/`itemBlur`→kebab；tooltip `show`/`hide`→`visible-change`；tour `update:current`+`change`→`current-change`（双出口并一）；upload `drag`→`draggable`（shared/behavior 三处引用同步） |

### 35.2 验证

- worktree 全绿：组件层 95 文件 1609 用例（含 11 份改名组件用例同步改断言）、naming-guard 6 用例在**清空后的 BASELINE** 上通过（两向校验：新增漂移红 + 死条目红，自测用合成源证明 6 模式全会咬人）；prettier/eslint 零告警。
- 改名清单与执行结果回写 NAMING.md §5（完成的行打勾，popper 记执行修正；剩余 visible 阵营统一、mention filterOption、close 一词两义为第三刀，需先扩守卫模式）。
- 交叉消费方已排查：tooltip 的 show/hide 无组件内/演示台监听者；menu `collapsed` 仅 tests/spec/demo 消费；popper `expanded` 仅 playground-preview/presets-extra 消费。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-106 全部修复（无已登记存量待改项），三处文档同步为 106 条。

## 36. 注释规范与注释风格守卫（RULES.md §1 机器化）（分支 `refactor/20261108-comment-sweep`）

> 触发：用户要求"注释干净、少、明了，后面要有规范"。规则落进 `RULES.md` §1（默认不写、只写 why、一条一行、禁复述/文档块/改码历史/占位/英文横幅）。全库审计先行：2083 条注释里约 95% 是承重 why（虚拟滚动中位数锚定、贴底锁、Boolean 归一化陷阱等），真正机械噪音只有分隔横幅一类，不做大清洗（避免毁掉承重知识）。

### 36.1 缺陷登记

| 编号  | 文件                                                                                                                                 | 现象                                                                                              | 根因                       | 修复                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-107 | `scripts/{test-impact,verify-governance}.mjs`、`packages/ui-kit/src/components/{form,select}/core.ts`、`tests/build/dev-api.spec.ts` | 分隔横幅式注释（`// ---- xxx ----`）13 处：文字有信息、横杠纯装饰；注释规范无机器守门，噪音会再生 | 早期用横幅当小节标题的习惯 | 横幅去横杠改普通注释（编号小节标题保留数字）；新增 `tests/build/comment-guard.spec.ts` 常驻守卫：分隔横幅 / TODO-FIXME-XXX-HACK 占位 / 空注释行三类全库零命中（不配 BASELINE，命中就改），合成源自测证明三模式会咬人；`--stage` 这类双横线开头的普通说明经精确正则豁免 |

### 36.2 验证

- worktree 全绿：comment-guard 3 用例（含合成源咬人自测）+ naming-guard 6 用例不回归；prettier/eslint 零告警。
- 审计结论回写 RULES.md §1.2（横幅入禁令）与 §1 例外（测试文件顶部契约头一块）。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-107 全部修复，三处文档同步为 107 条。

## 37. G6 结构性决策拍板记录（A17–A20）（roadmap 收官项）

> 触发：`OPTIMIZATION_PLAN_V2.md` G6「结构性决策，最后做且需逐项拍板」。四项全部有实测证据支撑，决策记录如下；本批不新增缺陷编号（属决策非缺陷）。

### 37.1 A17 特性裁剪收益有限 → 决策：文档明示「逻辑不裁」

- 证据（2026-11-08 实测 sizes.json）：175 个特性总边际 85187B（gzip ~19KB），139/175 特性边际 <500B，160/175 <1KB；最大五个为 image.preview 6082B / table.tree 4494B / tree.draggable 4165B / drawer.draggable 3128B / button.appearance 3004B。core(569926B)→full(650054B) 差 ~78KB。
- 结论：把 <500B 的逻辑真迁 feature（每个特性要拆 setup/render/css 三处并回归 20 份 profile）是纯负收益。
- 口径（写进裁剪文档与本节）：特性裁剪的价值 = props/类名/CSS 开关按特性集开关 + d.ts 按 profile 收缩；逻辑默认留 core，边际体积以 sizes.json 自证为准，不再追求「关掉即零字节」。

### 37.2 A18 d.ts 双事实源 → 决策：spec 维持单源，不引入 vue-tsc 抽取

- 证据：d.ts 已由 `scripts/build-lib.mjs` 的 generateTypes 从 spec.mjs（props/features/emits/slots 契约中枢）单源生成；`tests/profiles/props-documented.spec.ts` 双向守卫（运行时 prop ↔ 字典）×20 份 profile 已把「spec 撒谎」机器化，F-53 类漂移不会再无声漏过。
- 结论：vue-tsc 抽取会与 spec 生成形成第二事实源，两套对齐成本 > 收益。spec 单源 + 双向守卫就是收敛出口。

### 37.3 A19 发布链缺位 → 决策：延后至 1.0 前再议，暂不产品化

- 证据：0.x 未发布、本地零成本个人项目，无 consumers；package.json 已对齐 version/license/engines。
- 结论：workspaces + changesets + publish 现在落地是纯维护成本。触发条件：出现第一个外部消费者或定 1.0 计划时重启（届时 A25 第三刀的破坏性改名也要趁那个窗口前做完）。

### 37.4 A20 依赖 audit → 决策：dev-only 风险书面记录，升级单独立项

- 证据（2026-11-08 `npm audit --registry=https://registry.npmjs.org`）：生产依赖 0 漏洞；16 个漏洞全部 dev toolchain——critical 2（vitest 5.1.0 修、tinypool）、high 1（glob）、moderate 13（@typescript-eslint 8.36.0、@vue/test-utils 2.4.11、js-beautify、editorconfig 等）。修复路径 = vitest 3→5 大跳 + typescript-eslint 8 升。
- 结论：dev-only 不进入产物与用户面，风险可接受；但 vitest 5 大跳会波及 5 份 vitest 配置与 browser/provider API，必须单独分支评估（已登记任务 #23），不与任何功能波次混批。

## 38. a11y 批次第一刀：浮层焦点闭环（F-108）

> 触发：目标关闭前终审复审（只读 a11y 审计，交互复杂组件逐行过）确认 8 个 GAP，本波修 message-box / drawer 焦点闭环两项；其余浮层键盘可达项另案（cascader 家族 / date-time picker / color-picker+dropdown）。

### 38.1 缺陷登记

| 编号  | 文件                                                                                                                                                                                            | 现象                                                                                                                                                                                                      | 根因                                                                                             | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-108 | `packages/ui-kit/src/shared/behavior.ts`（overlayConfig）、`shared/focus.ts`（新增）、`components/{dialog,drawer,message-box,focus-trap}/core.ts`、`tests/browser/{drawer,message-box}.spec.ts` | 终审复审确认：message-box 与 drawer 有 `role=dialog` 但无初始聚焦 / Tab 圈禁 / 焦点归还（drawer 连 `aria-modal` 都没有）；dialog 里已有一套焦点三段实现，overlayConfig 体系内的 drawer / 后续浮层却接不上 | 焦点闭环停留在 dialog 单组件内，没有 shared 统一出口；可聚焦元素收集逻辑在 focus-trap 内重复一份 | overlayConfig 新增 `focusLoop` 开关统一收口：打开记录触发元素 + `nextTick` 初始聚焦、window capture 级 Tab/Shift+Tab 圈禁、关闭与卸载归还焦点，面板补 `aria-modal` 与按实例递增锚点的 `aria-labelledby`；dialog 删自带实现改走统一出口（行为逐行等价，既有浏览器契约不回归）；drawer 一行接入；message-box（teleport 到 body）按同款口径自实现；`getFocusableElements` 上收 `shared/focus.ts` 与 focus-trap 同源；新增 drawer / message-box 浏览器契约各 3 例（初始移焦 / Tab 回卷 / 关闭归还） |

### 38.2 验证

- worktree 全绿：全量单测 1638 条、浏览器契约 dialog/drawer/message-box 9 例、axe/console/a11y 影响面 16 例、comment-guard / naming-guard / writing-convergence 守卫零命中、tsc 双配置零报错。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-108 全部修复，三处文档同步为 108 条。

## 39. a11y 批次第二刀：date/time-picker 键盘可达（F-109）

> 触发：同 §38 终审复审，本波修 date-picker / time-picker「键盘打不开面板、网格/列内无方向键漫游」两项高严重度 GAP。

### 39.1 缺陷登记

| 编号  | 文件                                                                                                                  | 现象                                                                                                                                                                                                                                                                                       | 根因                                                      | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-109 | `packages/ui-kit/src/components/{date-picker,time-picker}/core.ts`、`tests/browser/{date-picker,time-picker}.spec.ts` | date-picker：trigger div keydown 仅 Escape，键盘打不开面板（面板只由 onClick 打开）；日格虽是原生 button 但到不了；日历网格内无方向键漫游。time-picker：field keydown 仅 Escape，input Enter 只提交草稿不打开面板；列项是原生 button 但面板键盘不可达，无方向键漫游（Tab 会穿 144 个按钮） | 浮层只实现了 pointer 打开路径，键盘路径与网格漫游从未实现 | trigger/field/input 三路 keydown 补 Enter/ArrowDown 打开（草稿未改动时 Enter 语义=打开，有改动保持原提交路径不破坏 F-57/F-58）；打开后焦点落进网格：date-picker 优先已选日→今天→首个非禁用日格，time-picker 落首列选中项（禁用退首个可用项）；日历网格 ←→↑↓（按 7 列整周跳）/Home/End、时间列 ArrowUp/Down，全部逐格扫描跳过 disabled（对齐 menu/tree skip-disabled 口径）；Escape 关闭并归还焦点（外点关闭不归还，避免抢焦点）；输入框 keydown 经 `closest('input')` 挡重；新增浏览器契约各 5 例 |

### 39.2 验证

- worktree 全绿：date-picker 32 + time-picker 40 + scenes 9 单测、新增浏览器契约 10 例、回归浏览器层 22 例（a11y/attributes/interaction/time-picker.scene）、comment-guard / naming-guard / writing-convergence 守卫零命中、typecheck 干净。
- 门禁：合入后在 `main` 与其余 a11y 波次统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-109 全部修复，三处文档同步为 109 条。

## 40. a11y 批次第三刀：cascader 家族键盘可操作（F-110）

> 触发：同 §38 终审复审，本波修 cascader / cascader-panel「键盘完全无法操作」两项高严重度 GAP（含随行低severity项：clear 图标与多选 tag-close 键盘不可达）。

### 40.1 缺陷登记

| 编号  | 文件                                                                                                                                | 现象                                                                                                                                                                                                                                                                                                                                               | 根因                                                          | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-110 | `packages/ui-kit/src/components/cascader/{core.ts,core.css}`、`components/cascader-panel/core.ts`、`tests/browser/cascader.spec.ts` | cascader：trigger div 的 onKeydown 只处理 Escape，键盘打不开面板；面板节点是不可聚焦 div，无 tabindex/keydown/role；filterable 输入框 Enter 不会选中搜索结果；clear 图标与多选 tag-close 是无 tabindex 的 span，键盘无法清除/删标签。cascader-panel：整文件无一个 keydown/tabindex，`role='option'` 节点不可聚焦，listbox 语义存在却无任何操作通道 | 浮层只实现了 pointer 路径，roving tabindex 与键盘映射从未实现 | trigger 接 Enter/Space 开合（triggerConfig 同款口径，内层 button/input 冒泡不重复 toggle），非 filterable 打开时焦点自动移入面板 roving 节点；面板 roving tabindex（整面板一个 Tab 停靠点，键盘/点击共用 focusKey 同步，失效兜底第一列首个非禁用节点，对齐 tree/menu 口径）；键位映射：↑↓ 同列移动（跳禁用、边界停住）、→ 展开并进子列首项（子列新建 DOM 须 nextTick 重新查询）、← 收起或回父级、Home/End 跳列首末、Enter/Space 等同点击（checkbox 模式 Space 拨动复选框）、Escape 收起归还 trigger；cascader-panel 同套 roving+键位挂组件根（与 menu 相同接法），根 disabled 整面板退出键盘导航；filterable Enter 选中首个非禁用搜索结果；clear/tag-close span 改原生 `<button type="button">`（message-box close 先例，CSS reset）；新增浏览器契约 8 例 |

### 40.2 验证

- worktree 全绿：cascader/cascader-panel 39 单测、浏览器契约 8 例、axe/console-clean 回归 9 例、comment-guard / naming-guard / writing-convergence 守卫零命中、verify-governance 场景覆盖确认、tsc/eslint/prettier 干净。
- 门禁：合入后在 `main` 与其余 a11y 波次统一执行全量 `npm run quality`。
- 缺陷口径：F-1…F-110 全部修复，三处文档同步为 110 条。

## 41. a11y 批次第四刀：color-picker / dropdown 键盘可操作（F-111）

> 触发：同 §38 终审复审，本波修 color-picker「键盘打不开面板且取色滑杆纯指针」与 dropdown「开得了选不了（item 无 tabindex/role、焦点不移入、无方向键）」两项 GAP。交付 agent 在最终验证前触顶中断，残稿由整合者核验后提交（门禁全量兜底）。

### 41.1 缺陷登记

| 编号  | 文件                                                                                                                                                                                         | 现象                                                                                                                                                                                                                                                                                                                   | 根因                                                                    | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| F-111 | `packages/ui-kit/src/components/color-picker/{core.ts,core.css}`、`components/dropdown/core.ts`、`shared/behavior.ts`（triggerConfig）、`tests/browser/{color-picker,dropdown,a11y}.spec.ts` | color-picker：trigger onKeydown 仅 Escape，键盘打不开面板；SV/hue/alpha 滑杆是纯 pointerdown 拖拽 div，无 tabindex/role/方向键，取色本身键盘不可完成。dropdown：triggerConfig 已给 Enter/Space + aria-expanded，但 item 是 li、无 tabindex/role=menuitem，打开后焦点不移入面板、无方向键导航，trigger 缺 aria-haspopup | 浮层键盘路径与 roving 从未实现；aria-haspopup 未纳入 triggerConfig 口径 | color-picker：trigger 补 Enter/Space 打开（对齐 triggerConfig 映射）并把焦点送进面板，三个滑杆 role=slider + tabindex + aria-valuenow/min/max/text + 方向键步进（SV 1%、色相 1°、透明度 1%，与指针拖拽口径分离），focus-visible 焦点环补样式，Escape 关闭归还 trigger；dropdown：面板 onKeydown 收口 WAI-ARIA 菜单映射（↑↓ 循环、Home/End、Enter 同点击、Escape 归还 trigger），item 经 provide/inject 上下文接 roving tabindex（整组一个 Tab 停靠点，禁用退出、失效兜底首个可用项、点击同步停靠点），键盘打开才移交焦点（悬停/点击不抢），triggerConfig 新增 `ariaHaspopup` 选项并输出到 trigger（dropdown 取 role | 'menu'）；a11y 浏览器场景同步升级为焦点移交 + 菜单漫游断言 |

### 41.2 验证

- 待全量门禁（`npm run quality`，13 阶段）在 `main` 统一验证；agent 侧未及跑完的自验由门禁覆盖。
- 缺陷口径：F-1…F-111 全部修复，三处文档同步为 111 条。

## 42. locale 迁移波次：18 个命名空间、85 个键（F-112）

> 触发：ConfigProvider 的 `locale` 此前只覆盖 empty / select / transfer 3 个命名空间、7 个键；日期 / 时间 / 级联 / 取色 / 表格 / 树 / 消息框等 19 个组件的可见文案与无障碍标签全部硬编码中文，注入 locale 也改不动。

### 42.1 缺陷登记

| 编号  | 文件                                                                                                                                                                                                                                                                                                                                                                                        | 现象                                                                                                                                                                                                                                                                                                                                                                                                                                         | 根因                                                                                                          | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-112 | `packages/ui-kit/src/shared/config.ts`、`components/config-provider/spec.mjs`、19 个组件 `core.ts`（date-picker / date-picker-panel / calendar / time-picker / time-select / color-picker / color-picker-panel / cascader / cascader-panel / table / tree / tabs / message-box / popconfirm / tour / carousel / backtop / input-tag / transfer）、`components/{table,message-box}/spec.mjs` | ConfigProvider 只能改 empty / select / transfer 三段文案；其余组件的按钮（今天 / 此刻 / 确定 / 清空 / 确认 / 取消）、日历周起与年月标题、年份面板与翻页 aria、级联层级 / 移除标签 / 折叠计数 aria、取色滑杆 aria 与 SV 值播报、表格展开收起 aria、引导 / 标签页 / 轮播 / 回到顶部 / 输入标签的无障碍标签全为硬编码中文，切英文界面仍见中文；table / message-box 还把文案重复写进 `props.default` 与 `spec.mjs` 默认值，locale 永远无机会生效 | locale 只有 3 个命名空间的最小地基；模板文案没有统一插值出口；组件把文案在 props 默认值与渲染字符串里各写一份 | `defaultUiLocale` 扩到 18 命名空间 85 键（新增 15 命名空间、78 键），键级浅合并保证「只注入部分键」时未注入键落回默认中文；新增 `formatLocale` 统一 `{key}` 插值；按 4 个组件族迁移 19 个组件，无障碍 aria-label 与可见文案同源；table / message-box 删掉 props 与 `spec.mjs` 的文案默认值，改为「props 显式传值 → locale → 默认中文」三级；time-picker `rangeSeparator` 保留 props 默认 `-` 优先于 `locale.separator`；`config-provider/spec.mjs` 的 locale 类型串同步 18 命名空间（否则生成的 d.ts 拒收新键）；新增 20 条 locale 注入 / 缺键回退用例 |

### 42.2 验证

- 组件用例：注入键生效、未注入键回退中文、切换 locale 立即反映到已展开面板；四个组件族各至少一条 locale 用例，color-picker-panel 单独验证模板插值（`Preset {color}`）。
- 门禁：合入后在 `main` 统一执行全量 `npm run quality`（13 阶段）验证体积预算与覆盖率阈值。
- 缺陷口径：F-1…F-112 全部修复，三处文档同步为 112 条。

## 43. A25 第三刀：显示受控统一 v-model + mention 混型拆分（F-113）

> 触发：NAMING.md §5 迁移清单最后两行——dropdown / popover / popconfirm / tooltip / loading 的 `visible` 与 dialog 系 `modelValue` 分属两套显示受控词，triggerConfig 还直接抛裸 `show`/`hide`（与 §3.2「状态事件统一 xxx-change」冲突）；mention 的 `filterOption: Boolean|Function` 把开关与谓词塞进同一 prop。

### 43.1 缺陷登记

| 编号  | 文件                                                                                                                                                                                                                                                                                                                                                                                                                      | 现象                                                                                                                                                                                                                                                                                                                                                                                                                    | 根因                                                                    | 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-113 | `packages/ui-kit/src/shared/behavior.ts`（triggerConfig）、`components/{dropdown,popover,popconfirm,tooltip,loading,mention}/core.ts` 及对应 `spec.mjs`、`components/popconfirm/core.ts`（emits）、`examples/consumer/src/demo/{presets-extra.ts,playground.ts,playground-preview.ts}`、`tests/components/{dropdown,popover,popconfirm,tooltip,loading,mention}.spec.ts`、`tests/build/naming-guard.spec.ts`、`NAMING.md` | 显示受控两套词：dialog / drawer 等 6 组件用 `modelValue`，dropdown / popover / popconfirm / tooltip / loading 5 组件用 `visible`，消费方切组件就得换绑定写法；triggerConfig 受控判据读 `props.visible`、交互只发裸 `show`/`hide`，既与事件公约冲突，又让 popconfirm 的 `cancel`/`confirm` 未声明 emits 而回落 attrs 形成双通道；mention 的 `filterOption` 既当布尔开关又当过滤函数，类型 `[Boolean, Function]` 语义二义 | 显示受控未统一到 v-model 协议；事件命名停在第二刀之前；混型 prop 没拆开 | triggerConfig 改读 `props.modelValue`：受控时交互只发 `update:modelValue` 请求父级回写、非受控时 applyShow/applyHide 同步回写，两者都额外发 `visible-change`，emits 显式声明 `['visible-change', 'update:modelValue']`；dropdown / popover / popconfirm / tooltip 的 `visible` 改 `modelValue`（`default: undefined` 保留非受控回退），loading 同改（`default: true`）；popconfirm 补 `emits: [...base, 'cancel', 'confirm']`；mention 拆 `filterable`（Boolean，默认 true）+ `filterMethod`（Function，`(query, item)`，与 select/cascader 同签名），默认 label 包含匹配与 `search` 事件口径不变；demo 预设与调试台事件映射同步改名；naming-guard 新增 `display-prop-word`、`mixed-type-prop` 两条模式（含 `emits` 数组展开的括号配平解析修正），BASELINE 仅登记 popper `visible` 与 table `showCheckbox` 两处书面豁免 |

### 43.2 验证

- 组件用例：六个组件的 v-model 语义用例（受控只回写 update、非受控同步抛 visible-change + update、外部改写 modelValue 驱动开合）与 mention `filterable=false` 全量 / `filterMethod` 优先 / 默认包含匹配三态。
- 守卫：naming-guard 8 模式自测全命中（构造源逐模式断言），全量扫描白名单外零命中、白名单零死条目。
- 门禁：合入后在 `main` 执行全量 `npm run quality`（13 阶段）验证体积预算、覆盖率与浏览器层回归。
- 缺陷口径：F-1…F-113 全部修复，三处文档同步为 113 条。

## 44. Tree 统一：移除 TreeV2、固定高度能力并入 Tree（分支 `feature/20261108-tree-unify`）

> 触发：用户决策——TreeV2 组件不需要；其虚拟化属性（固定高度视口）并入 Tree，全库只保留一棵树。

### 44.1 变更内容

- 删除 `packages/ui-kit/src/components/tree-v2/`（core / core.css / spec / features/check）与 `tests/components/tree-v2.spec.ts`；`tree-v2.check` 的复选能力 Tree 本就全量具备（showCheckbox / defaultCheckedKeys / checkStrictly / checkOnClickNode），零能力损失。
- Tree 新增 `height: string | number` core prop：存在时根节点挂 `is-scrollable`，`.ui-tree__nodes` 写高度并 `overflow: auto`（样式只在 is-scrollable 下生效，不扰动 tree-select / transfer 内嵌场景）。
- 调试台：Tree 预设新增「固定高度滚动」「缩进 28」，TreeV2 预设与目录节点移除；`scripts/demo-categories.mjs`、`playground.ts`、`presets-extra.ts` 同步。
- 守卫：`verify-governance.mjs` 的「旧组件不得复活」从 Select 单例扩展为清单（select-v2 / tree-v2），并断言 Tree spec 保留 `height`（防统一改造被架空）。
- 文档数字：README 组件数 89→88；KNOWLEDGE / visual-audit / test-impact 的导出数 124→123、组件目录数 89→88。

### 44.2 验证

- 组件用例：`tests/components/tree.spec.ts` 新增 height 用例（is-scrollable 类名 + 容器内联高度），移植自 tree-v2 用例；tree 全量用例绿。
- 本批为功能改造不新增缺陷编号；历史 F-98（tree-v2 无 ARIA/键盘）随组件移除闭环，缺陷清单仍记 113 条。
- 门禁：合入 `main` 后由 integrator 重跑 `meta:demo` / `build:all` 刷新派生基线（sizes.json、demo/meta.json 不进任务分支），全量 `npm run quality`（13 阶段）把关。
