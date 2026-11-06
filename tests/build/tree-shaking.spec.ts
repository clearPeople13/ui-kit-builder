import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  allBundles,
  bundleOf,
  featureEntries,
  inBundle,
  loadTestRegistry,
  markerHits,
  ownElementSelector,
  repoRoot,
  resolveFeatureMarkers
} from './_helpers'

/**
 * 特性裁剪是否真的生效。
 *
 * 两条互补的证据链：
 * 1. 生成入口 `.build/<profile>/entry.ts` 只 import 被选中的特性模块——管"有没有多带源码"
 * 2. 产物文本里逐个特性的独有字面量只在选中它的 profile 出现——管"代码是否真被打进包"
 * 再用一次临时自定义 profile 构建，覆盖 shipped profile 里不存在的"按组件裁剪"场景。
 */

const registry = await loadTestRegistry()
const markers = resolveFeatureMarkers(registry)

describe('入口文件的特性引用', () => {
  it('entry.ts 的特性 import 恰好等于被选中的特性模块，且没有重复行', () => {
    const moduleOfId = new Map(featureEntries(registry).map((entry) => [entry.id, normalizeModule(entry.spec.module)]))
    for (const bundle of allBundles()) {
      const lines = bundle.entry.split('\n')
      const duplicated = lines.filter((line, index) => line.startsWith('import') && lines.indexOf(line) !== index)
      expect(duplicated, `${bundle.profile} entry.ts 有重复 import`).toEqual([])

      const imported = [
        ...new Set(
          [...bundle.entry.matchAll(/import \{ \w+ \} from '([^']*\/features\/[^']+)'/g)].map((match) =>
            normalizeModule(match[1])
          )
        )
      ]
      const expected = [...new Set(bundle.meta.features.map((id: string) => moduleOfId.get(id)).filter(Boolean))]
      expect(imported.sort(), `${bundle.profile} 多带或未带特性模块`).toEqual(expected.sort())
    }
  })

  it('core 的入口不引入任何特性模块，full 引入全部 178 个', () => {
    expect([...bundleOf('core').entry.matchAll(/\/features\//g)]).toEqual([])
    const fullModules = [
      ...new Set(
        [...bundleOf('full').entry.matchAll(/import \{ \w+ \} from '([^']*\/features\/[^']+)'/g)].map((m) => m[1])
      )
    ]
    expect(fullModules.length).toBe(featureEntries(registry).length)
    expect(bundleOf('full').meta.features.length).toBe(featureEntries(registry).length)
  })
})

/** 入口里的相对 import 统一成从仓库根算起的路径，便于与 spec 声明的模块路径比对 */
function normalizeModule(specifier: string) {
  let value = specifier
  while (value.startsWith('../')) {
    value = value.slice(3)
  }
  while (value.startsWith('./')) {
    value = value.slice(2)
  }
  return value
}

describe('产物文本与特性选择一致', () => {
  it('每个可标记特性只出现在选中它的 profile 里', () => {
    const bundles = allBundles()
    for (const marker of markers.marked) {
      for (const bundle of bundles) {
        const selected = bundle.meta.features.includes(marker.id)
        expect(markerHits(marker, bundle.profile), `${marker.id} 标记 ${marker.marker} 在 ${bundle.profile}`).toBe(
          selected
        )
      }
    }
  })

  it('core 产物里找不到任何特性标记', () => {
    const core = bundleOf('core')
    for (const marker of markers.marked) {
      expect(core.css.includes(marker.marker), `core css 不应有 ${marker.marker}`).toBe(false)
      expect(core.js.includes(marker.marker), `core js 不应有 ${marker.marker}`).toBe(false)
    }
  })

  it('主题 profile 的标记按自己的前缀改写后才命中', () => {
    const themed = allBundles().filter((bundle) => bundle.prefix !== 'ui')
    const cssMarkers = markers.marked.filter((marker) => marker.kind === 'css')
    expect(cssMarkers.length).toBeGreaterThan(0)
    for (const bundle of themed) {
      const hit = cssMarkers
        .filter((marker) => marker.marker.startsWith('ui-'))
        .every((marker) => inBundle(marker.marker, bundle.profile))
      expect(hit, `${bundle.profile} 未做前缀改写`).toBe(true)
      // 原始 ui- 文本不该再出现在换前缀的产物里
      expect(
        bundle.css.includes('.ui-button--gradient') || bundle.css.includes('.ui-table__resizer'),
        `${bundle.profile} 残留 ui- 类名`
      ).toBe(false)
    }
  })

  it('无可标记字面量的特性清单保持稳定', () => {
    expect(markers.unmarked.sort()).toMatchSnapshot()
    expect(markers.marked.length + markers.unmarked.length).toBe(featureEntries(registry).length)
  })
})

describe('按组件裁剪的临时 profile', () => {
  const probeDir = '.tmp/shake-probe'
  let result: any = null

  beforeAll(async () => {
    const { buildProfile } = (await import('../../scripts/build-lib.mjs')) as {
      buildProfile: (config: any) => Promise<any>
    }
    result = await buildProfile({
      name: 'shake-probe',
      prefix: 'shake',
      components: { button: ['button.icon'], input: ['input.clearable'], table: [] },
      outDir: probeDir,
      logLevel: 'silent'
    })
  })

  afterAll(() => {
    fs.rmSync(path.join(repoRoot, probeDir), { recursive: true, force: true })
    fs.rmSync(path.join(repoRoot, '.build', 'shake-probe'), { recursive: true, force: true })
  })

  it('只打包三个组件，未选中的组件代码完全不出现', () => {
    expect(result.components.sort()).toEqual(['button', 'input', 'table'])
    expect(result.features).toEqual(['button.icon', 'input.clearable'])
    expect(result.prefix).toBe('shake')
    const css = fs.readFileSync(path.join(repoRoot, probeDir, 'ui-kit.css'), 'utf8')
    const js = fs.readFileSync(path.join(repoRoot, probeDir, 'ui-kit.js'), 'utf8')
    for (const id of ['dialog', 'carousel', 'color-picker', 'tree-select']) {
      // shared/floating.css 之类的共享规则会点名未选中组件的类，因此按"组件私有元素选择器 + 工厂函数"判定
      const own = ownElementSelector(id)
      expect(own, `${id} 没有可判定的私有选择器`).toBeTruthy()
      expect(css.includes(`.shake-${own!.slice('.ui-'.length)}`), `css 混入了 ${id} 的私有样式`).toBe(false)
      expect(js.includes(`create${id}`), `js 混入了 ${id}`).toBe(false)
    }
  })

  it('裁剪后的体积明显小于 core', () => {
    const core = bundleOf('core').meta
    expect(result.totalBytes).toBeLessThan(core.totalBytes)
    expect(result.gzipBytes).toBeLessThan(core.gzipBytes)
  })

  it('自定义前缀在 js 与 css 里同步改写', () => {
    const js = fs.readFileSync(path.join(repoRoot, probeDir, 'ui-kit.js'), 'utf8')
    const css = fs.readFileSync(path.join(repoRoot, probeDir, 'ui-kit.css'), 'utf8')
    expect(css.includes('.shake-button')).toBe(true)
    expect(css.includes('--shake-button-height')).toBe(true)
    expect(js.includes('shake-button')).toBe(true)
    // 改写后不应再残留 ui- 组件类名（--ui-* 兜底引用除外，构建器会一并改写）
    expect(css).not.toMatch(/\.ui-[a-z]/)
    expect(js).not.toContain('ui-button__')
  })
})
