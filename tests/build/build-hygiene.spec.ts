import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { exists, featureEntries, loadTestRegistry, profileNames, readJson, repoRoot } from './_helpers'

/**
 * 构建流水线自身的卫生契约。
 *
 * build:all 除了 20 份正式 profile，还要为 178 个特性各试算一次「full 减去该特性」。
 * 这些试算产物只是体积测量脚手架，用例守住四件事：
 * 1. dist/ 只留 20 份可安装的 profile，试算产物不许混进来；
 * 2. 试算目录与 `.build/feat-*` 入口目录在构建结束后必须清空；
 * 3. 特性边际结果全部落到 sizes.json，且是真实的非负增量；
 * 4. 内容哈希缓存与 sizes.json 的记录完全一致，下一次构建才能安全跳过试算。
 */

const sizes = readJson('sizes.json') as {
  generatedAt: string
  profiles: Record<string, { name: string; dir: string }>
  features: Record<
    string,
    { title: string; component: string; jsBytes: number; cssBytes: number; totalBytes: number; gzipBytes: number }
  >
}

describe('构建产物目录的卫生边界', () => {
  it('dist/ 恰好是 profiles/ 里的 20 份 profile，没有试算残留', () => {
    const dirs = fs
      .readdirSync(path.join(repoRoot, 'dist'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    expect(dirs).toEqual([...profileNames].sort())
    expect(dirs.filter((name) => name.startsWith('feat-'))).toEqual([])
  })

  it('试算脚手架在构建结束后被清理', () => {
    expect(exists('.build/feature-deltas')).toBe(false)
    const stale = fs
      .readdirSync(path.join(repoRoot, '.build'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('feat-'))
      .map((entry) => entry.name)
    expect(stale).toEqual([])
  })
})

describe('特性边际体积的完整性', () => {
  it('sizes.json 覆盖注册表里的每一个特性', async () => {
    const registry = await loadTestRegistry()
    const expected = featureEntries(registry)
      .map((entry) => entry.id)
      .sort()
    expect(Object.keys(sizes.features).sort()).toEqual(expected)
  })

  it('每条边际都是非负整数，且能给出真实的体积信号', async () => {
    const registry = await loadTestRegistry()
    const componentOf = new Map(featureEntries(registry).map((entry) => [entry.id, entry.componentId]))
    let positive = 0
    for (const [id, feature] of Object.entries(sizes.features)) {
      expect(feature.component, `${id} 的组件归属`).toBe(componentOf.get(id))
      expect(typeof feature.title, `${id} 的标题`).toBe('string')
      for (const key of ['jsBytes', 'cssBytes', 'totalBytes', 'gzipBytes'] as const) {
        expect(Number.isInteger(feature[key]), `${id}.${key} 应为整数`).toBe(true)
        expect(feature[key], `${id}.${key} 不应为负`).toBeGreaterThanOrEqual(0)
      }
      if (feature.totalBytes > 0) {
        positive += 1
      }
    }
    // 全是 0 说明试算没有真正生效（F-27 的复发形态）
    expect(positive).toBeGreaterThan(100)
  })

  it('sizes.json 与 20 份 profile 的元数据一一对应', () => {
    expect(Object.keys(sizes.profiles).sort()).toEqual([...profileNames].sort())
    for (const profile of profileNames) {
      expect(sizes.profiles[profile].name).toBe(profile)
      expect(exists(`${sizes.profiles[profile].dir}/ui-kit.js`)).toBe(true)
      expect(exists(`${sizes.profiles[profile].dir}/meta.json`)).toBe(true)
    }
  })
})

describe('特性边际的内容哈希缓存', () => {
  const cacheFile = path.join(repoRoot, '.build/feature-size-cache.json')
  // UIKIT_NO_BUILD_CACHE=1 是调试开关，只在显式关掉缓存时跳过这组断言
  const enabled = process.env.UIKIT_NO_BUILD_CACHE !== '1'

  it.skipIf(!enabled)('缓存指纹是源码内容的 sha1，且与本次 sizes.json 完全一致', () => {
    expect(fs.existsSync(cacheFile), 'build:all 应写出 .build/feature-size-cache.json').toBe(true)
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as {
      fingerprint: string
      features: Record<string, unknown>
    }
    expect(cache.fingerprint).toMatch(/^[0-9a-f]{40}$/)
    expect(cache.features).toEqual(sizes.features)
  })
})
