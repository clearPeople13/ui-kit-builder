import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { loadProfile, profileNames, type Profile } from './_load'

/**
 * 属性字典双向守卫：把一次性审计（运行时真实生效的 props 必须出现在它真正所属的
 * export 的 props 里，字典里声明的 props 运行时也必须存在）固化成常驻用例。
 *
 * 校验口径与 dist 产物逐一对齐，且要能穿越 20 份不同特性集的 profile，所以是
 * 混合式静态 + 运行时断言（不引入任何几何/布局断言）：
 *   - 正向（未记录）：产物上真实存在的每个运行时 prop，都必须能在该 export 的
 *     属性字典里找到——coreProps 加上"本 profile 已启用特性"的 props。命中即
 *     "漏项/挂错 export/把 core prop 记到了某个特性名下"。
 *   - 反向（未实现）：字典里在当前 profile 生效范围内声明的每个 prop——coreProps
 *     加上"本 profile 已启用特性"的 props——都必须在运行时真实存在。命中即字典虚报。
 *
 * 两个方向口径必须完全一致：正向若放宽成"任意 feature 声明皆算记录"，被关掉的
 * 特性就能替 core prop 背书（如 Tree 的 checkStrictly 曾只记在 selection 特性上），
 * core 产物里它一旦丢了也没人发现。归属错了就是错了，字典按导出名就近查找。
 */

const componentsRoot = resolve(process.cwd(), 'packages/ui-kit/src/components')

type SpecProp = { name: string }
type SpecFeature = { id?: string; props?: SpecProp[]; coreProps?: SpecProp[] }
type SpecExport = {
  name: string
  coreProps?: SpecProp[]
  features?: Record<string, SpecFeature> | SpecFeature[]
}
type Spec = { id: string; exports?: SpecExport[] }

const IGNORED_RUNTIME_PROPS = new Set(['class', 'style'])

function featureEntries(features: SpecExport['features']): Array<[string, SpecFeature]> {
  if (!features) {
    return []
  }
  if (Array.isArray(features)) {
    return features.map((f, i) => [f?.id ?? String(i), f] as [string, SpecFeature])
  }
  return Object.entries(features)
}

function runtimePropsOf(component: any): Record<string, unknown> | null {
  if (!component) {
    return null
  }
  const props = component.props ?? component.__vccOpts?.props
  return props && typeof props === 'object' ? (props as Record<string, unknown>) : null
}

async function loadSpecs(): Promise<Spec[]> {
  const specs: Spec[] = []
  for (const id of readdirSync(componentsRoot)) {
    const specFile = resolve(componentsRoot, id, 'spec.mjs')
    if (!existsSync(specFile)) {
      continue
    }
    const mod = (await import(pathToFileURL(specFile).href)) as { default?: Spec }
    if (mod.default?.exports) {
      specs.push({ ...mod.default, id })
    }
  }
  return specs
}

const specsPromise = loadSpecs()

const profiles = profileNames()

describe.each(profiles)('产物 %s 的属性字典双向一致', (name) => {
  let profile: Profile
  let specs: Spec[]

  beforeAll(async () => {
    profile = await loadProfile(name)
    specs = await specsPromise
  })

  it('运行时真实生效的 prop 都被记录在所属 export 的属性字典里', () => {
    const undocumented: string[] = []
    for (const spec of specs) {
      // 与反向同一口径：只有本 profile 已启用的特性才能替这里的 prop 背书
      const enabled = new Set(profile.components[spec.id] ?? [])
      for (const ex of spec.exports ?? []) {
        const runtime = runtimePropsOf(profile.module[ex.name])
        if (!runtime) {
          continue
        }
        const declared = new Set((ex.coreProps ?? []).map((p) => p.name))
        for (const [featureKey, feature] of featureEntries(ex.features)) {
          if (!enabled.has(featureKey)) {
            continue
          }
          for (const p of feature?.props ?? feature?.coreProps ?? []) {
            declared.add(p.name)
          }
        }
        for (const key of Object.keys(runtime)) {
          if (IGNORED_RUNTIME_PROPS.has(key)) {
            continue
          }
          if (!declared.has(key)) {
            undocumented.push(`${spec.id}/${ex.name} :: ${key}`)
          }
        }
      }
    }
    expect(undocumented, `${name} 有 ${undocumented.length} 个运行时 prop 未被属性字典记录`).toEqual([])
  })

  it('属性字典声明的 prop 在运行时都真实存在', () => {
    const unimplemented: string[] = []
    for (const spec of specs) {
      // profile.components[目录名] 即这份产物启用的特性 id 列表
      const enabled = new Set(profile.components[spec.id] ?? [])
      for (const ex of spec.exports ?? []) {
        const runtime = runtimePropsOf(profile.module[ex.name])
        if (!runtime) {
          continue
        }
        const required = new Set((ex.coreProps ?? []).map((p) => p.name))
        for (const [featureKey, feature] of featureEntries(ex.features)) {
          if (!enabled.has(featureKey)) {
            continue
          }
          for (const p of feature?.props ?? feature?.coreProps ?? []) {
            required.add(p.name)
          }
        }
        for (const propName of required) {
          if (IGNORED_RUNTIME_PROPS.has(propName)) {
            continue
          }
          if (!(propName in runtime)) {
            unimplemented.push(`${spec.id}/${ex.name} :: ${propName}`)
          }
        }
      }
    }
    expect(unimplemented, `${name} 有 ${unimplemented.length} 个字典声明的 prop 运行时并不存在`).toEqual([])
  })
})

it('全部 profile 与含属性字典的组件都纳入守卫', async () => {
  const specs = await specsPromise
  expect(profiles.length).toBeGreaterThanOrEqual(20)
  expect(profiles).toContain('full')
  expect(profiles).toContain('core')
  expect(specs.length).toBeGreaterThan(0)
  // 本轮审计的两个主角必须在覆盖范围内，否则守卫形同虚设
  expect(specs.map((s) => s.id)).toEqual(expect.arrayContaining(['table', 'tree']))
})
