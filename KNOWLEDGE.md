# 知识沉淀：组件库单元测试层（Vitest）

面向后续维护者（含 AI 助手）的上下文交接文档。配合 `REQUIREMENTS.md` 阅读。

## 1. 这套测试到底在测什么

测试入口不是 `packages/ui-kit/src/**`，而是构建产物 `dist/full/ui-kit.js`：

```ts
import { Button } from '@ui-kit-full' // vitest.config.ts 里的 alias → dist/full/ui-kit.js
```

由此推出三条纪律：

1. 改完源码必须先 `npm run build:full`（`npm test` 的 `pretest` 已自动做这件事），否则跑的是旧产物
2. 组件在源码里是 `createXxx(features)` 工厂，产物里导出的是"工厂 + 默认导出实例"；用例统一用导出的实例组件（`Button`、`Table`），不直接测工厂
3. 特性裁剪是否生效不看组件行为，走构建器侧用例（`tests/build/**`，见 §8），与组件用例是两套环境、两条命令

## 2. 目录与命名

```
vitest.config.ts              environment: happy-dom，include: tests/components/**/*.spec.ts，alias @ui-kit-full
vitest.coverage.config.ts     同一批组件用例改走源码入口（.build/full/entry.ts），V8 覆盖率 + 四维阈值
vitest.build.config.ts        environment: node，include: tests/build/**/*.spec.ts，pretest:build 先跑 build:all
tests/components/<id>.spec.ts 组件用例（90 个组件目录各一份；累计 94 个文件 1570 条，全部为真实断言，无占位跳过）
tests/components/feature-class-switch.spec.ts 特性开关类名跟随 props 的专项守卫（F-11 回归）：一组 SwitchCase 表驱动，正反各断言一次
tests/components/style-attrs.spec.ts 字符串 / 数组 style 合并的单元锚点（F-30 回归）：happy-dom 看不到崩溃，但能看出 width 没落盘
tests/components/floating-keyboard.spec.ts 浮层键盘通路与 Escape 登记栈（F-32 / F-33 回归）：Enter / Space / 分层 Escape
tests/build/_helpers.ts       构建器侧用例的公共读盘工具：profile 清单、产物文本缓存、特性标记求解、令牌表解析
tests/build/*.spec.ts         构建器侧契约用例（7 个文件 89 条），断言对象是 dist/ 下的 20 份产物与 scripts/ 的纯函数
tests/build/__snapshots__/    两份快照：tree-shaking 的"无可标记字面量特性"清单、theme-tokens 的 20 份令牌指纹
vitest.browser.config.ts      environment: node + Playwright，include: tests/browser/**/*.spec.ts，串行（fileParallelism: false）
tests/browser/_global-setup.ts 起一个 root 为仓库根的 Vite dev server，把地址写进 UIKIT_HARNESS_BASE
tests/browser/harness/        探针页：?scene=<名字> 选场景，window.__probe 回传运行期事实，window.__kit/__vue 供页面内直接挂载组件
tests/browser/_session.ts     浏览器会话与断言工具箱：openScene/rect/moveToCenter/setScrollTop/expectSilent 等
tests/browser/_geometry.ts    布局指纹：锚点选择器表 + 文档坐标矩形采集 + 逐锚点差异报告
tests/browser/_pixels.ts      像素基线：截图稳定化、按平台分桶的 PNG 存取、pixelmatch 逐像素比对
tests/browser/*.spec.ts       浏览器层用例（10 个文件 58 条）：定位、表格、树性能、拖拽、键盘、属性落盘、控制台归零、布局基线、像素基线、固钉 / 回顶 / 引导
tests/profiles/<id>.spec.ts profile 运行时用例（把 dist/<profile>/ui-kit.js 逐个 import 后真挂载）
tests/profiles/props-documented.spec.ts 属性字典双向守卫：运行时真实 props ↔ spec.mjs 的 coreProps / 已启用 feature props 互相回查
tests/browser/__snapshots__/geometry.json  按平台分桶的布局基线，`npm run snap:layout` 录入
tests/browser/__snapshots__/pixels/<platform>/*.png  按平台分桶的像素基线（6 个场景），`npm run snap:pixels` 录入
```

缺陷守卫文件 `tests/findings.spec.ts` 已按约定退役：六批共 50 条缺陷（F-1…F-50）全部修复后，守卫降级进各组件文件，该文件删除。以后再发现缺陷仍按同一约定重建它。

约定：

- 用例标题、注释一律中文，描述"可观察到的行为"而不是实现细节
- 每个文件顶部定义 `mountXxx(props)` 辅助函数，把公共 props（`modelValue`、`data`、`attachTo: document.body`）收敛到一处
- 需要 teleport / body 查询的组件（Select、Dialog、Tabs、Table、Tree、Pagination、Dropdown、Popover、Tooltip、DatePicker、TimePicker、ColorPicker、Image）在 `afterEach` 里清 `document.body.innerHTML`
- 需要重新渲染断言时统一 `await nextTick()`，不要依赖 `flushPromises`
- 一批用例挂过多个实例时（日期/时间/颜色类），用 `mounted` 数组登记 wrapper，`afterEach` 里统一 `unmount()` 再清 body，避免残留面板互相干扰

## 3. 踩过的坑（写新用例前先读）

- **Boolean 联合类型的缺省值**：prop 写成 `{ type: [String, Number, Boolean] }` 且不传该键时，Vue 把它归一化为 `false` 而不是 `undefined`。Select 的 `modelValue`、Radio/Checkbox 的 `value` 都踩到这里，F-2/F-4 已用 `default: undefined` 修复；新组件凡类型联合含 Boolean 又允许"不传"的 prop，都要显式写 `default: undefined`。第二批的 F-13/F-14 是同一个坑的第二次发作：Dropdown/Popover/Popconfirm 的 `visible` 没有 `default: undefined`，`triggerConfig` 无法区分"未受控"与"受控且强制收起"，改受控逻辑时 18 条用例集体变红才定位到这里
- **钩子类 prop 要接进真实关闭/切换路径**：`beforeLeave`（Tabs）、`beforeClose`（Dialog）此前只参与类名推导。`beforeClose` 的落点在 `shared/behavior.ts` 的 `overlayConfig`（`requestClose` 统一接管关闭按钮 / 遮罩 / Escape），所以 Drawer、Popconfirm 等浮层组件同样生效；`beforeLeave` 落在 `tabs/core.ts` 的 `setActive`，未声明时保持同步提交，不要让切换时序多一次微任务
- **teleport 后 `wrapper.classes()` 为空**：Dialog、Drawer 打开时整块面板传到 body，根节点只剩传送门占位。类名/样式必须 `document.querySelector('.ui-dialog')` / `('.ui-drawer')` 读，`wrapper.attributes('style')` 读不到；Avatar 组的折叠浮层也走 teleport，`teleported: false` 才留在组内。
- **Tabs 的注册时机**：TabPane 在自身 setup 里向 Tabs 注册，晚于 Tabs 首次渲染，所以导航项要 `await nextTick()` 之后才出现
- **Table 行对象的引用身份**：@vue/test-utils 会把 props 装进 `reactive` 容器，所以用例里 `wrapper.vm.$props.data[0] !== rows[0]`，真实应用里数据源是 `reactive`/`ref` 时同样会出现代理与原始对象并存。F-8 已修复：`toggleRowSelection` 先按 `toRaw` 身份匹配、再按 `rowKey` 兜底；新写下钻接口时不要只按引用比对定位行
- **`wrapper.element` 是原生 DOM**：`attributes()`/`classes()` 只存在于 VTU wrapper 上，从 `document.querySelector` 拿到的是原生元素，只能用 `className` / `getAttribute`
- **Form 的 model/rules 必须是 `reactive` 对象**：FormItem 通过深层 watch 感知变化，用例里传普通对象再改属性不会触发校验
- **Button 的两字中文自动插空格**：`autoInsertSpace` 默认开启，`确 定` 这类断言容易写错；测试文本统一用四字以上
- **水波纹、虚拟滚动等依赖计时器/尺寸**：`vi.useFakeTimers()` + `advanceTimersByTime(2200)` 测波波纹清理；happy-dom 无真实布局，虚拟滚动只断言渲染行数而非滚动位置
- **Pagination 跳页提交时机**：只在 `keydown`（Enter）与 `blur` 提交，`keyup`/`change` 不提交；越界夹到首末页，非法值直接忽略
- **浮层"收起"有两套口径**：`triggerConfig` 家族（Dropdown、Popover、Tooltip、Avatar 组浮层）面板常驻 DOM，靠 `display: none` + `aria-hidden` 收起，判断"是否展开"要读 `style.display` 或 `aria-expanded`，`querySelector` 命中不代表展开；DatePicker、TimePicker、TimeSelect 则是收起时整块移除 DOM，必须 `await nextTick()`（必要时再补一次宏任务）才能观察到 `null`。用错口径会得出"disabled 仍能展开"这类假缺陷。
- **依赖系统时钟的断言统一在 `beforeEach` 冻结**：`vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(...)` 只冻日期、保留真实 `setTimeout`，写用例时按需在 `it` 内单独开计时器假实现。凡是"今天/此刻"类按钮，`beforeEach` 里冻结，别只在某一条用例内部调用——跨午夜后未冻结的用例会集体变红（date-picker 就因此踩过一次）。`afterEach` 记得 `vi.useRealTimers()`。
- **teleport 归属判定用 `wrapper.element.contains(node)`**：面板是否留在组件内看这个，而不是 `findAll('body > *')`；`attachTo: document.body` 时根节点本身也在 body 下，直接比较 `parentElement` 会误判。
- **`getAttribute('value')` 读到的是初始属性**：受控输入框（TimeSelect 的隐藏 input、DatePicker 的输入框）变更后要用 `element.value`；`attributes()` 系列只在 VTU wrapper 上存在。
- **TimeSelect 的 `step` 只认 `'HH:mm'`**：写成 `'30 min'`/`'15 min'` 会退化成逐分钟；断言选项数前先确认 step 写法。`format` 的 `ss` 段现在参与格式化（F-17 已修复，与 `shared/date` 同源），别再按"秒是字面量"写断言。
- **纯 CSS/布局驱动的路径在 happy-dom 下测不到**：ColorPicker 的 SV 板与色相拖拽、Table 的 `resize` 拖拽列宽，`getBoundingClientRect()` 恒为 0×0，只能断言静态类名与内联百分比，不要为了凑覆盖去伪造 rect。
- **特性开关类名恒挂是系统性缺陷（已修复）**：`createClassFeature({ className: () => 'ui-x--y' })` 这种"无参常量"写法不接 props，组件无论如何都会挂上该类名（全库 178 个特性目录里 59 个写成常量）。F-11 修复只动了 17 个"类名与同名布尔开关 prop 对应"的特性，改成 `className: (props) => (开关为真 ? 'ui-x--y' : undefined)`；`--popper`、`--validate`、`--format`、`autocomplete--filterable` 一类结构性类名没有对应开关、其特性 CSS 为空或仅被 core 选择器引用，保留常量形式。回归集中在 `tests/components/feature-class-switch.spec.ts`，新组件若写了布尔开关特性，把用例加进那张 `cases` 表即可，不要在各组件文件里重复。
- **表驱动用例的标题与计数**：`it.each(cases.map((item) => [item.label, item]))('%s：…')` 会把 `label` 拼进标题，一张表跑出一正一反两组用例（当前 8 组 × 2 + 2 条区间专项 = 18 条）。统计用例总数时按 `vitest run` 的输出算，别按文件里的 `it(` 行数算。

## 4. 断言口径速查

| 组件                           | 类名/结构要点                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 事件要点                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                         | `is-plain/round/circle/dashed`、`color` 写的是 `background-color`+`border-color` 内联值                                                                                                                                                                                                                                                                                                                                                                                                                                   | `click` 被 `disabled`/`loading` 拦截；`ButtonGroup` 的 `dir` 落到 HTML 属性                                                                                                                                                                                                                                                                                                                                   |
| Input                          | 前缀/后缀/清除/密码图标条件渲染，`showPassword` 需 `type: 'password'`                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `update:modelValue` + `input`，清空时按 `valueOnClear` 抛 `undefined`                                                                                                                                                                                                                                                                                                                                         |
| Select                         | 面板常驻 DOM，展开状态看 `aria-expanded` / `is-open`；多选折叠是 `.ui-select__tag--more`                                                                                                                                                                                                                                                                                                                                                                                                                                  | 键盘上下跳过禁用项并循环；清空抛 `undefined`                                                                                                                                                                                                                                                                                                                                                                  |
| Checkbox/Radio/Switch          | `indeterminate` 是 DOM property 不是属性；Switch 两个文案恒渲染                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `update:modelValue` / `update:checked` / `change` 三件套                                                                                                                                                                                                                                                                                                                                                      |
| Form                           | `--ui-form-label-width`（默认 96px）、`labelSuffix` 文本是 `:`                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 规则优先级：item rules 覆盖 form rules；异步校验需 `reactive`                                                                                                                                                                                                                                                                                                                                                 |
| Tabs                           | `type` 落 `ui-tabs--card` / `ui-tabs--border-card`（core.css 里有对应盒状/包边样式）；面板显隐靠 `display: none` 内联样式；关闭按钮 `aria-label="关闭 X"`                                                                                                                                                                                                                                                                                                                                                                 | `beforeLeave(旧名, 新名)` 返回 reject 或 `false` 时不切换；`tab-change`/`tab-click`/`tab-remove`/`tab-add`/`edit`                                                                                                                                                                                                                                                                                             |
| Table                          | 冻结列 `is-fixed-left/right` + `has-fixed-left/right`；排序箭头 `is-ascending/descending`；行高亮是 `current-row`                                                                                                                                                                                                                                                                                                                                                                                                         | `sort-change` 载荷 `{column, prop, order, sorts}`；`tree-expand` 载荷 `{row, expanded}`；无 `header-click`/`row-dblclick`                                                                                                                                                                                                                                                                                     |
| Dialog                         | 全屏时面板内联样式清空交给 CSS；`top` 存在时 `align-self: flex-start`；`modal: false` 时遮罩与 `ui-dialog--modal` 类名一起去掉                                                                                                                                                                                                                                                                                                                                                                                            | 关闭统一走 `update:modelValue(false)` + `close`；`beforeClose(done)` 接管三种关闭路径；`lockScroll` 改 `documentElement.style.overflow`                                                                                                                                                                                                                                                                       |
| Tree                           | 缩进是 `padding-left: level*indent+4`；叶子用空 span 占位                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `node-click`/`node-expand`/`check-change`/`update:checked-keys`；`filterNodeMethod(value, raw)` 第二参是原始数据                                                                                                                                                                                                                                                                                              |
| Pagination                     | 页码是 `.ui-pagination__pager`（不是 `__pager-item`），省略号 `.ui-pagination__more`；默认 `pagerCount` 为 7                                                                                                                                                                                                                                                                                                                                                                                                              | `update:currentPage`/`current-change`/`prev-click`/`next-click`/`update:pageSize`/`size-change`                                                                                                                                                                                                                                                                                                               |
| Menu                           | 点击落在 `.ui-menu-item__inner`（外层容器不响应）；`is-horizontal`、SubMenu 的 `is-opened`/`is-disabled`；`backgroundColor`/`textColor`/`activeTextColor` 写根节点内联变量 `--ui-menu-bg`、`--ui-menu-text-color`、`--ui-menu-active-color`；MenuItemGroup 的 `title` 为空时整条 `__title` 节点不渲染（F-12 已修复）                                                                                                                                                                                                      | `select`/`open`/`close`；禁用项与缺少 `index` 的项不抛 `select`；子项选中时父标题带激活标识；悬停延迟走 `showTimeout`/`hideTimeout`，SubMenu 可覆盖 Menu 的值                                                                                                                                                                                                                                                 |
| Dropdown / Popover / Tooltip   | 同属 `triggerConfig` 家族：浮层常驻 DOM，收起靠 `display: none` + `aria-hidden`。Dropdown 面板 `maxHeight` 缺省 240px，`trigger` 数组取首项、未知值回退 hover；Popover `width` 缺省 150px、`content` 插槽优先于属性；Tooltip 根节点只有触发区，`effect` 未知值回退 dark，`rawContent` 才按 HTML 渲染                                                                                                                                                                                                                      | 三者都是 `show`/`hide`（Tooltip 额外 `update:visible`）；`hideOnClick`（Dropdown）/面板内部点击不收起（Popover、Tooltip）；`persistent: false` 才在收起后移除 DOM；声明 `visible` 即进入受控态，点击 / 悬停 / 外点 / 计时器都不改写展开态，`visible: false` 强制收起（F-13/F-14 已修复）；未传 `visible` 时才走 `defaultOpen`                                                                                 |
| Upload                         | 列表项状态文案（未识别状态原样展示、无状态则不渲染节点）；`picture-card` 用遮罩显示状态并给加号触发区；无地址图片项用扩展名占位、未知扩展名回退 `FILE`                                                                                                                                                                                                                                                                                                                                                                    | `change` + `update:file-list`（载荷是 File 数组）、`remove` + `onRemove`；`accept` 按扩展名/MIME 前缀/完整类型三种匹配；`beforeUpload`/`beforeRemove` 返回 `false` 丢弃；超 `limit` 走 `onExceed` 且只保留可用名额                                                                                                                                                                                            |
| DatePicker                     | 单元格 `.ui-date-picker__cell`，6 周 42 格，补位带 `is-outside`；`is-today` 与 `is-selected` 共用类名；month/year 粒度换成对应选择表；range 双标题；`ui-date-picker--range` 类名跟随 `isRange` 或区间型 `type`，非区间形态不挂                                                                                                                                                                                                                                                                                            | `update:modelValue` + `change` + `visible-change`（`[[true],[false]]`）；月表选月只换月份、再选日才提交；`readonly` 写入输入框但拦截提交；清空后需使用方回写 `modelValue` 输入框才变空；`type: 'dates'` 是多选：点击切换该日在集合内的勾选、按升序抛数组、多选过程中面板不收起，页脚「确定」才提交收起（F-15 已修复）                                                                                         |
| TimePicker / TimeSelect        | TimePicker 触发区是 `div[role=combobox]` + 真实 `<input class="ui-time-picker__value">`（空值换成 `__placeholder` 并写 `placeholder`；F-16 修复前是纯 `span`），`editable`/`readonly` 决定 `readonly`，`id`/`name` 支持字符串或数组（区间两端各自映射），range 模式改为 2 个 `__field` + `__separator`；面板按需挂载 3 列 24/60/60，页脚两个 `__action`（此刻 / 确定）。TimeSelect 用隐藏 `<input type="hidden">` 镜像值，选项 `.ui-time-select__option`，默认 09:00→17:30 步 30 分钟，`minTime`/`maxTime` 是过滤而非禁用 | TimePicker 单项点击即提交，`此刻` 取当前时间（range 且已过点时夹到另一端）；键入后回车 / 失焦提交，解析失败不提交并回退原值；`disabledHours/Minutes/Seconds` 产出 `is-disabled` 且不提交；range 载荷是数组并保留未改动端的原值；`type` 声明不生效。TimeSelect 清空抛 `undefined`（`valueOnClear` 生效），`format` 的 `ss` 段参与格式化、与 `shared/date` 同源（F-17 已修复）                                  |
| ColorPicker / ColorPickerPanel | 触发区 `__swatch` + `__value`，色值统一归一化（`red`→`#ff0000`、`#abc`→`#aabbcc`），有值时挂 `has-value`；面板常驻、靠 `display` 收起，子节点顺序 `__sv`/`__hue`/`__fields`/`__footer`，页脚按钮固定「清空 / 确定」；预置项 `__predefine-item[title=原始文案]`。Panel 是内联形态，类名恒带 `--appearance`                                                                                                                                                                                                                 | hex 输入只在 `change` 提交（同值也抛），乱码既不提交也不回滚；取预置色不收起；`确定` 抛当前色 + `change` 并收起；清空抛 `clear`/`''`。展示值默认跟随 props，仅用户提交后置脏（F-18 已修复：清空后未回写时继续显示原值）；无法解析的色值视作空值——不带 `has-value`、显示占位、色板透明（F-19 已修复）；Panel 的 `modelValue` 为空时 `__value` 输出空串，不回吐兜底色（F-20 已修复，色相条仍停在缺省色 210 度） |
| Progress                       | 折线/circle/dashboard 三形态；`color` 支持字符串、阈值数组（乱序也按百分比升序命中最高档，低于全部阈值不着色）与函数；`indeterminate` 隐藏百分比文本；`strokeWidth` 为 0 回落缺省；circle 的半径与 `stroke-dasharray` 由宽度和线宽推导                                                                                                                                                                                                                                                                                    | 无事件；`percentage` 越界夹到 [0, 100]；`status` 落状态类名、缺省不附加；`id`/`aria-label` 透传根节点                                                                                                                                                                                                                                                                                                         |
| Badge                          | 根节点是 `span`，缺省带 `ui-badge--danger`（`type: ''` 时只剩 `--popper`）；内容在 `sup.ui-badge__content`；`isDot` 渲染空文本圆点且不受 `showZero` 影响                                                                                                                                                                                                                                                                                                                                                                  | 无事件；超 `max` 折叠为 `max+`、恰等于 `max` 不折叠、字符串值不截断；`hidden` 追加 `is-hidden` 并移除 `sup`                                                                                                                                                                                                                                                                                                   |
| Avatar / AvatarGroup           | 数字 `size` 换算成宽高与字号内联样式，字符串原样；`shape` 落 `is-circle`/`is-square`；`icon` 追加 icons 类名。组的 `shape`/`size` 类名落根节点（`size: 'default'` 不产生尺寸类名），折叠项受 `maxCollapseAvatars` 控制并显示剩余数量；组的 `gap` 是受控 prop，写成根节点内联变量 `--ui-avatar-group-gap`，折叠项负边距由它推导，不再透传成 DOM 属性（F-25 已修复）                                                                                                                                                        | 组内子头像在注册后一次 tick 才齐；折叠项悬停展开 teleport 浮层（`tooltip: false` 时改为点击切换，`teleported: false` 时浮层留在组内）                                                                                                                                                                                                                                                                         |
| Skeleton                       | 缺省 1 组 3 行并标记最后一行；`rows`/`count` 为 0 夹到 1；`variant` 落 `is-{variant}`，`image` 变体带内置图标、其余没有；`animated` 追加密铺类名                                                                                                                                                                                                                                                                                                                                                                          | 无事件；`loading: false` 且有默认插槽时渲染真实内容、无插槽渲染为空节点；`throttle`（数字或 `{delay, trailing}` 形式）延迟占位渲染                                                                                                                                                                                                                                                                            |
| Carousel                       | 轨道 + 2 个箭头 + 指示器，条目状态只保留 `is-*` 类；`indicatorPosition`/`arrow`/`type`/`direction` 落状态类名（`arrow: 'never'` 只是类名钩子，箭头仍在 DOM 且可点）；纵向模式给非激活条目 `translateY` 位移；指示器 `aria-label` 优先 `label` 再 `name`，都没传时给「第 N 张」而不是自动生成的条目名（F-24 已修复）                                                                                                                                                                                                       | 支持 `v-model`：`go()` 统一抛 `update:modelValue` 与 `change(新值, 旧值)`，值为 name / label / 序号，外部改写 `modelValue` 驱动切换、非法值保持当前条目（F-23 已修复）；`interval` 低于 500ms 夹到 500ms；`pauseOnHover` 默认开启；`trigger` 默认 hover，`click` 时悬停不切换；实例方法 `next`/`prev`/`setActiveItem` 两端回绕                                                                                |
| Image                          | 根是 `span` 容器 + 内层 `img`，空属性不输出；`fit` 落 `ui-image--fit-*`；`lazy` 输出 `loading="lazy"` 且优先于 `loading` 属性；预览层默认 teleport 到 body，`previewTeleported: false` 时留在组件内；`zIndex` 作用于预览层而不是根节点                                                                                                                                                                                                                                                                                    | 有 `src` 即可预览并回退当前 `src`；`initialIndex` 定初始位置、`showProgress` 显示页码；`infinite` 默认首尾循环，关掉后夹住；滚轮按 `zoomRate` 缩放并夹在 `maxScale` 内；`closeOnPressEscape` 默认开、点遮罩默认不关（需 `hideOnClickModal`）                                                                                                                                                                  |
| Transfer                       | 面板标题/计数由 `titles` 与勾选数驱动；`buttonTexts` 有值时按钮变文字态并加 `is-text`；`props` 映射 `key`/`label`/`disabled`，原始值数组以序号为键、元素为标签；`label` 缺失回退 `key`、`key` 缺失回退序号；非数组的 `data`/`modelValue` 按空列表处理                                                                                                                                                                                                                                                                     | `update:modelValue` + `change`，`change` 的 direction 随移动方向给出 `'right'`/`'left'`（F-21 已修复）；移动后清空勾选；`leftDefaultChecked`/`rightDefaultChecked` 会跳过 `disabled` 条目（F-22 已修复）；`filterable` 两侧各自收窄，筛选只隐藏已勾选项、不影响移动载荷                                                                                                                                       |

## 5. 新增用例的标准流程

1. 写一个临时探针文件（如 `tests/_probe.spec.ts`，第二批用 `tests/_probe_<组件>.spec.ts` 分组）把目标组件的真实 DOM、类名、内联样式与 emit 载荷打印出来
2. 依据打印结果写正式用例，不要凭直觉猜类名或事件名；第二批经验：一个探针不够，浮层显隐、range 形态、页脚按钮这类分叉要拆成 2–6 个探针逐个确认
3. `npx vitest run tests/components/xxx.spec.ts` 跑到全绿（注意它不会重建产物，源码或 `dist` 过期时先 `npm run build:full`）
4. 删除探针文件（探针不进仓库）
5. 发现"应该是 A但实际是 B"时：先判断是测试写错还是库缺陷；确认是缺陷就加 `it.fails` 守卫 + 根因注释，并同步 `REQUIREMENTS.md` 缺陷表
6. `npx prettier --write tests/**/*.ts`、`npx eslint tests`、`npm run test` 全绿后提交

## 6. 命令

```bash
npm test              # 先 build:full 再 vitest run（约 3s + 1.5s）
npm run test:watch    # 增量
npm run test:coverage # 同一批组件用例在源码入口上重放，卡 statements 87 / branches 83 / functions 88 / lines 87
npm run test:build    # 先 build:all（20 份 profile）再跑 tests/build/**，约 15s + 5s
npm run test:profiles # 先 build:all 再把 20 份产物逐个 import 挂载，约 20s
npm run test:browser  # 先 build:full 再起 dev server + Chromium 跑 tests/browser/**，约 70s
npm run snap:layout   # 重新录入布局基线（改动样式/布局后按需执行）
npm run snap:pixels   # 重新录入像素基线（改动颜色/字号/圆角等视觉后按需执行）
npm run test:all      # 组件侧 + 构建器侧 + profile 运行时 + 浏览器层 + 覆盖率一次跑完
npm run quality       # 唯一门禁（十段）：格式 → 类型 → lint → 库级校验 → 五层用例 → 消费方校验
npm run ci            # 同 quality，但逐段给结论与耗时，并落机读的 ci-report.json
npm run ci:fast       # 只跑秒级四段（格式 / 类型 / lint / 库级校验）
npm run hooks:install # 装 pre-commit（秒级四段）与 pre-push（全量十段）钩子
```

## 7. 未覆盖 / 待办

- 五层用例：组件侧 94 文件 1570 条、构建器侧 7 文件 89 条、profile 运行时 2 文件 142 条（20 份产物 × 5 项 + 总数守卫 + 属性字典双向回查 41 条）、浏览器层 10 文件 58 条（6 条布局基线 + 6 条像素基线 + 1 条基线完整性守卫）、覆盖率层在同一批组件用例上重放并卡四维阈值；90 个组件目录已全部有专属单元用例，原先把「只有浏览器能证」的 6 条固钉 / 回顶 / 引导场景也从占位改成真实用例
- 第四批已交付（分支 `feature/20261107-quality-gate`）：真实浏览器层的定位 / 滚动 / 拖拽 / 表格 / 树性能 / 键盘断言、控制台告警归零、属性落盘扫描、布局指纹基线、用例侧类型检查，全部收进 `npm run quality`，详见 `REQUIREMENTS.md` §9 与本文 §9、§10
- 第五批已交付（分支 `feature/20261107-every-profile-runtime`）：20 份 profile 的运行时挂载校验（`tests/profiles/**`）与门禁阶段化运行器 + 提交钩子（`scripts/ci.mjs`、`.githooks/`），详见 `REQUIREMENTS.md` §10 与本文 §11
- 第六批已交付（分支 `feature/20261107-tests-batch6`）：剩余 63 个组件目录全量接入用例，配套 `tests/profiles/props-documented.spec.ts` 的 41 条双向回查，详见 `REQUIREMENTS.md` §11；收口时 15 条 `feature/*` 与 `fix/*` 分支全部合入 `main`，Gitee issue 均 closed、PR #1/#2 均 merged
- 第七批已交付（分支 `feature/20261107-coverage-pixel-baseline`）：源码入口覆盖率阈值（statement 88.35% 起步，阈值 87/83/88/87）与 6 个场景的像素基线（按平台分桶、忽略 AA、容差 0.1%），门禁从九段扩到十段，详见 `REQUIREMENTS.md` §12
- 已知仍不可测的维度：整页与交互态像素（当前只截 6 个场景的首屏）、跨平台布局与像素一致性（基线按平台分桶，非本机平台自动跳过）、真实设备的触摸 / 输入法行为、服务端 runner（`ci.mjs` 目前只在本机与钩子里跑）
- 六批共记录 52 条缺陷（F-1…F-52）全部修复：F-1…F-33 见前几批，F-34 是换机器签出即 CRLF（`.gitattributes` 修掉），F-35 / F-36 是 `countdown__time`、`watermark__layer` 死类名（补样式并清空 `DEAD_CLASS_NAMES`），F-37 / F-38 见 §11 的分批缺陷清单，F-39…F-50 是第六批全量接入用例时暴露的"声明与实现脱钩"（详见 `REQUIREMENTS.md` §11.3），F-51 是 `test:coverage` 缺 provider、F-52 是 README 组件数量写错（详见 `REQUIREMENTS.md` §12.3）。这份清单为空是约定，不许留着东西让用例退化；再发现缺陷时按"单独分支修复 → 守卫降级为常规用例 → 删除文件"的约定收尾
- `tsconfig.tests.json` + `npm run typecheck` 已把 `tests/**` 与四份 vitest 配置纳入类型检查（`strict: false` + `noImplicitAny: false` 的宽松档，先把"拼错属性名、缺全局声明、DOM 类型当 HTMLElement"这类真错误拦在门禁里）；harness 探针页只跑在 Vite 里、不参与检查。**基线已清零**：库工程与用例工程均无报错（第六批收口时修完 affix / autocomplete / breadcrumb / cascader / collapse / roving-focus-group / space 的最后 15 条 VTU 泛型与字面量推断问题）；新增用例必须保持零报错。要把用例提回 strict，需要先把 VTU 的 `VueWrapper` 泛型逐个补全

## 8. 构建器侧用例的坑（写 tests/build/\*\* 前先读）

- **两份 vitest 配置不能合**：`tests/build/**` 只读文本、起 happy-dom 会让 89 条慢到分钟级；组件用例依赖 `dist/full`，构建器侧依赖全部 20 份产物，所以 `pretest` 走 `build:full`、`pretest:build` 走 `build:all`。改源码后只跑 `npm test` 不会刷新主题产物，`npm run test:build` 前的 `build:all` 才是唯一可靠前提
- **`meta.json` 是"上次构建"的事实，不是"当前源码"的事实**：`profile-contract.spec.ts` 里 `selection` 用例专门用当前 `registry.mjs` 重算一遍再比对，产物过期会直接红；同理 `sizes.json` 与 `dist/<profile>/meta.json` 逐字段对齐，只改一边会挂
- **体积阈值按"带"不按"点"**：gzip 对拼接串不满足可加性（core 的 `js+css` 合并 gzip 反而比两文件 gzip 之和大 108 字节），所以自洽用例只能重算 `zlib.gzipSync(js+css, {level:9})` 再逐字节比，不能写成"合并值 ≤ 分量之和"
- **前缀长度本身就是体积变量**：`rewritePrefix` 会把 `ui-` 换成 profile 前缀，`chinese`（7 字符）比 `antd`（4 字符）CSS 大近 4 kB，主题之间的差异只能按"前缀 + 皮肤"两个来源解释，不能假设同尺寸
- **裁剪判定不能只看类名是否存在**：`shared/floating.css` 会给全部 90 个组件枚举 `.ui-*-panel__dropdown`，未选中组件的类名照样在包里。判"这个组件没进包"要用它的私有 BEM 选择器（`_helpers.ts` 的 `ownElementSelector`，取该组件 CSS 里没出现在共享 CSS 的那个 `__element`）加 `create<Id>` 在 JS 里缺席，两条一起才算证据
- **令牌裁剪判"没有 var() 消费者"**：`pruneUnusedThemeVars` 只裁 `:root` 里"包内无 `var()` 引用、且被未选中组件引用"的声明。取证据要用未选中组件 CSS 里的 `var(--ui-x-…)` 名单，再排除选中组件与 `shared/*.css` 仍在引用的项——直接拿 `--ui-dialog-*` 的全部出现位置去断言会误伤（`shared/theme.css` 里是声明不是消费）
- **压缩器会吃掉注释标记**：`buildThemeCss` 留下的 `/* ui-kit theme raw css */` 在产物里被 minify 删掉，任何按这条注释找 rawCss 的断言都必红；要验证 rawCss 就断言它的内容（`@keyframes`）以及它同样过了前缀改写
- **值也要过前缀改写**：`rewritePrefix` 作用于整段 CSS 文本，profile 里写 `"wave-animation": "ui-button-wave-spread 0.4s …"`，产物里是 `antd-button-wave-spread`。比对令牌值必须先 `localize(value, prefix)`，否则只能命中 `prefix === 'ui'` 的两份产物
- **`spec.mjs` 是当前事实，不是生成物**：`scripts/generate-suite.mjs` 只在最初搭骨架时跑过一次，之后各组件的 `spec.mjs` 手工维护；改动类型字符串时两边都要改（F-28 就同时动了 `normalizePropType`、两份 `spec.mjs` 与 `generate-suite.mjs` 的 `tsType`），否则重新生成会把修正抹掉
- **探针构建写 `.tmp/`，退出必须清理**：`tree-shaking`/`theme-tokens`/`types-contract` 各自 `buildProfile({ outDir: '.tmp/…-probe' })`，`afterAll` 里除了删 `.tmp/<probe>` 还要删 `.build/<probe>`（入口 TS 落在那里），漏删会污染 `dist` 目录清单断言
- **快照只在改设计时期望变更**：`tests/build/__snapshots__/` 两份——"无可标记字面量的特性清单"（42 条，新增纯 hooks 复用型特性时会变长，属于要求当面确认的信号）与"20 份令牌指纹"（改任何皮肤令牌值都会变红，防止误提交主题调整）

## 9. 浏览器层的坑（写 tests/browser/\*\* 前先读）

- **别在 `page.evaluate` 里 `import()`**：Vitest 会把回调函数体 SSR 转译，动态 `import('...dist/full/ui-kit.js')` 变成 `__vite_ssr_dynamic_import__ is not defined`。要拿产物组件就用 harness 已经挂好的 `window.__kit`，要拿 `h/createApp` 就用 `window.__vue`
- **面板全部 teleport 到 body**：`.ui-select__dropdown`、`.ui-tooltip__popper` 这类公共类名在同屏多个实例之间会选错对象。每个实例必须给独立的 `popperClass`（如 `panel-select-flow`），断言按它精确选中；`hasElement/popperClass` 是这一层的标准写法
- **`page.hover()` 会先把元素滚进视口**：滚动跟随类断言被它带偏（`scrollY` 归零）。要按真实坐标移动鼠标就用 `moveToCenter()`（内部是 `page.mouse.move`），要滚页面用 `setScrollTop()`
- **Popover 的默认插槽是触发器，内容走 `content` 插槽**；`style`/`className` 被文档约定路由到面板而不是触发器，`width` 属性默认 150 且优先于用户 `style` 里的宽度
- **`resizable` / `minColumnWidth` 是 Table 级属性**，写在 `TableColumn` 上不报错也不生效；右冻结列的拖拽手柄落在左边缘，否则会被纵向滚动条盖住
- **Vue 3.5 的 `Option` 才是导出名**：`import { Option as SelectOption }` 可以，但在解构模式里必须写 `Option: SelectOption`，`Option as SelectOption` 会让 harness 在 Vite 转换阶段 500
- **`__probe.ready` 是唯一的"渲染完成"信号**：harness 在两帧之后才置真，`openScene` 会等它。用例里再等一次 `requestAnimationFrame` 或 `waitForTimeout(150~300)` 才能读到定位库算完的坐标
- **静默门禁要先把噪声源关掉**：Vue 的 feature-flags 警告由构建期常量决定，所以 `_global-setup.ts` 的 dev server 里必须 `define` 三个 `__VUE_*__`；`expectSilent` 目前只放过 "Download the Vue Devtools" 一行，其余告警一律算失败
- **失败信息要自带证据**：`rect()` 找不到元素直接抛错（不是返回 null），断言里带上选择器与实测值，浏览器层跑一次不容易，不能靠人再复现一遍

## 10. 统一门禁与布局基线

- `npm run quality` 是唯一入口：`format:check → typecheck（库 + 用例两份 tsconfig）→ lint → verify → test → test:build → test:browser → verify:consumer`。任何一层红都直接失败，不产出"警告式"结论
- 布局基线在 `tests/browser/__snapshots__/geometry.json`，按 `process.platform` 分桶，键是场景名、值是"锚点选择器 → 文档坐标矩形数组 + `<document>` 总高"。容差 1px；锚点表在 `tests/browser/_geometry.ts` 的 `ANCHORS`，新增场景必须同时登记锚点，否则用例会以"没有登记布局锚点"失败
- 改样式或布局导致基线变红时，先读差异（谁从哪儿挪到哪儿），确认是预期变化再 `npm run snap:layout` 重录；把重录当成默认动作等于关掉这道门
- 基线在别的机器上缺失时该用例自动跳过（`it.skipIf`），不会凭空报错；但录入模式下锚点找不到元素会当场失败，这是防"锚点写错却全绿"的保险
- `_scratch/`、`.tmp/`、`.trae-html-share-packages/` 是本地草稿目录，已同时进 `.gitignore` 与 `eslint.config.mjs` 的 ignores——临时探针脚本写完就扔，别让它混进 lint 与提交

## 11. profile 运行时层的坑（写 tests/profiles/\*\* 前先读）

- **动态 import 要用 `pathToFileURL(...).href`**：happy-dom 环境下 `import.meta.url` 不是 file 协议，`fileURLToPath` 会直接抛 "The URL must be of scheme file"；仓库根路径取 `resolve(process.cwd(), 'dist')` 最稳
- **先换前缀再排序**：跨 profile 比结构骨架时，若先按原类名排序再归一前缀，`antd-switch` 会排在 `is-checked` 前、`ui-switch` 排在后，比出来的"漂移"只是字母顺序
- **类名 token 不要在取 token 时就归一**：前缀隔离这条断言要的就是"品牌产物里不该出现 `ui-`"，归一后它永远查不出问题
- **特性集不同就不该要求同构**：关掉 `badge.popper` 的产物少一个 `--popper` 类名是正确结果，比对前提是 `package.json` 的 `uiKit.components[id]` 特性清单与 `full` 完全相同
- **空属性挂载必然带来一批 Vue 抱怨**（Missing required prop / Invalid prop），与裁剪无关，单独归桶；剩下的告警才是"这份产物装不上"的证据
- **状态修饰类允许没有独立规则**：`前缀-组件--修饰`（Alert 的 `--light`、Rate 的 `--void`）可以由基础规则兜底，样式覆盖断言只查 `前缀-组件` 与 `前缀-组件__元素` 两类结构性类名，否则会把设计选择报成缺陷
- **`ci.mjs` 经钩子直接起时 Windows 需要 shell**：`spawnSync('npm.cmd', ...)` 在 `shell: false` 下会 ENOENT 且毫无输出，表现为"0.0s 秒失败"
