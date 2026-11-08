import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Registry, SlotSpec } from './_helpers'
import { bundleOf, exists, loadTestRegistry, profileNames, readText, repoRoot } from './_helpers'

/**
 * slot 契约（A21）：spec.mjs 声明 → d.ts 类型 → 产物 meta → demo API 表 → 实现守卫。
 *
 * slots 是唯一没有 second source 的组件事实：props/features 有运行时 props 声明与
 * d.ts 互相印证，slot 只存在于渲染代码里。这一层用四组用例把 spec 声明钉死：
 * a) dist meta 与 spec 逐字一致（构建器不许说谎）；
 * b) d.ts 生成 Vue 惯例的 Slots 接口；
 * c) demo API 表数据源带上 slots 段；
 * d) 守卫：声明的 slot 名必须在组件源码里真实渲染过，扫不到的渲染路径
 *    必须显式标注 renderedVia 并在 RENDERED_VIA_NOTES 里登记原因。
 */

const registry: Registry = await loadTestRegistry()

const { validateExportSlots } = (await import('../../registry.mjs')) as {
  validateExportSlots: (componentId: string, exportName: string, slots: unknown) => unknown
}

/** 收集注册表里所有声明了 slots 的导出（目前只有 input，后续批次直接进这个循环） */
function exportsWithSlots() {
  const found: Array<{ componentId: string; exportName: string; slots: SlotSpec[] }> = []
  for (const componentId of registry.order) {
    for (const item of registry.components[componentId].exports) {
      const slots = item.slots ?? []
      if (slots.length) {
        found.push({ componentId, exportName: item.name, slots })
      }
    }
  }
  return found
}

/** 动态渲染豁免台账：扫不到静态渲染点的 slot 必须在这里登记"为什么扫不到"。
 *  key: `${componentId}/${exportName}/${slotName}`。当前为空——input/append 由
 *  守卫解析 shared 的 inputConfig 函数体覆盖，不需要豁免。 */
const RENDERED_VIA_NOTES: Record<string, string> = {}

/**
 * 公开 slot 缺口台账（W1.1）：源码里扫到渲染点、但 spec 还没声明的 slot 必须逐条登记，
 * 且登记集合要与实际缺口完全一致——补完一个就得从台账删一个，漏删/新增未登记都会红。
 * 分类口径：A 消费方应能自定义（排期到 W1.2/W1.3）；C 结构性子节点容器；
 * D 内部件不对外承诺。
 *
 * 扫描口径与实现守卫一致：core.ts + features + core.ts 从 shared 引入的 `*Config`
 * 函数体。子导出目录（如 button/button-group）不在扫描集内，故不进台账。
 */
const SLOT_DECLARATION_BASELINE: Record<string, { slots: string[]; reason: string }> = {
  affix: { slots: ['default'], reason: 'C 类，children 容器' },
  anchor: { slots: ['default'], reason: 'C 类，children 容器' },
  breadcrumb: { slots: ['default'], reason: 'C 类，子项容器' },
  carousel: { slots: ['default'], reason: 'C 类，子项容器' },
  col: { slots: ['default'], reason: 'C 类，children 容器' },
  collapse: { slots: ['default'], reason: 'C 类，子项容器' },
  'collapse-transition': { slots: ['default'], reason: 'D 类，内部过渡件' },
  collection: { slots: ['default'], reason: 'D 类，内部件' },
  'config-provider': { slots: ['default'], reason: 'C 类，children 容器' },
  container: { slots: ['default'], reason: 'C 类，children 容器' },
  descriptions: { slots: ['default'], reason: 'C 类，子项容器' },
  link: { slots: ['default'], reason: 'C 类，文本内容容器' },
  overlay: { slots: ['default'], reason: 'C 类，内部浮层包装' },
  popper: { slots: ['default'], reason: 'D 类，内部浮层容器' },
  'roving-focus-group': { slots: ['default'], reason: 'D 类，内部件' },
  row: { slots: ['default'], reason: 'C 类，children 容器' },
  scrollbar: { slots: ['default'], reason: 'C 类，children 容器' },
  slot: { slots: ['default'], reason: 'D 类，内部件' },
  space: { slots: ['default'], reason: 'C 类，children 容器' },
  splitter: { slots: ['default'], reason: 'C 类，面板容器' },
  tabs: { slots: ['default'], reason: 'C 类，页签容器' },
  tag: { slots: ['default'], reason: 'C 类，文本内容容器' },
  text: { slots: ['default'], reason: 'C 类，文本内容容器' }
}

function detectedSlotNames(componentId: string): string[] {
  const scan = renderedSlotScanText(componentId)
  const found = new Set<string>()
  for (const match of scan.matchAll(/slots\??\.([A-Za-z_$][\w$]*)/g)) {
    found.add(match[1])
  }
  for (const match of scan.matchAll(/slots\??\[\s*['"]([^'"]+)['"]\s*\]/g)) {
    found.add(match[1])
  }
  for (const match of scan.matchAll(/renderSlot\([^)]*['"]([^'"]+)['"]/g)) {
    found.add(match[1])
  }
  return [...found].sort()
}

function declaredSlotNames(componentId: string): string[] {
  return [
    ...new Set(registry.components[componentId].exports.flatMap((item) => (item.slots ?? []).map((slot) => slot.name)))
  ].sort()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 从 shared 源码里抠出 `export function <name>(...) { ... }` 的函数体（花括号配平） */
function extractFunctionBody(source: string, fnName: string): string | null {
  const match = source.match(new RegExp(`export function ${escapeRegExp(fnName)}\\s*\\(`))
  if (!match || match.index === undefined) {
    return null
  }
  // 先按圆括号深度走到参数列表末尾：参数类型标注（如 options: { name: string }）里也有花括号，
  // 直接 indexOf('{') 会抠到参数类型而不是函数体
  let cursor = match.index + match[0].length
  let parens = 1
  while (cursor < source.length && parens > 0) {
    if (source[cursor] === '(') {
      parens += 1
    } else if (source[cursor] === ')') {
      parens -= 1
    }
    cursor += 1
  }
  const open = source.indexOf('{', cursor)
  if (open < 0) {
    return null
  }
  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1
    } else if (source[index] === '}') {
      depth -= 1
      if (depth === 0) {
        return source.slice(open, index + 1)
      }
    }
  }
  return null
}

/**
 * 组件渲染 slot 的静态扫描文本：core.ts + features 目录下全部 ts 文件。
 * core.ts 从 shared 引入的 `*Config` 函数（input → inputConfig）是渲染的实际发生地，
 * 一并把函数体抠进扫描集——豁免字段只留给真正动态的渲染方式。
 */
function renderedSlotScanText(componentId: string): string {
  const base = `packages/ui-kit/src/components/${componentId}`
  const parts: string[] = []
  const corePath = `${base}/core.ts`
  if (exists(corePath)) {
    const core = readText(corePath)
    parts.push(core)
    for (const match of core.matchAll(/import\s*\{([^}]+)\}\s*from\s*'(\.[^']*shared\/[^']+)'/g)) {
      const imported = match[1]
        .split(',')
        .map((name) => name.trim())
        .filter((name) => /Config$/.test(name))
      const sharedFile = path.resolve(path.join(repoRoot, path.dirname(corePath)), `${match[2]}.ts`)
      if (!fs.existsSync(sharedFile)) {
        continue
      }
      const sharedSource = fs.readFileSync(sharedFile, 'utf8')
      for (const name of imported) {
        const body = extractFunctionBody(sharedSource, name)
        if (body) {
          parts.push(body)
        }
      }
    }
  }
  const featuresDir = `${base}/features`
  if (exists(featuresDir)) {
    for (const file of fs.readdirSync(path.join(repoRoot, featuresDir), { recursive: true })) {
      if (typeof file === 'string' && file.endsWith('.ts')) {
        parts.push(readText(`${featuresDir}/${file}`))
      }
    }
  }
  return parts.join('\n')
}

function isRendered(scan: string, slotName: string): boolean {
  const escaped = escapeRegExp(slotName)
  return [
    new RegExp(`slots\\??\\.${escaped}\\b`),
    new RegExp(`slots\\??\\[\\s*['"]${escaped}['"]\\s*\\]`),
    new RegExp(`renderSlot\\([^)]*['"]${escaped}['"]`)
  ].some((pattern) => pattern.test(scan))
}

function slotsInterfaceBlock(types: string, exportName: string): string | null {
  const match = types.match(new RegExp(`export interface ${exportName}Slots \\{([\\s\\S]*?)\\n\\}`))
  return match ? match[1] : null
}

describe('spec schema：registry 解析与校验', () => {
  it('合法的 slots 声明原样通过，registry 里 input 暴露四向插槽', () => {
    const slots = [{ name: 'append', scope: null, fallback: false, description: '后置内容' }]
    expect(validateExportSlots('probe', 'Probe', slots)).toBe(slots)
    expect(validateExportSlots('probe', 'Probe', undefined)).toBeUndefined()

    const input = registry.components.input.exports[0]
    expect(input.slots?.map((slot) => slot.name)).toEqual(['prepend', 'prefix', 'suffix', 'append'])
  })

  it('schema 错误报出组件/导出/slot 三级定位的清晰信息', () => {
    const bad = (slots: unknown) => () => validateExportSlots('probe', 'Probe', slots)
    expect(bad('append')).toThrow(/Probe 的 slots 必须是数组/)
    expect(bad([null])).toThrow(/每一项都必须是对象/)
    expect(bad([{ name: '', fallback: false }])).toThrow(/name 必须是非空字符串/)
    expect(
      bad([
        { name: 'a', fallback: false },
        { name: 'a', fallback: false }
      ])
    ).toThrow(/"a" 重复声明/)
    expect(bad([{ name: 'a', scope: [], fallback: false }])).toThrow(/scope 必须是对象或 null/)
    expect(bad([{ name: 'a', scope: { value: '' }, fallback: false }])).toThrow(/value 缺少类型字符串/)
    expect(bad([{ name: 'a' }])).toThrow(/fallback 必须是布尔/)
    expect(bad([{ name: 'a', fallback: false, description: 1 }])).toThrow(/description 必须是字符串/)
    expect(bad([{ name: 'a', fallback: false, renderedVia: '' }])).toThrow(/renderedVia 必须是非空字符串/)
  })
})

describe('slot 契约：产物 meta 与 d.ts', () => {
  it('dist/full meta.json 的 slots 与 spec.mjs 逐字一致（双向）', () => {
    const full = bundleOf('full')
    const expected: Record<string, Record<string, SlotSpec[]>> = {}
    for (const componentId of full.meta.components) {
      for (const item of registry.components[componentId].exports) {
        if ((item.slots ?? []).length) {
          expected[componentId] ??= {}
          expected[componentId][item.name] = item.slots!
        }
      }
    }
    expect(full.meta.slots ?? {}, '构建器写进 meta 的 slots 与 spec 不一致，请重新 build').toEqual(expected)
  })

  it('选中声明了 slots 的组件的每份产物，meta 与 d.ts 同步带 slot 契约', () => {
    for (const name of profileNames) {
      const bundle = bundleOf(name)
      for (const { componentId, exportName, slots } of exportsWithSlots()) {
        if (!bundle.meta.selection[componentId]) {
          continue
        }
        expect(
          bundle.meta.slots?.[componentId]?.[exportName],
          `${name} 的 meta 缺 ${componentId}/${exportName} slots`
        ).toEqual(slots)
        const block = slotsInterfaceBlock(bundle.types, exportName)
        expect(block, `${name} 的 d.ts 缺 ${exportName}Slots 接口`).toBeTruthy()
        for (const slot of slots) {
          const scopeProps = Object.entries(slot.scope ?? {})
          if (scopeProps.length) {
            // d.ts 生成器对非标识符 slot 名（如 file-item）加引号，断言按同一口径归一
            const slotName = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(slot.name) ? slot.name : JSON.stringify(slot.name)
            expect(block!, `${exportName}.${slot.name} 应有作用域 props`).toContain(`${slotName}(props: {`)
            for (const [key, type] of scopeProps) {
              // d.ts 生成器会把函数类型包一层括号（`() => void` → `(() => void)`），断言按同一口径归一
              const expectedType =
                type.includes('=>') && !(type.startsWith('(') && type.endsWith(')')) ? `(${type})` : type
              expect(block!).toContain(`${key}: ${expectedType}`)
            }
          } else {
            expect(block!, `${exportName}.${slot.name} 应为无作用域的 (): VNode[] 形态`).toContain(
              `${slot.name}(): VNode[]`
            )
          }
        }
      }
    }
  })
})

describe('slot 契约：demo API 表数据源', () => {
  it('demo/meta.json 的 exports 带 slots 段（名称/作用域/默认内容）', () => {
    const demo = JSON.parse(readText('examples/consumer/src/demo/meta.json')) as {
      components: Array<{
        id: string
        exports: Array<{ name: string; slots?: Array<Record<string, unknown>> }>
      }>
    }
    for (const { componentId, exportName, slots } of exportsWithSlots()) {
      const component = demo.components.find((item) => item.id === componentId)
      const exp = component?.exports.find((item) => item.name === exportName)
      expect(exp, `demo meta 缺 ${componentId}/${exportName}`).toBeTruthy()
      expect(exp!.slots ?? [], `demo meta 的 ${exportName} slots 与 spec 不一致，请重新运行 npm run meta:demo`).toEqual(
        slots.map((slot) => ({
          name: slot.name,
          scope: slot.scope && Object.keys(slot.scope).length ? slot.scope : null,
          fallback: slot.fallback,
          ...(slot.description ? { description: slot.description } : {})
        }))
      )
    }
  })
})

describe('slot 契约：实现守卫', () => {
  it('声明的 slot 名必须在组件源码（含 shared 配置函数体）里真实渲染过', () => {
    const declared = exportsWithSlots()
    expect(declared.length, 'input 样板必须带 append 声明，后续批次组件在这里被覆盖').toBeGreaterThan(0)
    for (const { componentId, exportName, slots } of declared) {
      const scan = renderedSlotScanText(componentId)
      for (const slot of slots) {
        if (!isRendered(scan, slot.name)) {
          expect(
            slot.renderedVia,
            `${componentId}/${exportName}/${slot.name} 在源码里扫不到渲染点：` +
              '确认是动态渲染后在 spec 里标注 renderedVia，并在 RENDERED_VIA_NOTES 登记原因'
          ).toBeTruthy()
        }
      }
    }
  })

  it('renderedVia 豁免必须逐条登记说明，不允许裸豁免', () => {
    for (const { componentId, exportName, slots } of exportsWithSlots()) {
      for (const slot of slots) {
        if (slot.renderedVia) {
          expect(
            RENDERED_VIA_NOTES[`${componentId}/${exportName}/${slot.name}`],
            `${componentId}/${exportName}/${slot.name} 用了 renderedVia="${slot.renderedVia}" 但没登记说明`
          ).toBeTruthy()
        }
      }
    }
  })

  it('公开 slot 缺口台账与实际缺口双向一致（补完要删、新增要登记）', () => {
    const actual: Record<string, string[]> = {}
    for (const componentId of registry.order) {
      const declared = declaredSlotNames(componentId)
      const missing = detectedSlotNames(componentId).filter((name) => !declared.includes(name))
      if (missing.length) {
        actual[componentId] = missing
      }
    }

    const baseline: Record<string, string[]> = {}
    for (const [componentId, entry] of Object.entries(SLOT_DECLARATION_BASELINE)) {
      expect(entry.reason.trim(), `${componentId} 的台账条目必须写明分类与排期理由`).not.toBe('')
      baseline[componentId] = [...entry.slots].sort()
    }

    const unregistered = Object.keys(actual).filter((componentId) => !(componentId in baseline))
    expect(
      unregistered,
      `有渲染点但既未声明也未登记理由的组件：${unregistered.join(', ')}（补 spec 声明，或在 SLOT_DECLARATION_BASELINE 登记分类）`
    ).toEqual([])

    const stale = Object.keys(baseline).filter((componentId) => !(componentId in actual))
    expect(
      stale,
      `台账登记但实际已无缺口的组件：${stale.join(', ')}（声明的 slot 已进 spec 或渲染点已消失，请删条目）`
    ).toEqual([])

    for (const componentId of Object.keys(actual)) {
      expect(baseline[componentId], `${componentId} 的缺口 slot 集合与台账不一致`).toEqual(actual[componentId])
    }
  })
})
