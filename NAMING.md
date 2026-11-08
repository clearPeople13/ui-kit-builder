# UI Kit 命名公约（G7-A25 第一刀）

> 适用范围：`packages/ui-kit/src/components/` 下全部组件的 props / emits / 类名。
> 本文档由代码现状统计得出（每个选定词附证据），不是凭感觉定的规矩。
> 存量违规不立刻改，全部由 `tests/build/naming-guard.spec.ts` 登记白名单并拦新增；
> 存量改名统一在 A25 第二刀执行（见 §5 迁移清单）。
> **新命名先查本文档；查不到的新语义，先在 §2 语义字典补条目再写代码。**

## 1. 总原则

1. **一个语义，全库唯一词。** 同语义不允许两套词并存（现状反面教材：受控"显示"有
   `modelValue`(dialog/drawer) / `visible`(dropdown/popover/popconfirm/tooltip/loading) /
   `open`(popper) 三套，见 §2）。
2. **词性一致。** 布尔 prop 一律形容词/分词；事件按"动作 vs 状态"分两类，各一类词性（见 §3）。
3. **新命名先查本文档。** 新增 prop/event 前查 §2 语义字典；引入新词须在字典登记
   （词、词性、依据），否则守卫用例会拦。
4. 命名风格（camelCase prop、kebab-case event、`ui-` 前缀 BEM 类名）沿用现有主流，不另造。

## 2. 语义字典（语义 → 固定译名）

| 语义                    | 选定词                                                                                     | 词性/形态    | 现状证据（组件）                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 显示（受控，对外 prop） | `modelValue`（Boolean）+ `update:modelValue`                                               | v-model 协议 | 11 组件统一：dialog、drawer、image-viewer、notification、message-box、tour + dropdown、popover、popconfirm、tooltip、loading（第三刀收敛）；PopperContent 的 `visible` 是按 §5 登记的纯展示豁免 |
| 打开（内部态，不对外）  | 内部变量名 `open`（ref）                                                                   | 实现细节     | select、cascader、date-picker、time-picker、time-select、autocomplete、mention、color-picker、tree-select、avatar、tooltip 等 12+ 组件内部 `open` ref，一致；**禁止**把 `open` 做成 prop/event 名                                         |
| 禁用                    | `disabled`                                                                                 | 形容词       | 全库唯一词（input/select/button/tree/menu/form 等 30+ 组件），无 drift                                                                                                                                                                    |
| 只读                    | `readonly`                                                                                 | 形容词       | input、autocomplete、input-number、date-picker、time-picker、mention、input-tag，唯一                                                                                                                                                     |
| 可清空（prop）          | `clearable`                                                                                | -able 形容词 | select-clearable、cascader clearable、date-picker clearable、time-picker clearable、time-select clearable、input-tag clearable、rate clearable、color-picker clearable，唯一                                                              |
| 清空（event）           | `clear`                                                                                    | 动词原形     | input、select、cascader、date-picker、autocomplete、color-picker 等 10 个组件，唯一                                                                                                                                                       |
| 加载中（prop）          | `loading`                                                                                  | 形容词       | skeleton、select-loading、table-loading、mention-loading 特性，唯一                                                                                                                                                                       |
| 选中（值）              | `modelValue`                                                                               | v-model 协议 | select、cascader、checkbox、radio、tree-select 等                                                                                                                                                                                         |
| 选中（态）              | `checked`                                                                                  | 分词形容词   | ~~checkbox、check-tag~~ ✅ 第二刀（prop `checked` + `is-checked` 类名），唯一                                                                                                                                                             |
| 选中（动作 event）      | `select`                                                                                   | 动词原形     | autocomplete、mention、menu，唯一                                                                                                                                                                                                         |
| 可过滤/可搜索（prop）   | `filterable`（Boolean，默认 true）                                                        | -able 形容词 | cascader filterable、transfer filterable、select-filterable 特性、mention（第三刀由 `filterOption: Boolean\|Function` 拆出，谓词走 `filterMethod`）；**无 `searchable` 先例**                                                                 |
| 过滤谓词（prop）        | `filterMethod`                                                                             | 名词+Method | select、cascader、tree-select、mention（第三刀拆出）；签名 `(query, item) => boolean`，唯一                                                                                                                             |
| 显示某子元素（prop）    | `show-` 前缀（`showArrow`/`showClose`/`showText`/`showInput`/`showAlpha`/`showCheckbox`…） | show+名词    | 30+ 处全库唯一模式；**仅用于"是否渲染某子元素"语义，不做他用**                                                                                                                                                                            |

## 3. 词性规则

### 3.1 布尔 prop = 形容词/分词（-ed / -able / -ing 形态）

数据依据：扫描 89 个 core.ts + 175 个特性文件，布尔 prop 形容词阵营
（disabled、readonly、checked、loading、closable、clearable、filterable、editable、
multiple、persistent、draggable、animated、indeterminate…）约 40+ 个词；
动词原形阵营仅 4 处（upload `drag`、icon `spin`、menu `collapse`、popper `open`），
全部登记白名单待 A25 改名（`drag→draggable`、`spin→spinning`、`collapse→collapsed`）。

- 状态语义用形容词/分词：`disabled` / `readonly` / `checked` / `loading` / `selected`。
- "可 xx" 用 -able：`clearable` / `filterable` / `editable` / `closable`。
- 仅"是否渲染某子元素"允许 `show-` 前缀（见字典）。
- **禁止**动词原形作布尔 prop（守卫模式 `boolean-verb-prop`）。
- 例外：`modelValue`/`value`/`checked` 这类受控值本身不受词性约束（它们是协议词）。

### 3.2 事件 = 两类，各一类形态

| 事件类别 | 形态                                    | 例                                                                                                                                               | 依据                        |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| 用户动作 | 动词原形                                | `change` / `clear` / `select` / `scroll` / `load` / `confirm` / `cancel`                                                                         | 动作事件 30+ 处全为动词原形 |
| 状态变化 | `xxx-change` 或 `update:xxx`（v-model） | `visible-change`（autocomplete、select、cascader、date-picker、color-picker、mention 等 8 组件，已统一）、`update:modelValue`（31 组件统一出口） | 存量已是主流，直接定为公约  |

- **禁止**裸 `show` / `hide` / `open` 作事件名：动作/状态二义（tooltip 的 `show`/`hide`
  是状态、menu 的 `open`/`close` 也是状态），一律改 `visible-change`（守卫模式
  `state-event-bare-verb`，存量 `close` 因与动作语义静态不可分，暂在模式外，见 §5）。
- **禁止** DOM 事件名直接外泄：`focusout`/`focusin` 是 DOM 词，对外用 `blur`/`focus`
  （守卫模式 `event-dom-focus-leak`）。
- **禁止** camelCase 事件：`itemFocus` → `item-focus`（守卫模式 `event-camel-case`；
  `update:` 前缀后的 v-model 参数按 Vue 惯例允许 camelCase，不在此列）。
- **禁止**一个组件双 v-model 写口：`update:modelValue` + `update:checked` /
  `update:inputValue` / `update:current` 并存（checkbox、message-box、tour）属
  "同语义多出口"，主值保留 `update:modelValue`，附加受控态改"prop + `xxx-change`"
  （守卫模式 `dual-update-alias`）。

## 4. 类名规范（衔接 A22，先立规不动码）

沿用 BEM + `ui-` 前缀：`ui-<组件>` 块、`__元素`、`--修饰`、`is-状态`。

| 用途             | 选定形态                                    | 现状与依据                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 组件块           | `ui-<组件名>`                               | 89 组件全一致                                                                                                                                                                                                                                                                                                                                   |
| 元素             | `ui-<组件>__<元素>`                         | 全库一致（`__panel`/`__icon`…）                                                                                                                                                                                                                                                                                                                 |
| 状态             | `is-<状态>`                                 | `is-disabled`/`is-checked`/`is-active`/`is-fixed` 为主流（402 处）；`--closable` 这类 `--` 状态是零星漂移（alert），登记待 A22 归并                                                                                                                                                                                                             |
| size 修饰        | `--size-<值>`                               | **三套漂移并存**：`--size-small`（shared/behavior.ts 统一出口 + controls.css + autocomplete/mention，主流）vs `is-size-small`（avatar、cascader、input-tag、form、select、color-picker、segmented、date-picker 约 10 处）vs `--small`/`--${size}`（input-otp、checkbox-button 直拼）。选 `--size-<值>`：它走 behavior.ts 统一出口，收敛成本最低 |
| status/type 修饰 | 状态语义 `is-<status>`；外观变体 `--<type>` | 现状 `is-error`/`is-success`（form/steps）与 `--info`/`--primary`（badge/anchor/tabs/message-box）两套并存。规则：表单校验态、步骤态等**状态**用 `is-`；type/effect 等**外观变体**用 `--`，两词性分开后不再冲突                                                                                                                                 |

## 5. 迁移清单（存量违规 → A25）

> 全部由 `tests/build/naming-guard.spec.ts` 白名单登记，新增同类违规即红。
>
> **第二刀（2026-11-08）已完成**：守卫 BASELINE 登记的 10 组件全部改完，白名单清空。
> 执行中对 popper 一处做了修正：原目标「收敛为 modelValue；open 删除」会让
> PopperTrigger 丢失 aria-expanded/is-open 的驱动源，改为 `open→expanded`
> （与 aria-expanded 同名语义、分词词性、守卫净），PopperContent 的 `visible` 保留
> （单显示词合法）。menu 的 `close` 事件一并并入 `submenu-change`（index, opened）。
>
> **第三刀（2026-11-08）已完成**：守卫新增 `display-prop-word`（Boolean 显示 prop 必须
> `modelValue`）与 `mixed-type-prop`（`[Boolean, Function]` 开关/谓词混型）两条模式；
> visible 阵营 5 组件统一 v-model（triggerConfig 同时抛 `visible-change` + `update:modelValue`），
> mention 拆成 `filterable` + `filterMethod`。BASELINE 只剩两条明确豁免：
> PopperContent 的 `visible`（纯展示面板，无对外展开交互）、Table 的 `showCheckbox`
> （按行谓词是数据规约，Boolean 只是全行快捷开关）。`close` 一词两义静态不可分，
> 仍按本文约定人工区分。

| 组件/文件                                                                                                   | 违规                               | 现状                                                        | A25 目标                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| dialog、drawer、image-viewer、notification、message-box、tour                                               | 显示受控词混用（modelValue 阵营）  | `modelValue: Boolean`                                       | 与 visible 阵营统一（见下行）                                                           |
| dropdown、popover、popconfirm、tooltip、loading                                                             | 显示受控词混用（visible 阵营）     | ~~`visible: Boolean`~~ → `modelValue: Boolean` + `visible-change`/`update:modelValue` | ~~统一为 `modelValue` + `update:modelValue`~~ ✅ 第三刀                                |
| ~~popper~~ ✅ 第二刀                                                                                        | ~~单组件双显示词 + 动词布尔 prop~~ | ~~`visible` 与 `open` 两个 prop 并存~~                      | ~~收敛为 `modelValue`；`open` 删除~~ → 执行改 `open→expanded`，`visible` 保留           |
| checkbox、check-tag                                                                                         | 双 v-model 写口                    | `update:modelValue` + `update:checked`                      | 主值 `update:modelValue`，`checked` 态改 `checked-change`                               |
| ~~message-box~~ ✅ 第二刀                                                                                   | ~~双 v-model 写口~~                | `update:modelValue` + `update:inputValue`                   | 输入值改 `input-value` prop + `input-value-change`                                      |
| ~~tour~~ ✅ 第二刀                                                                                          | ~~双 v-model 写口~~                | `update:modelValue` + `update:current`                      | 步骤改 `current` prop + `current-change`                                                |
| ~~tooltip~~ ✅ 第二刀                                                                                       | 状态事件三套                       | `show`/`hide` + `update:visible`                            | `visible-change`                                                                        |
| ~~menu~~ ✅ 第二刀                                                                                          | 状态事件 + 动词布尔                | 子菜单 `open`/`close` 事件、`collapse` prop                 | `submenu-change` 类；`collapse→collapsed`                                               |
| ~~focus-trap~~ ✅ 第二刀                                                                                    | DOM 焦点词外泄                     | `focusout` 事件                                             | `blur`                                                                                  |
| ~~roving-focus-group~~ ✅ 第二刀                                                                            | camelCase 事件                     | `itemFocus`/`itemBlur`                                      | `item-focus`/`item-blur`                                                                |
| ~~icon、upload~~ ✅ 第二刀                                                                                  | 动词原形布尔 prop                  | `spin`、`drag`                                              | `spinning`、`draggable`                                                                 |
| message、message-box、tour、alert                                                                           | `close` 一词两义                   | 既有"点关闭"动作义（alert）又有"已关闭"状态义（message 系） | 动作义保留 `close`；状态义改 `close-change`，静态守卫暂不强判，改码时人工区分           |
| mention                                                                                                     | 可搜索混型                         | ~~`filterOption: Boolean\|Function`~~ → `filterable` + `filterMethod` | ~~`filterable` + `filterMethod`~~ ✅ 第三刀                                             |
| avatar、cascader、input-tag、form、select、color-picker、segmented、date-picker、input-otp、checkbox-button | size 类名三套                      | `is-size-*` / `--${size}`                                   | `--size-*`（A22）                                                                       |
| alert                                                                                                       | 状态用 `--` 前缀                   | `ui-alert--closable`                                        | `is-closable`（A22）                                                                    |
