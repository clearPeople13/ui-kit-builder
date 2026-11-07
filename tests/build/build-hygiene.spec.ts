import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { exists, featureEntries, loadTestRegistry, profileNames, readJson, repoRoot } from './_helpers'

type SizeKey = 'jsBytes' | 'cssBytes' | 'totalBytes' | 'gzipBytes'
type SizeRecord = Record<SizeKey, number>
const buildAllModule = (await import('../../scripts/build-all.mjs')) as {
  delta: (base: SizeRecord, target: SizeRecord) => SizeRecord
  staleDistDirs: (existingDirs: string[], reservedNames: Set<string>) => string[]
  sourceFingerprint: () => string
}
const { delta, sourceFingerprint, staleDistDirs } = buildAllModule

/**
 * 构建流水线自身的卫生契约。
 *
 * build:all 除了 20 份正式 profile，还要为 178 个特性各试算一次「full 减去该特性」。
 * 这些试算产物只是体积测量脚手架，用例守住五件事：
 * 1. dist/ 只留 20 份可安装的 profile 与 `custom/` 命名空间，其余陈旧目录构建后必须消失；
 * 2. 试算目录与 `.build/feat-*` 入口目录在构建结束后必须清空；
 * 3. 特性边际结果全部落到 sizes.json，且保留真实符号（负值不许夹成 0）；
 * 4. 内容哈希缓存与 sizes.json 的记录完全一致，下一次构建才能安全跳过试算；
 * 5. 构建指纹与当前源码一致，verify:reuse 才不会把旧产物当成本次产物。
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
  it('20 份 profile 都在 dist/ 里，且没有试算残留', () => {
    const dirs = fs
      .readdirSync(path.join(repoRoot, 'dist'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
    for (const name of profileNames) {
      expect(dirs, `缺少 ${name} 产物`).toContain(name)
    }
    // 构建器 UI 的自定义包只允许留在 dist/custom/，试算脚手架与陈旧 profile 都不许留
    expect(dirs.filter((name) => name.startsWith('feat-'))).toEqual([])
    const unexpected = dirs.filter((name) => name !== 'custom' && !profileNames.includes(name))
    expect(unexpected, `dist/ 出现不在 profile 清单里的目录: ${unexpected.join(', ')}`).toEqual([])
  })

  it('A5：陈旧目录判定保留 custom/，只挑出清单外的目录', () => {
    const stale = staleDistDirs(['core', 'full', 'custom', 'feat-demo', 'legacy'], new Set(['core', 'full']))
    expect(stale).toEqual(['feat-demo', 'legacy'])
  })

  it('A6：delta 保留真实符号，负值不夹成 0', () => {
    const base = { jsBytes: 100, cssBytes: 20, totalBytes: 120, gzipBytes: 40 }
    expect(delta(base, { jsBytes: 98, cssBytes: 20, totalBytes: 118, gzipBytes: 40 })).toEqual({
      jsBytes: -2,
      cssBytes: 0,
      totalBytes: -2,
      gzipBytes: 0
    })
    expect(delta(base, { jsBytes: 110, cssBytes: 24, totalBytes: 134, gzipBytes: 44 })).toEqual({
      jsBytes: 10,
      cssBytes: 4,
      totalBytes: 14,
      gzipBytes: 4
    })
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

  it('每条边际都是带符号整数，且能给出真实的体积信号', async () => {
    const registry = await loadTestRegistry()
    const componentOf = new Map(featureEntries(registry).map((entry) => [entry.id, entry.componentId]))
    let positive = 0
    for (const [id, feature] of Object.entries(sizes.features)) {
      expect(feature.component, `${id} 的组件归属`).toBe(componentOf.get(id))
      expect(typeof feature.title, `${id} 的标题`).toBe('string')
      for (const key of ['jsBytes', 'cssBytes', 'totalBytes', 'gzipBytes'] as const) {
        expect(Number.isInteger(feature[key]), `${id}.${key} 应为整数`).toBe(true)
      }
      if (feature.totalBytes > 0) {
        positive += 1
      }
    }
    // 全是 0 说明试算没有真正生效（F-27 的复发形态）
    expect(positive).toBeGreaterThan(100)
  })

  it('A4：构建指纹已落盘，且与当前源码一致', () => {
    const fingerprintFile = path.join(repoRoot, '.build/build-fingerprint.json')
    expect(fs.existsSync(fingerprintFile), 'build:all 应写出 .build/build-fingerprint.json').toBe(true)
    const record = JSON.parse(fs.readFileSync(fingerprintFile, 'utf8')) as { fingerprint: string }
    expect(record.fingerprint).toMatch(/^[0-9a-f]{40}$/)
    // 不一致说明产物不是当前源码构建出来的，verify:reuse 必须重建而不是复用
    expect(record.fingerprint).toBe(sourceFingerprint())
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

describe('特性边际与 profile 产物缓存（A10 / C2）', () => {
  const cacheFile = path.join(repoRoot, '.build/feature-size-cache.json')
  const profileCacheFile = path.join(repoRoot, '.build/profile-cache.json')
  // UIKIT_NO_BUILD_CACHE=1 是调试开关，只在显式关掉缓存时跳过这组断言
  const enabled = process.env.UIKIT_NO_BUILD_CACHE !== '1'

  it.skipIf(!enabled)('缓存 v2 按组件记录 sha1，合并后与本次 sizes.json 完全一致', () => {
    expect(fs.existsSync(cacheFile), 'build:all 应写出 .build/feature-size-cache.json').toBe(true)
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as {
      version: number
      components: Record<string, { fingerprint: string; features: Record<string, unknown> }>
    }
    expect(cache.version).toBe(2)
    const merged = Object.assign({}, ...Object.values(cache.components).map((entry) => entry.features))
    for (const [id, entry] of Object.entries(cache.components)) {
      expect(entry.fingerprint, `${id} 的组件指纹`).toMatch(/^[0-9a-f]{40}$/)
    }
    expect(merged).toEqual(sizes.features)
  })

  it.skipIf(!enabled)('profile 缓存覆盖 20 份产物，指纹是 sha1', () => {
    expect(fs.existsSync(profileCacheFile), 'build:all 应写出 .build/profile-cache.json').toBe(true)
    const cache = JSON.parse(fs.readFileSync(profileCacheFile, 'utf8')) as {
      version: number
      profiles: Record<string, { fingerprint: string }>
    }
    expect(cache.version).toBe(1)
    expect(Object.keys(cache.profiles).sort()).toEqual([...profileNames].sort())
    for (const [name, entry] of Object.entries(cache.profiles)) {
      expect(entry.fingerprint, `${name} 的 profile 指纹`).toMatch(/^[0-9a-f]{40}$/)
    }
  })
})
