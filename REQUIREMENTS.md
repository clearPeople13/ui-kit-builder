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

| 决定 | 结论 | 原因 |
| --- | --- | --- |
| 测试对象 | 构建产物 `dist/full/ui-kit.js`，通过别名 `@ui-kit-full` 引入 | 与消费方 `examples/consumer` 的引用方式一致，测的是"真正被使用的那份代码"；`build:full` 仅约 3 秒，成本可忽略 |
| 构建时机 | `pretest` 钩子自动执行 `npm run build:full` | 避免出现"源码改了但测试仍跑旧产物"的假绿 |
| DOM 环境 | happy-dom | 组件全部是渲染函数，无 SSR 专属逻辑；happy-dom 比 jsdom 快，足以支撑类名/事件断言 |
| 断言口径 | 以真实 DOM 输出为准，而非源码推测 | 写用例前用临时探针脚本采集每个组件的类名、内联样式与 emit 载荷，再据此固化断言 |
| 浮层组件 | `attachTo: document.body` + 直接查询 `document` | Select 下拉、Dialog 面板 teleport 到 body，`wrapper.html()` 只剩传送门注释 |
| 缺陷记录 | `tests/findings.spec.ts` 内使用 `it.fails` | 断言失败才算通过；组件一旦修好该用例会转为失败，提示把断言迁回对应组件用例 |

## 4. 验收标准

1. `npm test` 全绿，首批交付为 13 个测试文件、258 条用例；缺陷修复批次补齐守卫后为 12 个文件、266 条用例；第二批交付后为 28 个文件、600 条用例（新增 15 个组件 319 条 + 缺陷守卫 15 条），单次运行耗时 ≤ 5 秒（不含构建）
2. `npm run test:watch` 可增量运行；`npm run test:coverage` 可产出覆盖率报告
3. `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm run verify` 均不因新增测试而失败
4. 12 个组件各自具备"行为 + 属性 + 事件 + 边界"四类断言，缺失维度需在文档或注释中说明原因
5. 已知缺陷以 `it.fails` 守卫形式存在且有根因注释；修复批次把守卫降级为组件文件里的常规回归用例，而不是删掉了事

## 5. 已知缺陷清单（首批记录，现已全部修复）

| 编号 | 组件 | 原现象 | 根因 | 修复 | 回归用例 |
| --- | --- | --- | --- | --- | --- |
| F-1 | Select | `props: { label, value }` 字段映射不生效，选项文案为空 | `normalizeOptions(props.options)` 调用时漏传第二个参数 mapping | `select/core.ts` 增 `optionFieldKeys(mapping)` 并透传 `props.props`（含分组递归） | `select.spec.ts`「props 字段映射决定选项文案与取值」 |
| F-2 | Select | 完全不传 `modelValue` 时回显 `false` 而非占位文案 | prop 类型联合含 Boolean，Vue 对缺省键做布尔归一化 | `modelValue` 显式 `default: undefined` | `select.spec.ts`「完全不传 modelValue 时仍显示占位文案」 |
| F-3 | Input | `id` 未渲染到内部 `<input>` | `inputConfig` 组装控件属性时没有带上 id | `shared/behavior.ts` 的 `inputConfig` 补 `id: props.id`（input 与 textarea 共用） | `input.spec.ts`「id 落到内部控件上，textarea 同样生效」 |
| F-4 | Radio / Checkbox | 只写 `label` 时无法作为选项值 | `value` 的类型联合含 Boolean，缺省被归一化为 `false`，挡住 `value ?? label` 回退 | Radio/RadioButton/RadioGroup、Checkbox/CheckboxButton 的 `value`/`label`/`modelValue` 显式 `default: undefined` | `radio.spec.ts`「只写 label 时 label 即选项值」、`checkbox.spec.ts` 同名用例（含 CheckboxGroup 数组匹配） |
| F-5 | Tabs | `type` 属性只是声明，不产生类名与样式 | `classes()` 仅输出 `is-<tabPosition>` / `is-stretch` | `classes()` 增 `ui-tabs--<type>`，`tabs/core.css` 补 card / border-card 样式 | `tabs.spec.ts`「type 落到 ui-tabs--<type> 类名，缺省不附加」 |
| F-6 | Tabs | `beforeLeave` 从未被调用，无法拦截切换 | `features/tabs-editable` 只用它推导类名 | `setActive` 接住 `beforeLeave(旧名, 新名)`，reject/`false`/抛错均拦截；未声明时保持同步提交时序 | `tabs.spec.ts`「beforeLeave 返回 reject 时阻止切换」等 3 条 |
| F-7 | Dialog | `beforeClose` 从未被调用，异步确认无处生效 | `features/closable` 只用它决定关闭按钮是否渲染 | `overlayConfig` 新增 `requestClose()`，关闭按钮 / 遮罩 / Escape 三条路径统一走 `beforeClose(done)`，Drawer 等浮层同样受益 | `dialog.spec.ts`「beforeClose 不调用 done 时保持打开」等 3 条 |
| F-8 | Table | 按调用方持有的行引用调用 `toggleRowSelection` 静默无效 | 内部用 `indexOf` 比对，代理对象与原始对象不相等 | `features/methods` 增 `indexOfRow()`：先按 `toRaw` 身份匹配，再按 `rowKey` 兜底，并统一用列表内那一份继续勾选 | `table.spec.ts`「toggleRowSelection 同时接受原始对象与渲染代理」等 3 条 |
| F-9 | Dialog | `modal: false` 仍带 `ui-dialog--modal` 类名 | `features/modal` 的 className 是无条件常量 | `className` 与 `modal` 取值联动 | `dialog.spec.ts`「modal=false 不渲染遮罩也不带 ui-dialog--modal 类名」 |
| F-10 | Checkbox | 数组 `modelValue` 触发 Vue 的 prop 类型告警 | `resolveCheckedValue` 支持数组匹配，但 `modelValue` 类型联合漏了 `Array` | Checkbox / CheckboxButton 的 `modelValue` 类型补 `Array` | `checkbox.spec.ts`「只写 label 时 label 即选项值」（运行无告警） |

修复批次（`fix/20261106-component-defects`）不改动组件的公开 API 与事件语义，只补齐声明已承诺却未接线的行为；`tests/findings.spec.ts` 的 `it.fails` 守卫全部降级为组件文件里的常规用例，守卫文件随之删除，待第二批再发现缺陷时重建。

## 6. 后续批次建议

- 第二批已交付（分支 `feature/20261106-component-tests-batch2`，内容见 §7）
- 第三批：构建器侧（`scripts/build-lib.mjs` 的裁剪结果断言、`meta.json` 体积阈值）与主题令牌快照
- 缺陷修复已按"单独分支 + 单独 PR"完成（`fix/20261106-component-defects`），每条 `it.fails` 守卫都降级为组件文件里的常规用例；后续批次沿用同一约定
- §5 的 F-1~F-10 已修复；§7 的 F-11~F-25 属第二批新发现，按同一约定另开修复分支处理

## 7. 第二批交付（15 个文件、319 条组件用例 + 15 条缺陷守卫）

组件清单与用例数：Menu 18、Dropdown 19、Popover 18、Tooltip 19、Upload 19、DatePicker 29、TimePicker + TimeSelect 37、ColorPicker + ColorPickerPanel 27、Progress 23、Badge 14、Avatar + AvatarGroup 20、Skeleton 14、Carousel 23、Image 18、Transfer 21。

本批新增的两条编写约定：

| 约定 | 做法 | 原因 |
| --- | --- | --- |
| 时钟冻结 | 凡是"今天 / 此刻 / 本年"一类读系统时钟的断言，用 `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime()` 冻结到固定时刻，并在 `afterEach` 归还真实计时器 | 不冻结的用例在跨天（首批写作 11-06 → 11-07 凌晨）会集体转红；只 fake `Date`，`setTimeout` 仍走真实计时器，浮层的 show/hide 时序不受干扰 |
| 浮层显隐口径 | Dropdown/Popover/Tooltip 走 `triggerConfig`，面板常驻 DOM、靠 `display: none` + `aria-hidden` 收起；DatePicker/TimePicker/TimeSelect 收起后直接从 DOM 移除 | 断言前先确认该组件属于哪一类，否则 `querySelector` 命中或落空都会误导结论 |

本批未能覆盖的维度（happy-dom 限制，非遗漏）：ColorPicker 的 SV 区与色相/明度拖拽、DatePicker/Tooltip 的真实定位（`actualSide` 回退），这些路径依赖非零尺寸矩形与 `getBoundingClientRect`，在测试环境下矩形恒为 0，只断言到"不产生错误提交"。

### 7.1 第二批已知缺陷清单（以 `it.fails` 守卫记录，未修复）

| 编号 | 组件 | 现象 | 根因 | 守卫位置 |
| --- | --- | --- | --- | --- |
| F-11 | 特性开关类（Upload/DatePicker/TimePicker/Image/Transfer/ColorPickerPanel） | `multiple`、`isRange`、`lazy`、`filterable`、`border` 关掉后 `ui-x--<特性>` 仍挂在根节点 | `createClassFeature` 里 `className: () => '常量'` 会被无条件拼接，只有 `className: (props) => …` 才拿得到 props；全库 178 个特性中 59 个写成常量形式 | `findings.spec.ts`「特性开关类：props 关闭后 …」 |
| F-12 | MenuItemGroup | 未传 `title` 仍渲染 `__title` 节点，占一行高度 | 分组标题直接渲染 `props.title`，没有空值判断（spec 描述为留空不渲染） | 同上「MenuItemGroup：title 留空时…」 |
| F-13 | Dropdown | `visible: false` 下点击触发区仍会展开 | `triggerConfig` 用 `options.defaultOpen \|\| props.visible` 只给 `open` 播种初值，之后 `visible` 不再参与 | 同上「Dropdown：visible=false 应强制收起…」 |
| F-14 | Popover | 同 F-13 | 同一套 `triggerConfig` | 同上「Popover：visible=false 应强制收起…」 |
| F-15 | DatePicker | `type: 'dates'` 实为单选，抛字符串、只有一个 `is-selected` | 面板未按 dates 粒度累积多选集合 | 同上「DatePicker：type=dates…」 |
| F-16 | TimePicker | 声明了 `editable`/`readonly`/`id`/`name`，但触发区是纯 `span` 文本，没有任何可输入控件 | time-picker 未复用 input 结构，`editable` 只推导类名 | 同上「TimePicker：声明了 editable…」 |
| F-17 | TimeSelect | `format: 'HH:mm:ss'` 的选项文案变成 `09:00:ss` | 格式化只替换时分段，`ss` 段未识别 | 同上「TimeSelect：format 只替换时分…」 |
| F-18 | ColorPicker | 清空后受控值未回写时显示 `#409eff` 兜底色并保持 `has-value` | `clear` 改写内部 draft 色，展示值脱离 props；与 DatePicker「未回写保持原值」不一致 | 同上「ColorPicker：清空后未回写…」 |
| F-19 | ColorPicker | 无法解析的色值（如 `not-a-color`）被当作有值渲染 | 解析失败回退 `FALLBACK_COLOR` 且按有值出图，用户看不出填错 | 同上「ColorPicker：无法解析的色值…」 |
| F-20 | ColorPickerPanel | `modelValue` 为空时文本回吐 `#40a0ff`，与声明的 `#409eff` 也不一致 | 面板把兜底色反解析成文本，反解析本身有精度损失 | 同上「ColorPickerPanel：modelValue 为空…」 |
| F-21 | Transfer | `change` 的第二参数恒为 `'right'`，移回左侧也报错方向 | `transfer/core.ts` 的 `emitKeys()` 写死 `emit('change', next, 'right')` | 同上「Transfer：change 的方向参数…」 |
| F-22 | Transfer | `leftDefaultChecked` 可把 `disabled` 条目预勾选，右移按钮随之可点 | 预设吞并左键集合时跳过 disabled 校验 | 同上「Transfer：leftDefaultChecked 不应勾中 disabled 条目」 |
| F-23 | Carousel | 内部切换不抛 `update:modelValue`/`change`，无法 v-model | 只改内部 `activeIndex`，既未声明 `modelValue` 也未 emit | 同上「Carousel：内部切换应抛出 modelValue/change」 |
| F-24 | Carousel | 条目未传 `name`/`label` 时，指示点 `aria-label` 是 `item-4f2a…` 随机串 | 回退到 `CarouselItem` 自动生成的条目名 | 同上「Carousel：指示点没有 label 时…」 |
| F-25 | AvatarGroup | `gap` 未声明为 prop，透传成 `gap="4"` DOM 属性，间距由 CSS 写死 `-8px` | `AvatarGroupCoreProps` 缺 `gap` | 同上「AvatarGroup：gap 应是受控 prop…」 |
