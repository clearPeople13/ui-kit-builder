# 需求说明：组件库测试用例体系（前两批共 27 个组件）

## 1. 需求背景

项目此前只有一层"构建产物是否正确打包"的校验（`npm run verify`、`npm run verify:consumer`），
以及依赖 Playwright 的浏览器截图回归。组件的行为、属性推导、事件抛出和边界情况没有任何单元测试覆盖，
改动 `shared/behavior.ts` 或某个特性模块时无法快速判断影响面。

本需求为组件库建立可持续运行的单元测试层，并先把使用频率最高的核心组件覆盖起来。

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

## 3. 关键设计决定

| 决定     | 结论                                                         | 原因                                                                                                          |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 测试对象 | 构建产物 `dist/full/ui-kit.js`，通过别名 `@ui-kit-full` 引入 | 与消费方 `examples/consumer` 的引用方式一致，测的是"真正被使用的那份代码"；`build:full` 仅约 3 秒，成本可忽略 |
| 构建时机 | `pretest` 钩子自动执行 `npm run build:full`                  | 避免出现"源码改了但测试仍跑旧产物"的假绿                                                                      |
| DOM 环境 | happy-dom                                                    | 组件全部是渲染函数，无 SSR 专属逻辑；happy-dom 比 jsdom 快，足以支撑类名/事件断言                             |
| 断言口径 | 以真实 DOM 输出为准，而非源码推测                            | 写用例前用临时探针脚本采集每个组件的类名、内联样式与 emit 载荷，再据此固化断言                                |
| 浮层组件 | `attachTo: document.body` + 直接查询 `document`              | Select 下拉、Dialog 面板 teleport 到 body，`wrapper.html()` 只剩传送门注释                                    |
| 缺陷记录 | `tests/findings.spec.ts` 内使用 `it.fails`                   | 断言失败才算通过；组件一旦修好该用例会转为失败，提示把断言迁回对应组件用例                                    |

## 4. 验收标准

1. `npm test` 全绿，首批交付为 13 个测试文件、258 条用例；缺陷修复批次补齐守卫后为 12 个文件、266 条用例；第二批交付后为 28 个文件、600 条用例（新增 15 个组件 319 条 + 缺陷守卫 15 条），单次运行耗时 ≤ 5 秒（不含构建）
2. `npm run test:watch` 可增量运行；`npm run test:coverage` 可产出覆盖率报告
3. `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm run verify` 均不因新增测试而失败
4. 12 个组件各自具备"行为 + 属性 + 事件 + 边界"四类断言，缺失维度需在文档或注释中说明原因
5. 已知缺陷以 `it.fails` 守卫形式存在且有根因注释；修复批次把守卫降级为组件文件里的常规回归用例，而不是删掉了事

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

## 6. 后续批次建议

- 第二批已交付（分支 `feature/20261106-component-tests-batch2`，内容见 §7），其缺陷也已清除（分支 `fix/20261107-component-defects-batch2`，内容见 §7.1）
- 第三批已交付（分支 `feature/20261107-tests-batch3`，内容见 §8）：构建器侧的裁剪契约、产物自证信息、体积阈值与主题令牌快照，附带清掉构建器缺陷 F-26、F-28，并记录 F-27
- 第四批已交付（分支 `feature/20261107-quality-gate`，内容见 §9）：真实浏览器层的布局 / 定位 / 拖拽 / 滚动 / 键盘断言、控制台告警归零、属性落盘扫描、布局指纹基线、用例侧类型检查，附带清掉浏览器层暴露的缺陷 F-29~F-33，全部收敛成一条 `npm run quality`
- 第五批（建议）：把 `npm run quality` 接到 CI 与提交钩子（当前仍是本地一条命令），并把"裁剪后 19 份 profile 的运行时可用性"补成按 profile 起 alias 的关键用例
- 缺陷修复已按"单独分支 + 单独 PR"完成（`fix/20261106-component-defects`），每条 `it.fails` 守卫都降级为组件文件里的常规用例；后续批次沿用同一约定
- §5 的 F-1~F-10、§7.1 的 F-11~F-25 均已修复，守卫文件 `tests/findings.spec.ts` 按约定删除

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
| F-27 | `scripts/build-all.mjs` | `sizes.json.features` 恒为空对象，构建器界面拿不到"单个特性的体积成本"           | 增量靠"恰好等于 `requires` 与 `requires + [id]` 的两份 profile"配对求得；仓库里除 core（0 特性）外 19 份都是全特性集，任何配对都不成立     | 本批不改口径，先把事实钉住：`size-budget.spec.ts` 重算出"能被现有 profile 对测出增量"的集合恰好是空集，用例注释写明后果                                                                            | `size-budget.spec.ts`「features 段恰好等于"能用现有 profile 对测出增量"的特性集合」                                                                                           |
| F-28 | `normalizePropType`     | `index.d.ts` 里出现 `((...args: any[]) => any \| any[])`，数组分支被吞进返回类型 | 括号深度表把 `=>` 的 `>` 当右括号，深度穿到负数，箭头函数之后的顶层 `\|` 不再拆分                                                          | 深度计算跳过 `=` 之后的 `>`；两份 `spec.mjs` 把有歧义的类型写成显式括号（`((...args: any[]) => any) \| any[]`、`(value: string) => (boolean \| string \| undefined)`），生成器 `tsType` 同步补括号 | `builder-functions.spec.ts`「F-28：=> 的右尖括号不计入括号深度」「d.ts 里每一行属性类型都已规范化且幂等」                                                                     |

## 9. 第四批交付（质量门禁：真实浏览器层 + 统一入口，分支 `feature/20261107-quality-gate`）

第三批之后仍有 612 条用例全绿，而浏览器里打开示例页会直接抛 `TypeError: Failed to set an indexed property [0] on 'CSSStyleDeclaration'`。两者的落差来自 happy-dom：它把所有元素的矩形算成 0，样式表与布局不参与判定，于是"定位、翻转、夹取、滚动跟随、拖拽、真实尺寸、控制台告警"这一整类事实在单元层不可证伪。第四批不再补用例，而是把这一类缺口整体接进来，并把所有检查收敛成一条命令。

### 9.1 门禁清单（`npm run quality`）

| 顺序 | 入口                      | 规模                         | 堵住的缺口                                                                    |
| ---- | ------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| 1    | `npm run format:check`    | 全仓 ts / mjs                | 格式漂移导致评审 diff 失真                                                    |
| 2    | `npm run typecheck`       | 库 + 用例两份工程            | 组件属性表与用例的拼写错误；新增 `tsconfig.tests.json` 把 `tests/**` 纳入检查 |
| 3    | `npm run lint`            | eslint 全仓                  | 单行 `if`、`==`、`var` 等一致性                                               |
| 4    | `npm run verify`          | 库级校验                     | 产物存在性、API 一致性、图标名单三方对齐                                      |
| 5    | `npm test`                | 94 文件 1570 条              | 组件行为、属性、事件、边界（happy-dom，90 个目录全覆盖，无占位跳过）         |
| 6    | `npm run test:build`      | 7 文件 89 条                 | 裁剪、令牌、体积、类型生成（20 份 profile）                                   |
| 7    | `npm run test:browser`    | 9 文件 51 条                 | 真实布局 / 定位 / 滚动 / 拖拽 / 键盘 / 控制台归零 / 属性落盘 / 布局基线 / 固钉回顶引导 |
| 8    | `npm run verify:consumer` | 正向类型 + 8 条反向 + 运行时 | 消费方按产物消费时的类型契约与渲染                                            |

### 9.2 浏览器层用例（`tests/browser/**`，Chromium + 固定 1280×720）

| 文件                                                                       | 用例 | 盯住的缺口                                                                               |
| -------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| [tests/browser/floating.spec.ts](tests/browser/floating.spec.ts)           | 8    | 贴边翻转、右沿夹取、Select 面板等宽、滚动时面板与触发器相对位移恒定                      |
| [tests/browser/table.spec.ts](tests/browser/table.spec.ts)                 | 6    | body 独立滚动而表头 / 合计固定、横向 scrollLeft 同步、冻结列贴边、列宽拖拽落列、合计数值 |
| [tests/browser/tree.spec.ts](tests/browser/tree.spec.ts)                   | 4    | 5000 子节点展开耗时（实测 96 ms，门禁 800 ms）、逐层展开的节点数与 `node-click`          |
| [tests/browser/interaction.spec.ts](tests/browser/interaction.spec.ts)     | 5    | 取色器 SV 区 / 色相条的真实矩形命中、点选与按住拖动的连续更新、十六进制回显一致          |
| [tests/browser/a11y.spec.ts](tests/browser/a11y.spec.ts)                   | 7    | Tab 序列命中触发器 / 标签页 / 开关、Enter 展开、Space 收起、Escape 关闭、焦点可见        |
| [tests/browser/attributes.spec.ts](tests/browser/attributes.spec.ts)       | 3    | 以 `spec.mjs` 为清单的 `id` 落盘扫描、全导出字符串 `style` 扫描、Popover 样式路由        |
| [tests/browser/console-clean.spec.ts](tests/browser/console-clean.spec.ts) | 3    | 全家桶默认属性渲染零告警 / 零异常、渲染数量与尺寸下限                                    |
| [tests/browser/visual.spec.ts](tests/browser/visual.spec.ts)               | 6    | 六个场景的布局指纹与基线比对（容差 1px，按平台分桶，`npm run snap:layout` 重录）         |
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

配套改动：`tsconfig.tests.json` 把 `tests/**` 与三份 vitest 配置纳入 `npm run typecheck`（先取 `strict: false` 的宽松档，拦拼写与 DOM 类型误用）；`eslint.config.mjs` 与 `.gitignore` 同批忽略 `_scratch/`、`.trae-html-share-packages/`，临时探针不再污染 lint；`sweep-shots.mjs` 顺带过了一遍 `eslint --fix`。体积影响：`dist/full/ui-kit.js` 641367 B（较上一批 +914 B，来自 `mergeStyles` 与键盘 / Escape 通路），CSS 250588 B 不变。

仍存在的缺口，按重要性排列：没有 CI 与提交钩子，`npm run quality` 目前靠本地自觉执行；布局基线只比几何矩形不比像素，且非本机平台自动跳过；浏览器层 8 个文件串行执行约 15 s，profile 只验 `dist/full` 的运行时，另外 19 份产物仍只有结构与体积证据；覆盖率未设阈值门禁；真实设备（触摸、输入法、异构字体）未纳入。

## 10. 第五批交付（全 profile 运行时校验 + 门禁阶段化与提交钩子，分支 `feature/20261107-every-profile-runtime`）

§9.4 里排在第三位的缺口——"profile 只验 `dist/full` 的运行时，另外 19 份产物仍只有结构与体积证据"——本批补齐；同时把"靠本地自觉执行 `npm run quality`"换成机制。

### 10.1 门禁清单（更新后共九段）

`npm run quality` 与 `npm run ci` 同序：格式 → 类型（库 + 用例）→ lint → 库级校验 → 组件用例 → 构建器侧契约 → **20 份 profile 运行时** → 真实浏览器层 → 消费方校验。`node scripts/ci.mjs` 与 `npm run quality` 的区别是它给出逐段结论与耗时，并落一份机读的 `ci-report.json`（已 gitignore），任何 runner 都能只看退出码与 JSON 判定，不必 grep 终端输出。

| 段落     | 命令                                   | 说明                                                                     |
| -------- | -------------------------------------- | ------------------------------------------------------------------------ |
| 秒级四段 | `npm run ci:fast`                      | 格式 / 类型 / lint / 库级校验，`.githooks/pre-commit` 就是它             |
| 全量九段 | `npm run ci`                           | 含三层用例、profile 运行时与消费方校验，`.githooks/pre-push` 就是它      |
| 单段     | `node scripts/ci.mjs --stage profiles` | 只跑名字命中的阶段，便于定位                                             |
| 装钩子   | `npm run hooks:install`                | `git config core.hooksPath .githooks`，一次即可；`SKIP_HOOKS=1` 留逃生门 |

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
| F-36 | `watermark` 核心                   | `ui-watermark__layer` 同样是死类名                                         | 图层靠内联样式定位，类名只是占位                                                                                    | 已修：`watermark/core.css` 补 `.ui-watermark__layer { user-select: none }`，图层类名成为可覆写的真实落点（分支 `fix/20261107-dead-class-names`），`dead-classes` 守卫转绿 |

同批还发现 `ui-rate__icon--void` 无独立规则，但状态修饰类允许由基础规则兜底（Alert 的默认 `effect=light` 同理），不计入缺陷，用例也只对 `前缀-组件` 与 `前缀-组件__元素` 两类结构性类名要求样式覆盖。

### 10.4 交付说明与仍存的缺口

新增一层不改变任何产物内容：`sizes.json` 与 20 份 `dist/**` 在本批未动。九段门禁在本机一次跑通的体量约为组件层 30 s + 构建器层 15 s + profile 层 20 s + 浏览器层 60 s。

仍存在的缺口：布局基线仍只比几何矩形不比像素；覆盖率仍未设阈值门禁；真实设备（触摸、输入法、异构字体）未纳入；`ci.mjs` 目前只在本机与钩子里生效，仓库还没有服务端 runner——Gitee 上这两个 Issue 的评论功能处于关闭状态，`PATCH /repos/.../issues/{number}` 对这类 Issue 返回 404，结案的评论需要开 Issue 评论权限或改用 Web 界面补。

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

| 编号 | 位置                         | 现象                                                                                   | 根因                                                                                                                  | 修复                                                                                                   | 回归用例                      |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------- |
| F-39 | Link、Result                 | 传 `tag="span"` / `tag="section"` 不换标签，只把无效属性漏到 DOM 上                     | 两处 `tag` 读取都写在 `tag: (props) => …` 里，但 props 表从未声明 `tag`，值只进 attrs                               | 两处 core props 补 `tag: { type: String }`（无 default，保住"没传就用默认标签"），spec.mjs 同步             | link.spec / result.spec       |
| F-40 | DatePickerPanel              | `type: 'month'` 提交 `2026-03-01`、`type: 'year'` 提交 `2022-01-01`                     | `outputFormat()` 只读 `valueFormat / dateFormat`，缺省恒为 `YYYY-MM-DD`，没按粒度收敛                                  | 缺省输出按 `gridType()` 分支：月 `YYYY-MM`、年 `YYYY`、日 `YYYY-MM-DD`                                  | date-picker-panel.spec        |
| F-41 | Slider popper 特性           | 垂直滑块的气泡仍贴顶部（`is-top`），而不是右侧                                         | 特性声明给 `placement` 设了 `default: 'top'`，`behavior.ts` 里 `vertical ? 'right' : 'top'` 的兜底永远走不到           | 去掉 default，改为缺省 `undefined`；spec.mjs 的 default 同步为 `null`                                   | slider.spec                   |
| F-42 | `shared/behavior.ts` range   | 低位从 20 拖到 30 后，`change` 仍回吐 `[20, 60]`                                        | `onChange` 读的是 props 派生的 `rangeLow / rangeHigh`，父层尚未回写时落后一拍                                           | `onChange` 改读原生输入框当前值并做 min/max 归一                                                         | slider.spec                   |
| F-43 | ColorPickerPanel             | `predefine: ['red']` 点选得到兜底蓝 `#409eff`                                           | `parseColor` 只认 `#` / `rgb()` / `hsl()`，颜色名直接落兜底                                                           | 兜底前加 `chroma.valid` 分支（与 ColorPicker 同源依赖），颜色名归一为 RGBA                              | color-picker-panel.spec       |
| F-44 | InputTag                     | `trigger: 'Both'` 按空格不提交，退化成只认 Enter                                       | `Both` 在映射表里是 `null`，`TRIGGER_KEY_MAP[...] ?? 'Enter'` 把 null 当成缺省值，`null` 分支永不可达                  | 改为 `in` 判键存在，null 分支按 "Enter 与空格都提交" 处理                                                | input-tag.spec                |
| F-45 | PopperContent                | `className` 完全丢失                                                                   | `attrs` 返回的 `class` 被 `component.ts` 用宿主 `attrs.class` 重建的 class 数组覆盖                                    | `className` 改走 `classes` 合并（字符串 / 数组 / 对象 / 布尔四档归一）                                  | popper.spec                   |
| F-46 | PopperContent                | `content / label / title` 只落到 HTML 属性，面板内无文本                               | props 表未声明这五个内容位，`content()` 的回退链读到的全是 `undefined`                                                | props 表补 `content / label / title / description / value`，spec.mjs 同步                                | popper.spec                   |
| F-47 | SelectV2                     | 非过滤态下焦点在触发器按 Escape 不收起面板                                             | Escape 只绑在面板上，面板是触发器的兄弟节点，键盘事件到不了                                                            | 触发器 `onKeydown` 补 Escape → `hideDropdown()`                                                         | select-v2.spec                |
| F-48 | TreeSelect                   | 触发器 `tabindex=0` 可聚焦，但 Enter / Space 无任何反应                                 | 触发器只挂了 `onClick`，没有键盘通路                                                                                  | 触发器补 `onKeydown`：Enter / Space 开合、Escape 收起                                                   | tree-select.spec              |
| F-49 | CheckTag                     | `type` 声明了 primary / success / info / warning / danger，但任意值都不产生修饰类名     | `classes` 只拼了 `is-checked` / `is-disabled`，从未消费 `type`                                                        | 四个有独立配色规则的变体发 `ui-check-tag--{type}`；primary 走基础规则，不造无样式规则的死类名             | check-tag.spec                |
| F-50 | Notification                 | 传 `modelValue=false` 不会隐藏，值只漏成属性                                           | `overlayConfig` 以 `modelValue` 为可见性通道，但组件 props 表没声明它，`resolveVisible` 永远取缺省 `true`               | props 表补 `modelValue: { type: Boolean, default: true }`，spec.mjs 同步                                | notification.spec             |

另有一条复核后判定"不是缺陷"：Popconfirm 的 `hideAfter` 只在触发器 `mouseleave` 后延迟收起，确认 / 取消按钮点击立即关闭——与 Element Plus 口径一致，`spec.mjs` 的描述没写清作用范围。守卫已改为契约用例，明确"按钮路径不受 `hideAfter` 影响"。

### 11.4 交付说明

- 探针清零：本批遗留的 12 个 `_probe_*.spec.ts` 全部删除，`tests/components/` 只保留正式用例。
- 产物变化来自 F-39…F-50 的源码修复，`npm run build:all` 重新生成 20 份产物与 `sizes.json`；`examples/consumer/src/demo/meta.json` 随 `meta:demo` 同步。
- 门禁：组件层 94 文件 1570 条全部通过（无占位跳过）；构建器层 7 文件 89 条、profile 运行时 2 文件 142 条、浏览器层 9 文件 51 条、`verify` 2239 项全部通过。
- 用例工程 `tsconfig.tests.json` 的 15 条类型基线（affix / autocomplete / breadcrumb / cascader / collapse / roving-focus-group / space）已全部清零，`npm run typecheck` 两份工程均无输出。

### 11.5 六批次与缺陷收口

| 批次   | 交付内容                                                        | 分支                                        | 缺陷                      |
| ------ | --------------------------------------------------------------- | ------------------------------------------- | ------------------------- |
| 首批   | 13 个测试文件 258 条，核心组件行为与属性                        | `feature/20261106-component-tests`          | F-1…F-18，另开修复分支     |
| 缺陷修 | `it.fails` 守卫全部降级为常规用例                               | `fix/20261106-component-defects`            | F-1…F-18 修复与回归       |
| 第二批 | 15 个组件 319 条 + 守卫降级，28 文件 612 条                     | `feature/20261106-component-tests-batch2`   | F-19…F-25，修复分支并行    |
| 第三批 | 构建器侧 6 文件 68 条：裁剪、令牌、体积、类型                   | `feature/20261107-tests-batch3`             | F-26、F-28 修复；F-27 记录 |
| 第四批 | 真实浏览器层 8 文件 42 条 + 统一门禁 `quality`                  | `feature/20261107-quality-gate`             | F-29…F-33                  |
| 第五批 | 20 份 profile 运行时 2 文件 142 条 + 阶段化 runner 与钩子       | `feature/20261107-every-profile-runtime`    | —                         |
| 第六批 | 63 个组件目录全量接入，94 文件 1576 条；属性字典双向回查 41 条 | `feature/20261107-tests-batch6`             | F-39…F-50                  |
| 收口   | 15 条类型基线清零、格式与 lint 归零、全部合入 `main`            | `main`                                      | F-34…F-38（前批遗留）      |

- 六批共记录 50 条缺陷（F-1…F-50），全部已修复且都留有会红的回归用例；守卫文件 `tests/findings.spec.ts` 已随修复删除，不允许以 `it.fails` 长期挂账。
- 15 条分支（8 条 `feature/*`、7 条 `fix/*`）全部已合入默认分支 `main`，合并后 `git branch --merged main` 覆盖全部分支；Gitee 侧 issue（IKTJSG、IKTJS5）均为 closed，PR #1、#2 均为 merged，无遗留待办。
- 收口后的门禁基线：组件层 94 文件 1570 条、构建器层 7 文件 89 条、profile 运行时 2 文件 142 条、浏览器层 9 文件 51 条、`verify` 2239 项、消费方正反向类型与运行时校验，合计 1862 条用例。
- 原先把 affix / backtop / tour 的 6 条 `it.skip` 占位（注释写着"归 tests/browser/**"）全部落地为真实浏览器用例 `tests/browser/sticky.spec.ts`，组件层从此没有占位跳过。
