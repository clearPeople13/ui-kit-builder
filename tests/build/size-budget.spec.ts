import { describe, expect, it } from 'vitest'
import { allBundles, bundleOf, featureEntries, loadTestRegistry, profileNames, readJson } from './_helpers'

/**
 * 体积门禁。
 *
 * 阈值取自当前实测值再加约一成余量：低于下限说明裁剪把有用的东西裁掉了，
 * 高于上限说明有人往 core/full 里塞了不该塞的默认依赖。
 * 需要放宽时改这张表，并确认涨幅来自哪次功能。
 */

const BUDGETS = {
  core: { jsBytes: 620_000, cssBytes: 260_000, gzipBytes: 185_000 },
  full: { jsBytes: 700_000, cssBytes: 285_000, gzipBytes: 205_000 },
  theme: { cssGrowth: 1.25, totalGrowth: 1.12, gzipBytes: 210_000 }
}

const registry = await loadTestRegistry()
const sizes = readJson<{ generatedAt: string; profiles: Record<string, any>; features: Record<string, any> }>(
  'sizes.json'
)

describe('体积预算', () => {
  it('core 与 full 不超过预算', () => {
    for (const name of ['core', 'full'] as const) {
      const meta = bundleOf(name).meta
      for (const key of Object.keys(BUDGETS[name]) as Array<keyof (typeof BUDGETS)[typeof name]>) {
        expect(meta[key], `${name}.${key}=${meta[key]} 超预算`).toBeLessThanOrEqual(BUDGETS[name][key])
      }
    }
  })

  it('18 份主题的 CSS 与总量相对 full 的增幅在预算内', () => {
    const full = bundleOf('full').meta
    const themes = profileNames.filter((name) => name !== 'core' && name !== 'full')
    expect(themes.length).toBe(18)
    for (const name of themes) {
      const meta = bundleOf(name).meta
      expect(meta.cssBytes, `${name} CSS 增幅`).toBeLessThanOrEqual(Math.round(full.cssBytes * BUDGETS.theme.cssGrowth))
      expect(meta.totalBytes, `${name} 总量增幅`).toBeLessThanOrEqual(
        Math.round(full.totalBytes * BUDGETS.theme.totalGrowth)
      )
      expect(meta.gzipBytes, `${name} gzip`).toBeLessThanOrEqual(BUDGETS.theme.gzipBytes)
    }
  })

  it('core 是最小产物，其余 profile 都不小于它', () => {
    const core = bundleOf('core').meta
    for (const bundle of allBundles()) {
      if (bundle.profile === 'core') {
        continue
      }
      expect(bundle.meta.jsBytes).toBeGreaterThan(core.jsBytes)
      expect(bundle.meta.totalBytes).toBeGreaterThan(core.totalBytes)
      expect(bundle.meta.gzipBytes).toBeGreaterThan(core.gzipBytes)
    }
  })

  it('开满 178 个特性带来的增量落在可接受区间', () => {
    const core = bundleOf('core').meta
    const full = bundleOf('full').meta
    const jsDelta = full.jsBytes - core.jsBytes
    const cssDelta = full.cssBytes - core.cssBytes
    expect(featureEntries(registry).length).toBe(178)
    // 实测：js +78.9 kB、css +19.4 kB；特性翻倍时不至于失控，也不至于什么都没带
    expect(jsDelta).toBeGreaterThan(60_000)
    expect(jsDelta).toBeLessThan(core.jsBytes * 0.2)
    expect(cssDelta).toBeGreaterThan(10_000)
    expect(cssDelta).toBeLessThan(core.cssBytes * 0.2)
  })

  it('同特性集下前缀越长体积越大，主题之间的差异只来自前缀与皮肤', () => {
    const themed = allBundles().filter(
      (bundle) => bundle.meta.features.length === bundleOf('full').meta.features.length
    )
    const ui = bundleOf('full').meta
    for (const bundle of themed) {
      if (bundle.prefix !== 'ui') {
        expect(bundle.meta.jsBytes, `${bundle.profile} 应不小于 ui 前缀的同特性产物`).toBeGreaterThanOrEqual(ui.jsBytes)
      }
    }
    const lengths = themed.filter((bundle) => bundle.prefix !== 'ui')
    const spread =
      Math.max(...lengths.map((bundle) => bundle.meta.jsBytes)) -
      Math.min(...lengths.map((bundle) => bundle.meta.jsBytes))
    // 20 字符以内的前缀差异不应该让包体抖动超过 2%
    expect(spread).toBeLessThan(ui.jsBytes * 0.02)
    const longest = lengths.reduce((left, right) => (left.prefix.length >= right.prefix.length ? left : right))
    const shortest = lengths.reduce((left, right) => (left.prefix.length <= right.prefix.length ? left : right))
    expect(longest.meta.jsBytes).toBeGreaterThanOrEqual(shortest.meta.jsBytes)
  })
})

describe('sizes.json 的成本表', () => {
  it('profiles 段覆盖全部 profile 且与 meta 同步', () => {
    expect(Object.keys(sizes.profiles).sort()).toEqual(profileNames)
    expect(typeof sizes.generatedAt).toBe('string')
    expect(Number.isNaN(Date.parse(sizes.generatedAt))).toBe(false)
  })

  it('features 段恰好等于"能用现有 profile 对测出增量"的特性集合', () => {
    // 增量靠两份只差一个特性的 profile 相减得到；当前 20 份 profile 里没有任何这样的成对关系，
    // 所以这张表是空的（构建器里的单特性成本列没有数据，记为 F-27）。
    // 这条用例把算法钉住：一旦有人补了成对 profile，表里就必须真的出现对应条目。
    const measurable = measurableFeatureCosts()
    expect(Object.keys(sizes.features).sort()).toEqual(measurable.sort())
    for (const [id, delta] of Object.entries(sizes.features)) {
      expect(delta.component, id).toBeTruthy()
      expect(delta.jsBytes, `${id} js 增量`).toBeGreaterThanOrEqual(0)
      expect(delta.cssBytes, `${id} css 增量`).toBeGreaterThanOrEqual(0)
    }
  })
})

/** 复算 build-all 的配对条件：存在两份 profile，特性集正好是 requires 与 requires+id */
function measurableFeatureCosts() {
  const profiles = profileNames.map((name) => bundleOf(name).meta)
  const sameSet = (left: string[], right: string[]) =>
    left.length === right.length && left.every((value) => right.includes(value))
  const hits: string[] = []
  for (const entry of featureEntries(registry)) {
    const requires = entry.spec.requires ?? []
    const base = profiles.find((profile) => sameSet(profile.features, requires))
    const target = profiles.find((profile) => sameSet(profile.features, [...requires, entry.id]))
    if (base && target) {
      hits.push(entry.id)
    }
  }
  return hits
}
