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
3. 特性裁剪是否生效属于构建层校验（`scripts/verify.mjs`），不在单测职责内

## 2. 目录与命名

```
vitest.config.ts              environment: happy-dom，include: tests/**/*.spec.ts，alias @ui-kit-full
tests/components/<id>.spec.ts 组件用例（每个文件对应一个组件）
tests/findings.spec.ts        已知缺陷守卫（it.fails）；缺陷清零时该文件不保留，修好后把用例迁回组件文件
```

约定：

- 用例标题、注释一律中文，描述"可观察到的行为"而不是实现细节
- 每个文件顶部定义 `mountXxx(props)` 辅助函数，把公共 props（`modelValue`、`data`、`attachTo: document.body`）收敛到一处
- 需要 teleport / body 查询的组件（Select、Dialog、Tabs、Table、Tree、Pagination）在 `afterEach` 里清 `document.body.innerHTML`
- 需要重新渲染断言时统一 `await nextTick()`，不要依赖 `flushPromises`

## 3. 踩过的坑（写新用例前先读）

- **Boolean 联合类型的缺省值**：prop 写成 `{ type: [String, Number, Boolean] }` 且不传该键时，Vue 把它归一化为 `false` 而不是 `undefined`。Select 的 `modelValue`、Radio/Checkbox 的 `value` 都踩到这里，F-2/F-4 已用 `default: undefined` 修复；新组件凡类型联合含 Boolean 又允许"不传"的 prop，都要显式写 `default: undefined`
- **钩子类 prop 要接进真实关闭/切换路径**：`beforeLeave`（Tabs）、`beforeClose`（Dialog）此前只参与类名推导。`beforeClose` 的落点在 `shared/behavior.ts` 的 `overlayConfig`（`requestClose` 统一接管关闭按钮 / 遮罩 / Escape），所以 Drawer、Popconfirm 等浮层组件同样生效；`beforeLeave` 落在 `tabs/core.ts` 的 `setActive`，未声明时保持同步提交，不要让切换时序多一次微任务
- **teleport 后 `wrapper.classes()` 为空**：Dialog 打开时整块内容传到 body，根节点只剩传送门占位。类名/样式必须 `document.querySelector('.ui-dialog')` 读，`wrapper.attributes('style')` 读不到
- **Tabs 的注册时机**：TabPane 在自身 setup 里向 Tabs 注册，晚于 Tabs 首次渲染，所以导航项要 `await nextTick()` 之后才出现
- **Table 行对象的引用身份**：@vue/test-utils 会把 props 装进 `reactive` 容器，所以用例里 `wrapper.vm.$props.data[0] !== rows[0]`，真实应用里数据源是 `reactive`/`ref` 时同样会出现代理与原始对象并存。F-8 已修复：`toggleRowSelection` 先按 `toRaw` 身份匹配、再按 `rowKey` 兜底；新写下钻接口时不要只按引用比对定位行
- **`wrapper.element` 是原生 DOM**：`attributes()`/`classes()` 只存在于 VTU wrapper 上，从 `document.querySelector` 拿到的是原生元素，只能用 `className` / `getAttribute`
- **Form 的 model/rules 必须是 `reactive` 对象**：FormItem 通过深层 watch 感知变化，用例里传普通对象再改属性不会触发校验
- **Button 的两字中文自动插空格**：`autoInsertSpace` 默认开启，`确 定` 这类断言容易写错；测试文本统一用四字以上
- **水波纹、虚拟滚动等依赖计时器/尺寸**：`vi.useFakeTimers()` + `advanceTimersByTime(2200)` 测波波纹清理；happy-dom 无真实布局，虚拟滚动只断言渲染行数而非滚动位置
- **Pagination 跳页提交时机**：只在 `keydown`（Enter）与 `blur` 提交，`keyup`/`change` 不提交；越界夹到首末页，非法值直接忽略

## 4. 断言口径速查

| 组件 | 类名/结构要点 | 事件要点 |
| --- | --- | --- |
| Button | `is-plain/round/circle/dashed`、`color` 写的是 `background-color`+`border-color` 内联值 | `click` 被 `disabled`/`loading` 拦截；`ButtonGroup` 的 `dir` 落到 HTML 属性 |
| Input | 前缀/后缀/清除/密码图标条件渲染，`showPassword` 需 `type: 'password'` | `update:modelValue` + `input`，清空时按 `valueOnClear` 抛 `undefined` |
| Select | 面板常驻 DOM，展开状态看 `aria-expanded` / `is-open`；多选折叠是 `.ui-select__tag--more` | 键盘上下跳过禁用项并循环；清空抛 `undefined` |
| Checkbox/Radio/Switch | `indeterminate` 是 DOM property 不是属性；Switch 两个文案恒渲染 | `update:modelValue` / `update:checked` / `change` 三件套 |
| Form | `--ui-form-label-width`（默认 96px）、`labelSuffix` 文本是 `:` | 规则优先级：item rules 覆盖 form rules；异步校验需 `reactive` |
| Tabs | `type` 落 `ui-tabs--card` / `ui-tabs--border-card`（core.css 里有对应盒状/包边样式）；面板显隐靠 `display: none` 内联样式；关闭按钮 `aria-label="关闭 X"` | `beforeLeave(旧名, 新名)` 返回 reject 或 `false` 时不切换；`tab-change`/`tab-click`/`tab-remove`/`tab-add`/`edit` |
| Table | 冻结列 `is-fixed-left/right` + `has-fixed-left/right`；排序箭头 `is-ascending/descending`；行高亮是 `current-row` | `sort-change` 载荷 `{column, prop, order, sorts}`；`tree-expand` 载荷 `{row, expanded}`；无 `header-click`/`row-dblclick` |
| Dialog | 全屏时面板内联样式清空交给 CSS；`top` 存在时 `align-self: flex-start`；`modal: false` 时遮罩与 `ui-dialog--modal` 类名一起去掉 | 关闭统一走 `update:modelValue(false)` + `close`；`beforeClose(done)` 接管三种关闭路径；`lockScroll` 改 `documentElement.style.overflow` |
| Tree | 缩进是 `padding-left: level*indent+4`；叶子用空 span 占位 | `node-click`/`node-expand`/`check-change`/`update:checked-keys`；`filterNodeMethod(value, raw)` 第二参是原始数据 |
| Pagination | 页码是 `.ui-pagination__pager`（不是 `__pager-item`），省略号 `.ui-pagination__more`；默认 `pagerCount` 为 7 | `update:currentPage`/`current-change`/`prev-click`/`next-click`/`update:pageSize`/`size-change` |

## 5. 新增用例的标准流程

1. 写一个临时探针文件（如 `tests/_probe.spec.ts`）把目标组件的真实 DOM、类名、emit 载荷打印出来
2. 依据打印结果写正式用例，不要凭直觉猜类名或事件名
3. `npx vitest run tests/components/xxx.spec.ts` 跑到全绿
4. 删除探针文件（探针不进仓库）
5. 发现"应该是 A但实际是 B"时：先判断是测试写错还是库缺陷；确认是缺陷就加 `it.fails` 守卫 + 根因注释，并同步 `REQUIREMENTS.md` 缺陷表
6. `npx prettier --write tests/**/*.ts`、`npx eslint tests`、`npm run test` 全绿后提交

## 6. 命令

```bash
npm test              # 先 build:full 再 vitest run（约 3s + 1.5s）
npm run test:watch    # 增量
npm run test:coverage # 覆盖率报告（未设阈值门禁）
```

## 7. 未覆盖 / 待办

- 第二批组件（Menu、Dropdown、Popover、Tooltip、Upload、DatePicker、TimePicker、ColorPicker、Carousel、Image、Progress、Badge、Avatar、Skeleton、Transfer）尚未接入
- `tsconfig.json` 的 `include` 只有 `packages/**/*.ts`，测试文件不参与 `npm run typecheck`；若要让用例也受类型约束，需要单独加 `tests` 目录配置
- Table 的 `resize` 特性（拖拽列宽）依赖真实布局，happy-dom 下只验证了 `resize-change` 之外的静态部分
- 首批记录的 F-1…F-9 已随 `fix/20261106-component-defects` 修完并迁回组件用例，`tests/findings.spec.ts` 暂时删除；后续批次再发现缺陷时重建该文件即可
- 修复只在 `dist/full` 上验证过，`core` 等裁剪 profile 里不存在的特性（如 `table.methods`）没有额外用例，改动这类特性时记得补对应 profile 的断言
