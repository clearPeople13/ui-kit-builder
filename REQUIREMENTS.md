# 需求说明：组件库测试用例体系（首批 12 个核心组件）

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

### 2.2 不在本期范围

- 不修改任何组件源码（缺陷只记录、不修复），保持本 PR 的变更面为"纯新增测试"
- 不做视觉回归（Playwright 截图链路保持原样）
- 不覆盖其余组件（Menu、Dropdown、Upload、DatePicker 等留待第二批）
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

1. `npm test` 全绿，13 个测试文件、258 条用例通过，单次运行耗时 ≤ 5 秒（不含构建）
2. `npm run test:watch` 可增量运行；`npm run test:coverage` 可产出覆盖率报告
3. `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm run verify` 均不因新增测试而失败
4. 12 个组件各自具备"行为 + 属性 + 事件 + 边界"四类断言，缺失维度需在文档或注释中说明原因
5. 已知缺陷以 `it.fails` 守卫形式存在且有根因注释，不通过修改源码来"绕绿"

## 5. 已知缺陷清单（详见 `tests/findings.spec.ts`）

| 编号 | 组件 | 现象 | 根因 |
| --- | --- | --- | --- |
| F-1 | Select | `props: { label, value }` 字段映射不生效，选项文案为空 | `normalizeOptions(props.options)` 调用时漏传第二个参数 mapping |
| F-2 | Select | 完全不传 `modelValue` 时回显 `false` 而非占位文案 | prop 类型联合含 Boolean，Vue 对缺省键做布尔归一化，无法与"未选值"区分 |
| F-3 | Input | `id` 未渲染到内部 `<input>` | `inputConfig` 组装控件属性时没有带上 id，FormItem 的 `for` 指向不到真实控件 |
| F-4 | Radio / Checkbox | 只写 `label` 时无法作为选项值 | 同 F-2：`value` 的类型联合含 Boolean，缺省被归一化为 `false`，`value ?? label` 回退被挡住 |
| F-5 | Tabs | `type` 属性只是声明，不产生类名与样式 | `classes()` 仅输出 `is-<tabPosition>` / `is-stretch`，无 `ui-tabs--card` 之类钩子 |
| F-6 | Tabs | `beforeLeave` 从未被调用，无法拦截切换 | `features/tabs-editable` 只用它推导 `ui-tabs--editable` 类名 |
| F-7 | Dialog | `beforeClose` 从未被调用，异步确认无处生效 | `features/closable` 只用它决定关闭按钮是否渲染 |
| F-8 | Table | 按调用方持有的行引用调用 `toggleRowSelection` 静默无效 | 组件内部对 `props.data` 做深层 reactive 包装，`indexOf` 比对代理对象与原始对象不相等 |
| F-9 | Dialog | `ui-dialog--modal` 类名恒定输出 | `features/modal` 的 className 未与 `modal` prop 取值联动（文档性缺陷，遮罩本身可用 `modal: false` 关闭） |

## 6. 后续批次建议

- 第二批：Menu、Dropdown、Popover、Tooltip、Upload、DatePicker、TimePicker、ColorPicker、Carousel、Image、Progress、Badge、Avatar、Skeleton、Transfer
- 第三批：构建器侧（`scripts/build-lib.mjs` 的裁剪结果断言、`meta.json` 体积阈值）与主题令牌快照
- 缺陷修复单独开 PR，每修一条把对应 `it.fails` 降级为常规用例并迁回组件文件
