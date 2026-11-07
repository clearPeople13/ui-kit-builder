import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Bundle, Registry } from './_helpers'
import { bundleOf, profileNames, readText, repoRoot } from './_helpers'

/**
 * 类型契约：dist/<profile>/index.d.ts 必须与同一份 spec.mjs 说同样的话。
 *
 * 组件用例跑的是运行时 JS，属性类型写错、特性接口漏生成、d.ts 里多出一个从没实现的方法，
 * 单元测试一律看不见——只有消费方的 tsc 会撞墙，而那时已经晚了。
 * 这一层把 d.ts 拆回"导出名 / 属性名 / 方法名 / 特性 id"四张表，跟 registry 与 meta.json 逐格比对。
 */

let registry: Registry

beforeAll(async () => {
  registry = await (await import('./_helpers')).loadTestRegistry()
})

/** d.ts 里 `export declare const X: DefineComponent<...>` 的组件导出名（不含 activeComponents 等元信息） */
function declaredComponents(types: string) {
  return [...types.matchAll(/^export declare const ([A-Za-z_$][\w$]*): DefineComponent/gm)].map((match) => match[1])
}

function interfaceNames(types: string) {
  return [...types.matchAll(/^export interface ([A-Za-z_$][\w$]*) \{/gm)].map((match) => match[1])
}

/** 选中某个组件后，spec.mjs 期望出现的导出名（顺序与 registry.order 一致） */
function expectedExports(componentIds: string[]) {
  const names: string[] = []
  for (const id of registry.order) {
    if (!componentIds.includes(id)) {
      continue
    }
    for (const item of registry.components[id].exports) {
      names.push(item.name)
    }
  }
  return names
}

function featureInterfaceName(exportName: string, featureId: string) {
  const suffix = featureId
    .split('.')
    .slice(1)
    .join('-')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return `${exportName}${suffix}Props`
}

/** 把 interface 体里的 `name?: type` 收成表 */
function interfaceMembers(types: string, name: string) {
  const block = types.match(new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`))
  return block ? [...block[1].matchAll(/^ {2}(?:"([^"]+)"|([A-Za-z_$][\w$]*))\??:/gm)].map((m) => m[1] ?? m[2]) : null
}

describe('d.ts 的导出面', () => {
  it('每份产物的组件导出名与 spec.mjs 的 selection 一一对应，顺序一致', () => {
    for (const bundle of profileNames.map(bundleOf)) {
      expect(declaredComponents(bundle.types), `${bundle.profile} 的 d.ts 导出面与 meta.selection 不一致`).toEqual(
        expectedExports(Object.keys(bundle.meta.selection))
      )
    }
  })

  it('导出名与 interface 名在整份 d.ts 里不重复（重复意味着 spec 写重了）', () => {
    for (const bundle of profileNames.map(bundleOf)) {
      for (const list of [declaredComponents(bundle.types), interfaceNames(bundle.types)]) {
        expect(new Set(list).size, `${bundle.profile} 有重名导出`).toBe(list.length)
      }
    }
  })

  it('activeComponents / activeFeatures 元组与 meta.json 逐字一致', () => {
    for (const bundle of profileNames.map(bundleOf)) {
      const components = bundle.types.match(/export declare const activeComponents: readonly \[([^\]]*)\]/)
      const features = bundle.types.match(/export declare const activeFeatures: readonly \[([^\]]*)\]/)
      expect(components, `${bundle.profile} d.ts 缺 activeComponents`).toBeTruthy()
      expect(features, `${bundle.profile} d.ts 缺 activeFeatures`).toBeTruthy()
      expect(JSON.parse(`[${components![1]}]`)).toEqual(bundle.meta.components)
      expect(JSON.parse(`[${features![1]}]`)).toEqual(bundle.meta.features)
    }
  })

  it('运行时导出的 activeComponents / activeFeatures 与 d.ts、meta 三方同源', async () => {
    const bundle = bundleOf('full')
    const module = (await import('../../dist/full/ui-kit.js')) as {
      activeComponents: readonly string[]
      activeFeatures: readonly string[]
    }
    expect([...module.activeComponents]).toEqual(bundle.meta.components)
    expect([...module.activeFeatures]).toEqual(bundle.meta.features)
  })
})

describe('特性接口与属性表', () => {
  it('core 只有 CoreProps，没有任何特性接口', () => {
    const core = bundleOf('core')
    expect(core.meta.features).toEqual([])
    for (const name of interfaceNames(core.types)) {
      expect(name, `core 里出现了特性接口 ${name}`).toMatch(/CoreProps$/)
    }
  })

  it('full 里每个「导出 × 选中特性」都生成一份接口，注释带该导出自己的标题与特性 id', () => {
    const bundle = bundleOf('full')
    const blocks = new Map<string, { title: string; id: string }>()
    for (const match of bundle.types.matchAll(/^\/\*\* (.+?)（([\w.-]+)） \*\/\nexport interface (\w+) \{/gm)) {
      blocks.set(match[3], { title: match[1], id: match[2] })
    }
    expect(blocks.size).toBeGreaterThan(150)

    let expected = 0
    for (const [componentId, featureIds] of Object.entries(bundle.meta.selection)) {
      for (const item of registry.components[componentId].exports) {
        for (const featureId of featureIds.filter((id) => id in (item.features ?? {}))) {
          const name = featureInterfaceName(item.name, featureId)
          const block = blocks.get(name)
          expect(block, `d.ts 缺接口 ${name}`).toBeTruthy()
          expect(block!.id, `${name} 注释里的特性 id 对不上`).toBe(featureId)
          // 同一个特性挂在同组件的两个导出上时标题可以不同（table.selection：Table 多选联动 / TableColumn 选择列配置）
          expect(block!.title, `${name} 的标题不是 ${item.name} 自己的`).toBe(item.features![featureId].title)
          expected += 1
        }
      }
    }
    expect(expected).toBeGreaterThan(150)

    // 反向：注释里出现的特性 id 必须都在选中清单内，不存在"类型里写了但没构建"的特性
    for (const { id } of blocks.values()) {
      expect(bundle.meta.features, `d.ts 引用了未选中的特性 ${id}`).toContain(id)
    }
  })

  it('特性接口的属性名与 spec.mjs 声明完全一致，且 Props 交集只包含选中的特性', () => {
    for (const bundle of profileNames.map(bundleOf)) {
      for (const [componentId, featureIds] of Object.entries(bundle.meta.selection)) {
        for (const item of registry.components[componentId].exports) {
          const selected = featureIds.filter((id) => id in (item.features ?? {}))
          const propsLine = bundle.types.match(new RegExp(`^export type ${item.name}Props = (.+)$`, 'm'))
          expect(propsLine, `${bundle.profile} 缺 ${item.name}Props`).toBeTruthy()
          expect(propsLine![1].split(' & ')).toEqual([
            `${item.name}CoreProps`,
            ...selected.map((id) => featureInterfaceName(item.name, id))
          ])

          const coreMembers = interfaceMembers(bundle.types, `${item.name}CoreProps`)
          expect(coreMembers, `${bundle.profile} 缺 ${item.name}CoreProps`).toBeTruthy()
          expect(coreMembers).toEqual(item.coreProps.map((prop) => prop.name))

          for (const featureId of selected) {
            const feature = item.features?.[featureId]
            const name = featureInterfaceName(item.name, featureId)
            const members = interfaceMembers(bundle.types, name)
            expect(members, `${bundle.profile} 缺接口 ${name}`).toBeTruthy()
            expect(members, `${name} 的属性表与 spec 不一致`).toEqual((feature?.props ?? []).map((prop) => prop.name))
          }
        }
      }
    }
  })

  it('Methods 类型只收选中特性的方法，方法名不重复', () => {
    const bundle = bundleOf('full')
    let checked = 0
    for (const [componentId, featureIds] of Object.entries(bundle.meta.selection)) {
      for (const item of registry.components[componentId].exports) {
        const methods: Array<{ name: string; signature: string }> = []
        const seen = new Set<string>()
        for (const featureId of featureIds.filter((id) => id in (item.features ?? {}))) {
          for (const method of item.features?.[featureId]?.methods ?? []) {
            if (seen.has(method.name)) {
              continue
            }
            seen.add(method.name)
            methods.push(method)
          }
        }
        if (!methods.length) {
          expect(bundle.types.includes(`export type ${item.name}Methods = {`), `${item.name} 不该有 Methods`).toBe(
            false
          )
          continue
        }
        const block = bundle.types.match(new RegExp(`export type ${item.name}Methods = \\{([\\s\\S]*?)\\n\\}`))
        expect(block, `缺 ${item.name}Methods`).toBeTruthy()
        const names = [...block![1].matchAll(/^ {2}(?:"([^"]+)"|([A-Za-z_$][\w$]*)): /gm)].map((m) => m[1] ?? m[2])
        expect(names).toEqual(methods.map((method) => method.name))
        for (const method of methods) {
          expect(block![1], `${item.name}.${method.name} 的签名没落到 d.ts`).toContain(method.signature)
        }
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})

describe('图标网关的类型开关', () => {
  const probeDir = '.tmp/types-probe'
  let probe: { types: string; components: string[]; features: string[] } | null = null

  beforeAll(async () => {
    const { buildProfile } = (await import('../../scripts/build-lib.mjs')) as {
      buildProfile: (config: any) => Promise<any>
    }
    const result = await buildProfile({
      name: 'types-probe',
      prefix: 'ui',
      components: { button: ['button.icon'] },
      outDir: probeDir,
      logLevel: 'silent'
    })
    probe = {
      types: fs.readFileSync(path.join(repoRoot, probeDir, 'index.d.ts'), 'utf8'),
      components: result.components,
      features: result.features
    }
  })

  afterAll(() => {
    fs.rmSync(path.join(repoRoot, probeDir), { recursive: true, force: true })
    fs.rmSync(path.join(repoRoot, '.build', 'types-probe'), { recursive: true, force: true })
  })

  it('探针只装了 button + button.icon', () => {
    expect(probe, '探针构建未产出类型文件').toBeTruthy()
    expect(probe!.components).toEqual(['button'])
    expect(probe!.features).toEqual(['button.icon'])
  })

  it('没选 icon 时不导出 UI_ICONS / registerIcon / UiIconName', () => {
    for (const needle of [
      'UiIconName',
      'UI_ICONS',
      'registerIcon',
      'unregisterIcon',
      'resolveIcon',
      'DEFAULT_ICON_SIZE'
    ]) {
      expect(probe!.types, `探针 d.ts 里仍有 ${needle}`).not.toContain(needle)
    }
  })

  it('选了 icon 时网关与图标名单都在', () => {
    const types = bundleOf('full').types
    for (const needle of [
      'UiIconName',
      'UI_ICONS',
      'registerIcon',
      'unregisterIcon',
      'resolveIcon',
      'DEFAULT_ICON_SIZE',
      'DEFAULT_ICON_STROKE_WIDTH'
    ]) {
      expect(types, `full d.ts 缺 ${needle}`).toContain(needle)
    }
  })

  it('vue 类型导入按用到才引入：名单与用法一致，且每一项都真的出现在类型里', () => {
    const usesType = (body: string, name: string) =>
      new RegExp(`(^|[^A-Za-z0-9_$])${name}([^A-Za-z0-9_$]|$)`).test(body)

    for (const types of [probe!.types, bundleOf('full').types]) {
      const importLine = types.match(/^import type \{([^}]*)\} from 'vue'/m)
      expect(importLine, '缺 vue 类型导入').toBeTruthy()
      const names = importLine![1]
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      const body = types.replace(importLine![0], '')
      expect(names).toEqual([
        'ComponentOptionsMixin',
        ...(usesType(body, 'Component') ? ['Component'] : []),
        'ComponentPublicInstance',
        'DefineComponent'
      ])
      for (const name of names) {
        expect(usesType(body, name), `导入了 ${name} 却没用到`).toBe(true)
      }
    }
  })

  it('button.icon 只给 Button 生成图标接口，不牵进其他组件', () => {
    expect(probe!.types).toContain('export interface ButtonIconProps')
    expect(declaredComponents(probe!.types)).toEqual(['Button', 'ButtonGroup'])
    // ButtonGroup 自己没声明 icon 特性，接口列表里不该出现它的特性接口
    expect(interfaceNames(probe!.types)).toEqual(['ButtonCoreProps', 'ButtonIconProps', 'ButtonGroupCoreProps'])
  })
})

describe('类型文件与源码同批', () => {
  it('d.ts 与 index.js 出自同一次构建：时间戳差在一个构建周期内', () => {
    const bundle: Bundle = bundleOf('full')
    const jsStat = fs.statSync(path.join(repoRoot, 'dist', 'full', 'ui-kit.js'))
    const dtsStat = fs.statSync(path.join(repoRoot, 'dist', 'full', 'index.d.ts'))
    expect(Math.abs(dtsStat.mtimeMs - jsStat.mtimeMs)).toBeLessThan(60_000)
    expect(bundle.types).toContain('export declare const Table')
  })

  it('dist 里没有 profile 目录之外的孤儿产物（构建目录改名要一起清理）', () => {
    // dist/custom/ 是构建器 UI 的自定义包命名空间，不属于 profile，但必须保留（F-68 / F-72）
    const dirs = fs
      .readdirSync(path.join(repoRoot, 'dist'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    expect(dirs).toEqual([...profileNames, 'custom'].sort())
    expect(readText('dist/full/package.json')).toContain('"module"')
  })
})
