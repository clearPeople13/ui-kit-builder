import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

/**
 * 命名漂移守卫（G7-A25 第一刀）。
 *
 * NAMING.md 定了"一个语义唯一词、词性一致"的公约，这一刀不改存量代码，
 * 只防新增漂移：静态扫描每个组件 core.ts 与 features/<特性>/index.ts 的 props / emits 声明，
 * 命中「语义字典违规模式」即报红。存量违规全部登记在 BASELINE 白名单里——
 * 白名单内的不报错；白名单外的新增违规、以及白名单里已被 A25 修掉却没同步删除的条目，
 * 都会失败（报错信息直接给出 文件 → 模式 → 命中词）。
 *
 * 模式清单与依据（对应 NAMING.md §2/§3）：
 * - display-drift：同一文件同时把受控"显示"的两个词做成 prop（modelValue:Boolean / visible / open）。
 *   依据：显示受控唯一词 = v-model（modelValue），现状 dialog 系 6 组件用 modelValue、
 *   dropdown/popover/tooltip 系 5 组件用 visible、popper 两个都用，必须收敛。
 * - boolean-verb-prop：Boolean prop 用了动词原形。依据：布尔 prop 词性 = 形容词/分词
 *   （disabled/readonly/checked/clearable… 40+ 处），动词原形仅 4 处存量（drag/spin/collapse/open）。
 * - event-dom-focus-leak：事件名直接用 DOM 焦点词 focusout/focusin。依据：DOM 词不外泄，
 *   对外用 blur/focus。
 * - event-camel-case：非 update: 前缀的事件名含大写（camelCase）。依据：事件全库 kebab-case；
 *   update: 后的 v-model 参数按 Vue 惯例允许 camelCase（update:currentTabStopId），显式豁免。
 * - dual-update-alias：同一文件出现两个及以上不同的 update:* 事件。依据：一个组件只保留一个
 *   v-model 主写口，附加受控态改 "prop + xxx-change"。
 * - state-event-bare-verb：事件名是裸 show/hide/open。依据：状态变化事件统一 xxx-change
 *   （visible-change 已 8 组件主流）；裸 show/hide/open 动作/状态二义（tooltip 的 show 是状态），
 *   禁止新用。close 因"点关闭"动作义与"已关闭"状态义静态不可分，暂不在模式内，见 NAMING.md §5。
 * - display-prop-word（第三刀）：Boolean 型"显示受控" prop 必须叫 modelValue，不得用 visible/open。
 *   依据：v-model 协议是显示受控的唯一出口；第三刀把 visible 阵营 5 组件全部收敛后，
 *   只剩 popper 的 visible 按 NAMING.md §5 豁免登记在 BASELINE。
 * - mixed-type-prop（第三刀）：type 数组同时含 Boolean 与 Function（开关与谓词混型）。
 *   依据：mention filterOption 拆成 filterable + filterMethod 后，同一 prop 不能既当开关
 *   又当过滤器；table showCheckbox 的按行谓词按 §5 豁免登记。
 */

type PropDecl = { name: string; isBoolean: boolean; typeText: string }

type PatternId =
  | 'display-drift'
  | 'boolean-verb-prop'
  | 'event-dom-focus-leak'
  | 'event-camel-case'
  | 'dual-update-alias'
  | 'state-event-bare-verb'
  | 'display-prop-word'
  | 'mixed-type-prop'

/** 动词原形黑名单：布尔 prop 不得用这些词（show-/hide- 前缀子元素语义不受此限，见 NAMING.md §3.1） */
const BOOLEAN_VERBS = new Set([
  'drag',
  'spin',
  'load',
  'edit',
  'search',
  'clear',
  'close',
  'open',
  'toggle',
  'select',
  'change',
  'scroll',
  'filter',
  'sort',
  'remove',
  'add',
  'delete',
  'submit',
  'cancel',
  'confirm',
  'refresh',
  'expand',
  'collapse'
])

/** 受控"显示"的同义词集合：同一文件出现 2 个及以上即漂移 */
const DISPLAY_WORDS = ['modelValue', 'visible', 'open'] as const

const PATTERN_TITLES: Record<PatternId, string> = {
  'display-drift': '受控显示一物多词（modelValue/visible/open 并存）',
  'boolean-verb-prop': '布尔 prop 用了动词原形（应为形容词/分词）',
  'event-dom-focus-leak': '事件名外泄 DOM 焦点词（focusout/focusin）',
  'event-camel-case': '事件名 camelCase（应为 kebab-case）',
  'dual-update-alias': '同一组件多个 update:* 写口（v-model 应单一出口）',
  'state-event-bare-verb': '状态事件用了裸 show/hide/open（应为 xxx-change）',
  'display-prop-word': '显示受控 Boolean prop 未用 modelValue（visible/open 应为 v-model）',
  'mixed-type-prop': '开关与谓词混型（type 同时含 Boolean 与 Function）'
}

/** prop 声明是扁平对象字面量 `name: { type: ..., ... }`（无嵌套花括号），含 type 字段即视为 prop */
function extractProps(source: string): PropDecl[] {
  const props: PropDecl[] = []
  for (const match of source.matchAll(/^\s*([A-Za-z_$][\w$]*):\s*\{([^{}]*)\}/gm)) {
    if (!/\btype:\s*(\[|Boolean\b|String\b|Number\b|Array\b|Object\b|Function\b)/.test(match[2])) {
      continue
    }
    props.push({ name: match[1], isBoolean: /\bBoolean\b/.test(match[2]), typeText: match[2] })
  }
  return props
}

/** 事件名 = emits: [...] 声明 ∪ emit('...') 调用点（特性文件常不声明 emits 数组，直接 emit） */
function extractEvents(source: string): string[] {
  const events = new Set<string>()
  // emits 数组可能含展开（[...base.emits, 'cancel']），按括号配平取整体再抽引号内名字
  for (const start of source.matchAll(/emits:\s*\[/g)) {
    let depth = 0
    let end = start.index ?? 0
    for (let index = (start.index ?? 0) + start[0].length - 1; index < source.length; index += 1) {
      if (source[index] === '[') {
        depth += 1
      } else if (source[index] === ']') {
        depth -= 1
        if (depth === 0) {
          end = index
          break
        }
      }
    }
    const body = source.slice(start.index ?? 0, end + 1)
    for (const match of body.matchAll(/['"]([\w:-]+)['"]/g)) {
      events.add(match[1])
    }
  }
  for (const match of source.matchAll(/\bemit\(\s*['"]([\w:-]+)['"]/g)) {
    events.add(match[1])
  }
  return [...events]
}

/** 对单个源文件跑全部模式检查器，返回 模式 → 命中词列表 */
function checkSource(source: string): Partial<Record<PatternId, string[]>> {
  const props = extractProps(source)
  const events = extractEvents(source)
  const propNames = new Set(props.map((prop) => prop.name))
  const findings: Partial<Record<PatternId, string[]>> = {}

  const present = DISPLAY_WORDS.filter((word) =>
    word === 'modelValue' ? props.some((prop) => prop.name === 'modelValue' && prop.isBoolean) : propNames.has(word)
  )
  if (present.length > 1) {
    findings['display-drift'] = present
  }

  const verbProps = props.filter((prop) => prop.isBoolean && BOOLEAN_VERBS.has(prop.name)).map((prop) => prop.name)
  if (verbProps.length > 0) {
    findings['boolean-verb-prop'] = verbProps
  }

  const focusLeaks = events.filter((event) => event === 'focusout' || event === 'focusin')
  if (focusLeaks.length > 0) {
    findings['event-dom-focus-leak'] = focusLeaks
  }

  const camelEvents = events.filter((event) => !event.startsWith('update:') && /[A-Z]/.test(event))
  if (camelEvents.length > 0) {
    findings['event-camel-case'] = camelEvents
  }

  const updateEvents = events.filter((event) => event.startsWith('update:'))
  if (new Set(updateEvents).size > 1) {
    findings['dual-update-alias'] = updateEvents
  }

  const bareStateEvents = events.filter((event) => event === 'show' || event === 'hide' || event === 'open')
  if (bareStateEvents.length > 0) {
    findings['state-event-bare-verb'] = bareStateEvents
  }

  const displayWordProps = props
    .filter((prop) => prop.isBoolean && (prop.name === 'visible' || prop.name === 'open'))
    .map((prop) => prop.name)
  if (displayWordProps.length > 0) {
    findings['display-prop-word'] = displayWordProps
  }

  // 只抓"二选一"混型：正好 Boolean+Function 说明开关与谓词共用一 prop。
  // 多类型值联合（valueOnClear: String|Number|Boolean|Function）是值/工厂语义，不在此列。
  const mixedTypeProps = props
    .filter((prop) => {
      const types = prop.typeText.match(/\btype:\s*\[([^\]]*)\]/)
      if (!types) {
        return false
      }
      const parts = types[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      return parts.length === 2 && parts.includes('Boolean') && parts.includes('Function')
    })
    .map((prop) => prop.name)
  if (mixedTypeProps.length > 0) {
    findings['mixed-type-prop'] = mixedTypeProps
  }

  return findings
}

const componentsRoot = path.join(repoRoot, 'packages/ui-kit/src/components')

/** 扫描目标：每个组件的 core.ts 与 features/<特性>/index.ts */
function scanTargetFiles(): string[] {
  const files: string[] = []
  for (const component of fs.readdirSync(componentsRoot)) {
    const core = path.join(componentsRoot, component, 'core.ts')
    if (fs.existsSync(core)) {
      files.push(`${component}/core.ts`)
    }
    const featuresDir = path.join(componentsRoot, component, 'features')
    if (fs.existsSync(featuresDir)) {
      for (const feature of fs.readdirSync(featuresDir)) {
        const index = path.join(featuresDir, feature, 'index.ts')
        if (fs.existsSync(index)) {
          files.push(`${component}/features/${feature}/index.ts`)
        }
      }
    }
  }
  return files.sort()
}

function scanAll(): Record<string, Partial<Record<PatternId, string[]>>> {
  const result: Record<string, Partial<Record<PatternId, string[]>>> = {}
  for (const file of scanTargetFiles()) {
    const findings = checkSource(fs.readFileSync(path.join(componentsRoot, file), 'utf8'))
    if (Object.keys(findings).length > 0) {
      result[file] = findings
    }
  }
  return result
}

/**
 * 存量违规白名单。G7-A25 第二刀（2026-11-08）已把第一刀登记的 10 组件全部改完并清空本表：
 * checkbox/check-tag 的 update:checked→checked-change、focus-trap 的 focusout→blur、
 * icon spin→spinning、menu collapse→collapsed + open/close→submenu-change、
 * message-box 的 update:inputValue→input-value-change、popper 的 open→expanded、
 * roving-focus-group 的 itemFocus/itemBlur→kebab、tour 的 update:current→current-change、
 * tooltip 的 show/hide→visible-change、upload drag→draggable。
 * 结构：文件 → 模式 → 命中词。扫描结果与本表必须完全一致：
 * 表外的命中是新增漂移（红）；表内但已扫不到的条目说明修复后忘了删白名单（同样红，
 * 防止白名单漂成死名单）。两个方向都会给出精确的 文件 → 模式 → 词 差异。
 * 第三刀（2026-11-08）扩了 display-prop-word / mixed-type-prop 两模式，visible 阵营 5 组件
 * 与 mention filterOption 已改完；表内只剩两处按 NAMING.md §5 明确豁免的条目。
 */
const BASELINE: Record<string, Partial<Record<PatternId, string[]>>> = {
  // PopperContent 的 visible 是"单显示词"豁免：它只管面板显示，没有对外展开交互，
  // 改成 modelValue 会让纯展示面板伪装成受控组件（NAMING.md §5）
  'popper/core.ts': { 'display-prop-word': ['visible'] },
  // Table 按行判定复选框是数据规约，Boolean 只是"全部行"快捷开关；
  // 拆 method 会改掉表格 API 形状，第四刀再评估（NAMING.md §5）
  'table/features/selection/index.ts': { 'mixed-type-prop': ['showCheckbox'] }
}

function formatFindings(findings: Record<string, Partial<Record<PatternId, string[]>>>): string {
  return Object.entries(findings)
    .flatMap(([file, patterns]) =>
      Object.entries(patterns).map(
        ([pattern, tokens]) => `${file} → ${pattern}（${PATTERN_TITLES[pattern as PatternId]}）: ${tokens?.join(', ')}`
      )
    )
    .join('\n  ')
}

describe('守卫自测：检查器必须会咬人', () => {
  // 人为构造一份覆盖全部 8 种模式的"新违规"源文件，逐模式断言检查器返回失败。
  // 真实仓库里没有这份代码；它存在的意义是证明每条模式都能命中——
  // 若未来有人把某条模式写松了，这里先于仓库扫描报红。
  const synthetic = [
    'export const bad = {',
    '  props: {',
    '    modelValue: { type: Boolean },',
    '    visible: { type: Boolean },',
    '    spin: { type: Boolean },',
    '    filterOption: { type: [Boolean, Function] }',
    '  },',
    "  emits: ['show', 'focusout', 'itemFocus', 'update:modelValue', 'update:checked'],",
    "  setup(_p, { emit }) { emit('hide') }",
    '}'
  ].join('\n')

  it('构造源里 8 种模式全部被命中', () => {
    const findings = checkSource(synthetic)
    expect(findings['display-drift']).toEqual(['modelValue', 'visible'])
    expect(findings['boolean-verb-prop']).toEqual(['spin'])
    expect(findings['state-event-bare-verb']).toEqual(['show', 'hide'])
    expect(findings['event-dom-focus-leak']).toEqual(['focusout'])
    expect(findings['event-camel-case']).toEqual(['itemFocus'])
    expect(findings['dual-update-alias']).toEqual(['update:modelValue', 'update:checked'])
    expect(findings['display-prop-word']).toEqual(['visible'])
    expect(findings['mixed-type-prop']).toEqual(['filterOption'])
  })

  it('公约合规的构造源一种模式都不命中', () => {
    const clean = [
      'export const good = {',
      '  props: {',
      '    modelValue: { type: Boolean },',
      '    disabled: { type: Boolean },',
      '    clearable: { type: Boolean },',
      '    showArrow: { type: Boolean, default: true }',
      '  },',
      "  emits: ['update:modelValue', 'change', 'clear', 'visible-change'],",
      '}'
    ].join('\n')
    expect(checkSource(clean)).toEqual({})
  })

  it('守卫确实会失败：构造源不在白名单内时扫描断言报错', () => {
    // 与主用例同一判定逻辑：把构造结果当"扫描结果"与白名单比对，必须产生新增违规 diff
    const findings = { 'synthetic/core.ts': checkSource(synthetic) }
    const unexpected = Object.fromEntries(
      Object.entries(findings).filter(
        ([file, patterns]) =>
          !Object.entries(patterns).every(
            ([pattern, tokens]) =>
              BASELINE[file]?.[pattern as PatternId]?.length === tokens?.length &&
              BASELINE[file]?.[pattern as PatternId]?.every((token) => tokens?.includes(token))
          )
      )
    )
    expect(Object.keys(unexpected)).toEqual(['synthetic/core.ts'])
  })
})

describe('命名漂移守卫（对 packages/ui-kit/src/components 全量扫描）', () => {
  const scanned = scanAll()

  it('扫描范围覆盖每个组件的 core.ts 与全部特性入口', () => {
    const targets = scanTargetFiles()
    expect(targets.length).toBeGreaterThanOrEqual(89 + 100)
    expect(targets.every((file) => file.endsWith('core.ts') || file.endsWith('index.ts'))).toBe(true)
  })

  it('白名单外无新增命名违规', () => {
    const unexpected: Record<string, Partial<Record<PatternId, string[]>>> = {}
    for (const [file, patterns] of Object.entries(scanned)) {
      for (const [pattern, tokens] of Object.entries(patterns)) {
        const allowed = BASELINE[file]?.[pattern as PatternId]
        const isNew = !allowed || tokens?.length !== allowed.length || tokens?.some((token) => !allowed.includes(token))
        if (isNew) {
          unexpected[file] = { ...unexpected[file], [pattern]: tokens }
        }
      }
    }
    expect(
      Object.keys(unexpected).length === 0 ? [] : `\n  新增命名漂移：\n  ${formatFindings(unexpected)}`,
      '新增违规请按 NAMING.md §2/§3 改名，或在 A25 迁移中登记进 BASELINE'
    ).toEqual([])
  })

  it('白名单无死条目（修复后必须同步删除登记）', () => {
    const stale: Record<string, Partial<Record<PatternId, string[]>>> = {}
    for (const [file, patterns] of Object.entries(BASELINE)) {
      for (const [pattern, tokens] of Object.entries(patterns)) {
        const actual = scanned[file]?.[pattern as PatternId]
        const gone = !actual || actual.length !== tokens?.length || tokens?.some((token) => !actual.includes(token))
        if (gone) {
          stale[file] = { ...stale[file], [pattern]: tokens }
        }
      }
    }
    expect(
      Object.keys(stale).length === 0
        ? []
        : `\n  白名单死条目（代码已修复或改名，请同步删 BASELINE）：\n  ${formatFindings(stale)}`,
      'A25 改完一个组件就删它对应的 BASELINE 条目'
    ).toEqual([])
  })
})
